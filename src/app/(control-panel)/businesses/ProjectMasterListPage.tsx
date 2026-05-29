import React, { useState, useMemo, useEffect, useRef } from 'react';
import api from '@/utils/api';
import { API_BASE_URL } from '@/utils/api';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTheme, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'motion/react';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FolderIcon from '@mui/icons-material/Folder';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import SourceIcon from '@mui/icons-material/Source';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import { useNavigate } from 'react-router';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';

// ── Types ─────────────────────────────────────────────────────────
export type PdfFile = { name: string; path: string; url: string };

export type ProjectMasterListItem = {
    id: string;
    date: string;
    projectCode: string;
    projectTitle: string;
    poClientFiles: PdfFile[];
    bgDocument: string;
    bgIssueDate: string;
    prPoProcurementFiles: PdfFile[];
    deliveryOrderFiles: PdfFile[];
    invoiceDocumentFiles: PdfFile[];
    projectProgressFiles: PdfFile[];
    projectFolderFiles: PdfFile[];
    sourcingFiles: PdfFile[];
    quotationFiles: PdfFile[];
    customDocuments?: Record<string, PdfFile[]>;
};

// ── Link Helper & PDF URL fixer ─────────────────────────────────
// Rewrites legacy localhost/storage URLs to go through the API server
const fixPdfUrl = (url: string) => {
    if (!url) return url;
    // Replace bare localhost/storage with the API server URL
    return url.replace(
        /^http:\/\/localhost(\/storage\/)/,
        `${API_BASE_URL.replace(/\/api$/, '')}/api/storage/`
    );
};
const formatLink = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('file://')) return trimmed;
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed;
    // If it looks like a domain, add https
    if (trimmed.includes('.') && !trimmed.includes(' ')) return `https://${trimmed}`;
    return trimmed;
};

const RenderValue = ({ value, icon }: { value: string, icon?: any }) => {
    if (!value) return <Typography variant="caption" color="text.disabled">—</Typography>;
    const isLink = value.includes('://') || value.startsWith('/') || value.includes('.com') || value.includes('.net') || value.includes('.my');
    
    if (isLink) {
        return (
            <Tooltip title={value}>
                <Box component="a" href={formatLink(value)} target="_blank" 
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#3b82f6', textDecoration: 'none', fontWeight: 600, fontSize: 12, '&:hover': { textDecoration: 'underline', color: '#2563eb' } }}>
                    {icon}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{value}</span>
                </Box>
            </Tooltip>
        );
    }
    return <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</Typography>;
};

// ── Column definitions ────────────────────────────────────────────
const COLUMNS = [
    { id: 'poClientFiles',        label: 'PO/ LPO/ WO from Client', width: 200, isPdf: true },
    { id: 'bgDocument',           label: 'BG Document',             width: 140, icon: <AttachFileIcon sx={{ fontSize: 16 }} /> },
    { id: 'bgIssueDate',          label: 'BG Issues Date',          width: 140, icon: <CalendarMonthIcon sx={{ fontSize: 16 }} /> },
    { id: 'prPoProcurementFiles', label: 'PR/PO to Procurement',    width: 200, isPdf: true },
    { id: 'deliveryOrderFiles',   label: 'Delivery Order (DO)',     width: 180, isPdf: true },
    { id: 'invoiceDocumentFiles', label: 'Invoice Document',        width: 180, isPdf: true },
    { id: 'projectProgressFiles', label: 'Project Progress',        width: 180, isPdf: true },
    { id: 'projectFolderFiles',   label: 'Project Folder',          width: 180, isPdf: true },
    { id: 'sourcingFiles',        label: 'Sourcing',                width: 160, isPdf: true },
    { id: 'quotationFiles',       label: 'Quotation',               width: 160, isPdf: true },
];

