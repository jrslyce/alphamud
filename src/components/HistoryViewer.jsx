import React, { useState } from 'react';
import { History, X } from 'lucide-react';
import { CombatLog } from './CombatLog';

export function HistoryViewer({ matchHistory, socket }) {
    const [viewingMatch, setViewingMatch] = useState(null);
    const [matchDetailsCache, setMatchDetailsCache] = useState({});

    // Listen for match details returning from server
    React.useEffect(() => {
        const onMatchDetails = (details) => {
            setMatchDetailsCache(prev => ({ ...prev, [details.id]: details }));
            setViewingMatch(details);
        };
        socket.on('matchDetails', onMatchDetails);
        return () => socket.off('matchDetails', onMatchDetails);
    }, [socket]);

    const handleViewMatch = (id) => {
        if (matchDetailsCache[id]) {
            setViewingMatch(matchDetailsCache[id]);
        } else {
            socket.emit('getMatchDetails', id);
        }
    };

    if (matchHistory.length === 0) return null;

    if (viewingMatch) {
        return (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-full overflow-y-auto rounded-3xl p-6 shadow-2xl relative">
                    <button
                        onClick={() => setViewingMatch(null)}
                        className="absolute top-6 right-6 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors hover:bg-red-500/20 hover:text-red-400 z-10"
                    >
                        <X size={24} />
                    </button>

                    <h2 className="text-3xl font-black text-white italic tracking-widest uppercase mb-2 border-b-2 border-slate-800 pb-4">
                        Historical Record: <span className="text-cyan-500">{viewingMatch.id}</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
                        {['alpha', 'omega'].map(team => {
                            const data = viewingMatch[team];
                            if (!data) return null;
                            const isWinner = viewingMatch.winner.toLowerCase() === team;
                            const colorClass = team === 'alpha' ? 'text-cyan-400' : 'text-orange-400';
                            return (
                                <div key={team} className={`p-4 rounded-2xl border ${isWinner ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-slate-800 bg-slate-950/50'}`}>
                                    <h3 className={`text-xl font-black uppercase tracking-widest mb-4 flex justify-between ${colorClass}`}>
                                        Team {team} {isWinner && <span className="text-yellow-500 text-sm">VICTOR</span>}
                                    </h3>
                                    <div className="space-y-4 text-xs font-mono uppercase text-slate-400">
                                        <div className="grid grid-cols-2 gap-2">
                                            {['core', 'armor', 'battery', 'fcs', 'thruster'].map(slot => (
                                                <div key={slot} className="bg-black/40 p-2 rounded">
                                                    <span className="block opacity-50 mb-1">{slot}</span>
                                                    <span className="text-white font-bold">{data.build[slot]?.replace('_', ' ') || 'NONE'}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div>
                                            <span className="block opacity-50 mb-1">Sequence</span>
                                            <div className="grid grid-cols-5 gap-1">
                                                {data.sequence.map((move, i) => (
                                                    <div key={i} className="bg-black/40 text-center p-2 rounded text-emerald-400 truncate text-[10px]" title={move}>
                                                        {move ? move.replace('_', ' ') : '-'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 border-t-2 border-slate-800 pt-8">
                        <CombatLog logs={viewingMatch.log} winner={viewingMatch.winner} instant={true} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto mt-12 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                <History className="text-slate-500" />
                Combat History Repository
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 custom-scrollbar max-h-64 overflow-y-auto pr-2">
                {matchHistory.map(match => (
                    <button
                        key={match.id}
                        onClick={() => handleViewMatch(match.id)}
                        className={`group p-4 bg-slate-950 border ${match.winner.toLowerCase() === 'alpha' ? 'border-cyan-900/50 hover:border-cyan-500' : match.winner.toLowerCase() === 'omega' ? 'border-orange-900/50 hover:border-orange-500' : 'border-slate-800 hover:border-slate-500'} rounded-xl text-left transition-all hover:bg-slate-800 w-full relative overflow-hidden`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="text-[10px] text-slate-500 font-mono mb-2">SIM DECK // {new Date(match.timestamp).toLocaleTimeString()}</div>
                        <div className="text-lg font-black text-white italic truncate">{match.id}</div>
                        <div className="text-xs font-bold uppercase tracking-widest mt-2 flex justify-between items-center">
                            <span className="opacity-50">VICTOR:</span>
                            <span className={match.winner.toLowerCase() === 'alpha' ? 'text-cyan-400' : match.winner.toLowerCase() === 'omega' ? 'text-orange-400' : 'text-slate-400'}>{match.winner}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
