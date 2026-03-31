import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface EquipmentChecksheet {
    id: number;
    project_id: number;
    equipment_name: string;
    equipment_type: string;
    model_number?: string;
    serial_number?: string;
    location?: string;
    voltage_v?: string;
    current_a?: string;
    other_readings?: string;
    checklist_results?: Record<string, boolean | string>;
    status: string;
    checked_by?: string;
    check_date?: string;
    remarks?: string;
    created_at: string;
    updated_at: string;
}

export const useChecksheets = (projectId?: number) => {
    return useQuery({
        queryKey: ['equipment-checksheets', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            return api.get(`equipment-checksheets?project_id=${projectId}`).json<EquipmentChecksheet[]>();
        },
        enabled: !!projectId
    });
};

export const useAddChecksheet = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<EquipmentChecksheet>) => {
            return api.post('equipment-checksheets', { json: payload }).json<EquipmentChecksheet>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment-checksheets'] });
        }
    });
};

export const useUpdateChecksheet = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number, payload: Partial<EquipmentChecksheet> }) => {
            return api.put(`equipment-checksheets/${id}`, { json: payload }).json<EquipmentChecksheet>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment-checksheets'] });
        }
    });
};

export const useDeleteChecksheet = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`equipment-checksheets/${id}`).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipment-checksheets'] });
        }
    });
};
