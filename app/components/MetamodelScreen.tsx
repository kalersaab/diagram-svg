'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  FileCode2,
  Database,
  ArrowRightLeft,
  Trash2,
  RefreshCw,
  Search,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Boxes,
  Sparkles,
  FolderOpen,
  Tag,
  ArrowLeft,
  Download,
} from 'lucide-react';
import MetamodelService, { type ApiMetamodelDocument } from '@/app/services/metamodel';
import { parseXmlToMetamodel, type ParseResult } from '@/app/utils/xml-metamodel-parser';
import type { ObjectTypeDefinition, RelationshipTypeDefinition } from '@/app/utils/metamodel';
import { useAuth } from '@/app/hooks/useAuth';
import { AuthModal } from './AuthModal';

const metamodelService = new MetamodelService();

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full border border-white/20 shrink-0"
      style={{ background: color }}
    />
  );
}

function ShapeBadge({ shape }: { shape: string }) {
  const map: Record<string, string> = {
    card: 'bg-sky-950/50 text-sky-300 border-sky-800/50',
    rectangle: 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60',
    rounded: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50',
    diamond: 'bg-amber-950/50 text-amber-300 border-amber-800/50',
    cylinder: 'bg-purple-950/50 text-purple-300 border-purple-800/50',
    capsule: 'bg-pink-950/50 text-pink-300 border-pink-800/50',
  };
  const cls = map[shape] ?? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${cls}`}>
      {shape}
    </span>
  );
}

function SectionHeader({
  icon, title, count, color = 'indigo',
}: { icon: React.ReactNode; title: string; count: number; color?: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20',
  };
  const cls = colorMap[color] ?? colorMap.indigo;
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r ${cls} border-b`}>
      <div className="text-current opacity-80">{icon}</div>
      <span className="text-xs font-bold uppercase tracking-widest opacity-80">{title}</span>
      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-current/10 font-bold opacity-80">{count}</span>
    </div>
  );
}

