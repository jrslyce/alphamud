import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';
import { LiveStats } from './LiveStats';

export function CombatLog({ logs, winner, instant = false }) {
    const [startTime, setStartTime] = useState(null);
    const [now, setNow] = useState(Date.now());
    const lastLogsKeyRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Drive the animation with a high-frequency ticker
    useEffect(() => {
        if (instant) return;
        const timer = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(timer);
    }, [instant]);

    // Manage startTime based on NEW logs
    useEffect(() => {
        if (instant) return;
        const logsKey = logs ? JSON.stringify(logs).slice(0, 100) + logs.length : null;

        if (!logs) {
            setStartTime(null);
            lastLogsKeyRef.current = null;
            return;
        }

        if (lastLogsKeyRef.current !== logsKey) {
            lastLogsKeyRef.current = logsKey;
            setStartTime(Date.now());
        }
    }, [logs, instant]);

    // Derive display state from elapsed time
    const elapsed = startTime ? now - startTime : 0;
    const displayCount = Math.floor(elapsed / 1000);
    const displayedLogs = instant ? (logs || []) : (logs ? logs.slice(0, displayCount) : []);
    const isFinished = instant ? true : (logs ? displayCount >= logs.length : false);

    // Find latest state for visualization
    const currentState = displayedLogs.length > 0 ? displayedLogs[displayedLogs.length - 1].state : null;

    // Auto-scroll logic
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
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

    return (
        <div className="w-full mx-auto space-y-8 animate-in fade-in duration-700">
            {currentState && (
                <div className="mb-6">
                    <LiveStats state={currentState} />
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center gap-3 text-cyan-500 mb-2 border-b border-slate-800 pb-4">
                    <Terminal size={24} />
                    <h2 className="text-xl font-black uppercase tracking-widest text-white/90">Combat Simulation Uplink</h2>
                </div>

                <div ref={scrollContainerRef} className="bg-black/90 border border-slate-800 rounded-xl p-6 h-[500px] overflow-y-auto font-mono text-sm shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] custom-scrollbar">
                    {displayedLogs.map((log, idx) => (
                        <div key={idx} className={`mb-2 leading-relaxed animate-in slide-in-from-left-2 duration-300 ${getLogColor(log.type)}`}>
                            <span className="opacity-30 mr-3 text-[10px] select-none">{String(idx).padStart(3, '0')}</span>
                            {log.msg}
                        </div>
                    ))}
                    {logs && logs.length > 0 && !isFinished && (
                        <div className="flex items-center gap-2 text-cyan-500/50 italic animate-pulse py-2">
                            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" />
                            <span className="text-[10px] tracking-widest uppercase">Incoming Data Packets...</span>
                        </div>
                    )}
                </div>

                {isFinished && winner && (
                    <div className={`mt-6 p-6 rounded-xl border flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 bg-opacity-40 backdrop-blur-sm ${winner === 'Draw' ? 'bg-slate-900 border-slate-700 text-slate-400' :
                        winner.toLowerCase() === 'alpha' ? 'bg-cyan-900 border-cyan-500 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'bg-orange-900 border-orange-500 text-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.2)]'
                        }`}>
                        <h3 className="text-3xl font-black uppercase tracking-widest text-center italic">
                            {winner === 'Draw' ? 'SIMULATION DRAW' : `VICTOR: TEAM ${winner}`}
                        </h3>
                        <p className="text-xs opacity-60 mt-2 font-mono tracking-widest uppercase">Simulation Loop: Ready in 15s</p>
                    </div>
                )}
            </div>
        </div>
    );
}
