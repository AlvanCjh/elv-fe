import { useState, useMemo, useEffect } from 'react';
import api from '@/utils/api';
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
import Autocomplete from '@mui/material/Autocomplete';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTheme, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'motion/react';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TagIcon from '@mui/icons-material/Tag';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useMasterList, MasterListItem } from './context/MasterListContext';
import { useNavigate } from 'react-router';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';
import TenderCostingReportDialog from './components/TenderCostingReportDialog';
import AssessmentIcon from '@mui/icons-material/Assessment';

// ── Types ─────────────────────────────────────────────────────────
export type Tender = {
    id: string;
    date: string;
    projectCode: string;
    status: string;
    type: string;
    company: string;
    customer: string;
    supplier: string;
    agencyTypes: string;
    projectTitle: string;
    personInCharge: string;
    contactNo: string;
    email: string;
    internalQuotation: string;
    salesPrice?: number;
    costPrice?: number;
    margin?: number;
    submissionDate?: string;
    successRate?: string;

    projectProgressLink?: string;
    projectFolderLink?: string;
    sourcingLink?: string;
    quotationLink?: string;
    creator?: { id: number, name: string };
    creatorName?: string;
    verification_status?: string;
    verified_at?: string;
    approved_at?: string;
    createdAt?: string;
    verifier_signature?: string;
    approver_signature?: string;
    verifier?: { id: number, name: string };
    approver?: { id: number, name: string };
    quotationVersion?: string;
    quotationVersions?: { version: string; description: string }[];
};

const COLUMNS = [
    { id: 'date',              label: 'Date',               width: 90  },
    { id: 'projectCode',       label: 'Project Code / No',  width: 140 },
    { id: 'status',            label: 'Status',             width: 125 },
    { id: 'type',              label: 'Type',               width: 110 },
    { id: 'company',           label: 'Company',            width: 100 },
    { id: 'customer',          label: 'Customer',           width: 140 },
    { id: 'supplier',          label: 'Supplier',           width: 180 },
    { id: 'agencyTypes',       label: 'Agency Types',       width: 150 },
    { id: 'projectTitle',      label: 'Project Title',      width: 140 },
    { id: 'personInCharge',    label: 'Person In Charge',   width: 140 },
    { id: 'contactNo',         label: 'Contact No.',        width: 110 },
    { id: 'email',             label: 'Email',              width: 140 },
    { id: 'internalQuotation', label: 'Int. Quotation',     width: 120  },
    { id: 'creatorName',       label: 'Created By',         width: 120 },
];

// ── Blue Header Cell ──────────────────────────────────────────────
function HeaderCell({ col, sortKey, sortDir, onSort }: {
    col: typeof COLUMNS[0]; sortKey: string; sortDir: 'asc' | 'desc'; onSort: (id: string) => void;
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
            transition: 'background-color 0.2s',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{col.label}</span>
                <SwapVertIcon fontSize="inherit" sx={{
                    fontSize: 14, opacity: active ? 1 : 0.35,
                    color: active ? '#2563eb' : (isDark ? '#94a3b8' : '#475569'),
                    transform: active && sortDir === 'desc' ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                }} />
            </div>
        </th>
    );
}

// ── Section Header ────────────────────────────────────────────────
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ color: '#2563eb', display: 'flex' }}>{icon}</Box>
            <Typography variant="caption" fontWeight={800}
                sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2563eb', fontSize: 11 }}>
                {label}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#dbeafe', ml: 1 }} />
        </Box>
    );
}

// ── Free-solo history Autocomplete (for text fields) ─────────────
function FreeSoloInput({ label, value, onChange, history, type }: {
    label: string; value: string; onChange: (v: string) => void;
    history: string[]; type?: string;
}) {
    const opts = Array.from(new Set(history.filter(Boolean))).sort();
    return (
        <Autocomplete
            fullWidth
            freeSolo
            disablePortal
            size="small"
            options={opts}
            value={value}
            inputValue={value}
            onInputChange={(_, v) => onChange(v)}
            onChange={(_, v) => onChange(v ?? '')}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    size="small"
                    type={type}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            )}
            renderOption={(props, option) => {
                const { key, ...rest } = props as any;
                return (
                    <Box component="li" key={key} {...rest}
                        sx={{ fontSize: 12, color: 'text.secondary', py: '4px !important' }}>
                        {option}
                    </Box>
                );
            }}
        />
    );
}

// ── Autocomplete Chip Select (for large lists: customer, agency) ──
function ChipAutocomplete({ label, value, onChange, items }: {
    label: string; value: string; onChange: (v: string) => void; items: MasterListItem[];
}) {
    const selected = items.find(i => i.label && value && i.label.toLowerCase() === value.toLowerCase()) ?? null;
    return (
        <Autocomplete
            fullWidth
            disablePortal
            size="small"
            options={items}
            value={selected}
            getOptionLabel={(option) => option.label}
            onChange={(_, newValue) => onChange(newValue?.label ?? '')}
            isOptionEqualToValue={(option, val) => option.label?.toLowerCase() === val.label?.toLowerCase()}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            )}
            renderOption={(props, option) => {
                // Destructure key separately to avoid React key warning
                const { key, ...rest } = props as any;
                return (
                    <Box component="li" key={key} {...rest}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, py: '6px !important' }}>
                        <Chip
                            label={option.label}
                            size="small"
                            sx={{
                                bgcolor: option.color || 'transparent',
                                color: option.color ? (option.textColor || '#fff') : 'text.primary',
                                fontWeight: 700, fontSize: 11,
                                border: !option.color ? '1px solid #e5e7eb' : 'none',
                                pointerEvents: 'none',
                            }}
                        />
                    </Box>
                );
            }}
        />
    );
}

// ── Multi Autocomplete Chip Select (for multiple suppliers) ───────
function MultiChipAutocomplete({ label, value, onChange, items }: {
    label: string; value: string; onChange: (v: string) => void; items: MasterListItem[];
}) {
    const valueArray = useMemo(() => value ? value.split(',').map(v => v.trim().toLowerCase()).filter(Boolean) : [], [value]);
    const selected = useMemo(() => items.filter(i => i.label && valueArray.includes(i.label.toLowerCase())), [items, valueArray]);

    return (
        <Autocomplete
            multiple
            fullWidth
            disablePortal
            size="small"
            options={items}
            value={selected}
            getOptionLabel={(option) => option.label}
            onChange={(_, newValue) => {
                const labels = newValue.map(v => v.label).join(', ');
                onChange(labels);
            }}
            isOptionEqualToValue={(option, val) => option.label?.toLowerCase() === val.label?.toLowerCase()}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            )}
            renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                        <Chip
                            key={key}
                            label={option.label}
                            size="small"
                            {...tagProps}
                            sx={{
                                bgcolor: option.color || '#2563eb',
                                color: option.textColor || '#fff',
                                fontWeight: 700, fontSize: 10,
                                height: 20,
                            }}
                        />
                    );
                })
            }
            renderOption={(props, option) => {
                const { key, ...rest } = props as any;
                return (
                    <Box component="li" key={key} {...rest}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, py: '6px !important' }}>
                        <Chip
                            label={option.label}
                            size="small"
                            sx={{
                                bgcolor: option.color || 'transparent',
                                color: option.color ? (option.textColor || '#fff') : 'text.primary',
                                fontWeight: 700, fontSize: 11,
                                border: !option.color ? '1px solid #e5e7eb' : 'none',
                                pointerEvents: 'none',
                            }}
                        />
                    </Box>
                );
            }}
        />
    );
}

