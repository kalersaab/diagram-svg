'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import YFilesService, { type YFilesModelRecord } from '@/app/services/yfiles';

const DiagramEditor = dynamic(
  () => import('@/app/components/DiagramEditor'),
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

const yfilesService = new YFilesService();

export default function DiagramPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modelId = searchParams.get('modelId');
  const [modelToLoad, setModelToLoad] = useState<YFilesModelRecord | null>(null);
  const [isLoading, setIsLoading] = useState(!!modelId);

  useEffect(() => {
    if (!modelId) {
      setIsLoading(false);
      return;
    }

    // Fetch the model if modelId is provided
    yfilesService
      .getYFilesModel(modelId)
      .then((model) => {
        setModelToLoad(model);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load model:', err);
        setIsLoading(false);
      });
  }, [modelId]);

  const handleExportToDrawio = (xml: string) => {
    const params = new URLSearchParams({
      xml: xml,
    });
    router.push(`/?${params.toString()}`);
  };

  const handleModelsChange = () => {
    // Optional: refresh model list or perform any action
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-md -z-10 animate-ping" />
          </div>
          <span className="text-sm text-zinc-400">Loading model...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-950">
      <DiagramEditor
        onExportToDrawio={handleExportToDrawio}
        onModelsChange={handleModelsChange}
        initialModelToLoad={modelToLoad}
      />
    </div>
  );
}
