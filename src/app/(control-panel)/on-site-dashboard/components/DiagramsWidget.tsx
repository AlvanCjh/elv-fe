import { useState, useMemo } from 'react';
import { 
    Paper, 
    Typography, 
    Box, 
    CircularProgress, 
    Button, 
    TextField, 
    InputAdornment, 
    Chip, 
    Avatar, 
    IconButton, 
    Tooltip, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow 
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useDiagrams, Diagram, deleteDiagram } from '../../scheduling/scheduleApi';
import DiagramDialog from './DiagramDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/utils/api';
import useUser from '@auth/useUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DiagramsWidgetProps {
    type: 'drawing' | 'schematic';
}

function DiagramsWidget({ type }: DiagramsWidgetProps) {
    const { data: diagrams, isLoading } = useDiagrams(type);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDiagram, setSelectedDiagram] = useState<Diagram | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approve'>('all');
    const { data: user } = useUser();
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteDiagram(type, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['diagrams'] });
        }
    });

    const isSupervisor = user?.role === 'supervisor' || (Array.isArray(user?.role) && user.role.includes('supervisor'));

    const stats = useMemo(() => {
        if (!diagrams) return { total: 0, submitted: 0, approved: 0 };
        return {
            total: diagrams.length,
            submitted: diagrams.filter(r => r.status === 'submitted').length,
            approved: diagrams.filter(r => r.status === 'approve').length,
        };
    }, [diagrams]);

    const filteredDiagrams = useMemo(() => {
        if (!diagrams) return [];
        return diagrams.filter(diagram => {
            const matchesSearch = diagram.project_title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || diagram.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [diagrams, searchQuery, statusFilter]);

    if (isLoading) {
        return (
            <Box className="flex items-center justify-center h-full min-h-[400px]">
                <CircularProgress size={40} thickness={4} />
            </Box>
        );
    }

    const title = type === 'drawing' ? 'Drawing Diagrams' : 'Schematic Diagrams';
    const icon = type === 'drawing' ? 'heroicons-outline:pencil-square' : 'heroicons-outline:square-3-stack-3d';
    const color = type === 'drawing' ? 'indigo' : 'purple';

    return (
        <Box className="flex flex-col gap-8 p-6 lg:p-8">
            {/* Header Area */}
            <Box className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <Box>
                    <Typography variant="h4" className="font-black text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <FuseSvgIcon size={32} className={`text-${color}-500`}>{icon}</FuseSvgIcon>
                        {title} Dashboard
                    </Typography>
                    <Typography variant="body1" className="text-gray-500 font-medium mt-1">
                        Manage and track {type} documentation for your project.
                    </Typography>
                </Box>
                {isSupervisor && (
                    <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
                        onClick={() => {
                            setSelectedDiagram(null);
                            setDialogOpen(true);
                        }}
                        className={`rounded-2xl font-bold h-[48px] px-8 shadow-xl shadow-${color}-500/20 transform hover:scale-105 transition-transform`}
                        sx={{ 
                            background: type === 'drawing' ? 'indigo' : 'purple',
                            '&:hover': { background: type === 'drawing' ? 'darkindigo' : 'darkpurple' }
                        }}
                    >
                        New {type === 'drawing' ? 'Drawing' : 'Schematic'}
                    </Button>
                )}
            </Box>

            {/* Stats Dashboard */}
            <Box className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: 'Total', value: stats.total, color: 'blue', icon: 'heroicons-outline:document-text' },
                    { label: 'Submitted', value: stats.submitted, color: 'amber', icon: 'heroicons-outline:clock' },
                    { label: 'Approved', value: stats.approved, color: 'green', icon: 'heroicons-outline:check-circle' },
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
                    {(['all', 'submitted', 'approve'] as const).map((status) => (
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
                        placeholder="Search by project title..."
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
            </Box>

            {/* Table Area */}
            <TableContainer component={Paper} className="rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
                <Table stickyHeader sx={{ minWidth: 800 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 px-8 border-b-none">Status</TableCell>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none">Project Title</TableCell>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none">Uploaded By</TableCell>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 border-b-none text-right pr-12">Date</TableCell>
                            <TableCell className="bg-gray-50/50 dark:bg-gray-900/50 font-black text-gray-500 uppercase tracking-widest text-[11px] py-6 px-10 border-b-none text-right sticky right-0 z-20 backdrop-blur-md">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {filteredDiagrams.map((diagram) => (
                                <TableRow
                                    key={diagram.id}
                                    component={motion.tr}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer"
                                >
                                    <TableCell className="py-6 px-8 border-gray-100 dark:border-gray-700/50">
                                        <Chip 
                                            label={diagram.status}
                                            size="small"
                                            className={`rounded-full font-black uppercase tracking-widest px-2 ${
                                                diagram.status === 'approve' 
                                                ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                            }`}
                                        />
                                    </TableCell>
                                    <TableCell className="py-6 border-gray-100 dark:border-gray-700/50 font-black text-gray-800 dark:text-gray-100">
                                        {diagram.project_title}
                                    </TableCell>
                                    <TableCell className="py-6 border-gray-100 dark:border-gray-700/50">
                                        <Box className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8 text-[11px] font-black bg-blue-50 text-blue-600 border border-blue-100">
                                                {(diagram.uploader?.displayName || diagram.uploader?.name || '?')[0].toUpperCase()}
                                            </Avatar>
                                            <Typography variant="body2" className="font-black text-gray-700 dark:text-gray-300">
                                                {diagram.uploader?.displayName || diagram.uploader?.name || 'Unknown'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell className="py-6 border-gray-100 dark:border-gray-700/50 text-right pr-12">
                                        <Typography variant="caption" className="font-bold text-gray-500">
                                            {new Date(diagram.created_at).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell className="px-10 py-6 border-gray-100 dark:border-gray-700/50 text-right sticky right-0 bg-white dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors z-10">
                                        <Box className="flex justify-end gap-2">
                                            {diagram.file_path && (
                                                <Tooltip title="View PDF">
                                                    <IconButton 
                                                        size="small" 
                                                        className="bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-xl"
                                                        onClick={() => window.open(`${API_BASE_URL}/storage/${diagram.file_path}`, '_blank')}
                                                    >
                                                        <FuseSvgIcon size={20}>heroicons-outline:document-arrow-down</FuseSvgIcon>
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {isSupervisor && (
                                                <>
                                                    <IconButton 
                                                        size="small" 
                                                        className="bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-xl"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedDiagram(diagram); setDialogOpen(true); }}
                                                    >
                                                        <FuseSvgIcon size={20}>heroicons-outline:pencil-square</FuseSvgIcon>
                                                    </IconButton>
                                                    <IconButton 
                                                        size="small" 
                                                        className="bg-gray-50 dark:bg-gray-700 hover:bg-red-50 hover:text-red-500 transition-colors rounded-xl"
                                                        onClick={(e) => { 
                                                            e.stopPropagation();
                                                            if (window.confirm('Are you sure you want to delete this document?')) {
                                                                deleteMutation.mutate(diagram.id);
                                                            }
                                                        }}
                                                    >
                                                        <FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>
                                                    </IconButton>
                                                </>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </TableContainer>

            <DiagramDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                diagram={selectedDiagram}
                type={type}
            />
        </Box>
    );
}

export default DiagramsWidget;
