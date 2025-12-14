import { Turn } from '@/lib/types';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';

export default function GameLog({ history }: { history: Turn[] }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    return (
        <div className="flex flex-col h-full bg-slate-900/50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Initial System Message */}
                <div className="flex justify-center">
                    <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-full border border-slate-700">
                        Game Started
                    </span>
                </div>

                {history.map((turn, i) => {
                    const isSystem = turn.playerId === 'system';
                    // Simple heuristic: If it starts with "You", it's me.
                    const isMe = turn.content.startsWith('You');

                    if (isSystem) {
                        return (
                            <div key={i} className="flex justify-center my-2">
                                <span className={clsx(
                                    "text-xs px-3 py-1 rounded-full border",
                                    turn.action === 'WIN' ? "bg-green-900/30 border-green-700 text-green-400" :
                                        turn.action === 'GAME_OVER' ? "bg-red-900/30 border-red-700 text-red-400" :
                                            "bg-slate-800 border-slate-700 text-slate-400"
                                )}>
                                    {turn.content}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div key={i} className={clsx("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                            <div className={clsx(
                                "rounded-xl px-3 py-2 text-sm shadow-sm",
                                isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-slate-700 text-slate-200 rounded-bl-none"
                            )}>
                                {turn.content}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 px-1 uppercase tracking-wider font-bold">
                                {turn.action}
                            </span>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
