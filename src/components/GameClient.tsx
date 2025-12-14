'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { getPusherClient } from '@/lib/pusher';
import { GameState, Player, Turn } from '@/lib/types';
import { Loader2, Copy, Check, Home, Crown, UserX, LogOut, Menu, X, ChevronUp, ChevronDown } from 'lucide-react';
import GameBoard from '@/components/GameBoard';
import GameControls from '@/components/GameControls';
import { motion, AnimatePresence } from 'framer-motion';

// Helper Components for Board Views
function ActivePlayerView({ game, playerId, activePlayers }: { game: GameState, playerId: string, activePlayers: Player[] }) {
    const [viewMode, setViewMode] = useState<'my_board' | 'opponent_board'>('my_board');

    // Identify opponent
    const opponent = activePlayers.find(p => p.id !== playerId);

    if (!opponent) return <div className="text-center text-slate-500 mt-10">Waiting for opponent...</div>;

    const targetPlayerId = viewMode === 'my_board' ? playerId : opponent.id;

    return (
        <div className="flex flex-col h-full relative">
            {/* View Toggle - Floating on Mobile or Top Centered */}
            <div className="sticky top-0 z-10 flex justify-center py-2 pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur pointer-events-auto p-1 rounded-full flex border border-white/10 shadow-xl">
                    <button
                        onClick={() => setViewMode('my_board')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'my_board'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        My Board
                    </button>
                    <button
                        onClick={() => setViewMode('opponent_board')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === 'opponent_board'
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Opponent ({opponent.name})
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-1 sm:px-4 pb-4">
                <GameBoard
                    game={game}
                    targetPlayerId={targetPlayerId}
                    viewerId={playerId}
                />
            </div>
        </div>
    );
}

function SpectatorView({ game, activePlayers, viewerId }: { game: GameState, activePlayers: Player[], viewerId: string }) {
    if (activePlayers.length < 2) return <div className="text-center text-slate-500 mt-10">Waiting for players...</div>;

    const [player1, player2] = activePlayers;
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>(player1.id);

    // Ensure selected player is still valid (e.g. if players change)
    useEffect(() => {
        if (!activePlayers.find(p => p.id === selectedPlayerId)) {
            setSelectedPlayerId(activePlayers[0]?.id);
        }
    }, [activePlayers, selectedPlayerId]);

    const targetPlayer = activePlayers.find(p => p.id === selectedPlayerId) || player1;

    return (
        <div className="flex flex-col h-full">
            {/* View Toggle */}
            <div className="sticky top-0 z-10 flex justify-center py-2 pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur pointer-events-auto p-1 rounded-full flex border border-white/10 shadow-xl overflow-hidden">
                    {activePlayers.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPlayerId(p.id)}
                            className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-2 rounded-full ${selectedPlayerId === p.id
                                ? 'bg-slate-700 text-white shadow-lg'
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {/* Turn Indicator Dot */}
                            {game.turnPlayerId === p.id && (
                                <span className={`w-2 h-2 rounded-full animate-pulse ${p.id === player1.id ? 'bg-green-400' : 'bg-yellow-400'}`} />
                            )}
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-900/30 rounded-xl border border-white/5 p-2 mb-2">
                <GameBoard
                    game={game}
                    targetPlayerId={targetPlayer.id}
                    viewerId={viewerId}
                />
            </div>
        </div>
    );
}

// Extracted Sidebar Content Component
function GameSidebar({
    game,
    // eslint-disable-next-line @unused-vars
    playerId,
    roomId,
    copied,
    chatInput,
    setChatInput,
    sendAction,
    copyRoomCode,
    handleLeaveParty,
    iamHost,
    iamActive,
    activePlayers,
    spectators,
    onClose
}: {
    game: GameState;
    playerId: string | null;
    roomId: string;
    copied: boolean;
    chatInput: string;
    setChatInput: (s: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendAction: (t: string, p: any) => void;
    copyRoomCode: () => void;
    handleLeaveParty: () => void;
    iamHost: boolean;
    iamActive: boolean;
    activePlayers: Player[];
    spectators: Player[];
    onClose?: () => void;
}) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/10 relative">
                {onClose && (
                    <button onClick={onClose} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-white md:hidden">
                        <X size={24} />
                    </button>
                )}
                <div className="flex items-center justify-between mb-2 pr-8 md:pr-0">
                    <h2 className="font-bold text-xl text-yellow-400">Guess Who</h2>
                    <div className="flex items-center gap-1 md:flex">
                        {iamHost && (
                            <button
                                onClick={() => {
                                    if (confirm('End this party? Everyone will be disconnected.')) {
                                        sendAction('END_PARTY', null);
                                    }
                                }}
                                className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30 transition"
                                title="End Party"
                            >
                                <LogOut size={18} />
                            </button>
                        )}
                        <button
                            onClick={handleLeaveParty}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                            title="Leave Party"
                        >
                            <Home size={18} />
                        </button>
                    </div>
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
                {/* Active Match Section */}
                <div>
                    <h3 className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2">Active Match</h3>
                    {activePlayers.length > 0 ? (
                        <div className="space-y-2">
                            {activePlayers.map(p => (
                                <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg bg-green-900/20 border border-green-700/30 ${game.turnPlayerId === p.id ? 'ring-1 ring-green-500' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        {game.hostId === p.id && <Crown size={14} className="text-yellow-400 fill-yellow-400" />}
                                        {game.turnPlayerId === p.id && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                                        <div className="flex flex-col leading-tight">
                                            <span className="font-medium text-white">{p.name}</span>
                                            <span className="text-[10px] text-slate-400">{p.wins || 0} Wins</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-slate-500 text-sm italic">No match in progress</div>
                    )}
                </div>

                {/* Spectators & Queue Section */}
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Spectators ({spectators.length})</h3>
                    <div className="space-y-1">
                        {spectators.map(p => (
                            <div
                                key={p.id}
                                className={`flex items-center justify-between p-2 rounded-lg transition text-sm ${iamHost ? 'hover:bg-slate-800' : ''}`}
                            >
                                <div
                                    className={`flex items-center gap-2 flex-1 ${iamHost ? 'cursor-pointer' : ''}`}
                                    onClick={() => iamHost ? sendAction('TOGGLE_QUEUE_PLAYER', { targetId: p.id }) : null}
                                >
                                    {game.hostId === p.id && <Crown size={14} className="text-yellow-400 fill-yellow-400" />}
                                    <span className="text-slate-300">{p.name} <span className="text-slate-500 text-[10px]">({p.wins || 0} Wins)</span></span>
                                    {game.queue.includes(p.id) && (
                                        <span className="text-[10px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            IN QUEUE
                                            {iamHost && <span className="opacity-50 text-[8px]">(click to remove)</span>}
                                        </span>
                                    )}
                                </div>
                                {iamHost && p.id !== game.hostId && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Ban ${p.name} from this room? They will not be able to rejoin.`)) {
                                                sendAction('BAN_PLAYER', { targetId: p.id });
                                            }
                                        }}
                                        className="p-1 text-red-500/50 hover:text-red-400 hover:bg-red-900/30 rounded transition"
                                        title={`Ban ${p.name}`}
                                    >
                                        <UserX size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {spectators.length === 0 && <p className="text-slate-600 text-xs italic">No spectators</p>}

                    {iamHost && spectators.length > 0 && (
                        <p className="text-[10px] text-slate-500 mt-2 text-center">Click a spectator to add/remove from queue</p>
                    )}
                </div>
            </div>

            {/* Chat Widget */}
            <div className="h-[35%] md:h-1/3 border-t border-white/10 flex flex-col bg-black/20 pb-safe">
                <div className="flex border-b border-white/5 bg-slate-900/80">
                    <div
                        className={`flex-1 p-2 text-center text-xs font-bold cursor-default transition ${!iamActive ? 'text-yellow-400 bg-white/5' : 'text-slate-600 opacity-50'}`}
                    >
                        PARTY CHAT
                    </div>
                    <div
                        className={`flex-1 p-2 text-center text-xs font-bold cursor-default transition ${iamActive ? 'text-green-400 bg-white/5' : 'text-slate-600 opacity-50'}`}
                    >
                        GAME CHAT
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {game.chat
                        ?.filter(msg => {
                            const scope = msg.scope || 'party'; // Legacy support
                            if (iamActive) return scope === 'game';
                            return scope === 'party';
                        })
                        .map((msg) => (
                            <div key={msg.id} className="text-sm">
                                <span className={`font-bold text-xs mr-2 ${msg.scope === 'game' ? 'text-green-400' : 'text-slate-400'}`}>{game.players[msg.playerId]?.name}:</span>
                                <span className="text-slate-200">{msg.text}</span>
                            </div>
                        ))}
                    {/* Empty states */}
                    {game.chat?.filter(m => (m.scope || 'party') === (iamActive ? 'game' : 'party')).length === 0 && (
                        <div className="text-slate-600 text-xs italic text-center mt-4">
                            {iamActive ? "Chat with your opponent here..." : "Chat with other spectators..."}
                        </div>
                    )}

                    {/* Info Message for why the other tab is disabled */}
                    {iamActive && (
                        <div className="mt-4 p-2 bg-yellow-900/10 border border-yellow-500/10 rounded text-center">
                            <p className="text-[10px] text-yellow-500/50">Party chat hidden to prevent spoilers</p>
                        </div>
                    )}
                </div>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!chatInput.trim()) return;
                    sendAction('CHAT', {
                        text: chatInput,
                        scope: iamActive ? 'game' : 'party'
                    });
                    setChatInput('');
                }} className="p-2 border-t border-white/5 flex gap-2">
                    <input
                        className="flex-1 bg-slate-800 text-white text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={iamActive ? "Message opponent..." : "Message party..."}
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                    />
                </form>
            </div>
        </div>
    );
}

export default function GameClient({ roomId }: { roomId: string }) {
    const router = useRouter();
    const { playerId, game, setGame, setRoomId, clearGame } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [questionsExpanded, setQuestionsExpanded] = useState(true);

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

                {/* Question Display */}
                {(() => {
                    const history = [...game.history];
                    const questions = history.filter(t => t.action === 'ask');

                    const latestQ = questions[questions.length - 1];
                    const previousQ = questions[questions.length - 2];

                    const getAnswerFor = (qTurn: Turn) => {
                        // Find the first answer AFTER this question's index
                        const qIndex = history.indexOf(qTurn);
                        if (qIndex === -1) return null;
                        return history.slice(qIndex + 1).find(t => t.action === 'answer');
                    };

                    const latestA = latestQ ? getAnswerFor(latestQ) : null;
                    const previousA = previousQ ? getAnswerFor(previousQ) : null;

                    const renderQABlock = (q: Turn, a: Turn | undefined | null, isCurrent: boolean) => {
                        if (!q) return null;
                        const isMyQ = q.playerId === playerId;
                        const askerName = isMyQ ? 'You' : (game.players[q.playerId]?.name || 'Opponent');

                        let answerColor = 'text-green-400';
                        if (a?.content?.toLowerCase() === 'no') answerColor = 'text-red-400';
                        if (a?.content?.toLowerCase() === 'yes') answerColor = 'text-green-400';

                        return (
                            <div className={`p-2 sm:p-3 backdrop-blur-sm border-b ${isCurrent ? 'bg-blue-900/30 border-blue-500/30' : 'bg-slate-900/40 border-slate-700/30'} flex flex-col gap-1 items-center animate-slide-in relative`}>
                                <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-wider font-bold opacity-70">
                                    <span className={isCurrent ? "text-blue-400" : "text-slate-500"}>
                                        {isCurrent ? "New Question" : "Last Question"}
                                    </span>
                                </div>

                                <div className="text-white font-medium italic text-center text-sm sm:text-base">
                                    &quot;{q.content}&quot;
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                        {askerName} Asked
                                    </span>
                                    {a ? (
                                        <>
                                            <span className="text-slate-600">•</span>
                                            <span className={`text-[10px] ${answerColor} uppercase tracking-wider font-bold`}>
                                                {a.playerId === playerId ? 'You' : (game.players[a.playerId]?.name || 'They')} Answered: {a.content}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-slate-600">•</span>
                                            <span className="text-[10px] text-yellow-500/50 uppercase tracking-wider italic">
                                                Waiting for answer...
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    };

                    if (!latestQ && !previousQ) return null;

                    return (
                        <div className="flex flex-col shrink-0">
                            {/* Toggle for history */}
                            <button
                                onClick={() => setQuestionsExpanded(!questionsExpanded)}
                                className="w-full bg-slate-900/50 hover:bg-slate-800 text-xs text-slate-500 py-1 flex items-center justify-center gap-1 border-b border-white/5"
                            >
                                {questionsExpanded ? (
                                    <> <ChevronUp size={12} /> Hide History</>
                                ) : (
                                    <> <ChevronDown size={12} /> Show Q&A History</>
                                )}
                            </button>

                            <AnimatePresence>
                                {questionsExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        {previousQ && renderQABlock(previousQ, previousA, false)}
                                        {latestQ && renderQABlock(latestQ, latestA, true)}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* If collapsed, show mini latest */}
                            {!questionsExpanded && latestQ && (
                                <div className="p-2 bg-blue-900/10 border-b border-blue-500/10 flex items-center justify-between text-xs px-4">
                                    <span className="opacity-70 truncate italic max-w-[70%]">&quot;{latestQ.content}&quot;</span>
                                    {latestA ? (
                                        <span className={`font-bold ${latestA.content.toLowerCase() === 'no' ? 'text-red-400' : 'text-green-400'}`}>{latestA.content}</span>
                                    ) : (
                                        <span className="text-yellow-500/50 italic">Waiting...</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Board Area */}
                <div className="flex-1 overflow-hidden p-0 bg-slate-950/50 relative flex flex-col">
                    {/* If match not playing and not host overlay, show "Waiting" */}
                    {game.matchStatus === 'lobby' && !iamHost && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-20" />
                            <p className="text-xl font-light">Waiting for Host to start match...</p>
                        </div>
                    )}

                    {/* Show board only if playing or finished */}
                    {(game.matchStatus === 'playing' || game.matchStatus === 'finished') && (
                        <>
                            {iamActive ? (
                                <ActivePlayerView
                                    game={game}
                                    playerId={playerId!}
                                    activePlayers={activePlayers}
                                />
                            ) : (
                                <SpectatorView
                                    game={game}
                                    activePlayers={activePlayers}
                                    viewerId={playerId!} // Pass viewerId for role checks
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Controls Area (Only for Active Players) */}
                {iamActive && game.matchStatus === 'playing' && (
                    <div className="p-2 sm:p-4 bg-slate-900 border-t border-white/10 shrink-0 z-20 pb-safe">
                        <GameControls game={game} playerId={playerId} />
                    </div>
                )}
            </div>
        </div>
    );
}
