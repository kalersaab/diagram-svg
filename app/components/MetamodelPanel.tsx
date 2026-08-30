'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Boxes,
  ArrowRightLeft,
  Settings2,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Tag,
  Hash,
  ToggleLeft,
  List,
  AlertCircle,
  Save,
  Loader2,
  CloudOff,
  Cloud,
} from 'lucide-react';
import type {
  Metamodel,
  ObjectTypeDefinition,
  RelationshipTypeDefinition,
  AttributeDefinition,
  AttributeType,
} from '../utils/metamodel';
import {
  buildDefaultAttributes,
  getObjectTypeGroups,
  TYPE_COLOR_PALETTE,
} from '../utils/metamodel';
import type { DiagramNodeData } from '../utils/yfiles-styles';

const ICON_OPTIONS = [
  'server', 'database', 'cloud', 'gateway', 'queue', 'shield',
  'user', 'process', 'code', 'docker', 'k8s', 'storage',
  'analytics', 'decision', 'document',
];

const SHAPE_OPTIONS = [
  { id: 'card', label: 'Card' },
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'cylinder', label: 'Cylinder' },
  { id: 'capsule', label: 'Capsule' },
  { id: 'hexagon', label: 'Hexagon' },
] as const;

const ATTR_TYPE_ICONS: Record<AttributeType, React.ReactNode> = {
  string: <Tag className="w-3 h-3" />,
  number: <Hash className="w-3 h-3" />,
  boolean: <ToggleLeft className="w-3 h-3" />,
  enum: <List className="w-3 h-3" />,
};

export type MetamodelSyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unauthenticated';

interface MetamodelPanelProps {
  metamodel: Metamodel;
  onChange: (updated: Metamodel) => void;
  onSave: () => Promise<void>;
  syncStatus: MetamodelSyncStatus;
  onAddNode: (data: DiagramNodeData) => void;
}

