export const PIN_COLORS: Record<string, string> = {
    Fix1: '#3B82F6', // Blue
    Fix2: '#F59E0B', // Amber
    Finish: '#FCD34D', // Yellow/Amber
    Pending: '#EF4444', // Red
    Completed: '#10B981', // Emerald
    Approved: '#059669', // Darker Green for Approved
};

export const PIN_LABELS: Record<string, string> = {
    Fix1: 'Fix1 (Cable Pulling)',
    Fix2: 'Fix2 (Equipment Mont)',
    Finish: 'Work Finished',
    Pending: 'Pending / Issues',
    Completed: 'Completed',
    Approved: 'Approved / Site Inspected',
};

export const PIN_STATUSES = ['Fix1', 'Fix2', 'Finish', 'Pending', 'Completed', 'Approved'] as const;

export type PinStatus = typeof PIN_STATUSES[number];
