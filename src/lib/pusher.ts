import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new PusherServer({
    appId: process.env.PUSHER_APP_ID || '1910777',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || 'da0647c093122c4f6974',
    secret: process.env.PUSHER_SECRET || '58d976378411c801e05a',
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
    useTLS: true,
});

// Client-side Pusher instance
// Ensure singleton in client to avoid multiple connections
// Client-side Pusher instance
// Ensure singleton in client to avoid multiple connections
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
    if (pusherClientInstance) {
        return pusherClientInstance;
    }

    // Hardcoded fallback to ensure production works immediately
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY || 'da0647c093122c4f6974';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

    if (!key) {
        console.error('Pusher Key is missing! Check NEXT_PUBLIC_PUSHER_KEY in environment variables.');
        throw new Error('Pusher Key is missing');
    }

    pusherClientInstance = new PusherClient(key, {
        cluster: cluster,
    });

    return pusherClientInstance;
};
