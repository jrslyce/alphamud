import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Cpu, Terminal, Users, Play } from 'lucide-react';
import { Builder } from './components/Builder';
import { CombatLog } from './components/CombatLog';
import { Admin } from './components/Admin';

const SOCKET_URL = import.meta.env.PROD
  ? 'https://sfc-alpha-mud-backend-372490992828.us-central1.run.app'
  : 'http://localhost:4000';
const socket = io(SOCKET_URL);

export default function App() {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [combatResult, setCombatResult] = useState(null);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  useEffect(() => {
    setIsAdminRoute(window.location.pathname === '/admin');

    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }
    function onGameState(state) { setGameState(state); }
    function onCombatResult(res) {
      setCombatResult(res);
      if (!res) setGameState(prev => ({ ...prev, status: 'lobby' }));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('gameState', onGameState);
    socket.on('combatResult', onCombatResult);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('gameState', onGameState);
      socket.off('combatResult', onCombatResult);
    };
  }, []);

  const joinTeam = (team) => {
    socket.emit('joinTeam', team);
    setMyTeam(team);
  };

  if (isAdminRoute) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
        <Admin gameState={gameState} socket={socket} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-full shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <Cpu className="text-cyan-500" size={48} />
        </div>

        <h1 className="text-6xl font-black text-white tracking-tighter">
          SFC ALPHA <span className="text-cyan-500">MUD</span>
        </h1>

        <p className="text-emerald-400 font-mono text-sm tracking-widest uppercase flex items-center justify-center gap-2">
          {connected ? (
            <><span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span> SYSTEM ONLINE</>
          ) : (
            <><Terminal size={16} /> INITIALIZING UPLINK...</>
          )}
        </p>
      </div>

      {!myTeam ? (
        <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 border-l-4 border-cyan-500 pl-4 flex items-center justify-between">
            Tactical Lobby
            <Users size={20} className="text-slate-500" />
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => joinTeam('alpha')} className="p-4 rounded-xl border border-slate-700 bg-slate-950 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all font-bold group text-left">
              <span className="block text-slate-500 text-[10px] uppercase tracking-widest mb-1">Join Sector</span>
              <span className="text-white group-hover:text-cyan-400 block text-lg">TEAM ALPHA</span>
              <span className="text-slate-400 text-xs mt-2 block hidden">{gameState?.teams?.alpha?.players?.length || 0} Architects Online</span>
            </button>

            <button onClick={() => joinTeam('omega')} className="p-4 rounded-xl border border-slate-700 bg-slate-950 hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all font-bold group text-left">
              <span className="block text-slate-500 text-[10px] uppercase tracking-widest mb-1">Join Sector</span>
              <span className="text-white group-hover:text-orange-400 block text-lg">TEAM OMEGA</span>
              <span className="text-slate-400 text-xs mt-2 block hidden">{gameState?.teams?.omega?.players?.length || 0} Architects Online</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-6">
          <div className="flex items-center justify-between w-full max-w-6xl bg-slate-900/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-black text-white border-l-4 border-cyan-500 pl-4 uppercase">
              {myTeam === 'alpha' ? <span className="text-cyan-400">Team Alpha</span> : <span className="text-orange-400">Team Omega</span>} COMMAND
            </h2>
            <div className="flex items-center gap-4 text-sm font-mono text-slate-400">
              <Users size={16} />
              {gameState?.teams[myTeam]?.players?.length || 0} Architects connected
            </div>
          </div>

          {combatResult ? (
            <CombatLog logs={combatResult.log} winner={combatResult.winner} />
          ) : (
            <>
              <Builder
                teamBuild={gameState?.teams[myTeam]?.build}
                teamSequence={gameState?.teams[myTeam]?.sequence || [null, null, null, null, null]}
                onUpdateBuild={(slot, itemId) => {
                  socket.emit('updateBuild', { team: myTeam, slot, itemId: itemId === "" ? null : itemId });
                }}
                onUpdateSequence={(idx, chipId) => {
                  socket.emit('updateSequence', { team: myTeam, idx, chipId });
                }}
                onLockIn={() => socket.emit('setReady', { team: myTeam })}
              />

              {gameState?.teams[myTeam]?.ready && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in duration-300">
                  <Play className="text-cyan-500 animate-pulse" size={64} />
                  <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-widest">{myTeam} UPLINK LOCKED</h2>
                  <p className="text-slate-400 font-mono text-lg">Awaiting opposing force validation...</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest pt-8 pb-4">
        AAA Sport • Deterministic MUD Engine v0.1.0
      </p>
    </div>
  );
}
