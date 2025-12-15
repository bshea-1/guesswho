'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { Loader2, Plus, Users, Eye, Tv, X, Check } from 'lucide-react';

export default function HomeClient() {
    const router = useRouter();
    const { username, setUsername, playerId, setPlayerId, roomId, setRoomId, clearGame } = useGameStore();
    const [localName, setLocalName] = useState(username);
    const [mode, setMode] = useState<'create' | 'join' | 'spectate' | null>(null);
    // Removed gameMode state
    const [roomCode, setRoomCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showBanner, setShowBanner] = useState(false);
    const [namingMode, setNamingMode] = useState(false); // New state for name entry step
    const [isSpectatorMode, setIsSpectatorMode] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [pendingAction, setPendingAction] = useState<'create' | null>(null);

    // Check if there's an active game
    const hasActiveGame = !!(roomId && playerId);

    const clearActiveGame = useCallback(() => {
        clearGame();
        setShowBanner(false);
    }, [clearGame]);

    // Banner Logic: Show immediately if game exists, then validate in background
    useEffect(() => {
        if (!hasActiveGame) {
            setShowBanner(false);
            return;
        }

        // Show banner immediately
        setShowBanner(true);

        // Validate in background - if game is gone/finished, clear it
        const validateGame = async () => {
            try {
                const res = await fetch(`/api/game/${roomId}?playerId=${playerId}`);
                if (res.status === 404) {
                    clearActiveGame();
                    return;
                }
                const data = await res.json();
                // Clear if the game/match is finished or doesn't exist
                if (data.status === 'finished' || data.matchStatus === 'finished') {
                    clearActiveGame();
                }
            } catch (e) {
                console.error('Failed to validate game existence', e);
            }
        };

        validateGame();
    }, [hasActiveGame, roomId, playerId, clearActiveGame]);

    const handleNameSubmit = async () => {
        if (!localName.trim()) { setError('Name is required'); return; }
        setLoading(true);
        setError('');

        // CASE 0: PENDING CREATION (New Flow)
        if (pendingAction === 'create') {
            setLoadingMessage('Creating Party...');
            // Delay slightly for effect
            await new Promise(resolve => setTimeout(resolve, Math.random() * 750 + 500));

            try {
                const res = await fetch('/api/room/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hostName: localName, // Pass name directly
                        mode: undefined,
                        visibility
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setPlayerId(data.playerId);
                setRoomId(data.roomId);
                setUsername(localName);

                // Go to game
                router.push(`/game/${data.roomId}`);
            } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                setError(e.message);
                setLoading(false);
            }
            return;
        }

        // CASE 1: NOT JOINED YET (New Join Flow)
        if (!playerId || !roomId) {
            setLoadingMessage('Joining Party...');
            // We need roomCode. If it came from URL param, it might not be in roomCode state variable?
            // Actually, if we are in namingMode from `handleJoin`, `roomCode` state is set.
            // If we are here from `handleCreate`, `playerId` exists. -> Not anymore in new flow!
            // Wait, if pendingAction is null, we are in Join flow.

            const targetRoom = roomId || roomCode; // If we have roomId (create - old flow fallback?), use it. Else use input.
            // In new flow, roomId is null when joining.

            if (!targetRoom) {
                setError("Missing Room Code");
                setLoading(false);
                return;
            }

            await executeJoin(targetRoom, isSpectatorMode, localName);
            return;
        }

        // CASE 2: ALREADY JOINED (Legacy/Rejoin)
        setLoadingMessage('Joining Party...');

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
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(e.message);
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const handleCreate = async () => {
        // Just trigger naming mode, defer creation
        setPendingAction('create');
        setNamingMode(true);
        setMode(null);
        setIsSpectatorMode(false);
    };

    const executeJoin = async (code: string, isSpectator: boolean, name?: string) => {
        setLoading(true);
        setError('');

        try {
            // Join with provided name or default
            const res = await fetch('/api/room/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: code,
                    playerName: name,
                    isSpectator // boolean
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setPlayerId(data.playerId);
            setRoomId(data.roomId);

            // If we joined successfully with a name, go straight to game
            // If no name (shouldn't happen in new flow but good fallback), go to naming
            if (name) {
                setUsername(name);
                router.push(`/game/${data.roomId}`);
            } else {
                setMode(null);
                setNamingMode(true);
                setIsSpectatorMode(isSpectator);
                setLoading(false);
            }

        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(e.message);
            setLoading(false);
        }
    };

    const handleJoin = async (isSpectator: boolean = false) => {
        if (!roomCode.trim()) { setError('Room Code is required'); return; }

        // If Spectator, we can join immediately (anon) or ask for name?
        // User asked: "game should not start until the person fully enters their name"
        // Spectators don't start games. So spectators can probably follow old flow or new flow.
        // Let's make everyone enter name first for consistency, unless "Watch Anonymously" chosen.

        // Set local state to prepare for naming
        setNamingMode(true);
        setIsSpectatorMode(isSpectator);
        setMode(null); // Clear previous mode menu
    };

    // Check for URL Code
    const searchParams = useSearchParams();
    useEffect(() => {
        const urlCode = searchParams.get('code') || searchParams.get('party');
        if (!urlCode) return;

        const code = urlCode.toUpperCase();

        // If already in this room, go there
        if (roomId === code && playerId) {
            router.push(`/game/${code}`);
            return;
        }

        // Otherwise start join process (defaulting to player/standard join)
        // We only do this if we aren't already loading or in error state to prevent loops
        if (!loading && !error && !namingMode) {
            setRoomCode(code); // Pre-fill code
            setMode('join'); // Effectively we want to show... actually just go straight to naming? 
            // If we go straight to naming, user might be confused.
            // Let's set naming mode directly.
            setNamingMode(true);
            setIsSpectatorMode(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, roomId, playerId]);

    // If we are in naming mode, show that UI exclusively
    if (namingMode) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl space-y-6"
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <Loader2 className="animate-spin w-12 h-12 text-blue-500" />
                            <p className="text-xl font-medium text-blue-300">{loadingMessage}</p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center">
                                <div className="inline-block p-3 rounded-full bg-green-500/20 text-green-400 mb-4">
                                    <Check size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-white">You&apos;re in!</h2>
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
                                Enter Game
                            </button>

                            {isSpectatorMode && (
                                <button
                                    onClick={() => {
                                        // Anonymous watch logic
                                        // Case 1: Already Joined (unlikely here if we delaying join? No, wait.)
                                        // If we delayed join, we need to JOIN now as spectator with name 'Spectator'
                                        if (!playerId) {
                                            executeJoin(roomCode, true, 'Spectator');
                                        } else {
                                            // Legacy/Special case
                                            setUsername('Spectator');
                                            router.push(`/game/${roomId}`);
                                        }
                                    }}
                                    disabled={loading}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
                                >
                                    <Tv size={20} /> Watch Anonymously
                                </button>
                            )}

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                                    {error}
                                </div>
                            )}
                        </>
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
                </div>

                {/* Current Game Banner - Moved Outside */}
                {showBanner && !loading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="w-full bg-slate-900/80 border border-green-500/30 rounded-2xl p-4 shadow-lg backdrop-blur-md"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                    <Tv size={20} />
                                </div>
                                <div>
                                    <p className="text-green-400 font-bold text-xs uppercase tracking-wider">Active Match</p>
                                    <p className="text-white font-mono text-lg">{roomId}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/game/${roomId}`)}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition"
                                >
                                    Rejoin
                                </button>
                                <button
                                    onClick={clearActiveGame}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                                    title="Dismiss"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl min-h-[auto] flex flex-col justify-center">

                    <div className="space-y-4">
                        {/* Name input removed from landing page */}

                        {!mode && (
                            loading ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <Loader2 className="animate-spin w-12 h-12 text-blue-500 mb-4" />
                                    <p className="text-slate-400 text-lg animate-pulse">{loadingMessage}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 pt-4">

                                    <div className="flex flex-col">
                                        <button onClick={handleCreate} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-t-xl font-bold transition z-10 relative">
                                            <Plus size={20} /> Create Room
                                        </button>
                                        <div className="flex bg-slate-800 p-1 rounded-b-xl">
                                            <button
                                                onClick={() => setVisibility('public')}
                                                className={`flex-1 py-2 text-sm font-bold rounded-md transition ${visibility === 'public' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                Public
                                            </button>
                                            <button
                                                onClick={() => setVisibility('private')}
                                                className={`flex-1 py-2 text-sm font-bold rounded-md transition ${visibility === 'private' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                Private
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setMode('join')} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold transition">
                                            <Users size={20} /> Join
                                        </button>
                                        <button onClick={() => router.push('/matches')} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold transition">
                                            <Eye size={20} /> Watch
                                        </button>
                                    </div>
                                </div>
                            )
                        )}

                        {/* Mode 'create' block Removed entirely */}

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

            {/* Footer Credit */}
            <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-slate-600 text-xs">
                Site made by Brennan Shea
            </p>
        </div>
    );
}
