import { useState, useMemo } from 'react';
import { Paper, Typography, Box, CircularProgress, Button, TextField, InputAdornment, Chip, Avatar, IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
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
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'standby'>('all');
    const { data: user } = useUser();

    const isSupervisor = user?.role === 'supervisor' || (Array.isArray(user?.role) && user.role.includes('supervisor'));

    const stats = useMemo(() => {
        if (!reports) return { total: 0, pending: 0, approved: 0, rejected: 0, standby: 0 };
        return {
            total: reports.length,
            pending: reports.filter(r => r.status === 'pending').length,
            approved: reports.filter(r => r.status === 'approve' || r.status === 'approve with comment' || r.status === 'completed').length,
            rejected: reports.filter(r => r.status === 'rejected' || r.status === 'failed').length,
            standby: reports.filter(r => r.status === 'standby').length
        };
    }, [reports]);

    const filteredReports = useMemo(() => {
        if (!reports) return [];
        return reports.filter(report => {
            const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (report.location || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'pending' && report.status === 'pending') ||
                (statusFilter === 'approved' && (report.status === 'approve' || report.status === 'approve with comment' || report.status === 'completed')) ||
                (statusFilter === 'rejected' && (report.status === 'rejected' || report.status === 'failed')) ||
                (statusFilter === 'standby' && report.status === 'standby');
            return matchesSearch && matchesStatus;
        });
    }, [reports, searchQuery, statusFilter]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'approve': 
            case 'approve with comment':
            case 'completed': 
                return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: 'heroicons-outline:check-circle' };
            case 'rejected':
            case 'failed':
                return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', icon: 'heroicons-outline:x-circle' };
            case 'standby':
                return { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-600 dark:text-gray-400', icon: 'heroicons-outline:pause-circle' };
            default: 
                return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', icon: 'heroicons-outline:clock' };
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
                    { label: 'Approved', value: stats.approved, color: 'green', icon: 'heroicons-outline:check-circle' },
                    { label: 'Rejected', value: stats.rejected, color: 'red', icon: 'heroicons-outline:x-circle' }
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
                    {(['all', 'pending', 'approved', 'rejected', 'standby'] as const).map((status) => (
                        <Chip
                            key={status}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            onClick={() => setStatusFilter(status as any)}
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
                        placeholder="Search by title or location..."
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

            {/* Reports Table */}
            <TableContainer component={Paper} className="rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
                <Table stickyHeader sx={{ minWidth: 1400 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ minWidth: 160 }} className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 px-8 border-b-none">Status</TableCell>
                            <TableCell sx={{ minWidth: 250 }} className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none">Title & Description</TableCell>
                            <TableCell sx={{ minWidth: 180 }} className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none">RFWI / Location</TableCell>
                            <TableCell sx={{ minWidth: 140 }} className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none">Gridline/Zone</TableCell>
                            <TableCell sx={{ minWidth: 200 }} className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none">Engineer</TableCell>
                            <TableCell sx={{ minWidth: 220 }} className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none text-right pr-12">Dates</TableCell>
                            <TableCell sx={{ minWidth: 150 }} className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 px-10 border-b-none text-right sticky right-0 z-20 backdrop-blur-md">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {filteredReports.map((report) => {
                                const style = getStatusStyles(report.status);
                                return (
                                    <TableRow
                                        key={report.id}
                                        component={motion.tr}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer"
                                        onClick={() => { setSelectedReport(report); setDialogOpen(true); }}
                                    >
                                        <TableCell className="py-6 px-8 border-gray-100 dark:border-gray-700/50">
                                            <Box className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${style.bg} ${style.text}`}>
                                                <FuseSvgIcon size={16}>{style.icon}</FuseSvgIcon>
                                                <Typography variant="caption" className="font-black uppercase tracking-widest whitespace-nowrap">{report.status}</Typography>
                                            </Box>
                                        </TableCell>
                                        
                                        <TableCell className="py-6 border-gray-100 dark:border-gray-700/50 max-w-[300px]">
                                            <Typography variant="body1" className="font-black text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                                                {report.title}
                                            </Typography>
                                            <Typography variant="caption" className="text-gray-400 font-medium line-clamp-1 mt-1">
                                                {report.description || 'No description provided'}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="py-6 border-gray-100 dark:border-gray-700/50">
                                            <Box className="flex flex-col">
                                                <Typography variant="body2" className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">
                                                    {report.rfwi_ref_no || '-'}
                                                </Typography>
                                                <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-tighter mt-1 flex items-center gap-1">
                                                    <FuseSvgIcon size={12}>heroicons-outline:map-pin</FuseSvgIcon>
                                                    {report.location || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell className="py-6 border-gray-100 dark:border-gray-700/50">
                                            <Chip 
                                                label={report.gridline_zone || 'Not Set'}
                                                size="small"
                                                className="rounded-lg font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-none"
                                            />
                                        </TableCell>

                                        <TableCell className="py-6 border-gray-100 dark:border-gray-700/50">
                                            <Box className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8 text-[11px] font-black bg-blue-50 text-blue-600 border border-blue-100">
                                                    {(report.assigned_to_user?.displayName || report.assigned_to_user?.name || '?')[0].toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" className="font-black text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                        {report.assigned_to_user?.displayName || report.assigned_to_user?.name || 'Unassigned'}
                                                    </Typography>
                                                    <Typography variant="caption" className="text-gray-400 font-bold tracking-tighter">Site Engineer</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        <TableCell className="py-6 border-gray-100 dark:border-gray-700/50 text-right pr-12">
                                            <Box className="flex flex-col gap-1 items-end">
                                                <Typography variant="caption" className="flex items-center gap-1 text-gray-500 font-bold whitespace-nowrap">
                                                    <FuseSvgIcon size={12} className="text-blue-500">heroicons-outline:calendar</FuseSvgIcon>
                                                    Inspected: {report.date_inspected ? new Date(report.date_inspected).toLocaleDateString() : 'N/A'}
                                                </Typography>
                                                <Typography variant="caption" className="flex items-center gap-1 text-gray-400 font-medium whitespace-nowrap">
                                                    <FuseSvgIcon size={12}>heroicons-outline:document-text</FuseSvgIcon>
                                                    Submitted: {new Date(report.inspection_date).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell className="px-10 py-6 border-gray-100 dark:border-gray-700/50 text-right sticky right-0 bg-white dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.02)]">
                                            <Box className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                {report.file_path && (
                                                    <Tooltip title="View Report">
                                                        <IconButton 
                                                            size="small" 
                                                            className="bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-xl"
                                                            onClick={() => window.open(`${API_BASE_URL}/storage/${report.file_path}`, '_blank')}
                                                        >
                                                            <FuseSvgIcon size={20}>heroicons-outline:document-arrow-down</FuseSvgIcon>
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <IconButton 
                                                    size="small" 
                                                    className="bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-xl" 
                                                    onClick={() => { setSelectedReport(report); setDialogOpen(true); }}
                                                >
                                                    <FuseSvgIcon size={20}>heroicons-outline:pencil-square</FuseSvgIcon>
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </TableContainer>

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
