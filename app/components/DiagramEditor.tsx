'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  EMPTY_METAMODEL,
} from '../utils/metamodel';
import MetamodelService from '@/app/services/metamodel';
import YFilesService, {
  type YFilesModelRecord,
  type YFilesModelCategory,
} from '@/app/services/yfiles';
import {
  serializeGraphToYFilesModel,
  loadYFilesModelIntoGraph,
} from '../utils/yfiles-model-bridge';
import { ModelsTableView } from './ModelsTableView';
import { MetamodelScreen } from './MetamodelScreen';
import { AuthModal } from './AuthModal';
import { useAuth } from '@/app/hooks/useAuth';

const metamodelService = new MetamodelService();
const yfilesService = new YFilesService();

interface DiagramEditorProps {
  onExportToDrawio?: (xml: string) => void;
  onModelsChange?: (models: import('@/app/services/yfiles').YFilesModelRecord[], activeId?: string) => void;
  initialModelToLoad?: YFilesModelRecord | null;
}

export default function DiagramEditor({ onExportToDrawio, onModelsChange, initialModelToLoad }: DiagramEditorProps) {
  const auth = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeCenterView, setActiveCenterView] = useState<'canvas' | 'models' | 'metamodel'>('canvas');
  const [graphComponent, setGraphComponent] = useState<GraphComponent | null>(null);
  const graphComponentRef = useRef<GraphComponent | null>(null);
  const pendingModelRef = useRef<YFilesModelRecord | null>(initialModelToLoad ?? null);
  const [diagramTitle, setDiagramTitle] = useState<string>(initialModelToLoad?.title || 'Untitled Diagram');
  const [selectedItem, setSelectedItem] = useState<IModelItem | null>(null);

  const [metamodel, setMetamodel] = useState<Metamodel>(EMPTY_METAMODEL);

  const [metamodelRemoteId, setMetamodelRemoteId] = useState<string | undefined>(undefined);
  const [yfilesModelRemoteId, setYfilesModelRemoteId] = useState<string | undefined>(undefined);
  const [savedModels, setSavedModels] = useState<YFilesModelRecord[]>([]);

  const syncDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unauthenticated';
  const [metamodelSyncStatus, setMetamodelSyncStatus] = useState<SyncStatus>('unauthenticated');
  const [yfilesModelSyncStatus, setYfilesModelSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    if (auth.status === 'unauthenticated') {
      setMetamodelSyncStatus('unauthenticated');
      setSavedModels([]);
      return;
    }
    if (auth.status !== 'authenticated') return;

    setMetamodelSyncStatus('idle');
    metamodelService
      .getMetamodels()
      .then(res => {
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
              allowedSourceTypes: rt.allowedSourceTypes.map(t => t._id),
              allowedTargetTypes: rt.allowedTargetTypes.map(t => t._id),
            })),
          });
          setMetamodelSyncStatus('saved');
        }
      })
      .catch(err => {
        console.error('Failed to load metamodel from API', err);
        setMetamodelSyncStatus('error');
      });

    yfilesService
      .getYFilesModels()
      .then(models => {
        setSavedModels(models);
        onModelsChange?.(models, yfilesModelRemoteId);
      })
      .catch(err => {
        console.error('Failed to load yFiles models from API', err);
      });
  }, [auth.status]);

  const handleSaveMetamodel = useCallback(async () => {
    if (auth.status !== 'authenticated') return;
    setMetamodelSyncStatus('saving');
    try {
      const { doc, metamodel: updated } = await metamodelService.syncMetamodel(
        diagramTitle || 'Metamodel',
        metamodel,
        metamodelRemoteId,
      );
      if (!metamodelRemoteId) setMetamodelRemoteId(doc._id);
      setMetamodel(updated);
      setMetamodelSyncStatus('saved');
      setTimeout(() => setMetamodelSyncStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save metamodel', err);
      setMetamodelSyncStatus('error');
    }
  }, [auth.status, diagramTitle, metamodel, metamodelRemoteId]);

  const handleSaveYFilesModel = useCallback(
    async (customTitle?: unknown, customCategory?: unknown) => {
      if (!graphComponent) return;
      if (auth.status !== 'authenticated') {
        setShowAuthModal(true);
        return;
      }

      const titleToSave =
        typeof customTitle === 'string' && customTitle.trim()
          ? customTitle.trim()
          : diagramTitle || 'Untitled Diagram';

      const categoryToSave: YFilesModelCategory =
        typeof customCategory === 'string'
          ? (customCategory as YFilesModelCategory)
          : 'cloud';

      setYfilesModelSyncStatus('saving');
      try {
        const payload = await serializeGraphToYFilesModel(graphComponent, {
          title: titleToSave,
          category: categoryToSave,
          metamodelId: metamodelRemoteId,
          includeSvg: true,
          includeDrawioXml: true,
        });

        let doc: YFilesModelRecord;
        if (yfilesModelRemoteId) {
          doc = await yfilesService.updateYFilesModel(yfilesModelRemoteId, payload);
          setSavedModels(prev => {
            const next = prev.map(m => (m._id === doc._id ? doc : m));
            onModelsChange?.(next, doc._id);
            return next;
          });
        } else {
          doc = await yfilesService.createYFilesModel(payload);
          setYfilesModelRemoteId(doc._id);
          setSavedModels(prev => {
            const next = [doc, ...prev];
            onModelsChange?.(next, doc._id);
            return next;
          });
        }

        if (typeof customTitle === 'string' && customTitle.trim() && customTitle.trim() !== diagramTitle) {
          setDiagramTitle(customTitle.trim());
        }

        setYfilesModelSyncStatus('saved');
        setTimeout(() => setYfilesModelSyncStatus('idle'), 2500);
      } catch (err) {
        console.error('Failed to save yFiles model', err);
        setYfilesModelSyncStatus('error');
        setTimeout(() => setYfilesModelSyncStatus('idle'), 3000);
      }
    },
    [graphComponent, auth.status, diagramTitle, metamodelRemoteId, yfilesModelRemoteId],
  );

  const applyModelToGraph = useCallback((gc: GraphComponent, model: YFilesModelRecord) => {
    pendingModelRef.current = model;
    loadYFilesModelIntoGraph(gc, model.graphData);
    setDiagramTitle(model.title);
    setYfilesModelRemoteId(model._id);
    setSelectedItem(null);
    gc.fitGraphBounds();
  }, []);

  const handleLoadModel = useCallback(
    async (model: YFilesModelRecord) => {
      setActiveCenterView('canvas');
      pendingModelRef.current = model;
      const gc = graphComponentRef.current;
      if (gc) {
        applyModelToGraph(gc, model);
      }

      try {
        const fullModel = await yfilesService.getYFilesModel(model._id);
        pendingModelRef.current = fullModel;
        const live = graphComponentRef.current;
        if (live) {
          applyModelToGraph(live, fullModel);
        }
      } catch (err) {
        console.warn('Could not fetch full yFiles model; using list payload', err);
      }
    },
    [applyModelToGraph],
  );

  const handleDeleteModel = useCallback(
    async (id: string) => {
      try {
        await yfilesService.deleteYFilesModel(id);
        setSavedModels(prev => {
          const next = prev.filter(m => m._id !== id);
          const newActive = yfilesModelRemoteId === id ? undefined : yfilesModelRemoteId;
          onModelsChange?.(next, newActive);
          return next;
        });
        if (yfilesModelRemoteId === id) {
          setYfilesModelRemoteId(undefined);
        }
      } catch (err) {
        console.error('Failed to delete yFiles model', err);
        alert('Failed to delete model.');
      }
    },
    [yfilesModelRemoteId, onModelsChange],
  );

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
          diagramTitle || 'Metamodel',
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
  const [metamodelName, setMetamodelName] = useState<string>('Metamodel');
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

  const handleGraphComponentReady = useCallback((gc: GraphComponent | null) => {
    graphComponentRef.current = gc;
    setGraphComponent(gc);
    if (gc && pendingModelRef.current) {
      applyModelToGraph(gc, pendingModelRef.current);
    }
  }, [applyModelToGraph]);

  useEffect(() => {
    if (!initialModelToLoad) return;
    pendingModelRef.current = initialModelToLoad;
    const gc = graphComponentRef.current;
    if (gc) {
      applyModelToGraph(gc, initialModelToLoad);
    }
  }, [initialModelToLoad, applyModelToGraph]);

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
      setYfilesModelRemoteId(undefined);
      pendingModelRef.current = null;
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
      { }
      <Toolbar
        graphComponent={graphComponent}
        diagramTitle={diagramTitle}
        onTitleChange={setDiagramTitle}
        onRunLayout={handleRunLayout}
        onSelectTemplate={handleSelectTemplate}
        onClearGraph={handleClearGraph}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onExportToDrawio={onExportToDrawio ? handleExportToDrawio : undefined}
        onSaveModel={handleSaveYFilesModel}
        saveStatus={yfilesModelSyncStatus}
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
        auth={auth}
        onShowAuth={() => setShowAuthModal(true)}
      />

      {showAuthModal && (
        <AuthModal
          auth={auth}
          onClose={() => setShowAuthModal(false)}
        />
      )}

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
        onOpenModelsView={() => router.push('/models')}
        onOpenMetamodelView={() => router.push('/metamodel')}
        activeView={activeCenterView}
        savedModelsCount={savedModels.length}
      />

      <div className="flex-1 flex overflow-hidden relative">
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
            isOpen={isMinimapOpen && activeCenterView === 'canvas'}
            onToggle={() => setIsMinimapOpen(!isMinimapOpen)}
          />

          <ContextMenu
            state={contextMenuState}
            onClose={() => setContextMenuState(prev => ({ ...prev, visible: false }))}
            graphComponent={graphComponent}
            onSelectItem={setSelectedItem}
            onRunLayout={handleRunLayout}
          />

          {activeCenterView === 'models' && (
            <div className="absolute inset-0 z-30">
              <ModelsTableView
                models={savedModels}
                activeModelId={yfilesModelRemoteId}
                onLoadModel={model => {
                  void handleLoadModel(model);
                }}
                onDeleteModel={handleDeleteModel}
                onOpenInDrawio={onExportToDrawio}
                onRefresh={() => {
                  yfilesService.getYFilesModels().then(m => {
                    setSavedModels(m);
                    onModelsChange?.(m, yfilesModelRemoteId);
                  }).catch(err => console.error(err));
                }}
                onNewModel={() => setActiveCenterView('canvas')}
              />
            </div>
          )}
        </main>

        {isRightSidebarOpen && activeCenterView === 'canvas' && (
          <PropertiesPanel
            selectedItem={selectedItem}
            graphComponent={graphComponent}
            onUpdate={handleForceUpdate}
            onRunLayout={handleRunLayout}
            metamodel={metamodel}
          />
        )}
      </div>

      { }
      <SvgExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        graphComponent={graphComponent}
        diagramTitle={diagramTitle}
      />
    </div>
  );
}