import { useState, useMemo, useEffect } from 'react';
import { useAllObjects } from '../building-progress/buildingApi';
import Typography from '@mui/material/Typography';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, FormControl, Select, MenuItem, Box, CircularProgress, Pagination } from '@mui/material';
import { useNavigate } from 'react-router';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend as RechartsLegend } from 'recharts';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/PendingActions';

function ListingObjectApp() {
    const { data: objects, isLoading } = useAllObjects();
    const navigate = useNavigate();

    // Filtering state
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [systemFilter, setSystemFilter] = useState<string>('All');
    const [typeFilter, setTypeFilter] = useState<string>('All');
    const [floorFilter, setFloorFilter] = useState<string>('All');

    // Extract unique floors for the dropdown
    const availableFloors = useMemo(() => {
        if (!objects) return [];
        const floorSet = new Set<string>();
        objects.forEach(obj => {
            if (obj.zone?.floor?.floor_number) {
                floorSet.add(obj.zone.floor.floor_number);
            }
        });
        return Array.from(floorSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }, [objects]);

    const filteredObjects = useMemo(() => {
        if (!objects) return [];
        return objects.filter((row) => {
            const status = row.latest_status?.current_status || 'Pending';
            const shapeType = row.shape_type || 'point';
            const system = row.system_type || '';
            const floorNum = row.zone?.floor?.floor_number || '';

            if (statusFilter !== 'All' && status !== statusFilter) return false;
            if (systemFilter !== 'All' && system.toLowerCase() !== systemFilter.toLowerCase()) return false;
            if (typeFilter !== 'All' && shapeType.toLowerCase() !== typeFilter.toLowerCase()) return false;
            if (floorFilter !== 'All' && floorNum !== floorFilter) return false;

            return true;
        });
    }, [objects, statusFilter, systemFilter, typeFilter, floorFilter]);

    // Pagination
    const [page, setPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 50;

    useEffect(() => {
        setPage(1);
    }, [statusFilter, systemFilter, typeFilter, floorFilter]);

    const paginatedObjects = useMemo(() => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        return filteredObjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredObjects, page]);

    const totalPages = Math.ceil(filteredObjects.length / ITEMS_PER_PAGE);

    // KPI Metrics
    const totalObjectsCount = filteredObjects.length;
    const completedObjectsCount = filteredObjects.filter(o => (o.latest_status?.current_status || 'Pending') === 'Completed').length;
    const pendingObjectsCount = totalObjectsCount - completedObjectsCount;

    // Charts Data
    const statusCounts = useMemo(() => {
        const counts = filteredObjects.reduce((acc, obj) => {
            const status = obj.latest_status?.current_status || 'Pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => {
            let color = '#ef4444'; // Pending
            if (name === 'Completed') color = '#10b981';
            else if (name === 'Fix1') color = '#3b82f6';
            else if (name === 'Fix2') color = '#f59e0b';
            return { name, value, color };
        });
    }, [filteredObjects]);

    const systemCountsData = useMemo(() => {
        const counts = filteredObjects.reduce((acc, obj) => {
            const system = (obj.system_type || 'Unknown').toUpperCase();
            acc[system] = (acc[system] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, count]) => ({
            name,
            count
        })).sort((a, b) => b.count - a.count);
    }, [filteredObjects]);

    return (
        <div className="flex flex-col w-full min-h-full bg-gray-100 dark:bg-gray-900">
            {/* Compact header bar identical to Inventory */}
            <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
                <div className="w-1 h-8 rounded-full bg-blue-500 shrink-0" />
                <div>
                    <Typography variant="subtitle1" className="font-bold leading-tight text-gray-800 dark:text-gray-100">
                        System Objects Directory
                    </Typography>
                    <Typography variant="caption" className="text-gray-400 leading-none">
                        Manage mapped system devices and their statuses
                    </Typography>
                </div>
            </div>

            <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-6">

                {/* KPI Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <Paper className="p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-800/80 transform transition-transform hover:-translate-y-1">
                            <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-xl shadow-inner">
                                <AssignmentIcon fontSize="large" />
                            </div>
                            <div>
                                <Typography variant="caption" className="font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Objects</Typography>
                                <Typography variant="h4" className="font-black text-gray-800 dark:text-gray-100">
                                    {isLoading ? <CircularProgress size={20} /> : totalObjectsCount.toLocaleString()}
                                </Typography>
                            </div>
                        </Paper>
                    </div>
                    <div>
                        <Paper className="p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-800 dark:to-gray-800/80 transform transition-transform hover:-translate-y-1">
                            <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-xl shadow-inner">
                                <CheckCircleIcon fontSize="large" />
                            </div>
                            <div>
                                <Typography variant="caption" className="font-bold text-gray-500 uppercase tracking-wider block mb-1">Completed</Typography>
                                <Typography variant="h4" className="font-black text-emerald-600 dark:text-emerald-400">
                                    {isLoading ? <CircularProgress size={20} /> : completedObjectsCount.toLocaleString()}
                                </Typography>
                            </div>
                        </Paper>
                    </div>
                    <div>
                        <Paper className="p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gradient-to-br from-white to-amber-50/50 dark:from-gray-800 dark:to-gray-800/80 transform transition-transform hover:-translate-y-1">
                            <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 rounded-xl shadow-inner">
                                <PendingIcon fontSize="large" />
                            </div>
                            <div>
                                <Typography variant="caption" className="font-bold text-gray-500 uppercase tracking-wider block mb-1">Pending / Working</Typography>
                                <Typography variant="h4" className="font-black text-amber-600 dark:text-amber-400">
                                    {isLoading ? <CircularProgress size={20} /> : pendingObjectsCount.toLocaleString()}
                                </Typography>
                            </div>
                        </Paper>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4">
                        <Paper className="p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col bg-white dark:bg-gray-800">
                            <Typography variant="subtitle1" className="font-bold text-gray-800 dark:text-gray-100 mb-2">Status Distribution</Typography>
                            <Box className="flex-1 min-h-[250px] relative flex items-center justify-center">
                                {isLoading ? <CircularProgress /> : statusCounts.length === 0 ? (
                                    <Typography className="text-gray-400">No data available.</Typography>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={statusCounts}
                                                    cx="50%" cy="50%"
                                                    innerRadius={60} outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {statusCounts.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <Box className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <Typography variant="h5" className="font-black text-gray-800 dark:text-gray-100 leading-none">
                                                {totalObjectsCount}
                                            </Typography>
                                            <Typography variant="caption" className="text-gray-500 font-bold uppercase text-[10px]">
                                                Total
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Paper>
                    </div>

                    <div className="md:col-span-8">
                        <Paper className="p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col bg-white dark:bg-gray-800">
                            <Typography variant="subtitle1" className="font-bold text-gray-800 dark:text-gray-100 mb-2">System Volume</Typography>
                            <Box className="flex-1 min-h-[250px] flex items-center justify-center">
                                {isLoading ? <CircularProgress /> : systemCountsData.length === 0 ? (
                                    <Typography className="text-gray-400">No data available.</Typography>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={systemCountsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                            <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="count" name="Objects" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                                {systemCountsData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'][index % 5]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </Box>
                        </Paper>
                    </div>
                </div>

                <Paper className="rounded-xl shadow-sm overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-800">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 dark:bg-gray-800 gap-4">
                        <div className="flex items-center gap-2">
                            <Typography variant="subtitle2" className="font-bold dark:text-gray-100 uppercase tracking-wide text-gray-600">Filters</Typography>
                            <Chip size="small" label={`${filteredObjects.length} results`} className="bg-blue-100 text-blue-700 font-bold" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
                                <Select
                                    value={systemFilter}
                                    onChange={(e) => setSystemFilter(e.target.value)}
                                    displayEmpty
                                    sx={{ height: 36, fontSize: '0.85rem', bgcolor: 'background.paper', borderRadius: 2 }}
                                >
                                    <MenuItem value="All"><span className="text-sm font-semibold text-gray-700">All Systems</span></MenuItem>
                                    <MenuItem value="bss"><span className="text-sm font-bold text-indigo-700 uppercase">BSS</span></MenuItem>
                                    <MenuItem value="pa"><span className="text-sm font-bold text-indigo-700 uppercase">PA</span></MenuItem>
                                    <MenuItem value="telco"><span className="text-sm font-bold text-indigo-700 uppercase">TELCO</span></MenuItem>
                                </Select>
                            </FormControl>



                            <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
                                <Select
                                    value={floorFilter}
                                    onChange={(e) => setFloorFilter(e.target.value)}
                                    displayEmpty
                                    sx={{ height: 36, fontSize: '0.85rem', bgcolor: 'background.paper', borderRadius: 2 }}
                                >
                                    <MenuItem value="All"><span className="text-sm font-semibold text-gray-700">All Floors</span></MenuItem>
                                    {availableFloors.map(floor => (
                                        <MenuItem key={floor} value={floor}><span className="text-sm font-bold text-gray-700">Level {floor}</span></MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    displayEmpty
                                    sx={{ height: 36, fontSize: '0.85rem', bgcolor: 'background.paper', borderRadius: 2 }}
                                >
                                    <MenuItem value="All"><span className="text-sm font-semibold text-gray-700">All Statuses</span></MenuItem>
                                    <MenuItem value="Completed"><span className="text-sm text-emerald-600 font-bold">Completed</span></MenuItem>
                                    <MenuItem value="Pending"><span className="text-sm text-red-600 font-bold">Pending</span></MenuItem>
                                    <MenuItem value="Fix1"><span className="text-sm text-blue-600 font-bold">Fix1</span></MenuItem>
                                    <MenuItem value="Fix2"><span className="text-sm text-amber-600 font-bold">Fix2</span></MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 bg-white dark:bg-gray-800 text-[11px] py-3 pl-5 border-b-2">Alias ID</TableCell>
                                    <TableCell className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 bg-white dark:bg-gray-800 text-[11px] py-3 border-b-2">Item Name</TableCell>
                                    <TableCell className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 bg-white dark:bg-gray-800 text-[11px] py-3 border-b-2">System</TableCell>
                                    <TableCell className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 bg-white dark:bg-gray-800 text-[11px] py-3 border-b-2">Status</TableCell>
                                    <TableCell className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 bg-white dark:bg-gray-800 text-[11px] py-3 border-b-2">Type</TableCell>
                                    <TableCell className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 bg-white dark:bg-gray-800 text-[11px] py-3 border-b-2">Cabling Type</TableCell>
                                    <TableCell className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 bg-white dark:bg-gray-800 text-[11px] py-3 border-b-2">Building</TableCell>
                                    <TableCell className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 bg-white dark:bg-gray-800 text-[11px] py-3 border-b-2">Floor</TableCell>
                                    <TableCell className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 bg-white dark:bg-gray-800 text-[11px] py-3 border-b-2">Zone</TableCell>
                                    <TableCell className="font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 bg-white dark:bg-gray-800 text-[11px] py-3 pr-5 border-b-2" align="right">Created By</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedObjects.map((row) => {
                                    const status = row.latest_status?.current_status || 'Pending';
                                    let colorClass = 'bg-gray-100 text-gray-700';
                                    if (status === 'Pending') colorClass = 'bg-red-50 text-red-700 dark:bg-red-900/50 border border-red-200 dark:border-red-800';
                                    else if (status === 'Fix1') colorClass = 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800';
                                    else if (status === 'Fix2') colorClass = 'bg-amber-50 text-amber-700 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-800';
                                    else if (status === 'Completed') colorClass = 'bg-emerald-50 text-emerald-700 dark:bg-green-900/50 border border-emerald-200 dark:border-emerald-800';

                                    const buildingStr = row.zone?.floor?.building?.name || 'N/A';
                                    const floorStr = row.zone?.floor?.floor_number ? `Level ${row.zone.floor.floor_number}` : 'N/A';
                                    const zoneStr = row.zone?.name || 'N/A';

                                    const handleRowClick = () => {
                                        if (row.zone) {
                                            navigate('/building-progress', {
                                                state: {
                                                    buildingId: row.zone.floor?.building_id,
                                                    floorId: row.zone.floor_id,
                                                    zoneId: row.zone_id,
                                                    systemType: row.system_type
                                                }
                                            });
                                        }
                                    };

                                    return (
                                        <TableRow
                                            key={row.id}
                                            hover
                                            className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/50 group cursor-pointer"
                                            onClick={handleRowClick}
                                        >
                                            <TableCell className="font-bold text-gray-800 dark:text-gray-100 text-sm py-2 pl-5 tracking-tight">{row.item_alias_id}</TableCell>
                                            <TableCell className="font-medium text-gray-700 dark:text-gray-300 text-sm py-2">{row.item_name}</TableCell>
                                            <TableCell className="py-2"><Chip label={row.system_type?.toUpperCase()} size="small" className="bg-indigo-50/80 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800" sx={{ height: 22, fontSize: '0.7rem' }} /></TableCell>
                                            <TableCell className="py-2"><Chip label={status} size="small" className={`${colorClass} font-bold`} sx={{ height: 22, fontSize: '0.7rem' }} /></TableCell>
                                            <TableCell className="py-2">
                                                <Chip label={row.shape_type || 'point'} size="small" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 font-medium capitalize border border-gray-200 dark:border-gray-700" sx={{ height: 22, fontSize: '0.7rem' }} />
                                            </TableCell>
                                            <TableCell className="text-gray-500 font-medium dark:text-gray-400 text-xs py-2">{row.cabling_type || '-'}</TableCell>
                                            <TableCell className="text-gray-500 font-medium dark:text-gray-400 text-xs py-2">{buildingStr}</TableCell>
                                            <TableCell className="text-gray-500 font-medium dark:text-gray-400 text-xs py-2">{floorStr}</TableCell>
                                            <TableCell className="text-gray-500 font-medium dark:text-gray-400 text-xs py-2">{zoneStr}</TableCell>
                                            <TableCell className="text-gray-400 font-mono dark:text-gray-500 text-[11px] py-2 pr-5" align="right">{row.user?.displayName || row.user?.name || 'System'}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="py-3 px-4 border-t border-gray-100 dark:border-gray-700 flex justify-end items-center bg-white dark:bg-gray-800">
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, val) => setPage(val)}
                                color="primary"
                                showFirstButton
                                showLastButton
                                shape="rounded"
                                size="small"
                                className="dark:text-gray-100"
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        color: 'inherit',
                                    }
                                }}
                            />
                        </div>
                    )}
                </Paper>
            </div>
        </div>
    );
}

export default ListingObjectApp;
