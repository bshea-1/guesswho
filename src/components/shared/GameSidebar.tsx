import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { GameState, Player } from '@/lib/types';
import { Loader2, Copy, Check, Home, Crown, UserX, LogOut, Menu, X, UserMinus } from 'lucide-react';
import QueueManager from './QueueManager';

// Extracted Sidebar Content Component
export default function GameSidebar({
    game,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    sendAction: (t: string, p: any) => Promise<any>;
    copyRoomCode: () => void;
    handleLeaveParty: () => void;
    iamHost: boolean;
    iamActive: boolean;
    activePlayers: Player[];
    spectators: Player[];
    onClose?: () => void;
}) {
    const [activeTab, setActiveTab] = useState<'participants' | 'queue'>('participants');
    const { setGame } = useGameStore();

    return (
        <div className="flex flex-col h-full bg-slate-950/95 backdrop-blur-md md:bg-transparent">
            <div className="p-4 border-b border-white/10 relative">
                {/* Header ... */}
                {onClose && (
                    <button onClick={onClose} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-white md:hidden">
                        <X size={24} />
                    </button>
                )}
                <div className="flex items-center justify-between mb-4 pr-8 md:pr-0">
                    <h2 className="font-bold text-xl text-yellow-400">Guess Who</h2>
                    <div className="flex items-center gap-1">
                        {iamHost && (
                            <button
                                onClick={async () => {
                                    if (confirm('End this party? Everyone will be disconnected.')) {
                                        const res = await sendAction('END_PARTY', null);
                                        if (res && res.success) {
                                            handleLeaveParty();
                                        }
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

            {/* Tab Content Area */}
            <div className="flex-1 overflow-y-hidden flex flex-col min-h-0">
                {activeTab === 'participants' ? (
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
                                            {iamHost && p.id !== playerId && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Kick ${p.name}? This will end the current match.`)) {
                                                            sendAction('KICK_PLAYER', { targetId: p.id });
                                                        }
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
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <QueueManager game={game} iamHost={iamHost} sendAction={sendAction} />
                    </div>
                )}


                {/* Chat Widget - Bottom Half */}
                <div className="h-[45%] border-t border-white/10 flex flex-col bg-black/20 pb-safe">
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
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const text = chatInput.trim();
                                if (!text) return;

                                // Optimistic Update
                                const optimisticMsg = {
                                    id: Date.now().toString(),
                                    playerId: playerId || 'me',
                                    text: text,
                                    timestamp: Date.now(),
                                    scope: iamActive ? 'game' : 'party'
                                };

                                setGame({
                                    ...game,
                                    // @ts-ignore - 'scope' might be missing in older types but we need it here
                                    chat: [...(game.chat || []), optimisticMsg]
                                });

                                setChatInput('');

                                await sendAction('CHAT', text);
                            }}
                            className="p-2 border-t border-white/5 bg-slate-900/50"
                        >
                            <input
                                className="flex-1 bg-slate-800 text-white text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={iamActive ? "Message opponent..." : "Message party..."}
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                            />
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