// ── Inline chip for table cell ────────────────────────────────────
function StatusChip({ value, items, showContactTooltip = false }: { value: string; items: MasterListItem[]; showContactTooltip?: boolean }) {
    if (!value) return <span style={{ color: '#9ca3af' }}>—</span>;
    
    const values = value.split(',').map(v => v.trim()).filter(Boolean);
    
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {values.map((v, idx) => {
                const found = items.find(i => i.label && v && i.label.toLowerCase() === v.toLowerCase());
                const chip = (
                    <Chip key={idx} label={v} size="small" sx={{
                        bgcolor: found?.color || 'transparent',
                        color: found?.color ? (found.textColor || '#fff') : 'text.primary',
                        fontWeight: 700, fontSize: 10,
                        height: 20,
                        border: !found?.color ? '1px solid #e5e7eb' : 'none',
                    }} />
                );

                if (!showContactTooltip || !found || (!found.email && !found.contact1 && !found.contact2 && !found.contact3)) {
                    return chip;
                }

                return (
                    <Tooltip key={idx} title={
                        <Box sx={{ p: 1, minWidth: 200, maxHeight: 300, overflowY: 'auto' }}>
                            <Typography variant="body2" fontWeight={800} sx={{ color: '#fff', display: 'block', mb: 1, fontSize: 14, borderBottom: '1px solid rgba(255,255,255,0.2)', pb: 0.5 }}>
                                {found.label}
                            </Typography>
                            {found.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                                    <EmailIcon sx={{ fontSize: 16, color: '#93c5fd' }} />
                                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>{found.email}</Typography>
                                </Box>
                            )}
                            {[found.contact1, found.contact2, found.contact3].filter(Boolean).map((c, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <PhoneIcon sx={{ fontSize: 16, color: '#86efac' }} />
                                    <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>{c}</Typography>
                                </Box>
                            ))}
                        </Box>
                    } arrow placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>{chip}</Box>
                    </Tooltip>
                );
            })}
        </Box>
    );
}

// ── Tender Dialog ─────────────────────────────────────────────────
const EMPTY_TENDER: Omit<Tender, 'id'> = {
    date: new Date().toISOString().slice(0, 10),
    projectCode: '', status: '', type: '', company: '', customer: '',
    supplier: '', agencyTypes: '', projectTitle: '', personInCharge: '', contactNo: '',
    email: '', internalQuotation: '',
    salesPrice: undefined, costPrice: undefined, margin: undefined,
    submissionDate: '', successRate: '',
    quotationVersion: '01',
    quotationVersions: []
};

function generateNextProjectCode(tenders: Tender[]): string {
    const year = new Date().getFullYear();
    const suffix = `/${year}`;
    let max = 0;
    for (const t of tenders) {
        if (t.projectCode && t.projectCode.endsWith(suffix)) {
            const match = t.projectCode.match(/^P(\d+)\/\d{4}$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > max) max = num;
            }
        }
    }
    return `P${String(max + 1).padStart(3, '0')}${suffix}`;
}

function generateNextInternalQuotation(company: string, tenders: Tender[], dateStr?: string, activeVersion: string = '01'): string {
    if (!company) return '';
    const prefix = company.toUpperCase();
    const d = dateStr ? new Date(dateStr) : new Date();
    const now = isNaN(d.getTime()) ? new Date() : d;
    const year = now.getFullYear();
    
    let max = 0;
    const regexNew = new RegExp(`^${prefix}/${year}/(\\d+)`);
    const regexOld = new RegExp(`^${prefix}(\\d+)/${year}`);
    
    for (const t of tenders) {
        if (t.internalQuotation) {
            let match = t.internalQuotation.match(regexNew);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > max) max = num;
            } else {
                match = t.internalQuotation.match(regexOld);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > max) max = num;
                }
            }
        }
    }
    const nextNumStr = String(max + 1).padStart(3, '0');
    const versionStr = String(activeVersion).padStart(2, '0');
    return `${prefix}/${year}/${nextNumStr}/${versionStr}`;
}

