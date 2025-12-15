import { GameState, Player } from '@/lib/types';
import { Connect4Board, ROWS, COLS } from '@/lib/games/connect4';
import { motion, AnimatePresence } from 'framer-motion';

export default function Connect4Game({
    game,
    playerId,
    activePlayers,
    iamActive,
    iamHost,
    sendAction
}: {
    game: GameState;
    playerId: string;
    activePlayers: Player[];
    iamActive: boolean;
    iamHost: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendAction: (t: string, p: any) => Promise<any>;
}) {
    const board = (game.board as Connect4Board) || Array(ROWS).fill(Array(COLS).fill(null));
    const myTurn = game.turnPlayerId === playerId;

    // Determine my color (if active)
    const myColors = activePlayers.find(p => p.id === playerId)?.characterId; // 'red' or 'yellow'

    const handleColumnClick = (colIndex: number) => {
        if (!iamActive || !myTurn || game.matchStatus !== 'playing') return;
        sendAction('DROP_PIECE', colIndex);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative bg-slate-900">
            {/* Status Header */}
            <div className="mb-8 text-center">
                {game.matchStatus === 'playing' ? (
                    <div className="text-2xl font-bold flex items-center gap-3">
                        {game.turnPlayerId === playerId ? (
                            <span className="text-green-400">YOUR TURN</span>
                        ) : (
                            <span className="text-yellow-400">
                                Waiting for {game.players[game.turnPlayerId || '']?.name || 'Opponent'}
                            </span>
                        )}
                        <div className={`w-4 h-4 rounded-full ${game.turnPlayerId === playerId ? (myColors === 'red' ? 'bg-red-500' : 'bg-yellow-500') : 'bg-slate-500'}`} />
                    </div>
                ) : (
                    <div className="text-xl text-slate-400">match {game.matchStatus}</div>
                )}
            </div>

            {/* Game Board */}
            <div className="relative bg-blue-700 p-2 sm:p-4 rounded-xl shadow-2xl border-4 border-blue-800">
                <div className="grid grid-cols-7 gap-1 sm:gap-3">
                    {/* Columns */}
                    {Array.from({ length: COLS }).map((_, colIndex) => (
                        <div
                            key={colIndex}
                            className="flex flex-col gap-1 sm:gap-3 cursor-pointer group"
                            onClick={() => handleColumnClick(colIndex)}
                        >
                            {/* Hover Indicator (Ghost Piece) */}
                            {iamActive && myTurn && game.matchStatus === 'playing' && (
                                <div className={`w-8 h-8 sm:w-16 sm:h-16 rounded-full mb-1 opacity-0 group-hover:opacity-50 transition-opacity mx-auto
                                    ${myColors === 'red' ? 'bg-red-500' : 'bg-yellow-500'}
                                `} />
                            )}

                            {/* Rows (Top to Bottom) */}
                            {Array.from({ length: ROWS }).map((_, rowIndex) => {
                                const cell = board[rowIndex][colIndex];
                                return (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className="w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-slate-900 shadow-inner flex items-center justify-center overflow-hidden"
                                    >
                                        <AnimatePresence>
                                            {cell && (
                                                <motion.div
                                                    initial={{ y: -300, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                                    className={`w-full h-full rounded-full shadow-lg ${cell === 'red' ? 'bg-red-500' : 'bg-yellow-400'} border-4 ${cell === 'red' ? 'border-red-600' : 'border-yellow-500'}`}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Players Legend */}
            <div className="mt-8 flex gap-8">
                {activePlayers.map(p => (
                    <div key={p.id} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${game.turnPlayerId === p.id ? 'bg-white/10 border-white/20' : 'border-transparent'}`}>
                        <div className={`w-4 h-4 rounded-full ${p.characterId === 'red' ? 'bg-red-500' : 'bg-yellow-400'}`} />
                        <span className={game.turnPlayerId === p.id ? 'font-bold text-white' : 'text-slate-400'}>{p.name} {p.id === playerId && '(You)'}</span>
                    </div>
                ))}
                {activePlayers.length === 0 && <span className="text-slate-500 italic">Waiting for players...</span>}
            </div>

        </div>
    );
}

