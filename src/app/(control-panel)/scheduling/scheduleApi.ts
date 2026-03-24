import { api } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '../../../context/ProjectContext';

export interface User {
    id: string;
    name: string;
    displayName?: string;
    email: string;
    role: string[];
}

export interface Schedule {
    id: number;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    assigned_to_user_id?: string;
    assigned_team?: string;
    project_id: number;
    created_by_user_id: string;
    status: string;
    assigned_to_user?: User;
    created_by?: User;
}

export interface Attendance {
    id: number;
    user_id: string;
    date: string;
    status: string; // Morning, Night, Rest day, Off day, etc.
    remarks?: string;
    project_id: number;
    user?: User;
}

export const fetchSchedules = async (projectId: string): Promise<Schedule[]> => {
    return api.get('schedules', { searchParams: { project_id: projectId } }).json<Schedule[]>();
};

export const useSchedules = () => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['schedules', activeProjectId],
        queryFn: () => fetchSchedules(activeProjectId.toString()),
        enabled: !!activeProjectId,
    });
};

export const fetchAttendance = async (projectId: string): Promise<Attendance[]> => {
    try {
        const response = await api.get('attendance', { searchParams: { project_id: projectId } });
        return await response.json<Attendance[]>();
    } catch (e) {
        console.warn('Attendance API not found');
        return [];
    }
};

export const useAttendance = () => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['attendance', activeProjectId],
        queryFn: () => fetchAttendance(activeProjectId.toString()),
        enabled: !!activeProjectId,
    });
};

export const fetchUsers = async (): Promise<User[]> => {
    return api.get('users').json<User[]>();
};

export const useUsers = () => {
    return useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
    });
};

export const createSchedule = async (data: any): Promise<Schedule> => {
    return api.post('schedules', { json: data }).json<Schedule>();
};

export const updateSchedule = async (id: number, data: any): Promise<Schedule> => {
    return api.put(`schedules/${id}`, { json: data }).json<Schedule>();
};

export const deleteSchedule = async (id: number): Promise<any> => {
    return api.delete(`schedules/${id}`).json();
};

export const createAttendance = async (data: any): Promise<Attendance> => {
    return api.post('attendance', { json: data }).json<Attendance>();
};

export const updateAttendance = async (id: number, data: any): Promise<Attendance> => {
    return api.put(`attendance/${id}`, { json: data }).json<Attendance>();
};

export const deleteAttendance = async (id: number): Promise<any> => {
    return api.delete(`attendance/${id}`).json();
};
export interface InspectionReport {
    id: number;
    project_id: number;
    assigned_to_user_id: string;
    created_by_user_id: string;
    title: string;
    description?: string;
    file_path?: string;
    status: 'pending' | 'completed';
    inspection_date: string;
    assigned_to_user?: User;
    created_by?: User;
    created_at: string;
}

export interface MaintenanceReport {
    id: number;
    project_id: number;
    assigned_to_user_id: string;
    created_by_user_id: string;
    title: string;
    description?: string;
    image_path?: string; // Maintenance uses images
    status: 'pending' | 'completed';
    maintenance_date: string;
    assigned_to_user?: User;
    created_by?: User;
    created_at: string;
}

export const fetchInspectionReports = async (projectId: string, startDate?: string, endDate?: string): Promise<InspectionReport[]> => {
    const searchParams: any = { project_id: projectId };
    if (startDate) searchParams.start_date = startDate;
    if (endDate) searchParams.end_date = endDate;
    return api.get('inspection-reports', { searchParams }).json<InspectionReport[]>();
};

export const useInspectionReports = (startDate?: string, endDate?: string) => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['inspection-reports', activeProjectId, startDate, endDate],
        queryFn: () => fetchInspectionReports(activeProjectId!.toString(), startDate, endDate),
        enabled: !!activeProjectId,
    });
};

export const createInspectionReport = async (formData: FormData): Promise<InspectionReport> => {
    return api.post('inspection-reports', { body: formData }).json<InspectionReport>();
};

export const updateInspectionReport = async (id: number, formData: FormData): Promise<InspectionReport> => {
    formData.append('_method', 'PUT');
    return api.post(`inspection-reports/${id}`, { body: formData }).json<InspectionReport>();
};

export const deleteInspectionReport = async (id: number): Promise<any> => {
    return api.delete(`inspection-reports/${id}`).json();
};

export const fetchMaintenanceReports = async (projectId: string, startDate?: string, endDate?: string): Promise<MaintenanceReport[]> => {
    const searchParams: any = { project_id: projectId };
    if (startDate) searchParams.start_date = startDate;
    if (endDate) searchParams.end_date = endDate;
    return api.get('maintenance-reports', { searchParams }).json<MaintenanceReport[]>();
};

export const useMaintenanceReports = (startDate?: string, endDate?: string) => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['maintenance-reports', activeProjectId, startDate, endDate],
        queryFn: () => fetchMaintenanceReports(activeProjectId!.toString(), startDate, endDate),
        enabled: !!activeProjectId,
    });
};

export const createMaintenanceReport = async (formData: FormData): Promise<MaintenanceReport> => {
    return api.post('maintenance-reports', { body: formData }).json<MaintenanceReport>();
};

export const updateMaintenanceReport = async (id: number, formData: FormData): Promise<MaintenanceReport> => {
    formData.append('_method', 'PUT');
    return api.post(`maintenance-reports/${id}`, { body: formData }).json<MaintenanceReport>();
};

export const deleteMaintenanceReport = async (id: number): Promise<any> => {
    return api.delete(`maintenance-reports/${id}`).json();
};
