import { api } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '../../../context/ProjectContext';

export interface Zone {
    id: number;
    floor_id: number;
    alias_id?: string;
    name: string;
    area?: string;
    location_desc?: string;
    svg_path?: string;
    object_components?: ObjectComponent[];
    created_at?: string;
    updated_at?: string;
}

export interface Floor {
    id: number;
    building_id: number;
    floor_number: string;
    type?: string;
    floor_plan_svg?: string;
    floor_plan_image_url?: string;
    bss_plan_image_url?: string;
    pa_plan_image_url?: string;
    telco_plan_image_url?: string;
    zones?: Zone[];
    created_at?: string;
    updated_at?: string;
}

export interface Building {
    id: number;
    name: string;
    total_floor: number;
    latitude: number;
    longitude: number;
    elevation_image_url?: string;
    floors?: Floor[];
    created_at?: string;
    updated_at?: string;
}

export const fetchBuildings = async (): Promise<Building[]> => {
    return api.get('buildings').json<Building[]>();
};

export const useBuildings = () => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['buildings', activeProjectId],
        queryFn: fetchBuildings,
        enabled: !!activeProjectId,
    });
};

export const fetchBuildingDetails = async (id: string): Promise<Building> => {
    return api.get(`buildings/${id}`).json<Building>();
};

export const useBuildingDetails = (id: string) => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['building', id, activeProjectId],
        queryFn: () => fetchBuildingDetails(id),
        enabled: !!id && !!activeProjectId,
    });
};

export const fetchFloorDetails = async (id: string): Promise<Floor> => {
    return api.get(`floors/${id}`).json<Floor>();
};

export const useFloorDetails = (id: string) => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['floor', id, activeProjectId],
        queryFn: () => fetchFloorDetails(id),
        enabled: !!id && !!activeProjectId,
    });
};

export const uploadFloorImage = async (id: string, file: File, system?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('image', file);
    if (system) formData.append('system', system);
    return api.post(`floors/${id}/image`, { body: formData }).json<any>();
};

export const uploadBuildingElevation = async (id: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`buildings/${id}/elevation`, { body: formData }).json<any>();
};

export const createFloor = async (buildingId: string, data: any): Promise<any> => {
    return api.post(`buildings/${buildingId}/floors`, { json: data }).json<any>();
};

export const deleteFloor = async (id: number): Promise<any> => {
    return api.delete(`floors/${id}`).json<any>();
};

// --- OBJECTS AND ANNOTATIONS ---

export interface Legend {
    id: number;
    system_type: string;
    name: string;
    shape_type: 'point' | 'polyline' | 'polygon' | 'cloud';
    icon_svg?: string;
    style?: any;
    created_at: string;
    floors?: { id: number; floor_number: string; name: string }[];
}

export interface ObjectStatus {
    id: number;
    object_id: number;
    current_status: string;
    image_url?: string;
    remarks?: string;
    created_at: string;
    user?: { id: number; name: string; displayName?: string };
}

export interface ObjectPort {
    id: number;
    object_component_id: number;
    port_name: string;
    cable_id?: string;
    connected_to_object_id?: number;
    status: string;
    created_at: string;
}

export interface ObjectComponent {
    id: number;
    zone_id: number;
    item_alias_id: string;
    item_name: string;
    gridline_coords?: string;
    system_type: string;
    cabling_type?: string;
    pos_x: number;
    pos_y: number;
    rotation?: number;
    shape_type?: string;
    geometry?: any;
    latest_status?: ObjectStatus;
    finish_status?: ObjectStatus;
    approve_status?: ObjectStatus;
    ports?: ObjectPort[];
    zone?: any;
    user?: any;
}

export interface PlanAnnotation {
    id: number;
    floor_id: number;
    zone_id?: number;
    object_id?: number;
    system_type: string;
    annotation_type: string; // 'polyline', 'polygon', 'text', 'shape'
    geometry: { x: number; y: number }[];
    style?: any;
    created_at: string;
}

export const createZone = async (floorId: number, data: any): Promise<any> => {
    return api.post(`floors/${floorId}/zones`, { json: data }).json<any>();
};

export const deleteZone = async (id: number): Promise<any> => {
    return api.delete(`zones/${id}`).json<any>();
};

