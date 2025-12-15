import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
});

// Client-side Pusher instance
// Ensure singleton in client to avoid multiple connections
// Client-side Pusher instance
// Ensure singleton in client to avoid multiple connections
export const getPusherClient = () => {
    // Hardcoded fallback to ensure production works immediately
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY || 'da0647c093122c4f6974';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

    if (!key) {
        console.error('Pusher Key is missing! Check NEXT_PUBLIC_PUSHER_KEY in environment variables.');
        throw new Error('Pusher Key is missing');
    }
    return new PusherClient(key, {
        cluster: cluster,
    });
};
