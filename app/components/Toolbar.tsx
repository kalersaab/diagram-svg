'use client';

import React, { useState } from 'react';
import {
  GraphComponent,
  Command
} from '@yfiles/yfiles';
import {
  Sparkles,
  Download,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Trash2,
  LayoutGrid,
  Edit2,
  ChevronDown,
  Layers,
  PanelLeft,
  PanelRight,
  MapPin,
  PenTool
} from 'lucide-react';
import { type LayoutType } from '../utils/yfiles-layouts';
import { SAMPLE_TEMPLATES, type TemplateDefinition } from '../utils/SampleTemplates';

interface ToolbarProps {
  graphComponent: GraphComponent | null;
  diagramTitle: string;
  onTitleChange: (title: string) => void;
  onRunLayout: (type: LayoutType) => void;
  onSelectTemplate: (template: TemplateDefinition) => void;
  onClearGraph: () => void;
  onOpenExportModal: () => void;
  onExportToDrawio?: () => void;
  isGridVisible: boolean;
  onToggleGrid: () => void;
  isSnappingEnabled: boolean;
  onToggleSnapping: () => void;
  isMinimapOpen: boolean;
  onToggleMinimap: () => void;
  isLeftSidebarOpen: boolean;
  onToggleLeftSidebar: () => void;
  isRightSidebarOpen: boolean;
  onToggleRightSidebar: () => void;
}

const LAYOUT_OPTIONS: { id: LayoutType; label: string; desc: string }[] = [
  {
    id: 'hierarchical-tb',
    label: 'Hierarchical (Top-Down)',
    desc: 'Pipelines & tiered services'
  },
  {
    id: 'hierarchical-lr',
    label: 'Hierarchical (Left-Right)',
    desc: 'Sequential step-by-step flows'
  },
  {
    id: 'organic',
    label: 'Organic (Physics)',
    desc: 'Force-directed network clusters'
  },
  {
    id: 'orthogonal',
    label: 'Orthogonal (Grid)',
    desc: 'Clean 90-degree right angles'
  },
  {
    id: 'circular',
    label: 'Circular (Ring)',
    desc: 'Cycle & topology rings'
  },
  {
    id: 'tree',
    label: 'Tree (Org Chart)',
    desc: 'Parent-child tree hierarchies'
  },
  {
    id: 'radial',
    label: 'Radial (Spokes)',
    desc: 'Central hub and concentric nodes'
  }
];

