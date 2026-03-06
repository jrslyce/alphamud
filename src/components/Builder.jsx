import React, { useMemo } from 'react';
import { Shield, Zap, Flame, Weight, Info } from 'lucide-react';
import { MANIFEST, BASE_CHASSIS } from '../data/gameData';
import { StatBox } from './StatBox';
import { SequenceBuilder } from './SequenceBuilder';

function Selector({ label, items, selectedId, onSelect, getStats }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
            <select
                value={selectedId || ""}
                onChange={(e) => onSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono"
            >
                <option value="">-- No Component --</option>
                {items.map(item => (
                    <option key={item.id} value={item.id}>
                        {item.name} ({getStats(item)})
                    </option>
                ))}
            </select>
        </div>
    );
}

export function Builder({ teamBuild, teamSequence, onUpdateBuild, onUpdateSequence, onLockIn }) {
    const totals = useMemo(() => {
        const stats = { ...BASE_CHASSIS };

        // Resolve full item objects from IDs
        const resolvedBuild = {
            thruster: MANIFEST.thrusters.find(i => i.id === teamBuild?.thruster),
            battery: MANIFEST.batteries.find(i => i.id === teamBuild?.battery),
            fcs: MANIFEST.fcs.find(i => i.id === teamBuild?.fcs),
            core: MANIFEST.cores.find(i => i.id === teamBuild?.core),
            armor: MANIFEST.armor.find(i => i.id === teamBuild?.armor),
        };

        Object.values(resolvedBuild).forEach(item => {
            if (!item) return;
            stats.weight += item.weight || 0;
            stats.stability += item.stability || 0;
            stats.enCapacity += item.en || 0;
            stats.compute += item.compute || 0;
            stats.si += item.si || 0;
            stats.dissipation -= (item.heat || 0);
        });

        const totalPassiveHeat = Object.values(resolvedBuild).reduce((sum, item) => sum + (item?.heat || 0), 0);
        const sellThreshold = stats.stability * 0.25;

        return { ...stats, totalPassiveHeat, sellThreshold, resolvedBuild };
    }, [teamBuild]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl mx-auto">
            {/* BUILDER PANEL */}
            <section className="lg:col-span-4 space-y-6">
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                    <h2 className="text-xl font-bold text-white border-l-4 border-cyan-500 pl-4">Hardware manifest</h2>

                    <div className="space-y-4">
                        <Selector
                            label="System 1: Thruster"
                            items={MANIFEST.thrusters}
                            selectedId={teamBuild?.thruster}
                            onSelect={(id) => onUpdateBuild('thruster', id)}
                            getStats={(i) => `+${i.thrust} Thr | ${i.weight}kg`}
                        />
                        <Selector
                            label="System 2: Battery"
                            items={MANIFEST.batteries}
                            selectedId={teamBuild?.battery}
                            onSelect={(id) => onUpdateBuild('battery', id)}
                            getStats={(i) => `+${i.en} EN | ${i.weight}kg`}
                        />
                        <Selector
                            label="System 3: FCS"
                            items={MANIFEST.fcs}
                            selectedId={teamBuild?.fcs}
                            onSelect={(id) => onUpdateBuild('fcs', id)}
                            getStats={(i) => `+${i.lockOn}s | ${i.weight}kg`}
                        />
                        <Selector
                            label="System 4: AI Core"
                            items={MANIFEST.cores}
                            selectedId={teamBuild?.core}
                            onSelect={(id) => onUpdateBuild('core', id)}
                            getStats={(i) => `+${i.compute} Hz | ${i.weight}kg`}
                        />
                        <Selector
                            label="System 5: Armor"
                            items={MANIFEST.armor}
                            selectedId={teamBuild?.armor}
                            onSelect={(id) => onUpdateBuild('armor', id)}
                            getStats={(i) => `+${i.stability} Stab | ${i.si} SI`}
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Info size={12} /> Net Hype Cost:
                        </span>
                        <span className="font-bold text-cyan-400">
                            {Object.values(totals.resolvedBuild).reduce((sum, i) => sum + (i?.cost || 0), 0)} H
                        </span>
                    </div>
                </div>
            </section>

            {/* DASHBOARD */}
            <section className="lg:col-span-8 flex flex-col space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox icon={Weight} label="Total Weight" value={totals.weight} unit="kg" color="text-slate-400" maxValue={10000} warning={totals.weight > 8000} />
                    <StatBox icon={Shield} label="Sell Threshold" value={Math.round(totals.sellThreshold)} unit="DMG" color="text-emerald-400" />
                    <StatBox icon={Zap} label="EN Capacity" value={totals.enCapacity} unit="J" color="text-yellow-400" maxValue={3000} />
                    <StatBox icon={Flame} label="Passive Heat" value={totals.totalPassiveHeat} unit="TU/s" color="text-orange-400" maxValue={totals.heatLimit} warning={totals.totalPassiveHeat > totals.heatLimit * 0.8} />
                </div>

                <SequenceBuilder sequence={teamSequence} totals={totals} onUpdateSequence={onUpdateSequence} />

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl mt-8">
                    <div className="text-sm font-mono text-slate-500">
                        All components require assignment before uplink locking.
                    </div>
                    <button
                        disabled={!teamSequence.every(s => s !== null) || Object.values(totals.resolvedBuild).some(s => !s)}
                        onClick={onLockIn}
                        className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:shadow-none"
                    >
                        Lock In Sequence
                    </button>
                </div>
            </section>
        </div>
    );
}
