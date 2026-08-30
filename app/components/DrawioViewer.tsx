'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Code2,
  Copy,
  Check,
  Sun,
  Moon,
  Image as ImageIcon,
  FileCode2,
  Move
} from 'lucide-react';
import { downloadFile, downloadSvgAsPng } from '../utils/diagram-storage';

interface DrawioViewerProps {
  svgContent: string;
  diagramTitle?: string;
  diagramXml?: string;
  className?: string;
}

export function DrawioViewer({
  svgContent,
  diagramTitle = 'Diagram',
  diagramXml,
  className = ''
}: DrawioViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showCode, setShowCode] = useState<boolean>(false);
  const [codeType, setCodeType] = useState<'svg' | 'xml'>('svg');
  const [copied, setCopied] = useState<boolean>(false);
  const [darkBg, setDarkBg] = useState<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((z) => Math.min(Math.max(z + delta, 0.1), 5));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.1));
  const handleFit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = codeType === 'svg' ? svgContent : (diagramXml || '');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [svgContent, diagramXml, codeType]);

  const handleExportSvg = useCallback(() => {
    if (!svgContent) return;
    const filename = `${diagramTitle.replace(/\s+/g, '_').toLowerCase()}.svg`;
    downloadFile(svgContent, filename, 'image/svg+xml');
  }, [svgContent, diagramTitle]);

  const handleExportPng = useCallback(() => {
    if (!svgContent) return;
    const filename = `${diagramTitle.replace(/\s+/g, '_').toLowerCase()}.png`;
    downloadSvgAsPng(svgContent, filename);
  }, [svgContent, diagramTitle]);

  const handleExportXml = useCallback(() => {
    if (!diagramXml) return;
    const filename = `${diagramTitle.replace(/\s+/g, '_').toLowerCase()}.drawio`;
    downloadFile(diagramXml, filename, 'application/xml');
  }, [diagramXml, diagramTitle]);

  const hasSvg = svgContent && svgContent.trim().length > 0;

  return (
    <div className={`flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden ${className}`}>
      {}
      <div className="h-12 border-b border-zinc-800/80 bg-zinc-900/90 px-4 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md">
        {}
        <div className="flex items-center gap-1.5">
          <button onClick={handleZoomOut} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-400 font-mono w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={handleZoomIn} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-zinc-800 mx-1" />
          <button onClick={handleFit} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Fit to View">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={handleReset} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Reset View">
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-zinc-800 mx-1" />
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <Move className="w-3 h-3" />
            <span>Drag to Pan</span>
          </div>
        </div>

        {}
        <div className="flex items-center gap-1.5">
          {}
          <button
            onClick={() => setDarkBg(!darkBg)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={darkBg ? 'Light background' : 'Dark background'}
          >
            {darkBg ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {}
          <button
            onClick={() => setShowCode(!showCode)}
            className={`p-1.5 rounded-lg transition-colors ${showCode ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="View Source Code"
          >
            <Code2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-zinc-800 mx-1" />

          {}
          <button onClick={handleExportSvg} className="flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Export SVG">
            <FileCode2 className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>
          <button onClick={handleExportPng} className="flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Export PNG">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>
          {diagramXml && (
            <button onClick={handleExportXml} className="flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Export .drawio">
              <Download className="w-3.5 h-3.5" />
              <span>.drawio</span>
            </button>
          )}
        </div>
      </div>

      {}
      <div className="flex-1 flex overflow-hidden relative">
        {}
        <div
          ref={containerRef}
          className={`flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative transition-colors duration-300 ${darkBg ? 'bg-zinc-950' : 'bg-white'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, ${darkBg ? '#fff' : '#000'} 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }}
          />

          {hasSvg ? (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.15s ease-out'
              }}
            >
              <div
                className="max-w-full max-h-full [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <FileCode2 className="w-8 h-8 text-zinc-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-400">No SVG Diagram Loaded</p>
                <p className="text-xs text-zinc-600 mt-1">Create or edit a diagram in Draw.io, then save to view here</p>
              </div>
            </div>
          )}
        </div>

        {}
        {showCode && (
          <div className="w-[420px] border-l border-zinc-800/80 bg-zinc-900/95 flex flex-col shrink-0 backdrop-blur-md">
            {}
            <div className="h-10 border-b border-zinc-800/60 px-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCodeType('svg')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${codeType === 'svg' ? 'bg-indigo-500/15 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  SVG Source
                </button>
                {diagramXml && (
                  <button
                    onClick={() => setCodeType('xml')}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${codeType === 'xml' ? 'bg-indigo-500/15 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Draw.io XML
                  </button>
                )}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-[11px] font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap break-all">
              {codeType === 'svg' ? svgContent : (diagramXml || 'No XML available')}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}