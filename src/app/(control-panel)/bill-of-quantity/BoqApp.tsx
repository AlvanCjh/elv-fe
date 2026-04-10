import React, { useMemo, useState } from 'react';
import { useBoqSummary } from './boqApi';
import { Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, FormControl, Select, MenuItem, CircularProgress, Grid, Box } from '@mui/material';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend as RechartsLegend } from 'recharts';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { IconButton, Collapse, Button, Tooltip as MuiTooltip } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCsvUpload, CsvItem } from '../building-progress/components/boqCsvApi';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

const ITEM_DESCRIPTIONS: Record<string, string> = {
    'BS1': '3W @ 1.5W TAPPING',
    'CS1': '6W @ 1.5W TAPPING',
    'HS1': '15W @ 10W TAPPING',
    'CAM1': '4MP BULLET CAMERA',
    'CAM3': '4MP DOME CAMERA',
    'R1': 'CARD READER + PUSH BUTTON',
    'R2': 'EM LOCK + BREAKGLASS',
    'R3': 'CARD READER (LIFT CAR)',
    'HP': 'HELP POINT',
    'GT': 'GUARD TOUR',
    'FWS': 'FIBER WALL SOCKET',
    'FTB': 'FIBRE TERMINATION BOARD',
};

function BoqRow({ row }: { row: any }) {
    const [open, setOpen] = useState(false);
    const desc = row.item_name ? ITEM_DESCRIPTIONS[row.item_name] || '-' : '-';

    const aliasIds = useMemo(() => {
        if (!row.alias_ids) return [];
        return row.alias_ids.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
    }, [row.alias_ids]);

    return (
        <>
            <TableRow hover className="transition-colors hover:bg-blue-50/20 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setOpen(!open)}>
                <TableCell className="pl-4 py-2 w-10">
                    <IconButton aria-label="expand row" size="small" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
                        {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                </TableCell>
                <TableCell className="font-bold text-gray-800 dark:text-gray-200 text-sm py-2">{row.item_name}</TableCell>
                <TableCell className="font-medium text-gray-500 dark:text-gray-400 text-[11px] py-2 whitespace-nowrap">{desc}</TableCell>
                <TableCell className="py-2">
                    <Chip label={row.system_type?.toUpperCase()} size="small" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800" sx={{ height: 22, fontSize: '0.7rem' }} />
                </TableCell>
                <TableCell className="py-2 text-gray-500 dark:text-gray-400 text-xs capitalize">
                    {row.shape_type || 'point'}
                </TableCell>
                <TableCell className="text-gray-400 dark:text-gray-500 text-[10px] py-2 uppercase font-bold tracking-widest">{row.unit}</TableCell>
                <TableCell className="font-medium text-emerald-600 dark:text-emerald-400 text-sm py-2" align="center">
                    {Number(row.completed_qty || 0).toLocaleString()}
                </TableCell>
                <TableCell className="font-medium text-amber-500 dark:text-amber-400 text-sm py-2" align="center">
                    {Number(row.finished_qty || 0).toLocaleString()}
                </TableCell>
                <TableCell className="font-medium text-gray-400 dark:text-gray-500 text-sm py-2" align="center">
                    {Number(row.pending_qty || 0).toLocaleString()}
                </TableCell>
                <TableCell className="font-black text-gray-800 dark:text-gray-100 text-base py-2 pr-6" align="right">
                    {Number(row.total_qty || 0).toLocaleString()}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9} className="border-0">
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, padding: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" gutterBottom component="div" className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                                <AssignmentIcon fontSize="small" className="text-blue-500" />
                                Assigned Object IDs
                            </Typography>
                            {aliasIds.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {aliasIds.map((id: string, idx: number) => (
                                        <Chip
                                            key={idx}
                                            label={id}
                                            size="small"
                                            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
                                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Typography variant="caption" className="text-gray-500 italic">No IDs assigned to these items.</Typography>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

function BoqApp({ floorId, externalSystemFilter }: { floorId?: number, externalSystemFilter?: string }) {
    const { data: boqItems, isLoading, error } = useBoqSummary(floorId);
    const queryClient = useQueryClient();

    // Global CSV Upload Logic
    const [isParsingCsv, setIsParsingCsv] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const createUploadMutation = useMutation({
        mutationFn: (data: { filename: string, items: Partial<CsvItem>[] }) => createCsvUpload(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boq-csv-uploads'] });
            // Optionally, we could show a success toast here
            alert("CSV Uploaded successfully!");
        },
        onError: (err) => {
            console.error("CSV Upload failed", err);
            alert("Failed to upload CSV file.");
        }
    });

    const handleGlobalCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsingCsv(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = (event.target?.result as string).replace(/^\ufeff/, '');
                const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                const parsedItems: CsvItem[] = [];

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    // Skip empty lines or header row heuristics
                    if (line.toUpperCase().includes('ITEM ID(S)') || line.toUpperCase().includes('QUANTITY')) continue;

                    const columns = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                    if (columns.length < 3) continue;

                    // New Global Format: [0] Floor, [1] LegendCode, [2] Item IDs (Ranges)
                    const floorNumber = columns[0];
                    const legendCode = columns[1];
                    const idString = columns[2];

                    if (!idString) continue;

                    // Match pattern: "PREFIX START.NUM to END.NUM" (e.g. SPEAKER-L5 1 to 10)
                    let rangeMatchTo = idString.match(/^(.*[^\d])?(\d+)\s+to\s+(\d+)$/i);
                    // Match pattern: "PREFIX1 START.NUM - PREFIX2 END.NUM"
                    let rangeMatchDash = idString.match(/^(.*[^\d])?(\d+)\s*-\s*(.*[^\d])?(\d+)$/i);

                    if (rangeMatchTo || rangeMatchDash) {
                        let prefix1 = '';
                        let startNumStr = '';
                        let prefix2 = '';
                        let endNumStr = '';

                        if (rangeMatchTo) {
                            prefix1 = (rangeMatchTo[1] || '').trim();
                            startNumStr = rangeMatchTo[2];
                            prefix2 = prefix1;
                            endNumStr = rangeMatchTo[3];
                        } else if (rangeMatchDash) {
                            prefix1 = (rangeMatchDash[1] || '').trim();
                            startNumStr = rangeMatchDash[2];
                            prefix2 = (rangeMatchDash[3] || '').trim();
                            if (!prefix2) prefix2 = prefix1;
                            endNumStr = rangeMatchDash[4];
                        }

                        const startNum = parseInt(startNumStr, 10);
                        const endNum = parseInt(endNumStr, 10);

                        if (prefix1 === prefix2 && startNum <= endNum) {
                            for (let curr = startNum; curr <= endNum; curr++) {
                                const padLength = startNumStr.length;
                                const formattedNum = curr.toString().padStart(padLength, '0');
                                const fullId = prefix1 ? `${prefix1}${formattedNum}` : formattedNum;

                                parsedItems.push({
                                    floor_number: floorNumber,
                                    alias_prefix: legendCode || prefix1.replace(/[^a-zA-Z]/g, ''),
                                    legend_dbn_name: legendCode || prefix1.replace(/[^a-zA-Z]/g, ''),
                                    item_id: fullId,
                                    status: 'unassigned'
                                });
                            }
                        } else {
                            parsedItems.push({ floor_number: floorNumber, alias_prefix: legendCode, legend_dbn_name: legendCode, item_id: idString, status: 'unassigned' });
                        }
                    } else if (idString.includes(',')) {
                        const splits = idString.split(',');
                        splits.forEach(spl => {
                            if (spl.trim()) {
                                parsedItems.push({ floor_number: floorNumber, alias_prefix: legendCode, legend_dbn_name: legendCode, item_id: spl.trim(), status: 'unassigned' });
                            }
                        });
                    } else {
                        parsedItems.push({ floor_number: floorNumber, alias_prefix: legendCode, legend_dbn_name: legendCode, item_id: idString, status: 'unassigned' });
                    }
                }

                if (parsedItems.length === 0) {
                    alert("No valid items found in CSV.");
                } else {
                    createUploadMutation.mutate({
                        filename: file.name,
                        items: parsedItems
                    });
                }
            } catch (err) {
                console.error(err);
                alert("Failed to parse CSV file.");
            } finally {
                setIsParsingCsv(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.onerror = () => {
            alert("File read error.");
            setIsParsingCsv(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    // Filters mirroring the Object List
    const [systemFilter, setSystemFilter] = useState<string>('All');

    const filteredItems = useMemo(() => {
        if (!boqItems) return [];
        return boqItems.filter((row) => {
            const system = row.system_type || '';

            const effectiveSystemFilter = externalSystemFilter && externalSystemFilter !== 'all' ? externalSystemFilter : systemFilter;

            if (effectiveSystemFilter !== 'All' && system.toLowerCase() !== effectiveSystemFilter.toLowerCase()) return false;

            return true;
        });
    }, [boqItems, systemFilter, externalSystemFilter]);

    // Calculate Grand Totals based on filtered rows
    const { grandTotalQty, grandTotalCompleted, grandTotalFinished, grandTotalPending } = useMemo(() => {
        let total = 0, completed = 0, finished = 0, pending = 0;
        filteredItems.forEach(item => {
            total += Number(item.total_qty || 0);
            completed += Number(item.completed_qty || 0);
            finished += Number(item.finished_qty || 0);
            pending += Number(item.pending_qty || 0);
        });
        return { grandTotalQty: total, grandTotalCompleted: completed, grandTotalFinished: finished, grandTotalPending: pending };
    }, [filteredItems]);

    // Compute data for System Bar Chart
    const systemsData = useMemo(() => {
        const aggregated: Record<string, { system: string, completed: number, finished: number, pending: number }> = {};
        filteredItems.forEach(item => {
            const sys = item.system_type?.toUpperCase() || 'UNKNOWN';
            if (!aggregated[sys]) {
                aggregated[sys] = { system: sys, completed: 0, finished: 0, pending: 0 };
            }
            aggregated[sys].completed += Number(item.completed_qty || 0);
            aggregated[sys].finished += Number(item.finished_qty || 0);
            aggregated[sys].pending += Number(item.pending_qty || 0);
        });
        return Object.values(aggregated);
    }, [filteredItems]);

    // Compute data for Progress Pie Chart
    const progressData = useMemo(() => [
        { name: 'Completed', value: grandTotalCompleted, color: '#10b981' }, // Emerald-500
        { name: 'Finished', value: grandTotalFinished, color: '#f59e0b' },   // Amber-500
        { name: 'Pending', value: grandTotalPending, color: '#94a3b8' },     // Slate-400
    ], [grandTotalCompleted, grandTotalFinished, grandTotalPending]);

    const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

    return (
        <div className={`flex flex-col w-full min-h-full ${floorId ? 'bg-transparent' : 'bg-gray-100 dark:bg-gray-900'}`}>
            {/* Header */}
            {!floorId && (
                <div className="flex justify-between items-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 rounded-full bg-emerald-500 shrink-0" />
                        <div>
                            <Typography variant="h5" className="font-extrabold tracking-tight text-gray-800 dark:text-gray-100">
                                Analytics Overview
                            </Typography>
                            <Typography variant="caption" className="text-gray-500 font-medium">
                                Real-time Bill of Quantity and installation progress
                            </Typography>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleGlobalCsvUpload}
                        />
                        <MuiTooltip title="Upload Master BOQ (.csv) across Floors">
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={isParsingCsv || createUploadMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isParsingCsv || createUploadMutation.isPending}
                                className="shadow-md rounded-lg font-bold"
                            >
                                Upload Master BOQ
                            </Button>
                        </MuiTooltip>
                    </div>
                </div>
            )}

            <div className={`w-full max-w-7xl mx-auto flex flex-col gap-6 ${floorId ? 'p-1' : 'p-6'}`}>

                {/* Filters */}
                <Paper className="p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-800">
                    <Typography variant="subtitle2" className="font-bold text-gray-700 dark:text-gray-300">Data Filters</Typography>
                    <div className="flex items-center gap-4">
                        {(!externalSystemFilter || externalSystemFilter === 'all') && (
                            <FormControl size="small" variant="outlined" sx={{ minWidth: 150 }}>
                                <Select
                                    value={systemFilter}
                                    onChange={(e) => setSystemFilter(e.target.value)}
                                    displayEmpty
                                    sx={{ height: 36, fontSize: '0.85rem', bgcolor: 'background.paper' }}
                                >
                                    <MenuItem value="All"><span className="font-medium text-gray-600">All Systems</span></MenuItem>
                                    <MenuItem value="bss"><span className="font-bold text-indigo-600 uppercase">BSS</span></MenuItem>
                                    <MenuItem value="pa"><span className="font-bold text-emerald-600 uppercase">PA</span></MenuItem>
                                    <MenuItem value="telco"><span className="font-bold text-orange-600 uppercase">TELCO</span></MenuItem>
                                </Select>
                            </FormControl>
                        )}


                    </div>
                </Paper>

                {/* KPI Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <Paper className="p-5 h-full rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-800 dark:to-gray-800/80 transform transition-transform hover:-translate-y-1">
                            <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-xl shadow-inner">
                                <AssignmentIcon fontSize="large" />
                            </div>
                            <div>
                                <Typography variant="caption" className="font-bold text-gray-500 uppercase tracking-wider block mb-1">Total Objects</Typography>
                                <Typography variant="h4" className="font-black text-gray-800 dark:text-gray-100">
                                    {isLoading ? <CircularProgress size={20} /> : grandTotalQty.toLocaleString()}
                                </Typography>
                            </div>
                        </Paper>
                    </div>
                    <div>
                        <Paper className="p-5 h-full rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-800 dark:to-gray-800/80 transform transition-transform hover:-translate-y-1">
                            <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-xl shadow-inner">
                                <CheckCircleIcon fontSize="large" />
                            </div>
                            <div>
                                <Typography variant="caption" className="font-bold text-gray-500 uppercase tracking-wider block mb-1">Completed</Typography>
                                <Typography variant="h4" className="font-black text-emerald-600 dark:text-emerald-400">
                                    {isLoading ? <CircularProgress size={20} /> : grandTotalCompleted.toLocaleString()}
                                </Typography>
                            </div>
                        </Paper>
                    </div>
                    <div>
                        <Paper className="p-5 h-full rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gradient-to-br from-white to-amber-50/50 dark:from-gray-800 dark:to-gray-800/80 transform transition-transform hover:-translate-y-1">
                            <div className="p-3 bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 rounded-xl shadow-inner">
                                <FuseSvgIcon size={32}>heroicons-outline:sparkles</FuseSvgIcon>
                            </div>
                            <div>
                                <Typography variant="caption" className="font-bold text-gray-500 uppercase tracking-wider block mb-1">Work Finished</Typography>
                                <Typography variant="h4" className="font-black text-amber-600 dark:text-amber-400">
                                    {isLoading ? <CircularProgress size={20} /> : grandTotalFinished.toLocaleString()}
                                </Typography>
                            </div>
                        </Paper>
                    </div>
                    <div>
                        <Paper className="p-5 h-full rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gradient-to-br from-white to-slate-50/50 dark:from-gray-800 dark:to-gray-800/80 transform transition-transform hover:-translate-y-1">
                            <div className="p-3 bg-slate-100 text-slate-500 dark:bg-slate-900/40 dark:text-slate-400 rounded-xl shadow-inner">
                                <PendingIcon fontSize="large" />
                            </div>
                            <div>
                                <Typography variant="caption" className="font-bold text-gray-500 uppercase tracking-wider block mb-1">Pending / Working</Typography>
                                <Typography variant="h4" className="font-black text-slate-600 dark:text-slate-400">
                                    {isLoading ? <CircularProgress size={20} /> : grandTotalPending.toLocaleString()}
                                </Typography>
                            </div>
                        </Paper>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-5">
                        <Paper className="p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col bg-white dark:bg-gray-800">
                            <Typography variant="subtitle1" className="font-bold text-gray-800 dark:text-gray-100 mb-2">Completion Progress</Typography>
                            <Box className="flex-1 min-h-[250px] relative flex items-center justify-center">
                                {isLoading ? <CircularProgress /> : grandTotalQty === 0 ? (
                                    <Typography className="text-gray-400">No data available.</Typography>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={progressData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={60} outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {progressData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <Box className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <Typography variant="h5" className="font-black text-gray-800 dark:text-gray-100 leading-none">
                                                {Math.round((grandTotalCompleted / grandTotalQty) * 100)}%
                                            </Typography>
                                            <Typography variant="caption" className="text-gray-500 font-bold uppercase text-[10px]">
                                                Done
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Paper>
                    </div>

                    <div className="md:col-span-7">
                        <Paper className="p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col bg-white dark:bg-gray-800">
                            <Typography variant="subtitle1" className="font-bold text-gray-800 dark:text-gray-100 mb-2">Systems Breakdown</Typography>
                            <Box className="flex-1 min-h-[250px] flex items-center justify-center">
                                {isLoading ? <CircularProgress /> : systemsData.length === 0 ? (
                                    <Typography className="text-gray-400">No data available.</Typography>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={systemsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="system" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                            <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                                            <RechartsLegend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                            <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                            <Bar dataKey="finished" name="Finished" stackId="a" fill="#f59e0b" />
                                            <Bar dataKey="pending" name="Pending" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </Box>
                        </Paper>
                    </div>
                </div>

                {/* Data Table */}
                <Paper className={`overflow-hidden dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800`}>
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <Typography variant="subtitle1" className="font-bold dark:text-gray-100">Itemized Bill of Quantity</Typography>
                    </div>

                    <div className="overflow-x-auto bg-white dark:bg-gray-900">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-10">
                                <CircularProgress size={30} />
                            </div>
                        ) : (
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell className="bg-gray-50 dark:bg-gray-900 w-10"></TableCell>
                                        <TableCell className="font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 text-[10px] py-3">Item Name</TableCell>
                                        <TableCell className="font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 text-[10px] py-3">Description</TableCell>
                                        <TableCell className="font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 text-[10px] py-3">System</TableCell>
                                        <TableCell className="font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 text-[10px] py-3">Type</TableCell>
                                        <TableCell className="font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 text-[10px] py-3">Unit</TableCell>
                                        <TableCell className="font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 text-[10px] py-3 pr-2" align="center">Completed</TableCell>
                                        <TableCell className="font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 text-[10px] py-3 pr-2" align="center">Finished</TableCell>
                                        <TableCell className="font-bold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 text-[10px] py-3 pr-2" align="center">Pending</TableCell>
                                        <TableCell className="font-bold text-emerald-600 uppercase tracking-wider bg-gray-50 dark:bg-gray-900 text-[11px] py-3 pr-6" align="right">Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredItems.map((row) => (
                                        <BoqRow key={`${row.system_type}-${row.item_name}`} row={row} />
                                    ))}
                                    {/* Grand Total Footer */}
                                    {filteredItems.length > 0 && (
                                        <TableRow className="bg-emerald-50/50 dark:bg-emerald-900/10 border-t-2 border-emerald-100 dark:border-emerald-900/40">
                                            <TableCell colSpan={6} className="font-black text-emerald-800 dark:text-emerald-400 text-sm py-4 pl-6 tracking-wide">
                                                GRAND TOTAL
                                            </TableCell>
                                            <TableCell className="font-bold text-emerald-700 dark:text-emerald-300 py-4" align="center">
                                                {grandTotalCompleted.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-bold text-amber-600 dark:text-amber-300 py-4" align="center">
                                                {grandTotalFinished.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-500 dark:text-slate-400 py-4" align="center">
                                                {grandTotalPending.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-black text-emerald-600 dark:text-emerald-400 text-lg py-4 pr-6" align="right">
                                                {grandTotalQty.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {filteredItems.length === 0 && !isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                                No objects matched the selected filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </Paper>
            </div>
        </div>
    );
}

export default BoqApp;
