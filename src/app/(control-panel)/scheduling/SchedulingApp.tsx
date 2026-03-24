import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, Typography, Button, Paper, Chip, IconButton } from '@mui/material';
import { 
    Add as PlusIcon, 
    CalendarMonth as CalendarIcon, 
    AccessTime as ClockIcon, 
    Person as UserIcon 
} from '@mui/icons-material';
import { 
    useSchedules, 
    Schedule, 
    updateSchedule, 
    deleteSchedule,
    useUsers,
    useAttendance,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    Attendance
} from './scheduleApi';
import ScheduleDialog from './components/ScheduleDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '../../../context/ProjectContext';
import { 
    Delete as DeleteIcon,
    CheckCircle as CheckIcon,
    Edit as EditIcon,
    MoreVert as MoreIcon,
    Groups as TeamIcon,
    Close as CloseIcon,
    CheckCircle as DoneIcon
} from '@mui/icons-material';
import TaskOverview from './components/TaskOverview';
import AttendanceDialog from './components/AttendanceDialog';


const SchedulingApp: React.FC = () => {
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();
    const [activeTab, setActiveTab] = useState<'scheduling' | 'attendance'>('scheduling');
    const { data: schedules = [], isLoading: isLoadingSchedules } = useSchedules();
    const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useAttendance();
    
    const updateAttendanceMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => updateAttendance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance', activeProjectId] });
        }
    });

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isAttendanceAddDialogOpen, setIsAttendanceAddDialogOpen] = useState(false);
    const [isAttendanceEditDialogOpen, setIsAttendanceEditDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
    const [selectedAttendanceId, setSelectedAttendanceId] = useState<number | null>(null);
    const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
    const selectedAttendance = attendanceRecords.find(a => a.id === selectedAttendanceId);

    const updateScheduleMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => updateSchedule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules', activeProjectId] });
        }
    });

    const deleteScheduleMutation = useMutation({
        mutationFn: (id: number) => deleteSchedule(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules', activeProjectId] });
            setSelectedScheduleId(null);
        }
    });

    const handleDateClick = (arg: any) => {
        setSelectedDate(arg.date);
        if (activeTab === 'scheduling') {
            setIsAddDialogOpen(true);
        } else {
            setIsAttendanceAddDialogOpen(true);
        }
    };

    const handleEventClick = (arg: any) => {
        setSelectedScheduleId(parseInt(arg.event.id));
    };

    const handleEventChange = (changeInfo: any) => {
        const { event } = changeInfo;
        const start = event.startStr;
        const end = event.endStr;
        
        updateScheduleMutation.mutate({
            id: parseInt(event.id),
            data: {
                start_date: start.replace('T', ' ').substring(0, 19),
                end_date: end ? end.replace('T', ' ').substring(0, 19) : null
            }
        });
    };

    const handleStatusUpdate = (id: number, status: string) => {
        updateScheduleMutation.mutate({
            id,
            data: { status }
        });
    };

    const handleAttendanceChange = (changeInfo: any) => {
        const { event } = changeInfo;
        const start = event.startStr;
        
        updateAttendanceMutation.mutate({
            id: parseInt(event.id),
            data: {
                date: start.split('T')[0]
            }
        });
    };

    const events = schedules.map(s => ({
        id: s.id.toString(),
        title: s.title,
        start: s.start_date,
        end: s.end_date,
        allDay: false,
        backgroundColor: s.status === 'completed' ? '#10b981' : (s.status === 'in-progress' ? '#f59e0b' : '#3b82f6'),
        borderColor: 'transparent',
        extendedProps: { ...s }
    }));

    const attendanceEvents = attendanceRecords.map(a => {
        const statusConfig = [
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
        ].find(s => s.label === a.status);

        return {
            id: a.id.toString(),
            title: `${a.user?.name || 'User'}: ${a.status}`,
            start: a.date,
            allDay: true,
            backgroundColor: statusConfig?.color || '#3b82f6',
            borderColor: 'transparent',
            extendedProps: { ...a }
        };
    });

    return (
        <Box className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 p-6 lg:p-10 gap-8">
            <Box className="flex justify-between items-center">
                <Box className="flex flex-col gap-1">
                    <Typography variant="h4" className="font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <CalendarIcon sx={{ fontSize: 32 }} className="text-blue-500" />
                        Scheduling & Reports
                    </Typography>
                    
                    <Box className="flex gap-4 mt-2">
                        <Button 
                            disableElevation
                            className={`rounded-xl px-6 py-2 transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'scheduling' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-gray-800'}`}
                            onClick={() => setActiveTab('scheduling')}
                        >
                            Report Schedule
                        </Button>
                        <Button 
                            disableElevation
                            className={`rounded-xl px-6 py-2 transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-gray-800'}`}
                            onClick={() => setActiveTab('attendance')}
                        >
                            Attendance Report
                        </Button>
                    </Box>
                </Box>
                {activeTab === 'scheduling' ? (
                    <Button 
                        variant="contained" 
                        startIcon={<PlusIcon sx={{ fontSize: 18 }} />}
                        className="bg-blue-600 hover:bg-blue-700 py-3 px-6 rounded-2xl font-black shadow-xl shadow-blue-500/20 text-sm uppercase tracking-widest"
                        onClick={() => {
                            setSelectedDate(new Date());
                            setIsAddDialogOpen(true);
                        }}
                    >
                        Add Report
                    </Button>
                ) : (
                    <Button 
                        variant="contained" 
                        startIcon={<PlusIcon sx={{ fontSize: 18 }} />}
                        className="bg-amber-500 hover:bg-amber-600 py-3 px-6 rounded-2xl font-black shadow-xl shadow-amber-500/20 text-sm uppercase tracking-widest"
                        onClick={() => {
                            setSelectedDate(new Date());
                            // TODO: setIsAttendanceAddDialogOpen(true);
                            setIsAttendanceAddDialogOpen(true);
                        }}
                    >
                        Add Personnel Shift
                    </Button>
                )}
            </Box>

            {activeTab === 'scheduling' ? (
                <Box className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1 min-h-0">
                    <Paper className="xl:col-span-3 rounded-3xl border-none shadow-2xl shadow-gray-200/50 dark:shadow-none p-6 min-h-[600px] bg-white dark:bg-gray-900">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay'
                            }}
                            events={events}
                            dateClick={handleDateClick}
                            eventClick={handleEventClick}
                            eventDrop={handleEventChange}
                            eventResize={handleEventChange}
                            height="100%"
                            editable={true}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={3}
                            themeSystem="standard"
                            nowIndicator={true}
                            slotMinTime="06:00:00"
                            slotMaxTime="22:00:00"
                            scrollTime="08:00:00"
                            allDaySlot={true}
                            slotDuration="00:30:00"
                            snapDuration="00:15:00"
                            expandRows={true}
                            stickyHeaderDates={true}
                            handleWindowResize={true}
                            eventTimeFormat={{
                                hour: 'numeric',
                                minute: '2-digit',
                                meridiem: 'short'
                            }}
                            eventDisplay="block"
                        />
                    </Paper>

                    <Box className="flex flex-col gap-6">
                        <Typography variant="overline" className="font-black text-gray-400 tracking-widest px-4">Selected Report</Typography>
                        <AnimatePresence mode="wait">
                            {selectedSchedule ? (
                                <motion.div
                                    key={selectedSchedule.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Paper className="rounded-[40px] p-8 border-none shadow-2xl bg-white dark:bg-gray-900 flex flex-col gap-6 relative overflow-hidden">
                                        <Box className="absolute top-0 left-0 w-full h-1.5 bg-blue-500 shadow-[0_2px_10px_rgba(59,130,246,0.3)]" />
                                        
                                        <Box className="flex justify-between items-start">
                                            <Box>
                                                <Chip 
                                                    label={selectedSchedule.status} 
                                                    size="small" 
                                                    className={`font-black text-[10px] uppercase rounded-lg mb-4 ${
                                                        selectedSchedule.status === 'completed' 
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`} 
                                                />
                                                <Typography variant="h5" className="font-black tracking-tight leading-tight">{selectedSchedule.title}</Typography>
                                            </Box>
                                            <div className="flex gap-1">
                                                <IconButton 
                                                    size="small" 
                                                    className="bg-gray-50 dark:bg-gray-800"
                                                    onClick={() => setIsEditDialogOpen(true)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    className="bg-gray-50 dark:bg-gray-800 text-gray-400"
                                                    onClick={() => setSelectedScheduleId(null)}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </div>
                                        </Box>

                                        <Box className="flex flex-col gap-5 bg-gray-50/50 dark:bg-gray-800/30 p-5 rounded-3xl border border-gray-100/50 dark:border-gray-800">
                                            <div className="flex items-center gap-4 group">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                                    <ClockIcon sx={{ fontSize: 20 }} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scheduled At</span>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                        {new Date(selectedSchedule.start_date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 group">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                                    <UserIcon sx={{ fontSize: 20 }} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assigned To</span>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                        {selectedSchedule.assigned_to_user?.name || 'Unassigned'}
                                                    </span>
                                                </div>
                                            </div>

                                            {selectedSchedule.assigned_team && (
                                                <div className="flex items-center gap-4 group">
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                                        <TeamIcon sx={{ fontSize: 20 }} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Team</span>
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                            {selectedSchedule.assigned_team}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </Box>

                                        <Box className="pt-2">
                                            <Typography className="text-sm text-gray-500 leading-relaxed font-medium italic">
                                                {selectedSchedule.description || 'No description provided for this report.'}
                                            </Typography>
                                        </Box>

                                        <Box className="grid grid-cols-2 gap-3 mt-4">
                                            {selectedSchedule.status !== 'completed' ? (
                                                <Button 
                                                    variant="contained" 
                                                    className="col-span-2 bg-green-600 hover:bg-green-700 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20"
                                                    startIcon={<CheckIcon fontSize="small" />}
                                                    onClick={() => handleStatusUpdate(selectedSchedule.id, 'completed')}
                                                >
                                                    Mark as Completed
                                                </Button>
                                            ) : (
                                                <Button 
                                                    variant="outlined" 
                                                    className="col-span-2 border-green-200 text-green-600 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                                                    startIcon={<DoneIcon fontSize="small" />}
                                                    onClick={() => handleStatusUpdate(selectedSchedule.id, 'scheduled')}
                                                >
                                                    Re-open Task
                                                </Button>
                                            )}
                                            
                                            <Button 
                                                variant="outlined" 
                                                color="error"
                                                className="rounded-2xl font-black text-[10px] uppercase tracking-widest py-3 border-red-100 hover:bg-red-50"
                                                onClick={() => deleteScheduleMutation.mutate(selectedSchedule.id)}
                                            >
                                                Delete
                                            </Button>
                                            
                                            <IconButton 
                                                size="small" 
                                                className="rounded-2xl bg-gray-50 text-gray-300"
                                                onClick={() => setSelectedScheduleId(null)}
                                            >
                                                <MoreIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <TaskOverview 
                                        schedules={schedules} 
                                        onSelectTask={(id) => setSelectedScheduleId(id)}
                                        selectedTaskId={selectedScheduleId}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Box>
                </Box>
            ) : (
                <Box className="flex-1 flex flex-col gap-8 bg-white dark:bg-gray-900 rounded-[40px] p-8 shadow-2xl">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: '' // Removed dayGridMonth,timeGridWeek because we only want the month view for attendance
                        }}
                        events={attendanceEvents}
                        dateClick={handleDateClick}
                        eventClick={(info) => {
                            setSelectedAttendanceId(parseInt(info.event.id));
                            setIsAttendanceEditDialogOpen(true);
                        }}
                        eventDrop={handleAttendanceChange}
                        height="100%"
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={3}
                        themeSystem="standard"
                        nowIndicator={true}
                        eventDisplay="block"
                    />
                </Box>
            )}

            {isAttendanceAddDialogOpen && (
                <AttendanceDialog 
                    open={isAttendanceAddDialogOpen} 
                    onClose={() => setIsAttendanceAddDialogOpen(false)} 
                    initialDate={selectedDate || new Date()} 
                />
            )}

            {isAttendanceEditDialogOpen && selectedAttendance && (
                <AttendanceDialog 
                    open={isAttendanceEditDialogOpen} 
                    onClose={() => setIsAttendanceEditDialogOpen(false)} 
                    initialDate={new Date(selectedAttendance.date)}
                    attendance={selectedAttendance}
                />
            )}

            {isAddDialogOpen && (
                <ScheduleDialog 
                    open={isAddDialogOpen} 
                    onClose={() => setIsAddDialogOpen(false)} 
                    initialDate={selectedDate || new Date()} 
                />
            )}

            {isEditDialogOpen && selectedSchedule && (
                <ScheduleDialog 
                    open={isEditDialogOpen} 
                    onClose={() => setIsEditDialogOpen(false)} 
                    initialDate={new Date(selectedSchedule.start_date)}
                    schedule={selectedSchedule}
                />
            )}

            <style>{`
                .fc { --fc-border-color: rgba(0,0,0,0.03); --fc-today-bg-color: rgba(59, 130, 246, 0.05); }
                .dark .fc { --fc-border-color: rgba(255,255,255,0.03); --fc-today-bg-color: rgba(59, 130, 246, 0.1); }
                
                .fc .fc-toolbar { margin-bottom: 2rem !important; }
                .fc .fc-toolbar-title { font-weight: 900; letter-spacing: -0.05em; font-size: 1.5rem; color: #1f2937; }
                .dark .fc .fc-toolbar-title { color: white; }
                
                .fc .fc-button { 
                    background: white; 
                    border: 1px solid #f3f4f6; 
                    color: #6b7280; 
                    border-radius: 14px; 
                    font-weight: 800; 
                    font-size: 0.75rem; 
                    padding: 8px 18px; 
                    text-transform: uppercase; 
                    letter-spacing: 0.05em; 
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .dark .fc .fc-button { background: #1f2937; border-color: #374151; color: #9ca3af; }
                
                .fc .fc-button:hover { background: #f9fafb; color: #111827; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .dark .fc .fc-button:hover { background: #374151; color: white; }
                
                .fc .fc-button-primary:not(:disabled):active, 
                .fc .fc-button-primary:not(:disabled).fc-button-active { 
                    background: #3b82f6 !important; 
                    border-color: #3b82f6 !important; 
                    color: white !important; 
                    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3) !important;
                }
                
                .fc th { padding: 16px 0; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.15em; border: none; background: #fff; }
                .dark .fc th { background: #111827; color: #6b7280; }
                
                .fc-daygrid-day { transition: background 0.2s; border-color: #f3f4f6 !important; }
                .dark .fc-daygrid-day { border-color: rgba(255,255,255,0.05) !important; }
                
                .fc-daygrid-day:hover { background: rgba(0,0,0,0.01); }
                .dark .fc-daygrid-day:hover { background: rgba(255,255,255,0.02); }
                
                .fc-daygrid-day-number { font-weight: 900; font-size: 0.85rem; margin: 8px; color: #9ca3af; transition: color 0.2s; }
                .dark .fc-daygrid-day-number { color: #6b7280; }
                .fc-daygrid-day.fc-day-today .fc-daygrid-day-number { color: #3b82f6 !important; }
                .dark .fc-daygrid-day.fc-day-today { background: rgba(59, 130, 246, 0.05) !important; }
                
                .fc-event { 
                    padding: 6px 10px; 
                    border-radius: 10px; 
                    border: none !important;
                    font-weight: 800; 
                    font-size: 0.7rem; 
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    transition: all 0.2s !important;
                    cursor: grab;
                }
                .fc-event:active { cursor: grabbing; }
                .fc-event:hover { transform: scale(1.03) translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 50; }
                
                .fc-v-event { border: none !important; }
                .fc-timegrid-event { border-radius: 12px; }
                
                .fc .fc-timegrid-slot { height: 2.2rem !important; border-bottom: 1px dashed rgba(0,0,0,0.02) !important; }
                .fc .fc-timegrid-slot-label { font-size: 0.65rem !important; font-weight: 700 !important; color: #9ca3af !important; text-transform: uppercase; }
                .dark .fc .fc-timegrid-slot { border-bottom-color: rgba(255,255,255,0.02) !important; }

                /* All-day slot styling */
                .fc .fc-timegrid-axis-cushion { font-size: 0.6rem !important; font-weight: 900 !important; text-transform: uppercase; color: #9ca3af !important; padding: 10px !important; }
                .fc .fc-daygrid-body { background: rgba(0,0,0,0.01); }
                .dark .fc .fc-daygrid-body { background: rgba(255,255,255,0.01); }
                .fc .fc-timegrid-axis-frame { justify-content: center !important; }
                
                .fc-scrollgrid { border: none !important; }
                
                /* Selection highlight */
                .fc .fc-highlight { background: rgba(59, 130, 246, 0.1); }
                
                /* Now Indicator styling */
                .fc .fc-timegrid-now-indicator-line { border-color: #ef4444 !important; border-width: 2px !important; }
                .fc .fc-timegrid-now-indicator-arrow { border-color: #ef4444 !important; border-top-color: transparent !important; border-bottom-color: transparent !important; }

                /* Hide scrollbar for cleaner look */
                .fc-scroller::-webkit-scrollbar { width: 0px; display: none; }
                .fc-scroller { -ms-overflow-style: none; scrollbar-width: none; }

                /* More link alignment */
                .fc-daygrid-more-link {
                    display: block !important;
                    text-align: center;
                    font-size: 0.6rem !important;
                    font-weight: 800 !important;
                    color: #6b7280 !important;
                    background: #f3f4f6;
                    padding: 4px 8px;
                    border-radius: 8px;
                    margin: 4px;
                    transition: all 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .dark .fc-daygrid-more-link {
                    background: #374151;
                    color: #9ca3af !important;
                }
                .fc-daygrid-more-link:hover {
                    background: #e5e7eb;
                    color: #111827 !important;
                    transform: translateY(-1px);
                }
                .dark .fc-daygrid-more-link:hover {
                    background: #4b5563;
                    color: white !important;
                }
                
                .fc-daygrid-event-harness {
                    margin-bottom: 2px !important;
                }
                
                .fc-popover {
                    border-radius: 20px !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
                    border: none !important;
                    overflow: hidden;
                }
                .fc-popover-header {
                    background: #f9fafb !important;
                    padding: 12px 18px !important;
                    font-weight: 900 !important;
                    font-size: 0.75rem !important;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                .dark .fc-popover-header { background: #1f2937 !important; color: white !important; }
                .fc-popover-body {
                    padding: 12px !important;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .dark .fc-popover-body { background: #111827 !important; }
            `}</style>
        </Box>
    );
};

export default SchedulingApp;
