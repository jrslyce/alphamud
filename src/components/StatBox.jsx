import React from 'react';

export function StatBox({ icon: Icon, label, value, unit, color, maxValue, warning }) {
    return (
        <div className={`p-4 rounded-xl border ${warning ? 'border-red-500 bg-red-500/10' : 'border-slate-800 bg-slate-900/50'}`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className={color} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-black ${warning ? 'text-red-400' : 'text-white'}`}>{value}</span>
                <span className="text-xs text-slate-500">{unit}</span>
            </div>
            {maxValue && (
                <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${warning ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, (value / maxValue) * 100)}%` }} />
                </div>
            )}
        </div>
    );
}
