'use client';

import React, { useState } from 'react';
import {
  Server,
  Database,
  Cloud,
  Layers,
  Shield,
  Users,
  HardDrive,
  Cpu,
  Boxes,
  HelpCircle,
  PlayCircle,
  FileText,
  Search,
  Plus,
  GitCommit,
  Radio,
  Workflow
} from 'lucide-react';
import { type DiagramNodeData, type NodeShape } from '../utils/yfiles-styles';

interface PaletteItem {
  id: string;
  name: string;
  category: 'cloud' | 'flowchart' | 'general';
  icon: string;
  shape: NodeShape;
  color: string;
  subtitle: string;
  badge?: string;
  lucideIcon: React.ReactNode;
}

const PALETTE_ITEMS: PaletteItem[] = [

  {
    id: 'api-gateway',
    name: 'API Gateway',
    category: 'cloud',
    icon: 'gateway',
    shape: 'card',
    color: '#a855f7',
    subtitle: 'Routing & Rate Limit',
    badge: 'GW',
    lucideIcon: <Radio className="w-4 h-4 text-purple-400" />
  },
  {
    id: 'web-service',
    name: 'Microservice',
    category: 'cloud',
    icon: 'server',
    shape: 'card',
    color: '#6366f1',
    subtitle: 'Node.js / Go / Rust',
    lucideIcon: <Server className="w-4 h-4 text-indigo-400" />
  },
  {
    id: 'auth-service',
    name: 'Auth / IAM',
    category: 'cloud',
    icon: 'shield',
    shape: 'card',
    color: '#ef4444',
    subtitle: 'JWT / OAuth2',
    badge: 'Sec',
    lucideIcon: <Shield className="w-4 h-4 text-rose-400" />
  },
  {
    id: 'cloud-edge',
    name: 'Cloud CDN / Edge',
    category: 'cloud',
    icon: 'cloud',
    shape: 'card',
    color: '#f97316',
    subtitle: 'Edge Compute & CDN',
    lucideIcon: <Cloud className="w-4 h-4 text-orange-400" />
  },
  {
    id: 'sql-db',
    name: 'SQL Database',
    category: 'cloud',
    icon: 'database',
    shape: 'cylinder',
    color: '#3b82f6',
    subtitle: 'Postgres / MySQL',
    badge: 'SQL',
    lucideIcon: <Database className="w-4 h-4 text-blue-400" />
  },
  {
    id: 'redis-cache',
    name: 'Redis Cache',
    category: 'cloud',
    icon: 'database',
    shape: 'cylinder',
    color: '#ec4899',
    subtitle: 'In-Memory Store',
    lucideIcon: <Layers className="w-4 h-4 text-pink-400" />
  },
  {
    id: 'message-queue',
    name: 'Kafka / Queue',
    category: 'cloud',
    icon: 'queue',
    shape: 'cylinder',
    color: '#eab308',
    subtitle: 'Pub/Sub Events',
    badge: 'Bus',
    lucideIcon: <Workflow className="w-4 h-4 text-amber-400" />
  },
  {
    id: 'storage-s3',
    name: 'Blob Storage',
    category: 'cloud',
    icon: 'storage',
    shape: 'cylinder',
    color: '#14b8a6',
    subtitle: 'S3 / Object Storage',
    lucideIcon: <HardDrive className="w-4 h-4 text-teal-400" />
  },
  {
    id: 'docker-pod',
    name: 'K8s / Container',
    category: 'cloud',
    icon: 'docker',
    shape: 'card',
    color: '#06b6d4',
    subtitle: 'Docker Container Pod',
    badge: 'Pod',
    lucideIcon: <Boxes className="w-4 h-4 text-cyan-400" />
  },
  {
    id: 'client-user',
    name: 'User / Client',
    category: 'cloud',
    icon: 'user',
    shape: 'capsule',
    color: '#38bdf8',
    subtitle: 'Browser / Mobile App',
    lucideIcon: <Users className="w-4 h-4 text-sky-400" />
  },

  {
    id: 'flow-start',
    name: 'Start / Terminal',
    category: 'flowchart',
    icon: 'server',
    shape: 'capsule',
    color: '#10b981',
    subtitle: 'Flow Endpoint',
    lucideIcon: <PlayCircle className="w-4 h-4 text-emerald-400" />
  },
  {
    id: 'flow-process',
    name: 'Process Step',
    category: 'flowchart',
    icon: 'process',
    shape: 'rectangle',
    color: '#6366f1',
    subtitle: 'Execute Task',
    lucideIcon: <Cpu className="w-4 h-4 text-indigo-400" />
  },
  {
    id: 'flow-decision',
    name: 'Decision Gate',
    category: 'flowchart',
    icon: 'decision',
    shape: 'diamond',
    color: '#f59e0b',
    subtitle: 'Conditional Branch',
    lucideIcon: <HelpCircle className="w-4 h-4 text-amber-400" />
  },
  {
    id: 'flow-doc',
    name: 'Document',
    category: 'flowchart',
    icon: 'document',
    shape: 'card',
    color: '#f43f5e',
    subtitle: 'File / Report',
    lucideIcon: <FileText className="w-4 h-4 text-rose-400" />
  },
  {
    id: 'flow-commit',
    name: 'Git Commit',
    category: 'flowchart',
    icon: 'code',
    shape: 'card',
    color: '#8b5cf6',
    subtitle: 'Version Control',
    badge: 'Git',
    lucideIcon: <GitCommit className="w-4 h-4 text-violet-400" />
  }
];

interface ShapePaletteProps {
  onAddNode: (item: DiagramNodeData) => void;
}

export const ShapePalette: React.FC<ShapePaletteProps> = ({ onAddNode }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'cloud' | 'flowchart'>('all');

  const filteredItems = PALETTE_ITEMS.filter((item) => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
    const nodeData: DiagramNodeData = {
      title: item.name,
      subtitle: item.subtitle,
      icon: item.icon,
      color: item.color,
      shape: item.shape,
      badge: item.badge
    };
    e.dataTransfer.setData('application/json', JSON.stringify(nodeData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="w-64 h-full bg-zinc-900/90 border-r border-zinc-800/80 flex flex-col backdrop-blur-xl select-none z-10">
      {}
      <div className="p-3.5 border-b border-zinc-800/80">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Shape Library
          </span>
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            Drag & Drop
          </span>
        </div>

        {}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search shapes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {}
        <div className="flex items-center gap-1 mt-2.5">
          {(['all', 'cloud', 'flowchart'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {tab === 'all' ? 'All Shapes' : tab}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onClick={() =>
              onAddNode({
                title: item.name,
                subtitle: item.subtitle,
                icon: item.icon,
                color: item.color,
                shape: item.shape,
                badge: item.badge
              })
            }
            className="group relative flex items-center justify-between p-2.5 bg-zinc-950/40 hover:bg-zinc-800/70 border border-zinc-800/60 hover:border-zinc-700/90 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] hover:shadow-lg shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: `${item.color}20`,
                  borderColor: `${item.color}40`
                }}
                className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0"
              >
                {item.lucideIcon}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {item.name}
                </span>
                <span className="text-[10.5px] text-zinc-500">{item.subtitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                className="p-1 rounded-md bg-zinc-700/60 hover:bg-indigo-600 text-zinc-300 hover:text-white transition-colors"
                title="Add to canvas"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-xs text-zinc-500">
            No shapes matching &quot;{search}&quot;
          </div>
        )}
      </div>

      {}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/30 text-[11px] text-zinc-500 text-center">
        Tip: Drag onto canvas or double click anywhere to add a node.
      </div>
    </aside>
  );
};