import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import api from '@/utils/api';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha, useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'motion/react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import InputAdornment from '@mui/material/InputAdornment';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';

type License = {
    id: string; tenderId?: number; company: string; projectCode: string;
    doNo: string; quotationNo: string; clientName: string; productName: string;
    serialNo: string; startDate: string; expiryDate: string; validityPeriod: string;
    acknowledged: boolean; completed: boolean; daysRemaining: number | null;
    verification_status?: string; pdfPath?: string;
};
type Tender = {
    id: string; projectCode: string; company: string; customer: string;
    internalQuotation: string; projectTitle: string; doNo: string;
    deliveryOrders: { name: string; url: string; path: string }[];
};
type DoOption = { id: string; label: string };

function fromApi(r: any): License {
    const today = new Date(); today.setHours(0,0,0,0);
    const exp = r.expiry_date ? new Date(r.expiry_date) : null;
    exp?.setHours(0,0,0,0);
    const days = exp ? Math.ceil((exp.getTime() - today.getTime()) / 86400000) : null;
    return {
        id: String(r.id), tenderId: r.tender_id, company: r.company ?? '',
        projectCode: r.project_code ?? '', doNo: r.do_no ?? '',
        quotationNo: r.quotation_no ?? '', clientName: r.client_name ?? '',
        productName: r.product_name ?? '', serialNo: r.serial_no ?? '',
        startDate: r.start_date ?? '', expiryDate: r.expiry_date ?? '',
        validityPeriod: r.validity_period ?? '', acknowledged: !!r.acknowledged,
        completed: !!r.completed, daysRemaining: days,
        verification_status: r.verification_status,
        pdfPath: r.pdf_path ?? '',
    };
}

function toApi(f: any) {
    return {
        tender_id: f.tenderId || null, company: f.company || null,
        project_code: f.projectCode || null, do_no: f.doNo || null,
        quotation_no: f.quotationNo || null, client_name: f.clientName || null,
        product_name: f.productName || null, serial_no: f.serialNo || null,
        start_date: f.startDate || null, expiry_date: f.expiryDate || null,
        validity_period: f.validityPeriod || null,
    };
}

const COLS = [
    { id: 'company', label: 'Company', w: 90 },
    { id: 'projectCode', label: 'Project Code', w: 120 },
    { id: 'doNo', label: 'DO No', w: 100 },
    { id: 'quotationNo', label: 'Quotation No', w: 160 },
    { id: 'clientName', label: 'Client Name', w: 200 },
    { id: 'productName', label: 'Product Name', w: 220 },
    { id: 'serialNo', label: 'Serial No', w: 140 },
    { id: 'startDate', label: 'Start Date', w: 100 },
    { id: 'expiryDate', label: 'Expiry Date', w: 100 },
    { id: 'daysRemaining', label: 'Days Remaining', w: 120 },
    { id: 'validityPeriod', label: 'Validity Period', w: 120 },
    { id: 'pdfPath', label: 'License PDF', w: 110 },
];

const EMPTY: Omit<License,'id'|'daysRemaining'> = {
    tenderId: undefined, company:'', projectCode:'', doNo:'', quotationNo:'',
    clientName:'', productName:'', serialNo:'', startDate:'', expiryDate:'',
    validityPeriod:'', acknowledged: false, completed: false,
};

function getDaysColor(d: number | null) {
    if (d === null) return '#9ca3af';
    if (d <= 0) return '#dc2626';
    if (d <= 14) return '#f59e0b';
    if (d <= 30) return '#3b82f6';
    return '#10b981';
}


// ── helpers for item-level date math ──────────────────────────────
function calcExpiry(startDate: string, validityPeriod: string) {
    if (!startDate || !validityPeriod || Number(validityPeriod) <= 0) return '';
    const d = new Date(startDate);
    d.setDate(d.getDate() + Number(validityPeriod));
    return d.toISOString().split('T')[0];
}
function calcValidity(startDate: string, expiryDate: string) {
    if (!startDate || !expiryDate) return '';
    const s = new Date(startDate); s.setHours(0,0,0,0);
    const e = new Date(expiryDate); e.setHours(0,0,0,0);
    return String(Math.ceil((e.getTime() - s.getTime()) / 86400000));
}

type LicenseItem = { productName: string; serialNo: string; startDate: string; expiryDate: string; validityPeriod: string; pdfFile: File | null; };
const EMPTY_ITEM: LicenseItem = { productName: '', serialNo: '', startDate: '', expiryDate: '', validityPeriod: '', pdfFile: null };

