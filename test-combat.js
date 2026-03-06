import { io } from 'socket.io-client';

const alpha = io('http://localhost:4000');
const omega = io('http://localhost:4000');

let alphaConnected = false;
let omegaConnected = false;

console.log('Starting integration test...');

const checkStart = () => {
    if (alphaConnected && omegaConnected) {
        console.log('Both clients connected. Joining teams...');
        alpha.emit('joinTeam', 'alpha');
        omega.emit('joinTeam', 'omega');
    }
};

alpha.on('connect', () => { alphaConnected = true; checkStart(); });
omega.on('connect', () => { omegaConnected = true; checkStart(); });

let stateReceived = 0;
let adminTriggered = false; // New variable to prevent multiple triggers

alpha.on('gameState', (state) => {
    if (state.teams.alpha.players.includes(alpha.id) && stateReceived === 0) {
        stateReceived++;
        console.log('Alpha joined. Setting build...');

        // Thruster
        alpha.emit('updateBuild', { team: 'alpha', slot: 'thruster', itemId: 'T-800' });
        alpha.emit('updateBuild', { team: 'alpha', slot: 'battery', itemId: 'B-Volt' });
        alpha.emit('updateBuild', { team: 'alpha', slot: 'fcs', itemId: 'F-Hawk' });
        alpha.emit('updateBuild', { team: 'alpha', slot: 'core', itemId: 'C-Deep' });
        alpha.emit('updateBuild', { team: 'alpha', slot: 'armor', itemId: 'A-Slab' });

        for (let i = 0; i < 5; i++) {
            alpha.emit('updateSequence', { team: 'alpha', idx: i, chipId: 'CH-Jab' });
        }

        console.log('Alpha build set. Locking in...');
        setTimeout(() => alpha.emit('setReady', { team: 'alpha' }), 500);
    }
});

omega.on('gameState', (state) => {
    if (state.teams.omega.players.includes(omega.id) && stateReceived === 1) {
        stateReceived++;
        console.log('Omega joined. Setting build...');

        omega.emit('updateBuild', { team: 'omega', slot: 'thruster', itemId: 'T-Nova' });
        omega.emit('updateBuild', { team: 'omega', slot: 'battery', itemId: 'B-Zero' });
        omega.emit('updateBuild', { team: 'omega', slot: 'fcs', itemId: 'F-Snpr' });
        omega.emit('updateBuild', { team: 'omega', slot: 'core', itemId: 'C-Qunt' });
        omega.emit('updateBuild', { team: 'omega', slot: 'armor', itemId: 'A-Apex' });

        for (let i = 0; i < 5; i++) {
            omega.emit('updateSequence', { team: 'omega', idx: i, chipId: 'CH-Slam' });
        }

        console.log('Omega build set. Locking in...');
        setTimeout(() => omega.emit('setReady', { team: 'omega' }), 500);
    }
});

alpha.on('combatResult', (result) => {
    if (result) {
        console.log('\n--- COMBAT RESULT RECEIVED ---');
        console.log(`Winner: ${result.winner}`);
        console.log(`Alpha Final SI: ${result.alphaFinalSI}`);
        console.log(`Omega Final SI: ${result.omegaFinalSI}`);
        console.log('\n--- COMBAT LOG ---');
        result.log.forEach(l => console.log(`[${l.type}] ${l.msg}`));

        setTimeout(() => {
            console.log('\nSuccess! Exiting test.');
            alpha.disconnect();
            omega.disconnect();
            process.exit(0);
        }, 1000);
    }
});

// Timeout fail-safe
setTimeout(() => {
    console.error('Test timed out.');
    process.exit(1);
}, 10000);
