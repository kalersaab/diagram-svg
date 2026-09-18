import React, { useState, useCallback, useEffect } from 'react';
import {
  PenTool,
  FolderKanban,
  LayoutGrid,
  Columns,
  ArrowLeft,
  Sparkles,
  Loader2,
  Database,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DrawioEmbed } from './DrawioEmbed';
import { ModelsTableView } from './ModelsTableView';
import { DrawioGallery } from './DrawioGallery';
import { AuthModal } from './AuthModal';
import {
  type StoredDiagram,
  getStoredDiagrams,
  saveDiagramToStorage,
  setActiveDiagramId,
  syncLocalDiagramsToBackend,
} from '../utils/diagram-storage';
import DiagramService from '@/app/services/diagram';
import YFilesService, { type YFilesModelRecord } from '@/app/services/yfiles';
import { BLANK_DRAWIO_XML } from '../utils/drawio-bridge';
import { useAuth } from '@/app/hooks/useAuth';

const diagramService = new DiagramService();
const yfilesService = new YFilesService();
export type DrawioStudioTab = 'editor' | 'gallery' | 'split';

interface DrawioStudioProps {
  className?: string;
  onBack?: () => void;
  initialXml?: string;
  initialTab?: DrawioStudioTab;
  onLoadYFilesModel?: (model: YFilesModelRecord) => void;
  onOpenMetamodels?: () => void;
}

