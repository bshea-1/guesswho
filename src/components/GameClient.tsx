'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { getPusherClient } from '@/lib/pusher';
import { GameState } from '@/lib/types';
import { Loader2, Copy, Check, Home } from 'lucide-react';
import GameBoard from './GameBoard';
import GameControls from './GameControls';
import GameLog from './GameLog';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameClient({ roomId }: { roomId: string }) {
    const router = useRouter();
    const { playerId, game, setGame, setRoomId } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [chatInput, setChatInput] = useState('');

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Initial Fetch & Subscribe
    useEffect(() => {
        setRoomId(roomId);

        // Fetch initial state
        fetch(`/api/game/${roomId}?playerId=${playerId || ''}`)
            .then(res => {
                if (res.status === 404) {
                    router.push('/');
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (data && !data.error) {
                    setGame(data);
                    setLoading(false);
                }
            })
            .catch(console.error);

        // Subscribe to Pusher
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`room-${roomId}`);

        channel.bind('game-update', (newGameState: GameState) => {
            console.log('Received game update', newGameState);
            setGame(newGameState);
        });

        return () => {
            pusher.unsubscribe(`room-${roomId}`);
        };
    }, [roomId, playerId, router, setGame, setRoomId]);

    const sendAction = async (type: string, payload: any) => {
        await fetch('/api/game/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: roomId,
                playerId,
                type,
                payload
            })
        });
    };

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        sendAction('CHAT', { text: chatInput });
        setChatInput('');
    };

    if (loading || !game) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-900/20 via-slate-950 to-red-900/20 flex items-center justify-center text-white">
                <Loader2 className="animate-spin w-10 h-10 text-yellow-500" />
            </div>
        );
    }

    const host = game.players[game.hostId];
    const activePlayers = Object.values(game.players).filter(p => p.role === 'player' || (p.role === 'host' && p.characterId)); // Host can play
    const spectators = Object.values(game.players).filter(p => !activePlayers.find(ap => ap.id === p.id) && p.id !== game.hostId); // Everyone else (excluding host and active players)

    // Correction: Spectators are everyone NOT playing. Host is separated.
    // Let's rely on 'role' property if valid, or deduce it.
    // Active players = anyone with role 'player' OR (role 'host' and game.matchStatus === 'playing'?)
    // Actually, `activePlayers` logic above relies on characterId mostly.

    // Derived state for current user
    const myPlayer = game.players[playerId || ''];
    const iamHost = playerId === game.hostId;
    const iamActive = myPlayer?.role === 'player' || (iamHost && !!myPlayer?.characterId);

    // Chat visibility strategy:
    // "Spectator messages must NOT be visible to the active players"
    // "Host can see spectator chat"
    // So: Visible if YOU are Host OR YOU are Spectator. Hidden if YOU are Active Player.
    const showChat = !iamActive || iamHost;

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-900/20 via-slate-950 to-red-900/20 text-white flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar: Party Info & Chat */}
            <div className="w-full md:w-1/4 border-r border-white/10 flex flex-col bg-slate-900/50">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-bold text-xl text-yellow-400">Guess Who Party</h2>
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                            title="Leave Party"
                        >
                            <Home size={18} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Room:</span>
                        <span className="font-mono text-white bg-slate-800 px-2 py-1 rounded">{roomId}</span>
                        <button
                            onClick={copyRoomCode}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                            title="Copy Room Code"
                        >
                            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                {/* Participants List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Host Section */}
                    <div>
                        <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-2">Host</h3>
                        <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-700/50 p-2 rounded-lg">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                            <span className="font-medium text-yellow-200">{host?.name || 'Unknown'}</span>
                        </div>
                    </div>

                    {/* Active Players */}
                    <div>
                        <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2">Active Match</h3>
                        {activePlayers.length > 0 ? (
                            <div className="space-y-2">
                                {activePlayers.map(p => (
                                    <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg bg-green-900/20 border border-green-700/30 ${game.turnPlayerId === p.id ? 'ring-1 ring-green-500' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            {game.turnPlayerId === p.id && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                                            <span className="font-medium text-white">{p.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-slate-500 text-sm italic">No match in progress</div>
                        )}
                    </div>

                    {/* Spectators & Queue */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Spectators ({spectators.length})</h3>
                        <div className="space-y-1">
                            {spectators.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition text-sm">
                                    <span className="text-slate-300">{p.name}</span>
                                    {game.queue.includes(p.id) && (
                                        <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded">IN QUEUE</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Queue Actions */}
                        {!iamActive && !iamHost && (
                            <div className="mt-2">
                                {game.queue.includes(playerId!) ? (
                                    <button onClick={() => sendAction('LEAVE_QUEUE', null)} className="w-full text-xs bg-red-900/30 text-red-400 py-2 rounded hover:bg-red-900/50">Leave Queue</button>
                                ) : (
                                    <button onClick={() => sendAction('JOIN_QUEUE', null)} className="w-full text-xs bg-blue-600 text-white py-2 rounded hover:bg-blue-500">Join Next Up Queue</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Widget */}
                <div className="h-1/3 border-t border-white/10 flex flex-col bg-black/20">
                    <div className="p-2 bg-slate-900/80 text-xs font-bold text-slate-400 flex justify-between">
                        <span>PARTY CHAT</span>
                        {!showChat && <span className="text-red-400">HIDDEN (Playing)</span>}
                    </div>

                    {showChat ? (
                        <>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {game.chat?.map((msg) => (
                                    <div key={msg.id} className="text-sm">
                                        <span className="font-bold text-slate-400 text-xs mr-2">{game.players[msg.playerId]?.name}:</span>
                                        <span className="text-slate-200">{msg.text}</span>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleChatSubmit} className="p-2 border-t border-white/5 flex gap-2">
                                <input
                                    className="flex-1 bg-slate-800 text-white text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Say something..."
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                />
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-4 text-center">
                            <p className="text-slate-500 text-xs">Chat hidden to prevent spoilers while playing.</p>
                        </div>
                    )}
                </div>
            </div>


            {/* Main Area: Board or Host Controls */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

                {/* HOST OVERLAY LOGIC */}
                {iamHost && game.matchStatus === 'lobby' && (
                    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-8">
                        <div className="bg-slate-900 border border-yellow-500/30 p-8 rounded-2xl max-w-2xl w-full shdow-2xl">
                            <h2 className="text-3xl font-bold text-yellow-400 mb-6">Host Controls</h2>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold text-slate-300 mb-4">Waitlist / Queue</h3>
                                    {game.queue.length === 0 ? (
                                        <p className="text-slate-500 italic">Queue is empty.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {game.queue.map((qid, idx) => (
                                                <li key={qid} className="flex justify-between bg-slate-800 p-3 rounded">
                                                    <span>{idx + 1}. {game.players[qid]?.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <button
                                        disabled={game.queue.length < 2}
                                        onClick={() => sendAction('START_MATCH', null)}
                                        className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl text-xl transition shadow-lg"
                                    >
                                        Start Next Match
                                    </button>
                                    <p className="text-slate-500 text-xs text-center mt-2">Needs at least 2 players in queue</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* Top Bar: Status */}
                <div className="p-4 bg-slate-900/80 border-b border-white/10 flex justify-between items-center backdrop-blur-md z-10">
                    <div className="font-bold text-lg overflow-hidden h-8 flex items-center">
                        <AnimatePresence mode="wait">
                            {game.matchStatus === 'playing' ? (
                                game.turnPlayerId === playerId ?
                                    <motion.span
                                        key="my-turn"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -20, opacity: 0 }}
                                        className="text-green-400 flex items-center gap-2"
                                    >
                                        <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                                        YOUR TURN
                                    </motion.span> :
                                    <motion.span
                                        key="opp-turn"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -20, opacity: 0 }}
                                        className="text-yellow-400 flex items-center gap-2"
                                    >
                                        <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                                        OPPONENT'S TURN
                                    </motion.span>
                            ) : game.matchStatus === 'finished' ? (
                                <motion.span
                                    key="finished"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-blue-400"
                                >
                                    GAME OVER - {game.players[game.winnerId || '']?.name} WINS!
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="status"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-yellow-400"
                                >
                                    WAITING FOR MATCH...
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* Host Force End Button */}
                    {iamHost && game.matchStatus === 'playing' && (
                        <button onClick={() => sendAction('FORFEIT', null)} className="text-xs bg-red-900/20 text-red-500 px-3 py-1 rounded hover:bg-red-900/40">
                            Force End Match
                        </button>
                    )}
                </div>

                {/* Board Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50 relative">
                    {/* If match not playing and not host overlay, show "Waiting" */}
                    {game.matchStatus === 'lobby' && !iamHost && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-20" />
                            <p className="text-xl font-light">Waiting for Host to start match...</p>
                        </div>
                    )}

                    {/* Show board only if playing or finished */}
                    {(game.matchStatus === 'playing' || game.matchStatus === 'finished') && (
                        <GameBoard game={game} playerId={playerId} />
                    )}
                </div>

                {/* Controls Area (Only for Active Players) */}
                {iamActive && game.matchStatus === 'playing' && (
                    <div className="p-4 bg-slate-900 border-t border-white/10">
                        <GameControls game={game} playerId={playerId} />
                    </div>
                )}
            </div>
        </div>
    );
}
