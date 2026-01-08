import { Reorder } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GameState } from '@/lib/types';

// Queue Manager Component
export default function QueueManager({
    game,
    iamHost,
    sendAction
}: {
    game: GameState;
    iamHost: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendAction: (t: string, p: any) => Promise<any>;
}) {
    const [items, setItems] = useState(game.queue);

    // Sync local items with game state when it changes (unless dragging?)
    useEffect(() => {
        setItems(game.queue);
    }, [game.queue]);

    const handleReorder = (newOrder: string[]) => {
        setItems(newOrder); // Optimistic UI update
        if (iamHost) {
            sendAction('REORDER_QUEUE', newOrder);
        }
    };

    if (game.queue.length === 0) {
        return <div className="p-4 text-center text-slate-500 italic text-sm">Queue is empty</div>;
    }

    return (
        <div className="p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Up Next</h3>
            {iamHost ? (
                <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-2">
                    {items.map(pid => {
                        const p = game.players[pid];
                        if (!p) return null;
                        return (
                            <Reorder.Item key={pid} value={pid}>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700 cursor-grab active:cursor-grabbing shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-white text-sm">{p.name}</span>
                                            <span className="text-[10px] text-slate-400">{p.wins || 0} Wins</span>
                                        </div>
                                    </div>
                                    <Menu size={16} className="text-slate-500" />
                                </div>
                            </Reorder.Item>
                        );
                    })}
                </Reorder.Group>
            ) : (
                <div className="space-y-2">
                    {items.map((pid, idx) => {
                        const p = game.players[pid];
                        if (!p) return null;
                        return (
                            <div key={pid} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 font-mono text-xs w-4">{idx + 1}</span>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-300 text-sm">{p.name}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {iamHost && <p className="text-[10px] text-slate-500 mt-2 text-center">Drag to reorder queue</p>}
        </div>
    );
}
