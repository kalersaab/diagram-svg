'use client';

import React, { useEffect, useRef } from 'react';
import {
  type IEdge,
  type IModelItem,
  type INode,
  GraphComponent,
  Rect
} from '@yfiles/yfiles';
import {
  Copy,
  Trash2,
  Edit3,
  RefreshCw,
  Palette,
  Sparkles,
  ArrowRightLeft,
  Square,
  Maximize2
} from 'lucide-react';
import { type DiagramNodeData } from '../utils/yfiles-styles';
import { type LayoutType } from '../utils/yfiles-layouts';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  item: IModelItem | null;
}

interface ContextMenuProps {
  state: ContextMenuState;
  onClose: () => void;
  graphComponent: GraphComponent | null;
  onSelectItem: (item: IModelItem | null) => void;
  onRunLayout: (type: LayoutType) => void;
}

const COLOR_PRESETS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Sky', hex: '#0ea5e9' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Purple', hex: '#a855f7' }
];

export const ContextMenu: React.FC<ContextMenuProps> = ({
  state,
  onClose,
  graphComponent,
  onSelectItem,
  onRunLayout
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (state.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.visible, onClose]);

  if (!state.visible || !graphComponent) return null;

  const isNode = state.item && 'layout' in state.item;
  const isEdge = state.item && 'sourcePort' in state.item;
  const targetNode = isNode ? (state.item as INode) : null;
  const targetEdge = isEdge ? (state.item as IEdge) : null;

  // Actions
  const handleDelete = () => {
    if (state.item) {
      graphComponent.graph.remove(state.item);
      onSelectItem(null);
    }
    onClose();
  };

  const handleDuplicateNode = () => {
    if (targetNode) {
      const tag = (targetNode.tag as DiagramNodeData) || { title: 'Node' };
      const newTag = { ...tag, title: `${tag.title} (Copy)` };
      const newNode = graphComponent.graph.createNode({
        layout: new Rect(
          targetNode.layout.x + 30,
          targetNode.layout.y + 30,
          targetNode.layout.width,
          targetNode.layout.height
        ),
        tag: newTag
      });
      graphComponent.selection.clear();
      graphComponent.selection.add(newNode);
      onSelectItem(newNode);
    }
    onClose();
  };

function setNodeColor(gc: GraphComponent, target: INode, hex: string) {
  const tag = (target.tag as DiagramNodeData) || { title: 'Node' };
  target.tag = { ...tag, color: hex };
  gc.invalidate();
}

function setEdgeColor(gc: GraphComponent, target: IEdge, hex: string) {
  const tag = (target.tag as Record<string, unknown>) || {};
  target.tag = { ...tag, color: hex };
  gc.invalidate();
}

  const handleColorChange = (hex: string) => {
    if (targetNode) {
      setNodeColor(graphComponent, targetNode, hex);
    } else if (targetEdge) {
      setEdgeColor(graphComponent, targetEdge, hex);
    }
    onClose();
  };

  const handleReverseEdge = () => {
    if (targetEdge) {
      const source = targetEdge.sourcePort;
      const target = targetEdge.targetPort;
      const edgeTag = targetEdge.tag;
      const labels = targetEdge.labels.toArray().map((l) => l.text);
      graphComponent.graph.remove(targetEdge);
      const newEdge = graphComponent.graph.createEdge({
        sourcePort: target,
        targetPort: source,
        tag: edgeTag
      });
      labels.forEach((txt) => graphComponent.graph.addLabel(newEdge, txt));
      graphComponent.selection.clear();
      graphComponent.selection.add(newEdge);
      onSelectItem(newEdge);
    }
    onClose();
  };

  const handleAddNodeHere = () => {
    const node = graphComponent.graph.createNode({
      layout: new Rect(state.worldX - 90, state.worldY - 29, 180, 58),
      tag: {
        title: 'New Service',
        subtitle: 'Custom Node',
        color: '#6366f1',
        icon: 'server',
        shape: 'card'
      }
    });
    graphComponent.selection.clear();
    graphComponent.selection.add(node);
    onSelectItem(node);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${state.y}px`, left: `${state.x}px` }}
      className="fixed z-50 min-w-[200px] bg-zinc-900/95 border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-xl p-1.5 text-xs text-zinc-300 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {/* Node Actions */}
      {targetNode && (
        <>
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
            Node: {(targetNode.tag as DiagramNodeData)?.title || 'Service'}
          </div>
          <button
            onClick={() => {
              onSelectItem(targetNode);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit Properties</span>
          </button>
          <button
            onClick={handleDuplicateNode}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-sky-400" />
            <span>Duplicate Node</span>
          </button>

          {/* Quick Color Swatches */}
          <div className="px-2.5 py-1.5 border-t border-zinc-800 my-1">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-zinc-400">
              <Palette className="w-3 h-3" />
              <span>Theme Color</span>
            </div>
            <div className="flex items-center gap-1.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => handleColorChange(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className="w-4 h-4 rounded-full border border-white/20 hover:scale-125 transition-transform"
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-800 my-1" />
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Node</span>
          </button>
        </>
      )}

      {/* Edge Actions */}
      {targetEdge && (
        <>
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
            Connector Edge
          </div>
          <button
            onClick={() => {
              onSelectItem(targetEdge);
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit Connector</span>
          </button>
          <button
            onClick={handleReverseEdge}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Reverse Direction</span>
          </button>

          {/* Quick Color Swatches */}
          <div className="px-2.5 py-1.5 border-t border-zinc-800 my-1">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-zinc-400">
              <Palette className="w-3 h-3" />
              <span>Line Color</span>
            </div>
            <div className="flex items-center gap-1.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => handleColorChange(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className="w-4 h-4 rounded-full border border-white/20 hover:scale-125 transition-transform"
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-800 my-1" />
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Edge</span>
          </button>
        </>
      )}

      {/* Canvas Blank Actions */}
      {!targetNode && !targetEdge && (
        <>
          <button
            onClick={handleAddNodeHere}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Square className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Node Here</span>
          </button>
          <button
            onClick={() => {
              graphComponent.fitGraphBounds();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Fit to View</span>
          </button>

          <div className="border-t border-zinc-800 my-1" />
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
            Auto Layout
          </div>
          <button
            onClick={() => {
              onRunLayout('hierarchical-tb');
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hierarchical (Top-Down)</span>
          </button>
          <button
            onClick={() => {
              onRunLayout('organic');
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Organic / Physics</span>
          </button>
        </>
      )}
    </div>
  );
};
