import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';

export interface User {
    id: number;
    name: string;
}

export interface SafetyDocument {
    id: number;
    title: string;
    description: string | null;
    file_path: string;
    uploaded_by: number;
    uploader?: User;
    created_at: string;
}

export interface SafetyAgenda {
    id: number;
    title: string;
    description: string | null;
    agenda_date: string;
    created_by: number;
    creator?: User;
    created_at: string;
}

export interface SafetyPpe {
    id: number;
    item_name: string;
    status: 'Available' | 'In Use' | 'Defective';
    assigned_to: number | null;
    assignee?: User;
    remarks: string | null;
    created_at: string;
}

export interface SafetyNotification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'alert';
    sent_to_all: boolean;
    sender_id: number;
    recipient_id: number | null;
    sender?: User;
    recipient?: User;
    created_at: string;
}

// Documents
export const useSafetyDocuments = (projectId?: number) => useQuery({
    queryKey: ['safety-documents', projectId],
    queryFn: () => api.get('safety-documents', { searchParams: projectId ? { project_id: projectId } : {} }).json<SafetyDocument[]>(),
});

export const useAddSafetyDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { title: string, description?: string, file: File, project_id: number }) => {
            const fd = new FormData();
            fd.append('project_id', data.project_id.toString());
            fd.append('title', data.title);
            if (data.description) fd.append('description', data.description);
            fd.append('file', data.file);
            return api.post('safety-documents', { body: fd }).json<SafetyDocument>();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-documents'] }),
    });
};

export const useDeleteSafetyDocument = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`safety-documents/${id}`).json(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-documents'] }),
    });
};

// Agendas
export const useSafetyAgendas = (projectId?: number) => useQuery({
    queryKey: ['safety-agendas', projectId],
    queryFn: () => api.get('safety-agendas', { searchParams: projectId ? { project_id: projectId } : {} }).json<SafetyAgenda[]>(),
});

export const useAddSafetyAgenda = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<SafetyAgenda, 'id' | 'created_by' | 'creator' | 'created_at'> & { project_id: number }) => api.post('safety-agendas', { json: data }).json<SafetyAgenda>(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-agendas'] }),
    });
};

export const useDeleteSafetyAgenda = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`safety-agendas/${id}`).json(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-agendas'] }),
    });
};

// PPEs
export const useSafetyPpes = (projectId?: number) => useQuery({
    queryKey: ['safety-ppes', projectId],
    queryFn: () => api.get('safety-ppes', { searchParams: projectId ? { project_id: projectId } : {} }).json<SafetyPpe[]>(),
});

export const useAddSafetyPpe = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<SafetyPpe> & { project_id: number }) => api.post('safety-ppes', { json: data }).json<SafetyPpe>(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-ppes'] }),
    });
};

export const useUpdateSafetyPpe = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: Partial<SafetyPpe> & { id: number }) => api.put(`safety-ppes/${id}`, { json: data }).json<SafetyPpe>(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-ppes'] }),
    });
};

export const useDeleteSafetyPpe = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`safety-ppes/${id}`).json(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-ppes'] }),
    });
};

// Notifications
export const useSafetyNotifications = (projectId?: number) => useQuery({
    queryKey: ['safety-notifications', projectId],
    queryFn: () => api.get('safety-notifications', { searchParams: projectId ? { project_id: projectId } : {} }).json<SafetyNotification[]>(),
});

export const useAddSafetyNotification = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<SafetyNotification> & { project_id: number }) => api.post('safety-notifications', { json: data }).json<SafetyNotification>(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-notifications'] }),
    });
};

export const useDeleteSafetyNotification = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete(`safety-notifications/${id}`).json(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['safety-notifications'] }),
    });
};