// ── PDF chips shown in table cells ────────────────────────────────
function PdfChips({ files }: { files: PdfFile[] }) {
    if (!files || files.length === 0) return <Typography variant="caption" color="text.disabled">—</Typography>;
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {files.map((f, i) => {
                const isPdf = f.name.toLowerCase().endsWith('.pdf');
                return (
                    <Tooltip key={i} title={f.name}>
                        <Chip
                            icon={isPdf ? <PictureAsPdfIcon sx={{ fontSize: 13 }} /> : <AttachFileIcon sx={{ fontSize: 13 }} />}
                            label={isPdf ? `PDF ${i + 1}` : `File ${i + 1}`}
                            size="small"
                            component="a"
                            href={fixPdfUrl(f.url)}
                            target="_blank"
                            clickable
                            sx={{
                                fontSize: 10,
                                height: 22,
                                fontWeight: 700,
                                bgcolor: isPdf ? alpha('#ef4444', 0.1) : alpha('#2563eb', 0.1),
                                color: isPdf ? '#b91c1c' : '#1d4ed8',
                                border: '1px solid',
                                borderColor: isPdf ? alpha('#ef4444', 0.25) : alpha('#2563eb', 0.25)
                            }}
                        />
                    </Tooltip>
                );
            })}
        </Box>
    );
}

const STATIC_COLUMNS = [
    { id: 'date',              label: 'Date',               width: 100 },
    { id: 'projectCode',       label: 'Project Code / No',  width: 160 },
    { id: 'projectTitle',      label: 'Project Title',      width: 250 },
];

// ── Styled Components ──────────────────────────────────────────────
function HeaderCell({ col, sortKey, sortDir, onSort }: {
    col: any; sortKey: string; sortDir: 'asc' | 'desc'; onSort: (id: string) => void;
}) {
    const active = sortKey === col.id;
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    return (
        <th onClick={() => onSort(col.id)} style={{
            minWidth: col.width, width: col.width,
            background: isDark ? '#1e293b' : '#f1f5f9',
            color: isDark ? '#94a3b8' : '#475569',
            fontWeight: 700, fontSize: 11,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            padding: '12px 16px', height: 48, whiteSpace: 'nowrap',
            position: 'sticky', top: 0, zIndex: 3,
            borderBottom: `2px solid ${theme.palette.divider}`,
            borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            cursor: 'pointer', userSelect: 'none',
            textAlign: 'left',
            transition: 'background-color 0.2s',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {col.icon}
                {col.isPdf && <PictureAsPdfIcon sx={{ fontSize: 16 }} />}
                <span>{col.label}</span>
                <SwapVertIcon sx={{
                    fontSize: 16, opacity: active ? 1 : 0.3,
                    color: active ? '#2563eb' : (isDark ? '#94a3b8' : '#475569'),
                    transform: active && sortDir === 'desc' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    ml: 'auto'
                }} />
            </Box>
        </th>
    );
}

const StyledTextField = ({ ...props }: any) => (
    <TextField
        fullWidth
        size="small"
        {...props}
        sx={{
            '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: 'background.paper',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: alpha('#f59e0b', 0.02) },
                '&.Mui-focused': {
                    bgcolor: 'background.paper',
                    boxShadow: `0 0 0 4px ${alpha('#f59e0b', 0.1)}`,
                },
                '& fieldset': { borderColor: alpha('#000', 0.1) },
            },
            '& .MuiInputLabel-root': { fontSize: 13, fontWeight: 600, color: 'text.secondary' },
            ...props.sx
        }}
    />
);

function SectionTitle({ title, icon }: { title: string, icon?: any }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
            {icon}
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
                {title}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', ml: 1 }} />
        </Box>
    );
}

