'use client';
import { useState, useMemo, useEffect } from 'react';
import { 
    Paper, Typography, Box, CircularProgress, Button, 
    TextField, InputAdornment, Chip, Avatar, IconButton, 
    Tooltip, Grid 
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useInspectionReports, InspectionReport } from '../scheduling/scheduleApi';
import InspectionReportDialog from '../on-site-dashboard/components/InspectionReportDialog';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE_URL } from '@/utils/api';
import useUser from '@auth/useUser';
import { useProject } from '@/context/ProjectContext';
import { useNavigate } from 'react-router';

export default function InspectionReportPage() {
    const { activeProjectId } = useProject();
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { data: reports, isLoading } = useInspectionReports(startDate, endDate);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approve' | 'approve with comment' | 'rejected' | 'standby'>('all');
    const { data: user } = useUser();

    useEffect(() => {
        if (!activeProjectId) {
            navigate('/select-project');
        }
    }, [activeProjectId, navigate]);

    const isSupervisor = user?.role === 'supervisor' || (Array.isArray(user?.role) && user.role.includes('supervisor'));

    const stats = useMemo(() => {
        if (!reports) return { total: 0, pending: 0, approved: 0, rejected: 0 };
        return {
            total: reports.length,
            pending: reports.filter(r => r.status === 'pending').length,
            approved: reports.filter(r => r.status === 'approve' || r.status === 'approve with comment').length,
            rejected: reports.filter(r => r.status === 'rejected').length
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
            case 'approve': 
                return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: 'heroicons-outline:check-circle' };
            case 'approve with comment': 
                return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'heroicons-outline:chat-bubble-left-right' };
            case 'rejected': 
                return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', icon: 'heroicons-outline:x-circle' };
            case 'standby': 
                return { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-600 dark:text-gray-400', icon: 'heroicons-outline:pause-circle' };
            default: 
                return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', icon: 'heroicons-outline:clock' };
        }
    };

    if (!activeProjectId) return null;

    if (isLoading) {
        return (
            <Box className="flex items-center justify-center h-full min-h-[400px]">
                <CircularProgress size={48} thickness={4} />
            </Box>
        );
    }

    return (
        <Box className="flex flex-col gap-8 p-6 lg:p-10 w-full max-w-[1600px] mx-auto min-h-screen">
            {/* Header Area */}
            <Box className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <Box>
                    <Typography variant="h3" className="font-black text-gray-800 dark:text-gray-100 flex items-center gap-4">
                        <Box className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <FuseSvgIcon size={32}>heroicons-outline:clipboard-document-check</FuseSvgIcon>
                        </Box>
                        Inspection Dashboard
                    </Typography>
                    <Typography variant="body1" className="text-gray-500 font-medium mt-2 ml-18">
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
                        className="rounded-2xl font-black uppercase tracking-widest h-[56px] px-10 shadow-2xl shadow-blue-500/30 bg-blue-600 hover:bg-blue-700 transition-all"
                    >
                        Create New Report
                    </Button>
                )}
            </Box>

            {/* Stats Dashboard */}
            <Box className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[
                    { label: 'Total Reports', value: stats.total, color: 'blue', icon: 'heroicons-outline:document-text' },
                    { label: 'Pending', value: stats.pending, color: 'amber', icon: 'heroicons-outline:clock' },
                    { label: 'Approved', value: stats.approved, color: 'green', icon: 'heroicons-outline:check-circle' },
                    { label: 'Rejected', value: stats.rejected, color: 'red', icon: 'heroicons-outline:x-circle' }
                ].map((stat) => (
                    <Paper key={stat.label} className="p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center gap-6 hover:border-blue-400 transition-all group cursor-default">
                        <Avatar className={`bg-${stat.color}-100 text-${stat.color}-600 dark:bg-${stat.color}-900/30 dark:text-${stat.color}-400 w-16 h-16 rounded-[20px] group-hover:scale-110 transition-transform`}>
                            <FuseSvgIcon size={32}>{stat.icon}</FuseSvgIcon>
                        </Avatar>
                        <Box>
                            <Typography variant="h3" className={`font-black leading-tight text-${stat.color === 'blue' ? 'gray-800 dark:text-gray-100' : stat.color + '-600'}`}>
                                {stat.value}
                            </Typography>
                            <Typography variant="caption" className="text-gray-500 font-bold uppercase tracking-widest leading-none">{stat.label}</Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Toolbar Area */}
            <Box className="flex flex-col lg:flex-row items-center justify-between gap-6 p-4 bg-white dark:bg-gray-800 shadow-sm rounded-[32px] border border-gray-50 dark:border-gray-800">
                <Box className="flex items-center gap-2 p-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-[24px] w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {(['all', 'pending', 'approve', 'approve with comment', 'rejected', 'standby'] as const).map((status) => (
                        <Chip
                            key={status}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            onClick={() => setStatusFilter(status as any)}
                            className={`rounded-2xl font-black px-6 h-[44px] transition-all border-none ${
                                statusFilter === status 
                                ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-md' 
                                : 'bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            }`}
                        />
                    ))}
                </Box>
                <Box className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <Box className="flex items-center gap-2 w-full sm:w-auto">
                        <TextField
                            type="date"
                            label="From"
                            size="small"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl w-full sm:w-[170px]"
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                        />
                        <TextField
                            type="date"
                            label="To"
                            size="small"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl w-full sm:w-[170px]"
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                        />
                    </Box>
                    <TextField
                        placeholder="Search by title or engineer..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl w-full sm:w-[320px]"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FuseSvgIcon size={20} className="text-gray-400 ml-2">heroicons-outline:magnifying-glass</FuseSvgIcon>
                                </InputAdornment>
                            ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '24px', paddingLeft: '8px' } }}
                    />
                </Box>
            </Box>

            {/* Reports Table */}
            <Paper className="rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-xl bg-white dark:bg-gray-800">
                <Box className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Item</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Date Submitted</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Description</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">RFWI Ref No</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Location</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Gridline/Zone</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-gray-400" align="right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {filteredReports.map((report, index) => {
                                    const style = getStatusStyles(report.status);
                                    return (
                                        <motion.tr
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={report.id}
                                            className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-blue-50/10 dark:hover:bg-blue-900/5 transition-colors group"
                                        >
                                            <td className="px-6 py-6 font-black text-gray-400 text-sm">{index + 1}</td>
                                            <td className="px-6 py-6 font-bold text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                                {new Date(report.inspection_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-6 min-w-[300px]">
                                                <Typography variant="body2" className="font-bold text-gray-800 dark:text-gray-100 line-clamp-1">{report.title}</Typography>
                                                <Typography variant="caption" className="text-gray-400 line-clamp-2 mt-1">{report.description}</Typography>
                                            </td>
                                            <td className="px-6 py-6 text-sm font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">{report.rfwi_ref_no || '-'}</td>
                                            <td className="px-6 py-6 text-sm font-bold text-gray-600 dark:text-gray-400">{report.location || '-'}</td>
                                            <td className="px-6 py-6 text-sm font-bold text-gray-600 dark:text-gray-400">{report.gridline_zone || '-'}</td>
                                            <td className="px-6 py-6">
                                                <Chip
                                                    label={report.status.toUpperCase()}
                                                    size="small"
                                                    className={`font-black text-[10px] h-6 px-3 rounded-md ${style.bg} ${style.text}`}
                                                />
                                            </td>
                                            <td className="px-6 py-6" align="right">
                                                <Box className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {report.file_path && (
                                                        <IconButton size="small" className="text-blue-600" onClick={() => window.open(`${API_BASE_URL}/storage/${report.file_path}`, '_blank')}>
                                                            <FuseSvgIcon size={18}>heroicons-outline:document-arrow-down</FuseSvgIcon>
                                                        </IconButton>
                                                    )}
                                                    <IconButton size="small" onClick={() => { setSelectedReport(report); setDialogOpen(true); }}>
                                                        <FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>
                                                    </IconButton>
                                                </Box>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </Box>
            </Paper>

            {filteredReports.length === 0 && (
                <Box className="flex flex-col items-center justify-center py-40 text-center">
                    <Avatar className="bg-gray-50 dark:bg-gray-800/50 w-32 h-32 mb-8 text-gray-200">
                        <FuseSvgIcon size={64}>heroicons-outline:document-magnifying-glass</FuseSvgIcon>
                    </Avatar>
                    <Typography variant="h4" className="font-black text-gray-300 uppercase tracking-tighter">No inspections found</Typography>
                    <Typography variant="body1" className="text-gray-400 mt-4 max-w-sm font-medium">
                        Adjust your filters or search terms to find specific inspection reports.
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
