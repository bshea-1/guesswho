'use client';

import { GameState, Player } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Bomb, Heart, Send, AlertCircle, CheckCircle, UserPlus, Users, Flag, UserMinus } from 'lucide-react'; // Added UserMinus
import { useGameStore } from '@/lib/store';

const INITIAL_TIMER = 20;
const LOBBY_DURATION = 15;

export default function WordBombGame({
    game,
    playerId,
    activePlayers,
    iamActive,
    iamHost,
    sendAction,
    typingText
}: {
    game: GameState;
    playerId: string;
    activePlayers: Player[];
    iamActive: boolean;
    iamHost: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendAction: (t: string, p: any) => Promise<any>;
    typingText: string;
}) {
    const [inputWord, setInputWord] = useState('');
    const [timeLeft, setTimeLeft] = useState(game.currentTimerDuration || INITIAL_TIMER);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [timerExpiredSent, setTimerExpiredSent] = useState(false);
    const [lobbyTimeLeft, setLobbyTimeLeft] = useState(LOBBY_DURATION);
    const [matchStarted, setMatchStarted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const myTurn = game.turnPlayerId === playerId;
    const prompt = game.wordBombPrompt || '';
    const myData = game.players[playerId]?.data;
    const myLives = myData?.lives || 0;
    const isEliminated = myData?.isEliminated || false;

    const { timeOffset } = useGameStore();

    const isInLobby = game.matchStatus === 'finished' && game.lobbyCountdownStart;
    const joinedPlayers = game.joinedNextRound || [];
    const hasJoined = joinedPlayers.includes(playerId);

    // Reset states when turn changes
    useEffect(() => {
        setTimerExpiredSent(false);
        setInputWord('');
        setFeedback(null);
    }, [game.turnPlayerId, game.turnStartTime]);

    // Reset matchStarted when match status changes
    useEffect(() => {
        if (game.matchStatus === 'playing') {
            setMatchStarted(false);
        }
    }, [game.matchStatus]);

    // Game timer countdown
    useEffect(() => {
        if (game.matchStatus !== 'playing') return;

        const turnStart = game.turnStartTime || Date.now();
        const duration = game.currentTimerDuration || INITIAL_TIMER;

        const updateTimer = () => {
            // Synced timer: ServerNow = ClientNow + Offset
            const now = Date.now() + timeOffset;
            const elapsed = (now - turnStart) / 1000;
            const remaining = Math.max(0, duration - elapsed);
            setTimeLeft(remaining);

            if (remaining <= 0 && myTurn && !isEliminated && !timerExpiredSent) {
                setTimerExpiredSent(true);
                sendAction('TIMER_EXPIRED', null);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [game.turnStartTime, game.currentTimerDuration, game.matchStatus, myTurn, isEliminated, timerExpiredSent, sendAction, timeOffset]);

    // Lobby countdown
    useEffect(() => {
        if (!isInLobby || !game.lobbyCountdownStart) return;

        const updateLobbyTimer = () => {
            const now = Date.now() + timeOffset;
            const elapsed = (now - game.lobbyCountdownStart!) / 1000;
            const remaining = Math.max(0, LOBBY_DURATION - elapsed);
            setLobbyTimeLeft(remaining);

            // When countdown ends
            if (remaining <= 0 && !matchStarted) {
                if (joinedPlayers.length >= 2) {
                    // Start game if enough players
                    // Only host sends action to prevent race/spam
                    if (iamHost) {
                        setMatchStarted(true);
                        sendAction('START_WORD_BOMB_MATCH', null);
                    }
                } else {
                    // Loop timer if waiting for players
                    if (iamHost) {
                        sendAction('RESET_LOBBY_TIMER', null);
                    }
                }
            }
        };

        updateLobbyTimer();
        const interval = setInterval(updateLobbyTimer, 100);
        return () => clearInterval(interval);
    }, [isInLobby, game.lobbyCountdownStart, joinedPlayers.length, matchStarted, sendAction, iamHost, timeOffset]);

    // Focus input on my turn
    useEffect(() => {
        if (myTurn && inputRef.current && !isEliminated) {
            inputRef.current.focus();
        }
    }, [myTurn, isEliminated]);

    // Clear feedback
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const handleInputChange = useCallback((value: string) => {
        const upperValue = value.toUpperCase();
        setInputWord(upperValue);
        // Fire-and-forget: send typing update immediately without waiting
        // This gives instant real-time visibility to other players
        sendAction('UPDATE_TYPING', { text: upperValue });
    }, [sendAction]);

    const handleSubmit = useCallback(async () => {
        if (!inputWord.trim() || submitting || !myTurn) return;

        const word = inputWord.toLowerCase().trim();
        setSubmitting(true);

        sendAction('UPDATE_TYPING', { text: `Sending "${word.toUpperCase()}"...` });

        if (!word.includes(prompt.toLowerCase())) {
            setFeedback({ type: 'error', message: `Must contain "${prompt}"!` });
            sendAction('UPDATE_TYPING', { text: `❌ "${word.toUpperCase()}" - missing "${prompt}"` });
            setSubmitting(false);
            return;
        }

        // Length Validation
        if (word.length < 2) {
            setFeedback({ type: 'error', message: 'Too short!' });
            return;
        }

        // 2-Letter Word Check (Static Allowlist)
        // 2-Letter Word Check (Static Allowlist)
        if (word.length === 2) {
            const VALID_TWO_LETTER_WORDS = new Set([
                'aa', 'ab', 'ad', 'ae', 'ag', 'ah', 'ai', 'al', 'am', 'an', 'ar', 'as', 'at', 'aw', 'ax', 'ay',
                'ba', 'be', 'bi', 'bo', 'by', 'de', 'do', 'ed', 'ef', 'eh', 'el', 'em', 'en', 'er', 'es', 'et', 'ex',
                'fa', 'fe', 'go', 'ha', 'he', 'hi', 'ho', 'id', 'if', 'in', 'is', 'it', 'jo', 'ka', 'ki',
                'la', 'li', 'lo', 'ma', 'me', 'mi', 'mm', 'mo', 'mu', 'my', 'na', 'ne', 'no', 'nu',
                'od', 'oe', 'of', 'oh', 'oi', 'ok', 'om', 'on', 'op', 'or', 'os', 'ow', 'ox', 'oy',
                'pa', 'pe', 'pi', 'po', 'qi', 're', 'sh', 'si', 'so', 'ta', 'te', 'ti', 'to',
                'uh', 'um', 'un', 'up', 'us', 'ut', 'we', 'wo', 'xi', 'xu', 'ya', 'ye', 'yo', 'za'
            ]);

            if (!VALID_TWO_LETTER_WORDS.has(word.toLowerCase())) {
                setFeedback({ type: 'error', message: 'Invalid 2-letter word!' });
                sendAction('UPDATE_TYPING', { text: `❌ "${word.toUpperCase()}" - Invalid` });
                setSubmitting(false);
                return;
            }
        }

        // 3+ Letter Word Check (via server-side API to avoid CORS)
        if (word.length >= 3) {
            try {
                const res = await fetch(`/api/validate-word?word=${encodeURIComponent(word)}`);
                const data = await res.json();

                if (!data.valid) {
                    setFeedback({ type: 'error', message: 'Not a valid word!' });
                    sendAction('UPDATE_TYPING', { text: `❌ "${word.toUpperCase()}" - Invalid Word` });
                    setSubmitting(false);
                    return;
                }
                // Word is valid, continue to submit
            } catch (error) {
                console.error('Validation check failed', error);
                // Be strict on errors - don't allow potentially invalid words
                setFeedback({ type: 'error', message: 'Validation check failed!' });
                setSubmitting(false);
                return;
            }
        }

        const result = await sendAction('SUBMIT_WORD', { word });

        // Check if server accepted the word
        if (result?.error) {
            setFeedback({ type: 'error', message: result.error || 'Word rejected!' });
            sendAction('UPDATE_TYPING', { text: `❌ "${word.toUpperCase()}" - ${result.error || 'Rejected'}` });
            setSubmitting(false);
            return;
        }

        setInputWord('');
        setFeedback({ type: 'success', message: 'Word accepted!' });
        setSubmitting(false);
    }, [inputWord, submitting, myTurn, prompt, sendAction]);

    const handleJoinNextRound = () => {
        sendAction('JOIN_NEXT_ROUND', null);
    };

    const currentPlayer = game.turnPlayerId ? game.players[game.turnPlayerId] : null;
    const timerColor = timeLeft > 5 ? 'text-green-400' : timeLeft > 2 ? 'text-yellow-400' : 'text-red-500';
    const timerScale = timeLeft < 3 ? 'animate-pulse scale-110' : '';

    // Lobby screen
    if (isInLobby) {
        return (
            <div className="flex flex-col h-full bg-slate-950 text-white p-4 sm:p-6 overflow-hidden items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">🏆</div>
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                        {game.players[game.winnerId || '']?.name} Wins!
                    </div>

                    <div className="mt-8 mb-6">
                        <div className="text-slate-400 mb-2">Next round starts in</div>
                        <div className="text-5xl font-black text-purple-400">
                            {Math.ceil(lobbyTimeLeft)}s
                        </div>
                    </div>

                    {!hasJoined ? (
                        <button
                            onClick={handleJoinNextRound}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-xl text-xl transition flex items-center justify-center gap-3"
                        >
                            <UserPlus size={24} />
                            Join Next Round
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="bg-green-500/20 border border-green-500 text-green-400 py-4 px-8 rounded-xl text-xl font-bold flex items-center justify-center gap-3">
                                <CheckCircle size={24} />
                                You're In!
                            </div>
                            <button
                                onClick={() => sendAction('LEAVE_NEXT_ROUND', null)}
                                className="flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2 rounded-lg transition text-sm font-semibold"
                            >
                                <UserMinus size={16} />
                                Leave Next Round
                            </button>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-slate-800 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-400 mb-3">
                            <Users size={18} />
                            <span>Players Joining ({joinedPlayers.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {joinedPlayers.map(pid => (
                                <span key={pid} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium">
                                    {game.players[pid]?.name || 'Unknown'}
                                </span>
                            ))}
                            {joinedPlayers.length < 2 && (
                                <span className="text-slate-500 italic text-sm">Need at least 2 players...</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white p-4 sm:p-6 overflow-hidden">
            {/* Header: Players */}
            <div className="flex flex-wrap gap-2 justify-center mb-6 z-10 relative">
                {activePlayers.map(p => {
                    const pData = p.data || { lives: 2, isEliminated: false };
                    const isCurrentTurn = game.turnPlayerId === p.id;
                    const maxLives = Math.max(2, pData.lives || 0);

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
                                {Array.from({ length: Math.max(2, pData.lives || 0) }).map((_, i) => {
                                    // Logic for lives:
                                    // 1st/2nd are standard. 3rd is Golden Heart (only show if present)
                                    const hasLife = i < (pData.lives ?? 0);
                                    const isGolden = i === 2 && hasLife; // 3rd heart is gold

                                    return (
                                        <Heart
                                            key={i}
                                            size={14}
                                            className={`${hasLife
                                                ? (isGolden ? 'text-yellow-400 fill-yellow-400' : 'text-red-500 fill-red-500')
                                                : 'text-slate-700'}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ALPHABET TRACKER (Left Side) */}
            {(() => {
                if (!myTurn || isEliminated || !myData) return null;
                const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
                const used = new Set(myData.usedLetters || []);
                const missing = alphabet.filter(l => !used.has(l));

                // Only show if close to completion (<= 10 left) OR if we want to encourage them?
                // User said: "letters remaining once they reach 10"
                if (missing.length > 10) return null;

                return (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-1 bg-slate-900/80 p-3 rounded-xl border border-white/10 backdrop-blur-sm max-h-[60vh] overflow-y-auto">
                        <div className="text-xs font-bold text-slate-400 text-center uppercase mb-1">Missing<br />Letters</div>
                        {missing.map(char => (
                            <span key={char} className="font-mono font-bold text-yellow-400/80 text-center text-lg animate-pulse">
                                {char}
                            </span>
                        ))}
                        {missing.length === 0 && (
                            <div className="text-center">
                                <Heart className="text-yellow-400 fill-yellow-400 mx-auto" size={20} />
                                <span className="text-[10px] text-yellow-400 font-bold block mt-1">Reward<br />Claimed!</span>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {game.matchStatus === 'playing' ? (
                    <>
                        {/* Timer Bomb */}
                        <motion.div
                            animate={{ scale: timeLeft < 3 ? [1, 1.1, 1] : 1 }}
                            transition={{ repeat: timeLeft < 3 ? Infinity : 0, duration: 0.5 }}
                            className="relative mb-8 flex items-center justify-center"
                        >
                            <Bomb size={120} className={`${timerColor} ${timerScale}`} />
                            {/* Centered Number: Bomb icon is slightly top-heavy due to fuse. Adjust top % to visually center. */}
                            <div className={`absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-3xl ${timerColor}`}>
                                {Math.ceil(timeLeft)}
                            </div>
                        </motion.div>

                        {/* Prompt */}
                        <div className="text-center mb-6">
                            <div className="text-slate-400 text-sm uppercase tracking-wider mb-2">Type a word containing</div>
                            <div className="text-6xl sm:text-8xl font-black text-white bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                {prompt}
                            </div>
                        </div>

                        {/* Current Turn + Typing */}
                        <div className="mb-6 text-center">
                            {myTurn && !isEliminated ? (
                                <div className="text-2xl font-bold text-green-400 animate-pulse">YOUR TURN!</div>
                            ) : isEliminated ? (
                                <div className="text-xl font-bold text-red-400">You're eliminated - spectating</div>
                            ) : (
                                <>
                                    <div className="text-xl text-slate-400">
                                        <span className="text-yellow-400 font-bold">{currentPlayer?.name}</span> is typing...
                                    </div>
                                    {/* Real-time typing display */}
                                    <motion.div
                                        key={typingText || 'empty'}
                                        initial={{ opacity: 0.5 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-3 text-2xl font-mono text-white bg-slate-800 px-6 py-3 rounded-xl inline-block min-w-[200px] min-h-[52px]"
                                    >
                                        {typingText || <span className="text-slate-500">...</span>}
                                    </motion.div>
                                </>
                            )}
                        </div>

                        {/* Input */}
                        {myTurn && !isEliminated && (
                            <div className="w-full max-w-md">
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputWord}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        placeholder="Type a word..."
                                        // disabled={submitting} // Removed to allowing spamming
                                        className="flex-1 bg-slate-800 border-2 border-slate-600 focus:border-purple-500 rounded-xl px-4 py-3 text-xl font-mono text-center text-white outline-none transition"
                                    />
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!inputWord.trim()} // Only disable if empty
                                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2"
                                        title="Send Word"
                                    >
                                        <Send size={20} />
                                    </button>
                                    <button
                                        onClick={() => sendAction('FORFEIT_WORD', null)}
                                        // disabled={submitting}
                                        className="bg-slate-700 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-xl transition flex items-center gap-2"
                                        title="Give Up / Skip Turn (Lose Life)"
                                    >
                                        <Flag size={20} />
                                    </button>
                                </div>

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

                        {iamActive && !isEliminated && (
                            <div className="mt-8 flex items-center gap-2 text-slate-400">
                                <span>Your lives:</span>
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.max(2, myLives) }).map((_, i) => {
                                        const iHasLife = i < myLives;
                                        const isGold = i === 2 && iHasLife;
                                        return (
                                            <Heart
                                                key={i}
                                                size={24}
                                                className={iHasLife
                                                    ? (isGold ? 'text-yellow-400 fill-yellow-400' : 'text-red-500 fill-red-500')
                                                    : 'text-slate-700'}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
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
