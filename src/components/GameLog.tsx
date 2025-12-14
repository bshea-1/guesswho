import { Turn } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
// I haven't installed scroll-area, so I'll use standard div overflow

export default function GameLog({ history }: { history: Turn[] }) {
    return (
        <div className="flex flex-col h-full bg-slate-900/50 p-4 space-y-2 font-mono text-sm">
            {history.length === 0 && <div className="text-slate-500 text-center italic">Game Log Empty</div>}

            {history.map((turn, i) => (
                <div key={i} className="flex flex-col border-l-2 border-slate-700 pl-3 py-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">{turn.action}</span>
                    <span className="text-white break-words">{turn.content}</span>
                </div>
            ))}
        </div>
    );
}
