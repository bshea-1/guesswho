import React, { useState } from 'react';
import { GameState } from '@/lib/types';
import { motion } from 'framer-motion';

// 3x3 Grid = 4x4 Dots
const GRID_SIZE = 3;
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
        <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto p-4 select-none">
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

            {/* Game Grid */}
            <div className="relative bg-slate-900 rounded-xl p-8 shadow-2xl border border-slate-700">
                <div
                    className="grid relative"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                        width: '300px',
                        height: '300px'
                    }}
                >
                    {/* Render Boxes (Backgrounds) */}
                    {Array.from({ length: GRID_SIZE }).map((_, r) =>
                        Array.from({ length: GRID_SIZE }).map((_, c) => (
                            <div key={`box-${r}-${c}`} className="relative border border-transparent w-full h-full">
                                {renderBox(r, c)}
                            </div>
                        ))
                    )}
                </div>

                {/* Render Lines & Dots Layer (Absolute Overlay) */}
                <div className="absolute inset-0 pointer-events-none p-8" style={{ width: '100%', height: '100%' }}>
                    {/* We need to manually position SVG or Divs for lines and dots */}
                    {/* Actually, easier to use a grid of cells and utilize gaps/borders? 
                         No, standard approach is SVG overlay or absolute divs. 
                         Let's use absolute divs calculated by percentage. 
                     */}
                </div>
            </div>

            {/* Alternative Render Strategy: SVG for everything */}
            <div className="mt-4">
                <svg width="320" height="320" className="bg-slate-900/50 rounded-xl shadow-2xl touch-none">
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
                                    x={40 + c * 80 + 10}
                                    y={40 + r * 80 + 10}
                                    width={60}
                                    height={60}
                                    rx={8}
                                    fill={color}
                                    fillOpacity={0.5}
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
                                    <rect x={40 + c * 80} y={25 + r * 80} width={80} height={30} fill="transparent" />
                                    {/* Visible Line */}
                                    <rect
                                        x={40 + c * 80 + 5}
                                        y={36 + r * 80}
                                        width={70}
                                        height={8}
                                        rx={4}
                                        fill={isDrawn ? '#e2e8f0' : (isHover && isMyTurn ? '#cbd5e1' : '#334155')}
                                        fillOpacity={isDrawn ? 1 : (isHover && isMyTurn ? 0.5 : 0.2)}
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
                                    <rect x={25 + c * 80} y={40 + r * 80} width={30} height={80} fill="transparent" />
                                    {/* Visible Line */}
                                    <rect
                                        x={36 + c * 80}
                                        y={40 + r * 80 + 5}
                                        width={8}
                                        height={70}
                                        rx={4}
                                        fill={isDrawn ? '#e2e8f0' : (isHover && isMyTurn ? '#cbd5e1' : '#334155')}
                                        fillOpacity={isDrawn ? 1 : (isHover && isMyTurn ? 0.5 : 0.2)}
                                        className="transition-all duration-200"
                                    />
                                </g>
                            );
                        })
                    )}

                    {/* Dots */}
                    {Array.from({ length: 4 }).map((_, r) =>
                        Array.from({ length: 4 }).map((_, c) => (
                            <circle
                                key={`dot-${r}-${c}`}
                                cx={40 + c * 80}
                                cy={40 + r * 80}
                                r={8}
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
