import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface ReportPhoto {
    id: number;
    photo_path: string;
    caption?: string;
}

export interface IncidentReport {
    id: number;
    project_id: number;
    ir_no: string;
    reported_by: string;
    report_date: string;
    role_of_recorded: string;
    incident_types: string[];
    incident_type_others_text?: string;
    affected_equipment?: string;
    incident_location?: string;
    finding_date?: string;
    incident_scenario?: string;
    incident_description?: string;
    specifications?: string;
    inability?: string;
    impact?: string;
    operation?: string;
    recommendations?: string;
    replacement_capability?: string;
    remarks?: string;
    verified_by?: string;
    verified_designation?: string;
    verified_date?: string;
    linked_service_report_id?: number;
    linkedServiceReport?: any; // To avoid circular imports for now
    photos: ReportPhoto[];
    created_at: string;
    updated_at: string;
}

export const useIncidentReports = (projectId?: number) => {
    return useQuery({
        queryKey: ['incident-reports', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            return api.get(`incident-reports?project_id=${projectId}`).json<IncidentReport[]>();
        },
        enabled: !!projectId
    });
};

export const useAddIncidentReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            return api.post('incident-reports', { body: formData }).json<IncidentReport>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
        }
    });
};

export const useUpdateIncidentReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, formData }: { id: number, formData: FormData }) => {
            formData.append('_method', 'PUT');
            return api.post(`incident-reports/${id}`, { body: formData }).json<IncidentReport>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
            queryClient.invalidateQueries({ queryKey: ['service-reports'] });
        }
    });
};

export const useDeleteIncidentReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`incident-reports/${id}`).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
        }
    });
};

export const useDeleteIncidentPhoto = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ reportId, photoId }: { reportId: number, photoId: number }) => {
            return api.delete(`incident-reports/${reportId}/photos/${photoId}`).json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
        }
    });
};
