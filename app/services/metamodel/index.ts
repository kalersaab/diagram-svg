/**
 * MetamodelService
 *
 * Wraps every metamodel API endpoint from diagram-backend.
 *
 * Architecture:
 *  - ObjectTypes   → /metamodels/:id/object-types       (own collection)
 *  - RelationshipTypes → /metamodels/:id/relationship-types (own collection)
 *  - Metamodel     → /metamodels                        (stores only ObjectId refs)
 *
 * Two-phase sync:
 *   1. Create/update ObjectTypes first → get real _ids back
 *   2. Resolve slug refs in RelationshipTypes to real ObjectType _ids
 *   3. Create/update RelationshipTypes
 */

import { callApi } from '@/app/utils/apiutils';
import { metamodel as endpoints } from '@/app/utils/endpoints/metamodel';
import type {
  Metamodel,
  ObjectTypeDefinition,
  RelationshipTypeDefinition,
} from '@/app/utils/metamodel';
import { mergeBackendIds } from '@/app/utils/metamodel';

// ─── Backend document shapes ──────────────────────────────────────────────────

export interface ApiObjectType {
  _id: string;
  userId: string;
  id?: string; // client slug, may be present
  name: string;
  group?: string;
  description?: string;
  icon: string;
  color: string;
  shape: string;
  defaultWidth?: number;
  defaultHeight?: number;
  allowedAttributes: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiRelationshipType {
  _id: string;
  userId: string;
  id?: string;
  name: string;
  description?: string;
  color: string;
  strokeWidth?: number;
  dashed?: boolean;
  /** Populated: full ApiObjectType objects */
  allowedSourceTypes: ApiObjectType[];
  /** Populated: full ApiObjectType objects */
  allowedTargetTypes: ApiObjectType[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiMetamodelDocument {
  _id: string;
  userId: string;
  name: string;
  description: string;
  objectTypes: ApiObjectType[];
  relationshipTypes: ApiRelationshipType[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

/**
 * Strip server-assigned fields that the backend DTOs don't accept.
 * Sending _id, userId, createdAt, updatedAt, __v causes validation errors
 * because the DTOs use forbidNonWhitelisted: true.
 */
function stripServerFields<T extends Record<string, unknown>>(obj: T): Omit<T, '_id' | 'userId' | 'createdAt' | 'updatedAt' | '__v'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, userId, createdAt, updatedAt, __v, ...rest } = obj as Record<string, unknown>;
  return rest as Omit<T, '_id' | 'userId' | 'createdAt' | 'updatedAt' | '__v'>;
}

class MetamodelService {
  // ── Metamodel CRUD ─────────────────────────────────────────────────────────

  public getMetamodels = (): Promise<ApiResponse<ApiMetamodelDocument[]>> =>
    callApi({ uriEndPoint: endpoints.getMetamodels.v1 });

  public getMetamodelById = ({ pathParams }: { pathParams: { id: string } }) =>
    callApi<ApiResponse<ApiMetamodelDocument>>({ uriEndPoint: endpoints.getMetamodelById.v1, pathParams });

  public createMetamodel = ({ body }: { body: { name: string; description?: string } }) =>
    callApi<ApiResponse<ApiMetamodelDocument>>({ uriEndPoint: endpoints.createMetamodel.v1, body });

  public updateMetamodel = ({
    pathParams,
    body,
  }: {
    pathParams: { id: string };
    body: { name?: string; description?: string };
  }) =>
    callApi<ApiResponse<ApiMetamodelDocument>>({ uriEndPoint: endpoints.updateMetamodel.v1, pathParams, body });

  public deleteMetamodel = ({ pathParams }: { pathParams: { id: string } }) =>
    callApi<ApiResponse<ApiMetamodelDocument>>({ uriEndPoint: endpoints.deleteMetamodel.v1, pathParams });

  // ── ObjectType CRUD ────────────────────────────────────────────────────────

  public addObjectType = ({
    pathParams,
    body,
  }: {
    pathParams: { id: string };
    body: Omit<ObjectTypeDefinition, '_id'>;
  }) =>
    callApi<ApiResponse<ApiMetamodelDocument>>({ uriEndPoint: endpoints.addObjectType.v1, pathParams, body });

  public updateObjectType = ({
    pathParams,
    body,
  }: {
    pathParams: { id: string; objectTypeId: string };
    body: Partial<ObjectTypeDefinition>;
  }) =>
    callApi<ApiResponse<ApiMetamodelDocument>>({ uriEndPoint: endpoints.updateObjectType.v1, pathParams, body });

  public deleteObjectType = ({ pathParams }: { pathParams: { id: string; objectTypeId: string } }) =>
    callApi<ApiResponse<ApiMetamodelDocument>>({ uriEndPoint: endpoints.deleteObjectType.v1, pathParams });

  // ── RelationshipType CRUD ──────────────────────────────────────────────────

  public addRelationshipType = ({
    pathParams,
    body,
  }: {
    pathParams: { id: string };
    body: Omit<RelationshipTypeDefinition, '_id'> & { allowedSourceTypes?: string[]; allowedTargetTypes?: string[] };
  }) =>
    callApi<ApiResponse<ApiMetamodelDocument>>({ uriEndPoint: endpoints.addRelationshipType.v1, pathParams, body });

  public updateRelationshipType = ({
    pathParams,
    body,
  }: {
    pathParams: { id: string; relationshipTypeId: string };
    body: Partial<RelationshipTypeDefinition> & { allowedSourceTypes?: string[]; allowedTargetTypes?: string[] };
  }) =>
    callApi<ApiResponse<ApiMetamodelDocument>>({ uriEndPoint: endpoints.updateRelationshipType.v1, pathParams, body });

  public deleteRelationshipType = ({ pathParams }: { pathParams: { id: string; relationshipTypeId: string } }) =>
    callApi<ApiResponse<ApiMetamodelDocument>>({ uriEndPoint: endpoints.deleteRelationshipType.v1, pathParams });

  // ── Two-phase sync ─────────────────────────────────────────────────────────

  /**
   * Full sync of the in-memory metamodel to the backend.
   *
   * Phase 1 — Ensure the Metamodel document exists (create or update name).
   * Phase 2 — Upsert ObjectTypes:
   *   - Types with a real _id already → PATCH if dirty
   *   - Types without _id (new)       → POST to add them to the metamodel
   * Phase 3 — Build slug→_id map from Phase 2 response.
   * Phase 4 — Upsert RelationshipTypes with resolved _id refs.
   *
   * Returns the final populated document and the updated local metamodel
   * (with all backend _ids merged in).
   */
  public async syncMetamodel(
    name: string,
    metamodel: Metamodel,
    remoteId?: string,
  ): Promise<{ doc: ApiMetamodelDocument; metamodel: Metamodel }> {

    // ── Phase 1: ensure Metamodel doc exists ─────────────────────────────────
    let metaDoc: ApiMetamodelDocument;

    if (remoteId) {
      const res = await this.updateMetamodel({ pathParams: { id: remoteId }, body: { name } });
      metaDoc = res.data;
    } else {
      const res = await this.createMetamodel({ body: { name } });
      metaDoc = res.data;
    }

    const metaId = metaDoc._id;

    // ── Phase 2: upsert ObjectTypes ───────────────────────────────────────────
    for (const ot of metamodel.objectTypes) {
      if (ot._id) {
        // Already persisted — send a PATCH with only the updatable fields
        await this.updateObjectType({
          pathParams: { id: metaId, objectTypeId: ot._id },
          body: stripServerFields(ot as unknown as Record<string, unknown>),
        });
      } else {
        // New type — create it and it gets added to the metamodel's ref array
        await this.addObjectType({ pathParams: { id: metaId }, body: ot });
      }
    }

    // Re-fetch to get the authoritative ObjectType list with real _ids
    const afterOTRes = await this.getMetamodelById({ pathParams: { id: metaId } });
    const savedOTs = afterOTRes.data.objectTypes;

    // ── Phase 3: build slug → _id map ────────────────────────────────────────
    const resolveRef = (ref: string): string | undefined => {
      // Already a valid _id
      const direct = savedOTs.find(s => s._id === ref);
      if (direct) return direct._id;

      // Match by slug id stored in the local list
      const local = metamodel.objectTypes.find(t => t.id === ref || t._id === ref);
      if (!local) return undefined;

      const saved = savedOTs.find(
        s => s.name === local.name && s.group === local.group,
      );
      return saved?._id;
    };

    // ── Phase 4: upsert RelationshipTypes with resolved refs ──────────────────
    const existingRTIds = new Set(afterOTRes.data.relationshipTypes.map(r => r._id));

    for (const rt of metamodel.relationshipTypes) {
      const resolvedSources = (rt.allowedSourceTypes ?? [])
        .map(resolveRef)
        .filter((x): x is string => x !== undefined);

      const resolvedTargets = (rt.allowedTargetTypes ?? [])
        .map(resolveRef)
        .filter((x): x is string => x !== undefined);

      const payload = {
        id: rt.id,
        name: rt.name,
        description: rt.description,
        color: rt.color,
        strokeWidth: rt.strokeWidth,
        dashed: rt.dashed,
        allowedSourceTypes: resolvedSources,
        allowedTargetTypes: resolvedTargets,
      };

      if (rt._id && existingRTIds.has(rt._id)) {
        await this.updateRelationshipType({
          pathParams: { id: metaId, relationshipTypeId: rt._id },
          body: stripServerFields({ ...payload } as Record<string, unknown>),
        });
      } else {
        await this.addRelationshipType({ pathParams: { id: metaId }, body: payload });
      }
    }

    // ── Final fetch with full populate ────────────────────────────────────────
    const finalRes = await this.getMetamodelById({ pathParams: { id: metaId } });
    const finalDoc = finalRes.data;

    // Flatten populated types back to the frontend Metamodel shape
    const flatOTs: ObjectTypeDefinition[] = finalDoc.objectTypes.map(ot => ({
      ...(ot as unknown as ObjectTypeDefinition),
      id: metamodel.objectTypes.find(l => l.name === ot.name && l.group === ot.group)?.id ?? ot._id,
      _id: ot._id,
    }));

    const flatRTs: RelationshipTypeDefinition[] = finalDoc.relationshipTypes.map(rt => ({
      id: metamodel.relationshipTypes.find(l => l.name === rt.name)?.id ?? rt._id,
      _id: rt._id,
      name: rt.name,
      description: rt.description,
      color: rt.color,
      strokeWidth: rt.strokeWidth,
      dashed: rt.dashed,
      allowedSourceTypes: rt.allowedSourceTypes.map(t => t._id),
      allowedTargetTypes: rt.allowedTargetTypes.map(t => t._id),
    }));

    const updatedMetamodel = mergeBackendIds(metamodel, flatOTs, flatRTs);

    return { doc: finalDoc, metamodel: updatedMetamodel };
  }
}

export default MetamodelService;
