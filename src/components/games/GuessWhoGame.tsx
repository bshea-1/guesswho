import { useState, useEffect } from 'react';
import { GameState, Player, Turn } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import GameBoard from '@/components/GameBoard';
import GameControls from '@/components/GameControls';

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

export default function GuessWhoGame({
    game,
    playerId,
    activePlayers,
    iamActive,
    iamHost
}: {
    game: GameState;
    playerId: string;
    activePlayers: Player[];
    iamActive: boolean;
    iamHost: boolean;
}) {

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 relative">
            {/* Question Display */}
            {(() => {
                const history = [...game.history];
                const questions = history.filter(t => t.action === 'ask');
                const latestQ = questions[questions.length - 1];

                if (!latestQ) return null;

                const getAnswerFor = (qTurn: Turn) => {
                    const qIndex = history.indexOf(qTurn);
                    if (qIndex === -1) return null;
                    return history.slice(qIndex + 1).find(t => t.action === 'answer');
                };
                const latestA = getAnswerFor(latestQ);

                const askerName = latestQ.playerId === playerId ? 'You' : (game.players[latestQ.playerId]?.name || 'Opponent');
                const answererName = latestA ? (latestA.playerId === playerId ? 'You' : (game.players[latestA.playerId]?.name || 'They')) : null;

                return (
                    <div className="p-3 bg-slate-900 border-b border-white/10 flex flex-col items-center justify-center text-center gap-1 shrink-0 z-30 shadow-md">
                        <div className="text-sm sm:text-base font-medium text-white italic">
                            "{latestQ.content}"
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="uppercase tracking-wider font-bold text-blue-400">{askerName} asked</span>
                            {latestA ? (
                                <>
                                    <span>•</span>
                                    <span className={`uppercase tracking-wider font-bold ${latestA.content.toLowerCase() === 'no' ? 'text-red-400' : 'text-green-400'}`}>
                                        {answererName} answered: {latestA.content}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span>•</span>
                                    <span className="italic opacity-50">Waiting for answer...</span>
                                </>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Board Area - scrollable, takes remaining space */}
            <div className="flex-1 min-h-0 overflow-y-auto p-0 bg-slate-950/50 relative flex flex-col">
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

            {/* Controls Area (Only for Active Players) - fixed at bottom, never cut off */}
            {iamActive && game.matchStatus === 'playing' && (
                <div className="shrink-0 px-2 pt-2 pb-4 bg-slate-900 border-t border-white/10 z-20" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                    <GameControls game={game} playerId={playerId} />
                </div>
            )}
        </div>
    );
}
