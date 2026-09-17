/**
 * Metamodel — frontend type definitions.
 *
 * ObjectType and RelationshipType each carry:
 *   - `id`  – a client-side slug used as a local reference key before save
 *   - `_id` – the MongoDB ObjectId string assigned by the backend after first
 *             save; always present on documents loaded from the API
 *
 * RelationshipType.allowedSourceTypes / allowedTargetTypes store *backend _id*
 * strings after save.
 */

import type { NodeShape } from './yfiles-styles';

export type AttributeType = 'string' | 'number' | 'boolean' | 'enum';

export interface AttributeDefinition {
  key: string;
  label: string;
  type: AttributeType;
  enumValues?: string[];
  defaultValue?: string | number | boolean;
  required?: boolean;
  placeholder?: string;
}

export interface ObjectTypeDefinition {
  /** Client-side stable slug, e.g. 'ot-microservice'. Used before first save. */
  id: string;
  /** MongoDB ObjectId string – present after the document has been persisted. */
  _id?: string;
  name: string;
  group?: string;
  description?: string;
  icon: string;
  color: string;
  shape: NodeShape;
  defaultWidth?: number;
  defaultHeight?: number;
  allowedAttributes: AttributeDefinition[];
}

export interface RelationshipTypeDefinition {
  /** Client-side stable slug, e.g. 'rt-calls'. Used before first save. */
  id: string;
  /** MongoDB ObjectId string – present after the document has been persisted. */
  _id?: string;
  name: string;
  description?: string;
  color: string;
  strokeWidth?: number;
  dashed?: boolean;
  /**
   * List of ObjectType identifiers this relationship may originate from.
   * Before save: slug strings (e.g. 'ot-microservice').
   * After save: MongoDB ObjectId strings of the saved ObjectTypes.
   * Empty / absent = any ObjectType is a valid source.
   */
  allowedSourceTypes?: string[];
  /**
   * List of ObjectType identifiers this relationship may target.
   * Before save: slug strings. After save: MongoDB ObjectId strings.
   * Empty / absent = any ObjectType is a valid target.
   */
  allowedTargetTypes?: string[];
}

export interface Metamodel {
  objectTypes: ObjectTypeDefinition[];
  relationshipTypes: RelationshipTypeDefinition[];
}

// ─── Empty metamodel (app loads real data from the backend API) ───────────────

export const EMPTY_METAMODEL: Metamodel = {
  objectTypes: [],
  relationshipTypes: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Look up an ObjectType by either its backend _id or its client-side id slug. */
export function findObjectType(
  metamodel: Metamodel,
  id: string,
): ObjectTypeDefinition | undefined {
  return metamodel.objectTypes.find(t => t._id === id || t.id === id);
}

/** Look up a RelationshipType by either its backend _id or its client-side id slug. */
export function findRelationshipType(
  metamodel: Metamodel,
  id: string,
): RelationshipTypeDefinition | undefined {
  return metamodel.relationshipTypes.find(t => t._id === id || t.id === id);
}

/** Build instance attributes map pre-filled with default values. */
export function buildDefaultAttributes(
  objectType: ObjectTypeDefinition,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const attr of objectType.allowedAttributes) {
    if (attr.defaultValue !== undefined) {
      result[attr.key] = attr.defaultValue;
    }
  }
  return result;
}

/** Return unique group names in insertion order. */
export function getObjectTypeGroups(metamodel: Metamodel): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const ot of metamodel.objectTypes) {
    const g = ot.group ?? 'Other';
    if (!seen.has(g)) { seen.add(g); groups.push(g); }
  }
  return groups;
}

/**
 * Merge backend-persisted ObjectTypes back into the local metamodel so that
 * each entry gains its real `_id`.  Called after a successful save.
 */
export function mergeBackendIds(
  local: Metamodel,
  savedObjectTypes: ObjectTypeDefinition[],
  savedRelationshipTypes: RelationshipTypeDefinition[],
): Metamodel {
  // Build slug → _id map from the saved ObjectTypes
  const idBySlug = new Map<string, string>();
  for (const saved of savedObjectTypes) {
    const match = local.objectTypes.find(
      t => t.name === saved.name && t.group === saved.group,
    );
    if (match && saved._id) idBySlug.set(match.id, saved._id);
  }

  const mergedOTs = local.objectTypes.map(ot => {
    const savedOT = savedObjectTypes.find(
      s => s._id === ot._id || s.name === ot.name,
    );
    return { ...ot, _id: savedOT?._id ?? ot._id };
  });

  const mergedRTs = local.relationshipTypes.map(rt => {
    const savedRT = savedRelationshipTypes.find(
      s => s._id === rt._id || s.name === rt.name,
    );
    return { ...rt, _id: savedRT?._id ?? rt._id };
  });

  return { objectTypes: mergedOTs, relationshipTypes: mergedRTs };
}

/** Colour palette for user-created types. */
export const TYPE_COLOR_PALETTE = [
  '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#eab308',
  '#f97316', '#ef4444', '#a855f7', '#14b8a6', '#f43f5e',
  '#38bdf8', '#64748b', '#8b5cf6', '#ec4899', '#84cc16',
];
