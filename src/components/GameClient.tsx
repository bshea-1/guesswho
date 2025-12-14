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

export default function GameClient({ roomId }: { roomId: string }) {
    const router = useRouter();
    const { playerId, game, setGame, setRoomId } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

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

    if (loading || !game) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-900/20 via-slate-950 to-red-900/20 flex items-center justify-center text-white">
                <Loader2 className="animate-spin w-10 h-10 text-yellow-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-900/20 via-slate-950 to-red-900/20 text-white flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar: Log and Metadata */}
            <div className="w-full md:w-1/4 border-r border-white/10 flex flex-col bg-slate-900/50">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-bold text-xl text-yellow-400">{game.settings.mode.toUpperCase()} MODE</h2>
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                            title="Leave Game"
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
                    <div className="text-xs text-slate-500 mt-1">Spectators: {game.spectators}</div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <GameLog history={game.history} game={game} playerId={playerId} />
                </div>
            </div>

            {/* Main Area: Board and Controls */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Bar: Status */}
                <div className="p-4 bg-slate-900/80 border-b border-white/10 flex justify-between items-center backdrop-blur-md z-10">
                    <div className="font-bold text-lg">
                        {game.status === 'playing' ? (
                            game.turnPlayerId === playerId ?
                                <span className="text-green-400 flex items-center gap-2">
                                    <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                                    YOUR TURN
                                </span> :
                                <span className="text-yellow-400 flex items-center gap-2">
                                    <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                                    OPPONENT'S TURN
                                </span>
                        ) : game.status === 'finished' ? (
                            <span className={game.winnerId === playerId ? 'text-green-400' : 'text-red-400'}>
                                {game.winnerId === playerId ? '🎉 YOU WON!' : '😔 GAME OVER'}
                            </span>
                        ) : (
                            <span className="text-yellow-400">{game.status.toUpperCase()}</span>
                        )}
                    </div>
                </div>

                {/* Board Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50">
                    <GameBoard game={game} playerId={playerId} />
                </div>

                {/* Controls Area */}
                <div className="p-4 bg-slate-900 border-t border-white/10">
                    <GameControls game={game} playerId={playerId} />
                </div>
            </div>
        </div>
    );
}
