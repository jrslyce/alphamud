import { runSimulation } from './server/combatEngine.js';
import { MANIFEST, CHIPS } from './src/data/gameData.js';

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)].id;

const alphaBuild = {
    thruster: randomItem(MANIFEST.thrusters),
    battery: randomItem(MANIFEST.batteries),
    fcs: randomItem(MANIFEST.fcs),
    core: randomItem(MANIFEST.cores),
    armor: randomItem(MANIFEST.armor)
};
const alphaSeq = Array.from({ length: 5 }, () => randomItem(CHIPS));

const omegaBuild = {
    thruster: randomItem(MANIFEST.thrusters),
    battery: randomItem(MANIFEST.batteries),
    fcs: randomItem(MANIFEST.fcs),
    core: randomItem(MANIFEST.cores),
    armor: randomItem(MANIFEST.armor)
};
const omegaSeq = Array.from({ length: 5 }, () => randomItem(CHIPS));

const result = runSimulation(alphaBuild, alphaSeq, omegaBuild, omegaSeq, 'neutral');
console.log(JSON.stringify(result.log, null, 2));
