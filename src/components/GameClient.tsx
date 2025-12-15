'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { getPusherClient } from '@/lib/pusher';
import { GameState, Player } from '@/lib/types';
import { Loader2, Menu, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Shared Components
import GameSidebar from '@/components/shared/GameSidebar';
import GuessWhoGame from '@/components/games/GuessWhoGame';
import Connect4Game from '@/components/games/Connect4Game';
import MonopolyGame from '@/components/games/MonopolyGame';

export default function GameClient({ roomId }: { roomId: string }) {
    const router = useRouter();
    const { playerId, game, setGame, setRoomId, clearGame } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLeaveParty = () => {
        // Don't clear the game - keep it cached so user can rejoin
        router.push('/');
    };

    // Initial Fetch & Subscribe
    useEffect(() => {
        setRoomId(roomId);

        // Fetch initial state
        fetch(`/api/game/${roomId}?playerId=${playerId || ''}`)
            .then(res => {
                if (res.status === 404) {
                    clearGame(); // Clear stale cache
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

        // Listen for party ended event
        channel.bind('party-ended', () => {
            console.log('Party ended by host');
            clearGame();
            router.push('/');
        });

        return () => {
            pusher.unsubscribe(`room-${roomId}`);
        };
    }, [roomId, playerId, router, setGame, setRoomId, clearGame]);

    const sendAction = useCallback(async (type: string, payload: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const res = await fetch('/api/game/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: roomId,
                playerId,
                type,
                payload
            })
        });
        const data = await res.json();
        return data;
    }, [roomId, playerId]);

    // Auto-Queue Next Match
    useEffect(() => {
        if (game?.matchStatus === 'finished' && game.hostId === playerId) {
            console.log('Match finished. Starting next match in 5s...');
            const timer = setTimeout(() => {
                sendAction('START_MATCH', null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [game?.matchStatus, game?.hostId, playerId, sendAction]);



    if (loading || !game) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-900/20 via-slate-950 to-red-900/20 flex items-center justify-center text-white">
                <Loader2 className="animate-spin w-10 h-10 text-yellow-500" />
            </div>
        );
    }

    // const host = game.players[game.hostId]; // Unused

    const sortPlayers = (a: Player, b: Player) => {
        if (a.id === game.hostId) return -1;
        if (b.id === game.hostId) return 1;
        return (a.name || '').localeCompare(b.name || '');
    };

    const activePlayers = Object.values(game.players)
        .filter(p => p.role === 'player' || (p.role === 'host' && p.characterId))
        .sort(sortPlayers);

    const spectators = Object.values(game.players)
        .filter(p => !activePlayers.find(ap => ap.id === p.id))
        .sort(sortPlayers);

    // Derived state for current user
    const myPlayer = game.players[playerId || ''];
    const iamHost = playerId === game.hostId;
    const iamActive = myPlayer?.role === 'player' || (iamHost && !!myPlayer?.characterId);
    const hasUnread = false; // TODO: Implement read receipts or count

    const sidebarProps = {
        game, playerId, roomId, copied, chatInput, setChatInput, sendAction, copyRoomCode, handleLeaveParty, iamHost, iamActive, activePlayers, spectators
    };

    return (
        <div className="h-[100dvh] bg-gradient-to-br from-yellow-900/20 via-slate-950 to-red-900/20 text-white flex flex-col md:flex-row overflow-hidden relative">

            {/* (A) Mobile Sidebar Drawer */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/80 z-[60] md:hidden backdrop-blur-sm"
                        />
                        <motion.div
                            className="fixed inset-y-0 left-0 w-[85%] sm:w-[350px] bg-slate-900 shadow-2xl z-[70] md:hidden border-r border-white/10"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        >
                            <GameSidebar {...sidebarProps} onClose={() => setIsSidebarOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* (B) Desktop Sidebar (Static) */}
            <div className="hidden md:flex flex-col w-1/4 bg-slate-900/50 border-r border-white/10 shrink-0">
                <GameSidebar {...sidebarProps} />
            </div>

            {/* Main Main Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* HOST OVERLAY LOGIC */}
                {iamHost && game.matchStatus === 'lobby' && (
                    <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 pt-20">
                        <div className="bg-slate-900 border border-yellow-500/30 p-6 rounded-2xl max-w-lg w-full shadow-2xl overflow-y-auto max-h-[80vh]">
                            <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Host Controls</h2>

                            <div className="flex flex-col gap-6">
                                <div>
                                    <h3 className="font-bold text-slate-300 mb-2">Waitlist / Queue</h3>
                                    <div className="bg-slate-950/50 rounded-lg p-2 min-h-[100px] border border-white/5">
                                        {game.queue.length === 0 ? (
                                            <p className="text-slate-500 italic text-center py-4">Queue is empty.</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {game.queue.map((qid, idx) => (
                                                    <li key={qid} className="flex justify-between bg-slate-800 p-2 rounded text-sm">
                                                        <span>{idx + 1}. {game.players[qid]?.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
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
                <div className="p-2 sm:p-4 bg-slate-900/80 border-b border-white/10 flex justify-between items-center backdrop-blur-md z-50 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Toggle & Room Code */}
                        <div className="flex items-center gap-2 md:hidden">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 -ml-2 text-slate-400 hover:text-white relative"
                            >
                                <Menu size={20} />
                                {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
                            </button>
                            <button
                                onClick={copyRoomCode}
                                className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded border border-white/10 text-xs"
                            >
                                <span className="text-slate-400">Code:</span>
                                <span className="font-mono text-white font-bold">{roomId}</span>
                                {copied && <Check size={10} className="text-green-400" />}
                            </button>
                        </div>


                        {/* Desktop Room Code (Only if needed, but sidebar covers it usually) */}

                        <div className="font-bold text-sm sm:text-lg overflow-hidden h-8 flex items-center">
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
                                            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse" />
                                            YOUR TURN
                                        </motion.span> :
                                        <motion.span
                                            key="opp-turn"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                            className="text-yellow-400 flex items-center gap-2"
                                        >
                                            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full animate-pulse" />
                                            OPPONENT&apos;S TURN
                                        </motion.span>
                                ) : game.matchStatus === 'finished' ? (
                                    <motion.span
                                        key="finished"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-blue-400 text-xs sm:text-base"
                                    >
                                        GAME OVER - {game.players[game.winnerId || '']?.name} WINS!
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="status"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-yellow-400 text-xs sm:text-base"
                                    >
                                        WAITING
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Host Force End Button */}
                    {iamHost && game.matchStatus === 'playing' && (
                        <button onClick={() => sendAction('FORFEIT', null)} className="text-[10px] sm:text-xs bg-red-900/20 text-red-500 px-2 py-1 rounded hover:bg-red-900/40 whitespace-nowrap">
                            Force End
                        </button>
                    )}
                </div>

                {/* GAME AREA */}
                {game.gameType === 'guess-who' ? (
                    <GuessWhoGame
                        game={game}
                        playerId={playerId!}
                        activePlayers={activePlayers}
                        iamActive={iamActive}
                        iamHost={iamHost}
                    />
                ) : game.gameType === 'monopoly' ? (
                    <MonopolyGame
                        game={game}
                        playerId={playerId!}
                        activePlayers={activePlayers}
                        iamActive={iamActive}
                        iamHost={iamHost}
                        sendAction={sendAction}
                    />
                ) : game.gameType === 'connect-4' ? (
                    <Connect4Game
                        game={game}
                        playerId={playerId!}
                        activePlayers={activePlayers}
                        iamActive={iamActive}
                        iamHost={iamHost}
                        sendAction={sendAction}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-red-500">Unknown Game Type</div>
                )}
            </div>
        </div>
    );
}
