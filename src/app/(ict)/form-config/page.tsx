'use client';

import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import { enqueueSnackbar } from 'notistack';
import api from '@/utils/api';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'email';

interface FormField {
    id: number;
    field_key: string;
    label: string;
    type: FieldType;
    required: boolean;
    sort_order: number;
    is_active: boolean;
    options?: string[] | null;
    section: string;
}

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
    { value: 'text', label: 'Short Text', icon: 'heroicons-outline:pencil' },
    { value: 'textarea', label: 'Long Text', icon: 'heroicons-outline:document-text' },
    { value: 'number', label: 'Number', icon: 'heroicons-outline:hashtag' },
    { value: 'date', label: 'Date', icon: 'heroicons-outline:calendar' },
    { value: 'select', label: 'Dropdown', icon: 'heroicons-outline:chevron-down' },
    { value: 'checkbox', label: 'Checkbox', icon: 'heroicons-outline:check-circle' },
    { value: 'email', label: 'Email', icon: 'heroicons-outline:envelope' },
];

const TYPE_COLOR: Record<string, string> = {
    text: '#6366f1', textarea: '#8b5cf6', number: '#0ea5e9',
    date: '#f59e0b', select: '#10b981', checkbox: '#ec4899', email: '#ef4444',
};

export default function MasterformConfigPage() {
    const [fields, setFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('backup');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingField, setEditingField] = useState<FormField | null>(null);
    const [saving, setSaving] = useState(false);
    const [optionsInput, setOptionsInput] = useState('');
    const [newForm, setNewForm] = useState({
        label: '',
        field_key: '',
        type: 'text' as FieldType,
        required: false,
        section: 'General',
        options: [] as string[],
    });

    useEffect(() => { fetchFields(); }, [category]);

    const fetchFields = async () => {
        try {
            setLoading(true);
            const res = await api.get('ict-form-config', { searchParams: { category } });
            const data = await res.json() as FormField[];
            setFields(data);
        } catch {
            enqueueSnackbar('Failed to load form fields', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setEditingField(null);
        setNewForm({ label: '', field_key: '', type: 'text', required: false, section: 'General', options: [] });
        setOptionsInput('');
        setOpenDialog(true);
    };

    const openEdit = (field: FormField) => {
        setEditingField(field);
        setNewForm({
            label: field.label,
            field_key: field.field_key,
            type: field.type,
            required: field.required,
            section: field.section,
            options: field.options || [],
        });
        setOptionsInput((field.options || []).join(', '));
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!newForm.label) { enqueueSnackbar('Label is required', { variant: 'warning' }); return; }
        const payload = {
            ...newForm,
            category,
            field_key: newForm.field_key || newForm.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
            options: newForm.type === 'select' ? optionsInput.split(',').map(s => s.trim()).filter(Boolean) : null,
        };
        setSaving(true);
        try {
            if (editingField) {
                await api.put(`ict-form-config/${editingField.id}`, { json: payload });
                enqueueSnackbar('Field updated', { variant: 'success' });
            } else {
                await api.post('ict-form-config', { json: payload });
                enqueueSnackbar('Field added', { variant: 'success' });
            }
            fetchFields();
            setOpenDialog(false);
        } catch {
            enqueueSnackbar('Failed to save field', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this field?')) return;
        try {
            await api.delete(`ict-form-config/${id}`);
            setFields(prev => prev.filter(f => f.id !== id));
            enqueueSnackbar('Field deleted', { variant: 'success' });
        } catch {
            enqueueSnackbar('Failed to delete field', { variant: 'error' });
        }
    };

    const handleToggleActive = async (field: FormField) => {
        try {
            await api.put(`ict-form-config/${field.id}`, { json: { ...field, is_active: !field.is_active } });
            setFields(prev => prev.map(f => f.id === field.id ? { ...f, is_active: !f.is_active } : f));
        } catch {
            enqueueSnackbar('Failed to update field', { variant: 'error' });
        }
    };

    const handleReorder = async (newOrder: FormField[]) => {
        setFields(newOrder);
        try {
            await api.post('ict-form-config/reorder', {
                json: { order: newOrder.map((f, i) => ({ id: f.id, sort_order: i })) }
            });
        } catch {
            enqueueSnackbar('Failed to save order', { variant: 'error' });
        }
    };

    // Group fields by section
    const sections = [...new Set(fields.map(f => f.section))];

    if (loading) return <FuseLoading />;

    return (
        <div className="p-20 w-full h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-4">
                <div>
                    <Typography variant="h5" className="font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {category === 'vulnerability' ? 'Vulnerability' : category === 'virus_scan' ? 'Virus Scan' : 'Masterform'} Configuration
                    </Typography>
                    <Typography className="text-slate-400 dark:text-gray-400 text-sm mt-1">
                        Define and manage fields on the {category === 'vulnerability' ? 'Vulnerability Testing' : category === 'virus_scan' ? 'Virus Scan' : 'Backup'} Creation form. Drag rows to reorder.
                    </Typography>
                </div>
                <div className="flex items-center gap-4">
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
                    <Button
                        variant="contained"
                        startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>}
                        onClick={openAdd}
                        sx={{ borderRadius: '10px', fontWeight: 900, background: '#6366f1', '&:hover': { background: '#4f46e5' }, textTransform: 'none', px: 2.5, py: 1 }}
                    >
                        Add Field
                    </Button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex gap-10 mb-16">
                {[
                    { label: 'Total Fields', value: fields.length, color: '#6366f1' },
                    { label: 'Active', value: fields.filter(f => f.is_active).length, color: '#10b981' },
                    { label: 'Required', value: fields.filter(f => f.required).length, color: '#f59e0b' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm px-16 py-10 flex items-center gap-10">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
                        <Typography className="text-lg font-black text-slate-800 dark:text-white">{stat.value}</Typography>
                        <Typography className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">{stat.label}</Typography>
                    </div>
                ))}
            </div>

            {/* Field List by Section */}
            {fields.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm p-40 text-center">
                    <FuseSvgIcon size={36} className="text-slate-200 dark:text-gray-700 mx-auto mb-12">heroicons-outline:adjustments-horizontal</FuseSvgIcon>
                    <Typography className="text-slate-400 dark:text-gray-500 font-bold text-sm">No fields configured yet.</Typography>
                    <Typography className="text-xs text-slate-300 dark:text-gray-600 mt-4">Click "Add Field" to define your first form column.</Typography>
                </div>
            ) : (
                sections.map(section => (
                    <div key={section} className="mb-16">
                        <Typography className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-8 px-2">
                            {section}
                        </Typography>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden">
                            {/* Column headers */}
                            <div className="grid grid-cols-12 gap-8 px-16 py-8 bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-white/10">
                                {['', 'Label', 'Field Key', 'Type', 'Req', 'Active', 'Actions'].map((h, i) => (
                                    <Typography key={i} className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500"
                                        style={{ gridColumn: [1, 3, 2, 2, 1, 1, 2][i] + ' span' }}>
                                        {h}
                                    </Typography>
                                ))}
                            </div>

                            <Reorder.Group axis="y" values={fields.filter(f => f.section === section)} onReorder={handleReorder}>
                                <AnimatePresence>
                                    {fields.filter(f => f.section === section).map(field => (
                                        <Reorder.Item key={field.id} value={field}>
                                            <motion.div
                                                initial={{ opacity: 0, y: -6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                className={`grid grid-cols-12 gap-8 px-16 py-10 items-center border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors cursor-grab active:cursor-grabbing ${!field.is_active ? 'opacity-40' : ''}`}
                                            >
                                                <div className="col-span-1 flex items-center text-slate-300 dark:text-gray-600">
                                                    <FuseSvgIcon size={14}>heroicons-outline:bars-3</FuseSvgIcon>
                                                </div>
                                                <Typography className="col-span-3 font-bold text-slate-800 dark:text-gray-100 text-sm truncate">{field.label}</Typography>
                                                <Typography className="col-span-2 font-mono text-xs text-slate-400 dark:text-gray-500 truncate">{field.field_key}</Typography>
                                                <div className="col-span-2">
                                                    <Chip
                                                        label={FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                                                        size="small"
                                                        sx={{ backgroundColor: `${TYPE_COLOR[field.type]}15`, color: TYPE_COLOR[field.type], fontWeight: 700, fontSize: '10px' }}
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    {field.required
                                                        ? <Chip label="Yes" size="small" sx={{ background: '#fef3c7', color: '#d97706', fontWeight: 700, fontSize: '9px' }} />
                                                        : <Chip label="No" size="small" sx={{ background: '#f1f5f9', color: '#94a3b8', fontWeight: 700, fontSize: '9px' }} />
                                                    }
                                                </div>
                                                <div className="col-span-1">
                                                    <Switch
                                                        checked={field.is_active}
                                                        onChange={() => handleToggleActive(field)}
                                                        size="small"
                                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6366f1' } }}
                                                    />
                                                </div>
                                                <div className="col-span-2 flex items-center gap-4 justify-end">
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => openEdit(field)} className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                                                            <FuseSvgIcon size={14}>heroicons-outline:pencil</FuseSvgIcon>
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" onClick={() => handleDelete(field.id)} className="text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                            <FuseSvgIcon size={14}>heroicons-outline:trash</FuseSvgIcon>
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </motion.div>
                                        </Reorder.Item>
                                    ))}
                                </AnimatePresence>
                            </Reorder.Group>
                        </div>
                    </div>
                ))
            )}

            {/* Add/Edit Field Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle className="px-24 pt-24 pb-4 font-black text-lg text-slate-800 dark:text-white">
                    {editingField ? 'Edit Field' : 'Add New Field'}
                </DialogTitle>
                <DialogContent className="px-24 pb-0">
                    <div className="flex flex-col gap-16 py-8">
                        <TextField
                            label="Field Label *"
                            fullWidth
                            size="small"
                            value={newForm.label}
                            onChange={e => {
                                const label = e.target.value;
                                setNewForm(prev => ({
                                    ...prev, label,
                                    field_key: prev.field_key || label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                                }));
                            }}
                        />
                        <TextField
                            label="Field Key (auto-generated)"
                            fullWidth
                            size="small"
                            value={newForm.field_key}
                            onChange={e => setNewForm(prev => ({ ...prev, field_key: e.target.value }))}
                            helperText="Lowercase with underscores. Used to identify this field in data."
                        />
                        <FormControl fullWidth size="small">
                            <InputLabel>Field Type</InputLabel>
                            <Select value={newForm.type} label="Field Type" onChange={e => setNewForm(prev => ({ ...prev, type: e.target.value as FieldType }))}>
                                {FIELD_TYPES.map(t => (
                                    <MenuItem key={t.value} value={t.value}>
                                        <div className="flex items-center gap-8">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLOR[t.value], display: 'inline-block' }} />
                                            {t.label}
                                        </div>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {newForm.type === 'select' && (
                            <TextField
                                label="Options (comma separated)"
                                fullWidth
                                size="small"
                                value={optionsInput}
                                onChange={e => setOptionsInput(e.target.value)}
                                placeholder="Option A, Option B, Option C"
                                helperText="Enter dropdown options separated by commas"
                            />
                        )}
                        <TextField
                            label="Section (group heading)"
                            fullWidth
                            size="small"
                            value={newForm.section}
                            onChange={e => setNewForm(prev => ({ ...prev, section: e.target.value }))}
                            placeholder="General, Advanced..."
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={newForm.required}
                                    onChange={e => setNewForm(prev => ({ ...prev, required: e.target.checked }))}
                                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#f59e0b' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#f59e0b' } }}
                                />
                            }
                            label={<Typography className="font-bold text-sm">Required Field</Typography>}
                        />
                    </div>
                </DialogContent>
                <DialogActions className="px-24 pb-20 pt-8 gap-8">
                    <Button variant="outlined" onClick={() => setOpenDialog(false)}
                        sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', flex: 1 }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        disabled={saving}
                        onClick={handleSave}
                        sx={{ borderRadius: '10px', fontWeight: 900, background: '#6366f1', '&:hover': { background: '#4f46e5' }, textTransform: 'none', flex: 1 }}
                    >
                        {saving ? 'Saving...' : editingField ? 'Update Field' : 'Add Field'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
