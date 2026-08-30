'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Eye,
  Clock,
  Search,
  Upload,
  Sparkles,
  Cloud,
  GitBranch,
  Cpu,
  Network,
  Workflow,
  LayoutGrid,
  X,
  LogOut,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import {
  type StoredDiagram,
  deleteDiagramFromStorage,
  saveDiagramToStorage,
} from '../utils/diagram-storage';
import DiagramService from '@/app/services/diagram';
import { BLANK_DRAWIO_XML } from '../utils/drawio-bridge';
import type { UseAuthReturn } from '@/app/hooks/useAuth';

const diagramService = new DiagramService();

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  cloud: { icon: <Cloud className="w-3.5 h-3.5" />, color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', label: 'Cloud' },
  flowchart: { icon: <Workflow className="w-3.5 h-3.5" />, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', label: 'Flowchart' },
  uml: { icon: <GitBranch className="w-3.5 h-3.5" />, color: 'bg-purple-500/15 text-purple-400 border-purple-500/20', label: 'UML' },
  network: { icon: <Network className="w-3.5 h-3.5" />, color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', label: 'Network' },
  system: { icon: <Cpu className="w-3.5 h-3.5" />, color: 'bg-pink-500/15 text-pink-400 border-pink-500/20', label: 'System' },
  custom: { icon: <LayoutGrid className="w-3.5 h-3.5" />, color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20', label: 'Custom' },
};

interface DrawioGalleryProps {
  diagrams: StoredDiagram[];
  onDiagramsChange: (diagrams: StoredDiagram[]) => void;
  onEditDiagram: (diagram: StoredDiagram) => void;
  onViewDiagram: (diagram: StoredDiagram) => void;
  auth: UseAuthReturn;
  onShowAuth: () => void;
  className?: string;
}

export function DrawioGallery({
  diagrams,
  onDiagramsChange,
  onEditDiagram,
  onViewDiagram,
  auth,
  onShowAuth,
  className = '',
}: DrawioGalleryProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = auth.status === 'authenticated';

  /** Create a new blank diagram – persist to API if authenticated, else localStorage. */
  const handleCreateNew = useCallback(async () => {
    const newDiagram: StoredDiagram = {
      id: `diagram_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: 'Untitled Diagram',
      description: 'A new diagram',
      category: 'custom',
      xml: BLANK_DRAWIO_XML,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (isAuthenticated) {
      setSaving(true);
      try {
        const saved = await diagramService.createDiagram({
          title: newDiagram.title,
          description: newDiagram.description,
          category: newDiagram.category,
          xml: newDiagram.xml,
        });
        const updated = [saved, ...diagrams];
        onDiagramsChange(updated);
        onEditDiagram(saved);
      } catch (err) {
        console.error('Failed to create diagram via API', err);
        // Fall back to localStorage
        const updated = saveDiagramToStorage(newDiagram);
        onDiagramsChange(updated);
        onEditDiagram(newDiagram);
      } finally {
        setSaving(false);
      }
    } else {
      const updated = saveDiagramToStorage(newDiagram);
      onDiagramsChange(updated);
      onEditDiagram(newDiagram);
    }
  }, [isAuthenticated, diagrams, onDiagramsChange, onEditDiagram]);

  /** Delete a diagram. */
  const handleDelete = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!confirm('Delete this diagram? This cannot be undone.')) return;

      if (isAuthenticated) {
        try {
          await diagramService.deleteDiagram(id);
        } catch (err) {
          console.error('Failed to delete diagram via API', err);
        }
      } else {
        deleteDiagramFromStorage(id);
      }
      onDiagramsChange(diagrams.filter(d => d.id !== id));
    },
    [isAuthenticated, diagrams, onDiagramsChange],
  );

  /** Import a .drawio / .xml file. */
  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const xml = reader.result as string;
        const title = file.name.replace(/\.(drawio|xml|svg)$/i, '');
        const base: StoredDiagram = {
          id: `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          title,
          description: `Imported from ${file.name}`,
          category: 'custom',
          xml,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        if (isAuthenticated) {
          setSaving(true);
          try {
            const saved = await diagramService.createDiagram({
              title: base.title,
              description: base.description,
              category: base.category,
              xml: base.xml,
            });
            const updated = [saved, ...diagrams];
            onDiagramsChange(updated);
            onEditDiagram(saved);
          } catch (err) {
            console.error('Failed to import diagram via API', err);
            const updated = saveDiagramToStorage(base);
            onDiagramsChange(updated);
            onEditDiagram(base);
          } finally {
            setSaving(false);
          }
        } else {
          const updated = saveDiagramToStorage(base);
          onDiagramsChange(updated);
          onEditDiagram(base);
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [isAuthenticated, diagrams, onDiagramsChange, onEditDiagram],
  );

  // Filter diagrams
  const filteredDiagrams = diagrams.filter(d => {
    const matchesSearch =
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(diagrams.map(d => d.category))];

  return (
    <div className={`flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Diagram Gallery</h2>
              <p className="text-xs text-zinc-500">
                {diagrams.length} diagram{diagrams.length !== 1 ? 's' : ''}
                {isAuthenticated ? ' · synced' : ' · local only'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auth status pill */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                  <UserIcon className="w-3 h-3" />
                  <span className="max-w-[120px] truncate">{auth.user?.email || 'Signed in'}</span>
                </div>
                <button
                  onClick={() => auth.logout()}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onShowAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign in to sync</span>
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept=".drawio,.xml,.svg"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
            <button
              onClick={handleCreateNew}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>New Diagram</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search diagrams..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1.5">
            {categories.map(cat => {
              const meta = cat === 'all' ? null : CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                      : 'text-zinc-500 hover:text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {cat === 'all' ? 'All' : meta?.label || cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Diagram Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filteredDiagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-zinc-500">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <LayoutGrid className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-sm">No diagrams found</p>
            <button
              onClick={handleCreateNew}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Diagram
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {/* Create New Card */}
            <button
              onClick={handleCreateNew}
              disabled={saving}
              className="group relative h-56 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/30 hover:bg-indigo-500/5 flex flex-col items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-all duration-300">
                {saving
                  ? <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  : <Plus className="w-6 h-6 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                }
              </div>
              <span className="text-sm font-medium text-zinc-500 group-hover:text-indigo-400 transition-colors">
                New Diagram
              </span>
            </button>

            {/* Diagram Cards */}
            {filteredDiagrams.map(diagram => {
              const cat = CATEGORY_META[diagram.category] || CATEGORY_META.custom;
              return (
                <div
                  key={diagram.id}
                  className="group relative h-56 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900/80 hover:border-zinc-700 overflow-hidden transition-all duration-300 cursor-pointer"
                  onClick={() => onViewDiagram(diagram)}
                >
                  {/* SVG Preview */}
                  <div className="h-32 bg-zinc-950/50 border-b border-zinc-800/50 flex items-center justify-center overflow-hidden p-4">
                    {diagram.svg ? (
                      <div
                        className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto opacity-70 group-hover:opacity-100 transition-opacity"
                        dangerouslySetInnerHTML={{ __html: diagram.svg }}
                      />
                    ) : (
                      <div className="text-zinc-700 flex flex-col items-center gap-1.5">
                        <Sparkles className="w-8 h-8" />
                        <span className="text-[10px]">No preview</span>
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-zinc-200 truncate leading-tight flex-1">
                        {diagram.title}
                      </h3>
                      <span className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md border ${cat.color}`}>
                        {cat.icon}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                        <Clock className="w-3 h-3" />
                        {new Date(diagram.updatedAt).toLocaleDateString()}
                      </span>
                      {/* Sync indicator */}
                      {isAuthenticated && (
                        <span className="text-[10px] text-emerald-600">● synced</span>
                      )}
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); onEditDiagram(diagram); }}
                      className="p-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 backdrop-blur-sm transition-all"
                      title="Edit in Draw.io"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onViewDiagram(diagram); }}
                      className="p-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 backdrop-blur-sm transition-all"
                      title="View SVG"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => handleDelete(e, diagram.id)}
                      className="p-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50 backdrop-blur-sm transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
