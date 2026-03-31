'use client';
import { FC, useState, useMemo } from 'react';
import { 
    Typography, Paper, Box, Button, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, 
    Select, MenuItem, FormControl, InputLabel, Tooltip,
    CircularProgress, Chip, alpha, useTheme
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { 
    format, addMonths, subMonths, startOfMonth, endOfMonth, 
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
    eachDayOfInterval, parseISO 
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useProject } from '@/context/ProjectContext';
import { useAttendance, useAddAttendance, useDeleteAttendance, useUsers, AttendanceRecord } from './attendanceApi';
import { enqueueSnackbar } from 'notistack';
import useJwtAuth from '@auth/services/jwt/useJwtAuth';

const ATTENDANCE_SHIFTS = [
    'Morning',
    'Night',
    'Rest day',
    'Off day',
    'Walk on rest day morning',
    'Walk on rest day night',
    'Annual leave',
    'OST',
    'PH (public holiday)',
    'MC'
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Morning': return '#38bdf8'; // light blue
        case 'Night': return '#78350f'; // brown
        case 'Annual leave': return '#f97316'; // orange
        case 'OST': return '#64748b'; // grey
        case 'Rest day': return '#10b981'; // emerald
        case 'Off day': return '#ef4444'; // rose
        case 'PH (public holiday)': return '#8b5cf6'; // purple
        case 'MC': return '#f43f5e'; // pink
        default: return '#6366f1'; // indigo
    }
};

