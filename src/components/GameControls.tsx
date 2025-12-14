
import { useState } from 'react';
import { GameState } from '@/lib/types';
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

// Check if the last action was a question (needs answer)
const needsAnswer = (history: GameState['history']) => {
    if (history.length === 0) return false;
    const lastAction = history[history.length - 1];
    return lastAction.action === 'ask' && lastAction.playerId !== 'system';
};

export default function GameControls({ game, playerId }: { game: GameState, playerId: string | null }) {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'ask' | 'guess'>('ask');
    const [showCharacters, setShowCharacters] = useState(false);

    const isMyTurn = game.turnPlayerId === playerId;
    const isSpectator = !playerId || !game.players[playerId];
    const waitingForAnswer = needsAnswer(game.history);

    // Suggest Questions Logic
    const myPlayer = playerId ? game.players[playerId] : null;
    const suggestion = (myPlayer && mode === 'ask') ? getBestQuestion(myPlayer.eliminatedIds) : null;

    // Filter characters for autocomplete
    const filteredCharacters = CHARACTERS.filter(c =>
        c.name.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 6);

    const sendAction = async (type: string, payload: any) => {
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
        setShowCharacters(false);
    };

    const startListening = () => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice input not supported in this browser');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
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
        <div className="flex flex-col gap-3 max-w-4xl mx-auto">
            {/* When it's NOT my turn - show answer buttons if waiting for answer */}
            {!isMyTurn ? (
                <div className="flex flex-col items-center gap-3">
                    {waitingForAnswer ? (
                        <>
                            <p className="text-slate-400 text-sm">Your opponent asked a question. Answer:</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => sendAction('ANSWER', 'Yes')}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition"
                                >
                                    <CheckCircle size={20} /> YES
                                </button>
                                <button
                                    onClick={() => sendAction('ANSWER', 'No')}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition"
                                >
                                    <XCircle size={20} /> NO
                                </button>
                                <button
                                    onClick={() => sendAction('ANSWER', 'Not sure')}
                                    className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-4 py-3 rounded-xl font-bold transition"
                                >
                                    <HelpCircle size={20} /> NOT SURE
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-slate-500 py-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            Waiting for opponent...
                        </div>
                    )}
                </div>
            ) : (
                /* MY TURN - Show ask/guess controls */
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setMode('ask'); setShowCharacters(false); }}
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${mode === 'ask' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            ASK QUESTION
                        </button>
                        <button
                            onClick={() => { setMode('guess'); setShowCharacters(true); }}
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${mode === 'guess' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            GUESS WHO
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                if (mode === 'guess') setShowCharacters(true);
                            }}
                            onFocus={() => mode === 'guess' && setShowCharacters(true)}
                            placeholder={mode === 'ask' ? "Ask a question (e.g. 'Do they have glasses?')..." : "Type character name to guess..."}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 pr-24 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && input.trim()) {
                                    sendAction(mode === 'ask' ? 'ASK' : 'GUESS', input);
                                }
                            }}
                        />
                        <div className="absolute right-2 top-2 bottom-2 flex gap-1">
                            <button onClick={startListening} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition">
                                <Mic size={20} />
                            </button>
                            <button
                                onClick={() => sendAction(mode === 'ask' ? 'ASK' : 'GUESS', input)}
                                disabled={!input.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-4 rounded-lg font-bold transition flex items-center"
                            >
                                <Send size={18} />
                            </button>
                        </div>

                        {/* Character autocomplete dropdown */}
                        {showCharacters && mode === 'guess' && filteredCharacters.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden z-20 max-h-48 overflow-y-auto">
                                {filteredCharacters.map(char => (
                                    <button
                                        key={char.id}
                                        onClick={() => {
                                            setInput(char.name);
                                            setShowCharacters(false);
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-slate-700 text-white flex items-center gap-2"
                                    >
                                        <span className="font-bold">{char.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center">
                        {suggestion && (
                            <div
                                className="text-xs text-blue-400 flex items-center gap-1 cursor-pointer hover:text-blue-300"
                                onClick={() => setInput(suggestion)}
                            >
                                <AlertCircle size={12} />
                                Suggested: {suggestion}
                            </div>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <button
                                onClick={() => sendAction('END_TURN', null)}
                                className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg transition"
                            >
                                END TURN
                            </button>
                            <button
                                onClick={() => sendAction('FORFEIT', null)}
                                className="flex items-center gap-1 text-red-400 hover:text-red-300 font-bold px-3 py-2 rounded-lg hover:bg-red-900/30 transition"
                            >
                                <Flag size={16} /> FORFEIT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
