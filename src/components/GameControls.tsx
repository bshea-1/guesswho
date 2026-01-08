
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '@/lib/types';
import { useGameStore } from '@/lib/store';
import { Mic, Send, AlertCircle, Flag, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { CHARACTERS } from '@/lib/characters';

// Helper to calculate best attribute
const getBestQuestion = (eliminatedIds: string[]) => {
    const remaining = CHARACTERS.filter(c => !eliminatedIds.includes(c.id));
    if (remaining.length === 0) return null;

    const total = remaining.length;
    const stats: Record<string, number> = {};

    // Count value frequencies
    remaining.forEach(char => {
        Object.entries(char.attributes).forEach(([key, val]) => {
            const id = `${key}:${val}`;
            stats[id] = (stats[id] || 0) + 1;
        });
    });

    // Find closest to 50% split
    const target = total / 2;
    let best = { id: '', diff: Infinity };

    Object.entries(stats).forEach(([id, count]) => {
        const diff = Math.abs(count - target);
        if (diff < best.diff) {
            best = { id, diff };
        }
    });

    if (!best.id) return null;
    const [attr, val] = best.id.split(':');

    // Formatting
    if (attr === 'glasses') return `Does the person wear GLASSES?`;
    if (attr === 'hat') return `Does the person wear a HAT?`;
    if (attr === 'hairColor') return `Is their hair ${val.toUpperCase()}?`;
    if (attr === 'gender') return `Is the person ${val.toUpperCase()}?`;

    return `Does the person have ${attr} as ${val}?`;
};

// Check if the last action was a question from the opponent (needs answer from current player)
const needsAnswerFrom = (history: GameState['history'], currentPlayerId: string | null) => {
    if (history.length === 0 || !currentPlayerId) return false;
    const lastAction = history[history.length - 1];
    // Only needs answer if: last action was ASK AND it wasn't from the current player (i.e., opponent asked)
    return lastAction.action === 'ask' && lastAction.playerId !== 'system' && lastAction.playerId !== currentPlayerId;
};

export default function GameControls({ game, playerId }: { game: GameState, playerId: string | null }) {
    const [input, setInput] = useState('');
    const { guessMode, setGuessMode } = useGameStore();

    const isMyTurn = game.turnPlayerId === playerId;
    const isSpectator = !playerId || !game.players[playerId];
    const waitingForAnswer = needsAnswerFrom(game.history, playerId);

    // Suggest Questions Logic
    const myPlayer = playerId ? game.players[playerId] : null;
    const suggestion = (myPlayer && !guessMode) ? getBestQuestion(myPlayer.eliminatedIds) : null;

    const sendAction = async (type: string, payload: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        await fetch('/api/game/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomId: game.roomId,
                playerId,
                type,
                payload
            })
        });
        setInput('');
    };

    const startListening = () => {
        // @ts-expect-error - SpeechRecognition is not standard yet
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice input not supported in this browser');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };

        recognition.start();
    };

    if (isSpectator) return null;

    // Render "Ready" button if in lobby
    if (game.status === 'lobby') {
        const me = game.players[playerId!];
        return (
            <div className="flex justify-center p-4">
                <button
                    onClick={() => sendAction('TOGGLE_READY', null)}
                    className={`px-8 py-3 rounded-xl font-bold text-xl transition ${me.isReady ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                    {me.isReady ? '✓ READY!' : 'CLICK TO READY UP'}
                </button>
            </div>
        );
    }

    // Game finished
    if (game.status === 'finished') {
        const isWinner = game.winnerId === playerId;
        return (
            <div className="text-center py-6">
                <div className={`text-3xl font-black ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                    {isWinner ? '🎉 YOU WIN!' : '😔 YOU LOSE'}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 sm:gap-3 max-w-4xl mx-auto">
            {/* PRIORITIZE ANSWERING: If someone asked me a question, I must answer it first, even if it's my turn now. */}
            {waitingForAnswer ? (
                <div className="flex flex-col items-center gap-3">
                    <p className="text-slate-400 text-sm">Your opponent asked a question. Answer:</p>
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
                        <button
                            onClick={() => sendAction('ANSWER', 'Yes')}
                            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl font-bold transition text-sm sm:text-base"
                        >
                            <CheckCircle size={18} /> YES
                        </button>
                        <button
                            onClick={() => sendAction('ANSWER', 'No')}
                            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl font-bold transition text-sm sm:text-base"
                        >
                            <XCircle size={18} /> NO
                        </button>
                        <button
                            onClick={() => sendAction('ANSWER', 'Not sure')}
                            className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-3 rounded-xl font-bold transition text-xs sm:text-sm"
                        >
                            <HelpCircle size={18} /> NOT SURE
                        </button>
                    </div>
                </div>
            ) : !isMyTurn ? (
                /* NOT MY TURN and No Question to Answer -> Waiting */
                <div className="flex flex-col items-center gap-3">
                    <div className="text-slate-500 py-2 flex items-center gap-2 text-sm sm:text-base">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                        Waiting for opponent...
                    </div>
                </div>
            ) : (
                /* MY TURN - Show ask/guess controls */
                <div className="flex flex-col gap-2 sm:gap-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setGuessMode(false)}
                            className={`flex-1 py-3 rounded-lg font-bold text-xs sm:text-sm transition ${!guessMode ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            💬 ASK QUESTION
                        </button>
                        <button
                            onClick={() => setGuessMode(true)}
                            className={`flex-1 py-3 rounded-lg font-bold text-xs sm:text-sm transition ${guessMode ? 'bg-orange-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            🎯 GUESS WHO
                        </button>
                    </div>

                    <div className="relative overflow-visible sm:overflow-hidden min-h-[100px] sm:min-h-[120px]">
                        <AnimatePresence mode="wait">
                            {!guessMode ? (
                                /* Ask question mode */
                                <motion.div
                                    key="ask-mode"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative"
                                >
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask a question..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 sm:py-4 pr-24 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && input.trim()) {
                                                sendAction('ASK', input);
                                            }
                                        }}
                                    />
                                    <div className="absolute right-2 top-2 bottom-2 flex gap-1">
                                        <button onClick={startListening} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition">
                                            <Mic size={18} />
                                        </button>
                                        <button
                                            onClick={() => sendAction('ASK', input)}
                                            disabled={!input.trim()}
                                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-3 sm:px-4 rounded-lg font-bold transition flex items-center"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                /* Guess mode - show instruction */
                                <motion.div
                                    key="guess-mode"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-orange-900/30 border border-orange-600/50 rounded-xl p-3 sm:p-4 text-center h-[60px] flex flex-col justify-center items-center"
                                >
                                    <p className="text-orange-400 font-bold text-sm sm:text-base">Click on a character above to make your guess!</p>
                                    <p className="text-orange-400/70 text-xs sm:text-sm mt-1">Choose wisely - wrong guesses lose your turn!</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-between items-center mt-2 sm:mt-0">
                        {suggestion && !guessMode && (
                            <div
                                className="text-[10px] sm:text-xs text-blue-400 flex items-center gap-1 cursor-pointer hover:text-blue-300 max-w-[60%] truncate"
                                onClick={() => setInput(suggestion)}
                            >
                                <AlertCircle size={12} />
                                <span className="truncate">Suggested: {suggestion}</span>
                            </div>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <button
                                onClick={() => sendAction('END_TURN', null)}
                                className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg transition"
                            >
                                END TURN
                            </button>
                            <button
                                onClick={() => sendAction('FORFEIT', null)}
                                className="flex items-center gap-1 text-red-400 hover:text-red-300 font-bold px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg hover:bg-red-900/30 transition"
                            >
                                <Flag size={14} /> FORFEIT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
