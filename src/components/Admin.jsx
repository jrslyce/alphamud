import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Copy, Shield, Zap, Target, Gauge, Cpu, Play, Sword, UserPlus, ZapOff, CheckCircle } from 'lucide-react';
import { CombatLog } from './CombatLog';

export function Admin({ gameState, socket, combatResult }) {
    const [startTime, setStartTime] = useState(null);
    const [autoFillDone, setAutoFillDone] = useState(false);
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
        socket.emit('adminAutoFill');
        setAutoFillDone(true);
        setTimeout(() => setAutoFillDone(false), 2000);
    };

    const handleSetHomeTeam = (e) => {
        socket.emit('adminSetHomeTeam', e.target.value);
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
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl">
                        <Shield className="text-slate-500" size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Home:</span>
                        <select
                            className="bg-transparent text-white text-sm font-bold uppercase cursor-pointer outline-none focus:ring-0"
                            value={gameState?.homeTeam || 'neutral'}
                            onChange={handleSetHomeTeam}
                        >
                            <option value="neutral" className="bg-slate-900 text-slate-400">Neutral Site</option>
                            <option value="alpha" className="bg-slate-900 text-cyan-400">Team Alpha</option>
                            <option value="omega" className="bg-slate-900 text-orange-400">Team Omega</option>
                        </select>
                    </div>

                    <button
                        onClick={handleAutoFill}
                        className={`group flex items-center gap-2 px-6 py-3 border rounded-xl font-bold transition-all shadow-lg ${autoFillDone
                                ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-emerald-500/10'
                                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-cyan-500 text-white hover:shadow-cyan-500/10'
                            }`}
                    >
                        {autoFillDone ? (
                            <CheckCircle size={18} className="animate-in zoom-in" />
                        ) : (
                            <UserPlus size={18} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                        )}
                        {autoFillDone ? 'UNITS READY' : 'Auto-Fill Units'}
                    </button>
                    <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-red-900/20 border border-slate-700 hover:border-red-500 text-white rounded-xl font-bold transition-all">
                        <ZapOff size={18} className="text-red-500" />
                        RESET
                    </button>
                    <button
                        id="launch-button"
                        onClick={handleStartSimulation}
                        disabled={!isFinished && combatResult}
                        className={`group flex items-center gap-2 px-8 py-3 rounded-xl font-black italic tracking-widest transition-all ${!isFinished && combatResult
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95'
                            }`}
                    >
                        {(!isFinished && combatResult) ? (
                            <><Gauge size={20} className="animate-spin text-slate-500" /> PROCESSING</>
                        ) : (
                            <><Play size={20} fill="currentColor" /> LAUNCH</>
                        )}
                    </button>
                </div>
            </div>

            <div id="telemetry" data-elapsed={elapsed} data-count={displayCount} data-start={startTime} data-now={now} className="hidden"></div>

            {combatResult ? (
                <div className="mt-8">
                    <CombatLog logs={combatResult.log} winner={combatResult.winner} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Placeholder when no combat is running to keep layout consistent if needed */}
                    <div className="col-span-full">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 py-20 flex flex-col items-center">
                            <Terminal size={48} className="text-slate-700 mb-4" />
                            <h2 className="text-xl font-black uppercase tracking-widest text-slate-400 mb-2">Simulated Combat Telemetry Offline</h2>
                            <p className="max-w-md text-sm">Waiting for Overseer to initiate a new combat sequence. Generate loadouts using auto-fill or wait for user inputs.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
