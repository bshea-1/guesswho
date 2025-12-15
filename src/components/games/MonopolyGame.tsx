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

    // Helper to get relative board position for rendering (simplified linear or loop)
    // Detailed specific rendering for monopoly usually requires a canvas or complex grid.
    // For this MVP we will list properties or show a simplified linear track?
    // User asked for "Implementing Multi-Game Platform", implies decent UI.
    // Let's do a simplified "List" view of the board, focusing on current positions.
    // Or a Grid if possible. 40 spaces is hard to fit in a grid nicely without SVG.
    // Let's do a "Track" view: Scrollable horizontal or vertical list of spaces.

    return (
        <div className="flex-1 flex flex-col h-full bg-green-900 text-white overflow-hidden relative">
            {/* Top Bar: Turn & Stats */}
            <div className="bg-green-800 p-4 shadow-md z-10 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    {activePlayers.map(p => (
                        <div key={p.id} className={`flex flex-col p-2 rounded-lg border ${game.turnPlayerId === p.id ? 'bg-yellow-500/20 border-yellow-400' : 'bg-black/20 border-transparent'}`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full bg-${p.data?.color || 'gray'}-500`} />
                                <span className="font-bold">{p.name} {p.id === playerId && '(You)'}</span>
                            </div>
                            <div className="text-sm font-mono text-green-300 ml-5">${p.data?.money || 0}</div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-end">
                    {game.matchStatus === 'playing' ? (
                        <>
                            <div className="text-xl font-bold">
                                {myTurn ? <span className="text-green-400">YOUR TURN</span> : <span className="text-yellow-400">{game.players[game.turnPlayerId || '']?.name}&apos;s Turn</span>}
                            </div>
                            {myTurn && (
                                <button
                                    onClick={() => sendAction('ROLL_DICE', null)}
                                    className="mt-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded-lg shadow-lg"
                                >
                                    ROLL DICE
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-xl text-slate-400">Game Over</div>
                    )}
                </div>
            </div>

            {/* Board Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {MONOPOLY_BOARD.map((space) => {
                    const playersHere = activePlayers.filter(p => p.data?.position === space.id);
                    const ownerId = game.board?.ownership?.[space.id];
                    const owner = ownerId ? game.players[ownerId] : null;
                    const isPurchasable = space.type === 'property' && space.price;
                    const canBuy = myTurn && myData?.position === space.id && !owner && isPurchasable && myData.money >= space.price!;

                    return (
                        <div key={space.id} className={`relative flex items-center p-2 rounded bg-white/10 border ${space.group === 'brown' ? 'border-yellow-900' :
                                space.group === 'light-blue' ? 'border-sky-300' :
                                    space.group === 'pink' ? 'border-pink-400' :
                                        space.group === 'orange' ? 'border-orange-500' :
                                            space.group === 'red' ? 'border-red-600' :
                                                space.group === 'yellow' ? 'border-yellow-400' :
                                                    space.group === 'green' ? 'border-green-600' :
                                                        space.group === 'dark-blue' ? 'border-blue-800' :
                                                            'border-slate-600'
                            } ${myData?.position === space.id ? 'bg-white/20' : ''}`}>

                            {/* Color Strip */}
                            {space.group && space.type === 'property' && (
                                <div className={`w-2 self-stretch mr-3 rounded-l ${space.group === 'brown' ? 'bg-yellow-900' :
                                        space.group === 'light-blue' ? 'bg-sky-300' :
                                            space.group === 'pink' ? 'bg-pink-400' :
                                                space.group === 'orange' ? 'bg-orange-500' :
                                                    space.group === 'red' ? 'bg-red-600' :
                                                        space.group === 'yellow' ? 'bg-yellow-400' :
                                                            space.group === 'green' ? 'bg-green-600' :
                                                                space.group === 'dark-blue' ? 'bg-blue-800' :
                                                                    'bg-slate-500'
                                    }`} />
                            )}

                            <div className="flex-1">
                                <div className="font-bold flex items-center gap-2">
                                    {space.name}
                                    {owner && <span className={`text-xs px-1 rounded bg-${owner.data.color}-500/20 text-${owner.data.color}-300 border border-${owner.data.color}-500/50`}>Owned by {owner.name}</span>}
                                </div>
                                <div className="text-xs text-white/60 capitalize">{space.type} {space.price ? `($${space.price})` : ''}</div>
                            </div>

                            {/* Actions */}
                            {canBuy && (
                                <button
                                    onClick={() => sendAction('BUY_PROPERTY', null)}
                                    className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-500 mr-4"
                                >
                                    Buy (${space.price})
                                </button>
                            )}

                            {/* Players Tokens */}
                            <div className="flex gap-1">
                                {playersHere.map(p => (
                                    <motion.div
                                        layoutId={`token-${p.id}`}
                                        key={p.id}
                                        className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white
                                            ${p.data?.color === 'red' ? 'bg-red-500' :
                                                p.data?.color === 'blue' ? 'bg-blue-500' :
                                                    'bg-slate-500'}
                                        `}
                                    >
                                        {p.name.substring(0, 1)}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