const AttendanceReportPage: FC = () => {
    const theme = useTheme();
    const { activeProjectId } = useProject();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const { user } = useJwtAuth();
    const canManageAttendance = user?.role?.includes('superadmin') || 
                                user?.role?.includes('admin') || 
                                user?.role?.includes('facilitator') || 
                                user?.role?.includes('supervisor') || 
                                user?.role?.includes('member');
    
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    
    // Form state
    const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
    const [newStatus, setNewStatus] = useState(ATTENDANCE_SHIFTS[0]);

    const { data: users = [] } = useUsers();
    const { data: records = [], isLoading } = useAttendance(activeProjectId);
    const addAttendance = useAddAttendance();
    const deleteAttendance = useDeleteAttendance();

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const recordsByDate = useMemo(() => {
        const map: Record<string, AttendanceRecord[]> = {};
        records.forEach(r => {
            const dateStr = r.date;
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(r);
        });
        return map;
    }, [records]);

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const handleToday = () => setCurrentMonth(new Date());

    const handleAddRecord = async () => {
        if (!selectedDate || !selectedUserId || !activeProjectId) return;

        const targetUser = users.find(u => u.id === String(selectedUserId));
        if (!targetUser) return;

        try {
            await addAttendance.mutateAsync({
                project_id: activeProjectId,
                user_id: String(targetUser.id),
                user_name: targetUser.name,
                date: format(selectedDate, 'yyyy-MM-dd'),
                status: newStatus
            });
            setSelectedUserId('');
            setIsAddDialogOpen(false);
            enqueueSnackbar('Attendance record added successfully', { variant: 'success' });
        } catch (error: any) {
            console.error('[Attendance] Save error:', error);
            let msg = 'Failed to add record';
            if (error?.response?.status === 422) {
                try {
                    const errorData = await error.response.json();
                    msg = errorData.message || 'Validation error. Please check all fields.';
                } catch (e) {
                    msg = 'Incomplete form. Please try again.';
                }
            }
            enqueueSnackbar(msg, { variant: 'error' });
        }
    };

    const handleDeleteRecord = async (id: number) => {
        if (!activeProjectId) return;
        try {
            await deleteAttendance.mutateAsync({ id, projectId: activeProjectId });
            enqueueSnackbar('Record deleted', { variant: 'info' });
        } catch (error) {
            enqueueSnackbar('Failed to delete record', { variant: 'error' });
        }
    };

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
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Box className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <FuseSvgIcon size={24} className="text-white">material-outline:fact_check</FuseSvgIcon>
                            </Box>
                            Attendance Report
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium ml-13">Manage and track onsite personnel shifts</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <IconButton onClick={handlePrevMonth} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                            <FuseSvgIcon size={20}>heroicons-outline:chevron-left</FuseSvgIcon>
                        </IconButton>
                        <Typography className="text-sm font-black text-slate-900 dark:text-white min-w-[140px] text-center uppercase tracking-widest">
                            {format(currentMonth, 'MMMM yyyy')}
                        </Typography>
                        <IconButton onClick={handleNextMonth} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                            <FuseSvgIcon size={20}>heroicons-outline:chevron-right</FuseSvgIcon>
                        </IconButton>
                        <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
                        <Button 
                            onClick={handleToday}
                            className="rounded-xl text-xs font-black uppercase tracking-widest px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            Today
                        </Button>
                    </div>
                </div>

                <Paper className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl dark:shadow-2xl">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-4 text-center">
                                <Typography className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{day}</Typography>
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day, idx) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const dayRecords = recordsByDate[dateStr] || [];
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <motion.div
                                    key={dateStr}
                                    whileHover={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)' }}
                                    onClick={() => setSelectedDate(day)}
                                    className={`relative min-h-[140px] border-r border-b border-slate-100 dark:border-slate-800 p-3 cursor-pointer transition-all ${!isCurrentMonth ? 'opacity-30 grayscale' : ''} ${isSelected ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-500/5 z-10' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        {dayRecords.length > 0 && (
                                            <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                {dayRecords.length} Shifts
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 overflow-hidden">
                                        {dayRecords.slice(0, 3).map((r, i) => {
                                            const uName = r.user?.name || r.user_name || 'Staff';
                                            return (
                                                <div key={i} className="flex items-center gap-1.5 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-200/50 dark:border-slate-700/50">
                                                    <div 
                                                        className="w-1 h-3 rounded-full" 
                                                        style={{ backgroundColor: getStatusColor(r.status) }}
                                                    />
                                                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate tracking-tight">{uName}</p>
                                                </div>
                                            );
                                        })}
                                        {dayRecords.length > 3 && (
                                            <p className="text-[9px] font-black text-slate-400 uppercase ml-2 mt-1">+{dayRecords.length - 3} more</p>
                                        )}
                                    </div>

                                    {isSelected && (
                                        <motion.div 
                                            layoutId="indicator"
                                            className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </Paper>
            </div>

            {/* Side Detail Panel / Selection View */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[1100] border-l border-slate-200 dark:border-slate-800 p-8 overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                    {format(selectedDate, 'do MMMM')}
                                </h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">{format(selectedDate, 'EEEE')}</p>
                            </div>
                            <IconButton onClick={() => setSelectedDate(null)} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                                <FuseSvgIcon size={24}>heroicons-outline:x-mark</FuseSvgIcon>
                            </IconButton>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Shifts</h4>
                                {canManageAttendance && (
                                    <Button 
                                        onClick={() => setIsAddDialogOpen(true)}
                                        size="small" 
                                        className="rounded-lg text-[10px] font-black bg-indigo-500 text-white hover:bg-indigo-600 px-4"
                                    >
                                        Add New
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {recordsByDate[format(selectedDate, 'yyyy-MM-dd')]?.map(r => {
                                    const uName = r.user?.name || r.user_name || 'Staff Member';
                                    return (
                                        <div key={r.id} className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-500/30">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-900 dark:text-white">
                                                    {uName[0] || 'S'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white">{uName}</p>
                                                    <Chip 
                                                        label={r.status} 
                                                        size="small" 
                                                        className="h-5 text-[9px] font-black uppercase tracking-wider text-white mt-1"
                                                        style={{ backgroundColor: getStatusColor(r.status) }}
                                                    />
                                                </div>
                                            </div>
                                            {canManageAttendance && (
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleDeleteRecord(r.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:bg-rose-500/10"
                                                >
                                                    <FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
                                                </IconButton>
                                            )}
                                        </div>
                                    );
                                })}
                                {(!recordsByDate[format(selectedDate, 'yyyy-MM-dd')] || recordsByDate[format(selectedDate, 'yyyy-MM-dd')].length === 0) && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <Box className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                            <FuseSvgIcon size={32} className="text-slate-300 dark:text-slate-600">heroicons-outline:user-group</FuseSvgIcon>
                                        </Box>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No entries for this day</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Record Dialog */}
            <Dialog 
                open={isAddDialogOpen} 
                onClose={() => setIsAddDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: '32px',
                        padding: '16px',
                        maxWidth: '400px',
                        width: '100%'
                    }
                }}
            >
                <DialogTitle>
                    <div className="flex items-center gap-3">
                        <Box className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <FuseSvgIcon size={20}>heroicons-outline:user-plus</FuseSvgIcon>
                        </Box>
                        <Typography className="text-xl font-black">Add Personnel Shift</Typography>
                    </div>
                </DialogTitle>
                <DialogContent>
                    <div className="flex flex-col gap-6 pt-4">
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Select Personnel</InputLabel>
                            <Select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value as number)}
                                label="Select Personnel"
                                sx={{ borderRadius: '16px', fontWeight: 700 }}
                            >
                                {users.map(u => (
                                    <MenuItem key={u.id} value={Number(u.id)} className="font-bold">
                                        {u.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Shift Status</InputLabel>
                            <Select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                label="Shift Status"
                                sx={{ borderRadius: '16px', fontWeight: 700 }}
                            >
                                {ATTENDANCE_SHIFTS.map(status => (
                                    <MenuItem key={status} value={status} className="font-bold flex items-center gap-3">
                                        <Box 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: getStatusColor(status) }} 
                                        />
                                        {status}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </DialogContent>
                <DialogActions className="p-6">
                    <Button onClick={() => setIsAddDialogOpen(false)} className="rounded-xl font-black uppercase tracking-widest px-6">Cancel</Button>
                    <Button 
                        onClick={handleAddRecord}
                        variant="contained" 
                        color="secondary"
                        disabled={!selectedUserId || addAttendance.isPending}
                        className="rounded-xl font-black uppercase tracking-widest px-8 py-3 shadow-lg shadow-indigo-500/20"
                    >
                        {addAttendance.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Shift'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AttendanceReportPage;
