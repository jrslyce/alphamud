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

export function runSimulation(alphaBuild, alphaSeq, omegaBuild, omegaSeq, homeTeam, resumeState = null) {
    const log = resumeState ? resumeState.log : [];
    const alpha = resumeState ? resumeState.alphaState : resolveStats(alphaBuild);
    const omega = resumeState ? resumeState.omegaState : resolveStats(omegaBuild);

    let turn = resumeState ? resumeState.turn : 0;

    const addLog = (type, msg, actionData = null) => {
        log.push({
            type,
            msg,
            actionData,
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

    addLog('sys', `--- INITIATING COMBAT SIMULATION ---`);
    if (homeTeam && homeTeam !== 'neutral') {
        addLog('sys', `Welcome to the ${homeTeam.toUpperCase()} stadium`);
    }
    addLog('sys', `Alpha SI: ${alpha.si} | Omega SI: ${omega.si}`);

    // Phase 1: Initiative
    // Lower lock-on time means faster first strike.
    let alphaGoesFirst = alpha.lockOn <= omega.lockOn;
    addLog('initiative', `Alpha Lock-on: ${alpha.lockOn}s | Omega Lock-on: ${omega.lockOn}s`);
    addLog('initiative', `${alphaGoesFirst ? 'Alpha' : 'Omega'} seizes initiative!`);

    let winner = null;
    // turn is handled above

    const resolveStrike = (attacker, defender, side, targetSide, moveId) => {
        const actionRecord = {
            round: turn + 1,
            attacker: side,
            defender: targetSide,
            move: null,
            result: 'none',
            actualDmg: 0
        };

        if (winner) return;

        if (attacker.stunTurns > 0) {
            addLog('hit', `[${side}] is Stunned! Sequence broken.`, { ...actionRecord, result: 'stunned' });
            attacker.stunTurns--;
            return;
        }

        const move = CHIPS.find(c => c.id === moveId);
        if (!move) {
            addLog('hit', `[${side}] idles.`, { ...actionRecord, result: 'idle' });
            return;
        }

        actionRecord.move = { ...move };

        // Phase 2: Engagement (EN/Heat)
        attacker.currentEN -= move.en;
        attacker.currentHeat += move.heat;

        if (attacker.currentEN < 0) {
            addLog('critical', `[${side}] Energy depletion botch! Shutting down. (EN: -${move.en}, Heat: +${move.heat})`, { ...actionRecord, result: 'botch' });
            winner = targetSide;
            return;
        }
        if (attacker.currentHeat > attacker.heatLimit) {
            addLog('critical', `[${side}] Thermal Meltdown! Structure buckling. (EN: -${move.en}, Heat: +${move.heat})`, { ...actionRecord, result: 'meltdown' });
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
            addLog('miss', `[${side}]'s ${move.name} misses the evasive ${targetSide}! (EN: -${move.en}, Heat: +${move.heat})`, { ...actionRecord, result: 'miss' });
            return;
        }

        // Phase 3: Physics (Damage Mitigation & Sell)
        const dmgReduction = Math.min(defender.stability / defender.weight, 0.8); // Max 80% reduction
        const actualDmg = Math.floor(move.damage - (move.damage * dmgReduction));

        defender.currentSI -= actualDmg;
        actionRecord.actualDmg = actualDmg;

        // Sell Mechanics
        const stunThreshold = defender.stability * 0.25;
        let isStunned = false;

        if (actualDmg > stunThreshold) {
            isStunned = true;
            defender.stunTurns = 1;
        }

        addLog('hit', `[${side}] strikes with ${move.name}! Deals ${actualDmg} integrity damage. (EN: -${move.en}, Heat: +${move.heat})`, { ...actionRecord, result: isStunned ? 'stun' : 'hit' });

        if (isStunned) {
            addLog('critical', `MASSIVE HIT! [${targetSide}]'s stability broken. System Stunned!`);
        }

        if (defender.currentSI <= 0) {
            winner = side;
        }
    };

    // Phase 1: Initiation
    for (; turn < 3; turn++) {
        addLog('turn', `--- ROUND ${turn + 1} START ---`);

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

    // PIT STOP CHECK
    if (!winner && turn === 3 && !resumeState) {
        addLog('pitstop', `INTERMISSION: PIT STOP TRIGGERED. Awaiting pilot optimizations for Phase 2.`);
        return {
            log,
            winner: null,
            isPitStop: true,
            turn: 3,
            alphaState: { ...alpha },
            omegaState: { ...omega }
        };
    }

    const applyPitStop = (mech, choice) => {
        if (choice === 'overclock') {
            mech.speed *= 1.15;
            mech.passiveHeat *= 1.30;
        } else if (choice === 'safety') {
            mech.speed *= 0.80;
            mech.passiveHeat *= 0.50;
        } else if (choice === 'defense') {
            mech.stability *= 1.20;
            // No explicit Evasion stat but weight-based logic exists
            mech.weight *= 1.15; // Increasing weight reduces hitChance and dmgReduction logic
        }
    };

    if (resumeState) {
        applyPitStop(alpha, resumeState.alphaChoice);
        applyPitStop(omega, resumeState.omegaChoice);

        const strategyLabel = (choice) => {
            if (choice === 'overclock') return 'Overclock Thrusters (+15% Speed / +30% Heat Gen)';
            if (choice === 'safety') return 'Safety Cooldown (-20% Speed / -50% Heat Gen)';
            if (choice === 'defense') return 'Defensive Bracing (+20% Stability / -15% Evasion)';
            return 'Unknown';
        };

        addLog('pitstop', `[Alpha] Pit Strategy: ${strategyLabel(resumeState.alphaChoice)}`);
        addLog('pitstop', `[Omega] Pit Strategy: ${strategyLabel(resumeState.omegaChoice)}`);
        addLog('pitstop', `--- RESUMING COMBAT: PHASE 2 ---`);
    }

    // FINAL PHASE (Rounds 4-5) - Only happens if called with pit stop data
    for (; turn < 5; turn++) {
        addLog('turn', `--- ROUND ${turn + 1} START ---`);

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