export const Toolbar: React.FC<ToolbarProps> = ({
  graphComponent,
  diagramTitle,
  onTitleChange,
  onRunLayout,
  onSelectTemplate,
  onClearGraph,
  onOpenExportModal,
  onExportToDrawio,
  isGridVisible,
  onToggleGrid,
  isSnappingEnabled,
  onToggleSnapping,
  isMinimapOpen,
  onToggleMinimap,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

  const handleZoomIn = () => {
    if (!graphComponent) return;
    graphComponent.executeCommand(Command.INCREASE_ZOOM);
  };

  const handleZoomOut = () => {
    if (!graphComponent) return;
    graphComponent.executeCommand(Command.DECREASE_ZOOM);
  };

  const handleFitContent = () => {
    if (!graphComponent) return;
    graphComponent.fitGraphBounds();
  };

  const handleZoomReset = () => {
    if (!graphComponent) return;
    graphComponent.executeCommand(Command.ZOOM, 1);
  };

  const handleUndo = () => {
    if (!graphComponent) return;
    graphComponent.executeCommand(Command.UNDO);
  };

  const handleRedo = () => {
    if (!graphComponent) return;
    graphComponent.executeCommand(Command.REDO);
  };

  return (
    <header className="h-14 bg-zinc-900/95 border-b border-zinc-800/90 flex items-center justify-between px-4 z-30 select-none backdrop-blur-md">
      {}
      <div className="flex items-center gap-3">
        {}
        <button
          onClick={onToggleLeftSidebar}
          className={`p-1.5 rounded-lg border transition-colors ${
            isLeftSidebarOpen
              ? 'bg-zinc-800 border-zinc-700 text-white'
              : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
          title="Toggle Shape Palette"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {}
        <div className="flex items-center gap-2.5 pr-3 border-r border-zinc-800">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              Diagram<span className="text-indigo-400">SVG</span>
              <span className="text-[9px] font-semibold text-zinc-400 bg-zinc-800 px-1 py-0.2 rounded border border-zinc-700">
                yFiles 3.1
              </span>
            </span>
          </div>
        </div>

        {}
        <div className="flex items-center gap-1.5 max-w-[220px]">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={diagramTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
              }}
              className="bg-zinc-950 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-full"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white px-2 py-1 rounded hover:bg-zinc-800/60 transition-colors group truncate"
              title="Click to rename diagram"
            >
              <span className="truncate">{diagramTitle}</span>
              <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 flex-shrink-0" />
            </button>
          )}
        </div>
      </div>

      {}
      <div className="flex items-center gap-2">
        {}
        <div className="relative">
          <button
            onClick={() => {
              setIsTemplateDropdownOpen(!isTemplateDropdownOpen);
              setIsLayoutDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Templates</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {isTemplateDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Preset Diagram Templates
              </div>
              {SAMPLE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    onSelectTemplate(tmpl);
                    setIsTemplateDropdownOpen(false);
                  }}
                  className="w-full flex flex-col items-start px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white text-left transition-colors group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-medium text-zinc-200 group-hover:text-white">
                      {tmpl.name}
                    </span>
                    <span className="text-[9.5px] text-indigo-400 font-mono bg-indigo-950/50 px-1 rounded">
                      {tmpl.category}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-zinc-500 line-clamp-1">
                    {tmpl.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {}
        <div className="relative">
          <button
            onClick={() => {
              setIsLayoutDropdownOpen(!isLayoutDropdownOpen);
              setIsTemplateDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
            <span>Auto Layout</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {isLayoutDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Automated Layout Algorithms
              </div>
              {LAYOUT_OPTIONS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => {
                    onRunLayout(layout.id);
                    setIsLayoutDropdownOpen(false);
                  }}
                  className="w-full flex flex-col items-start px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white text-left transition-colors group"
                >
                  <span className="text-xs font-medium text-zinc-200 group-hover:text-white">
                    {layout.label}
                  </span>
                  <span className="text-[10px] text-zinc-500">{layout.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        {}
        <div className="flex items-center bg-zinc-950/60 border border-zinc-800 rounded-lg p-0.5">
          <button
            onClick={handleUndo}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            title="Undo (Cmd+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            title="Redo (Cmd+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {}
        <div className="flex items-center bg-zinc-950/60 border border-zinc-800 rounded-lg p-0.5">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            title="100% Zoom"
          >
            1:1
          </button>
          <button
            onClick={handleFitContent}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            title="Fit All Content"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {}
        <div className="flex items-center bg-zinc-950/60 border border-zinc-800 rounded-lg p-0.5">
          <button
            onClick={onToggleGrid}
            className={`p-1.5 rounded transition-colors ${
              isGridVisible
                ? 'bg-indigo-600/30 text-indigo-300'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleSnapping}
            className={`p-1.5 rounded transition-colors ${
              isSnappingEnabled
                ? 'bg-indigo-600/30 text-indigo-300'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Toggle Snapping Guides"
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleMinimap}
            className={`p-1.5 rounded transition-colors ${
              isMinimapOpen
                ? 'bg-indigo-600/30 text-indigo-300'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Toggle Minimap Navigator"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>

        {}
        <button
          onClick={onClearGraph}
          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800 rounded-lg transition-colors"
          title="Clear Diagram"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {}
      <div className="flex items-center gap-2">
        {}
        {onExportToDrawio && (
          <button
            onClick={onExportToDrawio}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-indigo-500/50 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Convert this yFiles diagram to draw.io and open it in the Draw.io editor"
          >
            <PenTool className="w-3.5 h-3.5 text-indigo-400" />
            <span>Open in draw.io</span>
          </button>
        )}

        {}
        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export SVG / Image</span>
        </button>

        {}
        <button
          onClick={onToggleRightSidebar}
          className={`p-1.5 rounded-lg border transition-colors ${
            isRightSidebarOpen
              ? 'bg-zinc-800 border-zinc-700 text-white'
              : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
          title="Toggle Properties Inspector"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};