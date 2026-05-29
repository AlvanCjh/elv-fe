import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface InspectionReport {
    id: number;
    project_id: number;
    title: string;
    rfwi_ref_no?: string;
    description?: string;
    location?: string;
    inspector_name?: string;
    inspection_date?: string;
    status: string;
    remarks?: string;
    linked_service_report_id?: number;
    linkedServiceReport?: any;
    created_at: string;
    updated_at: string;
}

export const useInspectionReports = (projectId?: number) => {
    return useQuery({
        queryKey: ['inspection-reports', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            return api.get(`inspection-reports?project_id=${projectId}`).json<InspectionReport[]>();
        },
        enabled: !!projectId
    });
};

export const useAddInspectionReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<InspectionReport>) => {
            return api.post('inspection-reports', { json: payload }).json<InspectionReport>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-reports'] });
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
        }
    });
};

export const useUpdateInspectionReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number, payload: Partial<InspectionReport> }) => {
            return api.put(`inspection-reports/${id}`, { json: payload }).json<InspectionReport>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-reports'] });
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
        }
    });
};

export const useDeleteInspectionReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`inspection-reports/${id}`).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-reports'] });
        }
    });
};
