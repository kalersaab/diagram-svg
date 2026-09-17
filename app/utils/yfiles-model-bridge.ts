import {
  GraphComponent,
  type INode,
  Point,
  Rect,
} from '@yfiles/yfiles';
import type {
  CreateYFilesModelPayload,
  YFilesEdgeData,
  YFilesGraphPayload,
  YFilesModelCategory,
  YFilesNodeData,
  YFilesViewModel,
} from '../services/yfiles';
import { exportGraphToSvgElement, svgElementToString } from './yfiles-export';
import { yFilesToDrawioXml } from './yfiles-to-drawio';

function safeCloneTag(tag: unknown): Record<string, unknown> | undefined {
  if (!tag || typeof tag !== 'object') return undefined;
  try {
    return JSON.parse(JSON.stringify(tag));
  } catch {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(tag as Record<string, unknown>)) {
      if (
        typeof v === 'string' ||
        typeof v === 'number' ||
        typeof v === 'boolean' ||
        Array.isArray(v) ||
        (v && typeof v === 'object' && !(v instanceof Element) && !(v instanceof Node))
      ) {
        try {
          res[k] = JSON.parse(JSON.stringify(v));
        } catch {
          // ignore non-serializable property
        }
      }
    }
    return res;
  }
}

export async function serializeGraphToYFilesModel(
  graphComponent: GraphComponent,
  metadata: {
    title: string;
    description?: string;
    category?: YFilesModelCategory;
    metamodelId?: string;
    layoutType?: string;
    includeSvg?: boolean;
    includeDrawioXml?: boolean;
  },
): Promise<CreateYFilesModelPayload> {
  const graph = graphComponent.graph;

  const nodeMap = new Map<INode, string>();
  const nodes: YFilesNodeData[] = [];

  let idx = 0;
  for (const node of graph.nodes) {
    const nodeId = (node.tag as Record<string, unknown>)?.id as string || `node-${idx++}`;
    nodeMap.set(node, nodeId);

    nodes.push({
      id: nodeId,
      layout: {
        x: node.layout.x,
        y: node.layout.y,
        width: node.layout.width,
        height: node.layout.height,
      },
      tag: safeCloneTag(node.tag),
    });
  }

  const edges: YFilesEdgeData[] = [];
  for (const edge of graph.edges) {
    const sourceId = nodeMap.get(edge.sourceNode);
    const targetId = nodeMap.get(edge.targetNode);

    if (sourceId && targetId) {
      edges.push({
        source: sourceId,
        target: targetId,
        tag: safeCloneTag(edge.tag),
        bends: edge.bends.map((b) => ({ x: b.location.x, y: b.location.y })).toArray(),
      });
    }
  }

  const graphData: YFilesGraphPayload = {
    nodes,
    edges,
    viewport: {
      zoom: graphComponent.zoom,
      centerX: graphComponent.viewport.center.x,
      centerY: graphComponent.viewport.center.y,
    },
  };

  let svg: string | undefined;
  if (metadata.includeSvg !== false && graph.nodes.size > 0) {
    try {
      const svgElement = await exportGraphToSvgElement(graphComponent, { scale: 1 });
      svg = svgElementToString(svgElement);
    } catch (e) {
      console.warn('Could not generate SVG preview for yFiles model save:', e);
    }
  }

  let drawioXml: string | undefined;
  if (metadata.includeDrawioXml !== false && graph.nodes.size > 0) {
    try {
      drawioXml = yFilesToDrawioXml(graphComponent, { title: metadata.title });
    } catch (e) {
      console.warn('Could not generate Draw.io XML for yFiles model save:', e);
    }
  }

  const views: YFilesViewModel[] = [
    {
      name: 'Default View',
      layoutType: metadata.layoutType || 'hierarchical-tb',
      zoom: graphComponent.zoom,
      centerX: graphComponent.viewport.center.x,
      centerY: graphComponent.viewport.center.y,
      svg,
    },
  ];

  return {
    title: metadata.title,
    description: metadata.description,
    category: metadata.category ?? 'custom',
    metamodelId: metadata.metamodelId,
    layoutType: metadata.layoutType || 'hierarchical-tb',
    graphData,
    drawioXml,
    views,
    svg,
  };
}

export function loadYFilesModelIntoGraph(
  graphComponent: GraphComponent,
  graphData: YFilesGraphPayload | undefined | null,
): void {
  const graph = graphComponent.graph;
  graph.clear();

  if (!graphData?.nodes?.length) {
    graphComponent.fitGraphBounds();
    return;
  }

  const nodeMap = new Map<string, INode>();

  for (const nodeData of graphData.nodes) {
    const layout = new Rect(
      nodeData.layout.x,
      nodeData.layout.y,
      nodeData.layout.width,
      nodeData.layout.height,
    );

    const node = graph.createNode({
      layout,
      tag: nodeData.tag,
    });

    nodeMap.set(nodeData.id, node);
  }

  for (const edgeData of graphData.edges) {
    const source = nodeMap.get(edgeData.source);
    const target = nodeMap.get(edgeData.target);

    if (source && target) {
      const edge = graph.createEdge({
        source,
        target,
        tag: edgeData.tag || {},
      });

      const labelText = (edgeData.tag as { label?: string })?.label;
      if (labelText) {
        graph.addLabel(edge, labelText);
      }

      if (edgeData.bends && edgeData.bends.length > 0) {
        for (const b of edgeData.bends) {
          graph.addBend(edge, new Point(b.x, b.y));
        }
      }
    }
  }

  try {
    if (graphData.viewport?.centerX !== undefined && graphData.viewport.centerY !== undefined) {
      graphComponent.zoomTo(
        graphData.viewport.zoom ?? 1,
        new Point(graphData.viewport.centerX, graphData.viewport.centerY),
      );
    } else {
      graphComponent.fitGraphBounds();
    }
  } catch {
    graphComponent.fitGraphBounds();
  }
}
