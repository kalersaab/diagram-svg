'use client';

import dynamic from 'next/dynamic';
import React, { useCallback, useState } from 'react';
import { FolderKanban, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { AuthModal } from '@/app/components/AuthModal';
import MetamodelService from '@/app/services/metamodel';
import type { Metamodel } from '@/app/utils/metamodel';
import { EMPTY_METAMODEL } from '@/app/utils/metamodel';
import { MetamodelDrawer } from '@/app/components/MetamodelDrawer';
import YFilesService, { type YFilesModelRecord } from '@/app/services/yfiles';

const ModelsTableView = dynamic(
  () => import('@/app/components/ModelsTableView').then((mod) => ({ default: mod.ModelsTableView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-md -z-10 animate-ping" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-white tracking-tight">
              Loading Saved <span className="text-indigo-400">Models</span>
            </span>
            <span className="text-xs text-zinc-500">Fetching diagrams...</span>
          </div>
        </div>
      </div>
    )
  }
);

const metamodelService = new MetamodelService();
const yfilesService = new YFilesService();

type MetamodelSyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unauthenticated';

export default function ModelsPage() {
  const router = useRouter();
  const auth = useAuth();
  const [models, setModels] = useState<YFilesModelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModelId, setActiveModelId] = useState<string | undefined>();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [metamodel, setMetamodel] = useState<Metamodel>(EMPTY_METAMODEL);
  const [metamodelName, setMetamodelName] = useState('Metamodel');
  const [metamodelRemoteId, setMetamodelRemoteId] = useState<string | undefined>();
  const [syncStatus, setSyncStatus] = useState<MetamodelSyncStatus>('idle');

  // Load models
  React.useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      try {
        const loadedModels = await yfilesService.getYFilesModels();
        setModels(loadedModels);
      } catch (error) {
        console.error('Failed to load models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Load metamodel
  React.useEffect(() => {
    if (auth.status === 'unauthenticated') {
      setSyncStatus('unauthenticated');
      return;
    }
    if (auth.status !== 'authenticated') return;

    setSyncStatus('idle');
    metamodelService
      .getMetamodels()
      .then(res => {
        const docs = res.data;
        if (docs.length > 0) {
          const latest = docs[0];
          setMetamodelRemoteId(latest._id);
          setMetamodelName(latest.name || 'Metamodel');
          setMetamodel({
            objectTypes: latest.objectTypes.map(ot => ({
              ...(ot as unknown as import('@/app/utils/metamodel').ObjectTypeDefinition),
              id: ot._id,
            })),
            relationshipTypes: latest.relationshipTypes.map(rt => ({
              ...rt,
              id: rt._id,
              allowedSourceTypes: rt.allowedSourceTypes.map(t => t._id),
              allowedTargetTypes: rt.allowedTargetTypes.map(t => t._id),
            })),
          });
          setSyncStatus('saved');
        }
      })
      .catch(err => {
        console.error('Failed to load metamodel:', err);
        setSyncStatus('error');
      });
  }, [auth.status]);

  const handleLoadModel = (model: YFilesModelRecord) => {
    setActiveModelId(model._id);
    const params = new URLSearchParams({
      modelId: model._id,
    });
    router.push(`/diagram?${params.toString()}`);
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await yfilesService.deleteYFilesModel(id);
      setModels(models.filter(m => m._id !== id));
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  const handleExportToDrawio = (xml: string) => {
    const params = new URLSearchParams({
      xml: xml,
    });
    router.push(`/?${params.toString()}`);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const loadedModels = await yfilesService.getYFilesModels();
      setModels(loadedModels);
    } catch (error) {
      console.error('Failed to refresh models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewModel = () => {
    router.push('/');
  };

  const handleMetamodelChange = useCallback((updated: Metamodel) => {
    setMetamodel(updated);
    setSyncStatus('idle');
  }, []);

  const handleSaveMetamodel = useCallback(async () => {
    if (auth.status !== 'authenticated') return;
    setSyncStatus('saving');
    try {
      const { doc, metamodel: updated } = await metamodelService.syncMetamodel(
        metamodelName || 'Metamodel',
        metamodel,
        metamodelRemoteId,
      );
      if (!metamodelRemoteId) setMetamodelRemoteId(doc._id);
      setMetamodel(updated);
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save metamodel:', err);
      setSyncStatus('error');
    }
  }, [auth.status, metamodelName, metamodel, metamodelRemoteId]);

  const handleAddNode = () => {
    // Not used on this page, but required by MetamodelDrawer
  };

  const handleOpenMetamodel = () => {
    router.push('/metamodel');
  };

  const handleOpenObjectTypes = () => {
    router.push('/object-types');
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-950 relative">
      {auth.status === 'unauthenticated' && (
        <AuthModal auth={auth} required={true} />
      )}

      <div className="h-14 border-b border-zinc-800/80 bg-zinc-900/90 px-4 flex items-center justify-between shrink-0 backdrop-blur-md">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Open schema editor"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div></div>
      </div>

      <ModelsTableView
        models={models}
        activeModelId={activeModelId}
        onLoadModel={handleLoadModel}
        onDeleteModel={handleDeleteModel}
        onOpenInDrawio={handleExportToDrawio}
        onRefresh={handleRefresh}
        onNewModel={handleNewModel}
        isLoading={isLoading}
      />

      <MetamodelDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        metamodel={metamodel}
        metamodelName={metamodelName}
        onNameChange={setMetamodelName}
        onChange={handleMetamodelChange}
        onSave={handleSaveMetamodel}
        syncStatus={syncStatus}
        onAddNode={handleAddNode}
        onOpenMetamodelView={handleOpenMetamodel}
        onOpenObjectTypesView={handleOpenObjectTypes}
        activeView="models"
        savedModelsCount={models.length}
      />
    </div>
  );
}
