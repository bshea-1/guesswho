'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { getPusherClient } from '@/lib/pusher';
import { GameState } from '@/lib/types'; // Assuming this import works now
import { Loader2 } from 'lucide-react';
import GameBoard from './GameBoard'; // Will create next
import GameControls from './GameControls'; // Will create next
import GameLog from './GameLog'; // Will create next

export default function GameClient({ roomId }: { roomId: string }) {
    const router = useRouter();
    const { playerId, game, setGame, setRoomId } = useGameStore();
    const [loading, setLoading] = useState(true);

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
            // Optimistic update or overwrite? Overwrite for now.
            console.log('Received game update', newGameState);
            setGame(newGameState);
        });

        return () => {
            pusher.unsubscribe(`room-${roomId}`);
        };
    }, [roomId, playerId, router, setGame, setRoomId]);

    if (loading || !game) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar: Log and Metadata */}
            <div className="w-full md:w-1/4 border-r border-white/10 flex flex-col bg-slate-900/50">
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-bold text-xl">{game.settings.mode.toUpperCase()} MODE</h2>
                    <div className="flex justify-between text-sm text-slate-400 mt-1">
                        <span>Room: <span className="font-mono text-white">{roomId}</span></span>
                        <span>Spectators: {game.spectators}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <GameLog history={game.history} />
                </div>
            </div>

            {/* Main Area: Board and Controls */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Bar: Status */}
                <div className="p-4 bg-slate-900/80 border-b border-white/10 flex justify-between items-center backdrop-blur-md z-10">
                    <div className="font-bold text-lg">
                        {game.status === 'playing' ? (
                            game.turnPlayerId === playerId ?
                                <span className="text-green-400">YOUR TURN</span> :
                                <span className="text-red-400">OPPONENT'S TURN</span>
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
