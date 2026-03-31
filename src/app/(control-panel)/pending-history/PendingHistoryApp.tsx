import { useState, useEffect } from 'react';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, TextField, MenuItem, Select, InputAdornment } from '@mui/material';
import { usePendingHistories, PinStatus, ZoneCategory } from '../building-progress/buildingApi';
import { PIN_COLORS, PIN_LABELS, PIN_STATUSES } from '@/app/(control-panel)/building-progress/components/annotationHelpers';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { useProject } from '@/context/ProjectContext';

function PendingHistoryApp() {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState<PinStatus | 'ALL'>('ALL');
    const [category, setCategory] = useState<ZoneCategory | 'ALL'>('ALL');
    const [sort, setSort] = useState<'desc' | 'asc'>('desc');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const { activeProject: selectedProject } = useProject();

    // We pass the filter objects into the hook so the backend fetches correctly.
    const { data: histories, isLoading, refetch, isFetching } = usePendingHistories({ search: debouncedSearch, status, category, sort, startDate, endDate, projectId: selectedProject?.id });
    
    const navigate = useNavigate();

    const handleLocate = (buildingId: number, floorId: number, annotationId: number) => {
        navigate(`/building-progress?buildingId=${buildingId}&floorId=${floorId}&annotationId=${annotationId}`);
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (isLoading) return <FuseLoading />;

    return (
        <div className="flex flex-col w-full h-[calc(100vh-80px)] bg-gray-100 overflow-hidden">
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="px-8 py-6 bg-white shadow-sm border-b border-gray-200 shrink-0 flex flex-col items-start gap-4 lg:flex-row lg:items-center justify-between"
            >
                <motion.div variants={item}>
                    <Typography variant="h4" className="font-extrabold tracking-tight">
                        Audit Log
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 mt-1">
                        Complete immutable log of all issue updates and status changes.
                    </Typography>
                </motion.div>
                
                {/* ── Filter Tools ── */}
                <motion.div variants={item} className="flex items-center gap-3 w-full lg:w-auto">
                    <Tooltip title="Refresh Logs">
                        <span>
                            <IconButton 
                                onClick={() => refetch()} 
                                disabled={isFetching}
                                className={`bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 ${isFetching ? 'opacity-50' : ''}`}
                            >
                                <FuseSvgIcon size={20} className={isFetching ? 'animate-spin' : ''}>heroicons-outline:arrow-path</FuseSvgIcon>
                            </IconButton>
                        </span>
                    </Tooltip>
                    
                    <TextField 
                        size="small" 
                        placeholder="Search logs..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-gray-50 flex-1 lg:w-60"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FuseSvgIcon size={20}>heroicons-outline:magnifying-glass</FuseSvgIcon>
                                </InputAdornment>
                            ),
                        }}
                    />
                    
                    <TextField
                        size="small"
                        type="date"
                        label="From"
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-gray-50 flex-1 lg:max-w-[140px]"
                    />
                    
                    <TextField
                        size="small"
                        type="date"
                        label="To"
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-gray-50 flex-1 lg:max-w-[140px]"
                    />
                    
                    <Select
                        size="small"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ZoneCategory | 'ALL')}
                        className="bg-gray-50 w-32"
                    >
                        <MenuItem value="ALL"><span className="font-bold text-gray-400">All Systems</span></MenuItem>
                        <MenuItem value="BSS">BSS</MenuItem>
                        <MenuItem value="TEL">TEL</MenuItem>
                        <MenuItem value="PAM">PAM</MenuItem>
                    </Select>

                    <Select
                        size="small"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as PinStatus | 'ALL')}
                        className="bg-gray-50 w-40"
                    >
                        <MenuItem value="ALL"><span className="font-bold text-gray-400">All Statuses</span></MenuItem>
                        {PIN_STATUSES.map(s => (
                            <MenuItem key={s} value={s}>
                                <div className="flex items-center gap-2">
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: PIN_COLORS[s] }} />
                                    {PIN_LABELS[s]}
                                </div>
                            </MenuItem>
                        ))}
                    </Select>
                </motion.div>
            </motion.div>

            <div className="p-8 w-full h-full overflow-auto">
                <motion.div variants={item}>
                    <TableContainer component={Paper} elevation={1} className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                        <Table size="small">
                            <TableHead className="bg-slate-50">
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary', cursor: 'pointer' }} onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}>
                                        <div className="flex items-center gap-1 hover:text-gray-900 transition-colors">
                                            Date & Time
                                            <FuseSvgIcon size={16} className="text-gray-400">
                                                {sort === 'desc' ? 'heroicons-outline:arrow-down' : 'heroicons-outline:arrow-up'}
                                            </FuseSvgIcon>
                                        </div>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Location/Base</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Object Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Status Set</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Remarks</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Updated By</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {histories?.map((row) => {
                                    const clickable = !!row.annotation?.floor;
                                    return (
                                    <TableRow 
                                        key={row.id} 
                                        className={`transition-colors ${clickable ? 'cursor-pointer hover:bg-indigo-50' : 'hover:bg-slate-50'}`}
                                        onClick={() => {
                                            if (clickable) {
                                                const bId = row.annotation?.floor?.building_id;
                                                const fId = row.annotation?.floor_id;
                                                const aId = row.floor_annotation_id;
                                                if (bId && fId && aId) {
                                                    handleLocate(bId, fId, aId);
                                                }
                                            }
                                        }}
                                    >
                                        <TableCell className="whitespace-nowrap">
                                            {new Date(row.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-gray-800">{row.base_location}</div>
                                            {row.annotation?.floor && (
                                                <div className="text-xs text-blue-600 font-mono">
                                                    Floor {row.annotation.floor.floor_number}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {row.name || 'Unnamed Issue'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={PIN_LABELS[row.status] || row.status} 
                                                size="small"
                                                sx={{ 
                                                    bgcolor: `${PIN_COLORS[row.status]}15`, 
                                                    color: PIN_COLORS[row.status],
                                                    fontWeight: 700,
                                                    fontSize: 11
                                                }} 
                                            />
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={row.remarks}>
                                            {row.remarks || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {row.user?.name || 'Unknown'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {clickable && (
                                                <Tooltip title="Locate on Floor Plan">
                                                    <IconButton size="small" color="primary">
                                                        <FuseSvgIcon size={20}>heroicons-outline:map-pin</FuseSvgIcon>
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            {!histories?.length && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" className="py-8 text-gray-400">
                                        No history records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </TableContainer>
                </motion.div>
            </div>
        </div>
    );
}

export default PendingHistoryApp;
