'use client';

import React, { useState } from 'react';
import {
  Boxes,
  ArrowRightLeft,
  Search,
  FolderKanban,
  PenTool,
  Play,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  Layout,
} from 'lucide-react';
import type { YFilesModelRecord } from '@/app/services/yfiles';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/Table';

interface ModelsTableViewProps {
  models: YFilesModelRecord[];
  activeModelId?: string;
  onLoadModel?: (model: YFilesModelRecord) => void;
  onDeleteModel?: (id: string) => Promise<void> | void;
  onOpenInDrawio?: (xml: string) => void;
  onRefresh?: () => void;
  onNewModel?: () => void;
  isLoading?: boolean;
}

export function ModelsTableView({
  models = [],
  activeModelId,
  onLoadModel,
  onDeleteModel,
  onOpenInDrawio,
  onRefresh,
  onNewModel,
  isLoading = false,
}: ModelsTableViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredModels = models.filter(m => {
    const matchesSearch = searchTerm
      ? m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.category ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesCategory =
      categoryFilter === 'all' ? true : (m.category || 'custom') === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(
    new Set(models.map(m => m.category || 'custom'))
  );

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Header / Action Bar */}
      <div className="h-14 border-b border-zinc-800/80 bg-zinc-900/90 px-6 flex items-center justify-between gap-4 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <span>Saved Diagram Models</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                {models.length}
              </span>
            </h2>
            <p className="text-[11px] text-zinc-500">
              Manage, load, and inspect yFiles graph diagrams & metadata
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title="Refresh Models"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}

          {onNewModel && (
            <button
              onClick={onNewModel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create in yFiles</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-3 border-b border-zinc-800/60 bg-zinc-900/40 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by title, description, or category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              categoryFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredModels.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-zinc-900/60">
                <TableHead className="w-[300px]">Diagram Model</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Nodes</TableHead>
                <TableHead className="text-center">Edges</TableHead>
                <TableHead>Layout</TableHead>
                <TableHead>Draw.io Sync</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map(model => {
                const isCurrent = activeModelId === model._id;
                const nodeNum = model.graphData?.nodes?.length ?? 0;
                const edgeNum = model.graphData?.edges?.length ?? 0;
                return (
                  <TableRow
                    key={model._id}
                    data-state={isCurrent ? 'selected' : undefined}
                    className={`cursor-pointer ${isCurrent ? 'bg-indigo-950/20 border-indigo-500/30' : ''}`}
                    onClick={() => onLoadModel?.(model)}
                  >
                    {/* Title + Desc */}
                    <TableCell>
                      <div className="flex flex-col gap-1 py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-100 text-xs hover:text-indigo-300 transition-colors">
                            {model.title}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold leading-none">
                              Active Canvas
                            </span>
                          )}
                        </div>
                        {model.description && (
                          <span className="text-[11px] text-zinc-500 line-clamp-1">
                            {model.description}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 capitalize text-[10px] font-medium inline-block">
                        {model.category || 'custom'}
                      </span>
                    </TableCell>

                    {/* Nodes */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-zinc-300 font-medium">
                        <Boxes className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{nodeNum}</span>
                      </span>
                    </TableCell>

                    {/* Edges */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-zinc-300 font-medium">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
                        <span>{edgeNum}</span>
                      </span>
                    </TableCell>

                    {/* Layout */}
                    <TableCell>
                      <span className="text-zinc-400 text-[11px] flex items-center gap-1 font-mono">
                        <Layout className="w-3 h-3 text-zinc-500" />
                        <span>{model.layoutType || 'hierarchical-tb'}</span>
                      </span>
                    </TableCell>

                    {/* Draw.io status */}
                    <TableCell>
                      {model.drawioXml ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-800/40 text-purple-300 font-medium">
                          <PenTool className="w-2.5 h-2.5 text-purple-400" />
                          <span>XML Ready</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-[11px]">—</span>
                      )}
                    </TableCell>

                    {/* Last Updated */}
                    <TableCell>
                      <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        {new Date(model.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {onLoadModel && (
                          <button
                            onClick={() => onLoadModel(model)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-400 hover:text-white bg-emerald-950/40 hover:bg-emerald-600 border border-emerald-800/50 hover:border-emerald-500 text-[11px] font-medium transition-all"
                            title="Load model into yFiles Canvas Studio"
                          >
                            <Play className="w-3 h-3" />
                            <span>Load Model</span>
                          </button>
                        )}

                        {onOpenInDrawio && model.drawioXml && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onOpenInDrawio(model.drawioXml || '');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-600 border border-purple-800/50 hover:border-purple-500 text-[11px] font-medium transition-all"
                            title="Open XML in Draw.io Editor"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Draw.io</span>
                          </button>
                        )}

                        {onDeleteModel && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete model "${model.title}"?`)) {
                                void onDeleteModel(model._id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete model"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-zinc-800 rounded-2xl p-8 text-center bg-zinc-900/20">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-3">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">
              {searchTerm || categoryFilter !== 'all'
                ? 'No matching models found'
                : 'No saved models yet'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-4">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'Create diagrams in the yFiles Studio and click "Save Model" to view and manage them here.'}
            </p>
            {onNewModel && (
              <button
                onClick={onNewModel}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Go to yFiles Canvas
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
