import { useState, useMemo } from 'react';
import { Paper, Typography, Box, CircularProgress, Button, TextField, InputAdornment, Chip, Avatar, IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useRiskAssessments, RiskAssessment } from '../../scheduling/scheduleApi';
import RiskAssessmentDialog from './RiskAssessmentDialog';
import { motion, AnimatePresence } from 'framer-motion';
import useUser from '@auth/useUser';

function RiskAssessmentWidget() {
    const { data: reports, isLoading } = useRiskAssessments();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<RiskAssessment | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'fire' | 'hazard' | 'health' | 'security'>('all');
    const { data: user } = useUser();

    const isSupervisor = user?.role === 'supervisor' || (Array.isArray(user?.role) && user.role.includes('supervisor'));

    const stats = useMemo(() => {
        if (!reports) return { total: 0, high: 0, medium: 0, low: 0 };
        return {
            total: reports.length,
            high: reports.filter(r => r.risk_level === 'high' || r.risk_level === 'extreme').length,
            medium: reports.filter(r => r.risk_level === 'medium').length,
            low: reports.filter(r => r.risk_level === 'low').length,
        };
    }, [reports]);

    const RISK_PRIORITY = {
        extreme: 4,
        high: 3,
        medium: 2,
        low: 1,
    };

    const filteredReports = useMemo(() => {
        if (!reports) return [];
        return reports
            .filter(report => {
                const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesType = typeFilter === 'all' || report.type === typeFilter;
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                const priorityA = RISK_PRIORITY[a.risk_level] || 0;
                const priorityB = RISK_PRIORITY[b.risk_level] || 0;
                return priorityB - priorityA;
            });
    }, [reports, searchQuery, typeFilter]);

    const getRiskLevelStyles = (level: string) => {
        switch (level) {
            case 'extreme':
            case 'high': return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', icon: 'heroicons-outline:exclamation-triangle' };
            case 'medium': return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', icon: 'heroicons-outline:exclamation-circle' };
            case 'low': return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: 'heroicons-outline:check-circle' };
            default: return { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-600 dark:text-gray-400', icon: 'heroicons-outline:information-circle' };
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'fire': return 'heroicons-outline:fire';
            case 'hazard': return 'heroicons-outline:exclamation-triangle';
            case 'health': return 'heroicons-outline:heart';
            case 'security': return 'heroicons-outline:shield-check';
            case 'environmental': return 'heroicons-outline:globe-alt';
            default: return 'heroicons-solid:document-text';
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
                        <FuseSvgIcon size={32} className="text-red-500">heroicons-outline:shield-exclamation</FuseSvgIcon>
                        Overall Risk Dashboard
                    </Typography>
                    <Typography variant="body1" className="text-gray-500 font-medium mt-1">
                        Comprehensive monitoring and assessment of site safety and hazards.
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
                        className="rounded-2xl font-bold h-[48px] px-8 shadow-xl shadow-red-500/10 transform hover:scale-105 transition-all bg-red-600 hover:bg-red-700"
                    >
                        Create New Assessment
                    </Button>
                )}
            </Box>

            {/* Stats Dashboard */}
            <Box className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[
                    { label: 'Total Assessments', value: stats.total, color: 'blue', icon: 'heroicons-outline:clipboard-document-list' },
                    { label: 'High Risk', value: stats.high, color: 'red', icon: 'heroicons-outline:fire' },
                    { label: 'Medium Risk', value: stats.medium, color: 'amber', icon: 'heroicons-outline:exclamation-circle' },
                    { label: 'Low Risk', value: stats.low, color: 'green', icon: 'heroicons-outline:check-circle' }
                ].map((stat) => (
                    <Paper key={stat.label} className="p-6 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center gap-5 hover:border-red-200 transition-colors group cursor-default">
                        <Avatar className={`bg-${stat.color === 'red' ? 'red' : stat.color}-100 text-${stat.color === 'red' ? 'red' : stat.color}-600 dark:bg-${stat.color === 'red' ? 'red' : stat.color}-900/30 dark:text-${stat.color === 'red' ? 'red' : stat.color}-400 w-14 h-14 rounded-2xl group-hover:scale-110 transition-transform`}>
                            <FuseSvgIcon size={28}>{stat.icon}</FuseSvgIcon>
                        </Avatar>
                        <Box>
                            <Typography variant="h4" className={`font-black leading-tight ${stat.color === 'red' ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}`}>
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
                    {(['all', 'fire', 'hazard', 'health', 'security'] as const).map((type) => (
                        <Chip
                            key={type}
                            label={type.charAt(0).toUpperCase() + type.slice(1)}
                            onClick={() => setTypeFilter(type)}
                            className={`rounded-2xl font-black px-4 h-[40px] transition-all border-none ${
                                typeFilter === type 
                                ? 'bg-white dark:bg-gray-800 text-red-600 shadow-sm' 
                                : 'bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                            }`}
                        />
                    ))}
                </Box>
                <TextField
                    placeholder="Search by title..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white dark:bg-gray-800 rounded-3xl w-full sm:w-[320px]"
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

            {/* Reports Table */}
            <TableContainer component={Paper} className="rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
                <Table stickyHeader sx={{ minWidth: 1000 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 px-8 border-b-none">Type</TableCell>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none">Assessment Title</TableCell>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none text-center">Risk Level</TableCell>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none">Assessed By</TableCell>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none">Date</TableCell>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 px-8 border-b-none text-right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {filteredReports.map((report) => {
                                const levelStyle = getRiskLevelStyles(report.risk_level);
                                return (
                                    <TableRow
                                        key={report.id}
                                        component={motion.tr}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors group cursor-pointer"
                                        onClick={() => { setSelectedReport(report); setDialogOpen(true); }}
                                    >
                                        <TableCell className="px-8 py-6 border-gray-100 dark:border-gray-700/50">
                                            <Box className="flex items-center gap-3">
                                                <Avatar className="bg-gray-100 dark:bg-gray-800 text-gray-500 w-10 h-10 rounded-xl">
                                                    <FuseSvgIcon size={20}>{getTypeIcon(report.type)}</FuseSvgIcon>
                                                </Avatar>
                                                <Typography variant="body2" className="font-black uppercase tracking-widest text-gray-500">{report.type}</Typography>
                                            </Box>
                                        </TableCell>
                                        
                                        <TableCell className="py-6 border-gray-100 dark:border-gray-700/50">
                                            <Typography variant="body1" className="font-black text-gray-800 dark:text-gray-100 group-hover:text-red-600 transition-colors">
                                                {report.title}
                                            </Typography>
                                            <Typography variant="caption" className="text-gray-400 font-medium line-clamp-1 mt-1 max-w-[300px]">
                                                {report.description || 'No detailed description.'}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="py-6 border-gray-100 dark:border-gray-700/50 text-center">
                                            <Box className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${levelStyle.bg} ${levelStyle.text}`}>
                                                <FuseSvgIcon size={16}>{levelStyle.icon}</FuseSvgIcon>
                                                <Typography variant="caption" className="font-black uppercase tracking-widest">{report.risk_level}</Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell className="py-6 border-gray-100 dark:border-gray-700/50">
                                            <Box className="flex items-center gap-3">
                                                <Avatar className="w-8 h-8 text-[11px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                    {(report.created_by?.displayName || report.created_by?.name || '?')[0].toUpperCase()}
                                                </Avatar>
                                                <Typography variant="body2" className="font-black text-gray-700 dark:text-gray-300">
                                                    {report.created_by?.displayName || report.created_by?.name || 'Unknown'}
                                                </Typography>
                                            </Box>
                                        </TableCell>

                                        <TableCell className="py-6 border-gray-100 dark:border-gray-700/50">
                                            <Typography variant="body2" className="text-gray-500 font-bold font-mono">
                                                {new Date(report.assessment_date).toLocaleDateString()}
                                            </Typography>
                                        </TableCell>

                                        <TableCell className="px-8 py-6 border-gray-100 dark:border-gray-700/50 text-right">
                                            <Box className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                <IconButton 
                                                    size="small" 
                                                    className="bg-gray-50 dark:bg-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-xl" 
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
                <Box className="flex flex-col items-center justify-center py-32 text-center">
                    <Avatar className="bg-gray-50 dark:bg-gray-800/50 w-32 h-32 mb-6 text-gray-200">
                        <FuseSvgIcon size={64}>heroicons-outline:shield-check</FuseSvgIcon>
                    </Avatar>
                    <Typography variant="h5" className="font-black text-gray-300 uppercase tracking-tighter">No assessments found</Typography>
                    <Typography variant="body1" className="text-gray-400 mt-2 max-w-sm">
                        Everything looks safe! Start a new risk assessment to document potential site hazards.
                    </Typography>
                </Box>
            )}

            <RiskAssessmentDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                report={selectedReport}
            />
        </Box>
    );
}

export default RiskAssessmentWidget;
