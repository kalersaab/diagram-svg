'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  sendDrawioAction,
  loadDiagramIntoDrawio,
  requestDrawioExport,
  decodeDrawioSvgData,
  sanitizeDiagramXml,
  type DrawioEvent
} from '../utils/drawio-bridge';
import {
  Save,
  Sparkles,
  Eye,
  RefreshCw,
  Server,
  Globe,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DrawioEmbedProps {
  initialXml?: string;
  diagramTitle?: string;
  onSave?: (xml: string, svg?: string) => void;
  onViewSvg?: () => void;
  autoExportSvg?: boolean;
  className?: string;
}

export function DrawioEmbed({
  initialXml = '',
  diagramTitle = 'Untitled Diagram',
  onSave,
  onViewSvg,
  autoExportSvg = true,
  className = ''
}: DrawioEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [status, setStatus] = useState<'connecting' | 'ready' | 'saving' | 'synced'>('connecting');
  const [useLocalSource, setUseLocalSource] = useState<boolean>(true);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);

  // XML and SVG references for asynchronous event correlation
  const currentXmlRef = useRef<string>(sanitizeDiagramXml(initialXml));
  const pendingSaveResolveRef = useRef<((svg: string) => void) | null>(null);

  // Construct Draw.io URL with embedding parameters
  const localUrl = `/drawio/index.html?embed=1&proto=json&spin=1&analytics=0&gapi=0&db=0&od=0&gh=0&tr=0&ui=min&libraries=1`;
  const cloudUrl = `https://embed.diagrams.net/?embed=1&proto=json&spin=1&analytics=0&gapi=0&db=0&od=0&gh=0&tr=0&ui=min&libraries=1`;
  const drawioSrc = useLocalSource ? localUrl : cloudUrl;

  // Handle messages from the Draw.io iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (typeof e.data !== 'string') return;
      
      try {
        const msg: DrawioEvent = JSON.parse(e.data);
        if (!msg || !msg.event) return;

        switch (msg.event) {
          case 'init': {
            setIsReady(true);
            setStatus('ready');
            // Load diagram into Draw.io
            loadDiagramIntoDrawio(iframeRef.current, currentXmlRef.current, diagramTitle);
            break;
          }

          case 'autosave':
          case 'save': {
            setStatus('saving');
            // msg.xml is always the clean diagram XML (mxfile/mxGraphModel).
            // Sanitize defensively in case older stored data sneaks in.
            const newXml = sanitizeDiagramXml(msg.xml || currentXmlRef.current);
            currentXmlRef.current = newXml;

            // Request pure SVG export — msg.xml on the export event will carry
            // the clean diagram XML, msg.data will carry the SVG data URL.
            if (autoExportSvg) {
              requestDrawioExport(iframeRef.current, 'svg');
            } else {
              if (onSave) onSave(newXml);
              setStatus('synced');
              setLastSavedTime(new Date());
            }
            break;
          }

          case 'export': {
            const rawSvg = msg.data || '';
            const cleanSvg = decodeDrawioSvgData(rawSvg);
            // msg.xml on the export event carries the current diagram XML.
            // Sanitize it so we never store xmlsvg-contaminated content.
            const xml = sanitizeDiagramXml(msg.xml || currentXmlRef.current);
            // Keep the ref in sync with the latest clean XML.
            currentXmlRef.current = xml;

            if (onSave) {
              onSave(xml, cleanSvg);
            }

            if (pendingSaveResolveRef.current) {
              pendingSaveResolveRef.current(cleanSvg);
              pendingSaveResolveRef.current = null;
            }

            setStatus('synced');
            setLastSavedTime(new Date());
            break;
          }

          case 'exit': {
            if (onViewSvg) {
              onViewSvg();
            }
            break;
          }
        }
      } catch {
        // Non-JSON message, ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [autoExportSvg, diagramTitle, onSave, onViewSvg]);

  // When initialXml changes from outside, reload if ready
  useEffect(() => {
    if (initialXml && initialXml !== currentXmlRef.current) {
      const clean = sanitizeDiagramXml(initialXml);
      currentXmlRef.current = clean;
      if (isReady && iframeRef.current) {
        loadDiagramIntoDrawio(iframeRef.current, clean, diagramTitle);
      }
    }
  }, [initialXml, isReady, diagramTitle]);

  // Manually trigger Save & Export
  const handleManualSave = useCallback(() => {
    if (!iframeRef.current) return;
    setStatus('saving');
    requestDrawioExport(iframeRef.current, 'xmlsvg');
  }, []);

  // Reload iframe
  const handleReload = useCallback(() => {
    setIsReady(false);
    setStatus('connecting');
    setIframeKey((k) => k + 1);
  }, []);

  return (
    <div className={`flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden ${className}`}>
      {/* Top Embedded Control Bar */}
      <div className="h-12 border-b border-zinc-800/80 bg-zinc-900/90 px-4 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-200">Draw.io Engine</span>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Connection Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 text-[11px]">
            {status === 'connecting' && (
              <>
                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-amber-400 font-medium">Connecting...</span>
              </>
            )}
            {status === 'ready' && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-zinc-300">Ready</span>
              </>
            )}
            {status === 'saving' && (
              <>
                <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                <span className="text-indigo-300">Syncing SVG...</span>
              </>
            )}
            {status === 'synced' && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">
                  Synced {lastSavedTime ? lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Local vs Cloud draw.io engine */}
          <button
            type="button"
            onClick={() => {
              setUseLocalSource(!useLocalSource);
              handleReload();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition-colors"
            title={useLocalSource ? 'Switch to cloud Draw.io' : 'Switch to local Draw.io'}
          >
            {useLocalSource ? (
              <>
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>Local Engine</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Cloud Engine</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReload}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Reload Editor"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Sync & Save Button */}
          <button
            type="button"
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save &amp; Sync</span>
          </button>

          {/* View in SVG Display Button */}
          {onViewSvg && (
            <button
              type="button"
              onClick={onViewSvg}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-sm shadow-purple-600/30 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View in Next.js SVG</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Draw.io iframe container */}
      <div className="flex-1 relative w-full h-full bg-zinc-900">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={drawioSrc}
          title="Draw.io Diagram Editor"
          className="w-full h-full border-none"
          allow="clipboard-read; clipboard-write"
        />

        {!isReady && (
          <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center animate-pulse">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-zinc-300">Initializing Draw.io Integration Engine...</p>
            <p className="text-xs text-zinc-500">Loading {useLocalSource ? 'local webapp assets' : 'cloud editor'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