function ItemRow({ item, idx, total, onChange, onRemove, itemPdfInputRefs }: {
    item: LicenseItem; idx: number; total: number;
    onChange: (idx: number, patch: Partial<LicenseItem>) => void;
    onRemove: (idx: number) => void;
    itemPdfInputRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const handleStartDate = (v: string) => {
        const expiryDate = calcExpiry(v, item.validityPeriod);
        onChange(idx, { startDate: v, ...(expiryDate ? { expiryDate } : {}) });
    };
    const handleValidity = (v: string) => {
        const start = item.startDate || new Date().toISOString().split('T')[0];
        const expiryDate = calcExpiry(start, v);
        onChange(idx, { validityPeriod: v, startDate: item.startDate || start, ...(expiryDate ? { expiryDate } : {}) });
    };
    const handleExpiry = (v: string) => {
        const validityPeriod = calcValidity(item.startDate, v);
        onChange(idx, { expiryDate: v, ...(validityPeriod ? { validityPeriod } : {}) });
    };

    return (
        <Box sx={{
            border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 2, mb: 1.5,
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(37,99,235,0.02)',
            position: 'relative'
        }}>
            {/* Row header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Chip label={`Item ${idx + 1}`} size="small"
                    sx={{ fontWeight: 800, fontSize: 10, height: 20, bgcolor: alpha('#2563eb', 0.1), color: '#2563eb' }} />
                {total > 1 && (
                    <Tooltip title="Remove this item">
                        <IconButton size="small" onClick={() => onRemove(idx)}
                            sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.08), '&:hover': { bgcolor: alpha('#ef4444', 0.18) }, width: 24, height: 24, borderRadius: 1 }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Product Name"
                        value={item.productName} onChange={e => onChange(idx, { productName: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Serial No"
                        value={item.serialNo} onChange={e => onChange(idx, { serialNo: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Start Date" type="date"
                        value={item.startDate} onChange={e => handleStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Expiry Date" type="date"
                        value={item.expiryDate} onChange={e => handleExpiry(e.target.value)}
                        InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Validity (Days)" type="number"
                        value={item.validityPeriod} onChange={e => handleValidity(e.target.value)}
                        placeholder="e.g. 365"
                        InputProps={{ endAdornment: <InputAdornment position="end">Days</InputAdornment> }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, border: '1px dashed', borderColor: item.pdfFile ? 'primary.main' : 'divider', borderRadius: 2, px: 1.5, py: 1,
                        bgcolor: item.pdfFile ? alpha('#2563eb', 0.03) : 'transparent' }}>
                        <PictureAsPdfIcon sx={{ color: item.pdfFile ? '#2563eb' : 'text.disabled', fontSize: 20 }} />
                        <Typography variant="caption" sx={{ flex: 1, color: item.pdfFile ? '#2563eb' : 'text.disabled', fontWeight: item.pdfFile ? 700 : 400 }}>
                            {item.pdfFile ? `📎 ${item.pdfFile.name}` : 'No PDF — optional'}
                        </Typography>
                        <input type="file" accept="application/pdf" style={{ display: 'none' }}
                            ref={el => { itemPdfInputRefs.current[idx] = el; }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) onChange(idx, { pdfFile: f }); e.target.value = ''; }} />
                        <Button size="small" variant="text" startIcon={<UploadFileIcon sx={{ fontSize: 14 }} />}
                            onClick={() => itemPdfInputRefs.current[idx]?.click()}
                            sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11, borderRadius: 1.5, py: 0.5, px: 1 }}>
                            {item.pdfFile ? 'Change' : 'Attach PDF'}
                        </Button>
                        {item.pdfFile && (
                            <Button size="small" color="error" onClick={() => onChange(idx, { pdfFile: null })}
                                sx={{ textTransform: 'none', fontSize: 10, p: 0, minWidth: 'auto' }}>Remove</Button>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}

function LicenseDialog({ open, initial, tenders, saving, onClose, onSave, onPdfUpload }: {
    open: boolean; initial: License|null; tenders: Tender[];
    saving: boolean; onClose: ()=>void; onSave: (header: any, items: LicenseItem[], pendingPdf?: File) => void;
    onPdfUpload: (id: string, file: File) => Promise<void>;
}) {
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const [pdfUploading, setPdfUploading] = useState(false);
    const [pendingPdf, setPendingPdf] = useState<File | null>(null);
    const [form, setForm] = useState<any>(initial ? {...initial} : {...EMPTY});
    const set = (k: string) => (v: any) => setForm((p:any) => ({...p,[k]:v}));
    const isEdit = !!initial;

    // Multi-item state (only for new licenses)
    const itemPdfInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const [items, setItems] = useState<LicenseItem[]>([{ ...EMPTY_ITEM }]);
    const updateItem = (idx: number, patch: Partial<LicenseItem>) =>
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
    const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
    const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

    const selectedTender = useMemo(() => tenders.find(t => t.id === String(form.tenderId)) ?? null, [form.tenderId, tenders]);

    const handleTenderChange = (_: any, t: Tender|null) => {
        if (!t) { setForm((p:any) => ({ ...p, tenderId: undefined })); return; }
        setForm((p:any) => ({
            ...p,
            tenderId: Number(t.id),
            company:     t.company           ? t.company           : p.company,
            projectCode: t.projectCode       ? t.projectCode       : p.projectCode,
            clientName:  t.customer          ? t.customer          : p.clientName,
            quotationNo: t.internalQuotation ? t.internalQuotation : p.quotationNo,
            productName: t.projectTitle      ? t.projectTitle      : p.productName,
            doNo:        t.doNo              ? t.doNo              : p.doNo,
        }));
    };

    // Edit-mode date handlers (single item)
    const handleStartDateChange = (v: string) => setForm((p:any) => {
        const next = { ...p, startDate: v };
        if (v && p.validityPeriod) next.expiryDate = calcExpiry(v, p.validityPeriod);
        return next;
    });
    const handleValidityChange = (v: string) => setForm((p:any) => {
        const start = p.startDate || new Date().toISOString().split('T')[0];
        const next = { ...p, validityPeriod: v, startDate: p.startDate || start };
        next.expiryDate = calcExpiry(start, v);
        return next;
    });
    const handleExpiryChange = (v: string) => setForm((p:any) => {
        const next = { ...p, expiryDate: v };
        if (v && p.startDate) next.validityPeriod = calcValidity(p.startDate, v);
        return next;
    });

    // Shared header fields (Tender + Company + Project Code + DO + Quotation + Client)
    const headerSection = (
        <Grid container spacing={2}>
            <Grid size={{xs:12}}>
                <Autocomplete size="small" disablePortal options={tenders} value={selectedTender} openOnFocus
                    slotProps={{ listbox: { sx: { maxHeight: 250 } } }}
                    getOptionLabel={o => [o.projectCode, o.projectTitle, o.company, o.customer].filter(Boolean).join(' — ')}
                    filterOptions={(opts, { inputValue }) => {
                        const q = inputValue.toLowerCase();
                        return opts.filter(o =>
                            (o.projectCode||'').toLowerCase().includes(q) || (o.company||'').toLowerCase().includes(q) ||
                            (o.customer||'').toLowerCase().includes(q) || (o.projectTitle||'').toLowerCase().includes(q) ||
                            (o.internalQuotation||'').toLowerCase().includes(q) || (o.doNo||'').toLowerCase().includes(q)
                        );
                    }}
                    onChange={handleTenderChange} isOptionEqualToValue={(a, b) => a.id === b.id}
                    renderInput={p => (
                        <TextField {...p} label="Link to Tender" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            helperText={selectedTender ? `Linked: ${selectedTender.projectCode} — ${selectedTender.company}` : 'Select a tender to auto-fill fields below'} />
                    )}
                    renderOption={(props, option) => {
                        const { key, ...rest } = props as any;
                        return (
                            <Box component="li" key={key} {...rest} sx={{ fontSize: 12, py: '6px !important', display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important' }}>
                                <span style={{ fontWeight: 700 }}>{option.projectCode} {option.projectTitle ? `- ${option.projectTitle}` : ''}</span>
                                <span style={{ color: '#6b7280', fontSize: 11 }}>{[option.company, option.customer, option.internalQuotation].filter(Boolean).join(' — ')}</span>
                            </Box>
                        );
                    }}
                />
            </Grid>
            <Grid size={{xs:12,sm:4}}><TextField fullWidth size="small" label="Company" value={form.company} onChange={e=>set('company')(e.target.value)} sx={{'& .MuiOutlinedInput-root':{borderRadius:2}}}/></Grid>
            <Grid size={{xs:12,sm:4}}><TextField fullWidth size="small" label="Project Code" value={form.projectCode} onChange={e=>set('projectCode')(e.target.value)} sx={{'& .MuiOutlinedInput-root':{borderRadius:2}}}/></Grid>
            <Grid size={{xs:12,sm:4}}>
                <Autocomplete size="small" freeSolo
                    options={selectedTender ? selectedTender.deliveryOrders.map(d => d.name) : tenders.flatMap(t => t.deliveryOrders.map(d => `[${t.projectCode}] ${d.name}`))}
                    value={form.doNo} onInputChange={(_,v) => set('doNo')(v)}
                    renderInput={p => (
                        <TextField {...p} label="DO No"
                            helperText={selectedTender ? selectedTender.deliveryOrders.length > 0 ? `${selectedTender.deliveryOrders.length} DO file(s)` : 'No DOs for this project' : 'Select tender to filter DOs'}
                            sx={{'& .MuiOutlinedInput-root':{borderRadius:2}}}/>
                    )}
                />
            </Grid>
            <Grid size={{xs:12,sm:6}}><TextField fullWidth size="small" label="Quotation No" value={form.quotationNo} onChange={e=>set('quotationNo')(e.target.value)} sx={{'& .MuiOutlinedInput-root':{borderRadius:2}}}/></Grid>
            <Grid size={{xs:12,sm:6}}><TextField fullWidth size="small" label="Client Name" value={form.clientName} onChange={e=>set('clientName')(e.target.value)} sx={{'& .MuiOutlinedInput-root':{borderRadius:2}}}/></Grid>
        </Grid>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{sx:{borderRadius:4,overflow:'hidden'}}}>
            <Box sx={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)',px:3,py:2.5,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{color:'#fff'}}>{isEdit?'Edit License':'New License'}</Typography>
                    <Typography variant="caption" sx={{color:'rgba(255,255,255,0.65)'}}>
                        {isEdit ? 'Update license details' : `Add license entries — ${items.length} serial number${items.length>1?'s':''}`}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{color:'rgba(255,255,255,0.7)','&:hover':{color:'#fff'}}}><CloseIcon fontSize="small"/></IconButton>
            </Box>
            <DialogContent sx={{px:3,py:3}}>
                {/* Shared header */}
                {headerSection}

                {isEdit ? (
                    /* Edit mode: single item fields inline */
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:1.5 }}>
                            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform:'uppercase', letterSpacing:'0.5px', fontSize:10 }}>License Details</Typography>
                            <Box sx={{ flex:1, height:'1px', bgcolor:'divider' }}/>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid size={{xs:12}}><TextField fullWidth size="small" label="Product Name" value={form.productName} onChange={e=>set('productName')(e.target.value)} sx={{'& .MuiOutlinedInput-root':{borderRadius:2}}}/></Grid>
                            <Grid size={{xs:12,sm:4}}><TextField fullWidth size="small" label="Serial No" value={form.serialNo} onChange={e=>set('serialNo')(e.target.value)} sx={{'& .MuiOutlinedInput-root':{borderRadius:2}}}/></Grid>
                            <Grid size={{xs:12,sm:4}}><TextField fullWidth size="small" label="Start Date" type="date" value={form.startDate} onChange={e=>handleStartDateChange(e.target.value)} InputLabelProps={{shrink:true}} sx={{'& .MuiOutlinedInput-root':{borderRadius:2}}}/></Grid>
                            <Grid size={{xs:12,sm:4}}><TextField fullWidth size="small" label="Expiry Date" type="date" value={form.expiryDate} onChange={e=>handleExpiryChange(e.target.value)} InputLabelProps={{shrink:true}} sx={{'& .MuiOutlinedInput-root':{borderRadius:2}}}/></Grid>
                            <Grid size={{xs:12,sm:6}}><TextField fullWidth size="small" label="Validity Period (Days)" type="number" value={form.validityPeriod} onChange={e=>handleValidityChange(e.target.value)} placeholder="e.g. 365" InputProps={{endAdornment:<InputAdornment position="end">Days</InputAdornment>}} sx={{'& .MuiOutlinedInput-root':{borderRadius:2}}}/></Grid>
                            <Grid size={{xs:12}}>
                                <Box sx={{ border:'1px dashed', borderColor: pendingPdf||form.pdfPath ? 'primary.main' : 'divider', borderRadius:2, p:2, display:'flex', alignItems:'center', gap:2, bgcolor: pendingPdf ? alpha('#2563eb',0.03) : 'transparent', transition:'all 0.2s' }}>
                                    <PictureAsPdfIcon sx={{ color: pendingPdf?'#2563eb': form.pdfPath?'#ef4444':'text.disabled', fontSize:28 }}/>
                                    <Box sx={{ flex:1 }}>
                                        <Typography variant="body2" fontWeight={700}>License PDF Document</Typography>
                                        {pendingPdf
                                            ? <Typography variant="caption" sx={{ color:'#2563eb', fontWeight:600 }}>📎 {pendingPdf.name} — will upload on save</Typography>
                                            : form.pdfPath
                                                ? <Typography variant="caption" color="text.secondary">PDF attached — <a href={`/api/storage/${form.pdfPath}`} target="_blank" rel="noreferrer" style={{color:'#2563eb'}}>View</a></Typography>
                                                : <Typography variant="caption" color="text.disabled">No PDF attached yet — optional</Typography>
                                        }
                                    </Box>
                                    {pdfUploading && <CircularProgress size={20}/>}
                                    <input ref={pdfInputRef} type="file" accept="application/pdf" style={{display:'none'}}
                                        onChange={e => {
                                            const file = e.target.files?.[0]; if (!file) return;
                                            setPdfUploading(true);
                                            onPdfUpload(initial!.id, file).finally(() => { setPdfUploading(false); e.target.value = ''; });
                                        }}
                                    />
                                    <Box sx={{ display:'flex', flexDirection:'column', gap:0.5, alignItems:'flex-end' }}>
                                        <Button size="small" variant="outlined" startIcon={<UploadFileIcon/>}
                                            onClick={() => pdfInputRef.current?.click()}
                                            sx={{textTransform:'none', fontWeight:700, borderRadius:2}}>
                                            {form.pdfPath ? 'Replace PDF' : 'Attach PDF'}
                                        </Button>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                ) : (
                    /* New mode: multi-item rows */
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1.5 }}>
                            <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform:'uppercase', letterSpacing:'0.5px', fontSize:10 }}>
                                    Serial Numbers / Items
                                </Typography>
                                <Box sx={{ height:'1px', bgcolor:'divider', width:80 }}/>
                            </Box>
                            <Button size="small" startIcon={<AddIcon/>} onClick={addItem}
                                sx={{ textTransform:'none', fontWeight:700, fontSize:11, borderRadius:2,
                                    bgcolor: alpha('#10b981', 0.1), color:'#059669', '&:hover':{bgcolor:alpha('#10b981',0.2)} }}>
                                Add Another Serial No
                            </Button>
                        </Box>
                        {items.map((item, idx) => (
                            <ItemRow key={idx} item={item} idx={idx} total={items.length}
                                onChange={updateItem} onRemove={removeItem} itemPdfInputRefs={itemPdfInputRefs} />
                        ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{px:3,pb:2.5,pt:1,borderTop:'1px solid',borderColor:'divider',gap:1}}>
                <Button onClick={onClose} disabled={saving} sx={{textTransform:'none',borderRadius:2,color:'text.secondary'}}>Cancel</Button>
                <Button variant="contained"
                    onClick={() => isEdit ? onSave(form, [], pendingPdf ?? undefined) : onSave(form, items)}
                    disabled={saving}
                    sx={{fontWeight:700,textTransform:'none',borderRadius:2,boxShadow:'none',px:3,
                        background:'linear-gradient(135deg,#1e3a5f,#2563eb)',
                        '&:hover':{background:'linear-gradient(135deg,#1a3354,#1d4ed8)',boxShadow:'none'}}}>
                    {saving ? 'Saving…' : isEdit ? 'Save Changes' : items.length > 1 ? `Add ${items.length} Licenses` : 'Add License'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Warning notification dialog
function WarningDialog({ licenses, open, onClose, onAcknowledge }: {
    licenses: License[]; open: boolean; onClose: ()=>void; onAcknowledge: (id:string)=>void;
}) {
    if (!open || licenses.length === 0) return null;
    return (
        <Dialog open={open} maxWidth="sm" fullWidth PaperProps={{sx:{borderRadius:4,overflow:'hidden'}}}>
            <Box sx={{background:'linear-gradient(135deg,#dc2626,#f59e0b)',px:3,py:2.5,display:'flex',alignItems:'center',gap:1.5}}>
                <WarningAmberIcon sx={{color:'#fff',fontSize:28}}/>
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{color:'#fff'}}>License Expiry Warning!</Typography>
                    <Typography variant="caption" sx={{color:'rgba(255,255,255,0.8)'}}>The following licenses are expiring within 14 days</Typography>
                </Box>
            </Box>
            <DialogContent sx={{px:3,py:2}}>
                {licenses.map(l=>(
                    <Box key={l.id} sx={{display:'flex',alignItems:'center',justifyContent:'space-between',py:1.5,borderBottom:'1px solid',borderColor:'divider','&:last-child':{borderBottom:'none'}}}>
                        <Box sx={{flex:1,mr:2}}>
                            <Typography variant="body2" fontWeight={700}>{l.productName||l.projectCode||'Untitled'}</Typography>
                            <Typography variant="caption" color="text.secondary">{l.clientName} • {l.serialNo}</Typography>
                        </Box>
                        <Chip label={l.daysRemaining<=0?'EXPIRED':`${l.daysRemaining} days`} size="small"
                            sx={{fontWeight:800,bgcolor:alpha(getDaysColor(l.daysRemaining),0.12),color:getDaysColor(l.daysRemaining),mr:1}}/>
                        <Button size="small" variant="outlined" onClick={()=>onAcknowledge(l.id)}
                            sx={{textTransform:'none',fontWeight:700,fontSize:11,borderRadius:2}}>
                            Acknowledge
                        </Button>
                    </Box>
                ))}
            </DialogContent>
            <DialogActions sx={{px:3,pb:2}}>
                <Button onClick={onClose} sx={{textTransform:'none',fontWeight:700,borderRadius:2}}>Dismiss All</Button>
            </DialogActions>
        </Dialog>
    );
}

export default function LicenseTrackingPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { authState } = useAuth();
    const currentUser = authState?.user;
    const role = (currentUser as any)?.role;
    const userRoles = Array.isArray(role) ? role : [role];
    const isSuperAdmin = userRoles.includes('superadmin');
    const [licenses, setLicenses] = useState<License[]>([]);
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [doOptions, setDoOptions] = useState<DoOption[]>([]);
    const [loading, setLoading] = useState(true);
    const pdfInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [pdfUploadingRow, setPdfUploadingRow] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
    const [filters, setFilters] = useState({ clientName: '', projectCode: '', quotationNo: '', productName: '' });
    const [sortKey, setSortKey] = useState('daysRemaining');
    const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<License|null>(null);
    const [saving, setSaving] = useState(false);
    const [snack, setSnack] = useState<{msg:string;sev:'success'|'error'}|null>(null);
    const [warningOpen, setWarningOpen] = useState(false);
    const warningTimer = useRef<any>(null);
    const [now, setNow] = useState(Date.now());

    // Refresh "days remaining" every minute
    useEffect(() => {
        const iv = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(iv);
    }, []);

    // Recompute days remaining when `now` changes
    const liveLicenses = useMemo(() => {
        const today = new Date(); today.setHours(0,0,0,0);
        return licenses.map(l => {
            if (!l.expiryDate) return { ...l, daysRemaining: null as number | null };
            const exp = new Date(l.expiryDate); exp.setHours(0,0,0,0);
            return { ...l, daysRemaining: Math.ceil((exp.getTime() - today.getTime()) / 86400000) };
        });
    }, [licenses, now]);

    // Licenses needing warning (<=14 days, not acknowledged, not completed, has expiry date)
    const warningLicenses = useMemo(() =>
        liveLicenses.filter(l => l.daysRemaining !== null && l.daysRemaining <= 14 && !l.acknowledged && !l.completed), [liveLicenses]);

    // Auto-show warning on load + re-pop every 10 min if unacknowledged
    useEffect(() => {
        if (warningLicenses.length > 0) {
            setWarningOpen(true);
            if (warningTimer.current) clearInterval(warningTimer.current);
            warningTimer.current = setInterval(() => {
                setWarningOpen(true);
            }, 10 * 60 * 1000);
        } else {
            setWarningOpen(false);
            if (warningTimer.current) clearInterval(warningTimer.current);
        }
        return () => { if (warningTimer.current) clearInterval(warningTimer.current); };
    }, [warningLicenses]);

    useEffect(() => {
        Promise.all([
            api.get('licenses').json<any[]>(),
            api.get('tenders').json<any[]>(),
        ]).then(([lic, ten]) => {
            setLicenses(lic.map(fromApi));
            setTenders(ten.map((r:any) => ({
                id: String(r.id),
                projectCode: r.project_code ?? '',
                company: r.company ?? '',
                customer: r.customer ?? '',
                internalQuotation: r.internal_quotation ?? '',
                projectTitle: r.project_title ?? '',
                doNo: r.do_no ?? '',
                deliveryOrders: Array.isArray(r.delivery_order) ? r.delivery_order : [],
            })));
            // doOptions derived from tenders — see LicenseDialog (passed per selected tender)
            setDoOptions([]);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleSort = (id: string) => {
        if (sortKey === id) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(id); setSortDir('asc'); }
    };

    const handleSave = async (form: any, items: LicenseItem[] = [], pendingPdf?: File) => {
        setSaving(true);
        try {
            if (editItem) {
                // Edit mode: single license update
                const up = await api.put(`licenses/${editItem.id}`, { json: toApi(form) }).json<any>();
                const saved = fromApi(up);
                setLicenses(p => p.map(l => l.id === editItem.id ? saved : l));
                setDialogOpen(false); setEditItem(null);
                setSnack({ msg: 'License updated.', sev: 'success' });
                if (saved.daysRemaining !== null && saved.daysRemaining <= 14 && !saved.acknowledged) {
                    setTimeout(() => setWarningOpen(true), 500);
                }
            } else {
                // Create mode: one license per item (all share header fields)
                const created: License[] = [];
                for (const item of items) {
                    const payload = {
                        ...toApi(form),
                        product_name:    item.productName    || null,
                        serial_no:       item.serialNo       || null,
                        start_date:      item.startDate      || null,
                        expiry_date:     item.expiryDate     || null,
                        validity_period: item.validityPeriod || null,
                    };
                    const cr = await api.post('licenses', { json: payload }).json<any>();
                    let saved = fromApi(cr);
                    // Upload per-item PDF if attached
                    if (item.pdfFile) {
                        const fd = new FormData();
                        fd.append('pdf', item.pdfFile);
                        const res = await api.post(`licenses/${saved.id}/upload-pdf`, { body: fd }).json<any>();
                        saved = { ...saved, pdfPath: res.pdf_path };
                    }
                    created.push(saved);
                }
                setLicenses(p => [...p, ...created]);
                setDialogOpen(false); setEditItem(null);
                setSnack({ msg: `${created.length} license${created.length > 1 ? 's' : ''} added.`, sev: 'success' });
                const soonExpiring = created.find(l => l.daysRemaining !== null && l.daysRemaining <= 14 && !l.acknowledged);
                if (soonExpiring) setTimeout(() => setWarningOpen(true), 500);
            }
        } catch { setSnack({ msg: 'Failed to save.', sev: 'error' }); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`licenses/${id}`).json();
            setLicenses(p => p.filter(l => l.id !== id));
            setSnack({ msg: 'License deleted.', sev: 'success' });
        } catch { setSnack({ msg: 'Failed to delete.', sev: 'error' }); }
    };

    const handlePdfUpload = async (id: string, file: File) => {
        try {
            const fd = new FormData();
            fd.append('pdf', file);
            const res = await api.post(`licenses/${id}/upload-pdf`, { body: fd }).json<any>();
            setLicenses(p => p.map(l => l.id === id ? { ...l, pdfPath: res.pdf_path } : l));
            // also update editItem so dialog reflects the new pdfPath
            setEditItem(prev => prev && prev.id === id ? { ...prev, pdfPath: res.pdf_path } : prev);
            setSnack({ msg: 'PDF uploaded.', sev: 'success' });
        } catch { setSnack({ msg: 'PDF upload failed.', sev: 'error' }); }
    };

    const handleComplete = async (id: string) => {
        try {
            const up = await api.post(`licenses/${id}/complete`).json<any>();
            setLicenses(p => p.map(l => l.id === id ? fromApi(up) : l));
            setSnack({ msg: 'License marked as completed.', sev: 'success' });
        } catch { setSnack({ msg: 'Failed to complete.', sev: 'error' }); }
    };

    const handleAcknowledge = async (id: string) => {
        try {
            const up = await api.post(`licenses/${id}/acknowledge`).json<any>();
            setLicenses(p => p.map(l => l.id === id ? fromApi(up) : l));
        } catch { console.error('Failed to acknowledge'); }
    };

    const handleVerification = async (id: string, action: 'request-verification' | 'verify' | 'approve') => {
        try {
            const up = await api.post(`licenses/${id}/${action}`).json<any>();
            setLicenses(p => p.map(l => l.id === id ? fromApi(up) : l));
            setSnack({ msg: 'Verification status updated.', sev: 'success' });
        } catch { console.error('Failed to update verification status'); }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return liveLicenses
            .filter(l => !q || Object.values(l).some(v => String(v).toLowerCase().includes(q)))
            .filter(l => !filters.clientName || (l.clientName || '').toLowerCase().includes(filters.clientName.toLowerCase()))
            .filter(l => !filters.projectCode || (l.projectCode || '').toLowerCase().includes(filters.projectCode.toLowerCase()))
            .filter(l => !filters.quotationNo || (l.quotationNo || '').toLowerCase().includes(filters.quotationNo.toLowerCase()))
            .filter(l => !filters.productName || (l.productName || '').toLowerCase().includes(filters.productName.toLowerCase()))
            .sort((a, b) => {
                const av = (a as any)[sortKey] ?? '';
                const bv = (b as any)[sortKey] ?? '';
                if (typeof av === 'number' && typeof bv === 'number')
                    return sortDir === 'asc' ? av - bv : bv - av;
                return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
            });
    }, [liveLicenses, search, filters, sortKey, sortDir]);

    if (loading) return <Box sx={{display:'flex',justifyContent:'center',py:8}}><CircularProgress/></Box>;

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
            background: isDark 
                ? 'linear-gradient(135deg, #0b0f19 0%, #1e1b4b 100%)' 
                : 'linear-gradient(135deg, #f0f4f8 0%, #e0e7ff 100%)',
        }}>
            {/* Header */}
            <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:0.35}}>
                <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                           borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap', gap: 2,
                           bgcolor: isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                           backdropFilter: 'blur(8px)' }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">License Tracking</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{mt:0.25,display:'block'}}>
                            Monitor license expiry dates • {warningLicenses.length > 0 && <span style={{color:'#f59e0b',fontWeight:800}}>{warningLicenses.length} expiring soon</span>}
                        </Typography>
                    </Box>
                    <Box sx={{display:'flex',gap:1.5,alignItems:'center'}}>
                        <TextField size="small" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
                            InputProps={{startAdornment:<InputAdornment position="start"><SearchIcon fontSize="small" sx={{color:'text.disabled'}}/></InputAdornment>}}
                            sx={{width:200}}/>
                        <Button size="small" variant="outlined" startIcon={<FilterListIcon />}
                            onClick={e => setFilterAnchor(e.currentTarget)}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, borderColor: Object.values(filters).some(v => !!v) ? 'primary.main' : 'divider', color: Object.values(filters).some(v => !!v) ? 'primary.main' : 'text.primary' }}>
                            Filters {Object.values(filters).some(v => !!v) && "•"}
                        </Button>
                        {warningLicenses.length > 0 && (
                            <Button size="small" variant="outlined" color="warning" startIcon={<WarningAmberIcon/>}
                                onClick={()=>setWarningOpen(true)}
                                sx={{textTransform:'none',fontWeight:700,borderRadius:1.5}}>
                                {warningLicenses.length} Warning{warningLicenses.length>1?'s':''}
                            </Button>
                        )}
                        {!isSuperAdmin && (
                            <Button variant="contained" size="small" startIcon={<AddIcon/>}
                                onClick={()=>{setEditItem(null);setDialogOpen(true);}}
                                sx={{fontWeight:700,textTransform:'none',borderRadius:1.5,boxShadow:'none',
                                    background:'linear-gradient(135deg,#1e3a5f,#2563eb)',
                                    '&:hover':{background:'linear-gradient(135deg,#1a3354,#1d4ed8)',boxShadow:'none'}}}>
                                Add License
                            </Button>
                        )}
                    </Box>
                </Box>
            </motion.div>

            {/* Table */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3, bgcolor: 'transparent' }}>
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
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 1400 }}>
                                <thead>
                                    <tr>
                                        <th style={{ 
                                            width: 50, 
                                            background: isDark ? '#1e293b' : '#f1f5f9', 
                                            color: isDark ? '#94a3b8' : '#475569', 
                                            fontWeight: 700, fontSize: 11, padding: '12px 16px', height: 48, 
                                            position: 'sticky', top: 0, zIndex: 3, 
                                            borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                            borderBottom: `2px solid ${theme.palette.divider}`,
                                            textAlign: 'center'
                                        }}>#</th>
                                        {COLS.map(c => (
                                            <th key={c.id} onClick={() => handleSort(c.id)} style={{
                                                minWidth: c.w, width: c.w,
                                                background: isDark ? '#1e293b' : '#f1f5f9',
                                                color: isDark ? '#94a3b8' : '#475569',
                                                fontWeight: 700, fontSize: 11,
                                                letterSpacing: '0.05em', textTransform: 'uppercase',
                                                padding: '12px 16px', height: 48, whiteSpace: 'nowrap',
                                                position: 'sticky', top: 0, zIndex: 3,
                                                borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                                borderBottom: `2px solid ${theme.palette.divider}`,
                                                cursor: 'pointer', userSelect: 'none',
                                                textAlign: 'left',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span>{c.label}</span>
                                                    <SwapVertIcon fontSize="inherit" sx={{ fontSize: 14, opacity: sortKey === c.id ? 1 : 0.35, color: sortKey === c.id ? '#2563eb' : (isDark ? '#94a3b8' : '#475569') }} />
                                                </div>
                                            </th>
                                        ))}
                                        <th style={{ 
                                            width: 180, 
                                            background: isDark ? '#1e293b' : '#f1f5f9', 
                                            color: isDark ? '#94a3b8' : '#475569', 
                                            fontWeight: 700, fontSize: 11, padding: '12px 16px', height: 48, 
                                            position: 'sticky', top: 0, zIndex: 3,
                                            borderBottom: `2px solid ${theme.palette.divider}`,
                                            borderLeft: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                            textAlign: 'center'
                                        }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={COLS.length + 2} style={{ textAlign: 'center', padding: '80px 24px', color: theme.palette.text.disabled }}>
                                                No licenses found
                                            </td>
                                        </tr>
                                    ) : filtered.map((row, idx) => {
                                        const isWarning = row.daysRemaining !== null && row.daysRemaining <= 14;
                                        const isExpired = row.daysRemaining !== null && row.daysRemaining <= 0;
                                        return (
                                            <tr key={row.id} style={{
                                                borderBottom: `1px solid ${theme.palette.divider}`,
                                                background: isExpired ? alpha('#dc2626', 0.04) : isWarning ? alpha('#f59e0b', 0.03) : 'transparent',
                                                transition: 'background-color 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isExpired && !isWarning) {
                                                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(37,99,235,0.03)' : 'rgba(37,99,235,0.015)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isExpired && !isWarning) {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                }
                                            }}
                                            >
                                                <td style={{ 
                                                    padding: '12px 16px', fontSize: 11, fontWeight: 700, 
                                                    color: theme.palette.text.secondary, textAlign: 'center',
                                                    borderRight: `1px solid ${theme.palette.divider}`
                                                }}>{idx + 1}</td>
                                                {COLS.map(c => {
                                                    const val = (row as any)[c.id];
                                                    if (c.id === 'daysRemaining') {
                                                        const color = getDaysColor(val);
                                                        const label = val === null ? 'No Expiry Set' : val <= 0 ? 'EXPIRED' : `${val} Days`;
                                                        return (
                                                            <td key={c.id} style={{ padding: '12px 16px' }}>
                                                                <Chip label={label} size="small"
                                                                    sx={{
                                                                        fontWeight: 800, fontSize: 10, height: 22, bgcolor: alpha(color, 0.12), color, borderRadius: 1.5,
                                                                        animation: val !== null && val <= 14 ? 'pulse 2s infinite' : 'none',
                                                                        '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } }
                                                                    }} />
                                                            </td>
                                                        );
                                                    }
                                                    if (c.id === 'validityPeriod') {
                                                        return (
                                                            <td key={c.id} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: theme.palette.text.primary }}>
                                                                {val ? `${val} Days` : <span style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', fontStyle: 'italic', fontWeight: 300 }}>—</span>}
                                                            </td>
                                                        );
                                                    }
                                                    if (c.id === 'pdfPath') {
                                                        return (
                                                            <td key={c.id} style={{ padding: '8px 16px' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    {val ? (
                                                                        <Tooltip title="View License PDF">
                                                                            <Chip
                                                                                icon={<PictureAsPdfIcon sx={{ fontSize: 12 }}/>}
                                                                                label="View PDF"
                                                                                size="small"
                                                                                component="a"
                                                                                href={`/api/storage/${val}`}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                clickable
                                                                                sx={{ fontSize: 10, height: 22, fontWeight: 700, bgcolor: alpha('#ef4444', 0.1), color: '#b91c1c', border: '1px solid', borderColor: alpha('#ef4444', 0.25), '& .MuiChip-icon': { color: '#b91c1c' } }}
                                                                            />
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', fontStyle: 'italic' }}>No PDF</Typography>
                                                                    )}
                                                                    {!isSuperAdmin && (
                                                                        <>
                                                                            <input
                                                                                type="file" accept="application/pdf"
                                                                                style={{ display: 'none' }}
                                                                                ref={el => { pdfInputRefs.current[row.id] = el; }}
                                                                                onChange={async e => {
                                                                                    const file = e.target.files?.[0]; if (!file) return;
                                                                                    setPdfUploadingRow(row.id);
                                                                                    await handlePdfUpload(row.id, file);
                                                                                    setPdfUploadingRow(null);
                                                                                    e.target.value = '';
                                                                                }}
                                                                            />
                                                                            <Tooltip title={val ? 'Replace PDF' : 'Upload License PDF'}>
                                                                                <IconButton size="small"
                                                                                    onClick={() => pdfInputRefs.current[row.id]?.click()}
                                                                                    disabled={pdfUploadingRow === row.id}
                                                                                    sx={{ width: 22, height: 22, borderRadius: 1, color: '#2563eb', bgcolor: alpha('#2563eb', 0.08), '&:hover': { bgcolor: alpha('#2563eb', 0.18) } }}>
                                                                                    {pdfUploadingRow === row.id
                                                                                        ? <CircularProgress size={11}/>
                                                                                        : <UploadFileIcon sx={{ fontSize: 13 }}/>}
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </>
                                                                    )}
                                                                </Box>
                                                            </td>
                                                        );
                                                    }
                                                    if (c.id === 'company') {
                                                        return (
                                                            <td key={c.id} style={{ padding: '12px 16px' }}>
                                                                <Chip label={val || '—'} size="small" sx={{ fontWeight: 700, fontSize: 10, height: 20, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', borderRadius: 1.5 }} />
                                                            </td>
                                                        );
                                                    }
                                                    return (
                                                        <td key={c.id} style={{
                                                            padding: '12px 16px', fontSize: 12, fontWeight: 500, color: theme.palette.text.primary,
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: c.w
                                                        }}>
                                                            <Tooltip title={val || ''}><span>{val || <span style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)', fontStyle: 'italic', fontWeight: 300 }}>—</span>}</span></Tooltip>
                                                        </td>
                                                    );
                                                })}
                                                <td style={{ 
                                                    padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                                                    borderLeft: `1px solid ${theme.palette.divider}`
                                                }}>
                                                    {(() => {
                                                        const role = (currentUser as any)?.role;
                                                        const vStatus = row.verification_status;
                                                        return (
                                                            <>
                                                                {(!vStatus || vStatus === 'draft') && (
                                                                    <Button size="small" variant="outlined" color="warning" onClick={() => handleVerification(row.id, 'request-verification')} sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 10, py: 0, px: 1, minWidth: 'max-content', height: 24, whiteSpace: 'nowrap' }}>
                                                                        Request Approval
                                                                    </Button>
                                                                )}
                                                                {(vStatus === 'pending_supervisor') && (role === 'supervisor' || role === 'superadmin') && (
                                                                    <Button size="small" variant="contained" color="secondary" onClick={() => handleVerification(row.id, 'verify')} sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 10, py: 0, px: 1, minWidth: 'max-content', height: 24, boxShadow: 'none', whiteSpace: 'nowrap' }}>
                                                                        Verify License
                                                                    </Button>
                                                                )}
                                                                {(vStatus === 'pending_superadmin' || (vStatus === 'pending_supervisor' && role === 'superadmin')) && role === 'superadmin' && (
                                                                    <Button size="small" variant="contained" color="success" onClick={() => handleVerification(row.id, 'approve')} sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 10, py: 0, px: 1, minWidth: 'max-content', height: 24, boxShadow: 'none', whiteSpace: 'nowrap' }}>
                                                                        Approve License
                                                                    </Button>
                                                                )}
                                                                {vStatus === 'approved' && (
                                                                    <Chip size="small" label="Approved" color="success" variant="outlined" sx={{ height: 20, fontSize: 10, borderRadius: 1 }} />
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                    {row.completed && (
                                                        <Chip label="Completed" size="small" icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} sx={{ fontWeight: 700, fontSize: 10, height: 22, bgcolor: alpha('#10b981', 0.12), color: '#10b981', borderRadius: 1.5, '& .MuiChip-icon': { color: '#10b981' } }} />
                                                    )}
                                                    {!isSuperAdmin && (
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small" onClick={() => { setEditItem(row); setDialogOpen(true); }} sx={{
                                                                color: '#2563eb',
                                                                bgcolor: alpha('#2563eb', 0.08),
                                                                '&:hover': { bgcolor: alpha('#2563eb', 0.15) },
                                                                width: 28, height: 28, borderRadius: 1.5
                                                            }}>
                                                                <EditIcon sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {!isSuperAdmin && (
                                                        <Tooltip title="Delete">
                                                            <IconButton size="small" onClick={() => handleDelete(row.id)} sx={{
                                                                color: '#ef4444',
                                                                bgcolor: alpha('#ef4444', 0.08),
                                                                '&:hover': { bgcolor: alpha('#ef4444', 0.15) },
                                                                width: 28, height: 28, borderRadius: 1.5
                                                            }}>
                                                                <DeleteIcon sx={{ fontSize: 15 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Box>
                    </Paper>
                </motion.div>
            </Box>

            {/* Dialogs */}
            <AnimatePresence>
                {dialogOpen && <LicenseDialog open={dialogOpen} initial={editItem} tenders={tenders} saving={saving} onClose={()=>{setDialogOpen(false);setEditItem(null);}} onSave={handleSave} onPdfUpload={handlePdfUpload}/>}
            </AnimatePresence>
            <WarningDialog licenses={warningLicenses} open={warningOpen} onClose={()=>setWarningOpen(false)} onAcknowledge={handleAcknowledge}/>
            <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack(null)} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
                <Alert severity={snack?.sev} onClose={()=>setSnack(null)} sx={{fontWeight:600}}>{snack?.msg}</Alert>
            </Snackbar>
            {/* Filter Popover */}
            <Popover open={Boolean(filterAnchor)} anchorEl={filterAnchor} onClose={() => setFilterAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { p: 2, width: 300, mt: 1, borderRadius: 3, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)' } }}>
                <Typography variant="subtitle2" fontWeight={800} mb={2}>Advanced Filters</Typography>
                <Grid container spacing={2}>
                    <Grid size={{xs:12}}>
                        <TextField size="small" fullWidth label="Client Name" value={filters.clientName} onChange={e => setFilters(p => ({ ...p, clientName: e.target.value }))} />
                    </Grid>
                    <Grid size={{xs:12}}>
                        <TextField size="small" fullWidth label="Project Code" value={filters.projectCode} onChange={e => setFilters(p => ({ ...p, projectCode: e.target.value }))} />
                    </Grid>
                    <Grid size={{xs:12}}>
                        <TextField size="small" fullWidth label="Quotation No" value={filters.quotationNo} onChange={e => setFilters(p => ({ ...p, quotationNo: e.target.value }))} />
                    </Grid>
                    <Grid size={{xs:12}}>
                        <TextField size="small" fullWidth label="Product Name" value={filters.productName} onChange={e => setFilters(p => ({ ...p, productName: e.target.value }))} />
                    </Grid>
                    <Grid size={{xs:12}}>
                        <Button fullWidth variant="outlined" color="error" size="small"
                            onClick={() => setFilters({ clientName: '', projectCode: '', quotationNo: '', productName: '' })}>
                            Clear All
                        </Button>
                    </Grid>
                </Grid>
            </Popover>
        </Box>
    );
}
