import React, { useState, useMemo } from 'react';
import { GameState } from '@/lib/types';
import { motion } from 'framer-motion';

// 5x5 Grid = 6x6 Dots
const GRID_SIZE = 5;
const DOTS = 4;

export default function DotsAndBoxesGame({
    game,
    playerId,
    sendAction
}: {
    game: GameState;
    playerId: string;
    sendAction: (type: string, payload: any) => Promise<void>;
}) {
    const [hoverLine, setHoverLine] = useState<string | null>(null);

    const isMyTurn = game.turnPlayerId === playerId;
    const myPlayer = game.players[playerId];

    // Get active players sorted consistently (by ID for determinism)
    const activePlayers = useMemo(() => {
        return Object.values(game.players)
            .filter(p => p.role === 'player')
            .sort((a, b) => a.id.localeCompare(b.id));
    }, [game.players]);

    // Create a consistent player-to-color mapping
    // First player (by sorted ID) = red, second = blue
    const playerColorMap = useMemo(() => {
        const map: Record<string, 'red' | 'blue'> = {};
        activePlayers.forEach((p, idx) => {
            // Use characterId if set, otherwise fall back to index-based assignment
            if (p.characterId === 'red' || p.characterId === 'blue') {
                map[p.id] = p.characterId as 'red' | 'blue';
            } else {
                map[p.id] = idx === 0 ? 'red' : 'blue';
            }
        });
        return map;
    }, [activePlayers]);

    // Helper to get consistent color for a player
    const getPlayerColor = (ownerId: string): 'red' | 'blue' => {
        return playerColorMap[ownerId] || 'blue';
    };

    const getColorHex = (color: 'red' | 'blue'): string => {
        return color === 'red' ? '#ef4444' : '#3b82f6';
    };

    const getColorClass = (color: 'red' | 'blue', type: 'text' | 'bg'): string => {
        if (type === 'text') {
            return color === 'red' ? 'text-red-400' : 'text-blue-400';
        }
        return color === 'red' ? 'bg-red-500/20' : 'bg-blue-500/20';
    };

    const handleLineClick = (lineId: string) => {
        if (!isMyTurn || game.dabLines?.includes(lineId)) return;
        sendAction('DRAW_LINE', lineId);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full w-full max-w-2xl md:max-w-4xl mx-auto p-2 sm:p-4 select-none">
            {/* Prominent Turn Indicator */}


            {/* Header / Scoreboard */}
            <div className="flex w-full justify-between items-center mb-4 sm:mb-6 bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-white/5">
                {activePlayers.map(p => {
                    const isTurn = game.turnPlayerId === p.id;
                    const score = Object.values(game.dabBoxes || {}).filter(id => id === p.id).length;
                    const color = getPlayerColor(p.id);
                    const colorClass = getColorClass(color, 'text');
                    const bgClass = getColorClass(color, 'bg');

                    return (
                        <div
                            key={p.id}
                            className={`flex flex-col items-center px-3 sm:px-6 py-2 rounded-lg transition-all duration-300 ${isTurn ? `scale-110 ring-2 ring-white/20 ${bgClass}` : 'opacity-70 grayscale'}`}
                        >
                            <span className={`font-bold text-sm sm:text-lg ${colorClass}`}>
                                {p.name}
                                <span className="text-xs ml-1 opacity-70">({color === 'red' ? 'Red' : 'Blue'})</span>
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-white">{score}</span>
                        </div>
                    );
                })}
            </div>

            {/* Game Grid (SVG) - Larger on all devices */}
            <div className="mt-2 md:mt-4 flex justify-center">
                <svg width="340" height="340" viewBox="0 0 340 340" className="bg-slate-900/50 rounded-xl shadow-2xl touch-none select-none w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[520px] md:h-[520px] lg:w-[600px] lg:h-[600px]">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Boxes Backgrounds */}
                    {Array.from({ length: GRID_SIZE }).map((_, r) =>
                        Array.from({ length: GRID_SIZE }).map((_, c) => {
                            const ownerId = game.dabBoxes?.[`${r}-${c}`];
                            if (!ownerId) return null;
                            const color = getPlayerColor(ownerId);
                            const hexColor = getColorHex(color);
                            return (
                                <rect
                                    key={`box-${r}-${c}`}
                                    x={40 + c * 50 + 5}
                                    y={40 + r * 50 + 5}
                                    width={40}
                                    height={40}
                                    rx={6}
                                    fill={hexColor}
                                    fillOpacity={0.6}
                                />
                            );
                        })
                    )}

                    {/* Horizontal Lines */}
                    {Array.from({ length: GRID_SIZE + 1 }).map((_, r) =>
                        Array.from({ length: GRID_SIZE }).map((_, c) => {
                            const id = `h-${r}-${c}`;
                            const isDrawn = game.dabLines?.includes(id);
                            const isHover = hoverLine === id;

                            return (
                                <g key={id} onClick={() => handleLineClick(id)}
                                    onMouseEnter={() => setHoverLine(id)}
                                    onMouseLeave={() => setHoverLine(null)}
                                    style={{ cursor: isDrawn ? 'default' : 'pointer', pointerEvents: 'all' }}>
                                    {/* Hitbox */}
                                    <rect x={40 + c * 50} y={30 + r * 50} width={50} height={20} fill="transparent" />
                                    {/* Visible Line */}
                                    <rect
                                        x={40 + c * 50 + 5}
                                        y={38 + r * 50}
                                        width={40}
                                        height={4}
                                        rx={2}
                                        fill={isDrawn ? '#e2e8f0' : (isHover && isMyTurn ? '#cbd5e1' : '#334155')}
                                        fillOpacity={isDrawn ? 1 : (isHover && isMyTurn ? 0.8 : 0.3)}
                                        className="transition-all duration-200"
                                    />
                                </g>
                            );
                        })
                    )}

                    {/* Vertical Lines */}
                    {Array.from({ length: GRID_SIZE }).map((_, r) =>
                        Array.from({ length: GRID_SIZE + 1 }).map((_, c) => {
                            const id = `v-${r}-${c}`;
                            const isDrawn = game.dabLines?.includes(id);
                            const isHover = hoverLine === id;

                            return (
                                <g key={id} onClick={() => handleLineClick(id)}
                                    onMouseEnter={() => setHoverLine(id)}
                                    onMouseLeave={() => setHoverLine(null)}
                                    style={{ cursor: isDrawn ? 'default' : 'pointer', pointerEvents: 'all' }}>
                                    {/* Hitbox */}
                                    <rect x={30 + c * 50} y={40 + r * 50} width={20} height={50} fill="transparent" />
                                    {/* Visible Line */}
                                    <rect
                                        x={38 + c * 50}
                                        y={40 + r * 50 + 5}
                                        width={4}
                                        height={40}
                                        rx={2}
                                        fill={isDrawn ? '#e2e8f0' : (isHover && isMyTurn ? '#cbd5e1' : '#334155')}
                                        fillOpacity={isDrawn ? 1 : (isHover && isMyTurn ? 0.8 : 0.3)}
                                        className="transition-all duration-200"
                                    />
                                </g>
                            );
                        })
                    )}

                    {/* Dots */}
                    {Array.from({ length: GRID_SIZE + 1 }).map((_, r) =>
                        Array.from({ length: GRID_SIZE + 1 }).map((_, c) => (
                            <circle
                                key={`dot-${r}-${c}`}
                                cx={40 + c * 50}
                                cy={40 + r * 50}
                                r={6}
                                fill="#ffffff"
                                className="drop-shadow-lg"
                            />
                        ))
                    )}
                </svg>
            </div>
        </div>
    );
}
