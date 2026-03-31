import { FC, useState } from 'react';
import { 
    Typography, Paper, Box, Button, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, 
    CircularProgress, Chip, Grid, MenuItem, Select, FormControl, InputLabel, useTheme, alpha 
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useProject } from '@/context/ProjectContext';
import { 
    useMaintenanceTasks, useAddMaintenanceTask, 
    useUpdateMaintenanceTask, useDeleteMaintenanceTask, MaintenanceTask 
} from './maintenanceApi';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';

interface MaintenanceListViewProps {
    type: 'internal' | 'external';
    title: string;
    description: string;
    icon: string;
    color: string;
}

const STATUS_OPTIONS = [
    { label: 'Scheduled', value: 'scheduled', color: 'bg-blue-500' },
    { label: 'In Progress', value: 'in-progress', color: 'bg-amber-500' },
    { label: 'Completed', value: 'completed', color: 'bg-emerald-500' },
    { label: 'Cancelled', value: 'cancelled', color: 'bg-rose-500' },
];

export const MaintenanceListView: FC<MaintenanceListViewProps> = ({ type, title, description, icon, color }) => {
    const theme = useTheme();
    const { activeProjectId } = useProject();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);

    // Form state
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [status, setStatus] = useState('scheduled');

    const { data: tasks = [], isLoading } = useMaintenanceTasks(activeProjectId, type);
    const addMutation = useAddMaintenanceTask();
    const updateMutation = useUpdateMaintenanceTask();
    const deleteMutation = useDeleteMaintenanceTask();

    const handleOpenDialog = (task?: MaintenanceTask) => {
        if (task) {
            setEditingTask(task);
            setTaskTitle(task.title);
            setTaskDesc(task.description || '');
            setAssignedTo(task.assigned_to || '');
            setDate(task.date || format(new Date(), 'yyyy-MM-dd'));
            setStatus(task.status);
        } else {
            setEditingTask(null);
            setTaskTitle('');
            setTaskDesc('');
            setAssignedTo('');
            setDate(format(new Date(), 'yyyy-MM-dd'));
            setStatus('scheduled');
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!activeProjectId || !taskTitle.trim()) return;

        const payload = {
            project_id: activeProjectId,
            type,
            title: taskTitle,
            description: taskDesc,
            assigned_to: assignedTo,
            date,
            status
        };

        try {
            if (editingTask) {
                await updateMutation.mutateAsync({ id: editingTask.id, payload });
                enqueueSnackbar('Maintenance task updated', { variant: 'success' });
            } else {
                await addMutation.mutateAsync(payload);
                enqueueSnackbar('Maintenance task added', { variant: 'success' });
            }
            setIsDialogOpen(false);
        } catch (error) {
            enqueueSnackbar('Failed to save task', { variant: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this maintenance task?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            enqueueSnackbar('Task deleted', { variant: 'info' });
        } catch (error) {
            enqueueSnackbar('Failed to delete task', { variant: 'error' });
        }
    };

    const getStatusInfo = (val: string) => STATUS_OPTIONS.find(o => o.value === val) || STATUS_OPTIONS[0];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-950">
                <CircularProgress sx={{ color: '#6366f1' }} size={48} />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div className="flex items-center gap-6">
                        <Box className={`w-16 h-16 rounded-[2rem] bg-gradient-to-br ${color} flex items-center justify-center shadow-xl shadow-indigo-500/10`}>
                            <FuseSvgIcon size={32} className="text-white">{icon}</FuseSvgIcon>
                        </Box>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">{description}</p>
                        </div>
                    </div>

                    <Button 
                        variant="contained"
                        onClick={() => handleOpenDialog()}
                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] px-8 py-4 font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
                    >
                        Schedule Task
                    </Button>
                </div>

                {/* Task Grid */}
                <Grid container spacing={4}>
                    {tasks.map((task) => {
                        const sInfo = getStatusInfo(task.status);
                        return (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={task.id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 h-full flex flex-col hover:border-indigo-500/50 transition-all group relative overflow-hidden shadow-sm hover:shadow-2xl dark:shadow-none"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`px-4 py-1.5 rounded-full ${sInfo.color}/10 flex items-center gap-2 border border-${sInfo.color.split('-')[1]}-500/20`}>
                                            <div className={`w-2 h-2 rounded-full ${sInfo.color}`} />
                                            <Typography className={`text-[10px] font-black uppercase tracking-widest text-${sInfo.color.split('-')[1]}-600 dark:text-${sInfo.color.split('-')[1]}-400`}>
                                                {sInfo.label}
                                            </Typography>
                                        </div>
                                        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                                            {task.date ? format(new Date(task.date), 'MMM dd, yyyy') : 'No Date'}
                                        </Typography>
                                    </div>

                                    <Typography className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-indigo-500 transition-colors">
                                        {task.title}
                                    </Typography>
                                    
                                    <Typography className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 line-clamp-3">
                                        {task.description || 'No detailed instructions provided for this maintenance task.'}
                                    </Typography>

                                    <Box className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200 dark:border-slate-700">
                                                {task.assigned_to?.[0] || 'A'}
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Assigned to</p>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{task.assigned_to || 'Unassigned'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <IconButton size="small" onClick={() => handleOpenDialog(task)} className="text-slate-400 hover:text-indigo-500 cursor-pointer">
                                                <FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(task.id)} className="text-slate-400 hover:text-rose-500 cursor-pointer">
                                                <FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
                                            </IconButton>
                                        </div>
                                    </Box>
                                </motion.div>
                            </Grid>
                        );
                    })}
                    {tasks.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <div className="py-24 flex flex-col items-center gap-6">
                                <Box className="w-20 h-20 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                    <FuseSvgIcon size={40}>{icon}</FuseSvgIcon>
                                </Box>
                                <div className="text-center">
                                    <Typography className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">No Scheduled tasks</Typography>
                                    <Typography className="text-sm text-slate-500 font-medium">Clear for now. Start by scheduling a new maintenance check.</Typography>
                                </div>
                            </div>
                        </Grid>
                    )}
                </Grid>
            </div>

            {/* Dialog */}
            <Dialog 
                open={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: '32px', padding: '16px', maxWidth: '500px', width: '100%', backgroundImage: 'none', bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff' }
                }}
            >
                <DialogTitle>
                    <div className="flex items-center gap-3">
                        <Box className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center`}>
                            <FuseSvgIcon size={20}>{icon}</FuseSvgIcon>
                        </Box>
                        <Typography className="text-xl font-black">{editingTask ? 'Edit Task' : 'Schedule New Task'}</Typography>
                    </div>
                </DialogTitle>
                <DialogContent>
                    <div className="flex flex-col gap-5 pt-4">
                        <TextField
                            label="Task Title"
                            fullWidth
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }}
                        />
                        <TextField
                            label="Detailed Description"
                            multiline
                            rows={3}
                            fullWidth
                            value={taskDesc}
                            onChange={(e) => setTaskDesc(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }}
                        />
                        <div className="flex gap-4">
                            <TextField
                                label="Assigned Personnel / Team"
                                fullWidth
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }}
                            />
                            <TextField
                                label="Execution Date"
                                type="date"
                                fullWidth
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                slotProps={{ 
                                    input: { sx: { borderRadius: '16px', fontWeight: 700 } },
                                    inputLabel: { shrink: true }
                                }}
                            />
                        </div>
                        <FormControl fullWidth>
                            <InputLabel>Current Status</InputLabel>
                            <Select
                                value={status}
                                label="Current Status"
                                onChange={(e) => setStatus(e.target.value)}
                                sx={{ borderRadius: '16px', fontWeight: 700 }}
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value} className="font-bold uppercase text-xs tracking-widest">
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </DialogContent>
                <DialogActions className="p-6 pt-2">
                    <Button onClick={() => setIsDialogOpen(false)} className="rounded-xl font-black uppercase tracking-widest px-6">Cancel</Button>
                    <Button 
                        onClick={handleSave}
                        variant="contained" 
                        color="secondary"
                        disabled={!taskTitle || addMutation.isPending || updateMutation.isPending}
                        className="rounded-2xl font-black uppercase tracking-widest px-10 py-3.5 shadow-lg shadow-indigo-500/20 bg-indigo-600"
                    >
                        {(addMutation.isPending || updateMutation.isPending) ? <CircularProgress size={20} color="inherit" /> : editingTask ? 'Update Schedule' : 'Confirm Schedule'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
