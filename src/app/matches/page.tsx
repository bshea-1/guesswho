'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Tv, Check } from 'lucide-react';
import { useGameStore } from '@/lib/store';

type MatchSummary = {
    roomId: string;
    hostName: string;
    spectators: number;
    createdAt: number;
    status: string;
    mode: string;
};

export default function MatchesPage() {
    const router = useRouter();
    const { username, setUsername, setPlayerId, setRoomId } = useGameStore();

    const [matches, setMatches] = useState<MatchSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
    const [namingMode, setNamingMode] = useState(false);
    const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
    const [joinedPlayerId, setJoinedPlayerId] = useState<string | null>(null);
    const [localName, setLocalName] = useState(username);
    const [error, setError] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');

    useEffect(() => {
        fetch('/api/matches')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMatches(data);
                setLoading(false);
            });
    }, []);

    const handleWatch = async (roomId: string) => {
        setJoiningRoomId(roomId);
        setError('');

        try {
            // Join as spectator
            const res = await fetch('/api/room/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: roomId,
                    playerName: undefined,
                    isSpectator: true
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Store the IDs temporarily for name submission
            setJoinedPlayerId(data.playerId);
            setJoinedRoomId(data.roomId);

            // Show name prompt
            setNamingMode(true);
            setJoiningRoomId(null);
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(e.message);
            setJoiningRoomId(null);
        }
    };

    const handleNameSubmit = async () => {
        if (!localName.trim()) { setError('Name is required'); return; }
        setLoading(true);
        setError('');
        setLoadingMessage('Joining as spectator...');

        try {
            setUsername(localName);

            // Send UPDATE_NAME action
            await fetch('/api/game/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: joinedRoomId,
                    playerId: joinedPlayerId,
                    type: 'UPDATE_NAME',
                    payload: localName
                })
            });

            // Store in global state
            setPlayerId(joinedPlayerId);
            setRoomId(joinedRoomId);

            // Navigate to game
            router.push(`/game/${joinedRoomId}`);
        } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(e.message);
            setLoading(false);
            setLoadingMessage('');
        }
    };

    // Name entry mode
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
                            <Loader2 className="animate-spin w-12 h-12 text-purple-500" />
                            <p className="text-xl font-medium text-purple-300">{loadingMessage}</p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center">
                                <div className="inline-block p-3 rounded-full bg-purple-500/20 text-purple-400 mb-4">
                                    <Tv size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Joining as Spectator</h2>
                                <p className="text-slate-400">Room: <span className="font-mono text-white">{joinedRoomId}</span></p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">What should we call you?</label>
                                <input
                                    value={localName}
                                    onChange={(e) => setLocalName(e.target.value)}
                                    placeholder="Enter display name..."
                                    autoFocus
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                                    onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                                />
                            </div>

                            <button onClick={handleNameSubmit} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl font-bold transition flex items-center justify-center gap-2">
                                <Check size={20} /> Start Watching
                            </button>

                            <button
                                onClick={() => {
                                    // Anonymous watch logic
                                    setPlayerId(joinedPlayerId);
                                    setRoomId(joinedRoomId);
                                    setUsername('Spectator');
                                    router.push(`/game/${joinedRoomId}`);
                                }}
                                disabled={loading}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
                            >
                                <Tv size={20} /> Watch Anonymously
                            </button>

                            <button
                                onClick={() => { setNamingMode(false); setJoinedRoomId(null); setJoinedPlayerId(null); }}
                                className="w-full text-slate-500 text-sm hover:text-white"
                            >
                                Cancel
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
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-3xl font-bold">Public Matches</h1>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {matches.length === 0 ? (
                            <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-white/5">
                                No active public matches found.
                            </div>
                        ) : (
                            matches.map(match => (
                                <div key={match.roomId} className="bg-slate-900/80 border border-white/10 p-6 rounded-xl flex justify-between items-center hover:border-blue-500/50 transition">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-blue-400 font-bold">{match.roomId}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{match.mode.toUpperCase()}</span>
                                            {match.status === 'playing' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800 animate-pulse">LIVE</span>}
                                        </div>
                                        <p className="text-slate-300">Host: <span className="text-white font-medium">{match.hostName}</span></p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right text-sm text-slate-500">
                                            <p>{match.spectators} Watching</p>
                                        </div>
                                        <button
                                            onClick={() => handleWatch(match.roomId)}
                                            disabled={joiningRoomId === match.roomId}
                                            className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
                                        >
                                            {joiningRoomId === match.roomId ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Tv size={18} />
                                            )}
                                            Watch
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
