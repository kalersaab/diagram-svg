'use client';

import React, { useCallback, useState } from 'react';
import {
  GraphComponent,
  type IModelItem,
  Rect
} from '@yfiles/yfiles';
import { Toolbar } from './Toolbar';
import { ShapePalette } from './ShapePalette';
import { GraphCanvas } from './GraphCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { GraphOverview } from './GraphOverview';
import { ContextMenu, type ContextMenuState } from './ContextMenu';
import { SvgExportModal } from './SvgExportModal';
import {
  loadTemplateIntoGraph,
  SAMPLE_TEMPLATES,
  type TemplateDefinition
} from '../utils/SampleTemplates';
import { applyLayout, type LayoutType } from '../utils/yfiles-layouts';
import { type DiagramNodeData } from '../utils/yfiles-styles';
import { yFilesToDrawioXml } from '../utils/yfiles-to-drawio';

interface DiagramEditorProps {
  onExportToDrawio?: (xml: string) => void;
}

export default function DiagramEditor({ onExportToDrawio }: DiagramEditorProps) {
  const [graphComponent, setGraphComponent] = useState<GraphComponent | null>(
    null
  );
  const [diagramTitle, setDiagramTitle] = useState<string>(
    'Cloud Microservices Architecture'
  );
  const [selectedItem, setSelectedItem] = useState<IModelItem | null>(null);

  // Panels visibility
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);
  const [isMinimapOpen, setIsMinimapOpen] = useState<boolean>(true);
  const [isGridVisible, setIsGridVisible] = useState<boolean>(true);
  const [isSnappingEnabled, setIsSnappingEnabled] = useState<boolean>(true);

  // Modals & Context Menus
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    item: null
  });

  // Load default template on graph component readiness
  const handleGraphComponentReady = useCallback((gc: GraphComponent) => {
    setGraphComponent(gc);
    const initialTmpl = SAMPLE_TEMPLATES[0]; // Cloud Architecture
    loadTemplateIntoGraph(gc.graph, initialTmpl);
    void applyLayout(gc, initialTmpl.recommendedLayout, {
      duration: '0ms',
      animate: false
    });
    gc.fitGraphBounds();
  }, []);

  // Run Layout
  const handleRunLayout = useCallback(
    async (layoutType: LayoutType) => {
      if (!graphComponent) return;
      await applyLayout(graphComponent, layoutType, {
        duration: '600ms',
        animate: true
      });
    },
    [graphComponent]
  );

  // Template select
  const handleSelectTemplate = useCallback(
    (template: TemplateDefinition) => {
      if (!graphComponent) return;
      loadTemplateIntoGraph(graphComponent.graph, template);
      setDiagramTitle(template.name);
      setSelectedItem(null);
      void applyLayout(graphComponent, template.recommendedLayout, {
        duration: '600ms',
        animate: true
      });
    },
    [graphComponent]
  );

  // Clear Graph
  const handleClearGraph = useCallback(() => {
    if (!graphComponent) return;
    if (confirm('Clear the entire diagram?')) {
      graphComponent.graph.clear();
      setSelectedItem(null);
      setDiagramTitle('Untitled Diagram');
    }
  }, [graphComponent]);

  // Add node from shape palette click
  const handleAddNodeFromPalette = useCallback(
    (data: DiagramNodeData) => {
      if (!graphComponent) return;
      const center = graphComponent.viewport.center;
      const width = data.shape === 'diamond' ? 120 : 180;
      const height = data.shape === 'diamond' ? 100 : 58;

      const node = graphComponent.graph.createNode({
        layout: new Rect(
          center.x - width / 2,
          center.y - height / 2,
          width,
          height
        ),
        tag: data
      });

      graphComponent.selection.clear();
      graphComponent.selection.add(node);
      setSelectedItem(node);
    },
    [graphComponent]
  );

  // Update trigger (rerender selected item properties)
  const [, setTick] = useState(0);
  const handleForceUpdate = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  // Export yFiles graph to draw.io XML and hand off to parent
  const handleExportToDrawio = useCallback(() => {
    if (!graphComponent || !onExportToDrawio) return;
    if (graphComponent.graph.nodes.size === 0) {
      alert('The diagram is empty. Add some nodes before exporting.');
      return;
    }
    const xml = yFilesToDrawioXml(graphComponent, { title: diagramTitle });
    onExportToDrawio(xml);
  }, [graphComponent, diagramTitle, onExportToDrawio]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-950 text-zinc-100 select-none">
      {/* Top Toolbar */}
      <Toolbar
        graphComponent={graphComponent}
        diagramTitle={diagramTitle}
        onTitleChange={setDiagramTitle}
        onRunLayout={handleRunLayout}
        onSelectTemplate={handleSelectTemplate}
        onClearGraph={handleClearGraph}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onExportToDrawio={onExportToDrawio ? handleExportToDrawio : undefined}
        isGridVisible={isGridVisible}
        onToggleGrid={() => setIsGridVisible(!isGridVisible)}
        isSnappingEnabled={isSnappingEnabled}
        onToggleSnapping={() => setIsSnappingEnabled(!isSnappingEnabled)}
        isMinimapOpen={isMinimapOpen}
        onToggleMinimap={() => setIsMinimapOpen(!isMinimapOpen)}
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
      />

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar - Shape Palette */}
        {isLeftSidebarOpen && (
          <ShapePalette onAddNode={handleAddNodeFromPalette} />
        )}

        {/* Center Canvas */}
        <main className="flex-1 h-full relative overflow-hidden">
          <GraphCanvas
            onGraphComponentReady={handleGraphComponentReady}
            onSelectItem={setSelectedItem}
            onContextMenu={setContextMenuState}
            isGridVisible={isGridVisible}
            isSnappingEnabled={isSnappingEnabled}
          />

          {/* Minimap Overlay */}
          <GraphOverview
            graphComponent={graphComponent}
            isOpen={isMinimapOpen}
            onToggle={() => setIsMinimapOpen(!isMinimapOpen)}
          />

          {/* Context Menu */}
          <ContextMenu
            state={contextMenuState}
            onClose={() =>
              setContextMenuState((prev) => ({ ...prev, visible: false }))
            }
            graphComponent={graphComponent}
            onSelectItem={setSelectedItem}
            onRunLayout={handleRunLayout}
          />
        </main>

        {/* Right Sidebar - Properties Inspector */}
        {isRightSidebarOpen && (
          <PropertiesPanel
            selectedItem={selectedItem}
            graphComponent={graphComponent}
            onUpdate={handleForceUpdate}
            onRunLayout={handleRunLayout}
          />
        )}
      </div>

      {/* SVG Export Studio Modal */}
      <SvgExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        graphComponent={graphComponent}
        diagramTitle={diagramTitle}
      />
    </div>
  );
}
