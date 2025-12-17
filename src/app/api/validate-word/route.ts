import { NextResponse } from 'next/server';

// Common words that the API might not have but are definitely valid
const COMMON_WORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
    'under', 'over', 'out', 'off', 'up', 'down', 'about', 'against', 'along',
    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also',
    'now', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'any', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
    'you', 'your', 'yours', 'yourself', 'yourselves',
    'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
    'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
    'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
    'am', 'been', 'being', 'go', 'goes', 'went', 'gone', 'going',
    'get', 'gets', 'got', 'gotten', 'getting', 'make', 'makes', 'made', 'making',
    'say', 'says', 'said', 'saying', 'see', 'sees', 'saw', 'seen', 'seeing',
    'come', 'comes', 'came', 'coming', 'take', 'takes', 'took', 'taken', 'taking',
    'know', 'knows', 'knew', 'known', 'knowing', 'think', 'thinks', 'thought', 'thinking',
    'give', 'gives', 'gave', 'given', 'giving', 'tell', 'tells', 'told', 'telling',
    'find', 'finds', 'found', 'finding', 'put', 'puts', 'putting',
    'use', 'uses', 'used', 'using', 'try', 'tries', 'tried', 'trying',
    'ask', 'asks', 'asked', 'asking', 'work', 'works', 'worked', 'working',
    'seem', 'seems', 'seemed', 'seeming', 'feel', 'feels', 'felt', 'feeling',
    'become', 'becomes', 'became', 'becoming', 'leave', 'leaves', 'left', 'leaving',
    'call', 'calls', 'called', 'calling', 'keep', 'keeps', 'kept', 'keeping',
    'let', 'lets', 'letting', 'begin', 'begins', 'began', 'begun', 'beginning',
    'show', 'shows', 'showed', 'shown', 'showing', 'hear', 'hears', 'heard', 'hearing',
    'play', 'plays', 'played', 'playing', 'run', 'runs', 'ran', 'running',
    'move', 'moves', 'moved', 'moving', 'live', 'lives', 'lived', 'living',
    'believe', 'believes', 'believed', 'believing', 'bring', 'brings', 'brought', 'bringing',
    'happen', 'happens', 'happened', 'happening', 'write', 'writes', 'wrote', 'written', 'writing',
    'provide', 'provides', 'provided', 'providing', 'sit', 'sits', 'sat', 'sitting',
    'stand', 'stands', 'stood', 'standing', 'lose', 'loses', 'lost', 'losing',
    'pay', 'pays', 'paid', 'paying', 'meet', 'meets', 'met', 'meeting',
    'include', 'includes', 'included', 'including', 'continue', 'continues', 'continued', 'continuing',
    'set', 'sets', 'setting', 'learn', 'learns', 'learned', 'learning',
    'change', 'changes', 'changed', 'changing', 'lead', 'leads', 'led', 'leading',
    'understand', 'understands', 'understood', 'understanding', 'watch', 'watches', 'watched', 'watching',
    'follow', 'follows', 'followed', 'following', 'stop', 'stops', 'stopped', 'stopping',
    'create', 'creates', 'created', 'creating', 'speak', 'speaks', 'spoke', 'spoken', 'speaking',
    'read', 'reads', 'reading', 'spend', 'spends', 'spent', 'spending',
    'grow', 'grows', 'grew', 'grown', 'growing', 'open', 'opens', 'opened', 'opening',
    'walk', 'walks', 'walked', 'walking', 'win', 'wins', 'won', 'winning',
    'offer', 'offers', 'offered', 'offering', 'remember', 'remembers', 'remembered', 'remembering',
    'love', 'loves', 'loved', 'loving', 'consider', 'considers', 'considered', 'considering',
    'appear', 'appears', 'appeared', 'appearing', 'buy', 'buys', 'bought', 'buying',
    'wait', 'waits', 'waited', 'waiting', 'serve', 'serves', 'served', 'serving',
    'die', 'dies', 'died', 'dying', 'send', 'sends', 'sent', 'sending',
    'expect', 'expects', 'expected', 'expecting', 'build', 'builds', 'built', 'building',
    'stay', 'stays', 'stayed', 'staying', 'fall', 'falls', 'fell', 'fallen', 'falling',
    'cut', 'cuts', 'cutting', 'reach', 'reaches', 'reached', 'reaching',
    'kill', 'kills', 'killed', 'killing', 'remain', 'remains', 'remained', 'remaining',
    // Common nouns
    'time', 'year', 'people', 'way', 'day', 'man', 'woman', 'child', 'world', 'life',
    'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'program', 'question',
    'work', 'government', 'number', 'night', 'point', 'home', 'water', 'room', 'mother',
    'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book', 'eye',
    'job', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service', 'friend',
    'father', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car', 'city',
    'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body', 'information',
    'back', 'parent', 'face', 'others', 'level', 'office', 'door', 'health', 'person', 'art',
    // Common adjectives
    'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old',
    'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important',
    'few', 'public', 'bad', 'same', 'able', 'best', 'better', 'sure', 'free', 'true', 'whole'
]);

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

    // Check common words first (API misses many of these)
    if (COMMON_WORDS.has(word)) {
        return NextResponse.json({ valid: true, source: 'common' });
    }

    try {
        // Use Dictionary API only (Verified & clean definitions)
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);

        if (response.ok) {
            return NextResponse.json({ valid: true, source: 'dictionary-api' });
        } else {
            // Word not found or API error - reject
            return NextResponse.json({ valid: false, error: 'Word not found in dictionary' });
        }
    } catch (error) {
        console.error('Dictionary API fetch error:', error);
        // On network error, be strict
        return NextResponse.json({ valid: false, error: 'Validation service unavailable' });
    }
}