export const fetchObjects = async (zoneId: number, systemType: string): Promise<ObjectComponent[]> => {
    return api.get('objects', { searchParams: { zone_id: zoneId, system_type: systemType } }).json<ObjectComponent[]>();
};

export const fetchAllObjects = async (): Promise<ObjectComponent[]> => {
    return api.get('objects/all').json<ObjectComponent[]>();
};

export const useAllObjects = () => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['all-objects', activeProjectId],
        queryFn: fetchAllObjects,
        enabled: !!activeProjectId,
    });
};

export const fetchLegends = async (systemType: string, floorId?: number): Promise<Legend[]> => {
    const params: any = { system_type: systemType };
    if (floorId) params.floor_id = floorId;
    return api.get('legends', { searchParams: params }).json<Legend[]>();
};

export const createLegend = async (data: any): Promise<any> => {
    return api.post('legends', { json: data }).json<any>();
};

export const deleteLegend = async (id: number): Promise<any> => {
    return api.delete(`legends/${id}`).json<any>();
};

export const useLegends = (systemType: string, floorId?: number) => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['legends', systemType, floorId, activeProjectId],
        queryFn: () => fetchLegends(systemType, floorId),
        enabled: !!activeProjectId && !!systemType,
    });
};

export const fetchAnnotations = async (floorId: number, systemType: string): Promise<PlanAnnotation[]> => {
    return api.get('annotations', { searchParams: { floor_id: floorId, system_type: systemType } }).json<PlanAnnotation[]>();
};

export const createObject = async (data: any): Promise<any> => {
    if (data instanceof FormData) {
        return api.post('objects', { body: data }).json<any>();
    }
    return api.post('objects', { json: data }).json<any>();
};

export const updateObjectStatus = async (id: number, data: any): Promise<any> => {
    if (data instanceof FormData) {
        return api.post(`objects/${id}/status`, { body: data }).json<any>();
    }
    return api.post(`objects/${id}/status`, { json: data }).json<any>();
};

export const addObjectPort = async (objectId: number, data: { port_name: string }): Promise<any> => {
    return api.post(`objects/${objectId}/ports`, { json: data }).json();
};

export const establishObjectPortLink = async (objectId: number, portId: number, data: { cable_id: string; connected_to_object_id: number; connected_port_name: string }): Promise<any> => {
    return api.patch(`objects/${objectId}/ports/${portId}/link`, { json: data }).json();
};

export const deleteObjectPort = async (objectId: number, portId: number): Promise<any> => {
    return api.delete(`objects/${objectId}/ports/${portId}`).json<any>();
};

export const updateObjectPortLink = async (objectId: number, portId: number, data: { port_name?: string; status?: string; cable_id?: string; connected_to_object_id?: number; connected_port_name?: string }): Promise<any> => {
    return api.put(`objects/${objectId}/ports/${portId}`, { json: data }).json();
};

export const updateObjectDetails = async (id: number, data: any): Promise<any> => {
    return api.patch(`objects/${id}`, { json: data }).json<any>();
};

export const deleteObject = async (id: number): Promise<any> => {
    return api.delete(`objects/${id}`).json<any>();
};

export const createAnnotation = async (data: any): Promise<any> => {
    return api.post('annotations', { json: data }).json<any>();
};

// --- HISTORY AND AUDIT ---

export type PinStatus = 'Fix1' | 'Fix2' | 'Pending' | 'Completed';
export type ZoneCategory = 'BSS' | 'TEL' | 'PAM';

export interface PendingHistory {
    id: number;
    floor_annotation_id: number;
    name: string;
    status: PinStatus;
    remarks?: string;
    base_location?: string;
    created_at: string;
    updated_at: string;
    user?: {
        name: string;
    };
    annotation?: {
        id: number;
        floor_id: number;
        floor?: {
            id: number;
            building_id: number;
            floor_number: string;
        }
    };
}

export const fetchPendingHistories = async (params: any): Promise<PendingHistory[]> => {
    return api.get('pending-histories', { searchParams: params }).json<PendingHistory[]>();
};

export const usePendingHistories = (params: any) => {
    return useQuery({
        queryKey: ['pending-histories', params],
        queryFn: () => fetchPendingHistories(params),
        enabled: true,
    });
};
