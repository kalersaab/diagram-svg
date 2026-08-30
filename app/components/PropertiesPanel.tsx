'use client';

import React from 'react';
import {
  type IEdge,
  type IModelItem,
  type INode,
  GraphComponent,
  Rect
} from '@yfiles/yfiles';
import {
  Sliders,
  Type,
  Palette,
  Shapes,
  Maximize2,
  Trash2,
  ArrowRightLeft,
  Tag,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  type DiagramEdgeData,
  type DiagramNodeData,
  type NodeShape
} from '../utils/yfiles-styles';
import { type LayoutType } from '../utils/yfiles-layouts';

interface PropertiesPanelProps {
  selectedItem: IModelItem | null;
  graphComponent: GraphComponent | null;
  onUpdate: () => void;
  onRunLayout: (type: LayoutType) => void;
}

const COLOR_PRESETS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Sky', hex: '#0ea5e9' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Slate', hex: '#64748b' }
];

const ICONS = [
  { id: 'server', label: 'Server' },
  { id: 'database', label: 'Database' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'gateway', label: 'Gateway' },
  { id: 'queue', label: 'Queue' },
  { id: 'shield', label: 'Shield / Auth' },
  { id: 'user', label: 'User' },
  { id: 'docker', label: 'Docker Pod' },
  { id: 'k8s', label: 'Kubernetes' },
  { id: 'storage', label: 'Storage' },
  { id: 'process', label: 'Process' },
  { id: 'decision', label: 'Decision' },
  { id: 'code', label: 'Code' },
  { id: 'document', label: 'Document' }
];

const SHAPES: { id: NodeShape; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'cylinder', label: 'Cylinder (DB)' },
  { id: 'capsule', label: 'Capsule (Pill)' },
  { id: 'hexagon', label: 'Hexagon' }
];

// Helper to mutate yFiles items
function mutateNodeTag(
  gc: GraphComponent,
  targetNode: INode,
  partial: Partial<DiagramNodeData>
) {
  const current = (targetNode.tag as DiagramNodeData) || {
    title: '',
    shape: 'card',
    color: '#6366f1'
  };
  targetNode.tag = { ...current, ...partial };
  gc.invalidate();
}

