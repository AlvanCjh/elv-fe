'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { enqueueSnackbar } from 'notistack';
import api from '@/utils/api';

const DEFAULT_SERVERS = ['KM-NAS', 'EA-UBS', 'KM-UBS'];

const STATUS_OPTIONS = [
    { value: 'success', label: 'Success', color: '#10b981' },
    { value: 'unsuccess', label: 'Unsuccessful', color: '#f59e0b' },
    { value: 'recovery', label: 'Recovery', color: '#3b82f6' },
    { value: 'in progress', label: 'In Progress', color: '#8b5cf6' },
    { value: 'failed', label: 'Failed', color: '#ef4444' },
];

const CORE_FIELD_KEYS = new Set([
    'backup_date', 'department', 'responsible_first_name', 'responsible_last_name',
    'systems', 'location', 'status', 'attachment'
]);

interface FormFieldConfig {
    id: number;
    field_key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'email';
    required: boolean;
    is_active: boolean;
    options?: string[] | null;
    section: string;
    sort_order: number;
}

export default function CreateBackupPage() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [newSystem, setNewSystem] = useState('');
    const [extraSystems, setExtraSystems] = useState<string[]>([]);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [dynamicFields, setDynamicFields] = useState<FormFieldConfig[]>([]);
    const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
    const [category, setCategory] = useState('backup');

    const [form, setForm] = useState({
        backup_date: new Date().toISOString().split('T')[0],
        responsible_first_name: '',
        responsible_last_name: '',
        department: 'ICT',
        status: 'in progress',
        location: '',
        selectedServers: [] as string[],
    });

    useEffect(() => {
        api.get('ict-form-config', { searchParams: { category } })
            .then(r => r.json())
            .then((fields: FormFieldConfig[]) => {
                const custom = fields.filter(f => f.is_active && !CORE_FIELD_KEYS.has(f.field_key));
                setDynamicFields(custom);
                const defaults: Record<string, string> = {};
                custom.forEach(f => { defaults[f.field_key] = ''; });
                setDynamicValues(defaults);
            })
            .catch(() => {});
    }, [category]);

    const allSystems = category === 'backup' ? [...DEFAULT_SERVERS, ...extraSystems] : [...extraSystems];

    const toggleServer = (server: string) => {
        setForm(prev => ({
            ...prev,
            selectedServers: prev.selectedServers.includes(server)
                ? prev.selectedServers.filter(s => s !== server)
                : [...prev.selectedServers, server],
        }));
    };

    const addExtraSystem = () => {
        const v = newSystem.trim();
        if (v && !allSystems.includes(v)) {
            setExtraSystems(prev => [...prev, v]);
            setNewSystem('');
        }
    };

    const removeExtra = (s: string) => {
        setExtraSystems(prev => prev.filter(x => x !== s));
        setForm(prev => ({ ...prev, selectedServers: prev.selectedServers.filter(x => x !== s) }));
    };

    const handleSubmit = async () => {
        if (!form.responsible_first_name || !form.responsible_last_name) {
            enqueueSnackbar('Person responsible (first & last name) is required', { variant: 'warning' });
            return;
        }
        if (!form.location) {
            enqueueSnackbar('Backup location is required', { variant: 'warning' });
            return;
        }
        if (form.selectedServers.length === 0) {
            enqueueSnackbar('Please select at least one system to backup', { variant: 'warning' });
            return;
        }
        for (const field of dynamicFields) {
            if (field.required && !dynamicValues[field.field_key]) {
                enqueueSnackbar(`"${field.label}" is required`, { variant: 'warning' });
                return;
            }
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('category', category);
            formData.append('backup_date', form.backup_date);
            formData.append('responsible_first_name', form.responsible_first_name);
            formData.append('responsible_last_name', form.responsible_last_name);
            formData.append('department', form.department);
            formData.append('status', form.status);
            formData.append('location', form.location);
            formData.append('systems', JSON.stringify(form.selectedServers));
            if (attachment) formData.append('attachment', attachment);
            if (dynamicFields.length > 0) {
                formData.append('custom_fields', JSON.stringify(dynamicValues));
            }

            await api.post('ict-backups', { body: formData });
            enqueueSnackbar('Backup record created successfully!', { variant: 'success' });
            navigate('/ict-dashboard');
        } catch {
            enqueueSnackbar('Failed to create backup record', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedStatus = STATUS_OPTIONS.find(s => s.value === form.status);

    const renderDynamicField = (field: FormFieldConfig) => {
        const value = dynamicValues[field.field_key] ?? '';
        const onChange = (val: string) => setDynamicValues(prev => ({ ...prev, [field.field_key]: val }));

        switch (field.type) {
            case 'select':
                return (
                    <FormControl fullWidth size="small" key={field.id}>
                        <InputLabel>{field.label}{field.required && ' *'}</InputLabel>
                        <Select value={value} label={`${field.label}${field.required ? ' *' : ''}`}
                            onChange={e => onChange(e.target.value)}>
                            {(field.options || []).map(opt => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            case 'textarea':
                return (
                    <TextField key={field.id} label={`${field.label}${field.required ? ' *' : ''}`}
                        fullWidth multiline minRows={2} size="small"
                        value={value} onChange={e => onChange(e.target.value)} />
                );
            case 'checkbox':
                return (
                    <FormControlLabel key={field.id}
                        control={
                            <Checkbox size="small" checked={value === 'true'}
                                onChange={e => onChange(e.target.checked ? 'true' : 'false')}
                                sx={{ color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }} />
                        }
                        label={<Typography className="text-sm font-bold text-slate-700 dark:text-gray-200">
                            {field.label}{field.required && <span className="text-red-400"> *</span>}
                        </Typography>}
                    />
                );
            default:
                return (
                    <TextField key={field.id}
                        label={`${field.label}${field.required ? ' *' : ''}`}
                        fullWidth size="small"
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                        InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                    />
                );
        }
    };

    return (
        <div className="p-20 w-full h-full">
            {submitting && <LinearProgress className="fixed top-0 left-0 right-0 z-50" color="secondary" />}

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-20">
                <div className="flex items-center gap-12">
                    <button
                        onClick={() => navigate('/ict-dashboard')}
                        className="p-6 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-slate-400 dark:text-gray-400"
                    >
                        <FuseSvgIcon size={18}>heroicons-outline:arrow-left</FuseSvgIcon>
                    </button>
                    <div>
                        <Typography variant="h5" className="font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            Create {category === 'vulnerability' ? 'Vulnerability' : category === 'virus_scan' ? 'Virus Scan' : 'Backup'} Record
                        </Typography>
                        <Typography className="text-slate-400 dark:text-gray-400 text-sm">
                            Document a new system {category === 'vulnerability' ? 'vulnerability testing' : category === 'virus_scan' ? 'virus scan' : 'backup'} checkpoint
                        </Typography>
                    </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-xl">
                    {['backup', 'vulnerability', 'virus_scan'].map((cat) => (
                        <Button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm capitalize ${category === cat ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}
                            sx={{ textTransform: 'none' }}
                        >
                            {cat.replace('_', ' ')}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-100 dark:border-white/10 overflow-hidden">

                {/* Section: Basic Info */}
                <div className="px-24 py-16 border-b border-slate-100 dark:border-white/10">
                    <Typography className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-12">
                        Basic Information
                    </Typography>
                    <div className="grid grid-cols-2 gap-12">
                        <TextField label={`Date of ${category === 'backup' ? 'Backup' : category === 'vulnerability' ? 'Vulnerability Test' : 'Virus Scan'} *`} type="date" fullWidth
                            value={form.backup_date}
                            onChange={e => setForm({ ...form, backup_date: e.target.value })}
                            InputLabelProps={{ shrink: true }} size="small" />
                        <FormControl fullWidth size="small">
                            <InputLabel>Department</InputLabel>
                            <Select value={form.department} label="Department"
                                onChange={e => setForm({ ...form, department: e.target.value })}>
                                <MenuItem value="ICT">ICT</MenuItem>
                                <MenuItem value="ELV">ELV</MenuItem>
                                <MenuItem value="SSDC">SSDC</MenuItem>
                                <MenuItem value="Others">Others</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="First Name *" fullWidth size="small"
                            value={form.responsible_first_name}
                            onChange={e => setForm({ ...form, responsible_first_name: e.target.value })} />
                        <TextField label="Last Name *" fullWidth size="small"
                            value={form.responsible_last_name}
                            onChange={e => setForm({ ...form, responsible_last_name: e.target.value })} />
                    </div>
                </div>

                {/* Section: Systems */}
                <div className="px-24 py-16 border-b border-slate-100 dark:border-white/10">
                    <Typography className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-12">
                        {category === 'backup' ? 'Systems to Backup' : category === 'vulnerability' ? 'Systems to Test' : 'Systems to Scan'} *
                    </Typography>
                    <FormGroup className="grid grid-cols-3 gap-2 mb-12">
                        {allSystems.map(server => (
                            <div key={server} className="flex items-center">
                                <FormControlLabel
                                    control={
                                        <Checkbox size="small"
                                            checked={form.selectedServers.includes(server)}
                                            onChange={() => toggleServer(server)}
                                            sx={{ color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }} />
                                    }
                                    label={<Typography className="text-sm font-bold text-slate-700 dark:text-gray-200">{server}</Typography>}
                                />
                                {extraSystems.includes(server) && (
                                    <IconButton size="small" onClick={() => removeExtra(server)} className="text-red-400 -ml-8">
                                        <FuseSvgIcon size={13}>heroicons-outline:x-mark</FuseSvgIcon>
                                    </IconButton>
                                )}
                            </div>
                        ))}
                    </FormGroup>
                    <div className="flex gap-8">
                        <TextField placeholder="Add custom system..." size="small"
                            value={newSystem} onChange={e => setNewSystem(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addExtraSystem()}
                            className="flex-1" />
                        <Button variant="outlined" onClick={addExtraSystem}
                            className="font-bold normal-case" sx={{ borderRadius: '8px' }}>
                            Add
                        </Button>
                    </div>
                    {form.selectedServers.length > 0 && (
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Typography className="text-xs text-slate-400 dark:text-gray-500 font-bold w-full">Selected:</Typography>
                            {form.selectedServers.map(s => (
                                <Chip key={s} label={s} size="small" color="primary" variant="outlined" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Section: Status & Location */}
                <div className="px-24 py-16 border-b border-slate-100 dark:border-white/10">
                    <Typography className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-12">
                        {category === 'backup' ? 'Status & Location' : 'Status & Details'}
                    </Typography>
                    <div className="grid grid-cols-2 gap-12">
                        <FormControl fullWidth size="small">
                            <InputLabel>Status *</InputLabel>
                            <Select value={form.status} label="Status *"
                                onChange={e => setForm({ ...form, status: e.target.value })}>
                                {STATUS_OPTIONS.map(s => (
                                    <MenuItem key={s.value} value={s.value}>
                                        <div className="flex items-center gap-8">
                                            <span className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: s.color, display: 'inline-block' }} />
                                            {s.label}
                                        </div>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField label="Location *" placeholder="e.g. NAS Drive, Cloud S3..."
                            fullWidth size="small" value={form.location}
                            onChange={e => setForm({ ...form, location: e.target.value })} />
                    </div>
                    {selectedStatus && (
                        <div className="mt-10 inline-flex items-center gap-6 px-10 py-4 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: `${selectedStatus.color}18`, color: selectedStatus.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedStatus.color }} />
                            {selectedStatus.label}
                        </div>
                    )}
                </div>

                {/* Dynamic Custom Fields */}
                {dynamicFields.length > 0 && (
                    <div className="px-24 py-16 border-b border-slate-100 dark:border-white/10">
                        <Typography className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-12">
                            Additional Information
                        </Typography>
                        <div className="grid grid-cols-2 gap-12">
                            {dynamicFields.map(field => renderDynamicField(field))}
                        </div>
                    </div>
                )}

                {/* Section: Attachment */}
                <div className="px-24 py-16 border-b border-slate-100 dark:border-white/10">
                    <Typography className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-12">
                        {category === 'backup' ? 'Evidence / Report' : 'Results Upload'} <span className="text-slate-300 dark:text-gray-600 normal-case font-medium">(Optional)</span>
                    </Typography>
                    <div
                        className="border-2 border-dashed border-slate-200 dark:border-gray-600 rounded-xl p-16 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-all"
                        onClick={() => document.getElementById('backup-file-input')?.click()}
                    >
                        <input id="backup-file-input" type="file" className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf,.zip"
                            onChange={e => setAttachment(e.target.files?.[0] || null)} />
                        <FuseSvgIcon size={24} className="text-slate-300 dark:text-gray-600 mx-auto mb-6">heroicons-outline:cloud-arrow-up</FuseSvgIcon>
                        <Typography className="font-bold text-slate-400 dark:text-gray-500 text-sm">
                            {attachment ? attachment.name : `Click to upload ${category === 'backup' ? 'screenshot or PDF' : 'test results'}`}
                        </Typography>
                        <Typography className="text-xs text-slate-300 dark:text-gray-600 mt-2">JPG, PNG, PDF up to 10MB</Typography>
                    </div>
                    {attachment && (
                        <div className="mt-8 flex items-center gap-8 text-sm text-green-600 dark:text-green-400">
                            <FuseSvgIcon size={14}>heroicons-outline:check-circle</FuseSvgIcon>
                            <span className="font-bold">{attachment.name}</span>
                            <button onClick={() => setAttachment(null)} className="text-red-400 ml-4">
                                <FuseSvgIcon size={13}>heroicons-outline:x-mark</FuseSvgIcon>
                            </button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-24 py-14 flex gap-10">
                    <Button fullWidth variant="outlined" onClick={() => navigate('/ict-dashboard')}
                        sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', py: '8px' }}>
                        Cancel
                    </Button>
                    <Button fullWidth variant="contained" disabled={submitting} onClick={handleSubmit}
                        sx={{ borderRadius: '10px', fontWeight: 900, textTransform: 'none', py: '8px', background: '#6366f1', '&:hover': { background: '#4f46e5' } }}>
                        {submitting ? 'Saving...' : `Confirm ${category === 'backup' ? 'Backup' : category === 'vulnerability' ? 'Vulnerability Record' : 'Virus Scan Record'}`}
                    </Button>
                </div>
            </div>
        </div>
    );
}
