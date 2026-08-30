'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GraphComponent, Rect } from '@yfiles/yfiles';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Copy,
  Check,
  Eye,
  Code,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Palette,
  Maximize
} from 'lucide-react';
import {
  downloadPngFromSvg,
  downloadSvgString,
  exportGraphToSvgElement,
  svgElementToString
} from '../utils/yfiles-export';

interface SvgExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphComponent: GraphComponent | null;
  diagramTitle: string;
}

export const SvgExportModal: React.FC<SvgExportModalProps> = ({
  isOpen,
  onClose,
  graphComponent,
  diagramTitle
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [scale, setScale] = useState<number>(2);
  const [margin, setMargin] = useState<number>(25);
  const [background, setBackground] = useState<string>('#09090b');
  const [customBg, setCustomBg] = useState<string>('#09090b');
  const [scope, setScope] = useState<'all' | 'viewport' | 'selection'>('all');
  const [filename, setFilename] = useState<string>('');

  const [svgElement, setSvgElement] = useState<SVGElement | null>(null);
  const [svgCode, setSvgCode] = useState<string>('');
  const [svgDimensions, setSvgDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPngExporting, setIsPngExporting] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  const effectiveFilename =
    filename || diagramTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'diagram';

  useEffect(() => {
    if (!isOpen || !graphComponent) return;

    let isMounted = true;

    const generate = async () => {
      if (!isMounted) return;
      setIsGenerating(true);
      try {
        let bounds: Rect | null = null;
        if (scope === 'viewport') {
          bounds = graphComponent.viewport;
        } else if (
          scope === 'selection' &&
          graphComponent.selection.nodes.size > 0
        ) {
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;
          for (const n of graphComponent.selection.nodes) {
            minX = Math.min(minX, n.layout.x);
            minY = Math.min(minY, n.layout.y);
            maxX = Math.max(maxX, n.layout.x + n.layout.width);
            maxY = Math.max(maxY, n.layout.y + n.layout.height);
          }
          bounds = new Rect(minX, minY, Math.max(10, maxX - minX), Math.max(10, maxY - minY));
        }

        const effectiveBg = background === 'custom' ? customBg : background;

        const elem = await exportGraphToSvgElement(graphComponent, {
          scale,
          margin,
          background: effectiveBg,
          bounds
        });

        if (!isMounted) return;

        const xmlString = svgElementToString(elem);
        setSvgElement(elem);
        setSvgCode(xmlString);

        const w = parseFloat(elem.getAttribute('width') || '800');
        const h = parseFloat(elem.getAttribute('height') || '600');
        setSvgDimensions({ width: Math.round(w), height: Math.round(h) });
      } catch (err) {
        console.error('Failed to generate SVG preview:', err);
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };

    const timeout = setTimeout(generate, 50);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [isOpen, graphComponent, scale, margin, background, customBg, scope]);

  useEffect(() => {
    if (previewContainerRef.current && svgElement && activeTab === 'preview') {
      previewContainerRef.current.innerHTML = '';
      const cloned = svgElement.cloneNode(true) as SVGElement;
      cloned.style.maxWidth = '100%';
      cloned.style.maxHeight = '100%';
      cloned.style.height = 'auto';
      cloned.style.width = 'auto';
      cloned.style.objectFit = 'contain';
      previewContainerRef.current.appendChild(cloned);
    }
  }, [svgElement, activeTab]);

  if (!isOpen) return null;

  const handleCopySvg = async () => {
    if (!svgCode) return;
    try {
      await navigator.clipboard.writeText(svgCode);
      setIsCopied(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgCode) return;
    downloadSvgString(svgCode, `${effectiveFilename}.svg`);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 }
    });
  };

  const handleDownloadPng = async () => {
    if (!svgCode) return;
    setIsPngExporting(true);
    try {
      await downloadPngFromSvg(svgCode, `${effectiveFilename}.png`, 2);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 }
      });
    } catch (err) {
      console.error('PNG download failed:', err);
    } finally {
      setIsPngExporting(false);
    }
  };

  const bgPresets = [
    { id: '#09090b', label: 'Dark Zinc', color: '#09090b' },
    { id: '#000000', label: 'Black', color: '#000000' },
    { id: 'transparent', label: 'Transparent', color: 'transparent' },
    { id: '#ffffff', label: 'White', color: '#ffffff' },
    { id: '#0f172a', label: 'Navy', color: '#0f172a' },
    { id: 'custom', label: 'Custom', color: customBg }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[88vh] bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200 select-none">
        {}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                SVG & Image Export Studio
              </h2>
              <p className="text-xs text-zinc-400">
                Export vector SVG or high-resolution PNG with customizable scale, bounds, and colors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {}
            <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visual Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'code'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>SVG Code</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {}
        <div className="flex-1 flex overflow-hidden">
          {}
          <div className="flex-1 flex flex-col bg-zinc-950/60 p-6 overflow-hidden relative">
            {activeTab === 'preview' ? (
              <div
                className={`flex-1 flex items-center justify-center p-4 rounded-xl border border-zinc-800/80 overflow-hidden relative ${
                  background === 'transparent'
                    ? 'bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-950'
                    : ''
                }`}
                style={{
                  backgroundColor:
                    background === 'transparent'
                      ? undefined
                      : background === 'custom'
                      ? customBg
                      : background
                }}
              >
                {isGenerating && (
                  <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Rendering SVG...</span>
                    </div>
                  </div>
                )}
                <div
                  ref={previewContainerRef}
                  className="w-full h-full flex items-center justify-center overflow-auto"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col rounded-xl border border-zinc-800/80 overflow-hidden bg-zinc-950">
                <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>XML / SVG Source ({Math.round(svgCode.length / 1024)} KB)</span>
                  <span>{svgCode.split('\n').length} Lines</span>
                </div>
                <textarea
                  readOnly
                  value={svgCode}
                  className="flex-1 w-full p-4 bg-transparent text-zinc-300 font-mono text-xs resize-none focus:outline-none overflow-auto leading-relaxed select-text"
                />
              </div>
            )}

            {}
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-4">
                <span>
                  Dimensions:{' '}
                  <strong className="text-zinc-200 font-mono">
                    {svgDimensions.width} × {svgDimensions.height} px
                  </strong>
                </span>
                <span>
                  Scale:{' '}
                  <strong className="text-zinc-200 font-mono">{scale}x</strong>
                </span>
                <span>
                  Size:{' '}
                  <strong className="text-zinc-200 font-mono">
                    {(svgCode.length / 1024).toFixed(1)} KB
                  </strong>
                </span>
              </div>
              <span className="text-zinc-500 text-[11px]">
                Valid Scalable Vector Graphics (SVG 1.1)
              </span>
            </div>
          </div>

          {}
          <div className="w-80 border-l border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between overflow-y-auto space-y-5">
            <div className="space-y-4">
              {}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                  Export Filename
                </label>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none"
                    placeholder={effectiveFilename}
                  />
                  <span className="text-xs font-mono text-zinc-500">.svg</span>
                </div>
              </div>

              {}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Export Scope</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'all', label: 'Full Graph' },
                      { id: 'viewport', label: 'Viewport' },
                      { id: 'selection', label: 'Selection' }
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setScope(s.id)}
                      className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        scope === s.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Maximize className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Resolution Scale ({scale}x)</span>
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[0.5, 1, 1.5, 2, 3].map((sc) => (
                    <button
                      key={sc}
                      onClick={() => setScale(sc)}
                      className={`py-1 text-xs font-mono rounded-lg border transition-colors ${
                        scale === sc
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {sc}x
                    </button>
                  ))}
                </div>
              </div>

              {}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                  Margin / Padding: {margin}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>

              {}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Background Color</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {bgPresets.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setBackground(bg.id)}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                        background === bg.id
                          ? 'border-indigo-500 bg-indigo-600/10 text-white'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div
                        style={{
                          backgroundColor:
                            bg.id === 'transparent' ? '#3f3f46' : bg.color
                        }}
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                      />
                      <span>{bg.label}</span>
                    </button>
                  ))}
                </div>

                {background === 'custom' && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={customBg}
                      onChange={(e) => setCustomBg(e.target.value)}
                      className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customBg}
                      onChange={(e) => setCustomBg(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            {}
            <div className="space-y-2 pt-4 border-t border-zinc-800">
              <button
                onClick={handleDownloadSvg}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>Download .SVG File</span>
              </button>

              <button
                onClick={handleCopySvg}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 rounded-xl text-xs font-medium transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SVG Markup</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadPng}
                disabled={isPngExporting}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-950 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl text-xs font-medium transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>
                  {isPngExporting ? 'Exporting PNG...' : 'Download .PNG Raster'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};