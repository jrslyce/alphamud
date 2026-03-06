import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';

export function CombatLog({ logs, winner }) {
    const [displayedLogs, setDisplayedLogs] = useState([]);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!logs) return;

        // Simulate streaming the log lines for a MUD feel
        let cnt = 0;
        const interval = setInterval(() => {
            if (cnt < logs.length) {
                setDisplayedLogs(logs.slice(0, cnt + 1));
                cnt++;
            } else {
                clearInterval(interval);
            }
        }, 400); // 400ms delay between log lines

        return () => clearInterval(interval);
    }, [logs]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="flex items-center gap-3 text-cyan-500 mb-2">
                <Terminal size={24} />
                <h2 className="text-xl font-black uppercase tracking-widest">Combat Simulation Uplink</h2>
            </div>

            <div className="bg-black/90 border border-slate-800 rounded-xl p-6 h-[500px] overflow-y-auto font-mono text-sm shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
                {displayedLogs.map((log, idx) => (
                    <div key={idx} className={`mb-2 leading-relaxed ${getLogColor(log.type)}`}>
                        <span className="opacity-50 mr-2 text-xs">[{new Date().toISOString().split('T')[1].slice(0, 8)}]</span>
                        {log.msg}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {displayedLogs.length === logs?.length && winner && (
                <div className={`mt-6 p-6 rounded-xl border flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 ${winner === 'Draw' ? 'bg-slate-900 border-slate-700 text-slate-400' :
                        winner.toLowerCase() === 'alpha' ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : 'bg-orange-900/40 border-orange-500 text-orange-400'
                    }`}>
                    <h3 className="text-3xl font-black uppercase tracking-widest text-center">
                        {winner === 'Draw' ? 'SIMULATION DRAW' : `VICTOR: TEAM ${winner}`}
                    </h3>
                    <p className="text-sm opacity-80 mt-2 font-mono">Uplink resetting in 15 seconds...</p>
                </div>
            )}
        </div>
    );
}
