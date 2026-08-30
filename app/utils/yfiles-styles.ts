import {
  Arrow,
  EdgePathLabelModel,
  GraphComponent,
  type IGraph,
  type INode,
  type IRenderContext,
  NodeStyleBase,
  PolylineEdgeStyle,
  Size,
  SvgVisual,
  TaggedSvgVisual
} from '@yfiles/yfiles';

export type NodeShape =
  | 'card'
  | 'rectangle'
  | 'rounded'
  | 'diamond'
  | 'cylinder'
  | 'capsule'
  | 'cloud'
  | 'hexagon'
  | 'note';

export interface DiagramNodeData {
  title: string;
  subtitle?: string;
  category?: string;
  icon?: string;
  color?: string;
  badge?: string;
  shape?: NodeShape;
  status?: 'online' | 'warning' | 'idle' | 'error';
}

export interface DiagramEdgeData {
  label?: string;
  color?: string;
  dashed?: boolean;
  strokeWidth?: number;
  animated?: boolean;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// Built-in crisp SVG Icon paths
const SVG_ICONS: Record<string, string> = {
  server:
    'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm0 10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2zm3-9h.01M7 17h.01M17 7h.01M17 17h.01',
  database:
    'M4 7c0-2.2 3.6-4 8-4s8 1.8 8 4v10c0 2.2-3.6 4-8 4s-8-1.8-8-4V7zm0 5c0 2.2 3.6 4 8 4s8-1.8 8-4m-16-5c0 2.2 3.6 4 8 4s8-1.8 8-4',
  cloud:
    'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z',
  gateway:
    'M5 12h14M12 5l7 7-7 7M19 12H5M12 19l-7-7 7-7',
  queue:
    'M4 6h16M4 12h16M4 18h16M7 4v4M17 10v4M10 16v4',
  shield:
    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  user:
    'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  process:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4 1.4l1.4-1.4-2.1-3.6 1.4-2.4-2.5-1.4-.7-2.6-2.8.2-1.8-2-2.8 1.4-2.8-1.4-1.8 2-2.8-.2-.7 2.6-2.5 1.4 1.4 2.4-2.1 3.6 1.4 1.4',
  code:
    'M16 18l6-6-6-6M8 6l-6 6 6 6',
  docker:
    'M4 14h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2zm2-4h3v3H6zm4 0h3v3h-3zm4 0h3v3h-3zm-4-4h3v3h-3z',
  k8s:
    'M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2zm0 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  storage:
    'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 8h12M10 16h.01M14 16h.01',
  analytics:
    'M18 20V10M12 20V4M6 20v-6',
  decision:
    'M12 2L2 12l10 10 10-10L12 2z',
  document:
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6'
};

interface CacheData {
  width: number;
  height: number;
  x: number;
  y: number;
  selected: boolean;
  tag: DiagramNodeData;
}

/**
 * Premium Modern SVG Node Style
 */
export class DiagramNodeStyle extends NodeStyleBase<TaggedSvgVisual<SVGGElement, CacheData>> {
  createVisual(context: IRenderContext, node: INode): TaggedSvgVisual<SVGGElement, CacheData> {
    const g = document.createElementNS(SVG_NS, 'g');
    const isSelected =
      context.canvasComponent instanceof GraphComponent &&
      context.canvasComponent.selection.includes(node);

    const tag: DiagramNodeData = (node.tag as DiagramNodeData) || {
      title: 'Node',
      shape: 'card',
      color: '#6366f1'
    };

    const cache: CacheData = {
      width: node.layout.width,
      height: node.layout.height,
      x: node.layout.x,
      y: node.layout.y,
      selected: isSelected,
      tag: { ...tag }
    };

    this.renderNodeContent(g, node, cache);
    SvgVisual.setTranslate(g, node.layout.x, node.layout.y);
    return SvgVisual.from(g, cache);
  }