function mutateEdgeTag(
  gc: GraphComponent,
  targetEdge: IEdge,
  partial: Partial<DiagramEdgeData>
) {
  const current = (targetEdge.tag as DiagramEdgeData) || {};
  targetEdge.tag = { ...current, ...partial };
  gc.invalidate();
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedItem,
  graphComponent,
  onUpdate,
  onRunLayout
}) => {
  if (!graphComponent) return null;

  const isNode = selectedItem && 'layout' in selectedItem;
  const isEdge = selectedItem && 'sourcePort' in selectedItem;
  const node = isNode ? (selectedItem as INode) : null;
  const edge = isEdge ? (selectedItem as IEdge) : null;

  const nodeTag: DiagramNodeData = (node?.tag as DiagramNodeData) || {
    title: '',
    shape: 'card',
    color: '#6366f1'
  };

  const edgeTag: DiagramEdgeData = (edge?.tag as DiagramEdgeData) || {};

  const handleUpdateNodeTag = (partial: Partial<DiagramNodeData>) => {
    if (!node || !graphComponent) return;
    mutateNodeTag(graphComponent, node, partial);
    onUpdate();
  };

  const handleUpdateEdgeTag = (partial: Partial<DiagramEdgeData>) => {
    if (!edge || !graphComponent) return;
    mutateEdgeTag(graphComponent, edge, partial);
    onUpdate();
  };

  const handleEdgeLabelChange = (newText: string) => {
    if (!edge) return;
    if (edge.labels.size > 0) {
      const label = edge.labels.get(0);
      graphComponent.graph.setLabelText(label, newText);
    } else if (newText.trim()) {
      graphComponent.graph.addLabel(edge, newText);
    }
    handleUpdateEdgeTag({ label: newText });
  };

  const handleResizeNode = (w: number, h: number) => {
    if (!node) return;
    graphComponent.graph.setNodeLayout(
      node,
      new Rect(node.layout.x, node.layout.y, Math.max(60, w), Math.max(30, h))
    );
    onUpdate();
  };

  const handleDeleteItem = () => {
    if (selectedItem) {
      graphComponent.graph.remove(selectedItem);
      onUpdate();
    }
  };

  const handleReverseEdge = () => {
    if (edge) {
      const source = edge.sourcePort;
      const target = edge.targetPort;
      const tag = edge.tag;
      const labels = edge.labels.toArray().map((l) => l.text);
      graphComponent.graph.remove(edge);
      const newEdge = graphComponent.graph.createEdge({
        sourcePort: target,
        targetPort: source,
        tag
      });
      labels.forEach((txt) => graphComponent.graph.addLabel(newEdge, txt));
      graphComponent.selection.clear();
      graphComponent.selection.add(newEdge);
      onUpdate();
    }
  };

  return (
    <aside className="w-72 h-full bg-zinc-900/90 border-l border-zinc-800/80 flex flex-col backdrop-blur-xl select-none z-10">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Inspector
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
          {isNode ? 'Node' : isEdge ? 'Edge' : 'Canvas'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Node Properties */}
        {node && (
          <>
            {/* Title & Subtitle */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-zinc-400" />
                <span>Node Labels</span>
              </label>
              <input
                type="text"
                value={nodeTag.title}
                onChange={(e) => handleUpdateNodeTag({ title: e.target.value })}
                placeholder="Title (e.g. Auth Service)"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={nodeTag.subtitle || ''}
                onChange={(e) => handleUpdateNodeTag({ subtitle: e.target.value })}
                placeholder="Subtitle / Description"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Shape Geometry */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <Shapes className="w-3.5 h-3.5 text-zinc-400" />
                <span>Shape Geometry</span>
              </label>
              <select
                value={nodeTag.shape || 'card'}
                onChange={(e) =>
                  handleUpdateNodeTag({ shape: e.target.value as NodeShape })
                }
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                {SHAPES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>Icon Symbol</span>
              </label>
              <select
                value={nodeTag.icon || 'server'}
                onChange={(e) => handleUpdateNodeTag({ icon: e.target.value })}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                {ICONS.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Palette */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-400" />
                <span>Theme Color</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleUpdateNodeTag({ color: c.hex })}
                    style={{ backgroundColor: c.hex }}
                    className={`h-6 rounded-md border flex items-center justify-center transition-all ${
                      (nodeTag.color || '#6366f1') === c.hex
                        ? 'border-white ring-2 ring-indigo-500/50 scale-105'
                        : 'border-white/20 hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Badge & Status */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 mb-1">
                  <Tag className="w-3 h-3" />
                  <span>Badge Tag</span>
                </label>
                <input
                  type="text"
                  value={nodeTag.badge || ''}
                  onChange={(e) => handleUpdateNodeTag({ badge: e.target.value })}
                  placeholder="v1.0 / GW"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 mb-1">
                  <Activity className="w-3 h-3" />
                  <span>Status Dot</span>
                </label>
                <select
                  value={nodeTag.status || ''}
                  onChange={(e) =>
                    handleUpdateNodeTag({
                      status: (e.target.value as DiagramNodeData['status']) || undefined
                    })
                  }
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None</option>
                  <option value="online">Online (Green)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="error">Error (Red)</option>
                  <option value="idle">Idle (Gray)</option>
                </select>
              </div>
            </div>

            {/* Size Dimensions */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Dimensions (W × H)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-zinc-500 font-mono">W:</span>
                  <input
                    type="number"
                    value={Math.round(node.layout.width)}
                    onChange={(e) =>
                      handleResizeNode(Number(e.target.value), node.layout.height)
                    }
                    className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-zinc-500 font-mono">H:</span>
                  <input
                    type="number"
                    value={Math.round(node.layout.height)}
                    onChange={(e) =>
                      handleResizeNode(node.layout.width, Number(e.target.value))
                    }
                    className="w-full bg-transparent text-xs text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Delete Action */}
            <div className="pt-2 border-t border-zinc-800">
              <button
                onClick={handleDeleteItem}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected Node</span>
              </button>
            </div>
          </>
        )}

        {/* Edge Properties */}
        {edge && (
          <>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-zinc-400" />
                <span>Edge Label</span>
              </label>
              <input
                type="text"
                value={edge.labels.size > 0 ? edge.labels.get(0).text : ''}
                onChange={(e) => handleEdgeLabelChange(e.target.value)}
                placeholder="e.g. HTTPS / Publish Event"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Edge Color */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-400" />
                <span>Line Color</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleUpdateEdgeTag({ color: c.hex })}
                    style={{ backgroundColor: c.hex }}
                    className={`h-6 rounded-md border flex items-center justify-center transition-all ${
                      (edgeTag.color || '#6366f1') === c.hex
                        ? 'border-white ring-2 ring-indigo-500/50 scale-105'
                        : 'border-white/20 hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Reverse & Delete */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <button
                onClick={handleReverseEdge}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Reverse Direction</span>
              </button>
              <button
                onClick={handleDeleteItem}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Edge</span>
              </button>
            </div>
          </>
        )}

        {/* Canvas Overview / No Selection */}
        {!node && !edge && (
          <div className="space-y-4">
            {/* Diagram Stats */}
            <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Graph Statistics
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 text-center">
                  <span className="text-lg font-bold text-indigo-400 font-mono">
                    {graphComponent.graph.nodes.size}
                  </span>
                  <p className="text-[10px] text-zinc-500 font-medium">Nodes</p>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 text-center">
                  <span className="text-lg font-bold text-sky-400 font-mono">
                    {graphComponent.graph.edges.size}
                  </span>
                  <p className="text-[10px] text-zinc-500 font-medium">Edges</p>
                </div>
              </div>
            </div>

            {/* Quick Auto Layout */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Automated Layouts
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => onRunLayout('hierarchical-tb')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-xs text-zinc-200 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hierarchical (Top-Down)</span>
                  </div>
                </button>
                <button
                  onClick={() => onRunLayout('organic')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-xs text-zinc-200 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Organic Network (Physics)</span>
                  </div>
                </button>
                <button
                  onClick={() => onRunLayout('orthogonal')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-xs text-zinc-200 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Orthogonal (Clean Grid)</span>
                  </div>
                </button>
                <button
                  onClick={() => onRunLayout('circular')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-xs text-zinc-200 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Circular Ring</span>
                  </div>
                </button>
                <button
                  onClick={() => onRunLayout('tree')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-xs text-zinc-200 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tree Structure</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-[11px] text-zinc-400 leading-relaxed">
              Click any node or connector to inspect, customize shapes, adjust
              colors, and edit properties.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
