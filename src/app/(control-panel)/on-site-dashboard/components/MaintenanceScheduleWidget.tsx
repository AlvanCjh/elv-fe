import { Paper, Typography, Box } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

export interface MaintenanceTask {
    id: string;
    title: string;
    description: string;
    system: string;
    time: string;
    status: 'Scheduled' | 'In Progress' | 'Completed';
}

interface MaintenanceScheduleProps {
    dateLabel: string;
    tasks: MaintenanceTask[];
}

function MaintenanceScheduleWidget({ dateLabel, tasks }: MaintenanceScheduleProps) {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'In Progress': return 'info';
            default: return 'warning';
        }
    };

    return (
        <Paper className="p-6 sm:p-8 rounded-3xl shadow-md border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <FuseSvgIcon className="text-amber-500">heroicons-outline:wrench-screwdriver</FuseSvgIcon>
                    <Typography variant="h6" className="font-bold text-gray-800 dark:text-gray-100 leading-none">
                        {dateLabel} Maintenance
                    </Typography>
                </div>
                <Typography variant="caption" className="text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                    {tasks.length} Tasks
                </Typography>
            </div>

            <Box className="flex-1 overflow-y-auto pr-2 -mr-2">
                {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <FuseSvgIcon size={48} className="text-gray-300 dark:text-gray-600 mb-2">heroicons-outline:calendar-days</FuseSvgIcon>
                        <Typography variant="body2" color="text.secondary">No maintenance tasks scheduled.</Typography>
                    </div>
                ) : (
                    <Timeline sx={{ p: 0, m: 0 }}>
                        {tasks.map((task, index) => (
                            <TimelineItem key={task.id} sx={{ '&::before': { display: 'none' } }}>
                                <TimelineSeparator>
                                    <TimelineDot color={getStatusColor(task.status)} variant={task.status === 'Completed' ? 'filled' : 'outlined'} sx={{ my: 1 }} />
                                    {index < tasks.length - 1 && <TimelineConnector sx={{ bgcolor: 'grey.200' }} />}
                                </TimelineSeparator>
                                <TimelineContent sx={{ py: '8px', px: 2 }}>
                                    <Typography variant="subtitle2" component="span" className="font-bold text-gray-800 dark:text-gray-100">
                                        {task.title}
                                    </Typography>
                                    <div className="flex items-center gap-2 mt-0.5 mb-1">
                                        <Typography variant="caption" className="text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                            {task.system}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" className="flex items-center gap-1">
                                            <FuseSvgIcon size={14}>heroicons-outline:clock</FuseSvgIcon>
                                            {task.time}
                                        </Typography>
                                    </div>
                                    <Typography variant="caption" color="text.secondary" className="line-clamp-2">
                                        {task.description}
                                    </Typography>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                )}
            </Box>
        </Paper>
    );
}

export default MaintenanceScheduleWidget;