  updateVisual(
    context: IRenderContext,
    oldVisual: TaggedSvgVisual<SVGGElement, CacheData>,
    node: INode
  ): TaggedSvgVisual<SVGGElement, CacheData> {
    const isSelected =
      context.canvasComponent instanceof GraphComponent &&
      context.canvasComponent.selection.includes(node);

    const tag: DiagramNodeData = (node.tag as DiagramNodeData) || {
      title: 'Node',
      shape: 'card',
      color: '#6366f1'
    };

    const cache = oldVisual.tag;
    const sizeChanged =
      cache.width !== node.layout.width || cache.height !== node.layout.height;
    const stateChanged =
      cache.selected !== isSelected || JSON.stringify(cache.tag) !== JSON.stringify(tag);

    if (sizeChanged || stateChanged) {
      // Clear and re-render
      while (oldVisual.svgElement.firstChild) {
        oldVisual.svgElement.removeChild(oldVisual.svgElement.firstChild);
      }
      cache.width = node.layout.width;
      cache.height = node.layout.height;
      cache.selected = isSelected;
      cache.tag = { ...tag };
      this.renderNodeContent(oldVisual.svgElement, node, cache);
    }

    if (cache.x !== node.layout.x || cache.y !== node.layout.y) {
      cache.x = node.layout.x;
      cache.y = node.layout.y;
      SvgVisual.setTranslate(oldVisual.svgElement, node.layout.x, node.layout.y);
    }

    return oldVisual;
  }

  private renderNodeContent(g: SVGGElement, node: INode, cache: CacheData) {
    const { width, height, selected, tag } = cache;
    const color = tag.color || '#6366f1';
    const shape = tag.shape || 'card';

    // Unique gradient IDs
    const idSuffix = Math.random().toString(36).substring(2, 8);
    const gradId = `grad_${idSuffix}`;

    // Defs for gradients & drop shadows
    const defs = document.createElementNS(SVG_NS, 'defs');
    
    // Linear Gradient
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '100%');

