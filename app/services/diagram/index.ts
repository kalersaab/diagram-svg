
import type { StoredDiagram } from '@/app/utils/diagram-storage';
import { callApi } from '@/app/utils/apiutils';
import { diagram } from '@/app/utils/endpoints/diagrams';

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

class DiagramService {
  
  public getDiagrams = async (): Promise<StoredDiagram[]> => {
    const res = await callApi<ApiResponse<ApiDiagram[]>>({
      uriEndPoint: diagram.getDiagrams.v1,
    });
    return res.data.map(toStored);
  };

  public getDiagram = async (id: string): Promise<StoredDiagram> => {
    const res = await callApi<ApiResponse<ApiDiagram>>({
      uriEndPoint: diagram.getDiagram.v1,
      pathParams: { id },
    });
    return toStored(res.data);
  };

  public createDiagram = async (
    payload: CreateDiagramPayload,
  ): Promise<StoredDiagram> => {
    const res = await callApi<ApiResponse<ApiDiagram>>({
      uriEndPoint: diagram.createDiagram.v1,
      body: payload,
    });
    return toStored(res.data);
  };

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

  public deleteDiagram = async (id: string): Promise<StoredDiagram> => {
    const res = await callApi<ApiResponse<ApiDiagram>>({
      uriEndPoint: diagram.deleteDiagram.v1,
      pathParams: { id },
    });
    return toStored(res.data);
  };
}

export default DiagramService;