export function DrawioStudio({ className = '', onBack, initialXml, initialTab, onLoadYFilesModel, onOpenMetamodels }: DrawioStudioProps) {
  const auth = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [activeTab, setActiveTab] = useState<DrawioStudioTab>(initialTab ?? 'gallery');
  const [diagrams, setDiagrams] = useState<StoredDiagram[]>([]);
  const [activeDiagram, setActiveDiagram] = useState<StoredDiagram | null>(() => {
    if (initialXml) {
      return {
        id: `exported_${Date.now()}`,
        title: 'Exported Diagram',
        description: 'Diagram exported from yFiles',
        category: 'custom',
        xml: initialXml,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    return null;
  });
  const [loadingDiagrams, setLoadingDiagrams] = useState(false);

  const [currentSvg, setCurrentSvg] = useState<string>('');
  const [currentXml, setCurrentXml] = useState<string>(initialXml ?? BLANK_DRAWIO_XML);

  const [editorKey, setEditorKey] = useState<number>(0);

  useEffect(() => {
    if (initialXml && initialXml !== currentXml) {
      setCurrentXml(initialXml);
      setActiveTab('editor');
      setEditorKey(k => k + 1);
    }
  }, [initialXml]);

  const loadDiagrams = useCallback(async (authenticated: boolean) => {
    if (authenticated) {
      setLoadingDiagrams(true);
      try {
        const remote = await diagramService.getDiagrams();

        const merged = await syncLocalDiagramsToBackend(
          remote,
          (payload) => diagramService.createDiagram(payload),
        );
        setDiagrams(merged);
      } catch (err) {
        console.error('Failed to load diagrams from API, falling back to localStorage', err);
        setDiagrams(getStoredDiagrams());
      } finally {
        setLoadingDiagrams(false);
      }
    } else {
      setDiagrams(getStoredDiagrams());
    }
  }, []);

  useEffect(() => {
    if (auth.status === 'loading') return;
    loadDiagrams(auth.status === 'authenticated');
  }, [auth.status, loadDiagrams]);

  const handleSave = useCallback(
    async (xml: string, svg?: string) => {
      let diagram = activeDiagram;
      if (!diagram) {
        diagram = {
          id: `exported_${Date.now()}`,
          title: 'Exported Diagram',
          description: 'Diagram exported from yFiles',
          category: 'custom' as const,
          xml,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setActiveDiagram(diagram);
      }

      const updated: StoredDiagram = {
        ...diagram,
        xml,
        svg: svg ?? diagram.svg,
        updatedAt: Date.now(),
      };

      setActiveDiagram(updated);
      setCurrentXml(xml);
      if (svg) setCurrentSvg(svg);
      setDiagrams(prev => prev.map(d => (d.id === updated.id ? updated : d)));

      if (auth.status === 'authenticated') {
        try {
          const isNewDiagram = diagram.id.startsWith('exported_');

          let persisted: StoredDiagram;
          if (isNewDiagram) {
            persisted = await diagramService.createDiagram({
              title: updated.title,
              description: updated.description,
              category: updated.category,
              xml: updated.xml,
              svg: updated.svg,
            });
          } else {
            persisted = await diagramService.updateDiagram(diagram.id, { xml, svg });
          }
          setActiveDiagram(persisted);
          setDiagrams(prev =>
            isNewDiagram
              ? [persisted, ...prev]
              : prev.map(d => (d.id === persisted.id ? persisted : d))
          );
        } catch (err) {
          console.error('Failed to save diagram to API, saved locally', err);
          saveDiagramToStorage(updated);
        }
      } else {
        saveDiagramToStorage(updated);
      }
    },
    [activeDiagram, auth.status],
  );

  const handleEditDiagram = useCallback((diagram: StoredDiagram) => {
    setActiveDiagram(diagram);
    setCurrentXml(diagram.xml);
    if (diagram.svg) setCurrentSvg(diagram.svg);
    setActiveDiagramId(diagram.id);
    setActiveTab('editor');
  }, []);

  const handleViewDiagram = useCallback((diagram: StoredDiagram) => {
    setActiveDiagram(diagram);
    setCurrentXml(diagram.xml);
    if (diagram.svg) setCurrentSvg(diagram.svg);
    setActiveTab('editor');
  }, []);

  const handleViewSvg = useCallback(() => {
    setActiveTab('editor');
  }, []);

  const handleNewDiagramFromGallery = useCallback(
    async (diagram: StoredDiagram) => {
      if (auth.status === 'authenticated') {
        try {
          const saved = await diagramService.createDiagram({
            title: diagram.title,
            description: diagram.description,
            category: diagram.category,
            xml: diagram.xml,
          });
          setDiagrams(prev => [saved, ...prev]);
          handleEditDiagram(saved);
          return;
        } catch (err) {
          console.error('API create failed, using local id', err);
        }
      }
      handleEditDiagram(diagram);
    },
    [auth.status, handleEditDiagram],
  );
  void handleNewDiagramFromGallery;

  const [savedYFilesModels, setSavedYFilesModels] = useState<YFilesModelRecord[]>([]);
  const [loadingYFilesModels, setLoadingYFilesModels] = useState(false);

  const fetchYFilesModels = useCallback(async () => {
    setLoadingYFilesModels(true);
    try {
      const models = await yfilesService.getYFilesModels();
      setSavedYFilesModels(models);
    } catch (err) {
      console.error('Failed to fetch yFiles models', err);
    } finally {
      setLoadingYFilesModels(false);
    }
  }, []);

  useEffect(() => {
    if (auth.status === 'authenticated') {
      fetchYFilesModels();
    }
  }, [auth.status, fetchYFilesModels]);

  const handleDeleteYFilesModel = useCallback(async (id: string) => {
    try {
      await yfilesService.deleteYFilesModel(id);
      setSavedYFilesModels(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      console.error('Failed to delete yFiles model', err);
      alert('Failed to delete model.');
    }
  }, []);

  const handleOpenXmlInDrawio = useCallback((xml: string) => {
    setCurrentXml(xml);
    setActiveTab('editor');
    setEditorKey(k => k + 1);
  }, []);

  const tabs: { id: DrawioStudioTab; label: string; icon: React.ReactNode }[] = [
    { id: 'gallery', label: 'Gallery', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'editor', label: 'Draw.io Editor', icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: 'split', label: 'Split View', icon: <Columns className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className={`flex flex-col h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden ${className}`}>
      {showAuthModal && (
        <AuthModal
          auth={auth}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      <div className="h-12 border-b border-zinc-800/80 bg-zinc-900/90 px-4 flex items-center gap-3 shrink-0 backdrop-blur-md">
        {onBack && (
          <>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>yFiles Studio</span>
            </button>
            <div className="h-5 w-px bg-zinc-800" />
          </>
        )}

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">
            Draw<span className="text-indigo-400">.io</span>
            <span className="text-zinc-500 font-normal ml-1.5 text-xs">Studio</span>
          </span>
        </div>

        <div className="h-5 w-px bg-zinc-800 mx-1" />

        <div className="flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-indigo-500/15 text-indigo-400 shadow-sm shadow-indigo-500/10'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeDiagram && activeTab !== 'gallery' && (
          <>
            <div className="h-5 w-px bg-zinc-800 mx-1" />
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-zinc-300 font-medium truncate max-w-[200px]">
                {activeDiagram.title}
              </span>
            </div>
          </>
        )}

        {(loadingDiagrams || loadingYFilesModels) && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Loading…</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {onOpenMetamodels && (
            <button
              onClick={onOpenMetamodels}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
            >
              <Database className="w-3.5 h-3.5 text-violet-400" />
              <span>Metamodels</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'gallery' && (
          <DrawioGallery
            diagrams={diagrams}
            onDiagramsChange={setDiagrams}
            onEditDiagram={handleEditDiagram}
            onViewDiagram={handleViewDiagram}
            auth={auth}
            onShowAuth={() => setShowAuthModal(true)}
          />
        )}

        {activeTab === 'editor' && (
          <DrawioEmbed
            key={editorKey}
            initialXml={currentXml}
            diagramTitle={activeDiagram?.title}
            onSave={handleSave}
            onViewSvg={handleViewSvg}
            autoExportSvg
          />
        )}

        {activeTab === 'split' && (
          <div className="flex h-full overflow-hidden">
            <div className="flex-1 border-r border-zinc-800 h-full overflow-hidden">
              <DrawioEmbed
                key={editorKey}
                initialXml={currentXml}
                diagramTitle={activeDiagram?.title}
                onSave={handleSave}
                autoExportSvg
              />
            </div>
            <div className="flex-1 h-full overflow-hidden">
              <ModelsTableView
                models={savedYFilesModels}
                onLoadModel={(model) => {
                  if (onLoadYFilesModel) {
                    onLoadYFilesModel(model);
                  } else if (onBack) {
                    onBack();
                  }
                }}
                onDeleteModel={handleDeleteYFilesModel}
                onOpenInDrawio={handleOpenXmlInDrawio}
                onRefresh={fetchYFilesModels}
                onNewModel={onBack}
                isLoading={loadingYFilesModels}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}