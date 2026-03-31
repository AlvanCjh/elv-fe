import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface OnsiteReportDocument {
    id: number;
    category: string;
    title: string;
    description?: string;
    location?: string;
    status: string;
    priority: string;
    file_path: string;
    created_at: string;
    uploaded_by: number;
    assigned_to?: number;
    uploader?: { id: number; name: string };
    assigned_to_user?: { id: number; name: string };
}

export const useOnsiteReports = (category: string, projectId?: number) =>
    useQuery({
        queryKey: ['onsite-reports', category, projectId],
        queryFn: () => {
            const searchParams: any = { category };
            if (projectId) searchParams.project_id = projectId;
            return api.get('onsite-reports', { searchParams }).json<OnsiteReportDocument[]>();
        },
        enabled: !!category,
    });

export interface AddOnsiteReportData {
    title: string;
    file: File;
    category: string;
    project_id: number;
    description?: string;
    location?: string;
    status?: string;
    priority?: string;
    assigned_to?: number;
}

export const useAddOnsiteReport = (category: string, projectId?: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: AddOnsiteReportData) => {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('file', data.file);
            formData.append('category', data.category);
            formData.append('project_id', data.project_id.toString());
            if (data.description) formData.append('description', data.description);
            if (data.location) formData.append('location', data.location);
            if (data.status) formData.append('status', data.status);
            if (data.priority) formData.append('priority', data.priority);
            if (data.assigned_to) formData.append('assigned_to', data.assigned_to.toString());
            
            return api.post('onsite-reports', { body: formData }).json<OnsiteReportDocument>();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['onsite-reports', category, projectId] }),
    });
};

export const useUpdateOnsiteReport = (category: string, projectId?: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: Partial<OnsiteReportDocument> & { id: number }) => {
            return api.put(`onsite-reports/${id}`, { json: data }).json<OnsiteReportDocument>();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['onsite-reports', category, projectId] }),
    });
};

export const useDeleteOnsiteReport = (category: string, projectId?: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`onsite-reports/${id}`).json(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['onsite-reports', category, projectId] }),
    });
};
