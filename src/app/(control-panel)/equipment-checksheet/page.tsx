'use client';
import { FC, useState, useMemo } from 'react';
import { 
    Typography, Paper, Box, Button, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, 
    CircularProgress, Chip, Grid, MenuItem, Select, FormControl, InputLabel, useTheme, alpha,
    Checkbox, FormControlLabel, Divider
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useProject } from '@/context/ProjectContext';
import { 
    useChecksheets, useAddChecksheet, 
    useUpdateChecksheet, useDeleteChecksheet, EquipmentChecksheet 
} from './checksheetApi';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';

const CHECKLIST_TEMPLATES: Record<string, string[]> = {
    CCTV: ['Lens Cleaned', 'Focus Adjusted', 'Bracket Secure', 'Waterproof Seal Intact', 'Storage Sync Verified'],
    UPS: ['Battery Health OK', 'Ventilation Clear', 'Control Board Status OK', 'Load Balance Verified', 'Alarm Function Test'],
    Server: ['Rack Mounting Tight', 'Cable Management Labeled', 'Airflow Path Clear', 'Port Connectivity Test', 'Os Boot Success'],
    Panel: ['Labels Present', 'Internal Wiring Neat', 'Termination Tight', 'Grounding Connected', 'Door Lock Working'],
    General: ['Physical Damage Check', 'Labels & Tags Clear', 'Power Connection Secure', 'Operational Test Pass']
};

