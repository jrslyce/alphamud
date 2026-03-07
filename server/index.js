import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4000;

// Game State
const gameState = {
    teams: {
        alpha: { players: [], build: {}, sequence: [null, null, null, null, null] },
        omega: { players: [], build: {}, sequence: [null, null, null, null, null] }
    },
    status: 'lobby' // 'lobby', 'building', 'combat'
};

const matchHistory = []; // full match objects including logs, up to 50

io.on('connection', (socket) => {
    console.log(`[SYS] User connected: ${socket.id}`);

    socket.emit('gameState', gameState);
    socket.emit('matchHistory', matchHistory.map(m => ({ id: m.id, timestamp: m.timestamp, winner: m.winner })));


    socket.on('joinTeam', (team) => {
        if (gameState.teams[team] && !gameState.teams[team].players.includes(socket.id)) {
            gameState.teams[team].players.push(socket.id);
            socket.join(team);
            console.log(`[SYS] ${socket.id} joined ${team}`);
            io.emit('gameState', gameState);
        }
    });

    socket.on('updateBuild', ({ team, slot, itemId }) => {
        if (gameState.teams[team]) {
            gameState.teams[team].build[slot] = itemId;
            io.emit('gameState', gameState);
        }
    });

    socket.on('updateSequence', ({ team, idx, chipId }) => {
        if (gameState.teams[team]) {
            gameState.teams[team].sequence[idx] = chipId;
            io.emit('gameState', gameState);
        }
    });

    socket.on('setReady', ({ team }) => {
        if (gameState.teams[team]) {
            gameState.teams[team].ready = true;
            io.emit('gameState', gameState);
        }
    });

    socket.on('adminAutoFill', async () => {
        try {
            const { MANIFEST, CHIPS } = await import('../src/data/gameData.js');

            const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)].id;

            ['alpha', 'omega'].forEach(team => {
                gameState.teams[team].build = {
                    thruster: randomItem(MANIFEST.thrusters),
                    battery: randomItem(MANIFEST.batteries),
                    fcs: randomItem(MANIFEST.fcs),
                    core: randomItem(MANIFEST.cores),
                    armor: randomItem(MANIFEST.armor)
                };

                // 5 random moves
                gameState.teams[team].sequence = Array.from({ length: 5 }, () => randomItem(CHIPS));
                gameState.teams[team].ready = true;
            });

            gameState.status = 'lobby'; // Ensure we're in lobby before combat
            io.emit('gameState', gameState);

        } catch (err) {
            console.error('[SYS] AutoFill Error:', err);
        }
    });

    socket.on('adminResetSimulation', () => {
        gameState.teams.alpha.ready = false;
        gameState.teams.omega.ready = false;
        gameState.status = 'lobby';
        io.emit('gameState', gameState);
        io.emit('combatResult', null);
        console.log('[SYS] Admin manual reset triggered');
    });

    socket.on('adminStartSimulation', () => {
        if (gameState.teams.alpha.ready && gameState.teams.omega.ready) {
            gameState.status = 'combat';
            io.emit('gameState', gameState);

            // Dynamically import combat engine to avoid server restart issues
            import('./combatEngine.js').then(module => {
                const { runSimulation } = module;
                try {
                    const result = runSimulation(
                        gameState.teams.alpha.build, gameState.teams.alpha.sequence,
                        gameState.teams.omega.build, gameState.teams.omega.sequence
                    );

                    const r = Math.floor(Math.random() * 900) + 100;
                    const dateStr = new Date().toISOString().split('T')[0];
                    const matchId = `${r}-${dateStr}`;

                    const matchData = {
                        id: matchId,
                        timestamp: Date.now(),
                        winner: result.winner,
                        log: result.log,
                        alpha: { build: { ...gameState.teams.alpha.build }, sequence: [...gameState.teams.alpha.sequence] },
                        omega: { build: { ...gameState.teams.omega.build }, sequence: [...gameState.teams.omega.sequence] }
                    };

                    matchHistory.unshift(matchData);
                    if (matchHistory.length > 50) matchHistory.pop();

                    io.emit('combatResult', result);
                    io.emit('matchHistory', matchHistory.map(m => ({ id: m.id, timestamp: m.timestamp, winner: m.winner })));
                } catch (err) {
                    console.error('[SYS] Combat Engine Error:', err);
                }

                // Reset for next match after 15s
                setTimeout(() => {
                    gameState.teams.alpha.ready = false;
                    gameState.teams.omega.ready = false;
                    gameState.status = 'lobby';
                    io.emit('gameState', gameState);
                    // Do not emit null combatResult so admin telemetry stays up
                }, 15000);
            }).catch(err => {
                console.error('[SYS] Import Error:', err);
                gameState.teams.alpha.ready = false;
                gameState.teams.omega.ready = false;
                gameState.status = 'lobby';
                io.emit('gameState', gameState);
            });
        }
    });

    socket.on('disconnect', () => {
        console.log(`[SYS] User disconnected: ${socket.id}`);
        Object.keys(gameState.teams).forEach(team => {
            gameState.teams[team].players = gameState.teams[team].players.filter(id => id !== socket.id);
        });
        io.emit('gameState', gameState);
    });

    socket.on('getMatchDetails', (matchId) => {
        const fullMatch = matchHistory.find(m => m.id === matchId);
        if (fullMatch) {
            socket.emit('matchDetails', fullMatch);
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(`SFC Alpha MUD Server uplink active on port ${PORT}`);
});
