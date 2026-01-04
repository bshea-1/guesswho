'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { GameType } from '@/lib/types';
import { Loader2, Plus, Users, Eye, Tv, X, Check, Dices, Grid3X3, Search, Skull, UserX } from 'lucide-react';

export default function HomeClient() {
    const router = useRouter();
    const { username, setUsername, playerId, setPlayerId, roomId, setRoomId, clearGame } = useGameStore();
    const [localName, setLocalName] = useState(username);
    const [mode, setMode] = useState<'create' | 'join' | 'spectate' | 'select-game' | null>(null);
    const [selectedGame, setSelectedGame] = useState<GameType>('guess-who');
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
    const [imposterSubMode, setImposterSubMode] = useState<'text' | 'irl'>('text');
    const [cahWinThreshold, setCahWinThreshold] = useState<number>(5);

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
                        hostName: localName,
                        gameType: selectedGame,
                        imposterMode: selectedGame === 'imposter' ? imposterSubMode : undefined,
                        cahWinThreshold: selectedGame === 'cah' ? cahWinThreshold : undefined,
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

            // Always use roomCode as source of truth for new joins
            // roomId is cleared when user starts a new join flow
            const targetRoom = roomCode;

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
        setMode('select-game');
        setIsSpectatorMode(false);
    };

    const handleGameSelect = (game: GameType) => {
        setSelectedGame(game);
        setPendingAction('create');
        setNamingMode(true);
        setMode(null);
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

        const codeToJoin = roomCode.trim().toUpperCase();

        // Validate room exists before asking for name
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/game/${codeToJoin}`);
            if (res.status === 404) {
                setError('Room not found. Please check the code and try again.');
                setLoading(false);
                return;
            }
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to verify room');
            }
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(e.message || 'Failed to verify room');
            setLoading(false);
            return;
        }
        setLoading(false);

        // Room exists - CLEAR any stale roomId from previous sessions
        // and store the validated code
        setRoomId(null as any); // Clear old roomId
        setPlayerId(null as any); // Clear old playerId so we use JOIN flow
        setRoomCode(codeToJoin); // Set the validated code

        // Proceed to name entry
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
            // Pre-fill code and trigger validation flow
            setRoomCode(code);

            // Validate room exists before going to naming mode
            const validateAndProceed = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/api/game/${code}`);
                    if (res.status === 404) {
                        setError('Room not found. Please check the link and try again.');
                        setLoading(false);
                        return;
                    }
                    if (!res.ok) {
                        setError('Failed to verify room');
                        setLoading(false);
                        return;
                    }

                    // Room valid - clear any stale session and proceed
                    setRoomId(null as any);
                    setPlayerId(null as any);
                    setLoading(false);
                    setNamingMode(true);
                    setIsSpectatorMode(false);
                } catch (e) {
                    setError('Failed to connect to server');
                    setLoading(false);
                }
            };

            validateAndProceed();
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
                                <h2 className="text-2xl font-bold text-white">
                                    {pendingAction === 'create' ? 'One more thing...' : "You're in!"}
                                </h2>
                                <p className="text-slate-400">
                                    {pendingAction === 'create' ? 'Enter your name to start the party' : <>Room: <span className="font-mono text-white">{roomCode}</span></>}
                                </p>
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
                        Skibidi.Games
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
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 gap-3 pt-4"
                                >

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
                                    <button onClick={() => setMode('join')} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold transition">
                                        <Users size={20} /> Join
                                    </button>
                                </motion.div>
                            )
                        )}

                        {/* Mode 'create' block Removed entirely */}

                        {mode === 'select-game' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 pt-4"
                            >
                                <h2 className="text-xl font-bold text-center text-white mb-4">Choose a Game</h2>
                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={() => handleGameSelect('guess-who')}
                                        className="flex items-center gap-4 bg-slate-800 hover:bg-blue-900/40 p-4 rounded-xl border border-slate-700 hover:border-blue-500 transition group text-left"
                                    >
                                        <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 group-hover:text-blue-300">
                                            <Search size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">Guess Who</div>
                                            <div className="text-sm text-slate-400">Classic deduction game</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleGameSelect('connect-4')}
                                        className="flex items-center gap-4 bg-slate-800 hover:bg-red-900/40 p-4 rounded-xl border border-slate-700 hover:border-red-500 transition group text-left"
                                    >
                                        <div className="p-3 bg-red-500/20 rounded-lg text-red-400 group-hover:text-red-300">
                                            <Grid3X3 size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">Connect 4</div>
                                            <div className="text-sm text-slate-400">Strategy vertical checker game</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleGameSelect('cah')}
                                        className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 hover:border-white transition group text-left"
                                    >
                                        <div className="p-3 bg-slate-900 rounded-lg text-white group-hover:text-slate-200 border border-slate-700">
                                            <Skull size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">Cards Against Humanity</div>
                                            <div className="text-sm text-slate-400">The party game for horrible people</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleGameSelect('dots-and-boxes')}
                                        className="flex items-center gap-4 bg-slate-800 hover:bg-teal-900/40 p-4 rounded-xl border border-slate-700 hover:border-teal-500 transition group text-left"
                                    >
                                        <div className="p-3 bg-teal-500/20 rounded-lg text-teal-400 group-hover:text-teal-300">
                                            <Grid3X3 size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">Dots & Boxes</div>
                                            <div className="text-sm text-slate-400">Classic strategy game</div>
                                        </div>
                                    </button>

                                    {/* Imposter Game Selection */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setSelectedGame('imposter')}
                                            className={`w-full flex items-center gap-4 bg-slate-800 hover:bg-purple-900/40 p-4 rounded-xl border transition group text-left ${selectedGame === 'imposter' ? 'border-purple-500 bg-purple-900/30' : 'border-slate-700 hover:border-purple-500'}`}
                                        >
                                            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400 group-hover:text-purple-300">
                                                <UserX size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white">Imposter</div>
                                                <div className="text-sm text-slate-400">Social deduction</div>
                                            </div>
                                        </button>

                                        {/* Sub-mode Selection */}
                                        {selectedGame === 'imposter' && (
                                            <div className="flex gap-2 pl-2">
                                                <button
                                                    onClick={() => setImposterSubMode('text')}
                                                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition ${imposterSubMode === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                                >
                                                    💬 Text Mode
                                                    <p className="text-xs font-normal opacity-70 mt-1">Type hints in-app</p>
                                                </button>
                                                <button
                                                    onClick={() => setImposterSubMode('irl')}
                                                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition ${imposterSubMode === 'irl' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                                >
                                                    🗣️ IRL Mode
                                                    <p className="text-xs font-normal opacity-70 mt-1">Speak hints aloud</p>
                                                </button>
                                            </div>
                                        )}

                                        {selectedGame === 'imposter' && (
                                            <button
                                                onClick={() => handleGameSelect('imposter')}
                                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition"
                                            >
                                                Continue with {imposterSubMode === 'text' ? 'Text' : 'IRL'} Mode
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => { setMode(null); setSelectedGame('guess-who'); }} className="w-full text-slate-500 text-sm hover:text-white pt-2">Cancel</button>
                            </motion.div>
                        )}

                        {(mode === 'join' || mode === 'spectate') && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 pt-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Room Code</label>
                                    <input
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="4-CHAR CODE"
                                        maxLength={4}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-center tracking-widest uppercase font-mono focus:ring-2 focus:ring-purple-500 outline-none transition"
                                        onKeyDown={(e) => e.key === 'Enter' && handleJoin(mode === 'spectate')}
                                    />
                                </div>
                                <button onClick={() => handleJoin(mode === 'spectate')} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl font-bold transition flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="animate-spin" /> : (mode === 'join' ? 'Join Game' : 'Spectate')}
                                </button>
                                <button onClick={() => setMode(null)} className="w-full text-slate-500 text-sm hover:text-white">Cancel</button>
                            </motion.div>
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
            <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-slate-600 text-sm">
                Made by Brennan Shea
            </p>
        </div>
    );
}
