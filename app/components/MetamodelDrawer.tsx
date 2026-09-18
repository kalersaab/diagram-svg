'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  X,
  Boxes,
  ArrowRightLeft,
  Tag,
  FileText,
  Plus,
  Trash2,
  Pencil,
  Save,
  Loader2,
  Cloud,
  CloudOff,
  Check,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Hash,
  ToggleLeft,
  List,
  AlertCircle,
  Search,
  Layers,
  Sparkles,
  FolderKanban,
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

export type MetamodelSyncStatus =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'error'
  | 'unauthenticated';

type DrawerSection = 'metamodel' | 'objectTypes' | 'attributes' | 'relationships';

interface MetamodelDrawerProps {
  open: boolean;
  onClose: () => void;
  metamodel: Metamodel;
  metamodelName: string;
  onNameChange: (name: string) => void;
  onChange: (updated: Metamodel) => void;
  onSave: () => Promise<void>;
  syncStatus: MetamodelSyncStatus;
  onAddNode: (data: DiagramNodeData) => void;
  onOpenModelsView?: () => void;
  onOpenMetamodelView?: () => void;
  onOpenObjectTypesView?: () => void;
  activeView?: 'canvas' | 'models' | 'metamodel' | 'object-types';
  savedModelsCount?: number;
}

// ─── Shared constants ─────────────────────────────────────────────────────────

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
  { id: 'cylinder', label: 'Cylinder (DB)' },
  { id: 'capsule', label: 'Capsule' },
  { id: 'hexagon', label: 'Hexagon' },
] as const;

const ATTR_TYPE_ICONS: Record<AttributeType, React.ReactNode> = {
  string:  <Tag className="w-3 h-3" />,
  number:  <Hash className="w-3 h-3" />,
  boolean: <ToggleLeft className="w-3 h-3" />,
  enum:    <List className="w-3 h-3" />,
};

