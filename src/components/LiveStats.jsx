import React from 'react';
import { Shield, Zap, Flame, Activity, Crosshair, Wind, Bot, Trophy } from 'lucide-react';

const Confetti = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(30)].map((_, i) => {
                const colors = ['bg-red-500', 'bg-yellow-400', 'bg-blue-500', 'bg-green-400', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-400'];
                return (
                    <div
                        key={i}
                        className={`absolute w-2 h-2 rounded-sm animate-confetti shadow-sm ${colors[i % colors.length]}`}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `-10px`,
                            animationDelay: `${Math.random() * 4}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                    />
                );
            })}
        </div>
    );
};

const StatBar = ({ label, current = 0, max = 100, color, icon: Icon, inverse = false }) => {
    // For heat, higher is worse, but we still fill the bar.
    const percentage = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-end text-[10px] uppercase tracking-widest font-mono text-slate-400">
                <span className="flex items-center gap-1"><Icon size={12} /> {label}</span>
                <span>{Math.floor(current)} / {Math.floor(max)}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export function LiveStats({ state, winner, isFinished }) {
    if (!state) return null;

    const renderMech = (team, data) => {
        const isAlpha = team === 'alpha';
        const isWinner = isFinished && winner && winner.toLowerCase() === team;

        // Use explicit tailwind classes to prevent purging
        const borderColor = isAlpha ? 'border-cyan-500/20' : 'border-orange-500/20';
        const textColor = isAlpha ? 'text-cyan-400' : 'text-orange-400';
        const iconColor = isAlpha ? 'text-cyan-500' : 'text-orange-500';
        const hpColor = data.hp < data.maxHp * 0.25 ? 'bg-red-500' : (isAlpha ? 'bg-cyan-500' : 'bg-orange-500');

        return (
            <div className={`p-4 md:p-6 bg-slate-900 border ${borderColor} rounded-2xl relative overflow-hidden transition-all duration-500 ${isWinner ? 'shadow-[0_0_30px_rgba(250,204,21,0.2)] border-yellow-500/50' : ''}`}>

                {isWinner && <Confetti />}

                <div className="absolute -right-10 -top-10 opacity-5">
                    <Bot size={150} className={iconColor} />
                </div>

                <h3 className={`text-xl font-black uppercase tracking-widest ${textColor} mb-4 flex items-center relative z-10`}>
                    <div className="flex items-center gap-2">
                        {isWinner && <Trophy size={20} className="text-yellow-400 animate-bounce" />}
                        Team {team}
                        {isWinner && <span className="text-yellow-400 ml-2 text-xs">VICTORIOUS</span>}
                    </div>
                    {!isFinished && <div className="ml-auto"><Activity size={18} className="animate-pulse" /></div>}
                </h3>

                <div className="space-y-4 relative z-10">
                    <StatBar
                        label="Structural Int."
                        current={data.hp}
                        max={data.maxHp}
                        color={hpColor}
                        icon={Shield}
                    />
                    <StatBar
                        label="Energy Output"
                        current={data.en}
                        max={data.maxEn}
                        color="bg-emerald-400"
                        icon={Zap}
                    />
                    <StatBar
                        label="Thermal Level"
                        current={data.heat}
                        max={data.maxHeat || 500}
                        color={data.heat > (data.maxHeat || 500) * 0.75 ? 'bg-red-600 animate-pulse' : 'bg-red-400'}
                        icon={Flame}
                    />

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800">
                        <div className="text-center p-2 bg-black/40 rounded-lg">
                            <Crosshair size={14} className="mx-auto mb-1 text-slate-500" />
                            <div className="text-xs font-bold text-white">{data.compute}</div>
                            <div className="text-[8px] uppercase tracking-widest opacity-50">COMP</div>
                        </div>
                        <div className="text-center p-2 bg-black/40 rounded-lg">
                            <Shield size={14} className="mx-auto mb-1 text-slate-500" />
                            <div className="text-xs font-bold text-white">{data.stability}</div>
                            <div className="text-[8px] uppercase tracking-widest opacity-50">STAB</div>
                        </div>
                        <div className="text-center p-2 bg-black/40 rounded-lg">
                            <Wind size={14} className="mx-auto mb-1 text-slate-500" />
                            <div className="text-xs font-bold text-white">{data.speed || 0}</div>
                            <div className="text-[8px] uppercase tracking-widest opacity-50">SPD</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {renderMech('alpha', state.alpha)}
            {renderMech('omega', state.omega)}
        </div>
    );
}
