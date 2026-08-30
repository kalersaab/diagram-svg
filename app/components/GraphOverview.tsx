'use client';

import React, { useEffect, useRef } from 'react';
import { GraphComponent, GraphOverviewComponent } from '@yfiles/yfiles';
import { MapPin, EyeOff, Maximize2 } from 'lucide-react';

interface GraphOverviewProps {
  graphComponent: GraphComponent | null;
  isOpen: boolean;
  onToggle: () => void;
}

export const GraphOverview: React.FC<GraphOverviewProps> = ({
  graphComponent,
  isOpen,
  onToggle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<GraphOverviewComponent | null>(null);

  useEffect(() => {
    if (!containerRef.current || !graphComponent) return;

    const overview = new GraphOverviewComponent();
    overview.graphComponent = graphComponent;
    overview.htmlElement.style.width = '100%';
    overview.htmlElement.style.height = '100%';
    overview.htmlElement.style.borderRadius = '8px';
    overview.htmlElement.style.overflow = 'hidden';

    containerRef.current.appendChild(overview.htmlElement);
    overviewRef.current = overview;

    return () => {
      if (overviewRef.current) {
        overviewRef.current.cleanUp();
        if (overview.htmlElement.parentNode) {
          overview.htmlElement.parentNode.removeChild(overview.htmlElement);
        }
        overviewRef.current = null;
      }
    };
  }, [graphComponent, isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute bottom-6 left-6 z-20 flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg shadow-xl backdrop-blur-md transition-all hover:text-white"
        title="Open Navigator"
      >
        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
        <span>Minimap</span>
      </button>
    );
  }

  return (
    <div className="absolute bottom-6 left-6 z-20 w-64 h-44 bg-zinc-900/95 border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col transition-all">
      {}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/80 border-b border-zinc-700/60 text-xs font-medium text-zinc-300 select-none">
        <div className="flex items-center gap-1.5 text-zinc-200">
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span>Navigator</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => graphComponent?.fitGraphBounds()}
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded transition-colors"
            title="Fit Graph"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={onToggle}
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 rounded transition-colors"
            title="Close Navigator"
          >
            <EyeOff className="w-3 h-3" />
          </button>
        </div>
      </div>

      {}
      <div ref={containerRef} className="flex-1 w-full h-full bg-zinc-950/80 relative" />
    </div>
  );
};