// ── Project Dialog ─────────────────────────────────────────────────
function ProjectDialog({ open, initial, saving, onClose, onSave }: {
    open: boolean;
    initial: ProjectMasterListItem | null;
    saving: boolean;
    onClose: () => void;
    onSave: (t: Partial<ProjectMasterListItem>) => void;
}) {
    const [form, setForm] = useState<Partial<ProjectMasterListItem>>(initial || {});
    const set = (field: keyof ProjectMasterListItem) => (val: string) => setForm(p => ({ ...p, [field]: val }));
    const isEdit = !!initial;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body"
            PaperProps={{ sx: { borderRadius: 5, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}>

            <Box sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                px: 4, py: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden'
            }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                    <BusinessCenterIcon sx={{ fontSize: 120, color: '#fff' }} />
                </Box>
                <Box sx={{ zIndex: 1 }}>
                    <Typography variant="h5" fontWeight={900} sx={{ color: '#fff', letterSpacing: '-0.5px', mb: 0.5 }}>
                        {isEdit ? 'Update Project Tracking' : 'New Project Tracking'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                        {initial?.projectTitle || 'Loading project details...'} • {initial?.projectCode}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small"
                    sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, zIndex: 1 }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 4, py: 4 }}>
                <SectionTitle title="Banking & Guarantees" icon={<BusinessCenterIcon sx={{ fontSize: 16, color: '#f59e0b' }} />} />
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <StyledTextField label="BG Document Path/Link" value={form.bgDocument || ''}
                            onChange={(e:any) => set('bgDocument')(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><AttachFileIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <StyledTextField label="BG Issues Date" type="date" value={form.bgIssueDate || ''}
                            onChange={(e:any) => set('bgIssueDate')(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
                    </Grid>
                </Grid>

                <SectionTitle title="Document Uploads" icon={<PictureAsPdfIcon sx={{ fontSize: 16, color: '#f59e0b' }} />} />
                {!initial?.id && (
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>Save the project first, then upload PDFs from the edit dialog.</Alert>
                )}
                {initial?.id && (
                    <PdfUploadSection tenderId={initial.id} />
                )}
            </DialogContent>

            <DialogActions sx={{ px: 4, pb: 4, pt: 0, gap: 1.5 }}>
                <Button onClick={onClose} disabled={saving}
                    sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 700, color: 'text.secondary', px: 3 }}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={() => onSave(form)}
                    disabled={saving}
                    sx={{
                        fontWeight: 800, textTransform: 'none', borderRadius: 2.5, boxShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.4)', px: 4, py: 1.2,
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        '&:hover': { background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 12px 20px -4px rgba(245, 158, 11, 0.5)' }
                    }}>
                    {saving ? 'Updating...' : 'Save Tracking Data'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

const FIXED_SLUGS = [
    'po_client',
    'pr_po_procurement',
    'delivery_order',
    'invoice_document',
    'project_progress_files',
    'project_folder_files',
    'sourcing_files',
    'quotation_files'
];

const CELL_ID_TO_FIXED_SLUG: Record<string, string> = {
    'poClientFiles': 'po_client',
    'prPoProcurementFiles': 'pr_po_procurement',
    'deliveryOrderFiles': 'delivery_order',
    'invoiceDocumentFiles': 'invoice_document',
    'projectProgressFiles': 'project_progress_files',
    'projectFolderFiles': 'project_folder_files',
    'sourcingFiles': 'sourcing_files',
    'quotationFiles': 'quotation_files'
};

// ── Main Page Component ──────────────────────────────────────────
export default function ProjectMasterListPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [tenders, setTenders]     = useState<ProjectMasterListItem[]>([]);
    const [loadingData, setLoading] = useState(true);
    const [search, setSearch]       = useState('');
    const [sortKey, setSortKey]     = useState('date');
    const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem]     = useState<ProjectMasterListItem | null>(null);
    const [saving, setSaving]         = useState(false);
    const [snack, setSnack]           = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
    const [customCols, setCustomCols] = useState<any[]>([]);

    useEffect(() => {
        let active = true;

        const fetchTenders = (isInitial = false) => {
            if (isInitial) setLoading(true);
            api.get('tenders')
                .json<any[]>()
                .then(data => {
                    if (active) {
                        setTenders(data.map(fromApi));
                    }
                })
                .catch(console.error)
                .finally(() => {
                    if (isInitial && active) setLoading(false);
                });
        };

        // Initial fetch
        fetchTenders(true);

        // Fetch dynamic columns configuration
        api.get('master-list')
            .json<any>()
            .then(raw => {
                if (active) {
                    setCustomCols(raw.project_document_title || []);
                }
            })
            .catch(console.error);

        // Background polling every 4 seconds
        const interval = setInterval(() => {
            fetchTenders(false);
        }, 4000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, []);

    const allColumns = useMemo(() => {
        const overridesMap = new Map<string, { label: string; text_color: string }>();
        customCols.forEach(col => {
            if (FIXED_SLUGS.includes(col.color)) {
                overridesMap.set(col.color, { label: col.label, text_color: col.text_color || 'pdf' });
            }
        });

        const mappedColumns = COLUMNS.map(col => {
            const slug = CELL_ID_TO_FIXED_SLUG[col.id];
            if (slug && overridesMap.has(slug)) {
                const ovr = overridesMap.get(slug)!;
                return {
                    ...col,
                    label: ovr.label,
                    isPdf: ovr.text_color === 'pdf'
                };
            }
            return col;
        });

        const dynamicCols = customCols
            .filter(col => !FIXED_SLUGS.includes(col.color))
            .map(col => ({
                id: col.color, // slug
                label: col.label,
                width: 180,
                isPdf: col.text_color === 'pdf'
            }));
        return [...mappedColumns, ...dynamicCols];
    }, [customCols]);

    const handleSort = (id: string) => {
        if (sortKey === id) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(id); setSortDir('asc'); }
    };

    const handleSave = async (form: Partial<ProjectMasterListItem>) => {
        if (!editItem) return;
        setSaving(true);
        try {
            const updated = await api.put(`tenders/${editItem.id}`, { json: toApi(form) }).json<any>();
            setTenders(p => p.map(t => t.id === editItem.id ? fromApi(updated) : t));
            setDialogOpen(false);
            setEditItem(null);
            setSnack({ msg: 'Project tracking updated successfully.', sev: 'success' });
        } catch (err) {
            console.error('Failed to save', err);
            setSnack({ msg: 'Failed to save. Please try again.', sev: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (t: ProjectMasterListItem) => { setEditItem(t); setDialogOpen(true); };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return tenders
            .filter(t => !q || Object.values(t).some(v => String(v).toLowerCase().includes(q)))
            .sort((a, b) => {
                const av = (a as any)[sortKey] ?? '';
                const bv = (b as any)[sortKey] ?? '';
                if (sortKey === 'date') return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
                return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
            });
    }, [tenders, search, sortKey, sortDir]);

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
            background: isDark 
                ? 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 100%)' 
                : 'linear-gradient(135deg, #f0f4f8 0%, #e0e7ff 100%)',
        }}>
            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Box sx={{ px: 4, py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                           borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 2, 
                           bgcolor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                           backdropFilter: 'blur(8px)' }}>
                    <Box>
                        <Typography variant="h4" fontWeight={900} letterSpacing="-1px">Project Master List</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                            Real-time execution tracking for awarded project documents and milestones
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField size="small" placeholder="Search projects…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                sx: { borderRadius: 3, bgcolor: alpha('#000', 0.02), '& fieldset': { borderColor: 'divider' } }
                            }}
                            sx={{ width: 280 }} />
                        <Tooltip title="Export tracking data to CSV">
                            <Button variant="outlined" startIcon={<DownloadIcon />} size="medium"
                                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}>
                                Export
                            </Button>
                        </Tooltip>
                    </Box>
                </Box>
            </motion.div>

            {/* Table Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3, bgcolor: 'transparent' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} style={{ height: '100%' }}>
                    <Paper elevation={0} sx={{ 
                        borderRadius: 3, 
                        border: '1px solid', 
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.12)', 
                        overflow: 'hidden', 
                        boxShadow: isDark 
                            ? '0 10px 30px -10px rgba(0,0,0,0.5)' 
                            : '0 10px 30px -10px rgba(99,102,241,0.15)',
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(16px)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', tableLayout: 'fixed', minWidth: 1800 }}>
                                <thead>
                                    <tr>
                                        <th style={{ 
                                            width: 50, 
                                            background: isDark ? '#1e293b' : '#f1f5f9', 
                                            color: isDark ? '#94a3b8' : '#475569', 
                                            fontWeight: 700, fontSize: 11, height: 48, 
                                            position: 'sticky', top: 0, left: 0, zIndex: 4, 
                                            borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                            borderBottom: `2px solid ${theme.palette.divider}`,
                                            textAlign: 'center' 
                                        }}>#</th>
                                        {STATIC_COLUMNS.map(col => (
                                            <HeaderCell key={col.id} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                        ))}
                                        {allColumns.map(col => (
                                            <HeaderCell key={col.id} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                        ))}
                                        <th style={{ 
                                            width: 80, 
                                            background: isDark ? '#1e293b' : '#f1f5f9', 
                                            position: 'sticky', top: 0, right: 0, zIndex: 4, 
                                            borderBottom: `2px solid ${theme.palette.divider}`,
                                            borderLeft: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' 
                                        }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filtered.map((row, idx) => (
                                            <motion.tr key={row.id} layout
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                style={{ 
                                                    background: idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)'),
                                                    transition: 'background-color 0.15s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(37,99,235,0.03)' : 'rgba(37,99,235,0.015)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)');
                                                }}
                                            >
                                                <td style={{ 
                                                    textAlign: 'center', fontSize: 11, fontWeight: 700, 
                                                    color: theme.palette.text.secondary, position: 'sticky', left: 0, 
                                                    backgroundColor: idx % 2 === 0 ? theme.palette.background.paper : (isDark ? '#1e293b' : '#f8fafc'), 
                                                    zIndex: 2, 
                                                    borderRight: `1px solid ${theme.palette.divider}`, 
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    transition: 'background-color 0.15s ease'
                                                }}>{idx + 1}</td>
                                                <td style={{ padding: '12px 16px', fontSize: 12, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 500, color: theme.palette.text.primary }}>{row.date}</td>
                                                <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, borderBottom: `1px solid ${theme.palette.divider}`, color: isDark ? '#60a5fa' : '#1e3a5f' }}>{row.projectCode}</td>
                                                <td style={{ padding: '12px 16px', fontSize: 12, borderBottom: `1px solid ${theme.palette.divider}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.palette.text.secondary, maxWidth: 250 }}>
                                                    <Tooltip title={row.projectTitle} arrow placement="top">
                                                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'default' }}>{row.projectTitle}</span>
                                                    </Tooltip>
                                                </td>
                                                
                                                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                                                    <PdfChips files={row.poClientFiles ?? []} />
                                                </td>
                                                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                                                    {row.bgDocument ? (
                                                        <Tooltip title={row.bgDocument}>
                                                            <Chip icon={<AttachFileIcon sx={{ fontSize: 14 }} />} label="View Doc" size="small" component="a" href={formatLink(row.bgDocument)} target="_blank" clickable
                                                                sx={{ fontSize: 10, height: 24, fontWeight: 700, bgcolor: alpha('#f59e0b', 0.1), color: '#b45309', border: '1px solid', borderColor: alpha('#f59e0b', 0.2) }} />
                                                        </Tooltip>
                                                    ) : <span style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', fontStyle: 'italic', fontWeight: 300 }}>—</span>}
                                                </td>
                                                <td style={{ padding: '12px 16px', fontSize: 12, borderBottom: `1px solid ${theme.palette.divider}`, color: theme.palette.text.primary }}>
                                                    {row.bgIssueDate || <span style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', fontStyle: 'italic', fontWeight: 300 }}>—</span>}
                                                </td>
                                                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                                                    <PdfChips files={row.prPoProcurementFiles ?? []} />
                                                </td>
                                                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                                                    <PdfChips files={row.deliveryOrderFiles ?? []} />
                                                </td>
                                                <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                                                    <PdfChips files={row.invoiceDocumentFiles ?? []} />
                                                </td>
                                                
                                                {(['projectProgressFiles', 'projectFolderFiles', 'sourcingFiles', 'quotationFiles'] as const).map((col) => (
                                                    <td key={col} style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                                                        <PdfChips files={(row as any)[col] ?? []} />
                                                    </td>
                                                ))}

                                                {customCols.map((col) => {
                                                    const files = (row.customDocuments && row.customDocuments[col.color]) || [];
                                                    return (
                                                        <td key={col.id} style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                                                            <PdfChips files={files} />
                                                        </td>
                                                    );
                                                })}
 
                                                <td style={{ 
                                                    textAlign: 'center', position: 'sticky', right: 0, 
                                                    backgroundColor: idx % 2 === 0 ? theme.palette.background.paper : (isDark ? '#1e293b' : '#f8fafc'), 
                                                    zIndex: 2, 
                                                    borderLeft: `1px solid ${theme.palette.divider}`, 
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    transition: 'background-color 0.15s ease'
                                                }}>
                                                    <Tooltip title="Update Tracking Details">
                                                        <IconButton size="small" onClick={() => openEdit(row)}
                                                            sx={{ 
                                                                color: '#f59e0b', 
                                                                bgcolor: alpha('#f59e0b', 0.08), 
                                                                '&:hover': { bgcolor: alpha('#f59e0b', 0.15) },
                                                                width: 28, height: 28, borderRadius: 1.5
                                                            }}>
                                                            <EditIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </Box>
                    </Paper>
                </motion.div>
            </Box>

            <ProjectDialog open={dialogOpen} initial={editItem} saving={saving}
                onClose={() => setDialogOpen(false)} onSave={handleSave} />

            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snack?.sev} variant="filled" sx={{ borderRadius: 3, fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    {snack?.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}

// ── Helpers ───────────────────────────────────────────────────────
function fromApi(raw: any): ProjectMasterListItem {
    return {
        id:                     String(raw.id),
        date:                   raw.date              ?? '',
        projectCode:            raw.project_code      ?? '',
        projectTitle:           raw.project_title     ?? '',
        poClientFiles:          raw.po_client         ?? [],
        bgDocument:             raw.bg_document       ?? '',
        bgIssueDate:            raw.bg_issue_date     ?? '',
        prPoProcurementFiles:   raw.pr_po_procurement ?? [],
        deliveryOrderFiles:     raw.delivery_order    ?? [],
        invoiceDocumentFiles:   raw.invoice_document  ?? [],
        projectProgressFiles:   raw.project_progress_files ?? [],
        projectFolderFiles:     raw.project_folder_files   ?? [],
        sourcingFiles:          raw.sourcing_files         ?? [],
        quotationFiles:         raw.quotation_files        ?? [],
        customDocuments:        raw.custom_documents       ?? {},
    };
}

function toApi(form: Partial<ProjectMasterListItem>) {
    return {
        bg_document:       form.bgDocument       || null,
        bg_issue_date:     form.bgIssueDate      || null,
    };
}

// ── PDF Upload Section (inside dialog) ───────────────────────────
const PDF_SECTIONS: { column: string; label: string; icon: any; group: string }[] = [
    { column: 'po_client',              label: 'PO/ LPO/ WO from Client', icon: <ReceiptIcon sx={{ fontSize: 16 }} />,         group: 'Client & Procurement' },
    { column: 'pr_po_procurement',      label: 'PR/PO to Procurement',    icon: <LocalShippingIcon sx={{ fontSize: 16 }} />,   group: 'Client & Procurement' },
    { column: 'delivery_order',         label: 'Delivery Order (DO)',      icon: <LocalShippingIcon sx={{ fontSize: 16 }} />,   group: 'Client & Procurement' },
    { column: 'invoice_document',       label: 'Invoice Document',         icon: <ReceiptIcon sx={{ fontSize: 16 }} />,         group: 'Client & Procurement' },
    { column: 'project_progress_files', label: 'Project Progress',         icon: <BusinessCenterIcon sx={{ fontSize: 16 }} />, group: 'Project Documents' },
    { column: 'project_folder_files',   label: 'Project Folder',           icon: <FolderIcon sx={{ fontSize: 16 }} />,          group: 'Project Documents' },
    { column: 'sourcing_files',         label: 'Sourcing',                 icon: <SourceIcon sx={{ fontSize: 16 }} />,          group: 'Project Documents' },
    { column: 'quotation_files',        label: 'Quotation',                icon: <ReceiptIcon sx={{ fontSize: 16 }} />,         group: 'Project Documents' },
];

function PdfUploadSection({ tenderId }: { tenderId: string }) {
    const [data, setData]       = useState<ProjectMasterListItem | null>(null);
    const [uploading, setUploading] = useState<string | null>(null);
    const [deleting, setDeleting]   = useState<string | null>(null);
    const [customCols, setCustomCols] = useState<any[]>([]);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        api.get(`tenders/${tenderId}`).json<any>().then(raw => setData(fromApi(raw))).catch(console.error);
        api.get('master-list').json<any>().then(raw => setCustomCols(raw.project_document_title || [])).catch(console.error);
    }, [tenderId]);

    const handleUpload = async (column: string, files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(column);
        try {
            const fd = new FormData();
            fd.append('column', column);
            Array.from(files).forEach(f => fd.append('files[]', f));
            console.log('[Upload] column:', column, '| files:', Array.from(files).map(f => f.name + ' (' + (f.size/1024).toFixed(1) + 'KB)'));
            const updated = await api.post(`tenders/${tenderId}/upload-files`, { body: fd }).json<any>();
            setData(fromApi(updated));
        } catch (e: any) {
            // Log the full response body to see exact validation errors
            if (e?.response) {
                const body = await e.response.json().catch(() => null);
                console.error('[Upload] Server error:', e.response.status, JSON.stringify(body, null, 2));
            } else {
                console.error('Upload failed:', e);
            }
        } finally {
            setUploading(null);
            if (inputRefs.current[column]) inputRefs.current[column]!.value = '';
        }
    };


    const handleDelete = async (column: string, path: string) => {
        setDeleting(path);
        try {
            const updated = await api.delete(`tenders/${tenderId}/files`, { json: { column, path } }).json<any>();
            setData(fromApi(updated));
        } catch (e) { console.error(e); }
        finally { setDeleting(null); }
    };

    const fileKey = (col: string): keyof ProjectMasterListItem | 'custom' => {
        const map: Record<string, keyof ProjectMasterListItem> = {
            po_client:              'poClientFiles',
            pr_po_procurement:      'prPoProcurementFiles',
            delivery_order:         'deliveryOrderFiles',
            invoice_document:       'invoiceDocumentFiles',
            project_progress_files: 'projectProgressFiles',
            project_folder_files:   'projectFolderFiles',
            sourcing_files:         'sourcingFiles',
            quotation_files:        'quotationFiles',
        };
        return map[col] || 'custom';
    };

    const allSections = useMemo(() => {
        const sections = PDF_SECTIONS.map(sec => {
            const ovr = customCols.find(c => c.color === sec.column);
            if (ovr) {
                return {
                    ...sec,
                    label: ovr.label,
                    accept: ovr.text_color === 'pdf' ? 'application/pdf' : undefined
                };
            }
            return {
                ...sec,
                accept: 'application/pdf'
            };
        });

        const dynamicSections = customCols
            .filter(col => !FIXED_SLUGS.includes(col.color))
            .map(col => ({
                column: col.color, // slug
                label: col.label,
                icon: <DescriptionIcon sx={{ fontSize: 16 }} />,
                group: 'Custom Documents',
                accept: col.text_color === 'pdf' ? 'application/pdf' : undefined
            }));
        return [...sections, ...dynamicSections] as any[];
    }, [customCols]);

    if (!data) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>;

    return (
        <Grid container spacing={2}>
            {(() => {
                let lastGroup = '';
                return allSections.map(({ column, label, icon, group, accept }) => {
                    const key = fileKey(column);
                    const files = key === 'custom'
                        ? (data.customDocuments && data.customDocuments[column]) || []
                        : (data[key] as PdfFile[]) ?? [];
                    
                    const isUp  = uploading === column;
                    const showGroupHeader = group !== lastGroup;
                    lastGroup = group;
                    
                    const isPdfOnly = accept === 'application/pdf';
                    const acceptAttr = isPdfOnly ? 'application/pdf' : undefined;
                    const buttonText = isPdfOnly ? 'Upload PDF' : 'Upload File';
                    const emptyText = isPdfOnly ? 'No PDFs uploaded yet' : 'No files uploaded yet';

                    return (
                        <React.Fragment key={column}>
                            {showGroupHeader && (
                                <Grid size={{ xs: 12 }}>
                                    <SectionTitle title={group} icon={group === 'Client & Procurement' ? <ReceiptIcon sx={{ fontSize: 16, color: '#f59e0b' }} /> : group === 'Custom Documents' ? <SettingsIcon sx={{ fontSize: 16, color: '#f59e0b' }} /> : <FolderIcon sx={{ fontSize: 16, color: '#f59e0b' }} />} />
                                </Grid>
                            )}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {icon}
                                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</Typography>
                                        </Box>
                                        <Button
                                            size="small"
                                            startIcon={isUp ? <CircularProgress size={12} /> : <UploadFileIcon sx={{ fontSize: 14 }} />}
                                            disabled={isUp}
                                            onClick={() => inputRefs.current[column]?.click()}
                                            sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11, borderRadius: 2, bgcolor: alpha('#f59e0b', 0.1), color: '#b45309', '&:hover': { bgcolor: alpha('#f59e0b', 0.2) } }}
                                        >
                                            {buttonText}
                                        </Button>
                                        <input
                                            type="file"
                                            multiple
                                            accept={acceptAttr}
                                            style={{ display: 'none' }}
                                            ref={el => { inputRefs.current[column] = el; }}
                                            onChange={e => handleUpload(column, e.target.files)}
                                        />
                                    </Box>
                                    {isUp && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}
                                    {files.length === 0 ? (
                                        <Typography variant="caption" color="text.disabled">{emptyText}</Typography>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {files.map((f, i) => {
                                                const isFilePdf = f.name.toLowerCase().endsWith('.pdf');
                                                return (
                                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: isFilePdf ? alpha('#ef4444', 0.05) : alpha('#2563eb', 0.05), borderRadius: 1.5, px: 1, py: 0.5 }}>
                                                        {isFilePdf ? (
                                                            <PictureAsPdfIcon sx={{ fontSize: 14, color: '#ef4444', flexShrink: 0 }} />
                                                        ) : (
                                                            <AttachFileIcon sx={{ fontSize: 14, color: '#2563eb', flexShrink: 0 }} />
                                                        )}
                                                        <Tooltip title={f.name}>
                                                            <Typography component="a" href={fixPdfUrl(f.url)} target="_blank"
                                                                sx={{ fontSize: 11, fontWeight: 600, color: isFilePdf ? '#b91c1c' : '#1d4ed8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                                                {f.name}
                                                            </Typography>
                                                        </Tooltip>
                                                        <IconButton size="small" disabled={deleting === f.path}
                                                            onClick={() => handleDelete(column, f.path)}
                                                            sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                                                            {deleting === f.path ? <CircularProgress size={12} /> : <DeleteIcon sx={{ fontSize: 14 }} />}
                                                        </IconButton>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        </React.Fragment>
                    );
                });
            })()}
        </Grid>
    );
}
