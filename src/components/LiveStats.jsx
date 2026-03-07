import React from 'react';
import { Shield, Zap, Flame, Activity, Crosshair, Wind, Bot } from 'lucide-react';

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

export function LiveStats({ state }) {
    if (!state) return null;

    const renderMech = (team, data) => {
        const isAlpha = team === 'alpha';
        const color = isAlpha ? 'cyan' : 'orange';

        return (
            <div className={`p-4 md:p-6 bg-slate-900 border border-${color}-500/20 rounded-2xl relative overflow-hidden`}>
                <div className={`absolute -right-10 -top-10 opacity-5`}>
                    <Bot size={150} className={`text-${color}-500`} />
                </div>

                <h3 className={`text-xl font-black uppercase tracking-widest text-${color}-400 mb-4 flex items-center justify-between`}>
                    Team {team}
                    <Activity size={18} className="animate-pulse" />
                </h3>

                <div className="space-y-4 relative z-10">
                    <StatBar
                        label="Structural Int."
                        current={data.hp}
                        max={data.maxHp}
                        color={data.hp < data.maxHp * 0.25 ? 'bg-red-500' : `bg-${color}-500`}
                        icon={Shield}
                    />
                    <StatBar
                        label="Energy Output"
                        current={data.en}
                        max={data.maxEn}
                        color="bg-emerald-400"
                        icon={Zap}
                    />
                    {/* Assuming heatLimit is around 200 based on standard parts, setting max visually to 200 or scaling it */}
                    <StatBar
                        label="Thermal Level"
                        current={data.heat}
                        max={200}
                        color={data.heat > 150 ? 'bg-red-600 animate-pulse' : 'bg-red-400'}
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
