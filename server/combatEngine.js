import { BASE_CHASSIS, MANIFEST, CHIPS } from '../src/data/gameData.js';

function resolveStats(build) {
    const stats = { ...BASE_CHASSIS };
    const thruster = MANIFEST.thrusters.find(i => i.id === build.thruster) || {};
    const battery = MANIFEST.batteries.find(i => i.id === build.battery) || {};
    const fcs = MANIFEST.fcs.find(i => i.id === build.fcs) || {};
    const core = MANIFEST.cores.find(i => i.id === build.core) || {};
    const armor = MANIFEST.armor.find(i => i.id === build.armor) || {};

    stats.weight += (thruster.weight || 0) + (battery.weight || 0) + (fcs.weight || 0) + (core.weight || 0) + (armor.weight || 0);
    stats.stability += (thruster.stability || 0) + (battery.stability || 0) + (fcs.stability || 0) + (core.stability || 0) + (armor.stability || 0);
    stats.enCapacity += (thruster.en || 0) + (battery.en || 0) + (fcs.en || 0) + (core.en || 0) + (armor.en || 0);
    stats.compute += (thruster.compute || 0) + (battery.compute || 0) + (fcs.compute || 0) + (core.compute || 0) + (armor.compute || 0);
    stats.si += (thruster.si || 0) + (battery.si || 0) + (fcs.si || 0) + (core.si || 0) + (armor.si || 0);

    stats.lockOn = fcs.lockOn || 1.0;

    const passiveHeat = (thruster.heat || 0) + (battery.heat || 0) + (fcs.heat || 0) + (core.heat || 0) + (armor.heat || 0);

    return { ...stats, passiveHeat, currentSI: stats.si, currentEN: stats.enCapacity, currentHeat: 0, stunTurns: 0 };
}

export function runSimulation(alphaBuild, alphaSeq, omegaBuild, omegaSeq) {
    const log = [];
    const alpha = resolveStats(alphaBuild);
    const omega = resolveStats(omegaBuild);

    const addLog = (type, msg) => {
        log.push({
            type,
            msg,
            state: {
                alpha: {
                    hp: alpha.currentSI, maxHp: alpha.si,
                    en: alpha.currentEN, maxEn: alpha.enCapacity,
                    heat: alpha.currentHeat, compute: alpha.compute,
                    stability: alpha.stability, speed: alpha.speed
                },
                omega: {
                    hp: omega.currentSI, maxHp: omega.si,
                    en: omega.currentEN, maxEn: omega.enCapacity,
                    heat: omega.currentHeat, compute: omega.compute,
                    stability: omega.stability, speed: omega.speed
                }
            }
        });
    };

    addLog('sys', '--- INITIATING COMBAT SIMULATION ---');
    addLog('sys', `Alpha SI: ${alpha.si} | Omega SI: ${omega.si}`);

    // Phase 1: Initiative
    // Lower lock-on time means faster first strike.
    let alphaGoesFirst = alpha.lockOn <= omega.lockOn;
    addLog('initiative', `Alpha Lock-on: ${alpha.lockOn}s | Omega Lock-on: ${omega.lockOn}s`);
    addLog('initiative', `${alphaGoesFirst ? 'Alpha' : 'Omega'} seizes initiative!`);

    let winner = null;

    for (let turn = 0; turn < 5; turn++) {
        addLog('turn', `--- ROUND ${turn + 1} START ---`);

        const resolveStrike = (attacker, defender, side, targetSide, moveId) => {
            if (winner) return;
            if (attacker.stunTurns > 0) {
                addLog('hit', `[${side}] is Stunned! Sequence broken for this turn.`);
                attacker.stunTurns--;
                return;
            }

            const move = CHIPS.find(c => c.id === moveId);
            if (!move) {
                addLog('hit', `[${side}] idles.`);
                return;
            }

            // Phase 2: Engagement (EN/Heat)
            attacker.currentEN -= move.en;
            attacker.currentHeat += move.heat;

            if (attacker.currentEN < 0) {
                addLog('critical', `[${side}] Energy depletion botch! Shutting down.`);
                winner = targetSide;
                return;
            }
            if (attacker.currentHeat > attacker.heatLimit) {
                addLog('critical', `[${side}] Thermal Meltdown! Structure buckling.`);
                winner = targetSide;
                return;
            }

            // Deterministic Success "Roll" - for this AAA determinism, if Success + Compute vs Evasion is met.
            // Evasion simplistic logic: lighter mechs evade better.
            const evasionModifier = Math.max(0, 10000 - defender.weight) / 10000; // 0 to 1
            const hitChance = move.success + (attacker.compute / 1000) - (evasionModifier * 0.2);

            // Let's use a seeded RNG based on turn number & stability for AAA determinism, or just pure math threshold.
            // Since it's deterministic MUD, let's use a modulus of the SI sums.
            const pseudoRng = ((attacker.si + defender.si + turn) % 100) / 100;

            if (pseudoRng > hitChance) {
                addLog('miss', `[${side}]'s ${move.name} misses the evasive ${targetSide}!`);
                return;
            }

            // Phase 3: Physics (Damage Mitigation & Sell)
            const dmgReduction = Math.min(defender.stability / defender.weight, 0.8); // Max 80% reduction
            const actualDmg = Math.floor(move.damage - (move.damage * dmgReduction));

            defender.currentSI -= actualDmg;
            addLog('hit', `[${side}] strikes with ${move.name}! Deals ${actualDmg} integrity damage.`);

            // Sell Mechanics
            const stunThreshold = defender.stability * 0.25;
            if (actualDmg > stunThreshold) {
                addLog('critical', `MASSIVE HIT! [${targetSide}]'s stability broken. System Stunned!`);
                defender.stunTurns = 1;
            }

            if (defender.currentSI <= 0) {
                winner = side;
            }
        };

        // Attack Sequence
        if (alphaGoesFirst) {
            resolveStrike(alpha, omega, 'Alpha', 'Omega', alphaSeq[turn]);
            resolveStrike(omega, alpha, 'Omega', 'Alpha', omegaSeq[turn]);
        } else {
            resolveStrike(omega, alpha, 'Omega', 'Alpha', omegaSeq[turn]);
            resolveStrike(alpha, omega, 'Alpha', 'Omega', alphaSeq[turn]);
        }

        if (winner) break;

        // Phase 4: Governor
        alpha.currentHeat += alpha.passiveHeat;
        omega.currentHeat += omega.passiveHeat;
    }

    if (!winner) {
        if (alpha.currentSI > omega.currentSI) winner = 'Alpha';
        else if (omega.currentSI > alpha.currentSI) winner = 'Omega';
        else winner = 'Draw';
    }

    addLog('sys', `=== SIMULATION COMPLETE ===`);
    addLog('sys', `VICTOR: ${winner.toUpperCase()}`);

    return { log, winner, alphaFinalSI: alpha.currentSI, omegaFinalSI: omega.currentSI };
}
