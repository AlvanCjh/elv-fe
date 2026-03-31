import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface MaintenanceTask {
    id: number;
    project_id: number;
    type: 'internal' | 'external';
    title: string;
    description?: string;
    assigned_to?: string;
    date?: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export const useMaintenanceTasks = (projectId?: number, type?: 'internal' | 'external') => {
    return useQuery({
        queryKey: ['maintenance-tasks', projectId, type],
        queryFn: async () => {
            if (!projectId) return [];
            let url = `maintenance-tasks?project_id=${projectId}`;
            if (type) url += `&type=${type}`;
            return api.get(url).json<MaintenanceTask[]>();
        },
        enabled: !!projectId
    });
};

export const useAddMaintenanceTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<MaintenanceTask>) => {
            return api.post('maintenance-tasks', { json: payload }).json<MaintenanceTask>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
        }
    });
};

export const useUpdateMaintenanceTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number, payload: Partial<MaintenanceTask> }) => {
            return api.put(`maintenance-tasks/${id}`, { json: payload }).json<MaintenanceTask>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
        }
    });
};

export const useDeleteMaintenanceTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`maintenance-tasks/${id}`).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
        }
    });
};
