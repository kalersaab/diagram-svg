'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Pencil,
  ChevronRight,
  Tag,
  Plus,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import type { ObjectTypeDefinition } from '@/app/utils/metamodel';

interface ObjectTypesTableViewProps {
  objectTypes: ObjectTypeDefinition[];
  selectedObjectTypeId?: string;
  onSelectObjectType: (id: string) => void;
  onEditObjectType: (ot: ObjectTypeDefinition) => void;
  onDeleteObjectType: (id: string) => void;
  onAddObjectType: () => void;
}

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border border-white/20 shrink-0"
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
    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-medium border ${cls}`}>
      {shape}
    </span>
  );
}

export function ObjectTypesTableView({
  objectTypes,
  selectedObjectTypeId,
  onSelectObjectType,
  onEditObjectType,
  onDeleteObjectType,
  onAddObjectType,
}: ObjectTypesTableViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filteredObjectTypes = useMemo(() => {
    return objectTypes.filter(ot =>
      ot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ot.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [objectTypes, searchQuery]);

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
      {/* Search bar */}
      <div className="h-14 border-b border-zinc-800/80 bg-zinc-900/50 px-4 flex items-center justify-between shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search object types..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredObjectTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-12 h-12 text-zinc-700 mb-3" />
            <span className="text-sm text-zinc-500 mb-4">
              {searchQuery ? 'No object types found' : 'No object types yet'}
            </span>
            <button
              onClick={onAddObjectType}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Type</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/40">
            {filteredObjectTypes.map((ot, idx) => {
              const isExpanded = expandedIds.has(ot.id);
              const isSelected = selectedObjectTypeId === ot.id;

              return (
                <div key={ot.id} className="border-b border-zinc-800/40 last:border-0">
                  {/* Row */}
                  <button
                    onClick={() => onSelectObjectType(ot.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left ${
                      isSelected ? 'bg-zinc-800/50 border-l-2 border-indigo-500' : ''
                    }`}
                  >
                    {/* Index */}
                    <span className="text-[10px] text-zinc-600 w-6 text-right shrink-0">
                      {idx + 1}
                    </span>

                    {/* Color dot */}
                    <ColorDot color={ot.color} />

                    {/* Name and group */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-100 truncate">
                          {ot.name}
                        </span>
                        {ot.group && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50 shrink-0">
                            {ot.group}
                          </span>
                        )}
                      </div>
                      {ot.description && (
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {ot.description}
                        </p>
                      )}
                    </div>

                    {/* Shape badge */}
                    <ShapeBadge shape={ot.shape} />

                    {/* Attribute count */}
                    <span className="text-zinc-600 text-[10px] px-2 py-1 rounded bg-zinc-800/50 border border-zinc-700/50">
                      {ot.allowedAttributes.length} attr
                    </span>

                    {/* Expand chevron */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(ot.id);
                      }}
                      className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditObjectType(ot);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 rounded transition-colors"
                        title="Edit object type"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${ot.name}"?`)) {
                            onDeleteObjectType(ot.id);
                          }
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                        title="Delete object type"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </button>

                  {/* Expanded attributes */}
                  {isExpanded && ot.allowedAttributes.length > 0 && (
                    <div className="px-6 py-3 bg-zinc-900/30 border-t border-zinc-800/40">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                        Attributes ({ot.allowedAttributes.length})
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {ot.allowedAttributes.map(attr => (
                          <div
                            key={attr.key}
                            className="flex items-start gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800"
                          >
                            <Tag className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-zinc-300 font-medium truncate">
                                {attr.label}
                              </p>
                              <p className="text-[10px] text-zinc-600 mt-0.5">
                                {attr.type}
                                {attr.required && ' · required'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
