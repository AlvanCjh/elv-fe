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
    rfwi_ref_no?: string;
    location?: string;
    gridline_zone?: string;
    date_inspected?: string;
    consultant_comments?: string;
    description?: string;
    file_path?: string;
    status: 'approve' | 'approve with comment' | 'rejected' | 'standby' | 'pending' | 'completed' | 'failed';
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
export interface RiskAssessment {
    id: number;
    project_id: number;
    created_by_user_id: string;
    title: string;
    type: 'fire' | 'hazard' | 'health' | 'security' | 'environmental' | 'other';
    risk_level: 'low' | 'medium' | 'high' | 'extreme';
    description?: string;
    mitigation_plan?: string;
    status: 'open' | 'in review' | 'mitigated' | 'closed';
    assessment_date: string;
    created_by?: User;
    project?: any;
    created_at: string;
}

export const fetchRiskAssessments = async (projectId: string): Promise<RiskAssessment[]> => {
    return api.get('risk-assessments').json<RiskAssessment[]>();
};

export const useRiskAssessments = () => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['risk-assessments', activeProjectId],
        queryFn: () => fetchRiskAssessments(activeProjectId!.toString()),
        enabled: !!activeProjectId,
    });
};

export const createRiskAssessment = async (data: any): Promise<RiskAssessment> => {
    return api.post('risk-assessments', { json: data }).json<RiskAssessment>();
};

export const updateRiskAssessment = async (id: number, data: any): Promise<RiskAssessment> => {
    return api.put(`risk-assessments/${id}`, { json: data }).json<RiskAssessment>();
};

export const deleteRiskAssessment = async (id: number): Promise<any> => {
    return api.delete(`risk-assessments/${id}`).json();
};
export interface Diagram {
    id: number;
    project_id: number;
    uploaded_by_user_id: string;
    project_title: string;
    file_path?: string;
    status: 'approve' | 'submitted';
    uploader?: User;
    created_at: string;
}

export const fetchDiagrams = async (type: 'drawing' | 'schematic', projectId: string): Promise<Diagram[]> => {
    return api.get(`diagrams/${type}`, { searchParams: { project_id: projectId } }).json<Diagram[]>();
};

export const useDiagrams = (type: 'drawing' | 'schematic') => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['diagrams', type, activeProjectId],
        queryFn: () => fetchDiagrams(type, activeProjectId!.toString()),
        enabled: !!activeProjectId,
    });
};

export const createDiagram = async (type: 'drawing' | 'schematic', formData: FormData): Promise<Diagram> => {
    return api.post(`diagrams/${type}`, { body: formData }).json<Diagram>();
};

export const updateDiagram = async (type: 'drawing' | 'schematic', id: number, formData: FormData): Promise<Diagram> => {
    // Note: We use POST with {id} for update because of multipart/form-data limitations with PUT in Laravel
    return api.post(`diagrams/${type}/${id}`, { body: formData }).json<Diagram>();
};

export const deleteDiagram = async (type: 'drawing' | 'schematic', id: number): Promise<any> => {
    return api.delete(`diagrams/${type}/${id}`).json();
};

// --- Timeline Tasks Variables ---

export interface TimelineTask {
    id: number;
    project_id: number;
    parent_id?: number | null;
    name: string;
    expected_start_date: string;
    expected_end_date: string;
    actual_start_date?: string | null;
    actual_end_date?: string | null;
    edit_reason?: string | null;
}

export interface TimelineHistory {
    id: number;
    project_id: number;
    timeline_task_id?: number | null;
    user_id: number;
    entity_name: string;
    change_details: string;
    reason: string;
    created_at: string;
    user?: User;
}

export const fetchTimelineTasks = async (projectId: string, parentId?: string | null): Promise<TimelineTask[]> => {
    const searchParams: any = {};
    if (parentId !== undefined) searchParams.parent_id = parentId;
    return api.get('timeline-tasks', { searchParams }).json<TimelineTask[]>();
};

export const fetchTimelineTask = async (id: number): Promise<TimelineTask> => {
    return api.get(`timeline-tasks/${id}`).json<TimelineTask>();
};

export const useTimelineTasks = (parentId?: string | null) => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['timeline-tasks', activeProjectId, parentId],
        queryFn: () => fetchTimelineTasks(activeProjectId!.toString(), parentId),
        enabled: !!activeProjectId,
    });
};

export const useTimelineTask = (id?: number | null) => {
    return useQuery({
        queryKey: ['timeline-task', id],
        queryFn: () => fetchTimelineTask(id!),
        enabled: !!id,
    });
};

export const createTimelineTask = async (data: any): Promise<TimelineTask> => {
    return api.post('timeline-tasks', { json: data }).json<TimelineTask>();
};

export const updateTimelineTask = async (id: number, data: any): Promise<TimelineTask> => {
    return api.put(`timeline-tasks/${id}`, { json: data }).json<TimelineTask>();
};

export const deleteTimelineTask = async (id: number): Promise<any> => {
    return api.delete(`timeline-tasks/${id}`).json();
};

export const updateProjectBounds = async (projectId: number, data: { start_date?: string, end_date?: string, actual_start_date?: string, actual_end_date?: string, edit_reason?: string }): Promise<any> => {
    return api.put(`projects/${projectId}`, { json: data }).json();
};

export const fetchTimelineHistory = async (projectId: string): Promise<TimelineHistory[]> => {
    return api.get('timeline/history').json<TimelineHistory[]>();
};

export const useTimelineHistory = () => {
    const { activeProjectId } = useProject();
    return useQuery({
        queryKey: ['timeline-history', activeProjectId],
        queryFn: () => fetchTimelineHistory(activeProjectId!.toString()),
        enabled: !!activeProjectId,
    });
};
