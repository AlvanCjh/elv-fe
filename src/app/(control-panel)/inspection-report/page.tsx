'use client';
import { FC, useState } from 'react';
import {
    Typography, Paper, Box, Button, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField,
    CircularProgress, Chip, Grid, MenuItem, Select, FormControl, InputLabel, useTheme, alpha
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useProject } from '@/context/ProjectContext';
import {
    useInspectionReports, useAddInspectionReport,
    useUpdateInspectionReport, useDeleteInspectionReport, InspectionReport
} from './inspectionApi';
import { useServiceReports } from '../service-report/serviceApi';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending', color: 'bg-amber-500' },
    { label: 'Passed', value: 'passed', color: 'bg-emerald-500' },
    { label: 'Failed', value: 'failed', color: 'bg-rose-500' },
    { label: 'Follow-up', value: 'follow-up', color: 'bg-indigo-500' },
];

const InspectionReportPage: FC = () => {
    const theme = useTheme();
    const { activeProject: selectedProject } = useProject();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingReport, setEditingReport] = useState<InspectionReport | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [location, setLocation] = useState('');
    const [inspectorName, setInspectorName] = useState('');
    const [inspectionDate, setInspectionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [status, setStatus] = useState('pending');
    const [remarks, setRemarks] = useState('');
    const [rfwiRefNo, setRfwiRefNo] = useState('');
    const [linkedServiceReportId, setLinkedServiceReportId] = useState<number | ''>('');

    const { data: reports = [], isLoading } = useInspectionReports(selectedProject?.id);
    const { data: serviceReports = [] } = useServiceReports(selectedProject?.id);
    const addMutation = useAddInspectionReport();
    const updateMutation = useUpdateInspectionReport();
    const deleteMutation = useDeleteInspectionReport();

    const handleOpenDialog = (report?: InspectionReport) => {
        if (report) {
            setEditingReport(report);
            setTitle(report.title);
            setDesc(report.description || '');
            setLocation(report.location || '');
            setInspectorName(report.inspector_name || '');
            setInspectionDate(report.inspection_date || format(new Date(), 'yyyy-MM-dd'));
            setStatus(report.status);
            setRemarks(report.remarks || '');
            setRfwiRefNo(report.rfwi_ref_no || '');
            setLinkedServiceReportId(report.linked_service_report_id || '');
        } else {
            setEditingReport(null);
            setTitle('');
            setDesc('');
            setLocation('');
            setInspectorName('');
            setInspectionDate(format(new Date(), 'yyyy-MM-dd'));
            setStatus('pending');
            setRemarks('');
            setRfwiRefNo('');
            setLinkedServiceReportId('');
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!selectedProject || !title.trim()) return;

        const payload = {
            project_id: selectedProject.id,
            title,
            description: desc,
            location,
            inspector_name: inspectorName,
            inspection_date: inspectionDate,
            status,
            remarks,
            rfwi_ref_no: rfwiRefNo,
            linked_service_report_id: linkedServiceReportId === '' ? null : linkedServiceReportId,
        };

        try {
            if (editingReport) {
                await updateMutation.mutateAsync({ id: editingReport.id, payload });
                enqueueSnackbar('Inspection report updated', { variant: 'success' });
            } else {
                await addMutation.mutateAsync(payload);
                enqueueSnackbar('Inspection report created', { variant: 'success' });
            }
            setIsDialogOpen(false);
        } catch (error) {
            enqueueSnackbar('Failed to save report', { variant: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this inspection report?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            enqueueSnackbar('Report deleted', { variant: 'info' });
        } catch (error) {
            enqueueSnackbar('Failed to delete report', { variant: 'error' });
        }
    };

    const getStatusInfo = (val: string) => STATUS_OPTIONS.find(o => o.value === val) || STATUS_OPTIONS[0];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-950">
                <CircularProgress sx={{ color: '#0ea5e9' }} size={48} />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Box className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                                <FuseSvgIcon size={28} className="text-white">heroicons-outline:clipboard-document-check</FuseSvgIcon>
                            </Box>
                            Inspection Reports
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium ml-15">Detailed technical and safety inspection logs</p>
                    </div>

                    <Button
                        variant="contained"
                        onClick={() => handleOpenDialog()}
                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
                        className="bg-sky-600 hover:bg-sky-700 text-white rounded-2xl px-8 py-4 font-black uppercase tracking-widest transition-all shadow-xl shadow-sky-600/20"
                    >
                        New Inspection
                    </Button>
                </div>

                {/* Grid of reports */}
                <Grid container spacing={4}>
                    {reports.map((report) => {
                        const sInfo = getStatusInfo(report.status);
                        return (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={report.id}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 h-full flex flex-col group hover:border-sky-500/50 transition-all shadow-sm hover:shadow-2xl dark:shadow-none"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`px-4 py-1.5 rounded-full ${sInfo.color}/10 border border-${sInfo.color.split('-')[1]}-500/20`}>
                                            <Typography className={`text-[10px] font-black uppercase tracking-widest ${sInfo.color.replace('bg-', 'text-')}`}>
                                                {sInfo.label}
                                            </Typography>
                                        </div>
                                        <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {report.inspection_date ? format(new Date(report.inspection_date), 'MMM dd, yyyy') : 'No Date'}
                                        </Typography>
                                    </div>

                                    <Typography className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-sky-500 transition-colors">
                                        {report.title}
                                    </Typography>

                                    <div className="flex items-center gap-2 mb-4">
                                        <FuseSvgIcon size={14} className="text-slate-400">heroicons-outline:map-pin</FuseSvgIcon>
                                        <Typography className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                            {report.location || 'Site General'}
                                        </Typography>
                                    </div>

                                    <Typography className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 line-clamp-3">
                                        {report.description || 'No detailed inspection report provided.'}
                                    </Typography>
                                    
                                    {report.linked_service_report_id && (
                                        <div className="flex items-center gap-2 mb-4 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                            <FuseSvgIcon size={14} className="text-emerald-500">heroicons-outline:link</FuseSvgIcon>
                                            <Typography className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                                {report.linkedServiceReport?.service_report_no || `SR-ID: ${report.linked_service_report_id}`}
                                            </Typography>
                                        </div>
                                    )}

                                    <Box className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Inspector</p>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">{report.inspector_name || 'Anonymous'}</p>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <IconButton size="small" onClick={() => handleOpenDialog(report)} className="text-slate-400 hover:text-sky-500">
                                                <FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(report.id)} className="text-slate-400 hover:text-rose-500">
                                                <FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
                                            </IconButton>
                                        </div>
                                    </Box>
                                </motion.div>
                            </Grid>
                        );
                    })}

                    {reports.length === 0 && (
                        <Grid size={{ xs: 12 }}>
                            <div className="py-24 flex flex-col items-center gap-6 text-center">
                                <Box className="w-20 h-20 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                    <FuseSvgIcon size={40}>heroicons-outline:clipboard-document-list</FuseSvgIcon>
                                </Box>
                                <div>
                                    <Typography className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">No Reports found</Typography>
                                    <Typography className="text-sm text-slate-500 font-medium">Start by adding your first site inspection record.</Typography>
                                </div>
                            </div>
                        </Grid>
                    )}
                </Grid>
            </div>

            {/* Dialog */}
            <Dialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: '40px', padding: '16px', maxWidth: '550px', width: '100%', backgroundImage: 'none', bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff' }
                }}
            >
                <DialogTitle>
                    <div className="flex items-center gap-3">
                        <Box className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center">
                            <FuseSvgIcon size={20}>heroicons-outline:clipboard-document-check</FuseSvgIcon>
                        </Box>
                        <Typography className="text-xl font-black">{editingReport ? 'Edit Inspection' : 'Record Inspection'}</Typography>
                    </div>
                </DialogTitle>
                <DialogContent>
                    <div className="flex flex-col gap-6 pt-4">
                        <TextField
                            label="Inspection Title / Goal"
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 700 } } }}
                        />
                        <TextField
                            label="Location / Block / Floor"
                            fullWidth
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 700 } } }}
                        />
                        <TextField
                            label="Technical Findings"
                            placeholder="Describe what was inspected and the results..."
                            multiline
                            rows={3}
                            fullWidth
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 700 } } }}
                        />
                        <TextField
                            label="RFWI Ref No"
                            fullWidth
                            value={rfwiRefNo}
                            onChange={(e) => setRfwiRefNo(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 700 } } }}
                        />
                        <div className="flex gap-4">
                            <TextField
                                label="Inspector Name"
                                fullWidth
                                value={inspectorName}
                                onChange={(e) => setInspectorName(e.target.value)}
                                slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 700 } } }}
                            />
                            <TextField
                                label="Date"
                                type="date"
                                fullWidth
                                value={inspectionDate}
                                onChange={(e) => setInspectionDate(e.target.value)}
                                slotProps={{
                                    input: { sx: { borderRadius: '20px', fontWeight: 700 } },
                                    inputLabel: { shrink: true }
                                }}
                            />
                        </div>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={status}
                                label="Status"
                                onChange={(e) => setStatus(e.target.value)}
                                sx={{ borderRadius: '20px', fontWeight: 700 }}
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value} className="font-bold text-xs uppercase tracking-widest">{opt.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Mapped Service Report</InputLabel>
                            <Select
                                value={linkedServiceReportId}
                                label="Mapped Service Report"
                                onChange={(e) => setLinkedServiceReportId(e.target.value as number | '')}
                                sx={{ borderRadius: '20px', fontWeight: 700 }}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {serviceReports.map(sr => (
                                    <MenuItem key={sr.id} value={sr.id} className="font-bold text-xs uppercase tracking-widest">{sr.service_report_no} - {sr.company_name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Closing Remarks / Follow-up"
                            multiline
                            rows={2}
                            fullWidth
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 700 } } }}
                        />
                    </div>
                </DialogContent>
                <DialogActions className="p-8 pt-2">
                    <Button onClick={() => setIsDialogOpen(false)} className="rounded-xl font-black uppercase tracking-widest px-6">Discard</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        color="primary"
                        disabled={!title || addMutation.isPending || updateMutation.isPending}
                        className="rounded-2xl font-black uppercase tracking-widest px-10 py-4 shadow-lg shadow-sky-500/20 bg-sky-600"
                    >
                        {(addMutation.isPending || updateMutation.isPending) ? <CircularProgress size={20} color="inherit" /> : 'Finalize Report'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default InspectionReportPage;
