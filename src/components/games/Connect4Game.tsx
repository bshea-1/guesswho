import { useState, useEffect, useRef } from 'react';
import { GameState, Player } from '@/lib/types';
import { Connect4Board, ROWS, COLS, dropPiece, Connect4Color } from '@/lib/games/connect4';
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

    // Initialize local board for optimistic updates
    const [localBoard, setLocalBoard] = useState<Connect4Board>(board);

    // Sync local board with server board, preventing race conditions (flicker)
    useEffect(() => {
        // Simple helper to count pieces
        const countPieces = (b: Connect4Board) =>
            b.flat().filter(c => c !== null).length;

        const serverCount = countPieces(board);
        const localCount = countPieces(localBoard);

        // If server has same or more pieces, or if board was reset (empty), sync.
        // If server has fewer pieces but it's not a reset, we assume local is ahead (optimistic).
        // Reset detection: serverCount is 0 (and local might have pieces)
        if (serverCount >= localCount || serverCount === 0) {
            setLocalBoard(board);
        }
    }, [game.board]); // Depend on the raw server prop

    // Track which cells have been animated to prevent re-animation on poll updates
    const animatedCellsRef = useRef<Set<string>>(new Set());
    const [animatedCells, setAnimatedCells] = useState<Set<string>>(new Set());

    // Update animated cells when localBoard changes
    useEffect(() => {
        const newAnimated = new Set(animatedCells);
        let hasNewPiece = false;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cellKey = `${row}-${col}`;
                if (localBoard[row]?.[col] && !animatedCellsRef.current.has(cellKey)) {
                    newAnimated.add(cellKey);
                    animatedCellsRef.current.add(cellKey);
                    hasNewPiece = true;
                }
            }
        }

        if (hasNewPiece) {
            setAnimatedCells(newAnimated);
        }
    }, [localBoard]);

    const handleColumnClick = async (colIndex: number) => {
        if (!iamActive || !myTurn || game.matchStatus !== 'playing') return;

        // Optimistic update
        const color = myColors as Connect4Color;
        if (!color) return;

        const { success, newBoard } = dropPiece(localBoard, colIndex, color);

        if (success) {
            setLocalBoard(newBoard);
            // Send to server
            try {
                await sendAction('DROP_PIECE', colIndex);
            } catch (error) {
                console.error("Failed to drop piece:", error);
                // On error, we might want to revert, but standard sync will fix it eventually
            }
        }
    };

    // Check if a cell should animate (is new)
    const shouldAnimate = (row: number, col: number): boolean => {
        const cellKey = `${row}-${col}`;
        return !animatedCells.has(cellKey);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative bg-slate-900">
            {/* Status Header */}
            <div className="mb-8 text-center bg-slate-800/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                {game.matchStatus === 'playing' ? (
                    <div className="flex flex-col items-center gap-2">
                        {/* My Color Indicator */}
                        {iamActive && (
                            <div className={`text-sm font-bold px-3 py-1 rounded-full border mb-2 ${myColors === 'red' ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'}`}>
                                YOU ARE {myColors === 'red' ? 'RED' : 'YELLOW'}
                            </div>
                        )}

                        <div className="text-2xl font-bold flex items-center gap-3">
                            {game.turnPlayerId === playerId ? (
                                <span className="text-green-400 animate-pulse">YOUR TURN</span>
                            ) : (
                                <span className="text-slate-300">
                                    Waiting for {game.players[game.turnPlayerId || '']?.name || 'Opponent'}
                                </span>
                            )}
                            <div className={`w-4 h-4 rounded-full ${game.turnPlayerId === playerId ? (myColors === 'red' ? 'bg-red-500' : 'bg-yellow-500') : (game.turnPlayerId ? (game.players[game.turnPlayerId]?.characterId === 'red' ? 'bg-red-500' : 'bg-yellow-500') : 'bg-slate-500')}`} />
                        </div>
                    </div>
                ) : (
                    <div className="text-xl text-slate-400">match {game.matchStatus}</div>
                )}
            </div>

            {/* Game Board */}
            <div className="relative bg-blue-700 p-2 text-center rounded-xl shadow-2xl">
                <div className="grid grid-cols-7 gap-1 sm:gap-3">
                    {/* Columns */}
                    {Array.from({ length: COLS }).map((_, colIndex) => (
                        <div
                            key={colIndex}
                            className="flex flex-col gap-1 sm:gap-3 cursor-pointer group"
                            onClick={() => handleColumnClick(colIndex)}
                        >
                            {/* Hover Indicator (Ghost Piece) */}


                            {/* Rows (Top to Bottom) */}
                            {Array.from({ length: ROWS }).map((_, rowIndex) => {
                                const cell = localBoard[rowIndex]?.[colIndex];
                                const cellKey = `${rowIndex}-${colIndex}`;
                                const isNew = shouldAnimate(rowIndex, colIndex);

                                return (
                                    <div
                                        key={cellKey}
                                        className="w-8 h-8 sm:w-16 sm:h-16 rounded-full bg-slate-900 shadow-inner flex items-center justify-center overflow-hidden"
                                    >
                                        <AnimatePresence>
                                            {cell && (
                                                <motion.div
                                                    key={`piece-${cellKey}`}
                                                    initial={isNew ? { y: -(rowIndex + 1) * 85, opacity: 1 } : { y: 0, opacity: 1 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={isNew ? {
                                                        type: 'spring',
                                                        stiffness: 400,
                                                        damping: 25,
                                                        mass: 1
                                                    } : { duration: 0 }}
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
