'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  GraphComponent,
  type IModelItem,
  Rect
} from '@yfiles/yfiles';
import { Toolbar } from './Toolbar';
import { MetamodelDrawer } from './MetamodelDrawer';
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
import {
  type Metamodel,
  DEFAULT_METAMODEL,
} from '../utils/metamodel';
import MetamodelService from '@/app/services/metamodel';
import { useAuth } from '@/app/hooks/useAuth';

const metamodelService = new MetamodelService();

interface DiagramEditorProps {
  onExportToDrawio?: (xml: string) => void;
}

export default function DiagramEditor({ onExportToDrawio }: DiagramEditorProps) {
  const auth = useAuth();
  const [graphComponent, setGraphComponent] = useState<GraphComponent | null>(null);
  const [diagramTitle, setDiagramTitle] = useState<string>('Cloud Microservices Architecture');
  const [selectedItem, setSelectedItem] = useState<IModelItem | null>(null);

  const [metamodel, setMetamodel] = useState<Metamodel>(DEFAULT_METAMODEL);

  const [metamodelRemoteId, setMetamodelRemoteId] = useState<string | undefined>(undefined);

  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unauthenticated';
  const [metamodelSyncStatus, setMetamodelSyncStatus] = useState<SyncStatus>('unauthenticated');

  useEffect(() => {
    if (auth.status === 'unauthenticated') {
      setMetamodelSyncStatus('unauthenticated');
      return;
    }
    if (auth.status !== 'authenticated') return;

    setMetamodelSyncStatus('idle');
    metamodelService.getMetamodels().then(res => {
      const docs = res.data;
      if (docs.length > 0) {
        const latest = docs[0];
        setMetamodelRemoteId(latest._id);
        setMetamodel({
          objectTypes: latest.objectTypes.map(ot => ({
            ...(ot as unknown as import('../utils/metamodel').ObjectTypeDefinition),
            id: ot._id,
          })),
          relationshipTypes: latest.relationshipTypes.map(rt => ({
            ...rt,
            id: rt._id,
            // Flatten populated objects back to _id strings
            allowedSourceTypes: rt.allowedSourceTypes.map((t) => t._id),
            allowedTargetTypes: rt.allowedTargetTypes.map((t) => t._id),
          })),
        });
        setMetamodelSyncStatus('saved');
      }
    }).catch(err => {
      console.error('Failed to load metamodel from API', err);
      setMetamodelSyncStatus('error');
    });
  }, [auth.status]);

  // ─── Manual save handler ───────────────────────────────────────────────────

  const handleSaveMetamodel = useCallback(async () => {
    if (auth.status !== 'authenticated') return;
    setMetamodelSyncStatus('saving');
    try {
      const { doc, metamodel: updated } = await metamodelService.syncMetamodel(
        diagramTitle || 'My Metamodel',
        metamodel,
        metamodelRemoteId,
      );
      if (!metamodelRemoteId) setMetamodelRemoteId(doc._id);
      // Persist the backend _ids back into local state so subsequent saves use real refs
      setMetamodel(updated);
      setMetamodelSyncStatus('saved');
      setTimeout(() => setMetamodelSyncStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save metamodel', err);
      setMetamodelSyncStatus('error');
    }
  }, [auth.status, diagramTitle, metamodel, metamodelRemoteId]);

  // ─── Change handler — marks status dirty, triggers auto-save debounce ──────

  const handleMetamodelChange = useCallback((updated: Metamodel) => {
    setMetamodel(updated);
    if (auth.status !== 'authenticated') return;

    // Mark as unsaved immediately so user knows there are pending changes
    setMetamodelSyncStatus('idle');

    // Auto-save after 2 s of inactivity
    if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
    syncDebounceRef.current = setTimeout(async () => {
      setMetamodelSyncStatus('saving');
      try {
        const { doc, metamodel: synced } = await metamodelService.syncMetamodel(
          diagramTitle || 'My Metamodel',
          updated,
          metamodelRemoteId,
        );
        if (!metamodelRemoteId) setMetamodelRemoteId(doc._id);
        setMetamodel(synced);
        setMetamodelSyncStatus('saved');
        setTimeout(() => setMetamodelSyncStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to auto-save metamodel', err);
        setMetamodelSyncStatus('error');
      }
    }, 2000);
  }, [auth.status, diagramTitle, metamodelRemoteId]);

  const [isMetamodelDrawerOpen, setIsMetamodelDrawerOpen] = useState<boolean>(false);
  const [metamodelName, setMetamodelName] = useState<string>('My Metamodel');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);
  const [isMinimapOpen, setIsMinimapOpen] = useState<boolean>(true);
  const [isGridVisible, setIsGridVisible] = useState<boolean>(true);
  const [isSnappingEnabled, setIsSnappingEnabled] = useState<boolean>(true);

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    item: null
  });

  const handleGraphComponentReady = useCallback((gc: GraphComponent) => {
    setGraphComponent(gc);
    const initialTmpl = SAMPLE_TEMPLATES[0];
    loadTemplateIntoGraph(gc.graph, initialTmpl);
    void applyLayout(gc, initialTmpl.recommendedLayout, { duration: '0ms', animate: false });
    gc.fitGraphBounds();
  }, []);

  const handleRunLayout = useCallback(
    async (layoutType: LayoutType) => {
      if (!graphComponent) return;
      await applyLayout(graphComponent, layoutType, { duration: '600ms', animate: true });
    },
    [graphComponent]
  );

  const handleSelectTemplate = useCallback(
    (template: TemplateDefinition) => {
      if (!graphComponent) return;
      loadTemplateIntoGraph(graphComponent.graph, template);
      setDiagramTitle(template.name);
      setSelectedItem(null);
      void applyLayout(graphComponent, template.recommendedLayout, { duration: '600ms', animate: true });
    },
    [graphComponent]
  );

  const handleClearGraph = useCallback(() => {
    if (!graphComponent) return;
    if (confirm('Clear the entire diagram?')) {
      graphComponent.graph.clear();
      setSelectedItem(null);
      setDiagramTitle('Untitled Diagram');
    }
  }, [graphComponent]);

  const handleAddNodeFromPalette = useCallback(
    (data: DiagramNodeData) => {
      if (!graphComponent) return;
      const center = graphComponent.viewport.center;

      const objectType = data.objectTypeId
        ? metamodel.objectTypes.find(t => t.id === data.objectTypeId)
        : null;

      const width = objectType?.defaultWidth ?? (data.shape === 'diamond' ? 120 : 180);
      const height = objectType?.defaultHeight ?? (data.shape === 'diamond' ? 100 : 58);

      const node = graphComponent.graph.createNode({
        layout: new Rect(center.x - width / 2, center.y - height / 2, width, height),
        tag: data,
      });

      graphComponent.selection.clear();
      graphComponent.selection.add(node);
      setSelectedItem(node);
    },
    [graphComponent, metamodel]
  );

  const [, setTick] = useState(0);
  const handleForceUpdate = useCallback(() => setTick(t => t + 1), []);

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
      {}
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
        isLeftSidebarOpen={isMetamodelDrawerOpen}
        onToggleLeftSidebar={() => setIsMetamodelDrawerOpen(o => !o)}
        isRightSidebarOpen={isRightSidebarOpen}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
      />

      {/* Metamodel drawer — overlays the canvas */}
      <MetamodelDrawer
        open={isMetamodelDrawerOpen}
        onClose={() => setIsMetamodelDrawerOpen(false)}
        metamodel={metamodel}
        metamodelName={metamodelName}
        onNameChange={setMetamodelName}
        onChange={handleMetamodelChange}
        onSave={handleSaveMetamodel}
        syncStatus={metamodelSyncStatus}
        onAddNode={handleAddNodeFromPalette}
      />

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center Canvas */}
        <main className="flex-1 h-full relative overflow-hidden">
          <GraphCanvas
            onGraphComponentReady={handleGraphComponentReady}
            onSelectItem={setSelectedItem}
            onContextMenu={setContextMenuState}
            isGridVisible={isGridVisible}
            isSnappingEnabled={isSnappingEnabled}
          />

          <GraphOverview
            graphComponent={graphComponent}
            isOpen={isMinimapOpen}
            onToggle={() => setIsMinimapOpen(!isMinimapOpen)}
          />

          <ContextMenu
            state={contextMenuState}
            onClose={() => setContextMenuState(prev => ({ ...prev, visible: false }))}
            graphComponent={graphComponent}
            onSelectItem={setSelectedItem}
            onRunLayout={handleRunLayout}
          />
        </main>

        {}
        {isRightSidebarOpen && (
          <PropertiesPanel
            selectedItem={selectedItem}
            graphComponent={graphComponent}
            onUpdate={handleForceUpdate}
            onRunLayout={handleRunLayout}
            metamodel={metamodel}
          />
        )}
      </div>

      {}
      <SvgExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        graphComponent={graphComponent}
        diagramTitle={diagramTitle}
      />
    </div>
  );
}