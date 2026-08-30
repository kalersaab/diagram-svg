/**
 * Diagrams API service – wraps the diagram-backend /diagrams CRUD endpoints.
 * Maps backend responses to the StoredDiagram shape used across the frontend.
 */

import type { StoredDiagram } from '@/app/utils/diagram-storage';
import { callApi } from '@/app/utils/apiutils';
import { diagram } from '@/app/utils/endpoints/diagrams';

// ─── Backend response shapes ──────────────────────────────────────────────────

interface ApiDiagram {
  _id: string;
  userId: string;
  title: string;
  description: string;
  category: StoredDiagram['category'];
  xml: string;
  svg?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

// ─── Payload types ────────────────────────────────────────────────────────────

export interface CreateDiagramPayload {
  title: string;
  description?: string;
  category?: StoredDiagram['category'];
  xml: string;
  svg?: string;
}

export interface UpdateDiagramPayload {
  title?: string;
  description?: string;
  category?: StoredDiagram['category'];
  xml?: string;
  svg?: string;
}

// ─── Converter ────────────────────────────────────────────────────────────────

/** Convert backend ApiDiagram → frontend StoredDiagram. */
function toStored(d: ApiDiagram): StoredDiagram {
  return {
    id: d._id,
    title: d.title,
    description: d.description,
    category: d.category,
    xml: d.xml,
    svg: d.svg ?? undefined,
    createdAt: new Date(d.createdAt).getTime(),
    updatedAt: new Date(d.updatedAt).getTime(),
  };
}

// ─── Service class ────────────────────────────────────────────────────────────

class DiagramService {
  /** GET /diagrams — fetch all diagrams for the current user */
  public getDiagrams = async (): Promise<StoredDiagram[]> => {
    const res = await callApi<ApiResponse<ApiDiagram[]>>({
      uriEndPoint: diagram.getDiagrams.v1,
    });
    return res.data.map(toStored);
  };

  /** GET /diagrams/:id — fetch a single diagram */
  public getDiagram = async (id: string): Promise<StoredDiagram> => {
    const res = await callApi<ApiResponse<ApiDiagram>>({
      uriEndPoint: diagram.getDiagram.v1,
      pathParams: { id },
    });
    return toStored(res.data);
  };

  /** POST /diagrams — create a new diagram */
  public createDiagram = async (
    payload: CreateDiagramPayload,
  ): Promise<StoredDiagram> => {
    const res = await callApi<ApiResponse<ApiDiagram>>({
      uriEndPoint: diagram.createDiagram.v1,
      body: payload,
    });
    return toStored(res.data);
  };

  /**
   * PUT /diagrams/:id — update title/description/category/xml/svg.
   * `id` is StoredDiagram.id which maps to the backend _id.
   */
  public updateDiagram = async (
    id: string,
    payload: UpdateDiagramPayload,
  ): Promise<StoredDiagram> => {
    const res = await callApi<ApiResponse<ApiDiagram>>({
      uriEndPoint: diagram.updateDiagram.v1,
      pathParams: { id },
      body: payload,
    });
    return toStored(res.data);
  };

  /** DELETE /diagrams/:id — delete a diagram */
  public deleteDiagram = async (id: string): Promise<StoredDiagram> => {
    const res = await callApi<ApiResponse<ApiDiagram>>({
      uriEndPoint: diagram.deleteDiagram.v1,
      pathParams: { id },
    });
    return toStored(res.data);
  };
}

export default DiagramService;
