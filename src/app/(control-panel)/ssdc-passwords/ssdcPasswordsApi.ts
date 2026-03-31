import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface SsdcPassword {
    id: number;
    project_id: number;
    system_name: string;
    username?: string;
    password?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export const useSsdcPasswords = (projectId?: number) => {
    return useQuery({
        queryKey: ['ssdc-passwords', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            return api.get(`ssdc-passwords?project_id=${projectId}`).json<SsdcPassword[]>();
        },
        enabled: !!projectId
    });
};

export const useAddSsdcPassword = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<SsdcPassword>) => {
            return api.post('ssdc-passwords', { json: payload }).json<SsdcPassword>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ssdc-passwords'] });
        }
    });
};

export const useUpdateSsdcPassword = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number, payload: Partial<SsdcPassword> }) => {
            return api.put(`ssdc-passwords/${id}`, { json: payload }).json<SsdcPassword>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ssdc-passwords'] });
        }
    });
};

export const useDeleteSsdcPassword = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`ssdc-passwords/${id}`).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ssdc-passwords'] });
        }
    });
};