function SectionHeader({
  icon,
  label,
  count,
  open,
  onToggle,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/60 sticky top-0 bg-zinc-900/95 z-10 backdrop-blur-sm">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 flex-1 text-left"
      >
        <span className="text-indigo-400">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          {label}
        </span>
        {count !== undefined && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400">
            {count}
          </span>
        )}
        <span className="ml-auto text-zinc-600">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      </button>
      {action && <div className="ml-2">{action}</div>}
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
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-zinc-500">{ATTR_TYPE_ICONS[attr.type]}</span>
        <span className="flex-1 text-xs text-zinc-300 font-mono truncate">{attr.key}</span>
        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded font-medium">{attr.type}</span>
        {attr.required && (
          <span title="Required"><AlertCircle className="w-3 h-3 text-amber-400 shrink-0" /></span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 text-zinc-600 hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        {expanded
          ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
      </div>

      {expanded && (
        <div className="p-3 space-y-3 border-t border-zinc-800 bg-zinc-950/40">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Key</p>
              <input
                value={attr.key}
                onChange={e => onChange({ ...attr, key: e.target.value.replace(/\s/g, '_') })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Label</p>
              <input
                value={attr.label}
                onChange={e => onChange({ ...attr, label: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Type</p>
              <select
                value={attr.type}
                onChange={e => onChange({ ...attr, type: e.target.value as AttributeType })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
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
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">—</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  value={attr.defaultValue !== undefined ? String(attr.defaultValue) : ''}
                  onChange={e => onChange({
                    ...attr,
                    defaultValue: attr.type === 'number' ? Number(e.target.value) : e.target.value,
                  })}
                  placeholder="optional"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>
          </div>

          {attr.type === 'enum' && (
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Values (comma-separated)</p>
              <input
                value={(attr.enumValues ?? []).join(', ')}
                onChange={e => onChange({
                  ...attr,
                  enumValues: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                })}
                placeholder="Option A, Option B, Option C"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={attr.required ?? false}
              onChange={e => onChange({ ...attr, required: e.target.checked })}
              className="accent-indigo-500"
            />
            <span className="text-[11px] text-zinc-400">Required</span>
          </label>
        </div>
      )}
    </div>
  );
}

function ObjectTypeCard({
  ot,
  selected,
  onSelect,
  onAddNode,
  onDelete,
}: {
  ot: ObjectTypeDefinition;
  selected: boolean;
  onSelect: () => void;
  onAddNode: (data: DiagramNodeData) => void;
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

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelect}
      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
        selected
          ? 'border-indigo-500/50 bg-indigo-500/10'
          : 'border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700'
      }`}
    >
      <GripVertical className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

      {/* Color badge */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px] uppercase"
        style={{ backgroundColor: ot.color + '22', border: `1.5px solid ${ot.color}55`, color: ot.color }}
      >
        {ot.name.slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-zinc-200 truncate">{ot.name}</p>
        <p className="text-[10px] text-zinc-500 truncate">
          {ot.allowedAttributes.length} attr · {ot.shape}
          {ot.group && <span className="ml-1 text-zinc-600">· {ot.group}</span>}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onAddNode({
            title: ot.name, subtitle: ot.description ?? '',
            icon: ot.icon, color: ot.color, shape: ot.shape,
            objectTypeId: ot.id, instanceAttributes: buildDefaultAttributes(ot),
          }); }}
          className="p-1 rounded-md text-zinc-500 hover:text-emerald-400 hover:bg-zinc-700 transition-colors"
          title="Add to canvas"
        >
          <Plus className="w-3 h-3" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export function MetamodelDrawer({
  open,
  onClose,
  metamodel,
  metamodelName,
  onNameChange,
  onChange,
  onSave,
  syncStatus,
  onAddNode,
  onOpenModelsView,
  onOpenMetamodelView,
  onOpenObjectTypesView,
  activeView = 'canvas',
  savedModelsCount = 0,
}: MetamodelDrawerProps) {
  const [expanded, setExpanded] = useState<Record<DrawerSection, boolean>>({
    metamodel: true,
    objectTypes: true,
    attributes: true,
    relationships: true,
  });

  const [selectedOTId, setSelectedOTId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingOTId, setEditingOTId] = useState<string | null>(null);
  const [editingRelId, setEditingRelId] = useState<string | null>(null);

  const colorIdx = useRef(0);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const toggleSection = (s: DrawerSection) =>
    setExpanded(prev => ({ ...prev, [s]: !prev[s] }));

  const selectedOT = selectedOTId
    ? metamodel.objectTypes.find(t => t.id === selectedOTId || t._id === selectedOTId) ?? null
    : null;

  const editingOT = editingOTId
    ? metamodel.objectTypes.find(t => t.id === editingOTId || t._id === editingOTId) ?? null
    : null;

  const updateOT = useCallback((id: string, patch: Partial<ObjectTypeDefinition>) => {
    onChange({
      ...metamodel,
      objectTypes: metamodel.objectTypes.map(t =>
        (t.id === id || t._id === id) ? { ...t, ...patch } : t,
      ),
    });
  }, [metamodel, onChange]);

  const deleteOT = useCallback((id: string) => {
    if (!confirm('Delete this Object Type? Nodes of this type keep their visual data.')) return;
    onChange({ ...metamodel, objectTypes: metamodel.objectTypes.filter(t => t.id !== id && t._id !== id) });
    if (selectedOTId === id) setSelectedOTId(null);
    if (editingOTId === id) setEditingOTId(null);
  }, [metamodel, onChange, selectedOTId, editingOTId]);

  const addOT = useCallback(() => {
    const color = TYPE_COLOR_PALETTE[colorIdx.current % TYPE_COLOR_PALETTE.length];
    colorIdx.current++;
    const newOT: ObjectTypeDefinition = {
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
    onChange({ ...metamodel, objectTypes: [...metamodel.objectTypes, newOT] });
    setEditingOTId(newOT.id);
    setSelectedOTId(newOT.id);
  }, [metamodel, onChange]);

  const updateRel = useCallback((id: string, patch: Partial<RelationshipTypeDefinition>) => {
    onChange({
      ...metamodel,
      relationshipTypes: metamodel.relationshipTypes.map(r =>
        (r.id === id || r._id === id) ? { ...r, ...patch } : r,
      ),
    });
  }, [metamodel, onChange]);

  const deleteRel = useCallback((id: string) => {
    if (!confirm('Delete this Relationship Type?')) return;
    onChange({ ...metamodel, relationshipTypes: metamodel.relationshipTypes.filter(r => r.id !== id && r._id !== id) });
    if (editingRelId === id) setEditingRelId(null);
  }, [metamodel, onChange, editingRelId]);

  const addRel = useCallback(() => {
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
  }, [metamodel, onChange]);

  const addAttr = useCallback((otId: string) => {
    const newAttr: AttributeDefinition = {
      key: `attr_${Date.now()}`,
      label: 'New Attribute',
      type: 'string',
    };
    updateOT(otId, {
      allowedAttributes: [
        ...(metamodel.objectTypes.find(t => t.id === otId || t._id === otId)?.allowedAttributes ?? []),
        newAttr,
      ],
    });
  }, [metamodel, updateOT]);

  const filteredOTs = search
    ? metamodel.objectTypes.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.group ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : metamodel.objectTypes;

  const groups = getObjectTypeGroups({ ...metamodel, objectTypes: filteredOTs });

  const SyncBadge = () => {
    if (syncStatus === 'saving') return (
      <span className="flex items-center gap-1 text-[10px] text-indigo-400">
        <Loader2 className="w-3 h-3 animate-spin" /><span>Saving…</span>
      </span>
    );
    if (syncStatus === 'saved') return (
      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
        <Check className="w-3 h-3" /><span>Saved</span>
      </span>
    );
    if (syncStatus === 'error') return (
      <span className="flex items-center gap-1 text-[10px] text-red-400">
        <AlertCircle className="w-3 h-3" /><span>Error</span>
      </span>
    );
    if (syncStatus === 'unauthenticated') return (
      <span className="flex items-center gap-1 text-[10px] text-zinc-500">
        <CloudOff className="w-3 h-3" /><span>Local only</span>
      </span>
    );
    return null;
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-[420px] bg-zinc-950 border-r border-zinc-800/80 flex flex-col shadow-2xl shadow-black/50 transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Metamodel editor"
      >
        <div className="h-14 border-b border-zinc-800/80 bg-zinc-900/90 px-4 flex items-center gap-3 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Boxes className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight flex-1">
            Metamodel Schema
          </span>

          <SyncBadge />
          <button
            onClick={() => {
              onOpenModelsView?.();
              onClose();
            }}
            title="Open Models Table View"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
              activeView === 'models'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
            <span>Models</span>
            {savedModelsCount > 0 && (
              <span className="ml-0.5 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-500/30 text-indigo-300">
                {savedModelsCount}
              </span>
            )}
          </button>

          <button
            onClick={onSave}
            disabled={syncStatus === 'saving' || syncStatus === 'unauthenticated'}
            title={syncStatus === 'unauthenticated' ? 'Sign in to save' : 'Save metamodel'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
              syncStatus === 'unauthenticated'
                ? 'text-zinc-600 cursor-not-allowed'
                : syncStatus === 'saved'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/25'
            }`}
          >
            {syncStatus === 'saving' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : syncStatus === 'saved' ? (
              <Cloud className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close metamodel editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3 border-b border-zinc-800/80 bg-gradient-to-r from-indigo-950/40 via-zinc-900/60 to-zinc-900/40">
            <button
              onClick={() => {
                onOpenModelsView?.();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 hover:bg-indigo-950/30 border border-indigo-500/25 hover:border-indigo-500/50 shadow-md shadow-indigo-500/5 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100 group-hover:text-white">
                      Diagram Models
                    </span>
                    {savedModelsCount > 0 && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {savedModelsCount} saved
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-zinc-400">
                    View all saved models in full table view
                  </p>
                </div>
              </div>
              <div className="text-zinc-500 group-hover:text-indigo-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          <div className="p-3 border-b border-zinc-800/80 bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-zinc-900/40">
            <button
              onClick={() => {
                onOpenMetamodelView?.();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 hover:bg-purple-950/30 border border-purple-500/25 hover:border-purple-500/50 shadow-md shadow-purple-500/5 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100 group-hover:text-white">
                      {metamodelName || 'Metamodel Schema'}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400">
                    {metamodel.objectTypes.length} types · {metamodel.relationshipTypes.length} relationships · {metamodel.objectTypes.reduce((acc, t) => acc + t.allowedAttributes.length, 0)} attributes
                  </p>
                </div>
              </div>
              <div className="text-zinc-500 group-hover:text-purple-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          <div className="p-3 border-b border-zinc-800/80 bg-gradient-to-r from-violet-950/40 via-zinc-900/60 to-zinc-900/40">
            <button
              onClick={() => {
                onOpenObjectTypesView?.();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 hover:bg-violet-950/30 border border-violet-500/25 hover:border-violet-500/50 shadow-md shadow-violet-500/5 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-colors shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100 group-hover:text-white">
                      Object Types
                    </span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400">
                    Manage object types and attributes
                  </p>
                </div>
              </div>
              <div className="text-zinc-500 group-hover:text-violet-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          <SectionHeader
            icon={<ArrowRightLeft className="w-4 h-4" />}
            label="Relationships"
            count={metamodel.relationshipTypes.length}
            open={expanded.relationships}
            onToggle={() => toggleSection('relationships')}
            action={
              <button
                onClick={addRel}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
              >
                <Plus className="w-3 h-3" /><span>Add</span>
              </button>
            }
          />
          {expanded.relationships && (
            <div className="px-4 py-4 space-y-2">
              {metamodel.relationshipTypes.length === 0 && (
                <p className="text-[11px] text-zinc-600 text-center py-4">No relationship types defined</p>
              )}

              {metamodel.relationshipTypes.map(rel => (
                <div key={rel.id} className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
                  <div
                    className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-zinc-800/40 transition-colors"
                    onClick={() => setEditingRelId(prev => (prev === rel.id ? null : rel.id))}
                  >
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: rel.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-200 truncate">{rel.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        {rel.dashed ? 'Dashed' : 'Solid'} · {rel.strokeWidth ?? 2}px
                        {(rel.allowedSourceTypes?.length ?? 0) > 0 &&
                          <span className="ml-1 text-zinc-600">· {rel.allowedSourceTypes!.length} src</span>}
                        {(rel.allowedTargetTypes?.length ?? 0) > 0 &&
                          <span className="ml-1 text-zinc-600">· {rel.allowedTargetTypes!.length} tgt</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); deleteRel(rel.id); }}
                        className="p-1 rounded-md text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {editingRelId === rel.id
                        ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
                    </div>
                  </div>
                  {editingRelId === rel.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-zinc-800/60 space-y-3">
                      <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Name</p>
                        <input value={rel.name} onChange={e => updateRel(rel.id, { name: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Description</p>
                        <input value={rel.description ?? ''} onChange={e => updateRel(rel.id, { description: e.target.value })}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500" />
                      </div>

                      <div>
                        <p className="text-[10px] text-zinc-500 mb-1">Color</p>
                        <div className="flex items-center gap-2">
                          <input type="color" value={rel.color} onChange={e => updateRel(rel.id, { color: e.target.value })}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-zinc-900" />
                          <input value={rel.color} onChange={e => updateRel(rel.id, { color: e.target.value })}
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-zinc-500 mb-1">Stroke Width</p>
                          <input type="number" min={0.5} max={8} step={0.5}
                            value={rel.strokeWidth ?? 2}
                            onChange={e => updateRel(rel.id, { strokeWidth: Number(e.target.value) })}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={rel.dashed ?? false}
                              onChange={e => updateRel(rel.id, { dashed: e.target.checked })}
                              className="accent-indigo-500" />
                            <span className="text-[11px] text-zinc-300">Dashed line</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-zinc-500 mb-1.5">
                          Allowed Source Types <span className="text-zinc-600">(empty = any)</span>
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {metamodel.objectTypes.map(ot => {
                            const refId = ot._id ?? ot.id;
                            const checked = (rel.allowedSourceTypes ?? []).includes(refId);
                            return (
                              <label key={ot.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={checked}
                                  onChange={e => {
                                    const current = rel.allowedSourceTypes ?? [];
                                    const next = e.target.checked
                                      ? [...current, refId]
                                      : current.filter(x => x !== refId);
                                    updateRel(rel.id, { allowedSourceTypes: next });
                                  }}
                                  className="accent-indigo-500" />
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ot.color }} />
                                <span className="text-[11px] text-zinc-300">{ot.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-zinc-500 mb-1.5">
                          Allowed Target Types <span className="text-zinc-600">(empty = any)</span>
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {metamodel.objectTypes.map(ot => {
                            const refId = ot._id ?? ot.id;
                            const checked = (rel.allowedTargetTypes ?? []).includes(refId);
                            return (
                              <label key={ot.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={checked}
                                  onChange={e => {
                                    const current = rel.allowedTargetTypes ?? [];
                                    const next = e.target.checked
                                      ? [...current, refId]
                                      : current.filter(x => x !== refId);
                                    updateRel(rel.id, { allowedTargetTypes: next });
                                  }}
                                  className="accent-indigo-500" />
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ot.color }} />
                                <span className="text-[11px] text-zinc-300">{ot.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
