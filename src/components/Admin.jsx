import React from 'react';
import { Shield, Play, Loader, Users } from 'lucide-react';

export function Admin({ gameState, socket }) {
    if (!gameState) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 font-mono gap-4">
                <Loader className="animate-spin text-cyan-500" size={32} />
                CONNECTING TO UPLINK...
            </div>
        );
    }

    const alphaReady = gameState.teams.alpha.ready;
    const omegaReady = gameState.teams.omega.ready;
    const bothReady = alphaReady && omegaReady;

    const startSimulation = () => {
        if (bothReady) {
            socket.emit('adminStartSimulation');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <Shield className="text-emerald-500" size={32} />
                    OVERSEER TERMINAL
                </h2>
                <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-full font-mono text-sm tracking-widest text-slate-400">
                    STATUS: {gameState.status.toUpperCase()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Alpha Status */}
                <div className={`p-6 rounded-2xl border transition-all ${alphaReady ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-slate-800 bg-slate-900/50'}`}>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                        TEAM ALPHA
                        <span className={`text-xs px-2 py-1 rounded font-mono ${alphaReady ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                            {alphaReady ? 'LOCKED' : 'BUILDING'}
                        </span>
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                        <Users size={16} /> {gameState.teams.alpha.players.length} Architects Online
                    </div>
                </div>

                {/* Team Omega Status */}
                <div className={`p-6 rounded-2xl border transition-all ${omegaReady ? 'border-orange-500 bg-orange-950/20 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'border-slate-800 bg-slate-900/50'}`}>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                        TEAM OMEGA
                        <span className={`text-xs px-2 py-1 rounded font-mono ${omegaReady ? 'bg-orange-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                            {omegaReady ? 'LOCKED' : 'BUILDING'}
                        </span>
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                        <Users size={16} /> {gameState.teams.omega.players.length} Architects Online
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6">
                {gameState.status === 'combat' ? (
                    <div className="flex flex-col items-center gap-4 text-emerald-400">
                        <Loader className="animate-spin" size={48} />
                        <h3 className="text-2xl font-black uppercase tracking-widest">SIMULATION IN PROGRESS</h3>
                        <p className="font-mono text-slate-400">Broadcasting combat telemetry to all sectors...</p>
                    </div>
                ) : (
                    <>
                        <h3 className="text-2xl font-bold text-white">SIMULATION CONTROL</h3>
                        <p className="text-slate-400 font-mono">Both teams must deploy their final sequence before the simulation can be initiated.</p>

                        <button
                            onClick={startSimulation}
                            disabled={!bothReady}
                            className={`
                                group relative w-full md:w-auto overflow-hidden rounded-xl font-black text-xl uppercase tracking-widest transition-all duration-300
                                ${bothReady
                                    ? 'bg-red-500 text-white hover:bg-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_50px_rgba(239,68,68,0.5)] cursor-pointer translate-y-0'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed translate-y-1'
                                }
                            `}
                        >
                            <div className="flex items-center justify-center gap-3 px-12 py-6">
                                <Play className={bothReady ? 'animate-pulse' : ''} size={28} />
                                {bothReady ? 'INITIATE COMBAT SCENARIO' : 'AWAITING TEAM LOCKS'}
                            </div>

                            {/* Glitch overlay on hover */}
                            {bothReady && (
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer_1s_infinite] skew-x-[-20deg]"></div>
                            )}
                        </button>

                        <div className="pt-4 border-t border-slate-800">
                            <button
                                onClick={() => socket.emit('adminAutoFill')}
                                className="px-6 py-2 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors text-sm font-mono uppercase tracking-widest"
                            >
                                Auto-Fill Random Loadouts (Testing)
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
