import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Divider, IconButton } from '@mui/material';
import { Close as CloseIcon, CalendarToday as CalendarIcon, Person as UserIcon, Groups as TeamIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSchedule, updateSchedule, useUsers, Schedule } from '../scheduleApi';
import { useProject } from '../../../../context/ProjectContext';

interface ScheduleDialogProps {
    open: boolean;
    onClose: () => void;
    initialDate: Date;
    schedule?: Schedule;
}

const ScheduleDialog: React.FC<ScheduleDialogProps> = ({ open, onClose, initialDate, schedule }) => {
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();
    const { data: users = [] } = useUsers();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [assignedToUserId, setAssignedToUserId] = useState<string>('');
    const [assignedTeam, setAssignedTeam] = useState('');

    useEffect(() => {
        if (open) {
            if (schedule) {
                const fullDate = schedule.start_date;
                const dPart = fullDate.includes('T') ? fullDate.split('T')[0] : fullDate.split(' ')[0];
                const tPart = fullDate.includes('T') ? fullDate.split('T')[1].substring(0, 5) : (fullDate.includes(' ') ? fullDate.split(' ')[1].substring(0, 5) : '09:00');
                
                setTitle(schedule.title);
                setDescription(schedule.description || '');
                setStartDate(dPart);
                setStartTime(tPart);
                setAssignedToUserId(schedule.assigned_to_user_id || '');
                setAssignedTeam(schedule.assigned_team || '');
            } else {
                setTitle('');
                setDescription('');
                const year = initialDate.getFullYear();
                const month = String(initialDate.getMonth() + 1).padStart(2, '0');
                const day = String(initialDate.getDate()).padStart(2, '0');
                setStartDate(`${year}-${month}-${day}`);
                setStartTime(initialDate.toTimeString().split(' ')[0].substring(0, 5));
                setAssignedToUserId('');
                setAssignedTeam('');
            }
        }
    }, [open, initialDate, schedule]);

    const createMutation = useMutation({
        mutationFn: (data: any) => createSchedule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules', activeProjectId] });
            onClose();
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateSchedule(schedule!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules', activeProjectId] });
            onClose();
        }
    });

    const handleSave = () => {
        const payload = {
            title,
            description,
            start_date: `${startDate} ${startTime}:00`,
            project_id: activeProjectId,
            assigned_to_user_id: assignedToUserId || null,
            assigned_team: assignedTeam || null,
            status: schedule?.status || 'scheduled'
        };

        if (schedule) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                className: "rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800"
            }}
        >
            <DialogTitle className="flex justify-between items-center p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <CalendarIcon fontSize="small" />
                    </div>
                    <div>
                        <Typography variant="h6" className="font-black uppercase tracking-tight leading-none mb-1">
                            {schedule ? 'Edit Report Task' : 'New Report Task'}
                        </Typography>
                        <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest">
                            {schedule ? 'Update assignment' : 'Add to Schedule'}
                        </Typography>
                    </div>
                </div>
                <IconButton onClick={onClose} size="small" className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent className="p-8">
                <Box className="flex flex-col gap-6">
                    <TextField
                        label="Task / Report Title"
                        placeholder="e.g. Weekly Site Inspection"
                        fullWidth
                        size="small"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="rounded-xl"
                    />

                    <TextField
                        label="Description"
                        placeholder="Add more context about this task..."
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-xl"
                    />

                    <Box className="grid grid-cols-2 gap-4">
                        <TextField
                            label="Start Date"
                            type="date"
                            size="small"
                            fullWidth
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            className="rounded-xl"
                        />
                        
                        <TextField
                            label="Start Time"
                            type="time"
                            size="small"
                            fullWidth
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            className="rounded-xl"
                        />
                    </Box>

                    <Box className="grid grid-cols-2 gap-4">
                        <FormControl fullWidth size="small">
                            <InputLabel>Assign Team</InputLabel>
                            <Select
                                value={assignedTeam}
                                label="Assign Team"
                                onChange={(e) => setAssignedTeam(e.target.value)}
                                className="rounded-xl"
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                <MenuItem value="Electrical">Electrical Team</MenuItem>
                                <MenuItem value="Structural">Structural Team</MenuItem>
                                <MenuItem value="Management">Management</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Assign To User</InputLabel>
                            <Select
                                value={assignedToUserId}
                                label="Assign To User"
                                onChange={(e) => setAssignedToUserId(e.target.value as string)}
                                className="rounded-xl"
                            >
                                <MenuItem value=""><em>Unassigned</em></MenuItem>
                                {users.map((user) => (
                                    <MenuItem key={user.id} value={user.id}>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs">{user.name}</span>
                                            <span className="text-[10px] text-gray-400">{user.email}</span>
                                        </div>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Box className="mt-4">
                        <Button 
                            variant="contained" 
                            fullWidth 
                            className="bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 text-sm uppercase tracking-widest"
                            onClick={handleSave}
                            disabled={isPending}
                            startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : null}
                        >
                            {schedule ? 'Update Task' : 'Save Task'}
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleDialog;
