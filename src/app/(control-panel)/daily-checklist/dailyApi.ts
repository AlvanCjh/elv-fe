import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';

export interface DailyChecklist {
    id: number;
    project_id: number;
    company_type: 'kinetic_motion' | 'sabahnet';
    check_date: string;
    attendee_name: string;
    verified_by: string;
    status_summary: string;
    sections_data: any;
    remarks: string;
    created_at: string;
    updated_at: string;
}

const API_BASE = 'daily-checklists';

export const useDailyChecklists = (projectId?: number, companyType?: string) => {
    return useQuery<DailyChecklist[]>({
        queryKey: ['daily-checklists', projectId],
        queryFn: async () => {
            const params: Record<string, any> = { project_id: projectId as number };
            if (companyType) params.company_type = companyType;
            return api.get(API_BASE, { searchParams: params }).json();
        },
        enabled: !!projectId
    });
};

export const useDailyChecklist = (id?: number) => {
    return useQuery<DailyChecklist>({
        queryKey: ['daily-checklist', id],
        queryFn: async () => {
            return api.get(`${API_BASE}/${id}`).json();
        },
        enabled: !!id
    });
};

export const useAddDailyChecklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<DailyChecklist>) => {
            return api.post(API_BASE, { json: payload }).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-checklists'] });
        }
    });
};

export const useUpdateDailyChecklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: Partial<DailyChecklist> }) => {
            return api.put(`${API_BASE}/${id}`, { json: payload }).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-checklists'] });
            queryClient.invalidateQueries({ queryKey: ['daily-checklist'] });
        }
    });
};

export const useDailyChecklistWithId = (id: number) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: Partial<DailyChecklist>) => {
			return api.put(`${API_BASE}/${id}`, { json: payload }).json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['daily-checklists'] });
		}
	});
};

export const useDeleteDailyChecklist = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            return api.delete(`${API_BASE}/${id}`).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-checklists'] });
        }
    });
};
