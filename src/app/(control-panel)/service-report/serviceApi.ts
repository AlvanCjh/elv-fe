import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface ReportPhoto {
    id: number;
    photo_path: string;
    caption?: string;
}

export interface ServiceReport {
    id: number;
    project_id: number;
    service_report_no: string;
    company_name?: string;
    address?: string;
    contact_person?: string;
    telephone_no?: string;
    taken_by?: string;
    date_time: string;
    service_types: string[];
    service_type_others_text?: string;
    description?: string;
    service_summary: string[]; // List of steps
    summary_date?: string;
    summary_time?: string;
    linked_incident_report_id?: number;
    linked_inspection_report_id?: number;
    incidentReport?: any;
    inspectionReport?: any;
    photos: ReportPhoto[];
    created_at: string;
    updated_at: string;
}

export const useServiceReports = (projectId?: number) => {
    return useQuery({
        queryKey: ['service-reports', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            return api.get(`service-reports?project_id=${projectId}`).json<ServiceReport[]>();
        },
        enabled: !!projectId
    });
};

export const useAddServiceReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            return api.post('service-reports', { body: formData }).json<ServiceReport>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
            queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
            queryClient.invalidateQueries({ queryKey: ['inspection-reports'] });
        }
    });
};

export const useUpdateServiceReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, formData }: { id: number, formData: FormData }) => {
            formData.append('_method', 'PUT');
            return api.post(`service-reports/${id}`, { body: formData }).json<ServiceReport>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
            queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
            queryClient.invalidateQueries({ queryKey: ['inspection-reports'] });
        }
    });
};

export const useDeleteServiceReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`service-reports/${id}`).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
        }
    });
};

export const useDeleteServicePhoto = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ reportId, photoId }: { reportId: number, photoId: number }) => {
            return api.delete(`service-reports/${reportId}/photos/${photoId}`).json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
        }
    });
};