function ObjectTypeRow({ ot, index }: { ot: ObjectTypeDefinition; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-zinc-800/40 last:border-0">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <span className="text-[10px] text-zinc-600 w-4 text-right shrink-0">{index + 1}</span>
        <ColorDot color={ot.color} />
        <span className="flex-1 text-xs font-semibold text-zinc-200 truncate">{ot.name}</span>
        {ot.group && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 mr-1">{ot.group}</span>
        )}
        <ShapeBadge shape={ot.shape} />
        <span className="text-zinc-600 text-[10px] ml-2">{ot.allowedAttributes.length} attr{ot.allowedAttributes.length !== 1 ? 's' : ''}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && ot.allowedAttributes.length > 0 && (
        <div className="px-6 pb-3 pt-1 grid grid-cols-2 gap-1.5">
          {ot.allowedAttributes.map(attr => (
            <div key={attr.key} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <Tag className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="text-[11px] text-zinc-300 truncate">{attr.label}</span>
              <span className="ml-auto text-[10px] text-zinc-500">{attr.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RelationshipRow({ rt, index }: { rt: RelationshipTypeDefinition; index: number }) {
  return (
    <div className="border-b border-zinc-800/40 last:border-0 flex items-center gap-3 px-4 py-2.5">
      <span className="text-[10px] text-zinc-600 w-4 text-right shrink-0">{index + 1}</span>
      <ColorDot color={rt.color} />
      <span className="flex-1 text-xs font-semibold text-zinc-200 truncate">{rt.name}</span>
      {rt.dashed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/50 text-zinc-400">dashed</span>}
      {rt.strokeWidth && rt.strokeWidth > 1 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/50 text-zinc-400">x{rt.strokeWidth}</span>}
    </div>
  );
}

function UploadZone({ onFile, isProcessing }: { onFile: (f: File) => void; isProcessing: boolean }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 p-10 ${dragging ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]' : 'border-zinc-700 bg-zinc-900/40 hover:border-indigo-500/60 hover:bg-zinc-800/30'}`}
    >
      <input ref={inputRef} type="file" accept=".xml,.drawio" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
          {isProcessing ? <Loader2 className="w-9 h-9 text-indigo-400 animate-spin" /> : <Upload className="w-9 h-9 text-indigo-400" />}
        </div>
        {!isProcessing && <div className="absolute -inset-1 rounded-2xl bg-indigo-500/10 blur-md -z-10 animate-pulse" />}
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span className="text-sm font-bold text-zinc-100">{isProcessing ? 'Parsing XML…' : 'Drop your XML file here'}</span>
        <span className="text-xs text-zinc-500">Supports draw.io (.xml, .drawio) and generic XML</span>
        {!isProcessing && <span className="mt-1 text-[11px] px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">Click to browse files</span>}
      </div>
    </div>
  );
}

function ParsePreviewPanel({ result, fileName, onImport, onDiscard, isImporting }: {
  result: ParseResult; fileName: string;
  onImport: (name: string) => void;
  onDiscard: () => void;
  isImporting: boolean;
}) {
  const [name, setName] = useState(fileName.replace(/\.(xml|drawio)$/i, '') || 'Imported Metamodel');
  const { objectTypes, relationshipTypes } = result.metamodel;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 px-1">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-zinc-100">XML parsed — {result.mode === 'drawio' ? 'draw.io diagram' : 'generic XML'}</p>
          <p className="text-[11px] text-zinc-500">Found {objectTypes.length} object type{objectTypes.length !== 1 ? 's' : ''} &amp; {relationshipTypes.length} relationship type{relationshipTypes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onDiscard} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-4 h-4" /></button>
      </div>

      {result.errors.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-950/30 border border-amber-700/30 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{result.errors.join('; ')}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          value={name} onChange={e => setName(e.target.value)}
          className="flex-1 px-3 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          placeholder="Metamodel name…"
        />
        <button
          onClick={() => onImport(name || 'Imported Metamodel')}
          disabled={isImporting || !name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>{isImporting ? 'Importing…' : 'Import'}</span>
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
        <SectionHeader icon={<Boxes className="w-3.5 h-3.5" />} title="Object Types" count={objectTypes.length} color="indigo" />
        <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/40">
          {objectTypes.length === 0 ? <p className="px-4 py-3 text-xs text-zinc-500 italic">No object types detected</p>
            : objectTypes.map((ot, i) => <ObjectTypeRow key={ot.id} ot={ot} index={i} />)}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
        <SectionHeader icon={<ArrowRightLeft className="w-3.5 h-3.5" />} title="Relationship Types" count={relationshipTypes.length} color="purple" />
        <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800/40">
          {relationshipTypes.length === 0 ? <p className="px-4 py-3 text-xs text-zinc-500 italic">No relationship types detected</p>
            : relationshipTypes.map((rt, i) => <RelationshipRow key={rt.id} rt={rt} index={i} />)}
        </div>
      </div>
    </div>
  );
}

function MetamodelDetailPanel({ doc, onClose }: { doc: ApiMetamodelDocument; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full border-l border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="h-12 flex items-center gap-3 px-4 border-b border-zinc-800 shrink-0">
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-4 h-4" /></button>
        <p className="text-xs font-bold text-zinc-100 flex-1 truncate">{doc.name}</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-bold shrink-0">{doc.objectTypes.length + doc.relationshipTypes.length} types</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <SectionHeader icon={<Boxes className="w-3.5 h-3.5" />} title="Object Types" count={doc.objectTypes.length} color="indigo" />
          <div className="divide-y divide-zinc-800/40">
            {doc.objectTypes.length === 0 ? <p className="px-4 py-3 text-xs text-zinc-500 italic">None</p>
              : doc.objectTypes.map((ot, i) => (
                <ObjectTypeRow key={ot._id ?? i} ot={{
                  id: (ot as { id?: string }).id ?? ot._id,
                  _id: ot._id,
                  name: ot.name,
                  group: ot.group,
                  icon: ot.icon,
                  color: ot.color,
                  shape: ot.shape as import('@/app/utils/yfiles-styles').NodeShape,
                  allowedAttributes: (ot.allowedAttributes ?? []) as import('@/app/utils/metamodel').AttributeDefinition[],
                }} index={i} />
              ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <SectionHeader icon={<ArrowRightLeft className="w-3.5 h-3.5" />} title="Relationship Types" count={doc.relationshipTypes.length} color="purple" />
          <div className="divide-y divide-zinc-800/40">
            {doc.relationshipTypes.length === 0 ? <p className="px-4 py-3 text-xs text-zinc-500 italic">None</p>
              : doc.relationshipTypes.map((rt, i) => (
                <RelationshipRow key={rt._id ?? i} rt={{
                  id: (rt as { id?: string }).id ?? rt._id,
                  _id: rt._id,
                  name: rt.name,
                  color: rt.color,
                  dashed: rt.dashed,
                  strokeWidth: rt.strokeWidth,
                  allowedSourceTypes: (rt.allowedSourceTypes ?? []).map((s: { _id: string } | string) => typeof s === 'string' ? s : s._id),
                  allowedTargetTypes: (rt.allowedTargetTypes ?? []).map((t: { _id: string } | string) => typeof t === 'string' ? t : t._id),
                }} index={i} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetamodelScreenProps {
  onBack?: () => void;
}

export function MetamodelScreen({ onBack }: MetamodelScreenProps) {
  const auth = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [metamodels, setMetamodels] = useState<ApiMetamodelDocument[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedDoc, setSelectedDoc] = useState<ApiMetamodelDocument | null>(null);
  const [search, setSearch] = useState('');

  const isAuth = auth.status === 'authenticated';

  const fetchMetamodels = useCallback(async () => {
    if (auth.status !== 'authenticated') return;
    setIsLoadingList(true); setListError(null);
    try {
      const res = await metamodelService.getMetamodels();
      setMetamodels(res.data ?? []);
    } catch { setListError('Failed to load metamodels'); }
    finally { setIsLoadingList(false); }
  }, [auth.status]);

  useEffect(() => { fetchMetamodels(); }, [fetchMetamodels]);

  const handleFile = useCallback(async (file: File) => {
    setIsParsing(true); setParseResult(null); setFileName(file.name); setImportSuccess(false);
    try { const text = await file.text(); setParseResult(parseXmlToMetamodel(text)); }
    finally { setIsParsing(false); }
  }, []);

  const handleImport = useCallback(async (name: string) => {
    if (!parseResult) return;
    if (!isAuth) { setShowAuthModal(true); return; }
    setIsImporting(true);
    try {
      await metamodelService.syncMetamodel(name, parseResult.metamodel);
      setImportSuccess(true); setParseResult(null); setFileName('');
      await fetchMetamodels();
    } catch (e) { alert('Import failed: ' + String(e)); }
    finally { setIsImporting(false); }
  }, [parseResult, isAuth, fetchMetamodels]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingIds(s => new Set(s).add(id));
    try {
      await metamodelService.deleteMetamodel({ pathParams: { id } });
      setMetamodels(prev => prev.filter(m => m._id !== id));
      if (selectedDoc?._id === id) setSelectedDoc(null);
    } catch { alert('Delete failed'); }
    finally { setDeletingIds(s => { const n = new Set(s); n.delete(id); return n; }); }
  }, [selectedDoc]);

  const filtered = useMemo(() =>
    metamodels.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase())),
    [metamodels, search]);

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {showAuthModal && <AuthModal auth={auth} onClose={() => setShowAuthModal(false)} />}

      {/* Top bar */}
      <div className="h-12 border-b border-zinc-800/80 bg-zinc-900/90 px-4 flex items-center gap-3 shrink-0 backdrop-blur-md">
        {onBack && (
          <>
            <button onClick={onBack} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /><span>Back</span>
            </button>
            <div className="h-5 w-px bg-zinc-800" />
          </>
        )}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20">
            <Database className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            Meta<span className="text-violet-400">model</span>
            <span className="text-zinc-500 font-normal ml-1.5 text-xs">Manager</span>
          </span>
        </div>
        <div className="h-5 w-px bg-zinc-800 mx-1" />
        <span className="text-xs text-zinc-500 hidden md:block">Upload XML to extract &amp; save metamodels</span>
        <div className="ml-auto flex items-center gap-2">
          {isAuth ? (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />{auth.user?.email ?? 'Authenticated'}
            </span>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
              <Sparkles className="w-3.5 h-3.5" />Sign in to save
            </button>
          )}
          <button onClick={fetchMetamodels} disabled={isLoadingList || !isAuth} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-40 transition-colors" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[420px] shrink-0 border-r border-zinc-800 flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-zinc-800/60 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">Upload XML</h2>
            </div>
            <p className="text-[11px] text-zinc-500">Parse draw.io or custom XML to extract metamodel structure</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {importSuccess && !parseResult && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-700/30 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Metamodel imported successfully!</span>
                <button onClick={() => setImportSuccess(false)} className="ml-auto text-emerald-500 hover:text-emerald-300"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}
            {!parseResult ? (
              <UploadZone onFile={handleFile} isProcessing={isParsing} />
            ) : (
              <ParsePreviewPanel result={parseResult} fileName={fileName} onImport={handleImport} onDiscard={() => { setParseResult(null); setFileName(''); }} isImporting={isImporting} />
            )}
            {!parseResult && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-2"><FileCode2 className="w-3.5 h-3.5 text-indigo-400" />Supported formats</h3>
                {[{ icon: '🔷', label: 'draw.io XML', desc: 'Extracts vertex/edge styles as types' }, { icon: '📄', label: 'Generic XML', desc: 'Uses tag names as object types' }, { icon: '📂', label: '.drawio files', desc: 'Same as draw.io XML format' }].map(item => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <span className="text-sm leading-none mt-0.5">{item.icon}</span>
                    <div><p className="text-[11px] font-semibold text-zinc-300">{item.label}</p><p className="text-[10px] text-zinc-500">{item.desc}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex flex-col overflow-hidden ${selectedDoc ? 'flex-1' : 'w-full'}`}>
            <div className="px-4 py-3 border-b border-zinc-800/60 bg-zinc-900/40 flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-violet-400" />
                <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">Saved Metamodels</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-bold">{metamodels.length}</span>
              </div>
              <div className="ml-auto relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all w-44" />
              </div>
            </div>

            {!isAuth ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center"><Database className="w-8 h-8 text-violet-400" /></div>
                <div><p className="text-sm font-bold text-zinc-200">Sign in to view saved metamodels</p><p className="text-xs text-zinc-500 mt-1">Your metamodels are stored securely in the cloud</p></div>
                <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]">
                  <Sparkles className="w-3.5 h-3.5" />Sign In
                </button>
              </div>
            ) : isLoadingList ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Loading metamodels…</span></div>
            ) : listError ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <AlertCircle className="w-8 h-8 text-rose-500" />
                <p className="text-xs text-rose-400">{listError}</p>
                <button onClick={fetchMetamodels} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">Retry</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700 flex items-center justify-center"><Database className="w-7 h-7 text-zinc-500" /></div>
                <div>
                  <p className="text-sm font-bold text-zinc-400">{search ? 'No results' : 'No metamodels yet'}</p>
                  <p className="text-xs text-zinc-600 mt-1">{search ? 'Try a different search term' : 'Upload an XML file on the left to get started'}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
                      {['Name', 'Objects', 'Relations', 'Total', 'Updated', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filtered.map(doc => {
                      const isSelected = selectedDoc?._id === doc._id;
                      const isDeleting = deletingIds.has(doc._id);
                      const updatedAt = new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      return (
                        <tr key={doc._id} onClick={() => setSelectedDoc(prev => prev?._id === doc._id ? null : doc)} className={`group cursor-pointer transition-colors ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-zinc-800/40'}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-zinc-800/60 border border-zinc-700/50 group-hover:border-indigo-500/20'}`}>
                                <Database className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-zinc-400'}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-zinc-100 truncate">{doc.name}</p>
                                {doc.description && <p className="text-[10px] text-zinc-500 truncate mt-0.5">{doc.description}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1 text-xs text-zinc-300"><Boxes className="w-3.5 h-3.5 text-indigo-400" />{doc.objectTypes.length}</span></td>
                          <td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1 text-xs text-zinc-300"><ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />{doc.relationshipTypes.length}</span></td>
                          <td className="px-4 py-3 text-center"><span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 border border-zinc-700/50 text-zinc-300">{doc.objectTypes.length + doc.relationshipTypes.length} types</span></td>
                          <td className="px-4 py-3 text-xs text-zinc-500">{updatedAt}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={e => { e.stopPropagation(); if (confirm('Delete "' + doc.name + '"?')) handleDelete(doc._id); }} disabled={isDeleting} className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100">
                              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedDoc && (
            <div className="w-80 shrink-0 overflow-hidden flex flex-col">
              <MetamodelDetailPanel doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
