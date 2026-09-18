/**
 * xml-metamodel-parser.ts
 *
 * Parse a draw.io XML (mxfile / mxGraphModel) and infer a Metamodel from it:
 *  - Unique vertex `style` values → ObjectTypeDefinitions
 *  - Unique edge `style` values    → RelationshipTypeDefinitions
 *
 * Also handles generic XML where tag names become object types.
 */

import type { Metamodel, ObjectTypeDefinition, RelationshipTypeDefinition } from './metamodel';
import { TYPE_COLOR_PALETTE } from './metamodel';
import type { NodeShape } from './yfiles-styles';

let colorIndex = 0;
const nextColor = () => TYPE_COLOR_PALETTE[colorIndex++ % TYPE_COLOR_PALETTE.length];

function slugify(name: string): string {
  return 'ot-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function rtSlugify(name: string): string {
  return 'rt-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function styleToShape(style: string): NodeShape {
  if (/ellipse|circle/i.test(style)) return 'capsule';
  if (/diamond|rhombus/i.test(style)) return 'diamond';
  if (/cylinder|storage|db/i.test(style)) return 'cylinder';
  if (/rounded=1/i.test(style)) return 'rounded';
  return 'rectangle';
}

function extractLabelFromStyle(style: string): string {
  const match = style.match(/shape=([^;]+)/i);
  if (match) return match[1].replace(/mxgraph\.\w+\./i, '').replace(/\./g, ' ');
  if (/ellipse/i.test(style)) return 'Ellipse';
  if (/diamond/i.test(style)) return 'Decision';
  if (/cylinder/i.test(style)) return 'Database';
  return 'Object';
}

function extractColorFromStyle(style: string): string {
  const fill = style.match(/fillColor=#([0-9a-fA-F]{3,6})/i);
  if (fill) return `#${fill[1]}`;
  const stroke = style.match(/strokeColor=#([0-9a-fA-F]{3,6})/i);
  if (stroke) return `#${stroke[1]}`;
  return nextColor();
}

/** Parse draw.io mxfile/mxGraphModel XML */
function parseDrawioXml(doc: Document): Metamodel {
  const cells = Array.from(doc.querySelectorAll('mxCell'));

  const vertexStyles = new Map<string, { count: number; color: string; style: string }>();
  const edgeStyles = new Map<string, { count: number; color: string; style: string }>();

  for (const cell of cells) {
    const isVertex = cell.getAttribute('vertex') === '1';
    const isEdge = cell.getAttribute('edge') === '1';
    const style = (cell.getAttribute('style') ?? '').trim();
    if (!style) continue;

    if (isVertex) {
      const existing = vertexStyles.get(style);
      if (existing) {
        existing.count++;
      } else {
        vertexStyles.set(style, { count: 1, color: extractColorFromStyle(style), style });
      }
    } else if (isEdge) {
      const existing = edgeStyles.get(style);
      if (existing) {
        existing.count++;
      } else {
        edgeStyles.set(style, { count: 1, color: extractColorFromStyle(style), style });
      }
    }
  }

  const objectTypes: ObjectTypeDefinition[] = Array.from(vertexStyles.entries()).map(
    ([style, info], i) => {
      const name = extractLabelFromStyle(style) + (i > 0 ? ` ${i + 1}` : '');
      return {
        id: slugify(name),
        name,
        icon: 'process',
        color: info.color,
        shape: styleToShape(style),
        allowedAttributes: [],
        group: 'Imported',
      };
    },
  );

  const relationshipTypes: RelationshipTypeDefinition[] = Array.from(edgeStyles.entries()).map(
    ([style, info], i) => {
      const name = `Relationship${i > 0 ? ` ${i + 1}` : ''}`;
      const isDashed = /dashed=1/i.test(style);
      const strokeWidth = (() => {
        const m = style.match(/strokeWidth=(\d+)/i);
        return m ? parseInt(m[1], 10) : 1;
      })();
      return {
        id: rtSlugify(name),
        name,
        color: info.color,
        dashed: isDashed,
        strokeWidth,
        allowedSourceTypes: [],
        allowedTargetTypes: [],
      };
    },
  );

  return { objectTypes, relationshipTypes };
}

/** Parse generic XML — uses tag names as object types, attributes as attribute definitions */
function parseGenericXml(doc: Document): Metamodel {
  const root = doc.documentElement;
  const tagCounts = new Map<string, Set<string>>();

  function walk(el: Element) {
    const tag = el.tagName.toLowerCase();
    if (!tagCounts.has(tag)) tagCounts.set(tag, new Set());
    for (const attr of Array.from(el.attributes)) {
      tagCounts.get(tag)!.add(attr.name);
    }
    for (const child of Array.from(el.children)) walk(child);
  }
  walk(root);

  const objectTypes: ObjectTypeDefinition[] = Array.from(tagCounts.entries()).map(
    ([tag, attrs]) => ({
      id: slugify(tag),
      name: tag.charAt(0).toUpperCase() + tag.slice(1),
      icon: 'code',
      color: nextColor(),
      shape: 'card' as NodeShape,
      group: 'Imported',
      allowedAttributes: Array.from(attrs).map(a => ({
        key: a,
        label: a.charAt(0).toUpperCase() + a.slice(1),
        type: 'string' as const,
      })),
    }),
  );

  return { objectTypes, relationshipTypes: [] };
}

export interface ParseResult {
  metamodel: Metamodel;
  mode: 'drawio' | 'generic';
  rawXml: string;
  errors: string[];
}

export function parseXmlToMetamodel(xmlText: string): ParseResult {
  colorIndex = 0;
  const errors: string[] = [];

  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(xmlText, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      errors.push('XML parse error: ' + parseError.textContent?.slice(0, 200));
      return { metamodel: { objectTypes: [], relationshipTypes: [] }, mode: 'generic', rawXml: xmlText, errors };
    }
  } catch (e) {
    errors.push('Failed to parse XML: ' + String(e));
    return { metamodel: { objectTypes: [], relationshipTypes: [] }, mode: 'generic', rawXml: xmlText, errors };
  }

  const root = doc.documentElement.tagName.toLowerCase();
  const isDrawio = root === 'mxfile' || root === 'mxgraphmodel' || !!doc.querySelector('mxCell');

  const metamodel = isDrawio ? parseDrawioXml(doc) : parseGenericXml(doc);

  return { metamodel, mode: isDrawio ? 'drawio' : 'generic', rawXml: xmlText, errors };
}
