import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Copy, Shield, Zap, Target, Gauge, Cpu, Play, Sword, UserPlus, ZapOff } from 'lucide-react';

export function Admin({ gameState, socket, combatResult }) {
    const [startTime, setStartTime] = useState(null);
    const [now, setNow] = useState(Date.now());
    const lastResultKeyRef = useRef(null);
    const consoleContainerRef = useRef(null);

    // Update 'now' frequently to drive the animation
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(timer);
    }, []);

    // Manage startTime based on NEW results
    useEffect(() => {
        const resultKey = combatResult ? JSON.stringify(combatResult.log).slice(0, 100) + combatResult.log.length : null;

        if (!combatResult?.log) {
            setStartTime(null);
            lastResultKeyRef.current = null;
            return;
        }

        // If it's a DIFFERENT result than we last saw, start the clock!
        if (lastResultKeyRef.current !== resultKey) {
            lastResultKeyRef.current = resultKey;
            setStartTime(Date.now());
        }
    }, [combatResult]);

    const handleStartSimulation = () => {
        // Force the UI into a fresh state immediately
        setStartTime(Date.now());
        lastResultKeyRef.current = "FORCE_REFRESH_" + Date.now();
        socket.emit('adminStartSimulation');
    };

    const handleReset = () => {
        setStartTime(null);
        lastResultKeyRef.current = null;
        socket.emit('adminResetSimulation');
    };

    // Derive display state from elapsed time
    const elapsed = startTime ? now - startTime : 0;
    const displayCount = Math.floor(elapsed / 1000);
    const displayedLogs = combatResult?.log ? combatResult.log.slice(0, displayCount) : [];
    const isFinished = combatResult?.log ? displayCount >= combatResult.log.length : false;

    // Auto-scroll
    useEffect(() => {
        if (consoleContainerRef.current) {
            consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
        }
    }, [displayedLogs]);

    const getLogColor = (type) => {
        switch (type) {
            case 'sys': return 'text-cyan-400 font-bold';
            case 'initiative': return 'text-purple-400 italic';
            case 'turn': return 'text-slate-500 font-black tracking-widest uppercase mt-4';
            case 'hit': return 'text-yellow-400';
            case 'critical': return 'text-red-500 font-bold';
            case 'miss': return 'text-slate-400';
            default: return 'text-green-400 font-mono';
        }
    };

    const handleAutoFill = () => {
        const parts = ['core_heavy', 'armor_nano', 'battery_standard', 'fcs_standard', 'thruster_standard'];
        const moves = ['laser_cannon', 'plasma_rifle', 'missile_swarm', 'railgun', 'energy_blade'];

        ['alpha', 'omega'].forEach(team => {
            parts.forEach((itemId, idx) => {
                const slots = ['core', 'armor', 'battery', 'fcs', 'thruster'];
                socket.emit('updateBuild', { team, slot: slots[idx], itemId });
            });
            moves.forEach((chipId, idx) => {
                socket.emit('updateSequence', { team, idx, chipId });
            });
            socket.emit('setReady', { team });
        });
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <Cpu className="text-red-500" size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            System <span className="text-red-500">Overseer</span>
                        </h1>
                        <p className="text-slate-500 font-mono text-xs tracking-widest uppercase flex gap-4">
                            <span>Direct Neural Uplink</span>
                            <span className="text-red-500 font-bold">LATEST VERSION V5 (T-MINUS)</span>
                            <span className="text-cyan-500">ELAPSED: {Math.floor(elapsed / 1000)}s</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={handleAutoFill} className="group flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-cyan-500/10">
                        <UserPlus size={18} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                        Auto-Fill Units
                    </button>
                    <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-red-900/20 border border-slate-700 hover:border-red-500 text-white rounded-xl font-bold transition-all">
                        <ZapOff size={18} className="text-red-500" />
                        RESET
                    </button>
                    <button id="launch-button" onClick={handleStartSimulation} className="group flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black italic tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95">
                        <Play size={20} fill="currentColor" />
                        LAUNCH
                    </button>
                </div>
            </div>

            <div id="telemetry" data-elapsed={elapsed} data-count={displayCount} data-start={startTime} data-now={now} className="hidden"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                            <Terminal size={20} className="text-red-500" />
                            Combat Telemetry
                        </h2>
                        <div ref={consoleContainerRef} className="bg-black/80 border border-slate-800 rounded-xl p-4 h-[400px] overflow-y-auto font-mono text-sm space-y-2 shadow-inner custom-scrollbar relative">
                            {displayedLogs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-4">
                                    <div className="w-12 h-12 border-2 border-slate-800 border-t-red-500 rounded-full animate-spin" />
                                    <p className="text-xs uppercase tracking-widest font-black">Waiting for Data Packets...</p>
                                </div>
                            ) : (
                                displayedLogs.map((log, idx) => (
                                    <div key={idx} className={`leading-relaxed animate-in slide-in-from-left-2 duration-300 ${getLogColor(log.type)}`}>
                                        <span className="opacity-30 mr-3 text-[10px] select-none">{String(idx).padStart(3, '0')}</span>
                                        {log.msg}
                                    </div>
                                ))
                            )}
                        </div>
                        {isFinished && combatResult?.winner && (
                            <div className="mt-4 p-4 bg-red-500 border border-red-400 text-white rounded-xl animate-in zoom-in duration-500">
                                <h3 className="text-2xl font-black uppercase text-center tracking-widest italic">
                                    {combatResult.winner === 'Draw' ? 'SIMULATION DRAW' : `VICTOR: ${combatResult.winner}`}
                                </h3>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-white uppercase tracking-wide">Fleet Status</h2>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black tracking-widest animate-pulse uppercase">Tactical Map Active</span>
                        </div>

                        <div className="space-y-8">
                            {['alpha', 'omega'].map(team => (
                                <div key={team} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`text-lg font-black uppercase tracking-widest ${team === 'alpha' ? 'text-cyan-400' : 'text-orange-400'}`}>
                                            Team {team}
                                        </h3>
                                        <div className="flex gap-2">
                                            {gameState?.teams[team]?.ready && (
                                                <span className="px-2 py-0.5 bg-emerald-500 text-black text-[10px] font-black rounded uppercase">Ready</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-3">
                                        {gameState?.teams[team]?.sequence?.map((move, idx) => (
                                            <div key={idx} className="aspect-square bg-black/40 border border-slate-800 rounded-lg flex items-center justify-center text-[10px] font-mono text-slate-500">
                                                {move ? <div className="text-emerald-400 text-[8px] text-center font-bold px-1">{move.replace('_', ' ')}</div> : idx + 1}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
