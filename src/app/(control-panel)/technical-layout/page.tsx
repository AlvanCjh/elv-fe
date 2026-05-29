'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
    Typography, Box, Button, IconButton, Paper, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress, Chip, Divider, Tooltip, Alert,
    List, ListItem, ListItemText, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useProject } from '@/context/ProjectContext';
import {
    useTechnicalLayouts, useAddTechnicalLayout, useDeleteTechnicalLayout,
    TechnicalLayout, TechnicalLayoutZone, useUpdateTechnicalLayoutZones, useUpdateTechnicalLayout,
    useAddTechnicalLayoutZoneObject, useDeleteTechnicalLayoutZoneObject,
    useAddTechnicalLayoutZoneAnnotation, useDeleteTechnicalLayoutZoneAnnotation,
    useUpdateTechnicalLayoutZoneStatus, useDeleteTechnicalLayoutZone,
    useTechnicalLayoutWidgets
} from './technicalLayoutApi';
import { TechnicalLayoutEditor } from './TechnicalLayoutEditor';
import { TechnicalLayoutOverviewDialog } from './TechnicalLayoutOverviewDialog';
import { API_BASE_URL } from '@/utils/api';
import { enqueueSnackbar } from 'notistack';

const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function TechnicalLayoutPage() {
    const { activeProject: selectedProject } = useProject();
    const { data: layouts = [], isLoading } = useTechnicalLayouts(selectedProject?.id);

    const addLayoutMutation = useAddTechnicalLayout();
    const updateLayoutMutation = useUpdateTechnicalLayout();
    const deleteLayoutMutation = useDeleteTechnicalLayout();
    const updateZonesMutation = useUpdateTechnicalLayoutZones();
    const deleteZoneMutation = useDeleteTechnicalLayoutZone();

    const [activeLayoutId, setActiveLayoutId] = useState<number | null>(null);
    const { data: widgets = [] } = useTechnicalLayoutWidgets(activeLayoutId || 0);

    const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
    const [hoveredZoneId, setHoveredZoneId] = useState<number | null>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isOverviewDialogOpen, setIsOverviewDialogOpen] = useState(false);

    // Dialogs for objects/incidents
    const [isObjectDialogOpen, setIsObjectDialogOpen] = useState(false);
    const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
    const [newObjectName, setNewObjectName] = useState('');
    const [newObjectDesc, setNewObjectDesc] = useState('');
    const [newIssueTitle, setNewIssueTitle] = useState('');
    const [newIssueDesc, setNewIssueDesc] = useState('');
    const [newIssuePriority, setNewIssuePriority] = useState('medium');
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

    // Upload state
    const [newName, setNewName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Sidebar state
    const [activeTab, setActiveTab] = useState<'MAP' | 'BOQ'>('MAP');
    const [isOverviewMode, setIsOverviewMode] = useState(false);

    const activeLayout = useMemo(() => {
        if (layouts.length === 0) return null;
        return layouts.find(l => l.id === activeLayoutId) || layouts[0];
    }, [layouts, activeLayoutId]);

    // Force activeLayoutId to sync with the found layout if it's null
    useEffect(() => {
        if (layouts.length > 0 && !activeLayoutId) {
            setActiveLayoutId(layouts[0].id);
        }
    }, [layouts, activeLayoutId]);

    const activeZone = useMemo(() =>
        activeLayout?.zones?.find(z => z.id === selectedZoneId),
        [activeLayout, selectedZoneId]);

    const linkedWidgets = useMemo(() => {
        if (!activeZone) return [];
        return widgets.filter(w => w.technical_layout_zone_id === activeZone.id);
    }, [widgets, activeZone]);

    // Mutation hooks
    const addObject = useAddTechnicalLayoutZoneObject(selectedZoneId || 0);
    const deleteObject = useDeleteTechnicalLayoutZoneObject();
    const addAnnotation = useAddTechnicalLayoutZoneAnnotation(selectedZoneId || 0);
    const deleteAnnotation = useDeleteTechnicalLayoutZoneAnnotation();
    const updateStatus = useUpdateTechnicalLayoutZoneStatus(selectedZoneId || 0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!selectedProject || !selectedFile || !newName) return;
        const formData = new FormData();
        formData.append('project_id', selectedProject.id.toString());
        formData.append('name', newName);
        formData.append('image', selectedFile);

        try {
            if (activeLayout) {
                // Update existing
                const result = await updateLayoutMutation.mutateAsync({ id: activeLayout.id, payload: formData });
                // Force state update by resetting active ID temporarily or relying on query cache
                setActiveLayoutId(result.id);
                enqueueSnackbar('Technical layout updated', { variant: 'success' });
            } else {
                // Create new
                const result = await addLayoutMutation.mutateAsync(formData);
                setActiveLayoutId(result.id);
                enqueueSnackbar('Technical layout uploaded', { variant: 'success' });
            }
            setIsUploadOpen(false);
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (error) {
            console.error('Upload error:', error);
            enqueueSnackbar('Failed to upload layout', { variant: 'error' });
        }
    };

    // Pre-fill name when opening dialog
    useEffect(() => {
        if (isUploadOpen && activeLayout) {
            setNewName(activeLayout.name);
        } else if (isUploadOpen && !activeLayout) {
            setNewName('');
        }
    }, [isUploadOpen, activeLayout]);

    const handleAddObject = async () => {
        if (!selectedZoneId || !newObjectName) return;
        try {
            await addObject.mutateAsync({ name: newObjectName, description: newObjectDesc });
            setNewObjectName('');
            setNewObjectDesc('');
            setIsObjectDialogOpen(false);
            enqueueSnackbar('Hardware linked', { variant: 'success' });
        } catch (e) {
            enqueueSnackbar('Failed to link hardware', { variant: 'error' });
        }
    };

    const handleAddIssue = async () => {
        if (!selectedZoneId || !newIssueTitle) return;
        const fd = new FormData();
        fd.append('title', newIssueTitle);
        fd.append('description', newIssueDesc);
        fd.append('priority', newIssuePriority);
        if (selectedPhoto) fd.append('photo', selectedPhoto);
        try {
            await addAnnotation.mutateAsync(fd);
            setNewIssueTitle('');
            setNewIssueDesc('');
            setSelectedPhoto(null);
            setIsIssueDialogOpen(false);
            enqueueSnackbar('Incident reported', { variant: 'warning' });
        } catch (e) {
            enqueueSnackbar('Failed to report incident', { variant: 'error' });
        }
    };

    if (isLoading) {
        return (
            <Box className="flex items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-950">
                <CircularProgress sx={{ color: '#6366f1' }} size={48} />
            </Box>
        );
    }

    return (
        <Box className="flex flex-col flex-auto min-w-0 h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

            {/* Header: Exact match to AGATE interface */}
            <div className="flex flex-col px-8 py-6 gap-6 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <Typography className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            {selectedProject?.name || 'Project Name'}
                            <Chip label="v2.4" size="small" className="h-5 text-[8px] font-black bg-indigo-500 text-white" />
                        </Typography>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsOverviewDialogOpen(true)}
                            variant="outlined"
                            className="rounded-xl border-slate-300 dark:border-slate-700 font-black text-[10px] px-6 h-10 hover:bg-slate-50 transition-all dark:text-white"
                            startIcon={<FuseSvgIcon size={16}>heroicons-outline:eye</FuseSvgIcon>}
                        >
                            Overview
                        </Button>
                        <Button
                            variant="outlined"
                            className="rounded-xl border-slate-300 dark:border-slate-700 font-black text-[10px] px-6 h-10 hover:bg-slate-100 transition-all dark:text-white"
                            startIcon={<FuseSvgIcon size={16}>heroicons-outline:arrow-path</FuseSvgIcon>}
                        >
                            Switch Project
                        </Button>
                    </div>
                </div>

                {/* Category Switches & Tools */}
                <div className="flex items-center justify-end gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setIsEditorOpen(true)}
                            startIcon={<FuseSvgIcon size={16}>heroicons-outline:map</FuseSvgIcon>}
                            className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-[10px] rounded-xl px-4 py-2 hover:bg-indigo-100"
                        >
                            Manage Zones
                        </Button>
                        <Button
                            onClick={() => setIsUploadOpen(true)}
                            startIcon={<FuseSvgIcon size={16}>heroicons-outline:cloud-arrow-up</FuseSvgIcon>}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] rounded-xl px-4 py-2"
                        >
                            Update Floor Drawing
                        </Button>
                    </div>
                </div>
            </div>

            {/* Split Content Area */}
            <Box className="flex-1 flex overflow-hidden lg:p-1 relative">

                {/* Main Interactive Map Viewer: Fixed and Static */}
                <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
                    {activeLayout ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <div className="relative inline-block shadow-2xl rounded-lg overflow-hidden bg-white max-w-full max-h-full">
                                <img
                                    src={getFullUrl(activeLayout.image_path)}
                                    alt={activeLayout.name}
                                    className={`max-w-full max-h-[75vh] block transition-all duration-500 ${isOverviewMode ? 'opacity-100' : 'opacity-40 contrast-[1.1] grayscale-[0.2]'}`}
                                />
                                <svg
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                    viewBox="0 0 1000 1000"
                                    preserveAspectRatio="none"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'block'
                                    }}
                                >
                                    {activeLayout.zones?.map(zone => {
                                        const widget = widgets.find(w => w.technical_layout_zone_id === zone.id);
                                        const zonePulsingClass = widget && widget.status !== 'ok' ? 'animate-pulse' : '';
                                        let fillColor = zone.color || '#4f46e5';
                                        let strokeColor = zone.color || '#4f46e5';

                                        if (widget) {
                                            if (widget.status === 'warning') {
                                                fillColor = '#f59e0b';
                                                strokeColor = '#b45309';
                                            } else if (widget.status === 'critical') {
                                                fillColor = '#ef4444';
                                                strokeColor = '#991b1b';
                                            } else {
                                                fillColor = '#10b981';
                                                strokeColor = '#047857';
                                            }
                                        }

                                        return (
                                            <path
                                                key={zone.id}
                                                d={zone.svg_path}
                                                fill={fillColor}
                                                fillOpacity={selectedZoneId === zone.id ? 0.45 : hoveredZoneId === zone.id ? 0.3 : 0.15}
                                                stroke={selectedZoneId === zone.id ? '#fff' : strokeColor}
                                                strokeWidth={selectedZoneId === zone.id ? 6 : 2}
                                                className={`transition-all duration-300 cursor-pointer pointer-events-auto ${zonePulsingClass}`}
                                                onMouseEnter={() => setHoveredZoneId(zone.id)}
                                                onMouseLeave={() => setHoveredZoneId(null)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedZoneId(zone.id === selectedZoneId ? null : zone.id);
                                                }}
                                            />
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CircularProgress sx={{ color: '#6366f1' }} />
                        </div>
                    )}
                </div>

                {/* Right Detail Panel: Same white sidebar style */}
                <Paper square elevation={0} className="w-[480px] shrink-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-20">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <Typography className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Zone Details</Typography>
                        <Typography className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Infrastructure Live Data Feed
                        </Typography>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                        {activeZone ? (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <Typography className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active Inspection Area</Typography>
                                        <div className="flex items-center gap-2">
                                            <IconButton
                                                size="small"
                                                className="text-rose-500 hover:bg-rose-50"
                                                onClick={() => {
                                                    if (window.confirm('Delete this zone?')) {
                                                        deleteZoneMutation.mutate(activeZone.id, {
                                                            onSuccess: () => {
                                                                setSelectedZoneId(null);
                                                                enqueueSnackbar('Zone deleted', { variant: 'info' });
                                                            }
                                                        });
                                                    }
                                                }}
                                            >
                                                <FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
                                            </IconButton>
                                            <Chip
                                                label={activeZone.status.toUpperCase()}
                                                size="small"
                                                className={`h-5 text-[9px] font-black ${activeZone.status === 'complete' ? 'bg-emerald-500 text-white' : activeZone.status === 'ongoing' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                                            />
                                        </div>
                                    </div>
                                    <Typography className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{activeZone.name}</Typography>

                                    <div className="mt-6">
                                        <Typography className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Health Status</Typography>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={activeZone.status}
                                                onChange={(e) => updateStatus.mutate(e.target.value)}
                                                className="rounded-2xl font-black text-xs uppercase h-14"
                                                sx={{ bgcolor: 'background.paper', border: '1.5px solid #e1e7ef', '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                                            >
                                                <MenuItem value="pending" className="font-bold text-[11px] uppercase">PENDING REVIEW</MenuItem>
                                                <MenuItem value="ongoing" className="font-bold text-[11px] uppercase">IN PROGRESS</MenuItem>
                                                <MenuItem value="complete" className="font-bold text-[11px] uppercase text-emerald-500">FULLY OPERATIONAL</MenuItem>
                                                <MenuItem value="issue" className="font-bold text-[11px] uppercase text-rose-500">SYSTEM FAILURE</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </div>
                                </div>

                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <Typography className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Linked Assets</Typography>
                                        <Button
                                            onClick={() => setIsObjectDialogOpen(true)}
                                            className="text-indigo-600 font-black text-[10px] underline p-0 hover:bg-transparent"
                                        >+ ADD NEW</Button>
                                    </div>
                                    <div className="grid gap-3">
                                        {activeZone.objects?.map(obj => (
                                            <Paper key={obj.id} elevation={0} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition-all hover:border-indigo-500/30 group relative">
                                                <Typography className="text-xs font-black text-slate-900 dark:text-white">{obj.name}</Typography>
                                                <Typography className="text-[10px] text-slate-500 mt-1">{obj.description || 'Verified on-site active component'}</Typography>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => deleteObject.mutate(obj.id)}
                                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-rose-500"
                                                >
                                                    <FuseSvgIcon size={14}>heroicons-outline:trash</FuseSvgIcon>
                                                </IconButton>
                                            </Paper>
                                        ))}

                                        {linkedWidgets.map(widget => (
                                            <Paper key={`widget-${widget.id}`} elevation={0} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border-[1.5px] border-slate-200 shadow-sm relative overflow-hidden group">
                                                <div className={`absolute top-0 left-0 w-1.5 h-full ${widget.status === 'warning' ? 'bg-amber-500' : widget.status === 'critical' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                <div className="flex items-center justify-between w-full mb-3 ml-2">
                                                    <Typography className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                        <FuseSvgIcon size={16} className={`${widget.status === 'warning' ? 'text-amber-500' : widget.status === 'critical' ? 'text-rose-500' : 'text-emerald-500'}`}>heroicons-solid:cpu-chip</FuseSvgIcon>
                                                        Environmental Sensor
                                                    </Typography>
                                                    <Chip
                                                        label={widget.status}
                                                        size="small"
                                                        className={`h-5 text-[8px] tracking-widest font-black uppercase text-white ${widget.status === 'warning' ? 'bg-amber-500' : widget.status === 'critical' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 ml-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <div>
                                                        <Typography className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Temperature</Typography>
                                                        <Typography className="text-sm font-mono font-bold text-slate-800">{widget.metadata?.temperature || '0'} °C</Typography>
                                                    </div>
                                                    <div>
                                                        <Typography className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Humidity</Typography>
                                                        <Typography className="text-sm font-mono font-bold text-slate-800">{widget.metadata?.humidity || '0'} %</Typography>
                                                    </div>
                                                </div>
                                            </Paper>
                                        ))}

                                        {activeZone.objects?.length === 0 && linkedWidgets.length === 0 && (
                                            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                                <Typography className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-loose">No hardware mapped<br />for this zone yet</Typography>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <Typography className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ongoing Incidents</Typography>
                                        <Chip label={activeZone.annotations?.length || 0} size="small" className="h-5 text-[9px] font-black bg-rose-500 text-white" />
                                    </div>
                                    <div className="space-y-4">
                                        {activeZone.annotations?.map(issue => (
                                            <Paper key={issue.id} elevation={0} className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 grid border-l-4 border-rose-500">
                                                <div className="flex items-start justify-between mb-2">
                                                    <Typography className="text-xs font-black text-rose-800 dark:text-rose-400">{issue.title}</Typography>
                                                    <Chip label={issue.priority} size="small" className="h-4 text-[7px] font-black uppercase bg-rose-500 text-white" />
                                                </div>
                                                <Typography className="text-[10px] text-rose-600/80 dark:text-rose-400/60 leading-relaxed mb-4">{issue.description}</Typography>
                                                <div className="flex items-center justify-between">
                                                    <Typography className="text-[9px] font-black text-rose-400">{new Date(issue.created_at).toLocaleDateString()}</Typography>
                                                    <Button onClick={() => deleteAnnotation.mutate(issue.id)} size="small" className="text-rose-500 font-black text-[9px] p-0 min-w-0">RESOLVE</Button>
                                                </div>
                                            </Paper>
                                        ))}
                                        {activeZone.annotations?.length === 0 && (
                                            <Alert severity="info" className="rounded-2xl border-none bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase">
                                                All systems operational in this zone.
                                            </Alert>
                                        )}
                                        <Button
                                            onClick={() => setIsIssueDialogOpen(true)}
                                            fullWidth variant="contained"
                                            className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/20 py-4 text-[10px] font-black uppercase tracking-[0.2em]"
                                        >Report New Incident</Button>
                                    </div>
                                </section>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-30 select-none">
                                <Box className="w-24 h-24 rounded-[40px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-8 rotate-12 transition-transform hover:rotate-0">
                                    <FuseSvgIcon size={48} className="text-slate-400">heroicons-outline:finger-print</FuseSvgIcon>
                                </Box>
                                <Typography className="text-xs font-black text-slate-500 uppercase tracking-widest leading-loose">Click a layout zone<br />to begin inspection</Typography>
                            </div>
                        )}
                    </div>
                </Paper>
            </Box>

            {/* Dialogs: Matching Building Report styles */}
            <Dialog
                open={isUploadOpen} onClose={() => setIsUploadOpen(false)}
                PaperProps={{ sx: { borderRadius: '40px', padding: '16px', maxWidth: '480px', width: '100%', bgcolor: 'background.paper', backgroundImage: 'none' } }}
            >
                <DialogTitle className="flex flex-col gap-1 p-8 pb-4">
                    <Typography className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Technical Management</Typography>
                    <Typography className="text-2xl font-black uppercase tracking-tight">Upload Floor Drawing</Typography>
                </DialogTitle>
                <DialogContent className="px-8 pb-8 space-y-6">
                    <TextField
                        label="Drawing Description" fullWidth value={newName} onChange={(e) => setNewName(e.target.value)}
                        slotProps={{ input: { sx: { borderRadius: '20px', height: '60px', fontWeight: 900 } } }}
                    />
                    <Box
                        className={`h-56 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all ${previewUrl ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-300 hover:border-indigo-500'}`}
                        onClick={() => document.getElementById('layout-upload-input')?.click()}
                    >
                        {previewUrl ? <img src={previewUrl} className="w-full h-full object-contain" /> : (
                            <div className="text-center group">
                                <FuseSvgIcon size={40} className="text-slate-300 group-hover:text-indigo-400 mb-4 mx-auto transition-colors">heroicons-outline:photo</FuseSvgIcon>
                                <Typography className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Drag & Drop or Browser File</Typography>
                            </div>
                        )}
                        <input id="layout-upload-input" type="file" hidden accept="image/*" onChange={handleFileChange} />
                    </Box>
                </DialogContent>
                <DialogActions className="p-8 pt-0">
                    <Button onClick={() => setIsUploadOpen(false)} className="rounded-2xl font-black uppercase tracking-widest text-slate-400 px-8 py-4">Cancel</Button>
                    <Button
                        onClick={handleUpload} variant="contained" color="secondary"
                        disabled={!selectedFile || !newName || addLayoutMutation.isPending}
                        className="rounded-2xl font-black uppercase tracking-widest px-10 py-4 shadow-2xl shadow-indigo-500/40"
                    >
                        {addLayoutMutation.isPending ? 'Processing...' : 'Deploy Layout'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isObjectDialogOpen} onClose={() => setIsObjectDialogOpen(false)} PaperProps={{ sx: { borderRadius: '32px', padding: '12px', bgcolor: '#fff', border: '1px solid #e1e7ef' } }}>
                <DialogTitle className="font-black uppercase tracking-widest text-sm text-slate-900 pt-8 px-8">Link Hardware Object</DialogTitle>
                <DialogContent className="space-y-4 pt-4 px-8">
                    <TextField fullWidth label="Component Name" placeholder="e.g. Cisco Nexus 9000" value={newObjectName} onChange={e => setNewObjectName(e.target.value)} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 800 } } }} />
                    <TextField fullWidth multiline rows={2} label="Specifications / Details" value={newObjectDesc} onChange={e => setNewObjectDesc(e.target.value)} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }} />
                </DialogContent>
                <DialogActions className="p-8 pt-4">
                    <Button onClick={() => setIsObjectDialogOpen(false)} className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                    <Button onClick={handleAddObject} variant="contained" className="bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest px-8 py-3">Register Hardware</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isIssueDialogOpen} onClose={() => setIsIssueDialogOpen(false)} PaperProps={{ sx: { borderRadius: '40px', padding: '12px', border: '2px solid #e11d48 shadow-2xl' } }}>
                <DialogTitle className="text-rose-600 font-black uppercase tracking-widest text-sm pt-8 px-8 flex items-center gap-3">
                    <FuseSvgIcon className="text-rose-600">heroicons-outline:exclamation-triangle</FuseSvgIcon>
                    Report System Failure
                </DialogTitle>
                <DialogContent className="space-y-5 pt-4 px-8 pb-8">
                    <TextField fullWidth label="Incident Header" value={newIssueTitle} onChange={e => setNewIssueTitle(e.target.value)} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 800 } } }} />
                    <TextField fullWidth multiline rows={3} label="Technical Details" value={newIssueDesc} onChange={e => setNewIssueDesc(e.target.value)} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }} />
                    <FormControl fullWidth>
                        <InputLabel className="font-black text-[10px] uppercase">Service Impact Priority</InputLabel>
                        <Select value={newIssuePriority} onChange={e => setNewIssuePriority(e.target.value)} className="rounded-2xl font-black text-xs h-14" sx={{ mt: 1 }}>
                            <MenuItem value="low" className="font-bold text-xs uppercase">LOW — MINOR DEGRADATION</MenuItem>
                            <MenuItem value="medium" className="font-bold text-xs uppercase">MEDIUM — PARTIAL OUTAGE</MenuItem>
                            <MenuItem value="high" className="font-bold text-xs uppercase text-rose-500">HIGH — FULL SYSTEM FAILURE</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions className="p-8 pt-0">
                    <Button onClick={() => setIsIssueDialogOpen(false)} className="text-slate-400 font-black text-[10px] uppercase mr-auto px-8">Discard</Button>
                    <Button onClick={handleAddIssue} variant="contained" className="bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/30 rounded-2xl font-black uppercase tracking-widest px-10 py-4">
                        Dispatch Report
                    </Button>
                </DialogActions>
            </Dialog>

            {isEditorOpen && activeLayout && (
                <TechnicalLayoutEditor
                    layout={activeLayout}
                    onClose={() => setIsEditorOpen(false)}
                />
            )}

            {isOverviewDialogOpen && activeLayout && (
                <TechnicalLayoutOverviewDialog
                    open={isOverviewDialogOpen}
                    onClose={() => setIsOverviewDialogOpen(false)}
                    layout={activeLayout}
                    projectId={selectedProject?.id || 0}
                />
            )}
        </Box>
    );
}
