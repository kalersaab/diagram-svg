
import type { GraphComponent } from '@yfiles/yfiles';
import type { DiagramNodeData, DiagramEdgeData, NodeShape } from './yfiles-styles';

function escapeXml(s: string): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toArgbHex(hex: string, alpha: number): string {
  const clean = hex.replace('#', '').padEnd(6, '0').slice(0, 6);
  const clamped = Math.min(Math.max(alpha, 0), 1);
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `#${a}${clean.toUpperCase()}`;
}

const SHAPE_STYLE: Record<NodeShape, string> = {
  card:      'rounded=1;arcSize=7;',
  rounded:   'rounded=1;arcSize=7;',
  rectangle: 'rounded=0;',
  diamond:   'rhombus;',
  cylinder:  'shape=mxgraph.flowchart.database;',
  capsule:   'rounded=1;arcSize=50;',
  hexagon:   'shape=hexagon;perimeter=hexagonPerimeter2;fixedSize=1;',
  cloud:     'shape=cloud;',
  note:      'shape=note;',
};

function buildNodeStyle(tag: DiagramNodeData): string {
  const shape  = tag.shape ?? 'card';
  const color  = tag.color ?? '#6366f1';
  const fill   = toArgbHex(color, 0.18);
  const stroke = color.toUpperCase();

  const shapeStr = SHAPE_STYLE[shape] ?? SHAPE_STYLE.card;

  return [
    shapeStr,
    `fillColor=${fill};`,
    `strokeColor=${stroke};`,
    'strokeWidth=1.5;',
    'fontColor=#F4F4F5;',
    'fontStyle=1;',
    'fontSize=11;',
    'align=center;',
    'verticalAlign=middle;',
    'whiteSpace=wrap;',
    'overflow=hidden;',
    'html=1;',
  ].join('');
}

function buildEdgeStyle(tag: DiagramEdgeData | null | undefined): string {
  const color  = tag?.color ?? '#6366f1';
  const dashed = tag?.dashed ? 'dashed=1;dashPattern=8 4;' : '';
  const width  = tag?.strokeWidth ?? 2;

  return [
    'edgeStyle=orthogonalEdgeStyle;',
    'rounded=1;',
    'orthogonalLoop=1;',
    'jettySize=auto;',
    'exitX=0.5;exitY=1;exitDx=0;exitDy=0;',
    'entryX=0.5;entryY=0;entryDx=0;entryDy=0;',
    `strokeColor=${color.toUpperCase()};`,
    `strokeWidth=${width};`,
    dashed,
    'endArrow=block;endFill=1;',
    'fontColor=#A1A1AA;',
    'fontSize=10;',
    'html=1;',
  ].join('');
}

function buildNodeLabel(tag: DiagramNodeData): string {
  const title    = escapeXml(tag.title ?? 'Node');
  const subtitle = tag.subtitle
    ? `&lt;br/&gt;&lt;font style=&quot;font-size:9px;font-weight:normal;opacity:0.7;&quot;&gt;${escapeXml(tag.subtitle)}&lt;/font&gt;`
    : '';
  const badge = tag.badge
    ? `&lt;br/&gt;&lt;font style=&quot;font-size:8px;font-weight:normal;&quot;&gt;[${escapeXml(tag.badge)}]&lt;/font&gt;`
    : '';

  return `&lt;b&gt;${title}&lt;/b&gt;${subtitle}${badge}`;
}

export interface ConvertOptions {
  
  title?: string;
  
  diagramId?: string;
}

export function yFilesToDrawioXml(
  gc: GraphComponent,
  options: ConvertOptions = {}
): string {
  const { title = 'Exported Diagram', diagramId = 'yfiles_export_1' } = options;

  const graph = gc.graph;

  let idCounter = 2;
  const nodeIdMap = new Map<object, string>();

  const cellLines: string[] = [];

  for (const node of graph.nodes) {
    const id = String(idCounter++);
    nodeIdMap.set(node, id);

    const { x, y, width, height } = node.layout;
    const tag   = (node.tag as DiagramNodeData) ?? {};
    const label = buildNodeLabel(tag);  
    const style = buildNodeStyle(tag);

    cellLines.push(
      `        <mxCell id="${id}" value="${label}" style="${style}" vertex="1" parent="1">` +
      `<mxGeometry x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(width)}" height="${Math.round(height)}" as="geometry"/></mxCell>`
    );
  }

  for (const edge of graph.edges) {
    const id       = String(idCounter++);
    const sourceId = nodeIdMap.get(edge.sourceNode!);
    const targetId = nodeIdMap.get(edge.targetNode!);

    if (!sourceId || !targetId) continue; 

    const tag   = edge.tag as DiagramEdgeData | null | undefined;
    const label = escapeXml(
      tag?.label ??
      (edge.labels.size > 0 ? edge.labels.first()!.text : '')
    );
    const style = buildEdgeStyle(tag);

    let bendXml = '';
    if (edge.bends.size > 0) {
      const points = edge.bends
        .toArray()
        .map((b) => `<mxPoint x="${Math.round(b.location.x)}" y="${Math.round(b.location.y)}" as="point"/>`)
        .join('');
      bendXml = `<mxGeometry relative="1" as="geometry"><Array as="points">${points}</Array></mxGeometry>`;
    } else {
      bendXml = `<mxGeometry relative="1" as="geometry"/>`;
    }

    cellLines.push(
      `        <mxCell id="${id}" value="${label}" style="${style}" edge="1" source="${sourceId}" target="${targetId}" parent="1">${bendXml}</mxCell>`
    );
  }

  return `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" type="yfiles-export">
  <diagram id="${diagramId}" name="${escapeXml(title)}">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
${cellLines.join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}