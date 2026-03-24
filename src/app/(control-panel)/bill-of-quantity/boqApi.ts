import { useQuery } from '@tanstack/react-query';
import api from '../../../utils/api';
import { useProject } from '../../../context/ProjectContext';

export interface BoqSummaryRow {
    system_type: string;
    item_name: string;
    shape_type: string;
    unit: string;
    unit_cost: string;
    total_qty: number;
    completed_qty: number;
    pending_qty: number;
    total_cost: string;
    alias_ids: string | null;
}

export function useBoqSummary(floorId?: number) {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['boq_summary', floorId, activeProjectId],
        queryFn: async (): Promise<BoqSummaryRow[]> => {
            const url = floorId ? `boq/summary?floor_id=${floorId}` : 'boq/summary';
            const response = await api.get(url).json<{ data: BoqSummaryRow[] }>();
            return response.data || [];
        },
        enabled: !!activeProjectId
    });
}

export interface CableTopologyRow {
    id: number;
    object_component_id: number;
    port_name: string;
    cable_id: string;
    connected_to_object_id: number | null;
    status: string;
    object_component: {
        id: number;
        item_alias_id: string | null;
        item_name: string;
        system_type: string;
    };
    connected_to_object: {
        id: number;
        item_alias_id: string | null;
        item_name: string;
    } | null;
}

export function useCableTopology(floorId?: number, systemType?: string) {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['cable_topology', floorId, systemType, activeProjectId],
        queryFn: async (): Promise<CableTopologyRow[]> => {
            if (!floorId) return [];

            const params = new URLSearchParams();
            params.append('floor_id', floorId.toString());
            if (systemType && systemType !== 'All Types') {
                params.append('system_type', systemType);
            }

            const response = await api.get(`boq/cables?${params.toString()}`).json<{ data: CableTopologyRow[] }>();
            return response.data || [];
        },
        enabled: !!floorId && !!activeProjectId
    });
}
