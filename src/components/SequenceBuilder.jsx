import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { CHIPS } from '../data/gameData';

export function SequenceBuilder({ sequence, totals, onUpdateSequence }) {
    const sequenceStats = useMemo(() => {
        let currentEN = 0;
        let currentHeat = 0;
        const results = sequence.map((chipId) => {
            if (!chipId) return { status: 'idle' };

            const chip = CHIPS.find(c => c.id === chipId);
            if (!chip) return { status: 'idle' };

            currentEN += chip.en;
            currentHeat += chip.heat;

            const enFail = currentEN > totals.enCapacity;
            const heatFail = currentHeat > totals.heatLimit;

            return {
                ...chip,
                cumulativeEN: currentEN,
                cumulativeHeat: currentHeat,
                enFail,
                heatFail,
                status: enFail || heatFail ? 'botch' : 'success'
            };
        });

        const isBotched = results.some(r => r.status === 'botch');
        return { results, isBotched, totalEN: currentEN, totalHeat: currentHeat };
    }, [sequence, totals]);

    return (
        <div className="flex-1 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col space-y-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-white italic">FIVE MOVES OF DOOM</h2>
                <div className="flex gap-4">
                    <div className="px-4 py-2 rounded-lg bg-black/40 border border-slate-800 flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Total Energy</p>
                            <p className={`font-mono text-sm ${sequenceStats.totalEN > totals.enCapacity ? 'text-red-400' : 'text-yellow-400'}`}>
                                {sequenceStats.totalEN} / {totals.enCapacity}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Total Heat</p>
                            <p className={`font-mono text-sm ${sequenceStats.totalHeat > totals.heatLimit ? 'text-red-400' : 'text-orange-400'}`}>
                                {sequenceStats.totalHeat} / {totals.heatLimit}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEQUENCE EDITOR */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {sequence.map((chipId, idx) => {
                    const result = sequenceStats.results[idx];
                    return (
                        <div key={idx} className="relative group min-h-[192px]">
                            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px]
                  font-black z-10 ${result.status === 'success' ? 'bg-emerald-500 text-black' :
                                    result.status === 'botch' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                MOVE {idx + 1}
                            </div>
                            <div className={`h-full flex flex-col items-center justify-center gap-3 p-4 rounded-2xl
                  border-2 transition-all cursor-pointer ${chipId ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                                    : 'bg-slate-950/30 border-dashed border-slate-800 hover:border-slate-600'}
                  ${result.status === 'botch'
                                    ? 'border-red-500 ring-2 ring-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : ''
                                }`}>

                                <select value={chipId || ""} onChange={(e) => onUpdateSequence(idx, e.target.value === "" ? null : e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                >
                                    <option value="">Select Move</option>
                                    {CHIPS.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>

                                {result.id ? (
                                    <>
                                        <span className="text-center text-sm font-black text-white px-2 leading-tight">
                                            {result.name}
                                        </span>
                                        <div className="space-y-1 w-full text-[10px] font-bold">
                                            <div className="flex justify-between text-yellow-500">
                                                <span>Energy</span>
                                                <span>{result.en} J</span>
                                            </div>
                                            <div className="flex justify-between text-orange-500">
                                                <span>Heat</span>
                                                <span>{result.heat} TU</span>
                                            </div>
                                            <div className="flex justify-between text-cyan-500">
                                                <span>Success</span>
                                                <span>{Math.round(result.success * 100)}%</span>
                                            </div>
                                            <div className="flex justify-between text-red-500 pt-1 border-t border-slate-700/50 mt-1">
                                                <span>Damage</span>
                                                <span>{result.damage}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-600">
                                        <RotateCcw size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-center">Touch to Assign</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FEEDBACK */}
            <div className="p-4 md:p-6 rounded-2xl bg-black/50 border border-slate-800 flex items-center gap-4 md:gap-6 mt-auto">
                {sequenceStats.isBotched ? (
                    <>
                        <div className="p-3 bg-red-500 rounded-full text-black shadow-[0_0_15px_rgba(239,68,68,0.5)] shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h4 className="text-red-400 font-black text-lg uppercase italic tracking-wider">SYSTEM BOTCH DETECTED</h4>
                            <p className="text-slate-400 text-sm">Hardware limits exceeded mid-sequence. Core meltdown or energy depletion triggered.</p>
                        </div>
                    </>
                ) : sequence.every(s => s !== null) ? (
                    <>
                        <div className="p-3 bg-emerald-500 rounded-full text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] shrink-0">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <h4 className="text-emerald-400 font-black text-lg uppercase italic tracking-wider">SIGNATURE VALID</h4>
                            <p className="text-slate-400 text-sm">Optimization confirmed. Strategy locked.</p>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-4 text-slate-500 w-full text-center md:text-left justify-center md:justify-start">
                        <p className="text-sm font-medium italic">Assign all 5 sequence chips to validate your protocol.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
