import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { GameState, Player } from '@/lib/types';
import { Loader2, Copy, Check, Home, Crown, UserX, LogOut, Menu, X, UserMinus } from 'lucide-react';
import QueueManager from './QueueManager';
import ConfirmationModal from './ConfirmationModal';

// Extracted Sidebar Content Component
export default function GameSidebar({
    game,
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
    onClose,
    onShowTransfer,
    onShowConfirmation
}: {
    game: GameState;
    playerId: string | null;
    roomId: string;
    copied: boolean;
    chatInput: string;
    setChatInput: (s: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendAction: (t: string, p: any) => Promise<any>;
    copyRoomCode: () => void;
    handleLeaveParty: () => void;
    iamHost: boolean;
    iamActive: boolean;
    activePlayers: Player[];
    spectators: Player[];
    onClose?: () => void;
    onShowTransfer: () => void;
    onShowConfirmation: (config: {
        title: string;
        message: string;
        confirmText?: string;
        isDanger?: boolean;
        onConfirm: () => void;
    }) => void;
}) {
    const [activeTab, setActiveTab] = useState<'participants' | 'queue'>('participants');
    const { setGame } = useGameStore();

    const [pendingMessages, setPendingMessages] = useState<any[]>([]);

    // Clear pending messages when they appear in server state
    useEffect(() => {
        if (pendingMessages.length > 0) {
            const serverIds = new Set(game.chat.map(m => m.id));
            setPendingMessages(prev => prev.filter(m => !serverIds.has(m.id)));
        }
    }, [game.chat, pendingMessages.length]);

    // Tab state for chat
    const [activeChatTab, setActiveChatTab] = useState<'party' | 'game'>(iamActive ? 'game' : 'party');

    // Auto-switch to game chat when becoming active, if not already
    useEffect(() => {
        if (iamActive) {
            setActiveChatTab('game');
        } else {
            setActiveChatTab('party');
        }
    }, [iamActive]);

    const displayedChat = [
        ...game.chat,
        ...pendingMessages
    ].filter(msg => {
        // Filter by the selected tab
        if (activeChatTab === 'game') return msg.scope === 'game';
        return msg.scope === 'party' || !msg.scope; // Default to party if undefined
    });

    return (
        <div className="flex flex-col h-full bg-slate-950/95 backdrop-blur-md md:bg-transparent">
            {/* Header / Top Section (unchanged) */}
            <div className="p-4 border-b border-white/10 relative shrink-0">
                {onClose && (
                    <button onClick={onClose} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-white md:hidden">
                        <X size={24} />
                    </button>
                )}
                <div className="flex items-center justify-between mb-4 pr-8 md:pr-0">
                    <h2 className="font-bold text-xl text-yellow-400">
                        {game.gameType === 'connect-4' ? 'Connect 4' :
                            game.gameType === 'cah' ? 'Cards Against Humanity' :
                                game.gameType === 'dots-and-boxes' ? 'Dots & Boxes' :
                                    game.gameType === 'imposter' ? 'Imposter' :
                                        'Guess Who'}
                    </h2>
                    <div className="flex items-center gap-1">
                        {iamHost && (
                            <>
                                <button
                                    onClick={onShowTransfer}
                                    className="p-2 text-yellow-400 hover:text-yellow-300 rounded-lg hover:bg-yellow-900/30 transition"
                                    title="Transfer Host"
                                >
                                    <Crown size={18} />
                                </button>
                                <button
                                    onClick={() => {
                                        onShowConfirmation({
                                            title: 'End Party?',
                                            message: 'Are you sure you want to end this party? Everyone will be disconnected.',
                                            confirmText: 'End Party',
                                            isDanger: true,
                                            onConfirm: async () => {
                                                const res = await sendAction('END_PARTY', null);
                                                if (res && res.success) {
                                                    handleLeaveParty();
                                                }
                                            }
                                        });
                                    }}
                                    className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30 transition"
                                    title="End Party"
                                >
                                    <LogOut size={18} />
                                </button>
                            </>
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


                {/* Info Bar */}
                <div className="flex items-center justify-between text-sm bg-slate-900/50 p-2 rounded-lg border border-white/5 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400">Code:</span>
                        <button onClick={copyRoomCode} className="font-mono text-white hover:text-blue-400 flex items-center gap-1 transition">
                            {roomId}
                            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        </button>
                    </div>
                    <span className="text-xs text-slate-500">{Object.keys(game.players).length} Online</span>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('participants')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition ${activeTab === 'participants' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Participants
                    </button>
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition ${activeTab === 'queue' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Queue ({game.queue.length})
                    </button>
                </div>
            </div>

            {/* Middle Section: Participants/Queue List */}
            <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto">
                    {activeTab === 'participants' ? (
                        <div className="p-4 space-y-6">
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
                                                        <span className="text-xs text-slate-400">
                                                            {game.gameType === 'connect-4' && p.characterId === 'red' && <span className="text-red-400 font-bold ml-1">(Red)</span>}
                                                            {game.gameType === 'connect-4' && p.characterId === 'yellow' && <span className="text-yellow-400 font-bold ml-1">(Yellow)</span>}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">{p.wins || 0} Wins</span>
                                                    </div>
                                                </div>
                                                {iamHost && p.id !== playerId && (
                                                    <button
                                                        onClick={() => {
                                                            onShowConfirmation({
                                                                title: 'Kick Player?',
                                                                message: `Kick ${p.name}? This will end the current match if they are playing.`,
                                                                confirmText: 'Kick',
                                                                isDanger: true,
                                                                onConfirm: () => sendAction('KICK_PLAYER', { targetId: p.id })
                                                            });
                                                        }}
                                                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition"
                                                        title="Kick Player"
                                                    >
                                                        <UserMinus size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-slate-500 text-sm italic">No match in progress</div>
                                )}
                            </div>

                            {/* Spectators List */}
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
                                                    </span>
                                                )}
                                            </div>
                                            {iamHost && p.id !== game.hostId && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onShowConfirmation({
                                                            title: 'Ban Player?',
                                                            message: `Ban ${p.name} from this room? They will not be able to rejoin.`,
                                                            confirmText: 'Ban',
                                                            isDanger: true,
                                                            onConfirm: () => sendAction('BAN_PLAYER', { targetId: p.id })
                                                        });
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
                    ) : (
                        <div className="h-full">
                            <QueueManager game={game} iamHost={iamHost} sendAction={sendAction} />
                        </div>
                    )}
                </div>
            </div>


            {/* Chat Widget - Fixed Bottom Section */}
            <div className="h-[40%] bg-black/20 shrink-0 border-t border-white/10 flex flex-col min-h-0">
                {/* Chat Tabs - Active players in CAH, Connect 4, and Dots & Boxes see both tabs */}
                {/* Only Guess Who players are restricted to game chat only */}
                {!iamActive || game.gameType === 'cah' || game.gameType === 'connect-4' || game.gameType === 'dots-and-boxes' || game.gameType === 'imposter' ? (
                    <div className="flex border-b border-white/5 bg-slate-900/80 shrink-0">
                        <button
                            onClick={() => setActiveChatTab('party')}
                            className={`flex-1 p-2 text-center text-xs font-bold cursor-pointer transition ${activeChatTab === 'party' ? 'text-yellow-400 bg-white/5 border-b-2 border-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            PARTY CHAT
                        </button>
                        <button
                            onClick={() => setActiveChatTab('game')}
                            className={`flex-1 p-2 text-center text-xs font-bold cursor-pointer transition ${activeChatTab === 'game' ? 'text-green-400 bg-white/5 border-b-2 border-green-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            GAME CHAT
                        </button>
                    </div>
                ) : (
                    <div className="flex border-b border-white/5 bg-slate-900/80 shrink-0">
                        <div className="flex-1 p-2 text-center text-xs font-bold text-green-400 bg-white/5 border-b-2 border-green-400">
                            GAME CHAT
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {displayedChat.length === 0 && (
                        <div className="text-slate-600 text-xs italic text-center mt-4">
                            No messages in {activeChatTab} chat.
                        </div>
                    )}
                    {displayedChat.map((msg) => (
                        <div key={msg.id} className="text-sm break-words">
                            <span className={`font-bold text-xs mr-2 ${msg.scope === 'game' ? 'text-green-400' : 'text-slate-400'}`}>{game.players[msg.playerId]?.name || 'User'}:</span>
                            <span className={`text-slate-200 ${msg.temp ? 'opacity-50' : ''}`}>{msg.text}</span>
                        </div>
                    ))}
                </div>

                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const text = chatInput.trim();
                        if (!text) return;

                        // Optimistic Update
                        const tempId = 'temp-' + Date.now();
                        const optimisticMsg = {
                            id: tempId,
                            playerId: playerId || 'me',
                            text: text,
                            timestamp: Date.now(),
                            scope: activeChatTab,
                            temp: true
                        };

                        setPendingMessages(prev => [...prev, optimisticMsg]);
                        setChatInput('');

                        try {
                            // We need to support passing scope to backend action?
                            // Yes, the backend CHAT action supports 'scope' in payload.
                            // But currently sendAction takes a string or object? 
                            // The logic in GameClient.tsx wrapper is generic.
                            // The processAction in game-logic.ts expects { text, scope } if payload is object?
                            // Let's check logic:
                            // if (type === 'CHAT') { const text = payload?.text ... }
                            // Wait, the existing code:
                            // sendAction('CHAT', text) -> payload is string.
                            // processAction: const text = payload?.text; IF payload is object?
                            // No, processAction checks payload?.text. If payload is just string "Hello", 
                            // then payload.text is undefined.
                            // Wait, look at GameClient.tsx:
                            // sendAction('CHAT', text) sends payload as "text".
                            // Look at game-logic.ts:
                            // const text = payload?.text;
                            // if payload is "Hello", payload.text is undefined!
                            //
                            // Actually, let's double check game-logic.ts from previous view.

                            await sendAction('CHAT', { text, scope: activeChatTab });
                        } catch (e) {
                            console.error("Chat failed", e);
                        }
                    }}
                    className="p-2 border-t border-white/5 bg-slate-900/50 shrink-0"
                >
                    <input
                        className="w-full bg-slate-800 text-white text-sm rounded px-2 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={activeChatTab === 'game' ? "Message active players..." : "Message everyone..."}
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                    />
                </form>
            </div>
        </div>
    );
}
