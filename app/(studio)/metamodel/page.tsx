'use client';

import dynamic from 'next/dynamic';
import React, { useCallback, useState } from 'react';
import { Database, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { AuthModal } from '@/app/components/AuthModal';
import MetamodelService from '@/app/services/metamodel';
import type { Metamodel } from '@/app/utils/metamodel';
import { EMPTY_METAMODEL } from '@/app/utils/metamodel';
import { MetamodelDrawer } from '@/app/components/MetamodelDrawer';
import type { DiagramNodeData } from '@/app/utils/yfiles-styles';

const MetamodelScreen = dynamic(
  () => import('@/app/components/MetamodelScreen').then((mod) => ({ default: mod.MetamodelScreen })),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-200">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-pulse">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-violet-500/20 blur-md -z-10 animate-ping" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-white tracking-tight">
              Meta<span className="text-violet-400">model</span> Manager
            </span>
            <span className="text-xs text-zinc-500">Loading…</span>
          </div>
        </div>
      </div>
    )
  }
);

const metamodelService = new MetamodelService();

type MetamodelSyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unauthenticated';

export default function MetamodelPage() {
  const router = useRouter();
  const auth = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [metamodel, setMetamodel] = useState<Metamodel>(EMPTY_METAMODEL);
  const [metamodelName, setMetamodelName] = useState('Metamodel');
  const [metamodelRemoteId, setMetamodelRemoteId] = useState<string | undefined>();
  const [syncStatus, setSyncStatus] = useState<MetamodelSyncStatus>('idle');

  // Load metamodel on mount
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

  const handleOpenModels = () => {
    router.push('/models');
  };

  const handleOpenObjectTypes = () => {
    router.push('/object-types');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-950 relative">
      {/* Show auth modal if unauthenticated */}
      {auth.status === 'unauthenticated' && (
        <AuthModal auth={auth} required={true} />
      )}

      {/* Header with drawer icon */}
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

      <MetamodelScreen onBack={handleBack} />

      {/* Metamodel Drawer */}
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
        onOpenModelsView={handleOpenModels}
        onOpenObjectTypesView={handleOpenObjectTypes}
        activeView="metamodel"
      />
    </div>
  );
}
