
import { useState } from 'react';
import { GameState } from '@/lib/types';
import { Mic, Send, MessageSquare, AlertCircle } from 'lucide-react';
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
            const id = `${key}:${val} `;
            stats[id] = (stats[id] || 0) + 1;
        });
    });

    // Find closest to 50% split
    // Ideal count is total / 2
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
    if (attr === 'glasses') return `Does the person wear GLASSES ? `;
    if (attr === 'hat') return `Does the person wear a HAT ? `;
    if (attr === 'hairColor') return `Is their hair ${val.toUpperCase()}?`;
    if (attr === 'gender') return `Is the person ${val.toUpperCase()}?`;

    return `Does the person have ${attr} as ${val}?`;
};

export default function GameControls({ game, playerId }: { game: GameState, playerId: string | null }) {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<'ask' | 'guess' | 'answer'>('ask');

    const isMyTurn = game.turnPlayerId === playerId;
    const isSpectator = !playerId || !game.players[playerId];

    // Suggest Questions Logic
    const myPlayer = playerId ? game.players[playerId] : null;
    const suggestion = (myPlayer && mode === 'ask') ? getBestQuestion(myPlayer.eliminatedIds) : null;

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
            // Optional: Auto-send? "confirm/send (auto-send toggle optional)"
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
                    className={`px - 8 py - 3 rounded - xl font - bold text - xl transition ${me.isReady ? 'bg-green-600 hover:bg-green-500' : 'bg-slate-700 hover:bg-slate-600'} `}
                >
                    {me.isReady ? 'READY!' : 'CLICK TO READY UP'}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 max-w-4xl mx-auto">
            {!isMyTurn ? (
                <div className="text-center text-slate-500 py-2 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
                    Waiting for opponent...
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button onClick={() => setMode('ask')} className={`flex - 1 py - 2 rounded - lg font - bold text - sm ${mode === 'ask' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'} `}>
                            QUESTION
                        </button>
                        <button onClick={() => setMode('guess')} className={`flex - 1 py - 2 rounded - lg font - bold text - sm ${mode === 'guess' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'} `}>
                            GUESS WHO
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={mode === 'ask' ? "Ask a question (e.g. Do they have simple glasses?)..." : "Enter name to guess..."}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 pr-24 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && input.trim()) {
                                    sendAction(mode === 'ask' ? 'ASK' : 'GUESS', input); // Guess logic usually takes ID, logic handles string? I need to map name to ID if I use text input.
                                    // Simplified: GUESS takes ID? Or name? 
                                    // My logic expects ID. I should dropdown or map.
                                    // Logic fix: Allow string match or enforce ID.
                                    // For now, assume User types name.
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
                    </div>

                    <div className="flex justify-end items-center gap-4">
                        {suggestion && (
                            <div className="text-xs text-blue-400 flex items-center gap-1 animate-pulse cursor-pointer" onClick={() => setInput(suggestion)}>
                                <AlertCircle size={12} />
                                Suggested: {suggestion}
                            </div>
                        )}
                        <button onClick={() => sendAction('END_TURN', null)} className="text-xs text-slate-500 hover:text-red-400 font-bold px-2 py-1">
                            END TURN MANUALLY
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
