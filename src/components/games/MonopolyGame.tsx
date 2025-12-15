import { GameState, Player } from '@/lib/types';
import { MONOPOLY_BOARD, BoardSpace } from '@/lib/games/monopoly/constants';
import { motion, AnimatePresence } from 'framer-motion';

export default function MonopolyGame({
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
    const myTurn = game.turnPlayerId === playerId;
    const playerSelf = game.players[playerId];
    const myData = playerSelf?.data;

    // Grid Mapping Logic
    // Board is 40 spaces.
    // 0 (Go) -> Bottom Right
    // 1-9 -> Bottom Row (Right to Left)
    // 10 (Jail) -> Bottom Left
    // 11-19 -> Left Col (Bottom to Top)
    // 20 (Parking) -> Top Left
    // 21-29 -> Top Row (Left to Right)
    // 30 (Go To Jail) -> Top Right
    // 31-39 -> Right Col (Top to Bottom)

    // Grid 11x11.
    // 1-based indexing for CSS Grid.
    // Top Row: Row 1. Cols 1-11. (20 at Col 1, 30 at Col 11)
    // Bottom Row: Row 11. Cols 1-11. (10 at Col 1, 0 at Col 11)
    // Left Col: Col 1. Rows 2-10.
    // Right Col: Col 11. Rows 2-10.

    const getGridArea = (index: number) => {
        if (index === 0) return { gridColumn: 11, gridRow: 11 }; // GO
        if (index < 10) return { gridColumn: 11 - index, gridRow: 11 }; // Bottom
        if (index === 10) return { gridColumn: 1, gridRow: 11 }; // Jail
        if (index < 20) return { gridColumn: 1, gridRow: 11 - (index - 10) }; // Left
        if (index === 20) return { gridColumn: 1, gridRow: 1 }; // Parking
        if (index < 30) return { gridColumn: 1 + (index - 20), gridRow: 1 }; // Top
        if (index === 30) return { gridColumn: 11, gridRow: 1 }; // Go To Jail
        return { gridColumn: 11, gridRow: 1 + (index - 30) }; // Right
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden p-2 sm:p-4 select-none">
            {/* Status Bar */}
            <div className="flex justify-between items-center mb-4 bg-slate-800 p-2 rounded-lg">
                <div className="flex gap-4">
                    {activePlayers.map(p => (
                        <div key={p.id} className={`flex items-center gap-2 px-3 py-1 rounded border ${game.turnPlayerId === p.id ? 'bg-yellow-500/10 border-yellow-500' : 'border-slate-700'}`}>
                            <div className={`w-3 h-3 rounded-full bg-${p.data?.color || 'gray'}-500`} />
                            <div className="flex flex-col leading-tight">
                                <span className={`text-xs font-bold ${game.turnPlayerId === p.id ? 'text-yellow-400' : 'text-slate-300'}`}>{p.name}</span>
                                <span className="text-xs font-mono text-green-400">${p.data?.money}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center">
                    {game.matchStatus === 'playing' ? (
                        <div className="text-lg font-bold">
                            {myTurn ? <span className="text-green-400 animate-pulse">YOUR TURN</span> : <span className="text-slate-400">{game.players[game.turnPlayerId || '']?.name}'s Turn</span>}
                        </div>
                    ) : (
                        <span className="text-red-400">Game Over</span>
                    )}
                </div>
            </div>

            {/* Board Container - Responsive Scaling */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
                <div className="relative aspect-square h-full max-h-[800px] bg-[#CDE6D0] border-4 border-black text-black shadow-2xl items-stretch justify-items-stretch"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(11, 1fr)',
                        gridTemplateRows: 'repeat(11, 1fr)',
                    }}
                >
                    {/* Center Area (Control Panel) */}
                    <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-slate-800 flex flex-col items-center justify-center p-8 relative">
                        <div className="absolute inset-0 bg-[url('https://i.imgur.com/example.png')] opacity-10 pointer-events-none"></div>

                        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-wider mb-8 uppercase text-center transform -rotate-12 bg-red-600 px-4 py-1 shadow-lg">Monopoly</h1>

                        {/* Dice Display */}
                        {game.players[game.turnPlayerId || '']?.data?.lastRoll && (
                            <div className="flex gap-4 mb-8">
                                {game.players[game.turnPlayerId || '']!.data!.lastRoll!.map((val: number, i: number) => (
                                    <div key={i} className="w-12 h-12 bg-white rounded-lg shadow-xl flex items-center justify-center text-2xl font-bold text-black border-2 border-slate-300">
                                        {val}
                                    </div>
                                ))}
                            </div>
                        )}

                        {myTurn && game.matchStatus === 'playing' && (
                            <div className="flex flex-col items-center animate-bounce-short">
                                <button
                                    onClick={() => sendAction('ROLL_DICE', null)}
                                    className="bg-white hover:bg-gray-100 text-black text-xl font-bold py-3 px-8 rounded-xl shadow-xl border-b-4 border-gray-300 active:border-b-0 active:translate-y-1 transition-all"
                                >
                                    🎲 ROLL DICE
                                </button>
                                <div className="mt-2 text-slate-400 text-sm">Click to end turn if finished</div>
                                <button
                                    onClick={() => sendAction('END_TURN', null)}
                                    className="mt-4 text-slate-400 hover:text-white text-xs uppercase tracking-widest"
                                >
                                    End Turn (Mock)
                                </button>
                            </div>
                        )}

                        {/* Console / History */}
                        <div className="mt-8 w-full max-w-md h-32 bg-black/50 rounded p-2 overflow-y-auto font-mono text-xs text-green-400">
                            {game.history.slice().reverse().map((h, i) => (
                                <div key={i} className="mb-1">
                                    <span className="opacity-50">[{new Date(h.timestamp).toLocaleTimeString()}]</span> {h.content}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Spaces */}
                    {MONOPOLY_BOARD.map((space, i) => {
                        const style = getGridArea(space.id);
                        const isCorner = space.id % 10 === 0;
                        const playersHere = activePlayers.filter(p => p.data?.position === space.id);
                        const ownerId = game.board?.ownership?.[space.id];
                        const owner = ownerId ? game.players[ownerId] : null;
                        const canBuy = myTurn && myData?.position === space.id && !owner && space.type === 'property' && space.price && myData.money >= space.price;

                        return (
                            <div key={space.id}
                                className={`relative border border-black flex flex-col items-center justify-between text-[0.6rem] sm:text-[0.7rem] leading-none text-center bg-[#CDE6D0] overflow-hidden
                                    ${space.id === 0 ? 'bg-white' : ''}
                                 `}
                                style={{ ...style }}
                            >
                                {/* Color Bar */}
                                {space.group && space.type === 'property' && (
                                    <div className={`absolute top-0 left-0 right-0 h-[20%] border-b border-black
                                        ${space.group === 'brown' ? 'bg-[#8B4513]' :
                                            space.group === 'light-blue' ? 'bg-[#87CEEB]' :
                                                space.group === 'pink' ? 'bg-[#FF69B4]' :
                                                    space.group === 'orange' ? 'bg-[#FFA500]' :
                                                        space.group === 'red' ? 'bg-red-600' :
                                                            space.group === 'yellow' ? 'bg-[#FFFF00]' :
                                                                space.group === 'green' ? 'bg-[#008000]' :
                                                                    space.group === 'dark-blue' ? 'bg-[#000080]' : 'bg-transparent'}
                                    `}>
                                        {/* Owner Indicator */}
                                        {owner && (
                                            <div className={`w-full h-full flex items-center justify-center font-bold text-white bg-black/30`}>
                                                {owner.name.substring(0, 3)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Content */}
                                <div className={`flex flex-col items-center justify-center w-full h-full p-0.5 ${space.type === 'property' ? 'mt-[20%]' : ''}`}>
                                    <span className="font-semibold break-words max-w-full px-1">{space.name}</span>

                                    {space.price && <span className="mt-1">${space.price}</span>}

                                    {/* Action Button Overlay */}
                                    {canBuy && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); sendAction('BUY_PROPERTY', null); }}
                                            className="absolute inset-0 bg-green-600/90 text-white font-bold flex items-center justify-center z-20 hover:bg-green-500 animate-pulse"
                                        >
                                            BUY<br />${space.price}
                                        </button>
                                    )}
                                </div>

                                {/* Player Tokens */}
                                {playersHere.length > 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                        <div className="flex -space-x-1">
                                            {playersHere.map(p => (
                                                <motion.div
                                                    layoutId={`token-${p.id}`} // layoutId forces smooth transition between parents
                                                    key={p.id}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    className={`w-4 h-4 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-[8px] sm:text-xs font-bold text-white
                                                        ${p.data?.color === 'red' ? 'bg-red-600' :
                                                            p.data?.color === 'blue' ? 'bg-blue-600' :
                                                                p.data?.color === 'green' ? 'bg-green-600' :
                                                                    'bg-purple-600'}
                                                    `}
                                                >
                                                    {p.name.substring(0, 1)}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