    const stop1 = document.createElementNS(SVG_NS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', color);
    stop1.setAttribute('stop-opacity', '0.22');

    const stop2 = document.createElementNS(SVG_NS, 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#18181b');
    stop2.setAttribute('stop-opacity', '0.92');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    g.appendChild(defs);

    // Selection Halo Glow
    if (selected) {
      const halo = document.createElementNS(SVG_NS, 'rect');
      halo.setAttribute('x', '-5');
      halo.setAttribute('y', '-5');
      halo.setAttribute('width', `${width + 10}`);
      halo.setAttribute('height', `${height + 10}`);
      halo.setAttribute('rx', shape === 'diamond' ? '0' : '16');
      halo.setAttribute('fill', 'none');
      halo.setAttribute('stroke', color);
      halo.setAttribute('stroke-width', '2.5');
      halo.setAttribute('stroke-opacity', '0.8');
      halo.setAttribute('stroke-dasharray', '5 3');
      g.appendChild(halo);
    }

    // Main Shape Geometry
    const shapeElement = this.createShapeElement(shape, width, height, gradId, color);
    g.appendChild(shapeElement);

    // Left accent bar for card shape
    if (shape === 'card' || shape === 'rounded') {
      const accent = document.createElementNS(SVG_NS, 'rect');
      accent.setAttribute('x', '0');
      accent.setAttribute('y', '8');
      accent.setAttribute('width', '4');
      accent.setAttribute('height', `${Math.max(8, height - 16)}`);
      accent.setAttribute('rx', '2');
      accent.setAttribute('fill', color);
      g.appendChild(accent);
    }

    // Icon Container
    const iconName = tag.icon || 'server';
    const iconPathD = SVG_ICONS[iconName] || SVG_ICONS.server;

    const iconBg = document.createElementNS(SVG_NS, 'rect');
    iconBg.setAttribute('x', '12');
    iconBg.setAttribute('y', `${(height - 28) / 2}`);
    iconBg.setAttribute('width', '28');
    iconBg.setAttribute('height', '28');
    iconBg.setAttribute('rx', '7');
    iconBg.setAttribute('fill', color);
    iconBg.setAttribute('fill-opacity', '0.2');
    iconBg.setAttribute('stroke', color);
    iconBg.setAttribute('stroke-width', '1');
    iconBg.setAttribute('stroke-opacity', '0.4');
    g.appendChild(iconBg);

    const iconGroup = document.createElementNS(SVG_NS, 'g');
    iconGroup.setAttribute(
      'transform',
      `translate(16, ${(height - 28) / 2 + 4}) scale(0.833)`
    );

    const iconPath = document.createElementNS(SVG_NS, 'path');
    iconPath.setAttribute('d', iconPathD);
    iconPath.setAttribute('fill', 'none');
    iconPath.setAttribute('stroke', color);
    iconPath.setAttribute('stroke-width', '2');
    iconPath.setAttribute('stroke-linecap', 'round');
    iconPath.setAttribute('stroke-linejoin', 'round');
    iconGroup.appendChild(iconPath);
    g.appendChild(iconGroup);

    // Text Container (Title + Subtitle)
    const textGroup = document.createElementNS(SVG_NS, 'g');
    const textX = 48;

    // Title
    const titleText = document.createElementNS(SVG_NS, 'text');
    titleText.setAttribute('x', `${textX}`);
    titleText.setAttribute(
      'y',
      tag.subtitle ? `${height / 2 - 3}` : `${height / 2 + 5}`
    );
    titleText.setAttribute('fill', '#f4f4f5');
    titleText.setAttribute('font-size', '13');
    titleText.setAttribute('font-weight', '600');
    titleText.setAttribute('font-family', 'Inter, system-ui, -apple-system, sans-serif');
    titleText.textContent = this.truncateText(tag.title, width - textX - (tag.badge ? 55 : 15));
    textGroup.appendChild(titleText);

    // Subtitle
    if (tag.subtitle) {
      const subText = document.createElementNS(SVG_NS, 'text');
      subText.setAttribute('x', `${textX}`);
      subText.setAttribute('y', `${height / 2 + 13}`);
      subText.setAttribute('fill', '#a1a1aa');
      subText.setAttribute('font-size', '10.5');
      subText.setAttribute('font-family', 'Inter, system-ui, -apple-system, sans-serif');
      subText.textContent = this.truncateText(tag.subtitle, width - textX - 15);
      textGroup.appendChild(subText);
    }
    g.appendChild(textGroup);

    // Status Indicator Dot or Badge
    if (tag.badge) {
      const badgeG = document.createElementNS(SVG_NS, 'g');
      const badgeWidth = Math.min(50, Math.max(34, tag.badge.length * 7 + 10));
      const badgeX = width - badgeWidth - 10;
      const badgeY = 8;

      const badgeRect = document.createElementNS(SVG_NS, 'rect');
      badgeRect.setAttribute('x', `${badgeX}`);
      badgeRect.setAttribute('y', `${badgeY}`);
      badgeRect.setAttribute('width', `${badgeWidth}`);
      badgeRect.setAttribute('height', '18');
      badgeRect.setAttribute('rx', '9');
      badgeRect.setAttribute('fill', color);
      badgeRect.setAttribute('fill-opacity', '0.15');
      badgeRect.setAttribute('stroke', color);
      badgeRect.setAttribute('stroke-width', '1');
      badgeRect.setAttribute('stroke-opacity', '0.35');
      badgeG.appendChild(badgeRect);

      const badgeText = document.createElementNS(SVG_NS, 'text');
      badgeText.setAttribute('x', `${badgeX + badgeWidth / 2}`);
      badgeText.setAttribute('y', `${badgeY + 12.5}`);
      badgeText.setAttribute('text-anchor', 'middle');
      badgeText.setAttribute('fill', color);
      badgeText.setAttribute('font-size', '9.5');
      badgeText.setAttribute('font-weight', '700');
      badgeText.setAttribute('font-family', 'Inter, sans-serif');
      badgeText.textContent = tag.badge;
      badgeG.appendChild(badgeText);

      g.appendChild(badgeG);
    } else if (tag.status) {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', `${width - 14}`);
      dot.setAttribute('cy', '14');
      dot.setAttribute('r', '3.5');
      const dotColor =
        tag.status === 'online'
          ? '#10b981'
          : tag.status === 'warning'
          ? '#f59e0b'
          : tag.status === 'error'
          ? '#ef4444'
          : '#71717a';
      dot.setAttribute('fill', dotColor);
      g.appendChild(dot);
    }
  }

  private createShapeElement(
    shape: NodeShape,
    width: number,
    height: number,
    gradId: string,
    color: string
  ): SVGElement {
    const baseAttrs = {
      fill: `url(#${gradId})`,
      stroke: color,
      'stroke-width': '1.5',
      'stroke-opacity': '0.6'
    };

    if (shape === 'diamond') {
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      polygon.setAttribute(
        'points',
        `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`
      );
      this.applyAttrs(polygon, baseAttrs);
      return polygon;
    }

    if (shape === 'cylinder') {
      const path = document.createElementNS(SVG_NS, 'path');
      const r = 12;
      const d = `M 0,${r} 
                 A ${width / 2},${r} 0 0,1 ${width},${r} 
                 L ${width},${height - r} 
                 A ${width / 2},${r} 0 0,1 0,${height - r} 
                 Z 
                 M 0,${r} 
                 A ${width / 2},${r} 0 0,0 ${width},${r}`;
      path.setAttribute('d', d);
      this.applyAttrs(path, baseAttrs);
      return path;
    }

    if (shape === 'capsule') {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', `${width}`);
      rect.setAttribute('height', `${height}`);
      rect.setAttribute('rx', `${height / 2}`);
      this.applyAttrs(rect, baseAttrs);
      return rect;
    }

    if (shape === 'hexagon') {
      const polygon = document.createElementNS(SVG_NS, 'polygon');
      const offset = width * 0.15;
      polygon.setAttribute(
        'points',
        `${offset},0 ${width - offset},0 ${width},${height / 2} ${width - offset},${height} ${offset},${height} 0,${height / 2}`
      );
      this.applyAttrs(polygon, baseAttrs);
      return polygon;
    }

    // Default card / rounded rectangle
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', `${width}`);
    rect.setAttribute('height', `${height}`);
    rect.setAttribute('rx', shape === 'rectangle' ? '4' : '12');
    this.applyAttrs(rect, baseAttrs);
    return rect;
  }

  private applyAttrs(elem: SVGElement, attrs: Record<string, string>) {
    for (const [key, value] of Object.entries(attrs)) {
      elem.setAttribute(key, value);
    }
  }

  private truncateText(text: string, maxWidth: number): string {
    const avgCharWidth = 7;
    const maxChars = Math.floor(maxWidth / avgCharWidth);
    if (text.length <= maxChars) return text;
    return text.substring(0, Math.max(3, maxChars - 2)) + '…';
  }
}

/**
 * Configure default graph styles on a given IGraph instance
 */
export function configureDiagramStyles(graph: IGraph) {
  // Default node size & style
  graph.nodeDefaults.size = new Size(180, 58);
  graph.nodeDefaults.style = new DiagramNodeStyle();

  // Default edge style (Polyline with smooth fillets and sleek arrows)
  graph.edgeDefaults.style = new PolylineEdgeStyle({
    smoothingLength: 20,
    stroke: '2.5px #6366f1',
    targetArrow: new Arrow({
      fill: '#6366f1',
      type: 'triangle',
      lengthScale: 1.2,
      widthScale: 1.2
    })
  });

  // Edge label positioning
  graph.edgeDefaults.labels.layoutParameter = new EdgePathLabelModel({
    autoRotation: false,
    sideOfEdge: 'on-edge',
    distance: 0
  }).createRatioParameter();
}

/**
 * Create a custom edge style based on edge data
 */
export function createEdgeStyle(data?: DiagramEdgeData): PolylineEdgeStyle {
  const color = data?.color || '#6366f1';
  const strokeWidth = data?.strokeWidth || 2.5;

  return new PolylineEdgeStyle({
    smoothingLength: 20,
    stroke: `${strokeWidth}px ${color}`,
    targetArrow: new Arrow({
      fill: color,
      type: 'triangle',
      lengthScale: 1.2,
      widthScale: 1.2
    })
  });
}
