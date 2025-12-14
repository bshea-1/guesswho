import GameClient from '@/components/GameClient';

export default async function Page({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = await params;
    return <GameClient roomId={roomId} />;
}