const EquipmentChecksheetPage: FC = () => {
    const theme = useTheme();
    const { activeProjectId } = useProject();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingChecksheet, setEditingChecksheet] = useState<EquipmentChecksheet | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [type, setType] = useState('General');
    const [model, setModel] = useState('');
    const [serial, setSerial] = useState('');
    const [location, setLocation] = useState('');
    const [voltage, setVoltage] = useState('');
    const [current, setCurrent] = useState('');
    const [other, setOther] = useState('');
    const [chkStatus, setChkStatus] = useState('pending');
    const [checkedBy, setCheckedBy] = useState('');
    const [checkDate, setCheckDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [remarks, setRemarks] = useState('');
    const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>({});

    const { data: records = [], isLoading } = useChecksheets(activeProjectId);
    const addMutation = useAddChecksheet();
    const updateMutation = useUpdateChecksheet();
    const deleteMutation = useDeleteChecksheet();

    const handleOpenDialog = (record?: EquipmentChecksheet) => {
        if (record) {
            setEditingChecksheet(record);
            setName(record.equipment_name);
            setType(record.equipment_type);
            setModel(record.model_number || '');
            setSerial(record.serial_number || '');
            setLocation(record.location || '');
            setVoltage(record.voltage_v || '');
            setCurrent(record.current_a || '');
            setOther(record.other_readings || '');
            setChkStatus(record.status);
            setCheckedBy(record.checked_by || '');
            setCheckDate(record.check_date ? format(new Date(record.check_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setRemarks(record.remarks || '');
            setChecklistItems((record.checklist_results as any) || {});
        } else {
            setEditingChecksheet(null);
            setName('');
            setType('General');
            setModel('');
            setSerial('');
            setLocation('');
            setVoltage('');
            setCurrent('');
            setOther('');
            setChkStatus('pending');
            setCheckedBy('');
            setCheckDate(format(new Date(), 'yyyy-MM-dd'));
            setRemarks('');
            setChecklistItems({});
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!activeProjectId || !name.trim()) return;

        const payload = {
            project_id: activeProjectId,
            equipment_name: name,
            equipment_type: type,
            model_number: model,
            serial_number: serial,
            location,
            voltage_v: voltage,
            current_a: current,
            other_readings: other,
            status: chkStatus,
            checked_by: checkedBy,
            check_date: checkDate,
            remarks,
            checklist_results: checklistItems
        };

        try {
            if (editingChecksheet) {
                await updateMutation.mutateAsync({ id: editingChecksheet.id, payload });
                enqueueSnackbar('Equipment checksheet updated', { variant: 'success' });
            } else {
                await addMutation.mutateAsync(payload);
                enqueueSnackbar('Equipment checksheet submitted', { variant: 'success' });
            }
            setIsDialogOpen(false);
        } catch (error) {
            enqueueSnackbar('Failed to finalize checksheet', { variant: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this technical checksheet?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            enqueueSnackbar('Record deleted', { variant: 'info' });
        } catch (error) {
            enqueueSnackbar('Failed to delete record', { variant: 'error' });
        }
    };

    const currentTemplate = CHECKLIST_TEMPLATES[type] || CHECKLIST_TEMPLATES['General'];

    const getStatusColor = (s: string) => {
        if (s === 'pass') return '#10b981';
        if (s === 'fail') return '#ef4444';
        return '#f59e0b';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-950">
                <CircularProgress sx={{ color: '#6366f1' }} size={48} />
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
                            <Box className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <FuseSvgIcon size={28} className="text-white">heroicons-outline:clipboard-document-list</FuseSvgIcon>
                            </Box>
                            Technical Checksheets
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium ml-15">Equipment voltage, current, and physical verification audit</p>
                    </div>

                    <Button 
                        variant="contained"
                        onClick={() => handleOpenDialog()}
                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-8 py-4 font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
                    >
                        New Checksheet
                    </Button>
                </div>

                {/* Dashboard grid */}
                <div className="grid grid-cols-1 gap-4">
                    {records.map((record) => (
                        <motion.div
                            key={record.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-sm"
                        >
                            <Box className="absolute left-0 top-0 bottom-0 w-1.5" sx={{ bgcolor: getStatusColor(record.status) }} />
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <Chip 
                                        label={record.equipment_type} 
                                        size="small" 
                                        className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    />
                                    <Typography className="text-lg font-black text-slate-800 dark:text-white">
                                        {record.equipment_name}
                                    </Typography>
                                    <Typography className="text-xs font-bold text-slate-400 ml-auto md:ml-0">
                                        SN: {record.serial_number || 'N/A'}
                                    </Typography>
                                </div>
                                <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                                    <span className="flex items-center gap-1"><FuseSvgIcon size={14}>heroicons-outline:map-pin</FuseSvgIcon> {record.location || 'Unknown'}</span>
                                    <span className="flex items-center gap-1"><FuseSvgIcon size={14}>heroicons-outline:bolt</FuseSvgIcon> {record.voltage_v || '-'}V / {record.current_a || '-'}A</span>
                                    <span className="flex items-center gap-1"><FuseSvgIcon size={14}>heroicons-outline:calendar</FuseSvgIcon> {record.check_date ? format(new Date(record.check_date), 'MMM dd, yyyy') : '-'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                    <Typography className="text-sm font-black uppercase tracking-widest" sx={{ color: getStatusColor(record.status) }}>
                                        {record.status}
                                    </Typography>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <IconButton onClick={() => handleOpenDialog(record)} className="text-slate-400 hover:text-indigo-500">
                                        <FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(record.id)} className="text-slate-400 hover:text-rose-500">
                                        <FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
                                    </IconButton>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {records.length === 0 && (
                        <div className="py-32 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                            <Box className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-6 text-slate-300 dark:text-slate-700">
                                <FuseSvgIcon size={40}>heroicons-outline:shield-check</FuseSvgIcon>
                            </Box>
                            <Typography className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">No Equipment Audits yet</Typography>
                            <Typography className="text-sm text-slate-400 font-medium">Capture technical readings and verify installation quality.</Typography>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialog */}
            <Dialog 
                open={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: { borderRadius: '40px', padding: '16px', backgroundImage: 'none', bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff' }
                }}
            >
                <DialogTitle>
                    <div className="flex items-center gap-3">
                        <Box className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                            <FuseSvgIcon size={20}>heroicons-outline:beaker</FuseSvgIcon>
                        </Box>
                        <div className="flex-1">
                            <Typography className="text-xl font-black">Technical Equipment Audit</Typography>
                            <Typography className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verify Technical Compliance & Parameters</Typography>
                        </div>
                    </div>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={4} className="pt-4">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <div className="space-y-6">
                                <Typography className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Identity & Location</Typography>
                                <TextField 
                                    label="Name of Equipment" fullWidth value={name} onChange={e => setName(e.target.value)} 
                                    slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }}
                                />
                                <div className="flex gap-4">
                                    <FormControl fullWidth>
                                        <InputLabel>Category</InputLabel>
                                        <Select value={type} label="Category" onChange={e => setType(e.target.value)} sx={{ borderRadius: '16px', fontWeight: 700 }}>
                                            {Object.keys(CHECKLIST_TEMPLATES).map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    <TextField label="Location" fullWidth value={location} onChange={e => setLocation(e.target.value)} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }} />
                                </div>
                                <div className="flex gap-4">
                                    <TextField label="Model No" fullWidth value={model} onChange={e => setModel(e.target.value)} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }} />
                                    <TextField label="Serial No" fullWidth value={serial} onChange={e => setSerial(e.target.value)} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }} />
                                </div>

                                <Divider className="my-6" />
                                <Typography className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Technical Readings</Typography>
                                <div className="grid grid-cols-2 gap-4">
                                    <TextField label="Voltage (V)" fullWidth value={voltage} onChange={e => setVoltage(e.target.value)} placeholder="e.g. 230" slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }} />
                                    <TextField label="Current (A)" fullWidth value={current} onChange={e => setCurrent(e.target.value)} placeholder="e.g. 1.5" slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }} />
                                </div>
                                <TextField label="Other Parameter (Lux, dB, etc)" fullWidth value={other} onChange={e => setOther(e.target.value)} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }} />
                            </div>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
                                <Typography className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-6">Verification Checklist</Typography>
                                <div className="space-y-2 mb-8 flex-1">
                                    {currentTemplate.map(item => (
                                        <FormControlLabel
                                            key={item}
                                            control={
                                                <Checkbox 
                                                    checked={!!checklistItems[item]} 
                                                    onChange={e => setChecklistItems({...checklistItems, [item]: e.target.checked})}
                                                    sx={{ '&.Mui-checked': { color: '#6366f1' } }}
                                                />
                                            }
                                            label={<Typography className="text-sm font-bold text-slate-700 dark:text-slate-300">{item}</Typography>}
                                        />
                                    ))}
                                </div>

                                <div className="mt-auto space-y-4">
                                    <FormControl fullWidth>
                                        <InputLabel>Audit Status</InputLabel>
                                        <Select value={chkStatus} label="Audit Status" onChange={e => setChkStatus(e.target.value)} sx={{ borderRadius: '16px', fontWeight: 700 }}>
                                            <MenuItem value="pending" className="font-bold text-amber-500">PENDING</MenuItem>
                                            <MenuItem value="pass" className="font-bold text-emerald-500">PASS</MenuItem>
                                            <MenuItem value="fail" className="font-bold text-rose-500">FAIL</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <TextField label="Inspector Name" fullWidth value={checkedBy} onChange={e => setCheckedBy(e.target.value)} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }} />
                                </div>
                            </div>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                             <TextField
                                label="Technical Remarks / Follow-up required"
                                multiline
                                rows={2}
                                fullWidth
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 700 } } }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className="p-8 pt-4">
                    <Button onClick={() => setIsDialogOpen(false)} className="rounded-xl font-black uppercase tracking-widest px-6">Discard</Button>
                    <Box sx={{ flex: 1 }} />
                    <Button 
                        onClick={handleSave}
                        variant="contained" 
                        color="primary"
                        disabled={!name || addMutation.isPending || updateMutation.isPending}
                        className="rounded-2xl font-black uppercase tracking-widest px-12 py-4 shadow-xl shadow-indigo-600/20 bg-indigo-600"
                    >
                        {(addMutation.isPending || updateMutation.isPending) ? <CircularProgress size={20} color="inherit" /> : 'Register Audit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default EquipmentChecksheetPage;
