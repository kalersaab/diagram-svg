'use client';

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { Sparkles, PenTool } from 'lucide-react';

const DiagramEditor = dynamic(
  () => import('./components/DiagramEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-md -z-10 animate-ping" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-white tracking-tight">
              Diagram<span className="text-indigo-400">SVG</span> Studio
            </span>
            <span className="text-xs text-zinc-500">
              Initializing yFiles Graph Engine...
            </span>
          </div>
          <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden mt-2">
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    )
  }
);

const DrawioStudio = dynamic(
  () => import('./components/DrawioStudio').then((mod) => ({ default: mod.DrawioStudio })),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
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

type StudioMode = 'drawio' | 'yfiles';

export default function Home() {
  const [mode, setMode] = useState<StudioMode>('drawio');

  const [exportedXml, setExportedXml] = useState<string | undefined>(undefined);

  const handleExportToDrawio = (xml: string, _title?: string) => {
    setExportedXml(xml);
    setMode('drawio');
  };

  if (mode === 'yfiles') {
    return (
      <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-950">
        <DiagramEditor onExportToDrawio={handleExportToDrawio} />
      </div>
    );
  }

  return (
    <DrawioStudio
      onBack={() => setMode('yfiles')}
      initialXml={exportedXml}
      initialTab={exportedXml ? 'editor' : undefined}
    />
  );
}