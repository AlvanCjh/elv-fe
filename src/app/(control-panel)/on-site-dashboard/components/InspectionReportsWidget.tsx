import { useState, useMemo } from 'react';
import { Paper, Typography, Box, CircularProgress, Button, TextField, InputAdornment, Chip, Avatar, IconButton, Tooltip } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useInspectionReports, InspectionReport } from '../../scheduling/scheduleApi';
import InspectionReportDialog from './InspectionReportDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/utils/api';
import useUser from '@auth/useUser';

function InspectionReportsWidget() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { data: reports, isLoading } = useInspectionReports(startDate, endDate);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const { data: user } = useUser();

    const isSupervisor = user?.role === 'supervisor' || (Array.isArray(user?.role) && user.role.includes('supervisor'));

    const stats = useMemo(() => {
        if (!reports) return { total: 0, pending: 0, completed: 0 };
        return {
            total: reports.length,
            pending: reports.filter(r => r.status === 'pending').length,
            completed: reports.filter(r => r.status === 'completed').length
        };
    }, [reports]);

    const filteredReports = useMemo(() => {
        if (!reports) return [];
        return reports.filter(report => {
            const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (report.assigned_to_user?.displayName || report.assigned_to_user?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [reports, searchQuery, statusFilter]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: 'heroicons-outline:check-circle' };
            default: return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', icon: 'heroicons-outline:clock' };
        }
    };

    if (isLoading) {
        return (
            <Box className="flex items-center justify-center h-full min-h-[400px]">
                <CircularProgress size={40} thickness={4} />
            </Box>
        );
    }

    return (
        <Box className="flex flex-col gap-8 p-6 lg:p-8">
            {/* Header Area */}
            <Box className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <Box>
                    <Typography variant="h4" className="font-black text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <FuseSvgIcon size={32} className="text-blue-500">heroicons-outline:clipboard-document-check</FuseSvgIcon>
                        Inspection Dashboard
                    </Typography>
                    <Typography variant="body1" className="text-gray-500 font-medium mt-1">
                        Overview of site inspection reports and performance metrics.
                    </Typography>
                </Box>
                {isSupervisor && (
                    <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
                        onClick={() => {
                            setSelectedReport(null);
                            setDialogOpen(true);
                        }}
                        className="rounded-2xl font-bold h-[48px] px-8 shadow-xl shadow-blue-500/20 transform hover:scale-105 transition-transform"
                    >
                        Create New Report
                    </Button>
                )}
            </Box>

            {/* Stats Dashboard */}
            <Box className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Total Reports', value: stats.total, color: 'blue', icon: 'heroicons-outline:document-text' },
                    { label: 'Pending', value: stats.pending, color: 'amber', icon: 'heroicons-outline:clock' },
                    { label: 'Completed', value: stats.completed, color: 'green', icon: 'heroicons-outline:check-circle' }
                ].map((stat) => (
                    <Paper key={stat.label} className="p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center gap-5 hover:border-blue-200 transition-colors group cursor-default">
                        <Avatar className={`bg-${stat.color}-100 text-${stat.color}-600 dark:bg-${stat.color}-900/30 dark:text-${stat.color}-400 w-14 h-14 rounded-2xl group-hover:scale-110 transition-transform`}>
                            <FuseSvgIcon size={28}>{stat.icon}</FuseSvgIcon>
                        </Avatar>
                        <Box>
                            <Typography variant="h4" className={`font-black leading-tight text-${stat.color === 'blue' ? 'gray-800 dark:text-gray-100' : stat.color + '-600'}`}>
                                {stat.value}
                            </Typography>
                            <Typography variant="caption" className="text-gray-500 font-bold uppercase tracking-widest">{stat.label}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Toolbar Area */}
            <Box className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <Box className="flex items-center gap-3 p-1.5 bg-gray-50 dark:bg-gray-900 rounded-[20px] w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {(['all', 'pending', 'completed'] as const).map((status) => (
                        <Chip
                            key={status}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            onClick={() => setStatusFilter(status)}
                            className={`rounded-2xl font-black px-4 h-[40px] transition-all border-none ${
                                statusFilter === status 
                                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                                : 'bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            }`}
                        />
                    ))}
                </Box>
                <Box className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <TextField
                        type="date"
                        label="From"
                        size="small"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-white dark:bg-gray-800 rounded-2xl w-full sm:w-[160px]"
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                    />
                    <TextField
                        type="date"
                        label="To"
                        size="small"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-white dark:bg-gray-800 rounded-2xl w-full sm:w-[160px]"
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                    />
                    <TextField
                        placeholder="Search by title or engineer..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white dark:bg-gray-800 rounded-3xl w-full sm:w-[240px]"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FuseSvgIcon size={20} className="text-gray-400">heroicons-outline:magnifying-glass</FuseSvgIcon>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '24px', paddingLeft: '16px' } }}
                    />
                </Box>
            </Box>

            {/* Reports Grid */}
            <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredReports.map((report) => {
                        const style = getStatusStyles(report.status);
                        return (
                            <motion.div
                                key={report.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Paper className="relative overflow-hidden p-6 rounded-[40px] shadow-sm hover:shadow-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 transition-all group flex flex-col h-full ring-blue-500/0 hover:ring-2">
                                    <Box className="flex justify-between items-start mb-5">
                                        <Box className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${style.bg} ${style.text}`}>
                                            <FuseSvgIcon size={16}>{style.icon}</FuseSvgIcon>
                                            <Typography variant="caption" className="font-black uppercase tracking-widest">{report.status}</Typography>
                                        </Box>
                                        <Box className="flex gap-2">
                                            {report.file_path && (
                                                <Tooltip title="View Report">
                                                    <IconButton size="small" className="bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(`${API_BASE_URL}/storage/${report.file_path}`, '_blank');
                                                        }}
                                                    >
                                                        <FuseSvgIcon size={20}>heroicons-outline:document-arrow-down</FuseSvgIcon>
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <IconButton size="small" className="bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors" onClick={() => { setSelectedReport(report); setDialogOpen(true); }}>
                                                <FuseSvgIcon size={20}>heroicons-outline:pencil-square</FuseSvgIcon>
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Typography variant="h6" className="font-black mb-3 line-clamp-1 text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                                        {report.title}
                                    </Typography>
                                    
                                    <Typography variant="body2" className="text-gray-500 dark:text-gray-400 mb-8 line-clamp-3 leading-relaxed">
                                        {report.description || 'No detailed description available for this inspection report.'}
                                    </Typography>

                                    <Box className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700/50 flex flex-col gap-4">
                                        <Box className="flex items-center justify-between">
                                            <Box className="flex flex-col">
                                                <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-tighter">Assigned To</Typography>
                                                <Box className="flex items-center gap-2 mt-1">
                                                    <Avatar className="w-7 h-7 text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 ring-2 ring-white dark:ring-gray-800">
                                                        {(report.assigned_to_user?.displayName || report.assigned_to_user?.name || '?')[0].toUpperCase()}
                                                    </Avatar>
                                                    <Typography variant="body2" className="font-black text-gray-700 dark:text-gray-300">
                                                        {report.assigned_to_user?.displayName || report.assigned_to_user?.name || 'Unassigned'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box className="flex items-center gap-1.5 text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-2xl">
                                                <FuseSvgIcon size={16}>heroicons-outline:calendar</FuseSvgIcon>
                                                <Typography variant="caption" className="font-black">
                                                    {new Date(report.inspection_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Paper>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </Box>

            {filteredReports.length === 0 && (
                <Box className="flex flex-col items-center justify-center py-32 text-center animate-pulse">
                    <Avatar className="bg-gray-50 dark:bg-gray-800/50 w-32 h-32 mb-6 text-gray-200">
                        <FuseSvgIcon size={64}>heroicons-outline:document-magnifying-glass</FuseSvgIcon>
                    </Avatar>
                    <Typography variant="h5" className="font-black text-gray-300 uppercase tracking-tighter">No inspections found</Typography>
                    <Typography variant="body1" className="text-gray-400 mt-2 max-w-sm">
                        Keep moving! Double check your search or filters to locate specific inspection reports.
                    </Typography>
                </Box>
            )}

            <InspectionReportDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                report={selectedReport}
            />
        </Box>
    );
}

export default InspectionReportsWidget;
