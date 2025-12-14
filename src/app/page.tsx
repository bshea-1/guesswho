import { Suspense } from 'react';
import HomeClient from '@/components/HomeClient';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>}>
      <HomeClient />
    </Suspense>
  );
}
