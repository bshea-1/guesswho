import GameClient from '@/components/GameClient';

export default function Page({ params }: { params: { roomId: string } }) {
    return <GameClient roomId={params.roomId} />;
}
