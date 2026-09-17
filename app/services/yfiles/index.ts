import { callApi } from '@/app/utils/apiutils';
import { yfilesEndpoint } from '@/app/utils/endpoints/yfiles';

export type YFilesModelCategory =
  | 'cloud'
  | 'flowchart'
  | 'uml'
  | 'network'
  | 'system'
  | 'architecture'
  | 'custom';

export interface YFilesNodeLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface YFilesPoint {
  x: number;
  y: number;
}

export interface YFilesNodeData {
  id: string;
  layout: YFilesNodeLayout;
  tag?: Record<string, unknown>;
}

export interface YFilesEdgeData {
  id?: string;
  source: string;
  target: string;
  tag?: Record<string, unknown>;
  bends?: YFilesPoint[];
}

export interface YFilesViewportData {
  zoom?: number;
  centerX?: number;
  centerY?: number;
}

export interface YFilesViewModel {
  name: string;
  layoutType?: string;
  zoom?: number;
  centerX?: number;
  centerY?: number;
  svg?: string;
}

export interface YFilesGraphPayload {
  nodes: YFilesNodeData[];
  edges: YFilesEdgeData[];
  viewport?: YFilesViewportData;
}

export interface YFilesModelRecord {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  category?: YFilesModelCategory;
  metamodelId?: string;
  layoutType?: string;
  graphData: YFilesGraphPayload;
  drawioXml?: string | null;
  views?: YFilesViewModel[];
  svg?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateYFilesModelPayload {
  title: string;
  description?: string;
  category?: YFilesModelCategory;
  metamodelId?: string;
  layoutType?: string;
  graphData: YFilesGraphPayload;
  drawioXml?: string;
  views?: YFilesViewModel[];
  svg?: string;
}

export interface UpdateYFilesModelPayload {
  title?: string;
  description?: string;
  category?: YFilesModelCategory;
  metamodelId?: string;
  layoutType?: string;
  graphData?: YFilesGraphPayload;
  drawioXml?: string;
  views?: YFilesViewModel[];
  svg?: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

class YFilesService {
  public getYFilesModels = async (): Promise<YFilesModelRecord[]> => {
    const res = await callApi<ApiResponse<YFilesModelRecord[]>>({
      uriEndPoint: yfilesEndpoint.getYFilesModels.v1,
    });
    return res.data;
  };

  public getYFilesModel = async (id: string): Promise<YFilesModelRecord> => {
    const res = await callApi<ApiResponse<YFilesModelRecord>>({
      uriEndPoint: yfilesEndpoint.getYFilesModel.v1,
      pathParams: { id },
    });
    return res.data;
  };

  public createYFilesModel = async (
    payload: CreateYFilesModelPayload,
  ): Promise<YFilesModelRecord> => {
    const res = await callApi<ApiResponse<YFilesModelRecord>>({
      uriEndPoint: yfilesEndpoint.createYFilesModel.v1,
      body: payload,
    });
    return res.data;
  };

  public updateYFilesModel = async (
    id: string,
    payload: UpdateYFilesModelPayload,
  ): Promise<YFilesModelRecord> => {
    const res = await callApi<ApiResponse<YFilesModelRecord>>({
      uriEndPoint: yfilesEndpoint.updateYFilesModel.v1,
      pathParams: { id },
      body: payload,
    });
    return res.data;
  };

  public deleteYFilesModel = async (id: string): Promise<YFilesModelRecord> => {
    const res = await callApi<ApiResponse<YFilesModelRecord>>({
      uriEndPoint: yfilesEndpoint.deleteYFilesModel.v1,
      pathParams: { id },
    });
    return res.data;
  };
}

export default YFilesService;
