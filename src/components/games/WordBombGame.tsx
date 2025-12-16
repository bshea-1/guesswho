'use client';

import { GameState, Player } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Bomb, Heart, Send, AlertCircle, CheckCircle } from 'lucide-react';

const INITIAL_TIMER = 15;

export default function WordBombGame({
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
    const [inputWord, setInputWord] = useState('');
    const [timeLeft, setTimeLeft] = useState(game.currentTimerDuration || INITIAL_TIMER);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const myTurn = game.turnPlayerId === playerId;
    const prompt = game.wordBombPrompt || '';
    const myData = game.players[playerId]?.data;
    const myLives = myData?.lives || 0;
    const isEliminated = myData?.isEliminated || false;

    // Timer countdown
    useEffect(() => {
        if (game.matchStatus !== 'playing') return;

        const turnStart = game.turnStartTime || Date.now();
        const duration = game.currentTimerDuration || INITIAL_TIMER;

        const updateTimer = () => {
            const elapsed = (Date.now() - turnStart) / 1000;
            const remaining = Math.max(0, duration - elapsed);
            setTimeLeft(remaining);

            // If timer hits 0 and it's my turn, trigger expired
            if (remaining <= 0 && myTurn && !isEliminated) {
                sendAction('TIMER_EXPIRED', null);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [game.turnStartTime, game.currentTimerDuration, game.matchStatus, myTurn, isEliminated, sendAction]);

    // Focus input on my turn
    useEffect(() => {
        if (myTurn && inputRef.current && !isEliminated) {
            inputRef.current.focus();
        }
    }, [myTurn, isEliminated]);

    // Clear feedback after a bit
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const validateWord = useCallback(async (word: string): Promise<boolean> => {
        try {
            const res = await fetch(`/api/validate-word?word=${encodeURIComponent(word)}`);
            const data = await res.json();
            return data.valid;
        } catch {
            return true; // Be lenient on errors
        }
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!inputWord.trim() || submitting || !myTurn) return;

        const word = inputWord.toLowerCase().trim();
        setSubmitting(true);

        // Check if word contains prompt
        if (!word.includes(prompt.toLowerCase())) {
            setFeedback({ type: 'error', message: `Must contain "${prompt}"!` });
            setSubmitting(false);
            return;
        }

        // Validate with dictionary
        const isValid = await validateWord(word);
        if (!isValid) {
            setFeedback({ type: 'error', message: `"${word}" is not a valid word!` });
            setSubmitting(false);
            return;
        }

        // Submit to server
        await sendAction('SUBMIT_WORD', { word });
        setInputWord('');
        setFeedback({ type: 'success', message: 'Word accepted!' });
        setSubmitting(false);
    }, [inputWord, submitting, myTurn, prompt, validateWord, sendAction]);

    const currentPlayer = game.turnPlayerId ? game.players[game.turnPlayerId] : null;

    // Calculate timer color based on urgency
    const timerColor = timeLeft > 5 ? 'text-green-400' : timeLeft > 2 ? 'text-yellow-400' : 'text-red-500';
    const timerScale = timeLeft < 3 ? 'animate-pulse scale-110' : '';

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white p-4 sm:p-6 overflow-hidden">
            {/* Header: Players */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
                {activePlayers.map(p => {
                    const pData = p.data || { lives: 3, isEliminated: false };
                    const isCurrentTurn = game.turnPlayerId === p.id;
                    return (
                        <div
                            key={p.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                                ${pData.isEliminated ? 'opacity-40 bg-slate-800' : isCurrentTurn ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-slate-800'}`}
                        >
                            <span className={`font-bold ${isCurrentTurn ? 'text-yellow-400' : 'text-white'}`}>
                                {p.name}
                            </span>
                            <div className="flex gap-0.5">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Heart
                                        key={i}
                                        size={14}
                                        className={i < pData.lives ? 'text-red-500 fill-red-500' : 'text-slate-600'}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {game.matchStatus === 'playing' ? (
                    <>
                        {/* Timer Bomb */}
                        <motion.div
                            animate={{ scale: timeLeft < 3 ? [1, 1.1, 1] : 1 }}
                            transition={{ repeat: timeLeft < 3 ? Infinity : 0, duration: 0.5 }}
                            className="relative mb-8"
                        >
                            <Bomb size={100} className={`${timerColor} ${timerScale}`} />
                            <div className={`absolute inset-0 flex items-center justify-center font-black text-2xl ${timerColor}`}>
                                {Math.ceil(timeLeft)}
                            </div>
                        </motion.div>

                        {/* Prompt */}
                        <div className="text-center mb-8">
                            <div className="text-slate-400 text-sm uppercase tracking-wider mb-2">Type a word containing</div>
                            <div className="text-6xl sm:text-8xl font-black text-white bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                {prompt}
                            </div>
                        </div>

                        {/* Current Turn Indicator */}
                        <div className="mb-6 text-center">
                            {myTurn && !isEliminated ? (
                                <div className="text-2xl font-bold text-green-400 animate-pulse">YOUR TURN!</div>
                            ) : isEliminated ? (
                                <div className="text-xl font-bold text-red-400">You're eliminated - spectating</div>
                            ) : (
                                <div className="text-xl text-slate-400">
                                    Waiting for <span className="text-yellow-400 font-bold">{currentPlayer?.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Input (only if my turn and not eliminated) */}
                        {myTurn && !isEliminated && (
                            <div className="w-full max-w-md">
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputWord}
                                        onChange={(e) => setInputWord(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        placeholder="Type a word..."
                                        disabled={submitting}
                                        className="flex-1 bg-slate-800 border-2 border-slate-600 focus:border-purple-500 rounded-xl px-4 py-3 text-xl font-mono text-center text-white outline-none transition"
                                    />
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || !inputWord.trim()}
                                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>

                                {/* Feedback */}
                                <AnimatePresence>
                                    {feedback && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className={`mt-3 p-3 rounded-lg flex items-center gap-2 justify-center ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                                        >
                                            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                            {feedback.message}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* My Lives */}
                        {iamActive && !isEliminated && (
                            <div className="mt-8 flex items-center gap-2 text-slate-400">
                                <span>Your lives:</span>
                                <div className="flex gap-1">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Heart
                                            key={i}
                                            size={24}
                                            className={i < myLives ? 'text-red-500 fill-red-500' : 'text-slate-600'}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : game.matchStatus === 'finished' ? (
                    <div className="text-center">
                        <div className="text-4xl mb-4">🎉</div>
                        <div className="text-3xl font-bold text-white mb-2">
                            {game.winnerId === playerId ? 'YOU WIN!' : `${game.players[game.winnerId || '']?.name} Wins!`}
                        </div>
                        <div className="text-slate-400">Game Over</div>
                    </div>
                ) : (
                    <div className="text-center text-slate-400">Waiting for game to start...</div>
                )}
            </div>

            {/* Used Words */}
            {game.usedWords && game.usedWords.length > 0 && (
                <div className="mt-4 text-center">
                    <div className="text-xs text-slate-500 mb-1">Used Words ({game.usedWords.length})</div>
                    <div className="flex flex-wrap gap-1 justify-center max-h-16 overflow-y-auto">
                        {game.usedWords.slice(-15).map((w, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">{w}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
