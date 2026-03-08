import React from 'react';
import { Wind, Flame, Shield, Target, Zap } from 'lucide-react';

export function PitStopOverlay({ team, onSelect, hasSelected }) {
    const isAlpha = team === 'alpha';
    const accentColor = isAlpha ? 'text-cyan-400 border-cyan-500/30' : 'text-orange-400 border-orange-500/30';
    const bgColor = isAlpha ? 'bg-cyan-950/20' : 'bg-orange-950/20';

    const options = [
        {
            id: 'overclock',
            title: 'Overclock Thrusters',
            description: 'Bypass safety limiters for extreme mobility.',
            stats: [
                { label: 'Speed', value: '+15%', color: 'text-emerald-400', icon: Wind },
                { label: 'Heat Gen', value: '+30%', color: 'text-red-400', icon: Flame }
            ],
            color: 'hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
        },
        {
            id: 'safety',
            title: 'Safety Cooldown',
            description: 'Throttle core output to vent accumulation.',
            stats: [
                { label: 'Speed', value: '-20%', color: 'text-red-400', icon: Wind },
                { label: 'Heat Gen', value: '-50%', color: 'text-emerald-400', icon: Flame }
            ],
            color: 'hover:border-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]'
        },
        {
            id: 'defense',
            title: 'Defensive Bracing',
            description: 'Lock joints and reinforce hull integrity.',
            stats: [
                { label: 'Stability', value: '+20%', color: 'text-emerald-400', icon: Shield },
                { label: 'Evasion', value: '-15%', color: 'text-red-400', icon: Target }
            ],
            color: 'hover:border-yellow-500 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]'
        }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
            <div className="max-w-4xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <h2 className={`text-4xl font-black uppercase tracking-tighter ${accentColor}`}>
                        Pit Stop: <span className="text-white">Mid-Match Pivot</span>
                    </h2>
                    <p className="text-slate-400 font-mono uppercase tracking-widest text-sm">
                        {hasSelected ? "Optimization sequence locked. Waiting for opponent..." : "Uplink connection stabilized. Select your recursive optimization."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {options.map(opt => (
                        <button
                            key={opt.id}
                            disabled={hasSelected}
                            onClick={() => onSelect(opt.id)}
                            className={`group p-6 rounded-2xl border border-slate-800 bg-slate-900/50 transition-all duration-300 text-left ${opt.color} flex flex-col h-full ${hasSelected ? 'opacity-50 grayscale' : ''}`}
                        >
                            <div className="mb-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Option {String.fromCharCode(65 + options.indexOf(opt))}</span>
                                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{opt.title}</h3>
                            </div>

                            <p className="text-slate-400 text-xs leading-relaxed mb-6 flex-grow">
                                {opt.description}
                            </p>

                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                {opt.stats.map((s, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs font-mono">
                                        <span className="flex items-center gap-2 text-slate-500">
                                            <s.icon size={12} /> {s.label}
                                        </span>
                                        <span className={`font-bold ${s.color}`}>{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest animate-pulse">
                        Awaiting pilot decision... Round 4 sequence will initiate upon selection
                    </p>
                </div>
            </div>
        </div>
    );
}
