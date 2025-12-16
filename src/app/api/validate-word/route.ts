import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word')?.toLowerCase().trim();

    if (!word) {
        return NextResponse.json({ valid: false, error: 'No word provided' }, { status: 400 });
    }

    // Minimum word length
    if (word.length < 2) {
        return NextResponse.json({ valid: false, error: 'Word too short' });
    }

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);

        if (response.ok) {
            return NextResponse.json({ valid: true });
        } else if (response.status === 404) {
            return NextResponse.json({ valid: false, error: 'Word not found in dictionary' });
        } else {
            // API error - be lenient and accept the word
            console.error('Dictionary API error:', response.status);
            return NextResponse.json({ valid: true, warning: 'Could not verify, accepted' });
        }
    } catch (error) {
        console.error('Dictionary API fetch error:', error);
        // On network error, be lenient
        return NextResponse.json({ valid: true, warning: 'Could not verify, accepted' });
    }
}
