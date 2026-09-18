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
  Menu,
  PanelRight,
  MapPin,
  PenTool,
  Save,
  Check,
  Loader2,
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { type LayoutType } from '../utils/yfiles-layouts';
import { SAMPLE_TEMPLATES, type TemplateDefinition } from '../utils/SampleTemplates';
import type { UseAuthReturn } from '@/app/hooks/useAuth';

interface ToolbarProps {
  graphComponent: GraphComponent | null;
  diagramTitle: string;
  onTitleChange: (title: string) => void;
  onRunLayout: (type: LayoutType) => void;
  onSelectTemplate: (template: TemplateDefinition) => void;
  onClearGraph: () => void;
  onOpenExportModal: () => void;
  onExportToDrawio?: () => void;
  onSaveModel?: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error' | 'unauthenticated';
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
  auth?: UseAuthReturn;
  onShowAuth?: () => void;
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
  onSaveModel,
  saveStatus = 'idle',
  isGridVisible,
  onToggleGrid,
  isSnappingEnabled,
  onToggleSnapping,
  isMinimapOpen,
  onToggleMinimap,
  isLeftSidebarOpen,
  onToggleLeftSidebar,
  isRightSidebarOpen,
  onToggleRightSidebar,
  auth,
  onShowAuth,
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
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleLeftSidebar}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
            isLeftSidebarOpen
              ? 'bg-zinc-800 border-zinc-700 text-white'
              : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
          title="Toggle Schema Editor"
        >
          <Menu className="w-4 h-4" />
        </button>

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

      <div className="flex items-center gap-2">
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

        <div className="relative">
          <button
            onClick={() => {
              setIsLayoutDropdownOpen(!isLayoutDropdownOpen);
              setIsTemplateDropdownOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
            <span>Layout</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>

          {isLayoutDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Automatic Graph Layouts
              </div>
              {LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onRunLayout(opt.id);
                    setIsLayoutDropdownOpen(false);
                  }}
                  className="w-full flex flex-col items-start px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 hover:text-white text-left transition-colors group"
                >
                  <span className="text-xs font-medium text-zinc-200 group-hover:text-white">
                    {opt.label}
                  </span>
                  <span className="text-[10.5px] text-zinc-500">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-zinc-800 mx-1" />

        <div className="flex items-center gap-1 bg-zinc-950/60 border border-zinc-800 rounded-lg p-0.5">
          <button
            onClick={handleUndo}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950/60 border border-zinc-800 rounded-lg p-0.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomReset}
            className="px-1.5 py-1 text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Reset Zoom to 100%"
          >
            100%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFitContent}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Fit Graph into View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950/60 border border-zinc-800 rounded-lg p-0.5">
          <button
            onClick={onToggleGrid}
            className={`p-1.5 rounded transition-colors ${
              isGridVisible
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={isGridVisible ? 'Hide Grid' : 'Show Grid'}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleSnapping}
            className={`p-1.5 rounded transition-colors ${
              isSnappingEnabled
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={isSnappingEnabled ? 'Disable Grid Snapping' : 'Enable Grid Snapping'}
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleMinimap}
            className={`p-1.5 rounded transition-colors ${
              isMinimapOpen
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={isMinimapOpen ? 'Hide Minimap' : 'Show Minimap'}
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onClearGraph}
          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800 rounded-lg transition-colors"
          title="Clear Diagram"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {auth && (
          <>
            {auth.status === 'authenticated' && auth.user ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                  {auth.user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-[11px] text-zinc-300 font-medium truncate max-w-[120px]">
                  {auth.user.email}
                </span>
                <button
                  onClick={() => auth.logout()}
                  className="text-[10px] text-zinc-500 hover:text-rose-400 transition-colors ml-1"
                  title="Log out"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onShowAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition-all"
                title="Sign in to save and load diagrams from database"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sign In</span>
              </button>
            )}
            <div className="h-5 w-px bg-zinc-800 mx-0.5" />
          </>
        )}

        {onSaveModel && (
          <button
            onClick={() => onSaveModel()}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              saveStatus === 'saving'
                ? 'bg-zinc-800 text-zinc-400 border-zinc-700 cursor-wait'
                : saveStatus === 'saved'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                : saveStatus === 'error'
                ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border-zinc-700 hover:border-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]'
            }`}
            title="Save yFiles graph model to cloud database"
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : saveStatus === 'saved' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Save className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                ? 'Saved'
                : saveStatus === 'error'
                ? 'Save Failed'
                : 'Save Model'}
            </span>
          </button>
        )}

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