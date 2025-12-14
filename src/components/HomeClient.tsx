'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Loader2, Plus, Users, Eye, Tv, ArrowRight, X, Check } from 'lucide-react';

export default function HomeClient() {
    const router = useRouter();
    const { username, setUsername, playerId, setPlayerId, roomId, setRoomId } = useGameStore();
    const [localName, setLocalName] = useState(username);
    const [mode, setMode] = useState<'create' | 'join' | 'spectate' | null>(null);
    const [gameMode, setGameMode] = useState<'regular' | 'text'>('regular');
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showBanner, setShowBanner] = useState(false);
    const [namingMode, setNamingMode] = useState(false); // New state for name entry step

    // Check if there's an active game
    const hasActiveGame = !!(roomId && playerId);

    // Banner Logic: Delay 5s and check validity
    useEffect(() => {
        if (!hasActiveGame) {
            setShowBanner(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/game/${roomId}?playerId=${playerId}`);
                if (res.status === 404) {
                    clearActiveGame();
                    return;
                }
                const data = await res.json();
                if (data.status === 'finished') {
                    clearActiveGame();
                } else {
                    setShowBanner(true);
                }
            } catch (e) {
                console.error('Failed to validate game existence', e);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [hasActiveGame, roomId, playerId]);

    const clearActiveGame = () => {
        setRoomId(null);
        setPlayerId(null);
        setShowBanner(false);
    };

    const handleNameSubmit = async () => {
        if (!localName.trim()) { setError('Name is required'); return; }
        setLoading(true);
        setError('');

        try {
            setUsername(localName);
            // Send UPDATE_NAME action
            await fetch('/api/game/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId,
                    playerId,
                    type: 'UPDATE_NAME',
                    payload: localName
                })
            });

            // Proceed to game
            router.push(`/game/${roomId}`);
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setLoading(true);
        setError('');

        try {
            // Create with default name first
            const res = await fetch('/api/room/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hostName: undefined, // Will default to 'Host'
                    mode: gameMode,
                    visibility: gameMode === 'text' ? 'public' : 'unlisted'
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Successfully created room
            setPlayerId(data.playerId);
            setRoomId(data.roomId);

            // Now prompt for name
            setMode(null);
            setNamingMode(true);
            setLoading(false);
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    const handleJoin = async (isSpectator: boolean = false) => {
        if (!roomCode.trim()) { setError('Room Code is required'); return; }
        setLoading(true);
        setError('');

        try {
            // Join with default name first
            const res = await fetch('/api/room/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomCode,
                    playerName: undefined, // Will default
                    isSpectator // boolean
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setPlayerId(data.playerId);
            setRoomId(data.roomId);

            // Now prompt for name (unless spectating - maybe spectators don't need names? Assuming yes for now)
            setMode(null);
            setNamingMode(true);
            setLoading(false);
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
        }
    };

    // If we are in naming mode, show that UI exclusively
    if (namingMode) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl space-y-6"
                >
                    <div className="text-center">
                        <div className="inline-block p-3 rounded-full bg-green-500/20 text-green-400 mb-4">
                            <Check size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white">You're in!</h2>
                        <p className="text-slate-400">Room: <span className="font-mono text-white">{roomId}</span></p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">What should we call you?</label>
                        <input
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            placeholder="Enter display name..."
                            autoFocus
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                        />
                    </div>

                    <button onClick={handleNameSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold transition flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : 'Enter Game'}
                    </button>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8"
            >
                <div className="text-center">
                    <h1 className="text-5xl font-black bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
                        GUESS WHO?
                    </h1>
                    <p className="mt-2 text-slate-400">Multiplayer Edition</p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                    {/* Current Game Banner - Only show if state is true (after delay) */}
                    {showBanner && (
                        <div className="mb-6 p-4 bg-green-900/30 border border-green-600/50 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-400 font-bold text-sm">Active Game</p>
                                    <p className="text-white text-lg font-mono">{roomId}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/game/${roomId}`)}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold transition"
                                    >
                                        <ArrowRight size={18} /> Resume
                                    </button>
                                    <button
                                        onClick={clearActiveGame}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition"
                                        title="Leave Game"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Name input removed from landing page */}

                        {!mode && (
                            <div className="grid grid-cols-1 gap-3 pt-4">
                                <button onClick={() => setMode('create')} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl font-bold transition">
                                    <Plus size={20} /> Create Room
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setMode('join')} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold transition">
                                        <Users size={20} /> Join
                                    </button>
                                    <button onClick={() => setMode('spectate')} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold transition">
                                        <Eye size={20} /> Watch
                                    </button>
                                </div>
                                <button onClick={() => router.push('/matches')} className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 p-3 rounded-xl font-medium transition flex items-center justify-center gap-2 mt-2">
                                    <Tv size={18} /> Browse Public Matches
                                </button>
                            </div>
                        )}

                        {mode === 'create' && (
                            <div className="space-y-4 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Game Mode</label>
                                    <div className="grid grid-cols-2 gap-2" id="game-mode-selector">
                                        <button
                                            type="button"
                                            onClick={() => setGameMode('regular')}
                                            className={`p-3 rounded-lg font-bold text-sm transition border-2 ${gameMode === 'regular' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                        >
                                            🎭 Regular
                                            <span className="block text-xs font-normal opacity-70">Private game</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGameMode('text')}
                                            className={`p-3 rounded-lg font-bold text-sm transition border-2 ${gameMode === 'text' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                        >
                                            💬 Text Mode
                                            <span className="block text-xs font-normal opacity-70">Public match</span>
                                        </button>
                                    </div>
                                </div>
                                <button onClick={handleCreate} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white p-4 rounded-xl font-bold transition flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" /> : 'Start Game'}
                                </button>
                                <button onClick={() => setMode(null)} className="w-full text-slate-500 text-sm hover:text-white">Cancel</button>
                            </div>
                        )}

                        {(mode === 'join' || mode === 'spectate') && (
                            <div className="space-y-4 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Room Code</label>
                                    <input
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="6-CHAR CODE"
                                        maxLength={6}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-center tracking-widest uppercase font-mono focus:ring-2 focus:ring-purple-500 outline-none transition"
                                    />
                                </div>
                                <button onClick={() => handleJoin(mode === 'spectate')} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl font-bold transition flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" /> : (mode === 'join' ? 'Join Game' : 'Spectate')}
                                </button>
                                <button onClick={() => setMode(null)} className="w-full text-slate-500 text-sm hover:text-white">Cancel</button>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
