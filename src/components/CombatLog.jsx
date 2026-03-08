import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Zap, Flame, Target, Sword } from 'lucide-react';
import { LiveStats } from './LiveStats';

export function CombatLog({ logs, winner, instant = false, onFinished }) {
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
        // Strip the length from logsKey so we don't double up
        const baseKey = logs ? JSON.stringify(logs).slice(0, 100) : null;
        const logsKey = logs ? baseKey + '+' + logs.length : null;

        if (!logs) {
            console.log('[CombatLog] No logs provided. Resetting startTime.');
            setStartTime(null);
            lastLogsKeyRef.current = null;
            return;
        }

        console.log(`[CombatLog] Evaluated logsKey: ${logs.length} items. Prev key: ${lastLogsKeyRef.current ? lastLogsKeyRef.current.split('+')[1] : null}`);

        if (lastLogsKeyRef.current !== logsKey) {
            if (!lastLogsKeyRef.current || logs.length < 5) {
                console.log('[CombatLog] Brand new combat session (no prev key or < 5 logs). Set startTime to Date.now().');
                setStartTime(Date.now());
            } else {
                const prevLenStr = lastLogsKeyRef.current.split('+');
                const prevLen = prevLenStr.length > 1 ? parseInt(prevLenStr[1]) : 0;

                if (logs.length > prevLen) {
                    console.log(`[CombatLog] Identified as an append (len: ${logs.length} > ${prevLen}). Preserving startTime.`);
                    // It's an append! Let it continue
                    setStartTime(prev => {
                        if (prev) {
                            console.log(`[CombatLog] Using existing startTime: ${prev}`);
                            return prev;
                        } else {
                            const newStart = Date.now() - ((logs.length - 1) * 1000);
                            console.log(`[CombatLog] No existing startTime. Deriving: ${newStart}`);
                            return newStart;
                        }
                    });
                } else {
                    console.log(`[CombatLog] Logs length ${logs.length} <= ${prevLen}. Resetting to Date.now().`);
                    setStartTime(Date.now());
                }
            }
            lastLogsKeyRef.current = logsKey;
        }
    }, [logs, instant]);

    // Derive display state from elapsed time
    const elapsed = startTime ? now - startTime : 0;
    const displayCount = instant ? (logs ? logs.length : 0) : Math.floor(elapsed / 1000);
    const displayedLogs = logs ? logs.slice(0, displayCount) : [];
    const isFinished = logs ? displayCount >= logs.length : false;

    useEffect(() => {
        if (onFinished) {
            onFinished(isFinished);
        }
    }, [isFinished, onFinished]);

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

    const actions = displayedLogs.filter(l => l.actionData).map(l => l.actionData);
    const rounds = {};
    actions.forEach(a => {
        if (!rounds[a.round]) rounds[a.round] = { round: a.round, alpha: null, omega: null };
        if (a.attacker === 'Alpha') rounds[a.round].alpha = a;
        else rounds[a.round].omega = a;
    });
    const roundList = Object.values(rounds).sort((a, b) => a.round - b.round);

    const renderActionCard = (action, team) => {
        if (!action) return null;

        const isHit = action.result === 'hit' || action.result === 'stun';
        const bgColor = team === 'alpha' ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-50' : 'bg-orange-950/40 border-orange-500/30 text-orange-50';
        const resultColor = isHit ? 'text-green-400' : 'text-slate-500';

        return (
            <div className={`p-3 rounded-lg border ${bgColor} group relative transition-all hover:scale-105`}>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">{team}</div>
                <div className="font-bold text-xs truncate mb-2">{action.move?.name || 'IDLE'}</div>

                <div className={`text-[10px] font-black uppercase tracking-widest ${resultColor}`}>
                    {action.result === 'stunned' ? 'STUNNED' :
                        (action.result === 'hit' || action.result === 'stun') ? `${action.actualDmg} DMG` :
                            action.result === 'miss' ? 'MISSED' :
                                action.result === 'botch' ? 'BOTCHED' :
                                    action.result === 'meltdown' ? 'MELTDOWN' : 'IDLE'}
                </div>

                {action.move && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                        <div className="text-xs font-black uppercase text-white mb-3 pb-2 border-b border-slate-700 flex justify-between">
                            <span>{action.move.name}</span>
                            <span className={isHit ? 'text-green-400' : 'text-slate-500'}>{action.result.toUpperCase()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                            <div className="flex items-center gap-2 text-yellow-400"><Zap size={12} /> -{action.move.en}</div>
                            <div className="flex items-center gap-2 text-red-400"><Flame size={12} /> +{action.move.heat}</div>
                            <div className="flex items-center gap-2 text-slate-300"><Target size={12} /> {Math.floor(action.move.success * 100)}%</div>
                            <div className="flex items-center gap-2 text-green-400"><Sword size={12} /> {action.move.damage}</div>
                        </div>
                        {isHit && (
                            <div className="mt-3 pt-3 border-t border-slate-700 text-[10px] text-slate-400 leading-tight">
                                <span className="text-white block mb-1">Impact Analysis:</span>
                                Target mitigation reduced max damage ({action.move.damage}) down to <span className="text-red-400 font-bold">{action.actualDmg} actual damage</span>.
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full mx-auto space-y-8 animate-in fade-in duration-700">
            {currentState && (
                <div className="mb-6">
                    <LiveStats state={currentState} winner={winner} isFinished={isFinished} />
                </div>
            )}

            {roundList.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
                    {roundList.map(r => (
                        <div key={r.round} className="space-y-3 animate-in fade-in zoom-in duration-300">
                            <div className="text-center text-[10px] font-bold text-slate-500 tracking-widest uppercase">Round {r.round}</div>
                            {renderActionCard(r.alpha, 'alpha')}
                            {renderActionCard(r.omega, 'omega')}
                        </div>
                    ))}
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
