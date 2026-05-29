import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Box, Typography, Button, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Autocomplete, InputAdornment } from '@mui/material';
import { Add as PlusIcon, CheckCircle as CheckIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon, MoreVert as MoreIcon, ArrowBack as BackIcon, Search as SearchIcon } from '@mui/icons-material';
import { useProject } from '../../../context/ProjectContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTimelineTasks, useTimelineTask, createTimelineTask, updateTimelineTask, deleteTimelineTask, updateProjectBounds, useTimelineHistory, TimelineTask } from '../scheduling/scheduleApi';

const ProjectTimelineApp: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    // If taskId is provided, we are in a sub-timeline
    const isSubTimeline = !!taskId;
    
    const { data: parentTask } = useTimelineTask(taskId ? parseInt(taskId) : null);
    const { data: tasks = [], isLoading } = useTimelineTasks(taskId || 'null');
    const { data: history = [] } = useTimelineHistory();
    
    const { activeProject, setActiveProject } = useProject();
    
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [actualSearchTerm, setActualSearchTerm] = useState<string>("");
    const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);
    const scrollContainerExpectedRef = useRef<HTMLDivElement>(null);
    const scrollContainerActualRef = useRef<HTMLDivElement>(null);

    const scrollToTask = (task: TimelineTask) => {
        const id = `timeline-task-${task.id}`;
        const elements = document.querySelectorAll(`[id="${id}"]`);
        
        elements.forEach(el => {
            el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });

        setHighlightedTaskId(task.id);
        setTimeout(() => setHighlightedTaskId(null), 3000);
    };
    
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
    const [projectDateForm, setProjectDateForm] = useState({ 
        start_date: '', 
        end_date: '',
        actual_start_date: '',
        actual_end_date: '',
        edit_reason: ''
    });
    
    const [pendingEditTask, setPendingEditTask] = useState<any>(null);
    const [editReason, setEditReason] = useState("");

    const [formState, setFormState] = useState<Partial<TimelineTask>>({
        name: '',
        expected_start_date: new Date().toISOString().split('T')[0],
        expected_end_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    });

    const createMutation = useMutation({
        mutationFn: createTimelineTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['timeline-history'] });
            setIsAddOpen(false);
            setFormState({
                name: '',
                expected_start_date: new Date().toISOString().split('T')[0],
                expected_end_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => updateTimelineTask(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['timeline-history'] });
            setIsEditOpen(false);
            setEditReason("");
            setPendingEditTask(null);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTimelineTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timeline-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['timeline-history'] });
        }
    });

    const updateProjectMutation = useMutation({
        mutationFn: (data: any) => updateProjectBounds(activeProject!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timeline-history'] });
            if (activeProject) {
                setActiveProject({
                    ...activeProject,
                    start_date: projectDateForm.start_date,
                    end_date: projectDateForm.end_date,
                    actual_start_date: projectDateForm.actual_start_date,
                    actual_end_date: projectDateForm.actual_end_date,
                    edit_reason: projectDateForm.edit_reason
                });
            }
            setIsEditProjectOpen(false);
        }
    });

    const handleEditProjectBoundsClick = () => {
        setProjectDateForm({
            start_date: activeProject?.start_date ? activeProject.start_date.split('T')[0] : '',
            end_date: activeProject?.end_date ? activeProject.end_date.split('T')[0] : '',
            actual_start_date: activeProject?.actual_start_date ? activeProject.actual_start_date.split('T')[0] : '',
            actual_end_date: activeProject?.actual_end_date ? activeProject.actual_end_date.split('T')[0] : '',
            edit_reason: ''
        });
        setIsEditProjectOpen(true);
    };

    const handleProjectBoundsSubmit = () => {
        let isChanged = false;
        if (
            (projectDateForm.start_date !== (activeProject?.start_date ? activeProject.start_date.split('T')[0] : '')) ||
            (projectDateForm.end_date !== (activeProject?.end_date ? activeProject.end_date.split('T')[0] : '')) ||
            (projectDateForm.actual_start_date !== (activeProject?.actual_start_date ? activeProject.actual_start_date.split('T')[0] : '')) ||
            (projectDateForm.actual_end_date !== (activeProject?.actual_end_date ? activeProject.actual_end_date.split('T')[0] : ''))
        ) {
            isChanged = true;
        }

        if (isChanged && !projectDateForm.edit_reason.trim()) {
            alert('A reason is required when changing main project dates.');
            return;
        }

        const payload: any = { ...projectDateForm };
        if (!isChanged) delete payload.edit_reason;

        updateProjectMutation.mutate(payload);
    };

    const handleAdd = () => {
        const minStart = isSubTimeline && parentTask?.expected_start_date ? new Date(parentTask.expected_start_date) : (activeProject?.start_date ? new Date(activeProject.start_date) : null);
        const maxEnd = isSubTimeline && parentTask?.expected_end_date ? new Date(parentTask.expected_end_date) : (activeProject?.end_date ? new Date(activeProject.end_date) : null);

        if (minStart && new Date(formState.expected_start_date!) < minStart) {
            alert(`Milestone start date cannot be before ${isSubTimeline ? 'phase' : 'main project'} start date.`);
            return;
        }
        if (maxEnd && new Date(formState.expected_end_date!) > maxEnd) {
            alert(`Milestone end date cannot be after ${isSubTimeline ? 'phase' : 'main project'} end date.`);
            return;
        }

        const payload = { 
            ...formState, 
            parent_id: taskId ? parseInt(taskId) : null 
        };
        createMutation.mutate(payload);
    };

    const handleEditClick = (task: TimelineTask) => {
        setPendingEditTask({
            ...task,
            expected_start_date: task.expected_start_date.split('T')[0],
            expected_end_date: task.expected_end_date.split('T')[0],
            actual_start_date: task.actual_start_date ? task.actual_start_date.split('T')[0] : '',
            actual_end_date: task.actual_end_date ? task.actual_end_date.split('T')[0] : '',
        });
        setEditReason("");
        setIsEditOpen(true);
    };

    const confirmEdit = () => {
        if (pendingEditTask) {
            const originalTask = tasks.find((t) => t.id === pendingEditTask.id);
            let dateChanged = false;

            if (originalTask) {
                if (pendingEditTask.expected_start_date !== originalTask.expected_start_date.split('T')[0] ||
                    pendingEditTask.expected_end_date !== originalTask.expected_end_date.split('T')[0] ||
                    (pendingEditTask.actual_start_date || '') !== (originalTask.actual_start_date ? originalTask.actual_start_date.split('T')[0] : '') ||
                    (pendingEditTask.actual_end_date || '') !== (originalTask.actual_end_date ? originalTask.actual_end_date.split('T')[0] : '')) {
                    dateChanged = true;
                }
            }

            const minStart = isSubTimeline && parentTask?.expected_start_date ? new Date(parentTask.expected_start_date) : (activeProject?.start_date ? new Date(activeProject.start_date) : null);
            const maxEnd = isSubTimeline && parentTask?.expected_end_date ? new Date(parentTask.expected_end_date) : (activeProject?.end_date ? new Date(activeProject.end_date) : null);

            if (minStart) {
                if (new Date(pendingEditTask.expected_start_date) < minStart || 
                   (pendingEditTask.actual_start_date && new Date(pendingEditTask.actual_start_date) < minStart)) {
                    alert(`Milestone dates cannot be before ${isSubTimeline ? 'phase' : 'main project'} start date.`);
                    return;
                }
            }
            if (maxEnd) {
                if (new Date(pendingEditTask.expected_end_date) > maxEnd || 
                   (pendingEditTask.actual_end_date && new Date(pendingEditTask.actual_end_date) > maxEnd)) {
                    alert(`Milestone dates cannot be after ${isSubTimeline ? 'phase' : 'main project'} end date.`);
                    return;
                }
            }

            if (dateChanged && !editReason.trim()) {
                alert("An edit reason is required when changing dates.");
                return;
            }

            const dataToUpdate = { ...pendingEditTask };
            if (dateChanged) {
                dataToUpdate.edit_reason = editReason;
            }

            updateMutation.mutate({
                id: pendingEditTask.id,
                data: dataToUpdate
            });
        }
    };

    // Sort tasks by expected_start_date
    // Sort tasks by expected_start_date for Expected timeline
    const expectedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => new Date(a.expected_start_date).getTime() - new Date(b.expected_start_date).getTime());
    }, [tasks]);

    // Sort tasks by actual_start_date for Actual timeline (only tasks with actual_start_date)
    const actualTasks = useMemo(() => {
        return [...tasks]
            .filter(t => t.actual_start_date)
            .sort((a, b) => new Date(a.actual_start_date!).getTime() - new Date(b.actual_start_date!).getTime());
    }, [tasks]);

    return (
        <Box className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 p-6 lg:p-10 gap-8 overflow-y-auto" sx={{ maxHeight: '100vh' }}>
            <Box className="flex flex-col gap-1">
                <Box className="flex items-center gap-4">
                    {isSubTimeline && (
                        <IconButton onClick={() => navigate(-1)} className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
                            <BackIcon />
                        </IconButton>
                    )}
                    <Typography variant="h4" className="font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                        <PlusIcon sx={{ fontSize: 32 }} className="text-blue-500" />
                        {isSubTimeline ? `Sub-Timeline: ${parentTask?.name || '...'}` : 'Project Timeline'}
                    </Typography>
                </Box>
                {isSubTimeline && (
                    <Typography className="text-gray-500 font-medium ml-14">
                        Defining steps for phase: <span className="text-blue-600 font-bold">{parentTask?.name}</span>
                    </Typography>
                )}
            </Box>

            <Box className="flex flex-col flex-shrink-0 bg-white dark:bg-gray-900 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
                <Box className="flex justify-between items-center mb-12">
                    <Box>
                        <Typography variant="h5" className="font-black tracking-tight text-gray-900 dark:text-white">
                            {isSubTimeline ? 'Phase Progress' : 'Milestone Viewer'}
                        </Typography>
                        <Typography className="text-gray-500 font-medium text-sm mt-1">
                            {isSubTimeline ? `Work breakdown for ${parentTask?.name}` : 'Expected vs Actual Milestone Progress'}
                        </Typography>
                    </Box>
                    <Box className="flex items-center gap-4 flex-1 max-w-sm ml-auto mr-4">
                        <Autocomplete
                            options={tasks}
                            getOptionLabel={(option) => option.name}
                            onInputChange={(_, value) => setSearchTerm(value)}
                            onChange={(_, value) => value && scrollToTask(value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Search Milestone..."
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        ...params.InputProps,
                                        className: 'rounded-2xl bg-gray-50 dark:bg-gray-800 border-none px-4',
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ fontSize: 18 }} className="text-gray-400" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': { border: 'none' },
                                        },
                                    }}
                                />
                            )}
                            fullWidth
                        />
                    </Box>
                <Button 
                    variant="contained" 
                    startIcon={<PlusIcon />}
                    className="bg-blue-600 hover:bg-blue-700 py-2.5 px-5 rounded-xl font-black text-xs shadow-lg shadow-blue-500/20 uppercase tracking-widest"
                    onClick={() => setIsAddOpen(true)}
                >
                    Add Milestone
                </Button>
            </Box>

            {/* --- EXPECTED TIMELINE --- */}
            <Typography variant="subtitle1" className="font-black text-gray-800 dark:text-gray-200 mb-2 px-4 uppercase tracking-widest text-xs">
                Expected Timeline
            </Typography>
            <Box ref={scrollContainerExpectedRef} className="w-full overflow-x-auto pb-12 pt-8 px-4" sx={{ scrollbarWidth: 'thin' }}>
                <Box className="relative min-w-max h-[350px] flex items-center pr-[100px]">
                    {/* The main straight horizontal line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-blue-100 dark:bg-gray-800 -translate-y-1/2 rounded-full" />

                    <div className="flex gap-16 relative w-full items-center px-10">
                        {/* Project Start Date */}
                        <Box className="relative flex flex-col items-center group min-w-[200px]">
                            <div className="absolute left-1/2 w-0.5 bg-dashed border-l-2 border-dashed border-gray-300 dark:border-gray-700 h-[80px] -translate-x-1/2 top-1/2" />
                            <motion.div 
                                drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                onDragEnd={!isSubTimeline ? handleEditProjectBoundsClick : undefined}
                                className={`w-6 h-6 rounded-full bg-gray-900 dark:bg-white border-4 border-white dark:border-gray-900 shadow-xl z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${!isSubTimeline ? 'group-hover:scale-110 transition-transform cursor-pointer' : ''}`} onClick={!isSubTimeline ? handleEditProjectBoundsClick : undefined} 
                            />
                            <Box className="absolute w-56 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 transition-all z-20 group-hover:-translate-y-1 top-[calc(50%+90px)]">
                                <div className="flex justify-between items-start mb-1">
                                    <Typography className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[10px]">
                                        {isSubTimeline ? 'Phase Start' : 'Main Project Start'}
                                    </Typography>
                                    {!isSubTimeline && (
                                        <IconButton size="small" onClick={handleEditProjectBoundsClick} className="text-gray-400 hover:text-blue-500 -mt-1.5 -mr-1.5">
                                            <EditIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    )}
                                </div>
                                <Typography className="font-bold text-gray-600 dark:text-gray-300 text-sm">
                                    {isSubTimeline 
                                        ? (parentTask?.expected_start_date ? new Date(parentTask.expected_start_date).toLocaleDateString() : '...')
                                        : (activeProject?.start_date ? new Date(activeProject.start_date).toLocaleDateString() : 'TBD / Not Set')}
                                </Typography>
                            </Box>
                        </Box>

                        {expectedTasks.length === 0 ? (
                            <Typography className="text-gray-400 font-bold italic z-10 bg-white dark:bg-gray-900 px-4">
                                No milestones added yet. Add one!
                            </Typography>
                        ) : (
                            expectedTasks.map((task, index) => {
                                const isTop = index % 2 === 0;

                                return ( 
                                    <Box key={task.id} className="relative flex flex-col items-center group min-w-[200px]">
                                        {/* Connecting Line to dot */}
                                        <div className={`absolute left-1/2 w-0.5 bg-dashed border-l-2 border-dashed border-blue-300 dark:border-gray-700 h-[80px] -translate-x-1/2 ${isTop ? 'bottom-1/2' : 'top-1/2'}`} />
                                        
                                        {/* The Node Dot */}
                                        <motion.div 
                                            id={`timeline-task-${task.id}`}
                                            drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                            onDragEnd={() => handleEditClick(task)}
                                            animate={highlightedTaskId === task.id ? { 
                                                scale: [1, 1.5, 1],
                                                boxShadow: [
                                                    "0px 0px 0px 0px rgba(59, 130, 246, 0)", 
                                                    "0px 0px 0px 15px rgba(59, 130, 246, 0.4)", 
                                                    "0px 0px 0px 0px rgba(59, 130, 246, 0)"
                                                ] 
                                            } : {}}
                                            className={`w-5 h-5 rounded-full bg-blue-500 border-4 border-white dark:border-gray-900 shadow-md z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-all cursor-pointer ring-0 group-hover:ring-8 ring-blue-500/10 ${highlightedTaskId === task.id ? 'ring-[12px] ring-blue-500/30' : ''}`} 
                                            onClick={() => navigate(`/project-timeline/${task.id}`)} 
                                        />

                                        {/* Content Card */}
                                        <Box className={`absolute w-64 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 transition-all z-20 group-hover:-translate-y-2 ${isTop ? 'bottom-[calc(50%+90px)]' : 'top-[calc(50%+90px)]'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <Typography className="font-black text-gray-900 dark:text-white leading-tight cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate(`/project-timeline/${task.id}`)}>
                                                    {task.name}
                                                </Typography>
                                                <IconButton size="small" onClick={() => handleEditClick(task)} className="bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-500 -mt-1.5 -mr-1.5">
                                                    <EditIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </div>

                                            {/* Expected Block ONLY */}
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                                <Typography className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Expected</Typography>
                                                <Typography className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    {new Date(task.expected_start_date).toLocaleDateString()} - {new Date(task.expected_end_date).toLocaleDateString()}
                                                </Typography>
                                            </div>

                                            <IconButton size="small" onClick={() => deleteMutation.mutate(task.id)} className="absolute -bottom-3 -right-3 bg-red-500 hover:bg-red-600 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DeleteIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                );
                            })
                        )}

                        {/* Project End Date */}
                        <Box className="relative flex flex-col items-center group min-w-[200px]">
                            <div className="absolute left-1/2 w-0.5 bg-dashed border-l-2 border-dashed border-gray-300 dark:border-gray-700 h-[80px] -translate-x-1/2 bottom-1/2" />
                            <motion.div 
                                drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                onDragEnd={!isSubTimeline ? handleEditProjectBoundsClick : undefined}
                                className={`w-6 h-6 rounded-full bg-gray-900 dark:bg-white border-4 border-white dark:border-gray-900 shadow-xl z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${!isSubTimeline ? 'group-hover:scale-110 transition-transform cursor-pointer' : ''}`} onClick={!isSubTimeline ? handleEditProjectBoundsClick : undefined} 
                            />
                            <Box className="absolute w-56 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 transition-all z-20 group-hover:-translate-y-1 bottom-[calc(50%+90px)]">
                                <div className="flex justify-between items-start mb-1">
                                    <Typography className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[10px]">
                                        {isSubTimeline ? 'Phase End' : 'Main Project End'}
                                    </Typography>
                                    {!isSubTimeline && (
                                        <IconButton size="small" onClick={handleEditProjectBoundsClick} className="text-gray-400 hover:text-blue-500 -mt-1.5 -mr-1.5">
                                            <EditIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    )}
                                </div>
                                <Typography className="font-bold text-gray-600 dark:text-gray-300 text-sm">
                                    {isSubTimeline 
                                        ? (parentTask?.expected_end_date ? new Date(parentTask.expected_end_date).toLocaleDateString() : '...')
                                        : (activeProject?.end_date ? new Date(activeProject.end_date).toLocaleDateString() : 'TBD / Not Set')}
                                </Typography>
                            </Box>
                        </Box>
                    </div>
                </Box>
            </Box>

            {/* --- ACTUAL TIMELINE --- */}
            <Box className="flex flex-col md:flex-row items-center justify-between mt-6 px-4 gap-4">
                <Typography variant="subtitle1" className="font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest text-xs">
                    Actual Progress Timeline
                </Typography>
                <Box className="flex items-center gap-4 flex-1 max-w-sm md:ml-auto">
                    <Autocomplete
                        options={actualTasks}
                        getOptionLabel={(option) => option.name}
                        onInputChange={(_, value) => setActualSearchTerm(value)}
                        onChange={(_, value) => value && scrollToTask(value)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Search Actual Progress..."
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    ...params.InputProps,
                                    className: 'rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 h-10',
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 18 }} className="text-emerald-500" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': { border: 'none' },
                                    },
                                }}
                            />
                        )}
                        fullWidth
                    />
                </Box>
            </Box>
            <Box ref={scrollContainerActualRef} className="w-full overflow-x-auto pb-12 pt-8 px-4 flex-shrink-0" sx={{ scrollbarWidth: 'thin' }}>
                <Box className="relative min-w-max h-[350px] flex items-center pr-[100px]">
                    {/* The actual straight horizontal line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-emerald-100 dark:bg-gray-800 -translate-y-1/2 rounded-full" />

                    <div className="flex gap-16 relative w-full items-center px-10">
                        {/* Actual Project Start */}
                        <Box className="relative flex flex-col items-center group min-w-[200px]">
                            <div className="absolute left-1/2 w-0.5 bg-dashed border-l-2 border-dashed border-gray-300 dark:border-gray-700 h-[80px] -translate-x-1/2 top-1/2" />
                            <motion.div 
                                drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                onDragEnd={!isSubTimeline ? handleEditProjectBoundsClick : undefined}
                                className={`w-6 h-6 rounded-full bg-emerald-50 dark:bg-gray-800 border-4 border-emerald-500 shadow-xl z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${!isSubTimeline ? 'group-hover:scale-110 transition-transform cursor-pointer' : ''}`} onClick={!isSubTimeline ? handleEditProjectBoundsClick : undefined} 
                            />
                            <Box className="absolute w-56 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-emerald-200 dark:border-emerald-800 transition-all z-20 group-hover:-translate-y-1 top-[calc(50%+90px)]">
                                <div className="flex justify-between items-start mb-1">
                                    <Typography className="font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-widest text-[10px]">
                                        {isSubTimeline ? 'Phase Actual Start' : 'Actual Project Start'}
                                    </Typography>
                                    {!isSubTimeline && (
                                        <IconButton size="small" onClick={handleEditProjectBoundsClick} className="text-emerald-600 hover:text-emerald-800 -mt-1.5 -mr-1.5">
                                            <EditIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    )}
                                </div>
                                <Typography className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                                    {isSubTimeline
                                        ? (parentTask?.actual_start_date ? new Date(parentTask.actual_start_date).toLocaleDateString() : 'TBD / Not Set')
                                        : (activeProject?.actual_start_date ? new Date(activeProject.actual_start_date).toLocaleDateString() : 'TBD / Not Set')}
                                </Typography>
                            </Box>
                        </Box>

                        {actualTasks.length === 0 ? (
                            <Typography className="text-gray-400 font-bold italic z-10 bg-white dark:bg-gray-900 px-4">
                                No actual progress logged yet. Edit a task to add actual dates!
                            </Typography>
                        ) : (
                            actualTasks.map((task, index) => {
                                const isTop = index % 2 === 0;

                                return (
                                    <Box key={task.id} className="relative flex flex-col items-center group min-w-[200px]">
                                        {/* Connecting Line to dot */}
                                        <div className={`absolute left-1/2 w-0.5 bg-dashed border-l-2 border-dashed border-emerald-300 dark:border-gray-700 h-[80px] -translate-x-1/2 ${isTop ? 'bottom-1/2' : 'top-1/2'}`} />
                                        
                                        {/* The Node Dot */}
                                        <motion.div 
                                            id={`timeline-task-${task.id}`}
                                            drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                            onDragEnd={() => handleEditClick(task)}
                                            animate={highlightedTaskId === task.id ? { 
                                                scale: [1, 1.5, 1],
                                                boxShadow: [
                                                    "0px 0px 0px 0px rgba(16, 185, 129, 0)", 
                                                    "0px 0px 0px 15px rgba(16, 185, 129, 0.4)", 
                                                    "0px 0px 0px 0px rgba(16, 185, 129, 0)"
                                                ] 
                                            } : {}}
                                            className={`w-5 h-5 rounded-full bg-emerald-500 border-4 border-white dark:border-gray-900 shadow-md z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-all cursor-pointer ring-0 group-hover:ring-8 ring-emerald-500/10 ${highlightedTaskId === task.id ? 'ring-[12px] ring-emerald-500/30' : ''}`} 
                                            onClick={() => navigate(`/project-timeline/${task.id}`)} 
                                        />

                                        {/* Content Card */}
                                        <Box className={`absolute w-64 p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 transition-all z-20 group-hover:-translate-y-2 ${isTop ? 'bottom-[calc(50%+90px)]' : 'top-[calc(50%+90px)]'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <Typography className="font-black text-gray-900 dark:text-white leading-tight cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => navigate(`/project-timeline/${task.id}`)}>
                                                    {task.name}
                                                </Typography>
                                                <IconButton size="small" onClick={() => handleEditClick(task)} className="bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-500 -mt-1.5 -mr-1.5">
                                                    <EditIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </div>

                                            {/* Actual Block ONLY */}
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                                <Typography className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Actual</Typography>
                                                <Typography className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    {new Date(task.actual_start_date!).toLocaleDateString()} - {task.actual_end_date ? new Date(task.actual_end_date).toLocaleDateString() : 'Active'}
                                                </Typography>
                                            </div>
                                        </Box>
                                    </Box>
                                );
                            })
                        )}

                        {/* Actual Project End Date */}
                        <Box className="relative flex flex-col items-center group min-w-[200px]">
                            <div className="absolute left-1/2 w-0.5 bg-dashed border-l-2 border-dashed border-gray-300 dark:border-gray-700 h-[80px] -translate-x-1/2 bottom-1/2" />
                            <motion.div 
                                drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                onDragEnd={!isSubTimeline ? handleEditProjectBoundsClick : undefined}
                                className={`w-6 h-6 rounded-full bg-emerald-50 dark:bg-gray-800 border-4 border-emerald-500 shadow-xl z-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${!isSubTimeline ? 'group-hover:scale-110 transition-transform cursor-pointer' : ''}`} onClick={!isSubTimeline ? handleEditProjectBoundsClick : undefined} 
                            />
                            <Box className="absolute w-56 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-emerald-200 dark:border-emerald-800 transition-all z-20 group-hover:-translate-y-1 bottom-[calc(50%+90px)]">
                                <div className="flex justify-between items-start mb-1">
                                    <Typography className="font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-widest text-[10px]">
                                        {isSubTimeline ? 'Phase Actual End' : 'Actual Project End'}
                                    </Typography>
                                    {!isSubTimeline && (
                                        <IconButton size="small" onClick={handleEditProjectBoundsClick} className="text-emerald-600 hover:text-emerald-800 -mt-1.5 -mr-1.5">
                                            <EditIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    )}
                                </div>
                                <Typography className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                                    {isSubTimeline
                                        ? (parentTask?.actual_end_date ? new Date(parentTask.actual_end_date).toLocaleDateString() : 'TBD / Not Set')
                                        : (activeProject?.actual_end_date ? new Date(activeProject.actual_end_date).toLocaleDateString() : 'TBD / Not Set')}
                                </Typography>
                            </Box>
                        </Box>
                    </div>
                </Box>
            </Box>

            {/* --- CHANGE HISTORY TABLE --- */}
            <Box className="flex flex-col gap-4 mt-8 flex-shrink-0">
                <Typography variant="h5" className="font-black tracking-tight text-gray-900 dark:text-white px-4">
                    Timeline Change History
                </Typography>
                <Paper className="rounded-[30px] overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800">
                    <Box className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 font-black text-[10px] uppercase text-gray-500 tracking-widest">Date Changed</th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase text-gray-500 tracking-widest">Entity</th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase text-gray-500 tracking-widest">Changed By</th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase text-gray-500 tracking-widest">Changes</th>
                                    <th className="px-6 py-4 font-black text-[10px] uppercase text-gray-500 tracking-widest">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic font-medium">
                                            No changes recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <Typography className="text-xs font-bold text-gray-900 dark:text-white">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </Typography>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Chip 
                                                    label={item.entity_name} 
                                                    size="small" 
                                                    className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider h-6 rounded-lg" 
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Typography className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    {item.user?.displayName || item.user?.name || 'System'}
                                                </Typography>
                                            </td>
                                            <td className="px-6 py-4 min-w-[300px]">
                                                <Box className="flex flex-col gap-1.5">
                                                    {item.change_details.split(', ').map((detail, i) => (
                                                        <Box key={i} className="flex items-start gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-300 dark:bg-blue-700 mt-1 flex-shrink-0" />
                                                            <Typography className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                                                {detail}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </td>
                                            <td className="px-6 py-4 min-w-[200px]">
                                                <Box className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-xl border border-orange-100 dark:border-orange-900/50">
                                                    <Typography className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">Reason</Typography>
                                                    <Typography className="text-xs font-bold text-orange-800 dark:text-orange-300 leading-relaxed">
                                                        {item.reason}
                                                    </Typography>
                                                </Box>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Box>
                </Paper>
            </Box>

            {/* Add Milestone Dialog */}
            <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-[30px] p-2' }}>
                <DialogTitle className="font-black text-xl mb-2">New Milestone</DialogTitle>
                <DialogContent>
                    <Box className="flex flex-col gap-5 pt-2">
                        <TextField 
                            label="Milestone / Task Name" 
                            fullWidth 
                            variant="outlined"
                            InputProps={{ className: 'rounded-xl' }}
                            value={formState.name}
                            onChange={e => setFormState({...formState, name: e.target.value})}
                        />
                        <Box className="grid grid-cols-2 gap-4">
                            <TextField 
                                label="Expected Start Date" 
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                fullWidth 
                                InputProps={{ className: 'rounded-xl' }}
                                value={formState.expected_start_date}
                                onChange={e => setFormState({...formState, expected_start_date: e.target.value})}
                            />
                            <TextField 
                                label="Expected End Date" 
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                fullWidth 
                                InputProps={{ className: 'rounded-xl' }}
                                value={formState.expected_end_date}
                                onChange={e => setFormState({...formState, expected_end_date: e.target.value})}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions className="p-5">
                    <Button onClick={() => setIsAddOpen(false)} className="text-gray-500 font-bold rounded-xl px-6">Cancel</Button>
                    <Button onClick={handleAdd} variant="contained" className="bg-blue-600 rounded-xl px-6 font-bold shadow-lg shadow-blue-500/20">Add Milestone</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Milestone Dialog */}
            <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-[30px] p-2' }}>
                <DialogTitle className="font-black text-xl mb-2">Edit Milestone</DialogTitle>
                <DialogContent>
                    {pendingEditTask && (
                        <Box className="flex flex-col gap-5 pt-2">
                            <TextField 
                                label="Milestone / Task Name" 
                                fullWidth 
                                variant="outlined"
                                InputProps={{ className: 'rounded-xl' }}
                                value={pendingEditTask.name}
                                onChange={e => setPendingEditTask({...pendingEditTask, name: e.target.value})}
                            />
                            
                            <fieldset className="border border-blue-100 rounded-2xl p-4 flex flex-col gap-4 relative mt-2">
                                <legend className="font-black text-[10px] uppercase text-blue-500 tracking-widest px-2 bg-white">Expected Dates</legend>
                                <div className="grid grid-cols-2 gap-4">
                                    <TextField 
                                        label="Start Date" 
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth 
                                        InputProps={{ className: 'rounded-xl' }}
                                        value={pendingEditTask.expected_start_date}
                                        onChange={e => setPendingEditTask({...pendingEditTask, expected_start_date: e.target.value})}
                                    />
                                    <TextField 
                                        label="End Date" 
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth 
                                        InputProps={{ className: 'rounded-xl' }}
                                        value={pendingEditTask.expected_end_date}
                                        onChange={e => setPendingEditTask({...pendingEditTask, expected_end_date: e.target.value})}
                                    />
                                </div>
                            </fieldset>

                            <fieldset className="border border-emerald-100 rounded-2xl p-4 flex flex-col gap-4 relative mt-2">
                                <legend className="font-black text-[10px] uppercase text-emerald-500 tracking-widest px-2 bg-white">Actual Dates</legend>
                                <div className="grid grid-cols-2 gap-4">
                                    <TextField 
                                        label="Start Date" 
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth 
                                        InputProps={{ className: 'rounded-xl' }}
                                        value={pendingEditTask.actual_start_date || ''}
                                        onChange={e => setPendingEditTask({...pendingEditTask, actual_start_date: e.target.value})}
                                    />
                                    <TextField 
                                        label="End Date" 
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        fullWidth 
                                        InputProps={{ className: 'rounded-xl' }}
                                        value={pendingEditTask.actual_end_date || ''}
                                        onChange={e => setPendingEditTask({...pendingEditTask, actual_end_date: e.target.value})}
                                    />
                                </div>
                            </fieldset>

                            <Box className="bg-orange-50 p-4 rounded-2xl mt-2 border border-orange-100">
                                <Typography className="text-orange-800 text-xs font-bold mb-2 uppercase tracking-widest">Date Change Reason</Typography>
                                <Typography className="text-orange-600 text-xs mb-3">If you modify any expected or actual dates, a reason is strictly required.</Typography>
                                <TextField 
                                    label="Reason for change" 
                                    fullWidth 
                                    multiline
                                    rows={2}
                                    variant="outlined"
                                    InputProps={{ className: 'rounded-xl bg-white' }}
                                    value={editReason}
                                    onChange={e => setEditReason(e.target.value)}
                                />
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions className="p-5">
                    <Button onClick={() => setIsEditOpen(false)} className="text-gray-500 font-bold rounded-xl px-6">Cancel</Button>
                    <Button onClick={confirmEdit} variant="contained" className="bg-blue-600 rounded-xl px-6 font-bold shadow-lg shadow-blue-500/20">Save Changes</Button>
                </DialogActions>
            </Dialog>
            {/* Edit Project Bounds Dialog */}
            <Dialog open={isEditProjectOpen} onClose={() => setIsEditProjectOpen(false)} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-[30px] p-2' }}>
                <DialogTitle className="font-black text-xl mb-2">Set Main Project Bounds</DialogTitle>
                <DialogContent>
                    <Box className="flex flex-col gap-6 pt-2">
                        <fieldset className="border border-blue-100 rounded-2xl p-4 flex flex-col gap-4 relative">
                            <legend className="font-black text-[10px] uppercase text-blue-500 tracking-widest px-2 bg-white">Expected Global Bounds</legend>
                            <Box className="grid grid-cols-2 gap-4">
                                <TextField 
                                    label="Project Start Date" 
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth 
                                    InputProps={{ className: 'rounded-xl' }}
                                    value={projectDateForm.start_date}
                                    onChange={e => setProjectDateForm({...projectDateForm, start_date: e.target.value})}
                                />
                                <TextField 
                                    label="Project End Date" 
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth 
                                    InputProps={{ className: 'rounded-xl' }}
                                    value={projectDateForm.end_date}
                                    onChange={e => setProjectDateForm({...projectDateForm, end_date: e.target.value})}
                                />
                            </Box>
                        </fieldset>

                        <fieldset className="border border-emerald-100 rounded-2xl p-4 flex flex-col gap-4 relative">
                            <legend className="font-black text-[10px] uppercase text-emerald-500 tracking-widest px-2 bg-white">Actual Global Bounds</legend>
                            <Box className="grid grid-cols-2 gap-4">
                                <TextField 
                                    label="Actual Start Date" 
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth 
                                    InputProps={{ className: 'rounded-xl' }}
                                    value={projectDateForm.actual_start_date}
                                    onChange={e => setProjectDateForm({...projectDateForm, actual_start_date: e.target.value})}
                                />
                                <TextField 
                                    label="Actual End Date" 
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth 
                                    InputProps={{ className: 'rounded-xl' }}
                                    value={projectDateForm.actual_end_date}
                                    onChange={e => setProjectDateForm({...projectDateForm, actual_end_date: e.target.value})}
                                />
                            </Box>
                        </fieldset>

                        <Box className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                            <Typography className="text-orange-800 text-xs font-bold mb-2 uppercase tracking-widest">Reason Required</Typography>
                            <TextField 
                                label="Reason for boundary limits update" 
                                fullWidth 
                                multiline
                                rows={2}
                                variant="outlined"
                                InputProps={{ className: 'rounded-xl bg-white' }}
                                value={projectDateForm.edit_reason}
                                onChange={e => setProjectDateForm({...projectDateForm, edit_reason: e.target.value})}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions className="p-5">
                    <Button onClick={() => setIsEditProjectOpen(false)} className="text-gray-500 font-bold rounded-xl px-6">Cancel</Button>
                    <Button onClick={handleProjectBoundsSubmit} variant="contained" className="bg-blue-600 rounded-xl px-6 font-bold shadow-lg shadow-blue-500/20">Save Bounds</Button>
                </DialogActions>
            </Dialog>
        </Box>
    </Box>
    );
};

export default ProjectTimelineApp;

