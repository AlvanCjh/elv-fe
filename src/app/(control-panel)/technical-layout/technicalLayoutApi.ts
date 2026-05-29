import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, API_BASE_URL } from '@/utils/api';

export interface TechnicalLayoutZoneObject {
    id: number;
    technical_layout_zone_id: number;
    name: string;
    description: string | null;
}

export interface TechnicalLayoutZoneAnnotation {
    id: number;
    technical_layout_zone_id: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    photo_path: string | null;
    created_at: string;
}

export interface TechnicalLayoutZone {
    id: number;
    technical_layout_id: number;
    name: string;
    svg_path: string;
    color: string | null;
    status: string;
    objects: TechnicalLayoutZoneObject[];
    annotations: TechnicalLayoutZoneAnnotation[];
}

export interface TechnicalLayout {
    id: number;
    project_id: number;
    name: string;
    image_path: string;
    zones: TechnicalLayoutZone[];
    created_at: string;
}

export const useTechnicalLayouts = (projectId?: number) => {
    return useQuery<TechnicalLayout[]>({
        queryKey: ['technical-layouts', projectId],
        queryFn: async () => {
            return api.get('technical-layouts', {
                searchParams: projectId ? { project_id: projectId } : undefined
            }).json<TechnicalLayout[]>();
        },
        enabled: !!projectId
    });
};

export const useAddTechnicalLayout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: FormData) => {
            return api.post('technical-layouts', {
                body: payload
            }).json<TechnicalLayout>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['technical-layouts'] });
        }
    });
};

export const useUpdateTechnicalLayout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, payload }: { id: number, payload: FormData }) => {
            return api.post(`technical-layouts/${id}`, {
                body: payload
            }).json<TechnicalLayout>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['technical-layouts'] });
        }
    });
};

export const useUpdateTechnicalLayoutZones = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, zones }: { id: number, zones: Partial<TechnicalLayoutZone>[] }) => {
            return api.put(`technical-layouts/${id}/zones`, {
                json: { zones }
            }).json<TechnicalLayout>();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['technical-layouts'] });
        }
    });
};

export const useDeleteTechnicalLayout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`technical-layouts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['technical-layouts'] });
        }
    });
};

// --- Zone Details Hooks ---

export const useAddTechnicalLayoutZoneObject = (zoneId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { name: string, description?: string }) => {
            return api.post(`technical-layout-zones/${zoneId}/objects`, { json: data }).json<TechnicalLayoutZoneObject>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['technical-layouts'] });
        }
    });
};

export const useDeleteTechnicalLayoutZoneObject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`technical-layout-zone-objects/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['technical-layouts'] });
        }
    });
};

export const useAddTechnicalLayoutZoneAnnotation = (zoneId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            return api.post(`technical-layout-zones/${zoneId}/annotations`, { body: formData }).json<TechnicalLayoutZoneAnnotation>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['technical-layouts'] });
        }
    });
};

export const useDeleteTechnicalLayoutZoneAnnotation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`technical-layout-zone-annotations/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['technical-layouts'] });
        }
    });
};

export const useUpdateTechnicalLayoutZoneStatus = (zoneId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (status: string) => {
            return api.patch(`technical-layout-zones/${zoneId}/status`, { json: { status } }).json<TechnicalLayoutZone>();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['technical-layouts'] });
        }
    });
};

export const useDeleteTechnicalLayoutZone = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`technical-layout-zones/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['technical-layouts'] });
        }
    });
};

export interface TechnicalLayoutWidget {
    id: number;
    technical_layout_id: number;
    technical_layout_zone_id: number | null;
    type: string;
    color_theme: 'blue' | 'yellow' | 'orange' | string;
    x_pos: number;
    y_pos: number;
    status: 'ok' | 'warning' | 'critical' | string;
    metadata: {
        temperature?: string;
        humidity?: string;
    } | null;
    created_at?: string;
}

export const useTechnicalLayoutWidgets = (layoutId?: number) => {
    return useQuery<TechnicalLayoutWidget[]>({
        queryKey: ['technical-layout-widgets', layoutId],
        queryFn: async () => {
            return api.get('technical-layout-widgets', {
                searchParams: layoutId ? { technical_layout_id: layoutId } : undefined
            }).json<TechnicalLayoutWidget[]>();
        },
        enabled: !!layoutId
    });
};

export const useAddTechnicalLayoutWidget = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<TechnicalLayoutWidget>) => {
            return api.post('technical-layout-widgets', { json: data }).json<TechnicalLayoutWidget>();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['technical-layout-widgets', variables.technical_layout_id] });
        }
    });
};

export const useUpdateTechnicalLayoutWidget = (layoutId?: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number, data: Partial<TechnicalLayoutWidget> }) => {
            return api.put(`technical-layout-widgets/${id}`, { json: data }).json<TechnicalLayoutWidget>();
        },
        onSuccess: () => {
            if (layoutId) queryClient.invalidateQueries({ queryKey: ['technical-layout-widgets', layoutId] });
            else queryClient.invalidateQueries({ queryKey: ['technical-layout-widgets'] });
        }
    });
};

export const useDeleteTechnicalLayoutWidget = (layoutId?: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`technical-layout-widgets/${id}`);
        },
        onSuccess: () => {
            if (layoutId) queryClient.invalidateQueries({ queryKey: ['technical-layout-widgets', layoutId] });
            else queryClient.invalidateQueries({ queryKey: ['technical-layout-widgets'] });
        }
    });
};
