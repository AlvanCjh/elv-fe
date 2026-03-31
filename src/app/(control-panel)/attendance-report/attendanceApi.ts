import api from '@/utils/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AttendanceRecord {
    id: number;
    project_id: number;
    user_id: string; 
    user?: {
        name: string;
    };
    user_name: string; // Keep as fallback
    date: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            return await api.get('users').json<any[]>();
        }
    });
};

export const useAttendance = (projectId?: number) => {
    return useQuery({
        queryKey: ['attendance', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            return await api.get('attendance', { searchParams: { project_id: projectId } }).json<AttendanceRecord[]>();
        },
        enabled: !!projectId,
    });
};

export const useAddAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { project_id: number; user_id: string; user_name: string; date: string; status: string }) => {
            return await api.post('attendance', { json: data }).json<AttendanceRecord>();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['attendance', variables.project_id] });
        },
    });
};

export const useDeleteAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, projectId }: { id: number; projectId: number }) => {
            return await api.delete(`attendance/${id}`).json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['attendance', variables.projectId] });
        },
    });
};
