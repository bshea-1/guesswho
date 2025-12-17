import React, { useState } from 'react';
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
    const iamRed = myPlayer?.characterId === 'red';
    const iamBlue = myPlayer?.characterId === 'blue';

    // Helper to get line ID
    const getHLineId = (r: number, c: number) => `h-${r}-${c}`;
    const getVLineId = (r: number, c: number) => `v-${r}-${c}`;

    // Render Box Content (Owner Initial/Icon)
    const renderBox = (r: number, c: number) => {
        const ownerId = game.dabBoxes?.[`${r}-${c}`];
        if (!ownerId) return null;

        const owner = game.players[ownerId];
        const color = owner?.characterId === 'red' ? 'bg-red-500' : 'bg-blue-500';

        return (
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`absolute inset-0 m-2 rounded-lg ${color} flex items-center justify-center`}
            >
                <span className="font-bold text-white text-2xl uppercase opacity-80">
                    {owner?.name?.charAt(0) || '?'}
                </span>
            </motion.div>
        );
    };

    const handleLineClick = (lineId: string) => {
        if (!isMyTurn || game.dabLines?.includes(lineId)) return;
        sendAction('DRAW_LINE', lineId);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl md:max-w-4xl mx-auto p-4 select-none">
            {/* Header / Scoreboard */}
            <div className="flex w-full justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                {Object.values(game.players)
                    .filter(p => p.role === 'player')
                    .map(p => {
                        const isTurn = game.turnPlayerId === p.id;
                        const score = Object.values(game.dabBoxes || {}).filter(id => id === p.id).length;
                        const colorClass = p.characterId === 'red' ? 'text-red-400' : 'text-blue-400';
                        const bgClass = p.characterId === 'red' ? 'bg-red-500/20' : 'bg-blue-500/20';

                        return (
                            <div
                                key={p.id}
                                className={`flex flex-col items-center px-6 py-2 rounded-lg transition-all duration-300 ${isTurn ? `scale-110 ring-2 ring-white/20 ${bgClass}` : 'opacity-70 grayscale'}`}
                            >
                                <span className={`font-bold text-lg ${colorClass}`}>{p.name}</span>
                                <span className="text-3xl font-black text-white">{score}</span>
                            </div>
                        );
                    })}
            </div>

            {/* Game Grid (SVG) */}
            <div className="mt-4 md:mt-8 flex justify-center">
                <svg width="340" height="340" viewBox="0 0 340 340" className="bg-slate-900/50 rounded-xl shadow-2xl touch-none select-none w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[480px] md:h-[480px] lg:w-[560px] lg:h-[560px]">
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
                            const owner = game.players[ownerId];
                            const color = owner?.characterId === 'red' ? '#ef4444' : '#3b82f6';
                            return (
                                <rect
                                    key={`box-${r}-${c}`}
                                    x={40 + c * 50 + 5}
                                    y={40 + r * 50 + 5}
                                    width={40}
                                    height={40}
                                    rx={6}
                                    fill={color}
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

            <div className="mt-8 text-center text-slate-400 text-sm">
                {isMyTurn ? "It's your turn! Draw a line." : `Waiting for opponent...`}
            </div>
        </div>
    );
}
