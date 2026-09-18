'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { PenTool } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { YFilesModelRecord } from '@/app/services/yfiles';

const DrawioStudio = dynamic(
  () => import('@/app/components/DrawioStudio').then((mod) => ({ default: mod.DrawioStudio })),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-purple-500/20 blur-md -z-10 animate-ping" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-white tracking-tight">
              Draw<span className="text-indigo-400">.io</span> Studio
            </span>
            <span className="text-xs text-zinc-500">
              Loading Draw.io Integration Engine...
            </span>
          </div>
          <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden mt-2">
            <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    )
  }
);

export default function Home() {
  const router = useRouter();
  const [exportedXml, setExportedXml] = useState<string | undefined>(undefined);

  const handleExportToDrawio = (xml: string, _title?: string) => {
    setExportedXml(xml);
  };

  const handleLoadYFilesModel = (model: YFilesModelRecord) => {
    const params = new URLSearchParams({
      modelId: model._id,
    });
    router.push(`/diagram?${params.toString()}`);
  };

  const handleOpenMetamodels = () => {
    router.push('/metamodel');
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-950">
      <DrawioStudio
        onBack={() => router.back()}
        initialXml={exportedXml}
        initialTab={exportedXml ? 'editor' : undefined}
        onLoadYFilesModel={handleLoadYFilesModel}
        onOpenMetamodels={handleOpenMetamodels}
      />
    </div>
  );
}