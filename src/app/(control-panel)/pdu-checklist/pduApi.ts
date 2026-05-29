import api from '@/utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface PduChecklist {
    id: number;
    project_id: number;
    pdu_ref_no?: string;
    record_date: string;
    units_data: any;
    meta_data: any;
    created_at?: string;
    updated_at?: string;
}

export const usePduChecklists = (projectId: string | number | undefined) => {
    return useQuery({
        queryKey: ['pduChecklists', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            return await api.get('pdu-checklists', { searchParams: { project_id: projectId } }).json<PduChecklist[]>();
        },
        enabled: !!projectId,
    });
};

export const useAddPduChecklist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ projectId, data }: { projectId: string | number; data: Partial<PduChecklist> }) => {
            return await api.post('pdu-checklists', { json: data }).json<PduChecklist>();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pduChecklists', variables.projectId] });
        },
    });
};

export const useUpdatePduChecklist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data, projectId }: { id: number; data: Partial<PduChecklist>; projectId: string | number }) => {
            return await api.put(`pdu-checklists/${id}`, { json: data }).json<PduChecklist>();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pduChecklists', variables.projectId] });
        },
    });
};

export const useDeletePduChecklist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, projectId }: { id: number; projectId: string | number }) => {
            return await api.delete(`pdu-checklists/${id}`).json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pduChecklists', variables.projectId] });
        },
    });
};
