import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    MenuItem, 
    Box, 
    Typography,
    Avatar,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '../../../../context/ProjectContext';
import { useUsers, createAttendance, updateAttendance, deleteAttendance, Attendance } from '../scheduleApi';
import { 
    Notes as RemarksIcon,
    Work as WorkIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

interface AttendanceDialogProps {
    open: boolean;
    onClose: () => void;
    initialDate: Date;
    attendance?: Attendance;
}

const ATTENDANCE_STATUSES = [
    { label: 'Morning', color: '#3b82f6' },
    { label: 'Night', color: '#111827' },
    { label: 'Rest day', color: '#10b981' },
    { label: 'Off day', color: '#ef4444' },
    { label: 'Walk on rest day morning', color: '#3b82f6' },
    { label: 'Walk on rest day night', color: '#1d4ed8' },
    { label: 'Annual leave', color: '#f59e0b' },
    { label: 'OST', color: '#6b7280' },
    { label: 'PH (public holiday)', color: '#8b5cf6' },
    { label: 'MC', color: '#ec4899' },
];

const AttendanceDialog: React.FC<AttendanceDialogProps> = ({ open, onClose, initialDate, attendance }) => {
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();
    const { data: users = [] } = useUsers();
    
    const [userId, setUserId] = useState(attendance?.user_id || '');
    const [status, setStatus] = useState(attendance?.status || 'Morning');
    const [remarks, setRemarks] = useState(attendance?.remarks || '');

    const createMutation = useMutation({
        mutationFn: createAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance', activeProjectId] });
            onClose();
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateAttendance(attendance!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance', activeProjectId] });
            onClose();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteAttendance(attendance!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance', activeProjectId] });
            onClose();
        }
    });

    const handleSubmit = () => {
        const year = initialDate.getFullYear();
        const month = String(initialDate.getMonth() + 1).padStart(2, '0');
        const day = String(initialDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const data = {
            user_id: userId,
            status,
            remarks,
            date: dateStr,
            project_id: activeProjectId
        };

        if (attendance) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="xs" 
            fullWidth
            PaperProps={{
                className: "rounded-[40px] p-4 shadow-2xl dark:bg-gray-900 border-none"
            }}
        >
            <DialogTitle className="flex items-center gap-3">
                <Box className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <WorkIcon />
                </Box>
                <div className="flex flex-col">
                    <Typography className="font-black tracking-tight" variant="h6">
                        {attendance ? 'Edit Personnel Shift' : 'Add Personnel Shift'}
                    </Typography>
                    <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest">
                        {initialDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Typography>
                </div>
            </DialogTitle>
            
            <DialogContent className="flex flex-col gap-6 pt-4">
                <Box>
                    <Typography variant="overline" className="font-black text-gray-400 tracking-widest mb-2 block">Whose shift</Typography>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel size="small">Select Personnel</InputLabel>
                        <Select
                            label="Select Personnel"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value as string)}
                            className="rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-none font-bold"
                            size="small"
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {users.map((user) => (
                                <MenuItem key={user.id} value={user.id} className="p-3">
                                    <Box className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8 font-black bg-blue-500 text-[10px] uppercase">
                                            {user.name.substring(0, 2)}
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm tracking-tight">{user.name}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">{user.email}</span>
                                        </div>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Box>
                    <Typography variant="overline" className="font-black text-gray-400 tracking-widest mb-1 block">Shift Status</Typography>
                    <TextField
                        select
                        fullWidth
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        variant="outlined"
                        InputProps={{
                            className: "rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-none font-bold",
                        }}
                    >
                        {ATTENDANCE_STATUSES.map((option) => (
                            <MenuItem key={option.label} value={option.label} className="p-3">
                                <Box className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: option.color }}></div>
                                    <span className="font-bold text-sm tracking-tight">{option.label}</span>
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                <Box>
                    <Typography variant="overline" className="font-black text-gray-400 tracking-widest mb-1 block">Remarks</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Any specific notes or reasons..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        variant="outlined"
                        InputProps={{
                            className: "rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border-none font-bold",
                        }}
                    />
                </Box>
            </DialogContent>

            <DialogActions className="p-6 gap-2 flex justify-between">
                <Box>
                    {attendance && (
                        <Button 
                            color="error"
                            startIcon={<DeleteIcon fontSize="small" />}
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this attendance record?')) {
                                    deleteMutation.mutate();
                                }
                            }}
                            className="rounded-2xl font-black text-xs uppercase tracking-widest py-3 px-6"
                        >
                            Delete
                        </Button>
                    )}
                </Box>
                <Box className="flex gap-2">
                    <Button 
                        onClick={onClose} 
                        className="rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-50 py-3"
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || !userId}
                        className="bg-amber-500 hover:bg-amber-600 rounded-2xl font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-amber-500/20 py-3"
                    >
                        {attendance ? 'Save Changes' : 'Assign Shift'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default AttendanceDialog;
