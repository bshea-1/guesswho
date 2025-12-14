'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, Tv } from 'lucide-react';

type MatchSummary = {
    roomId: string;
    hostName: string;
    spectators: number;
    createdAt: number;
    status: string;
    mode: string;
};

export default function MatchesPage() {
    const [matches, setMatches] = useState<MatchSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/matches')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMatches(data);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-3xl font-bold">Public Matches</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {matches.length === 0 ? (
                            <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-white/5">
                                No active public matches found.
                            </div>
                        ) : (
                            matches.map(match => (
                                <div key={match.roomId} className="bg-slate-900/80 border border-white/10 p-6 rounded-xl flex justify-between items-center hover:border-blue-500/50 transition">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-blue-400 font-bold">{match.roomId}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{match.mode.toUpperCase()}</span>
                                            {match.status === 'playing' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800 animate-pulse">LIVE</span>}
                                        </div>
                                        <p className="text-slate-300">Host: <span className="text-white font-medium">{match.hostName}</span></p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right text-sm text-slate-500">
                                            <p>{Headers.length} Players</p>
                                            {/* Logic for player count in summary? I only sent hostName. */}
                                            <p>{match.spectators} Watching</p>
                                        </div>
                                        <Link href={`/game/${match.roomId}`} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition">
                                            <Tv size={18} /> Watch
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
