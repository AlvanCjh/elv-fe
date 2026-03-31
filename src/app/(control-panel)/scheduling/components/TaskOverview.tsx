import React, { useState } from 'react';
import { Box, Typography, Paper, Tooltip, IconButton, Badge } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Folder as FolderIcon, 
    FolderOpen as FolderOpenIcon, 
    InsertDriveFile as FileIcon,
    ChevronRight as ChevronRightIcon,
    CheckCircle as DoneIcon,
    Today as TodayIcon,
    CalendarMonth as UpcomingIcon,
    FiberManualRecord as DotIcon
} from '@mui/icons-material';
import { Schedule } from '../scheduleApi';

interface TaskOverviewProps {
    schedules: Schedule[];
    onSelectTask: (id: number) => void;
    selectedTaskId: number | null;
}

const TaskOverview: React.FC<TaskOverviewProps> = ({ schedules, onSelectTask, selectedTaskId }) => {
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['today', 'upcoming']);

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => 
            prev.includes(folderId) 
                ? prev.filter(id => id !== folderId) 
                : [...prev, folderId]
        );
    };

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todayTasks = schedules.filter(s => s.start_date.startsWith(todayStr) && s.status !== 'completed');
    const upcomingTasks = schedules.filter(s => {
        const sDate = new Date(s.start_date);
        return sDate > now && !s.start_date.startsWith(todayStr) && s.status !== 'completed';
    });
    const completedTasks = schedules.filter(s => s.status === 'completed');

    const folderData = [
        { id: 'today', label: 'Today', icon: <TodayIcon fontSize="small" />, tasks: todayTasks, color: 'text-blue-500' },
        { id: 'upcoming', label: 'Upcoming', icon: <UpcomingIcon fontSize="small" />, tasks: upcomingTasks, color: 'text-amber-500' },
        { id: 'completed', label: 'Completed', icon: <DoneIcon fontSize="small" />, tasks: completedTasks, color: 'text-green-500' },
    ];

    return (
        <Paper 
            elevation={0}
            className="rounded-[40px] p-6 border border-gray-100 dark:border-gray-800 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl flex flex-col gap-4 overflow-hidden h-full"
        >
            <Box className="flex items-center justify-between mb-4 px-2">
                <div className="flex flex-col">
                    <Typography variant="overline" className="font-black text-blue-500 tracking-[0.2em] leading-none mb-1">
                        Task Explorer
                    </Typography>
                    <Typography variant="caption" className="text-gray-400 font-bold uppercase text-[9px]">
                        Project Schedule
                    </Typography>
                </div>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400 opacity-50"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-400 opacity-50"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400 opacity-50"></div>
                </div>
            </Box>

            <Box className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                {folderData.map((folder) => (
                    <Box key={folder.id} className="flex flex-col">
                        <Box 
                            onClick={() => toggleFolder(folder.id)}
                            className={`
                                flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200
                                ${expandedFolders.includes(folder.id) ? 'bg-gray-50 dark:bg-gray-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}
                            `}
                        >
                            <motion.div
                                animate={{ rotate: expandedFolders.includes(folder.id) ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronRightIcon fontSize="small" className="text-gray-300" />
                            </motion.div>
                            
                            <Box className={`w-8 h-8 rounded-xl flex items-center justify-center ${folder.id === 'completed' ? 'bg-green-100 text-green-650' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                {expandedFolders.includes(folder.id) ? <FolderOpenIcon fontSize="small" /> : <FolderIcon fontSize="small" />}
                            </Box>

                            <Typography variant="body2" className={`font-black uppercase tracking-tight text-xs ${folder.id === 'completed' ? 'text-green-600' : 'text-gray-600 dark:text-gray-300'}`}>
                                {folder.label}
                            </Typography>
                            
                            <Typography variant="caption" className="ml-auto font-bold text-gray-300 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full border dark:border-gray-800">
                                {folder.tasks.length}
                            </Typography>
                        </Box>

                        <AnimatePresence>
                            {expandedFolders.includes(folder.id) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <Box className="ml-8 mt-1 flex flex-col border-l-2 border-gray-100 dark:border-gray-800 pl-4 py-2 gap-1">
                                        {folder.tasks.length > 0 ? (
                                            folder.tasks.map((task) => (
                                                <Box 
                                                    key={task.id}
                                                    onClick={() => onSelectTask(task.id)}
                                                    className={`
                                                        group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all
                                                        ${selectedTaskId === task.id 
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/30 text-gray-600 dark:text-gray-400'}
                                                    `}
                                                >
                                                    <FileIcon 
                                                        fontSize="small" 
                                                        className={selectedTaskId === task.id ? 'text-white/50' : 'text-gray-300 group-hover:text-blue-400'} 
                                                     />
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <Typography 
                                                            variant="caption" 
                                                            className={`font-black truncate block leading-none ${selectedTaskId === task.id ? 'text-white' : (folder.id === 'completed' ? 'text-green-600 shadow-green-500' : '')}`}
                                                        >
                                                            {task.title}
                                                        </Typography>
                                                        <Typography 
                                                            variant="caption" 
                                                            className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${selectedTaskId === task.id ? 'text-white/60' : 'text-gray-400'}`}
                                                        >
                                                            {new Date(task.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </div>
                                                    {folder.id === 'completed' && selectedTaskId !== task.id && (
                                                        <DoneIcon className="text-green-500 ml-auto" sx={{ fontSize: 14 }} />
                                                    )}
                                                </Box>
                                            ))
                                        ) : (
                                            <Typography variant="caption" className="text-gray-300 italic py-2 pl-4">
                                                No tasks here...
                                            </Typography>
                                        )}
                                    </Box>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default TaskOverview;
