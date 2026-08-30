'use client';

import React, { useEffect, useRef } from 'react';
import {
  GraphComponent,
  GraphEditorInputMode,
  type IModelItem,
  type ItemClickedEventArgs,
  Point,
  type PopulateItemContextMenuEventArgs,
  Rect
} from '@yfiles/yfiles';
import { registerYFilesLicense } from '../utils/yfiles-license';
import { configureDiagramStyles, type DiagramNodeData } from '../utils/yfiles-styles';
import { type ContextMenuState } from './ContextMenu';

interface GraphCanvasProps {
  onGraphComponentReady: (gc: GraphComponent) => void;
  onSelectItem: (item: IModelItem | null) => void;
  onContextMenu: (state: ContextMenuState) => void;
  isGridVisible: boolean;
  isSnappingEnabled: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  onGraphComponentReady,
  onSelectItem,
  onContextMenu,
  isGridVisible
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphComponentRef = useRef<GraphComponent | null>(null);

  const onGraphComponentReadyRef = useRef(onGraphComponentReady);
  const onSelectItemRef = useRef(onSelectItem);
  const onContextMenuRef = useRef(onContextMenu);

  useEffect(() => {
    onGraphComponentReadyRef.current = onGraphComponentReady;
    onSelectItemRef.current = onSelectItem;
    onContextMenuRef.current = onContextMenu;
  });

  useEffect(() => {
    if (!containerRef.current) return;

    registerYFilesLicense();

    const gc = new GraphComponent();
    gc.htmlElement.style.width = '100%';
    gc.htmlElement.style.height = '100%';
    gc.htmlElement.style.backgroundColor = 'transparent';
    gc.htmlElement.style.outline = 'none';

    configureDiagramStyles(gc.graph);

    const inputMode = new GraphEditorInputMode({
      allowCreateNode: true,
      allowCreateEdge: true,
      allowEditLabel: true
    });

    inputMode.nodeCreator = (context, graph, location) => {
      return graph.createNode({
        layout: new Rect(location.x - 90, location.y - 29, 180, 58),
        tag: {
          title: 'New Service',
          subtitle: 'Microservice',
          color: '#6366f1',
          icon: 'server',
          shape: 'card'
        }
      });
    };

    const syncSelection = () => {
      const selectedNodes = gc.selection.nodes.toArray();
      const selectedEdges = gc.selection.edges.toArray();
      if (selectedNodes.length > 0) {
        onSelectItemRef.current(selectedNodes[0]);
      } else if (selectedEdges.length > 0) {
        onSelectItemRef.current(selectedEdges[0]);
      } else {
        onSelectItemRef.current(null);
      }
    };

    gc.selection.addEventListener('item-added', syncSelection);
    gc.selection.addEventListener('item-removed', syncSelection);

    const handleContextMenu = (evt: PopulateItemContextMenuEventArgs<IModelItem>) => {
      evt.showMenu = true;
      const item = evt.item || null;
      const viewCoord = gc.worldToViewCoordinates(evt.queryLocation);
      const containerRect = containerRef.current?.getBoundingClientRect();

      onContextMenuRef.current({
        visible: true,
        x: (containerRect?.left || 0) + viewCoord.x,
        y: (containerRect?.top || 0) + viewCoord.y,
        worldX: evt.queryLocation.x,
        worldY: evt.queryLocation.y,
        item
      });
    };

    inputMode.addEventListener('populate-item-context-menu', handleContextMenu);

    inputMode.addEventListener('item-double-clicked', (evt: ItemClickedEventArgs<IModelItem>) => {
      if (evt.item) {
        onSelectItemRef.current(evt.item);
      }
    });

    gc.inputMode = inputMode;

    containerRef.current.appendChild(gc.htmlElement);
    graphComponentRef.current = gc;
    onGraphComponentReadyRef.current(gc);

    return () => {
      if (graphComponentRef.current) {
        graphComponentRef.current.cleanUp();
        if (gc.htmlElement.parentNode) {
          gc.htmlElement.parentNode.removeChild(gc.htmlElement);
        }
        graphComponentRef.current = null;
      }
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const gc = graphComponentRef.current;
    if (!gc || !containerRef.current) return;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;

      const tagData: DiagramNodeData = JSON.parse(dataStr);
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldLocation = gc.viewToWorldCoordinates(new Point(mouseX, mouseY));

      const width = tagData.shape === 'diamond' ? 120 : 180;
      const height = tagData.shape === 'diamond' ? 100 : 58;

      const node = gc.graph.createNode({
        layout: new Rect(
          worldLocation.x - width / 2,
          worldLocation.y - height / 2,
          width,
          height
        ),
        tag: tagData
      });

      gc.selection.clear();
      gc.selection.add(node);
      onSelectItem(node);
    } catch (err) {
      console.error('Failed to handle shape drop:', err);
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`w-full h-full relative overflow-hidden transition-colors ${
        isGridVisible
          ? 'bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:24px_24px] bg-zinc-950'
          : 'bg-zinc-950'
      }`}
    />
  );
};