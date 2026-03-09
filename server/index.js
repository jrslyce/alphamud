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
    status: 'lobby', // 'lobby', 'building', 'combat'
    homeTeam: 'neutral', // 'alpha', 'omega', or 'neutral'
    pitStop: {
        active: false,
        alphaChoice: null,
        omegaChoice: null,
        resumeState: null
    }
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
                if (!gameState.teams[team].ready) {
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
                }
            });

            // Randomize home team on autofill
            gameState.homeTeam = Math.random() > 0.5 ? 'alpha' : 'omega';
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
        gameState.homeTeam = 'neutral';
        io.emit('gameState', gameState);
        io.emit('combatResult', null);
        console.log('[SYS] Admin manual reset triggered');
    });

    socket.on('adminSetHomeTeam', (team) => {
        gameState.homeTeam = team;
        io.emit('gameState', gameState);
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
                        gameState.teams.omega.build, gameState.teams.omega.sequence,
                        gameState.homeTeam
                    );

                    if (result.isPitStop) {
                        gameState.pitStop = {
                            active: true,
                            alphaChoice: null,
                            omegaChoice: null,
                            resumeState: result
                        };
                        io.emit('gameState', gameState);
                        io.emit('combatResult', result);
                        console.log('[SYS] Combat paused for Pit Stop');
                        return; // Wait for choices
                    }

                    completeSimulation(result);
                } catch (err) {
                    console.error('[SYS] Combat Engine Error:', err);
                }
            }).catch(err => {
                console.error('[SYS] Import Error:', err);
            });
        }
    });

    const completeSimulation = (result) => {
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

        // Reset for next match after 15s
        setTimeout(() => {
            gameState.teams.alpha.ready = false;
            gameState.teams.omega.ready = false;
            gameState.status = 'lobby';
            gameState.pitStop = { active: false, alphaChoice: null, omegaChoice: null, resumeState: null };
            io.emit('gameState', gameState);
        }, 15000);
    };

    socket.on('pilotPitStopChoice', ({ team, choice, isAdmin }) => {
        if (gameState.pitStop.active && (team === 'alpha' || team === 'omega')) {
            gameState.pitStop[`${team}Choice`] = choice;
            console.log(`[SYS] Pit Stop selection from ${team}: ${choice} (Admin: ${!!isAdmin})`);
            io.emit('gameState', gameState);

            if (isAdmin) {
                // Admin made a choice. Proceed only if BOTH are selected.
                // We won't auto-pick the remaining empty team instantly.
                if (gameState.pitStop.alphaChoice && gameState.pitStop.omegaChoice) {
                    resumeCombat();
                }
            } else {
                // Human player made a choice. Check if we should auto-fill others or proceed.
                checkPitStopCompletion();
            }
        }
    });

    const checkPitStopCompletion = () => {
        // Simple logic: if anyone hasn't picked, and they have no human players, auto-pick.
        // Or if both teams picked, proceed.
        const teams = ['alpha', 'omega'];
        teams.forEach(t => {
            if (!gameState.pitStop[`${t}Choice`] && (gameState.teams[t].players.length === 0)) {
                const choices = ['overclock', 'safety', 'defense'];
                gameState.pitStop[`${t}Choice`] = choices[Math.floor(Math.random() * choices.length)];
            }
        });

        if (gameState.pitStop.alphaChoice && gameState.pitStop.omegaChoice) {
            resumeCombat();
        }
    };

    const resumeCombat = () => {
        if (!gameState.pitStop.active) return;
        gameState.pitStop.active = false;
        io.emit('gameState', gameState);

        import('./combatEngine.js').then(module => {
            const { runSimulation } = module;
            const result = runSimulation(
                gameState.teams.alpha.build, gameState.teams.alpha.sequence,
                gameState.teams.omega.build, gameState.teams.omega.sequence,
                gameState.homeTeam,
                {
                    ...gameState.pitStop.resumeState,
                    alphaChoice: gameState.pitStop.alphaChoice,
                    omegaChoice: gameState.pitStop.omegaChoice
                }
            );
            completeSimulation(result);
        });
    };

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