function TenderDialog({ open, initial, allTenders, saving, onClose, onSave }: {
    open: boolean;
    initial: Tender | null;
    allTenders: Tender[];
    saving: boolean;
    onClose: () => void;
    onSave: (t: Omit<Tender, 'id'>) => void;
}) {
    const { data } = useMasterList();
    const [form, setForm] = useState<Omit<Tender, 'id'>>(
        initial ? { ...initial } : { ...EMPTY_TENDER, projectCode: generateNextProjectCode(allTenders) }
    );
    const set = (field: keyof typeof form) => (val: string) => setForm(p => ({ ...p, [field]: val }));
    const isEdit = !!initial;
    const canSave = form.projectTitle.trim() || form.projectCode.trim();

    const versions = form.quotationVersions || [];

    const handleAddVersion = () => {
        const nextNum = versions.length + 1;
        const newVerStr = String(nextNum).padStart(2, '0');
        const updated = [...versions, { version: newVerStr, description: '' }];
        setForm(p => ({ ...p, quotationVersions: updated }));
    };

    const handleUpdateVersion = (index: number, field: 'version' | 'description', val: string) => {
        const updated = versions.map((v, i) => {
            if (i === index) {
                return { ...v, [field]: val };
            }
            return v;
        });
        setForm(p => ({ ...p, quotationVersions: updated }));
    };

    const handleDeleteVersion = (index: number) => {
        const updated = versions.filter((_, i) => i !== index);
        setForm(p => ({ ...p, quotationVersions: updated }));
    };

    const handleSetActiveVersion = (verCode: string) => {
        const paddedVersion = String(verCode).padStart(2, '0');
        setForm(p => {
            let nextIq = p.internalQuotation;
            if (p.company) {
                const prefix = p.company.toUpperCase();
                const d = p.date ? new Date(p.date) : new Date();
                const year = isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
                const parts = p.internalQuotation.split('/');
                if (parts.length === 4 && parts[0] === prefix && parts[1] === String(year)) {
                    parts[3] = paddedVersion;
                    nextIq = parts.join('/');
                } else {
                    nextIq = generateNextInternalQuotation(p.company, allTenders, p.date, paddedVersion);
                }
            }
            return {
                ...p,
                quotationVersion: paddedVersion,
                internalQuotation: nextIq
            };
        });
    };

    const handleSelectMasterVersion = (val: string) => {
        if (!val) return;
        const match = val.match(/^(\d+|[a-zA-Z]+\d+)/);
        const verCode = match ? match[1] : val.substring(0, 3).trim();
        
        // Update active version
        handleSetActiveVersion(verCode);

        // Add to versions list if not already present
        const alreadyExists = versions.some(v => v.version === verCode);
        if (!alreadyExists) {
            setForm(p => ({
                ...p,
                quotationVersions: [...(p.quotationVersions || []), { version: verCode, description: val }]
            }));
        }
    };

    const [lastCompany, setLastCompany] = useState(form.company);

    useEffect(() => {
        if (form.company !== lastCompany) {
            if (form.company) {
                const nextIq = generateNextInternalQuotation(form.company, allTenders, form.date, form.quotationVersion || '01');
                setForm(p => ({ ...p, internalQuotation: nextIq }));
            }
            setLastCompany(form.company);
        }
    }, [form.company, lastCompany, allTenders, form.date, form.quotationVersion]);

    // Build unique history lists from existing tenders
    const hist = (field: keyof Tender) =>
        allTenders.map(t => t[field] as string).filter(Boolean);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>

            {/* ── Gradient Header ── */}
            <Box sx={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                px: 3, py: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-0.3px' }}>
                        {isEdit ? 'Edit Tender' : 'New Tender'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                        {isEdit ? 'Update the tender details below' : 'Fill in the details to create a new tender entry'}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small"
                    sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, py: 3 }}>
                <Grid container spacing={3}>

                    {/* ── Section 1: Reference ── */}
                    <Grid size={{ xs: 12 }}>
                        <SectionHeader icon={<CalendarMonthIcon sx={{ fontSize: 15 }} />} label="Reference & Date" />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <TextField fullWidth size="small" label="Date" type="date" value={form.date}
                                    onChange={e => set('date')(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <FreeSoloInput label="Project Code / No" value={form.projectCode}
                                    onChange={set('projectCode')} history={hist('projectCode')} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <FreeSoloInput label="Internal Quotation" value={form.internalQuotation}
                                    onChange={set('internalQuotation')} history={hist('internalQuotation')} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 3 }}>
                                <ChipAutocomplete label="Active Version" value={form.quotationVersion || ''}
                                    onChange={handleSelectMasterVersion}
                                    items={(data as any)?.quotationVersion || []} />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <FreeSoloInput label="Project Title" value={form.projectTitle}
                                    onChange={set('projectTitle')} history={hist('projectTitle')} />
                            </Grid>

                            {/* ── Quotation Versions Manager ── */}
                            <Grid size={{ xs: 12 }} sx={{ mt: 1.5 }}>
                                <Box sx={{ p: 2, border: '1px dashed #e2e8f0', borderRadius: 3, bgcolor: '#f8fafc' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                                                Quotation Revisions & Versions
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Add multiple quotation versions and click the ⭐ Star to set active version
                                            </Typography>
                                        </Box>
                                        <Button size="small" variant="outlined" onClick={handleAddVersion} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                                            + Add Version
                                        </Button>
                                    </Box>

                                    {versions.length === 0 ? (
                                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                                            No custom versions added yet. Click "+ Add Version" to start!
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            {versions.map((ver, idx) => {
                                                const isActive = (form.quotationVersion || '01') === ver.version;
                                                return (
                                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                                        <TextField size="small" label="Version" value={ver.version}
                                                            onChange={e => handleUpdateVersion(idx, 'version', e.target.value)}
                                                            sx={{ width: 90, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                                                        
                                                        <TextField size="small" fullWidth label="Quotation Details (Version notes/description)" value={ver.description}
                                                            placeholder="e.g. Version 1: Original Budget Proposal, or Version 2: Revised Pricing after feedback"
                                                            onChange={e => handleUpdateVersion(idx, 'description', e.target.value)}
                                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />

                                                        <Tooltip title={isActive ? "Active Version" : "Set as Active Version"}>
                                                            <IconButton size="small" onClick={() => handleSetActiveVersion(ver.version)}
                                                                sx={{ color: isActive ? '#f59e0b' : 'text.disabled' }}>
                                                                {isActive ? <StarIcon /> : <StarBorderIcon />}
                                                            </IconButton>
                                                        </Tooltip>

                                                        <IconButton size="small" color="error" onClick={() => handleDeleteVersion(idx)}>
                                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    {/* ── Section 2: Classification ── */}
                    <Grid size={{ xs: 12 }}>
                        <SectionHeader icon={<TagIcon sx={{ fontSize: 15 }} />} label="Classification" />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <ChipAutocomplete label="Status" value={form.status}
                                    onChange={set('status')} items={data.status} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <ChipAutocomplete label="Type" value={form.type}
                                    onChange={set('type')} items={data.type} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <ChipAutocomplete label="Company" value={form.company}
                                    onChange={set('company')} items={data.company} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    {/* ── Section 3: Client ── */}
                    <Grid size={{ xs: 12 }}>
                        <SectionHeader icon={<BusinessIcon sx={{ fontSize: 15 }} />} label="Client Information" />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 7 }}>
                                <ChipAutocomplete label="Customer" value={form.customer}
                                    onChange={set('customer')} items={data.customer} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 5 }}>
                                <ChipAutocomplete label="Agency Type" value={form.agencyTypes}
                                    onChange={set('agencyTypes')} items={data.agencyTypes} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    {/* ── Section 4: Supplier ── */}
                    <Grid size={{ xs: 12 }}>
                        <SectionHeader icon={<BusinessIcon sx={{ fontSize: 15 }} />} label="Supplier Information" />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <MultiChipAutocomplete label="Supplier" value={form.supplier}
                                    onChange={set('supplier')} items={data.supplier} />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12 }}><Divider /></Grid>

                    {/* ── Section 5: Contact ── */}
                    <Grid size={{ xs: 12 }}>
                        <SectionHeader icon={<PersonIcon sx={{ fontSize: 15 }} />} label="Point of Contact" />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FreeSoloInput label="Person In Charge" value={form.personInCharge}
                                    onChange={set('personInCharge')} history={hist('personInCharge')} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FreeSoloInput label="Contact No." value={form.contactNo}
                                    onChange={set('contactNo')} history={hist('contactNo')} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <FreeSoloInput label="Email" value={form.email}
                                    onChange={set('email')} history={hist('email')} type="email" />
                            </Grid>
                        </Grid>
                    </Grid>

                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
                <Button onClick={onClose} disabled={saving}
                    sx={{ textTransform: 'none', borderRadius: 2, color: 'text.secondary' }}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={() => canSave && onSave(form)}
                    disabled={!canSave || saving}
                    sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, boxShadow: 'none', px: 3,
                          background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                          '&:hover': { background: 'linear-gradient(135deg, #1a3354, #1d4ed8)', boxShadow: 'none' },
                          '&.Mui-disabled': { opacity: 0.45 } }}>
                    {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Tender')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Helper: map API snake_case → frontend camelCase ─────────────
function fromApi(raw: any): Tender {
    return {
        id:                String(raw.id),
        date:              raw.date              ?? '',
        projectCode:       raw.project_code      ?? '',
        status:            raw.status            ?? '',
        type:              raw.type              ?? '',
        company:           raw.company           ?? '',
        customer:          raw.customer          ?? '',
        supplier:          raw.supplier          ?? '',
        agencyTypes:       raw.agency_types      ?? '',
        projectTitle:      raw.project_title     ?? '',
        personInCharge:    raw.person_in_charge  ?? '',
        contactNo:         raw.contact_no        ?? '',
        email:             raw.email             ?? '',
        internalQuotation: raw.internal_quotation ?? '',
        salesPrice:        raw.sales_price       != null ? Number(raw.sales_price) : undefined,
        costPrice:         raw.cost_price        != null ? Number(raw.cost_price) : undefined,
        margin:            raw.margin            != null ? Number(raw.margin) : undefined,
        submissionDate:    raw.submission_date   ?? '',
        successRate:       raw.success_rate      ?? '',

        projectProgressLink: raw.project_progress_link ?? '',
        projectFolderLink: raw.project_folder_link ?? '',
        sourcingLink:      raw.sourcing_link      ?? '',
        quotationLink:     raw.quotation_link     ?? '',
        creator:           raw.creator           ? { id: raw.creator.id, name: raw.creator.name } : undefined,
        creatorName:       raw.creator?.name     || '—',
        verification_status: raw.verification_status,
        checked_at:        raw.checked_at,
        verified_at:       raw.verified_at,
        approved_at:       raw.approved_at,
        createdAt:         raw.created_at,
        checker_signature: raw.checker_signature,
        verifier_signature: raw.verifier_signature,
        approver_signature: raw.approver_signature,
        creator_signature: raw.creator_signature,
        checker:           raw.checker ? { id: raw.checker.id, name: raw.checker.name } : undefined,
        verifier:          raw.verifier ? { id: raw.verifier.id, name: raw.verifier.name } : undefined,
        approver:          raw.approver ? { id: raw.approver.id, name: raw.approver.name } : undefined,
        quotationVersion:   raw.quotation_version  ?? '01',
        quotationVersions:  raw.quotation_versions ?? [],
    };
}

function toApi(form: Omit<Tender, 'id'>) {
    return {
        date:               form.date              || null,
        project_code:       form.projectCode       || null,
        status:             form.status            || null,
        type:               form.type              || null,
        company:            form.company           || null,
        customer:           form.customer          || null,
        supplier:           form.supplier          || null,
        agency_types:       form.agencyTypes       || null,
        project_title:      form.projectTitle      || null,
        person_in_charge:   form.personInCharge    || null,
        contact_no:         form.contactNo         || null,
        email:              form.email             || null,
        internal_quotation: form.internalQuotation || null,
        sales_price:        form.salesPrice        != null ? form.salesPrice : null,
        cost_price:         form.costPrice         != null ? form.costPrice : null,
        margin:             form.margin            != null ? form.margin : null,
        submission_date:    form.submissionDate    || null,
        success_rate:       form.successRate       || null,

        project_progress_link: form.projectProgressLink || null,
        project_folder_link: form.projectFolderLink || null,
        sourcing_link:      form.sourcingLink      || null,
        quotation_link:     form.quotationLink     || null,
        quotation_version:   form.quotationVersion   || '01',
        quotation_versions:  form.quotationVersions  || [],
    };
}

// ── Main Page ─────────────────────────────────────────────────────
export default function TendersPage() {
    const navigate = useNavigate();
    const { data: masterData } = useMasterList();
    const [tenders, setTenders]     = useState<Tender[]>([]);
    const [loadingData, setLoading] = useState(true);
    const [search, setSearch]       = useState('');
    const [sortKey, setSortKey]     = useState('date');
    const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTender, setEditTender] = useState<Tender | null>(null);
    const [saving, setSaving]         = useState(false);
    const [snack, setSnack]           = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters]   = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        type: '',
        company: '',
        customer: '',
        agencyTypes: '',
        projectTitle: '',
    });
    const [reportOpen, setReportOpen] = useState(false);
    const [reportTender, setReportTender] = useState<Tender | null>(null);
    const [reportItems, setReportItems] = useState<any[]>([]);

    const setF = (field: keyof typeof filters) => (val: string) => setFilters(p => ({ ...p, [field]: val }));
    const clearFilters = () => setFilters({ startDate: '', endDate: '', type: '', company: '', customer: '', agencyTypes: '', projectTitle: '' });

    const { authState } = useAuth();
    const currentUser = authState?.user;
    const role = (currentUser as any)?.role;
    const userRoles = Array.isArray(role) ? role : [role];
    const isSuperAdmin = userRoles.includes('business_higher_admin');
    const isAdmin = userRoles.includes('business_higher_admin');
    const isSupervisor = userRoles.includes('business_admin');
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Load and poll tenders from API
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

        // Background polling every 4 seconds
        const interval = setInterval(() => {
            fetchTenders(false);
        }, 4000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, []);

    const handleSort = (id: string) => {
        if (sortKey === id) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(id); setSortDir('asc'); }
    };

    const handleSave = async (form: Omit<Tender, 'id'>) => {
        setSaving(true);
        try {
            if (editTender) {
                const updated = await api.put(`tenders/${editTender.id}`, { json: toApi(form) }).json<any>();
                setTenders(p => p.map(t => t.id === editTender.id ? fromApi(updated) : t));
            } else {
                const created = await api.post('tenders', { json: toApi(form) }).json<any>();
                setTenders(p => [...p, fromApi(created)]);
            }
            setDialogOpen(false);
            setEditTender(null);
            setSnack({ msg: editTender ? 'Tender updated successfully.' : 'Tender added successfully.', sev: 'success' });
        } catch (err) {
            console.error('Failed to save tender', err);
            setSnack({ msg: 'Failed to save tender. Please try again.', sev: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`tenders/${id}`).json();
            setTenders(p => p.filter(t => t.id !== id));
            setSnack({ msg: 'Tender deleted.', sev: 'success' });
        } catch (err) {
            console.error('Failed to delete tender', err);
            setSnack({ msg: 'Failed to delete tender.', sev: 'error' });
        }
    };

    const handleVerification = async (id: string, action: 'request-verification' | 'check' | 'verify' | 'approve', signature?: string) => {
        try {
            const up = await api.post(`tenders/${id}/${action}`, { json: { signature } }).json<any>();
            setTenders(p => p.map(t => t.id === id ? { ...t, ...fromApi(up) } : t));
            setSnack({ msg: 'Verification status updated.', sev: 'success' });
        } catch {
            setSnack({ msg: 'Failed to update verification status.', sev: 'error' });
        }
    };

    const openAdd  = () => { setEditTender(null); setDialogOpen(true); };
    const openEdit = (t: Tender) => { setEditTender(t); setDialogOpen(true); };

    const handleOpenReport = async (t: Tender) => {
        setReportTender(t);
        try {
            const items = await api.get(`tenders/${t.id}/costing-items`).json<any[]>();
            setReportItems(items);
            setReportOpen(true);
        } catch (err) {
            console.error("Failed to fetch costing items", err);
            setSnack({ msg: "Failed to load report data.", sev: 'error' });
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return tenders
            .filter(t => !q || Object.values(t).some(v => String(v).toLowerCase().includes(q)))
            .filter(t => {
                if (!statusFilter) return true;
                if (statusFilter === 'pending_check_special') return t.verification_status === 'pending_supervisor';
                if (statusFilter === 'pending_verify_special') return t.verification_status === 'pending_verify';
                if (statusFilter === 'pending_approve_special') return t.verification_status === 'pending_superadmin';
                return t.status && statusFilter && t.status.toLowerCase() === statusFilter.toLowerCase();
            })
            .filter(t => !filters.startDate || (t.date && t.date >= filters.startDate))
            .filter(t => !filters.endDate || (t.date && t.date <= filters.endDate))
            .filter(t => !filters.type || (t.type && filters.type && t.type.toLowerCase() === filters.type.toLowerCase()))
            .filter(t => !filters.company || (t.company && filters.company && t.company.toLowerCase() === filters.company.toLowerCase()))
            .filter(t => !filters.customer || (t.customer && filters.customer && t.customer.toLowerCase() === filters.customer.toLowerCase()))
            .filter(t => !filters.agencyTypes || (t.agencyTypes && filters.agencyTypes && t.agencyTypes.toLowerCase() === filters.agencyTypes.toLowerCase()))
            .filter(t => !filters.projectTitle || (t.projectTitle && t.projectTitle.toLowerCase().includes(filters.projectTitle.toLowerCase())))
            .sort((a, b) => {
                const av = (a as any)[sortKey] ?? '';
                const bv = (b as any)[sortKey] ?? '';
                return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
            });
    }, [tenders, search, statusFilter, filters, sortKey, sortDir]);

    // Build status tabs dynamically from master list with aggregated totals
    const statusTabs = useMemo(() => {
        const calcTotals = (list: Tender[]) => {
            let sales = 0;
            let cost = 0;
            list.forEach(t => {
                sales += (t.salesPrice || 0);
                cost += (t.costPrice || 0);
            });
            const gp = sales - cost;
            const margin = sales > 0 ? (gp / sales) * 100 : 0;
            return { sales, cost, gp, margin };
        };

        const pendingCheck = tenders.filter(t => t.verification_status === 'pending_supervisor');
        const pendingVerify = tenders.filter(t => t.verification_status === 'pending_verify');
        const pendingApprove = tenders.filter(t => t.verification_status === 'pending_superadmin');

        const role = (currentUser as any)?.role;
        const userRoles = Array.isArray(role) ? role : [role];
        const isProjectManager = userRoles.includes('business_admin');
        const isGeneralManager = userRoles.includes('business_higher_admin');
        const isDirector = userRoles.includes('superadmin') || userRoles.includes('admin');

        const specialTabs = [];
        
        if (pendingCheck.length > 0 && (isProjectManager || isGeneralManager)) {
            specialTabs.push({
                label: 'Pending My Checking',
                value: 'pending_check_special',
                count: pendingCheck.length,
                color: '#d97706',
                totals: calcTotals(pendingCheck),
                tenders: pendingCheck
            });
        }

        if (pendingVerify.length > 0 && isGeneralManager) {
            specialTabs.push({
                label: 'Pending My Verification',
                value: 'pending_verify_special',
                count: pendingVerify.length,
                color: '#9333ea',
                totals: calcTotals(pendingVerify),
                tenders: pendingVerify
            });
        }

        if (pendingApprove.length > 0 && isDirector) {
            specialTabs.push({
                label: 'Pending My Approval',
                value: 'pending_approve_special',
                count: pendingApprove.length,
                color: '#ef4444',
                totals: calcTotals(pendingApprove),
                tenders: pendingApprove
            });
        }

        const allTab = { 
            label: 'All', value: '', count: tenders.length, color: '#64748b',
            totals: calcTotals(tenders),
            tenders: tenders
        };
        const otherTabs = (masterData?.status || []).map(s => {
            const list = tenders.filter(t => t.status && s.label && t.status.toLowerCase() === s.label.toLowerCase());
            return {
                label: s.label,
                value: s.label,
                count: list.length,
                color: s.color || '#64748b',
                totals: calcTotals(list),
                tenders: list
            };
        });
        return [...specialTabs, allTab, ...otherTabs];
    }, [masterData?.status, tenders, currentUser]);

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
            background: isDark 
                ? 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 100%)' 
                : 'linear-gradient(135deg, #f0f4f8 0%, #e0e7ff 100%)',
        }}>

            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                           borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Tenders</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                            Manage and track all tender submissions
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField size="small" placeholder="Search tenders…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                            sx={{ width: 220 }} />
                        <Button 
                            variant={showFilters ? "contained" : "outlined"}
                            size="small"
                            startIcon={<FilterListIcon sx={{ fontSize: 16 }} />}
                            onClick={() => setShowFilters(!showFilters)}
                            sx={{ 
                                borderRadius: 1.5, textTransform: 'none', fontWeight: 700, px: 2, height: 40,
                                borderColor: showFilters ? 'primary.main' : 'divider',
                                color: showFilters ? '#fff' : 'text.secondary',
                                bgcolor: showFilters ? 'primary.main' : 'transparent',
                                '&:hover': { bgcolor: showFilters ? 'primary.dark' : alpha('#000', 0.02) }
                            }}
                        >
                            Filters {Object.values(filters).some(v => !!v) && "•"}
                        </Button>
                        <Tooltip title="Export to CSV">
                            <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                                <DownloadIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        {!isSuperAdmin && (
                            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none',
                                      background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                                      '&:hover': { background: 'linear-gradient(135deg, #1a3354, #1d4ed8)', boxShadow: 'none' } }}>
                                Add Tender
                            </Button>
                        )}
                    </Box>
                </Box>
            </motion.div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', borderBottom: `1px solid ${theme.palette.divider}`, background: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(8px)' }}
                    >
                        <Box sx={{ p: 2.5 }}>
                            <Grid container spacing={2} alignItems="flex-end">
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <TextField fullWidth size="small" label="From Date" type="date" value={filters.startDate} onChange={e => setF('startDate')(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <TextField fullWidth size="small" label="To Date" type="date" value={filters.endDate} onChange={e => setF('endDate')(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <ChipAutocomplete label="Type" value={filters.type} onChange={setF('type')} items={(masterData as any)?.type || []} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <ChipAutocomplete label="Company" value={filters.company} onChange={setF('company')} items={(masterData as any)?.company || []} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <ChipAutocomplete label="Customer" value={filters.customer} onChange={setF('customer')} items={(masterData as any)?.customer || []} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                    <ChipAutocomplete label="Agency Type" value={filters.agencyTypes} onChange={setF('agencyTypes')} items={(masterData as any)?.agencyTypes || []} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12, md: 10 }}>
                                    <TextField 
                                        fullWidth 
                                        size="small" 
                                        label="Project Title" 
                                        value={filters.projectTitle} 
                                        onChange={e => setF('projectTitle')(e.target.value)} 
                                        placeholder="Search by project title keywords..." 
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} 
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                    <Button fullWidth variant="text" size="small" startIcon={<FilterAltOffIcon />} onClick={clearFilters} color="error" sx={{ fontWeight: 700, textTransform: 'none', height: 40 }}>
                                        Clear All
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status Filter Bar */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(8px)' }}>
                <Box sx={{ display: 'flex', overflowX: 'auto', px: 3, gap: 3, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {statusTabs.map((tab) => {
                        const active = statusFilter === tab.value;
                        return (
                            <Tooltip key={tab.value} title={
                                <Box sx={{ p: 1, minWidth: 200 }}>
                                    <Typography variant="body2" fontWeight={800} sx={{ color: '#fff', display: 'block', mb: 1, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 0.5, fontSize: 14 }}>
                                        {tab.label} Costing Totals
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>Sales Price:</Typography>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', fontSize: 13 }}>RM {tab.totals.sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>Cost Price:</Typography>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', fontSize: 13 }}>RM {tab.totals.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>Gross Profit:</Typography>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: tab.totals.gp >= 0 ? '#10b981' : '#ef4444', fontSize: 13 }}>RM {tab.totals.gp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: 13 }}>Margin:</Typography>
                                        <Typography variant="body2" fontWeight={700} sx={{ color: '#60a5fa', fontSize: 13 }}>{tab.totals.margin.toFixed(2)}%</Typography>
                                    </Box>
                                    
                                    {tab.tenders && tab.tenders.length > 0 && (
                                        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <Typography variant="body2" fontWeight={800} sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontSize: 13 }}>
                                                Tender Breakdown
                                            </Typography>
                                            <Box sx={{ maxHeight: 150, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 } }}>
                                                {tab.tenders.map(t => (
                                                    <Box key={t.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="body2" sx={{ color: '#cbd5e1', mr: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120, fontSize: 12 }} title={t.projectCode || t.internalQuotation || `ID: ${t.id}`}>
                                                            {t.projectCode || t.internalQuotation || `ID: ${t.id}`}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>RM {Number(t.salesPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            } arrow placement="bottom">
                                <Box onClick={() => setStatusFilter(tab.value)}
                                    sx={{
                                        py: 1.5, position: 'relative', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        color: active ? 'text.primary' : 'text.secondary',
                                        transition: 'color 0.2s',
                                        whiteSpace: 'nowrap',
                                        '&:hover': { color: active ? 'text.primary' : 'text.primary' }
                                    }}>
                                    <Box sx={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        bgcolor: tab.color, opacity: active ? 1 : 0.5
                                    }} />
                                    <Typography variant="body2" sx={{ fontWeight: active ? 700 : 500 }}>
                                        {tab.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                        bgcolor: active ? `${tab.color}22` : 'action.selected',
                                        color: active ? tab.color : 'text.secondary',
                                        px: 1, py: 0.25, borderRadius: 2, fontWeight: 700, fontSize: 10
                                    }}>
                                        {tab.count}
                                    </Typography>
                                    {active && (
                                        <Box sx={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            height: 3, bgcolor: tab.color, borderRadius: '3px 3px 0 0'
                                        }} />
                                    )}
                                </Box>
                            </Tooltip>
                        );
                    })}
                </Box>
            </Box>

            {/* Table */}
            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, p: 3, bgcolor: 'transparent' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }} style={{ height: '100%' }}>
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
                            <table style={{
                                borderCollapse: 'separate',
                                borderSpacing: 0,
                                width: '100%',
                                tableLayout: 'fixed',
                                minWidth: COLUMNS.reduce((a, c) => a + c.width, 36 + 140),
                            }}>
                                <thead>
                                    <tr>
                                        {/* # */}
                                        <th style={{ minWidth: 36, width: 36,
                                            background: isDark ? '#1e293b' : '#f1f5f9',
                                            color: isDark ? '#94a3b8' : '#475569', 
                                            fontWeight: 700, fontSize: 11, height: 48,
                                            position: 'sticky', top: 0, left: 0, zIndex: 4,
                                            borderBottom: `2px solid ${theme.palette.divider}`,
                                            borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', 
                                            textAlign: 'center' }}>
                                            #
                                        </th>
                                        {COLUMNS.map(col => (
                                            <HeaderCell key={col.id} col={col} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                                        ))}
                                        {/* Actions */}
                                        <th style={{ minWidth: 160, width: 160,
                                            background: isDark ? '#1e293b' : '#f1f5f9',
                                            color: isDark ? '#94a3b8' : '#475569', 
                                            fontWeight: 700, fontSize: 11, height: 48,
                                            position: 'sticky', top: 0, right: 0, zIndex: 4, textAlign: 'center',
                                            borderBottom: `2px solid ${theme.palette.divider}`,
                                            borderLeft: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                                            ⋯
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={COLUMNS.length + 2} style={{ textAlign: 'center', padding: '80px 24px' }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ width: 64, height: 64, borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #1e3a5f22, #2563eb22)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                                        <AddIcon sx={{ fontSize: 28, color: '#2563eb', opacity: 0.6 }} />
                                                    </Box>
                                                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                                                        {search ? 'No matching tenders' : 'No tenders yet'}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 320, textAlign: 'center' }}>
                                                        {search ? 'Try a different search term.' : <>Click <strong>Add Tender</strong> to create your first entry.</>}
                                                    </Typography>
                                                    {!search && (
                                                        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openAdd}
                                                            sx={{ mt: 1, fontWeight: 700, textTransform: 'none', borderRadius: 1.5, borderColor: '#2563eb', color: '#2563eb' }}>
                                                            Add Tender
                                                        </Button>
                                                    )}
                                                </Box>
                                            </td>
                                        </tr>
                                    ) : filtered.map((tender, idx) => (
                                        <motion.tr
                                            key={tender.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.15, delay: idx * 0.03 }}
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
                                                textAlign: 'center', fontSize: 12, color: theme.palette.text.secondary, padding: '12px 16px', 
                                                borderBottom: `1px solid ${theme.palette.divider}`, position: 'sticky', left: 0, 
                                                background: idx % 2 === 0 ? theme.palette.background.paper : (isDark ? '#1e293b' : '#f8fafc'), zIndex: 2, 
                                                borderRight: `1px solid ${theme.palette.divider}`,
                                                transition: 'background-color 0.15s ease'
                                            }}>{idx + 1}</td>
                                            {COLUMNS.map(col => {
                                                const val = (tender as any)[col.id];
                                                const isMasterField = ['status', 'type', 'company', 'customer', 'supplier', 'agencyTypes'].includes(col.id);
                                                const categoryMap: any = { status: 'status', type: 'type', company: 'company', customer: 'customer', supplier: 'supplier', agencyTypes: 'agencyTypes' };
                                                const showTooltip = ['customer', 'supplier', 'company', 'agencyTypes'].includes(col.id);
                                                const isLongText = ['projectTitle', 'email', 'personInCharge'].includes(col.id);
                                                
                                                if (col.id === 'verification_status') {
                                                    const role = (currentUser as any)?.role;
                                                    const userRoles = Array.isArray(role) ? role : [role];
                                                    const isProjectManager = userRoles.includes('business_admin');
                                                    const isGeneralManager = userRoles.includes('business_higher_admin');
                                                    const isDirector = userRoles.includes('superadmin') || userRoles.includes('admin');
                                                    const vStatus = tender.verification_status;
                                                    
                                                    return (
                                                        <td key={col.id} style={{
                                                            padding: '12px 16px', fontSize: 11,
                                                            color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`,
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                            maxWidth: col.width,
                                                        }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                {vStatus === 'approved' && (
                                                                    <Chip size="small" label="Approved" color="error" variant="outlined" sx={{ height: 24, fontSize: 10, fontWeight: 700, borderRadius: 2, background: alpha('#ef4444', 0.05) }} />
                                                                )}
                                                                {vStatus === 'pending_supervisor' && (
                                                                    <Chip size="small" label="Pending Check" color="warning" variant="outlined" sx={{ height: 24, fontSize: 10, fontWeight: 700, borderRadius: 2, background: alpha('#f59e0b', 0.05) }} />
                                                                )}
                                                                {vStatus === 'pending_verify' && (
                                                                    <Chip size="small" label="Pending Verify" color="secondary" variant="outlined" sx={{ height: 24, fontSize: 10, fontWeight: 700, borderRadius: 2, background: alpha('#9061f9', 0.05) }} />
                                                                )}
                                                                {vStatus === 'pending_superadmin' && (
                                                                    <Chip size="small" label="Pending Approval" color="error" variant="outlined" sx={{ height: 24, fontSize: 10, fontWeight: 700, borderRadius: 2, background: alpha('#ef4444', 0.05) }} />
                                                                )}
                                                                {(!vStatus || vStatus === 'draft') && (
                                                                    (!isProjectManager && !isGeneralManager && !isDirector) ? (
                                                                        <Button size="small" variant="outlined" color="warning" onClick={() => handleVerification(tender.id, 'request-verification')} sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 10, py: 0.25, px: 1, minWidth: 'max-content', height: 24, whiteSpace: 'nowrap', fontWeight: 700 }}>
                                                                            Request Checking
                                                                        </Button>
                                                                    ) : (
                                                                        <Chip size="small" label="Draft" variant="outlined" sx={{ height: 24, fontSize: 10, fontWeight: 600, color: 'text.secondary', borderColor: 'divider', borderRadius: 2 }} />
                                                                    )
                                                                )}
                                                            </Box>
                                                        </td>
                                                    );
                                                }
                                                
                                                return (
                                                    <td key={col.id} style={{
                                                        padding: '12px 16px', fontSize: 11,
                                                        color: theme.palette.text.primary, borderBottom: `1px solid ${theme.palette.divider}`,
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        maxWidth: col.width,
                                                    }}>
                                                        {isMasterField ? (
                                                            <StatusChip value={val} items={(masterData as any)[categoryMap[col.id]]} showContactTooltip={showTooltip} />
                                                        ) : isLongText && val ? (
                                                            <Tooltip title={val} arrow placement="top">
                                                                <span style={{ 
                                                                    display: 'block', 
                                                                    overflow: 'hidden', 
                                                                    textOverflow: 'ellipsis', 
                                                                    whiteSpace: 'nowrap',
                                                                    cursor: 'default'
                                                                }}>
                                                                    {val}
                                                                </span>
                                                            </Tooltip>
                                                        ) : (
                                                            val || <span style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', fontStyle: 'italic', fontWeight: 300 }}>—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td style={{ 
                                                padding: '8px 12px', borderBottom: `1px solid ${theme.palette.divider}`, textAlign: 'center',
                                                position: 'sticky', right: 0, background: idx % 2 === 0 ? theme.palette.background.paper : (isDark ? '#1e293b' : '#f8fafc'), 
                                                zIndex: 2, borderLeft: `1px solid ${theme.palette.divider}`,
                                                transition: 'background-color 0.15s ease'
                                            }}>
                                                {(() => {
                                                    const role = (currentUser as any)?.role;
                                                    const userRoles = Array.isArray(role) ? role : [role];
                                                    const isProjectManager = userRoles.includes('business_admin');
                                                    const isGeneralManager = userRoles.includes('business_higher_admin');
                                                    const isDirector = userRoles.includes('superadmin') || userRoles.includes('admin');
                                                    
                                                    const isCreator = !tender.creator || 
                                                        (currentUser && tender.creator.id == (currentUser as any).id) || 
                                                        isDirector;
                                                    
                                                    const vStatus = tender.verification_status;
                                                    
                                                    return (
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, justifyContent: 'center', alignItems: 'center' }}>
                                                            {/* Row 1: Actions Icons */}
                                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                                                                <Tooltip title="View Costing Report">
                                                                     <IconButton size="small" onClick={() => handleOpenReport(tender)} sx={{
                                                                         color: '#6366f1',
                                                                         bgcolor: alpha('#6366f1', 0.08),
                                                                         '&:hover': { bgcolor: alpha('#6366f1', 0.15) },
                                                                         width: 28, height: 28, borderRadius: 1.5
                                                                     }}>
                                                                         <AssessmentIcon sx={{ fontSize: 16 }} />
                                                                     </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Tender Costing">
                                                                    <IconButton size="small" onClick={() => navigate(`/businesses/tenders/${tender.id}/costing`)} sx={{
                                                                        color: '#10b981',
                                                                        bgcolor: alpha('#10b981', 0.08),
                                                                        '&:hover': { bgcolor: alpha('#10b981', 0.15) },
                                                                        width: 28, height: 28, borderRadius: 1.5
                                                                    }}>
                                                                        <AttachMoneyIcon sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                {isCreator ? (
                                                                    <>
                                                                        <Tooltip title="Edit Tender">
                                                                            <IconButton size="small" onClick={() => openEdit(tender)} sx={{
                                                                                color: '#2563eb',
                                                                                bgcolor: alpha('#2563eb', 0.08),
                                                                                '&:hover': { bgcolor: alpha('#2563eb', 0.15) },
                                                                                width: 28, height: 28, borderRadius: 1.5
                                                                            }}>
                                                                                <EditIcon sx={{ fontSize: 15 }} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Delete Tender">
                                                                            <IconButton size="small" onClick={() => handleDelete(tender.id)} sx={{
                                                                                color: '#ef4444',
                                                                                bgcolor: alpha('#ef4444', 0.08),
                                                                                '&:hover': { bgcolor: alpha('#ef4444', 0.15) },
                                                                                width: 28, height: 28, borderRadius: 1.5
                                                                            }}>
                                                                                <DeleteIcon sx={{ fontSize: 15 }} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </>
                                                                ) : (
                                                                    <Tooltip title="View Only (Created by another user)">
                                                                        <span>
                                                                            <IconButton size="small" disabled sx={{ opacity: 0.3, width: 28, height: 28 }}>
                                                                                <EditIcon sx={{ fontSize: 15 }} />
                                                                            </IconButton>
                                                                        </span>
                                                                    </Tooltip>
                                                                )}
                                                            </Box>

                                                            {/* Row 2: Verification Status Chip / Request Verification Button */}
                                                            <Box sx={{ minHeight: 24, display: 'flex', alignItems: 'center' }}>
                                                                {vStatus === 'approved' && (
                                                                    <Chip size="small" label="Approved" color="error" variant="outlined" sx={{ height: 20, fontSize: 9, fontWeight: 700, borderRadius: 1.5, background: alpha('#ef4444', 0.05) }} />
                                                                )}
                                                                {vStatus === 'pending_supervisor' && (
                                                                    <Chip size="small" label="Pending Check" color="warning" variant="outlined" sx={{ height: 20, fontSize: 9, fontWeight: 700, borderRadius: 1.5, background: alpha('#f59e0b', 0.05) }} />
                                                                )}
                                                                {vStatus === 'pending_verify' && (
                                                                    <Chip size="small" label="Pending Verify" color="secondary" variant="outlined" sx={{ height: 20, fontSize: 9, fontWeight: 700, borderRadius: 1.5, background: alpha('#9061f9', 0.05) }} />
                                                                )}
                                                                {vStatus === 'pending_superadmin' && (
                                                                    <Chip size="small" label="Pending Approval" color="error" variant="outlined" sx={{ height: 20, fontSize: 9, fontWeight: 700, borderRadius: 1.5, background: alpha('#ef4444', 0.05) }} />
                                                                )}
                                                                {(!vStatus || vStatus === 'draft') && (
                                                                    (!isProjectManager && !isGeneralManager && !isDirector) ? (
                                                                        <Button size="small" variant="outlined" color="warning" onClick={() => handleVerification(tender.id, 'request-verification')} sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 9, py: 0, px: 1, minWidth: 'max-content', height: 20, whiteSpace: 'nowrap', fontWeight: 700 }}>
                                                                            Request Checking
                                                                        </Button>
                                                                    ) : (
                                                                        <Chip size="small" label="Draft" variant="outlined" sx={{ height: 20, fontSize: 9, fontWeight: 600, color: 'text.secondary', borderColor: 'divider', borderRadius: 1.5 }} />
                                                                    )
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    );
                                                })()}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Paper>
                </motion.div>
            </Box>

            {/* Footer */}
            <Box sx={{ px: 3, py: 1, borderTop: '1px solid', borderColor: 'divider',
                       display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper' }}>
                <Typography variant="caption" color="text.disabled">
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                    {tenders.length !== filtered.length ? ` (filtered from ${tenders.length})` : ''}
                </Typography>
            </Box>

            {/* Tender Dialog */}
            {dialogOpen && (
                <TenderDialog
                    open={dialogOpen}
                    initial={editTender}
                    allTenders={tenders}
                    saving={saving}
                    onClose={() => { if (!saving) { setDialogOpen(false); setEditTender(null); } }}
                    onSave={handleSave}
                />
            )}

            {/* Feedback toast */}
            <Snackbar
                open={!!snack}
                autoHideDuration={3500}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snack?.sev ?? 'success'} onClose={() => setSnack(null)}
                    sx={{ fontWeight: 600, borderRadius: 2 }}>
                    {snack?.msg}
                </Alert>
            </Snackbar>
            <TenderCostingReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                tender={reportTender}
                items={reportItems}
                currentUser={currentUser}
                onRequestChecking={(signature) => {
                    if (reportTender) {
                        handleVerification(reportTender.id, 'request-verification', signature);
                        setReportOpen(false);
                    }
                }}
                onCheck={(signature) => {
                    if (reportTender) {
                        handleVerification(reportTender.id, 'check', signature);
                        setReportOpen(false);
                    }
                }}
                onVerify={(signature) => {
                    if (reportTender) {
                        handleVerification(reportTender.id, 'verify', signature);
                        setReportOpen(false);
                    }
                }}
                onApprove={(signature) => {
                    if (reportTender) {
                        handleVerification(reportTender.id, 'approve', signature);
                        setReportOpen(false);
                    }
                }}
            />
        </Box>
    );
}