function ObjectTypeCard({
  ot,
  onAddNode,
  onEdit,
  onDelete,
}: {
  ot: ObjectTypeDefinition;
  onAddNode: (data: DiagramNodeData) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      const nodeData: DiagramNodeData = {
        title: ot.name,
        subtitle: ot.description ?? '',
        icon: ot.icon,
        color: ot.color,
        shape: ot.shape,
        objectTypeId: ot.id,
        instanceAttributes: buildDefaultAttributes(ot),
      };
      e.dataTransfer.setData('application/json', JSON.stringify(nodeData));
      e.dataTransfer.effectAllowed = 'copy';
    },
    [ot],
  );

  const handleClick = useCallback(() => {
    onAddNode({
      title: ot.name,
      subtitle: ot.description ?? '',
      icon: ot.icon,
      color: ot.color,
      shape: ot.shape,
      objectTypeId: ot.id,
      instanceAttributes: buildDefaultAttributes(ot),
    });
  }, [ot, onAddNode]);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-800/70 hover:border-zinc-700 cursor-grab active:cursor-grabbing transition-all duration-150 select-none"
    >
      {}
      <GripVertical className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

      {}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: ot.color + '22', border: `1px solid ${ot.color}44` }}
      >
        <span style={{ color: ot.color }} className="text-[10px] font-bold uppercase">
          {ot.name.slice(0, 2)}
        </span>
      </div>

      {}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-200 truncate">{ot.name}</p>
        <p className="text-[10px] text-zinc-500 truncate">
          {ot.allowedAttributes.length} attr · {ot.shape}
        </p>
      </div>

      {}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1 rounded-md text-zinc-500 hover:text-indigo-400 hover:bg-zinc-700 transition-colors"
          title="Edit type"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
          title="Delete type"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
          className="p-1 rounded-md text-zinc-500 hover:text-emerald-400 hover:bg-zinc-700 transition-colors"
          title="Add to canvas"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function AttributeRow({
  attr,
  onChange,
  onDelete,
}: {
  attr: AttributeDefinition;
  onChange: (updated: AttributeDefinition) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-900/60 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-zinc-500">{ATTR_TYPE_ICONS[attr.type]}</span>
        <span className="flex-1 text-xs text-zinc-300 font-mono">{attr.key}</span>
        <span className="text-[10px] text-zinc-500 font-medium">{attr.type}</span>
        {attr.required && (
          <span title="Required"><AlertCircle className="w-3 h-3 text-amber-500" /></span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 text-zinc-600 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
      </div>

      {open && (
        <div className="p-2.5 space-y-2 border-t border-zinc-800 bg-zinc-950/40">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Key</p>
              <input
                value={attr.key}
                onChange={e => onChange({ ...attr, key: e.target.value.replace(/\s/g, '_') })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Label</p>
              <input
                value={attr.label}
                onChange={e => onChange({ ...attr, label: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Type</p>
              <select
                value={attr.type}
                onChange={e => onChange({ ...attr, type: e.target.value as AttributeType })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
                <option value="enum">enum</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Default</p>
              {attr.type === 'boolean' ? (
                <select
                  value={String(attr.defaultValue ?? '')}
                  onChange={e => onChange({ ...attr, defaultValue: e.target.value === 'true' })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">—</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  value={attr.defaultValue !== undefined ? String(attr.defaultValue) : ''}
                  onChange={e => onChange({ ...attr, defaultValue: attr.type === 'number' ? Number(e.target.value) : e.target.value })}
                  placeholder="optional"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>
          </div>

          {attr.type === 'enum' && (
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Enum values (comma-separated)</p>
              <input
                value={(attr.enumValues ?? []).join(', ')}
                onChange={e => onChange({ ...attr, enumValues: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                placeholder="Value A, Value B, Value C"
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`req-${attr.key}`}
              checked={attr.required ?? false}
              onChange={e => onChange({ ...attr, required: e.target.checked })}
              className="accent-indigo-500"
            />
            <label htmlFor={`req-${attr.key}`} className="text-[11px] text-zinc-400">Required</label>
          </div>
        </div>
      )}
    </div>
  );
}

type PanelTab = 'types' | 'relationships' | 'edit';

export function MetamodelPanel({ metamodel, onChange, onSave, syncStatus, onAddNode }: MetamodelPanelProps) {
  const [tab, setTab] = useState<PanelTab>('types');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Infrastructure', 'Actors', 'Flowchart', 'Security', 'Other']));
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingRelId, setEditingRelId] = useState<string | null>(null);
  const colorIdx = useRef(0);

  const updateObjectType = useCallback((id: string, patch: Partial<ObjectTypeDefinition>) => {
    onChange({
      ...metamodel,
      objectTypes: metamodel.objectTypes.map(t => t.id === id ? { ...t, ...patch } : t),
    });
  }, [metamodel, onChange]);

  const deleteObjectType = useCallback((id: string) => {
    if (!confirm('Delete this Object Type? Existing nodes of this type will keep their visual data.')) return;
    onChange({ ...metamodel, objectTypes: metamodel.objectTypes.filter(t => t.id !== id) });
    if (editingTypeId === id) setEditingTypeId(null);
  }, [metamodel, onChange, editingTypeId]);

  const addObjectType = useCallback(() => {
    const color = TYPE_COLOR_PALETTE[colorIdx.current % TYPE_COLOR_PALETTE.length];
    colorIdx.current++;
    const newType: ObjectTypeDefinition = {
      id: `ot-${Date.now()}`,
      name: 'New Type',
      group: 'Other',
      description: '',
      icon: 'server',
      color,
      shape: 'card',
      defaultWidth: 180,
      defaultHeight: 58,
      allowedAttributes: [],
    };
    onChange({ ...metamodel, objectTypes: [...metamodel.objectTypes, newType] });
    setEditingTypeId(newType.id);
    setTab('edit');
  }, [metamodel, onChange]);

  const updateRelType = useCallback((id: string, patch: Partial<RelationshipTypeDefinition>) => {
    onChange({
      ...metamodel,
      relationshipTypes: metamodel.relationshipTypes.map(r => r.id === id ? { ...r, ...patch } : r),
    });
  }, [metamodel, onChange]);

  const deleteRelType = useCallback((id: string) => {
    if (!confirm('Delete this Relationship Type?')) return;
    onChange({ ...metamodel, relationshipTypes: metamodel.relationshipTypes.filter(r => r.id !== id) });
    if (editingRelId === id) setEditingRelId(null);
  }, [metamodel, onChange, editingRelId]);

  const addRelType = useCallback(() => {
    const color = TYPE_COLOR_PALETTE[colorIdx.current % TYPE_COLOR_PALETTE.length];
    colorIdx.current++;
    const newRel: RelationshipTypeDefinition = {
      id: `rt-${Date.now()}`,
      name: 'New Relationship',
      description: '',
      color,
      strokeWidth: 2,
      dashed: false,
    };
    onChange({ ...metamodel, relationshipTypes: [...metamodel.relationshipTypes, newRel] });
    setEditingRelId(newRel.id);
    setTab('edit');
  }, [metamodel, onChange]);

  const filteredTypes = searchQuery
    ? metamodel.objectTypes.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.group ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : metamodel.objectTypes;

  const groups = getObjectTypeGroups(metamodel);

  const toggleGroup = (g: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  };

  const editingType = editingTypeId ? metamodel.objectTypes.find(t => t.id === editingTypeId) : null;
  const editingRel = editingRelId ? metamodel.relationshipTypes.find(r => r.id === editingRelId) : null;

  const addAttributeToType = (typeId: string) => {
    updateObjectType(typeId, {
      allowedAttributes: [
        ...(metamodel.objectTypes.find(t => t.id === typeId)?.allowedAttributes ?? []),
        { key: `attr_${Date.now()}`, label: 'New Attribute', type: 'string' },
      ],
    });
  };

  return (
    <aside className="w-64 h-full bg-zinc-900/90 border-r border-zinc-800/80 flex flex-col backdrop-blur-xl select-none z-10 shrink-0">
      {/* Header */}
      <div className="px-3.5 pt-3.5 pb-2 border-b border-zinc-800/80">
        {/* Title row + Save button */}
        <div className="flex items-center gap-2 mb-3">
          <Boxes className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex-1">Metamodel</span>

          {/* Sync status indicator */}
          {syncStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[10px] text-indigo-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving…</span>
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </span>
          )}
          {syncStatus === 'error' && (
            <span className="flex items-center gap-1 text-[10px] text-red-400">
              <X className="w-3 h-3" />
              <span>Error</span>
            </span>
          )}
          {syncStatus === 'unauthenticated' && (
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <CloudOff className="w-3 h-3" />
              <span>Local</span>
            </span>
          )}

          {/* Manual save button */}
          <button
            onClick={onSave}
            disabled={syncStatus === 'saving' || syncStatus === 'unauthenticated'}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              syncStatus === 'unauthenticated'
                ? 'text-zinc-600 cursor-not-allowed'
                : syncStatus === 'saved'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : syncStatus === 'error'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 hover:bg-indigo-500/25'
            }`}
            title={syncStatus === 'unauthenticated' ? 'Sign in to save metamodel' : 'Save metamodel to server'}
          >
            {syncStatus === 'saving' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : syncStatus === 'saved' ? (
              <Cloud className="w-3 h-3" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            <span className="hidden">Save</span>
          </button>
        </div>

        {}
        <div className="flex gap-1 bg-zinc-950/60 p-0.5 rounded-lg">
          {([
            { id: 'types', label: 'Types', icon: <Boxes className="w-3 h-3" /> },
            { id: 'relationships', label: 'Rels', icon: <ArrowRightLeft className="w-3 h-3" /> },
            { id: 'edit', label: 'Edit', icon: <Settings2 className="w-3 h-3" /> },
          ] as { id: PanelTab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-medium rounded-md transition-all ${
                tab === t.id
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {}
      {tab === 'types' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {}
          <div className="px-3 py-2 border-b border-zinc-800/60">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search types…"
              className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {searchQuery ? (

              filteredTypes.map(ot => (
                <ObjectTypeCard
                  key={ot.id}
                  ot={ot}
                  onAddNode={onAddNode}
                  onEdit={() => { setEditingTypeId(ot.id); setTab('edit'); }}
                  onDelete={() => deleteObjectType(ot.id)}
                />
              ))
            ) : (

              groups.map(group => {
                const typesInGroup = metamodel.objectTypes.filter(t => (t.group ?? 'Other') === group);
                if (typesInGroup.length === 0) return null;
                const isExpanded = expandedGroups.has(group);
                return (
                  <div key={group}>
                    <button
                      onClick={() => toggleGroup(group)}
                      className="w-full flex items-center gap-1.5 px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span>{group}</span>
                      <span className="ml-auto text-[10px] text-zinc-600">{typesInGroup.length}</span>
                    </button>
                    {isExpanded && (
                      <div className="space-y-1 ml-1">
                        {typesInGroup.map(ot => (
                          <ObjectTypeCard
                            key={ot.id}
                            ot={ot}
                            onAddNode={onAddNode}
                            onEdit={() => { setEditingTypeId(ot.id); setTab('edit'); }}
                            onDelete={() => deleteObjectType(ot.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {filteredTypes.length === 0 && (
              <p className="text-[11px] text-zinc-600 text-center py-6">No types found</p>
            )}
          </div>

          {}
          <div className="px-2 py-2 border-t border-zinc-800/60">
            <button
              onClick={addObjectType}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Object Type</span>
            </button>
          </div>
        </div>
      )}

      {}
      {tab === 'relationships' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
            {metamodel.relationshipTypes.map(rel => (
              <div
                key={rel.id}
                className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
              >
                {}
                <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: rel.color }} />

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{rel.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {rel.dashed ? 'Dashed' : 'Solid'} · {rel.strokeWidth ?? 2}px
                  </p>
                </div>

                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={() => { setEditingRelId(rel.id); setTab('edit'); }}
                    className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteRelType(rel.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="px-2 py-2 border-t border-zinc-800/60">
            <button
              onClick={addRelType}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Relationship Type</span>
            </button>
          </div>
        </div>
      )}

      {}
      {tab === 'edit' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {}
          <div className="px-3 py-2 border-b border-zinc-800/60 space-y-1.5">
            <div>
              <p className="text-[10px] text-zinc-500 mb-1 font-semibold uppercase tracking-wider">Object Type</p>
              <select
                value={editingTypeId ?? ''}
                onChange={e => { setEditingTypeId(e.target.value || null); setEditingRelId(null); }}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">— select —</option>
                {metamodel.objectTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 mb-1 font-semibold uppercase tracking-wider">Relationship Type</p>
              <select
                value={editingRelId ?? ''}
                onChange={e => { setEditingRelId(e.target.value || null); setEditingTypeId(null); }}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">— select —</option>
                {metamodel.relationshipTypes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {}
            {editingType && (
              <>
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Object Type Properties</p>

                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Name</p>
                    <input
                      value={editingType.name}
                      onChange={e => updateObjectType(editingType.id, { name: e.target.value })}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Group</p>
                    <input
                      value={editingType.group ?? ''}
                      onChange={e => updateObjectType(editingType.id, { group: e.target.value })}
                      placeholder="Infrastructure, Domain, Actors…"
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Description</p>
                    <input
                      value={editingType.description ?? ''}
                      onChange={e => updateObjectType(editingType.id, { description: e.target.value })}
                      placeholder="Brief description"
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Icon</p>
                    <select
                      value={editingType.icon}
                      onChange={e => updateObjectType(editingType.id, { icon: e.target.value })}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
                    >
                      {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Shape</p>
                    <select
                      value={editingType.shape}
                      onChange={e => updateObjectType(editingType.id, { shape: e.target.value as ObjectTypeDefinition['shape'] })}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
                    >
                      {SHAPE_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-500 mb-1">Color</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingType.color}
                      onChange={e => updateObjectType(editingType.id, { color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-zinc-700 bg-zinc-950"
                    />
                    <input
                      value={editingType.color}
                      onChange={e => updateObjectType(editingType.id, { color: e.target.value })}
                      className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Default Width</p>
                    <input
                      type="number"
                      value={editingType.defaultWidth ?? 180}
                      onChange={e => updateObjectType(editingType.id, { defaultWidth: Number(e.target.value) })}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Default Height</p>
                    <input
                      type="number"
                      value={editingType.defaultHeight ?? 58}
                      onChange={e => updateObjectType(editingType.id, { defaultHeight: Number(e.target.value) })}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Attributes</p>
                    <button
                      onClick={() => addAttributeToType(editingType.id)}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>

                  {editingType.allowedAttributes.length === 0 && (
                    <p className="text-[11px] text-zinc-600 text-center py-2">No attributes defined</p>
                  )}

                  {editingType.allowedAttributes.map((attr, idx) => (
                    <AttributeRow
                      key={attr.key + idx}
                      attr={attr}
                      onChange={updated => {
                        const attrs = [...editingType.allowedAttributes];
                        attrs[idx] = updated;
                        updateObjectType(editingType.id, { allowedAttributes: attrs });
                      }}
                      onDelete={() => {
                        const attrs = editingType.allowedAttributes.filter((_, i) => i !== idx);
                        updateObjectType(editingType.id, { allowedAttributes: attrs });
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {}
            {editingRel && (
              <>
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Relationship Properties</p>

                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Name</p>
                    <input
                      value={editingRel.name}
                      onChange={e => updateRelType(editingRel.id, { name: e.target.value })}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Description</p>
                    <input
                      value={editingRel.description ?? ''}
                      onChange={e => updateRelType(editingRel.id, { description: e.target.value })}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-zinc-500 mb-1">Color</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingRel.color}
                      onChange={e => updateRelType(editingRel.id, { color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-zinc-700 bg-zinc-950"
                    />
                    <input
                      value={editingRel.color}
                      onChange={e => updateRelType(editingRel.id, { color: e.target.value })}
                      className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Stroke Width</p>
                    <input
                      type="number"
                      min={0.5}
                      max={8}
                      step={0.5}
                      value={editingRel.strokeWidth ?? 2}
                      onChange={e => updateRelType(editingRel.id, { strokeWidth: Number(e.target.value) })}
                      className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRel.dashed ?? false}
                        onChange={e => updateRelType(editingRel.id, { dashed: e.target.checked })}
                        className="accent-indigo-500"
                      />
                      <span className="text-[11px] text-zinc-300">Dashed</span>
                    </label>
                  </div>
                </div>

                {}
                {['allowedSourceTypes', 'allowedTargetTypes'].map(field => (
                  <div key={field}>
                    <p className="text-[10px] text-zinc-500 mb-1">
                      {field === 'allowedSourceTypes' ? 'Allowed Source Types' : 'Allowed Target Types'} <span className="text-zinc-600">(empty = any)</span>
                    </p>
                    <div className="space-y-1">
                      {metamodel.objectTypes.map(ot => {
                        const current = (editingRel[field as keyof RelationshipTypeDefinition] as string[] | undefined) ?? [];
                        const checked = current.includes(ot.id);
                        return (
                          <label key={ot.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e => {
                                const next = e.target.checked
                                  ? [...current, ot.id]
                                  : current.filter((id: string) => id !== ot.id);
                                updateRelType(editingRel.id, {
                                  [field]: next.length > 0 ? next : undefined,
                                });
                              }}
                              className="accent-indigo-500"
                            />
                            <span className="text-[11px] text-zinc-300">{ot.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}

            {!editingType && !editingRel && (
              <div className="text-center py-6 space-y-3">
                <Settings2 className="w-8 h-8 text-zinc-700 mx-auto" />
                <p className="text-[11px] text-zinc-500">Select a type or relationship above to edit it.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}