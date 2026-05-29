'use client';

import { useState, useRef } from 'react';
import {
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    InputAdornment,
    MenuItem,
    Drawer,
    Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import clsx from 'clsx';
import { useSnackbar } from 'notistack';

interface InventoryItem {
    id: number;
    asset_tag: string | null;
    category: string;
    brand: string;
    model: string;
    serial_number: string;
    status: 'Available' | 'In Use' | 'Maintenance' | 'Retired';
    quantity: number;
    image_url: string | null;
    purchase_date: string | null;
    cost: number | null;
    remarks: string | null;
}

const fetchInventory = async (search: string) =>
    api.get('business-inventory', { searchParams: { search } }).json() as Promise<InventoryItem[]>;

const STATUS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    'Available':   { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Available' },
    'In Use':      { bg: 'bg-blue-50 dark:bg-blue-500/10',       text: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500',   label: 'In Use' },
    'Maintenance': { bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500',  label: 'Maintenance' },
    'Retired':     { bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-500 dark:text-red-400',         dot: 'bg-red-500',    label: 'Retired' },
};

const CAT_ICON: Record<string, string> = {
    'Laptop':       'heroicons-outline:computer-desktop',
    'Mobile Phone': 'heroicons-outline:device-phone-mobile',
    'Monitor':      'heroicons-outline:tv',
    'Workstation':  'heroicons-outline:server',
};
const DEFAULT_ICON = 'heroicons-outline:device-tablet';

// Compress an image file using canvas before uploading (reduces payload size ~10x)
const compressImage = (file: File, maxWidth = 800, quality = 0.75): Promise<File> => {
    return new Promise((resolve) => {
        // If file is already small enough, skip compression
        if (file.size < 100 * 1024) { resolve(file); return; }
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement('canvas');
            canvas.width  = Math.round(img.width  * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
                (blob) => {
                    if (!blob) { resolve(file); return; }
                    resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                },
                'image/jpeg',
                quality,
            );
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
};

// Build FormData from selected item + optional image file
const buildFormData = (item: Partial<InventoryItem>, imageFile?: File | null) => {
    const fd = new FormData();
    const fields = ['asset_tag','category','brand','model','serial_number','status','quantity','purchase_date','cost','remarks'] as const;
    fields.forEach(k => {
        const v = (item as any)[k];
        if (v !== undefined) {
            fd.append(k, v === null ? '' : String(v));
        }
    });
    if (imageFile) fd.append('image', imageFile);
    return fd;
};

export default function InventoryPage() {
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [search, setSearch]               = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isFormOpen, setIsFormOpen]       = useState(false);
    const [selectedItem, setSelectedItem]   = useState<Partial<InventoryItem> | null>(null);
    const [detailItem, setDetailItem]       = useState<InventoryItem | null>(null);
    const [imageFile, setImageFile]         = useState<File | null>(null);
    const [imagePreview, setImagePreview]   = useState<string | null>(null);

    const categories = ['All', 'Laptop', 'Mobile Phone', 'Tablet', 'Monitor', 'Workstation', 'Other'];

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['business-inventory', search],
        queryFn: () => fetchInventory(search),
    });

    const createMutation = useMutation({
        mutationFn: async (d: Partial<InventoryItem>) => {
            const compressed = imageFile ? await compressImage(imageFile) : null;
            return api.post('business-inventory', { body: buildFormData(d, compressed) }).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-inventory'] });
            setIsFormOpen(false);
            enqueueSnackbar('Asset added', { variant: 'success' });
        },
        onError: (error: any) => {
            console.error('Create error:', error);
            const message = error.response?.data?.message || 'Failed to add asset';
            enqueueSnackbar(message, { variant: 'error' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (d: any) => {
            const compressed = imageFile ? await compressImage(imageFile) : null;
            const fd = buildFormData(d, compressed);
            fd.append('_method', 'PUT');
            return api.post(`business-inventory/${d.id}`, { body: fd }).json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-inventory'] });
            setIsFormOpen(false);
            enqueueSnackbar('Asset updated', { variant: 'success' });
        },
        onError: (error: any) => {
            console.error('Update error:', error);
            const message = error.response?.data?.message || 'Failed to update asset';
            enqueueSnackbar(message, { variant: 'error' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`business-inventory/${id}`).json(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-inventory'] });
            setDetailItem(null);
            enqueueSnackbar('Asset removed', { variant: 'success' });
        },
    });

    const handleSave = () =>
        selectedItem?.id ? updateMutation.mutate(selectedItem) : createMutation.mutate(selectedItem!);

    const openForm = (item?: InventoryItem) => {
        setSelectedItem(item ? { ...item } : { status: 'Available' });
        setImageFile(null);
        setImagePreview(item?.image_url ?? null);
        setIsFormOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const filteredItems = items.filter(item =>
        activeCategory === 'All' || item.category === activeCategory
    );

    return (
        <div className="flex flex-col w-full p-16 md:p-24 max-w-[1600px] mx-auto min-h-full">

            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between gap-12 mb-16">
                <div>
                    <Typography variant="h5" className="font-black tracking-tight text-slate-800 dark:text-white leading-none">
                        Asset Registry
                    </Typography>
                    <Typography variant="caption" className="text-slate-400 font-medium">
                        Corporate hardware lifecycle &amp; device management
                    </Typography>
                </div>
                <div className="flex items-center gap-8">
                    <TextField
                        placeholder="Search serial, model, owner…"
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ width: 220 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FuseSvgIcon size={15} className="text-slate-400">heroicons-outline:magnifying-glass</FuseSvgIcon>
                                </InputAdornment>
                            ),
                            sx: { borderRadius: '10px', fontSize: '13px' },
                        }}
                    />
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<FuseSvgIcon size={14}>heroicons-outline:plus</FuseSvgIcon>}
                        onClick={() => openForm()}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 2, py: '7px', fontSize: '13px', background: '#2563eb', '&:hover': { background: '#1d4ed8' } }}
                    >
                        Register Asset
                    </Button>
                </div>
            </div>

            {/* ── Category Tabs ── */}
            <div className="flex items-center gap-8 mb-16 border-b border-slate-100 dark:border-white/5">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={clsx(
                            'pb-10 px-4 text-sm font-bold transition-all border-b-2 -mb-px whitespace-nowrap capitalize',
                            activeCategory === cat
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        )}
                    >
                        {cat}
                    </button>
                ))}
                <span className="ml-auto text-[11px] text-slate-400 font-bold pb-8">
                    {filteredItems.length} asset{filteredItems.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* ── Bento Grid ── */}
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center py-40">
                    <div className="animate-spin rounded-full h-28 w-28 border-t-2 border-blue-500" />
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-48 text-center">
                    <div className="w-56 h-56 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-12">
                        <FuseSvgIcon size={28} className="text-slate-300 dark:text-slate-600">heroicons-outline:cpu-chip</FuseSvgIcon>
                    </div>
                    <Typography className="font-bold text-sm text-slate-700 dark:text-white mb-2">No assets found</Typography>
                    <Typography variant="caption" className="text-slate-400 mb-14">
                        {activeCategory === 'All' ? 'Register your first device to get started.' : `No ${activeCategory} assets found.`}
                    </Typography>
                    <Button size="small" variant="outlined"
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '12px' }}
                        onClick={() => openForm()}>
                        Add Asset
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-10">
                    {filteredItems.map((item) => {
                        const s = STATUS[item.status] || STATUS['Available'];
                        const icon = CAT_ICON[item.category] || DEFAULT_ICON;
                        return (
                            <div
                                key={item.id}
                                onClick={() => setDetailItem(item)}
                                className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden hover:shadow-md hover:border-blue-100 dark:hover:border-blue-500/20 transition-all cursor-pointer flex flex-col"
                            >
                                {/* Thumbnail area */}
                                <div className="relative bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden" style={{ height: 100 }}>
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={`${item.brand} ${item.model}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FuseSvgIcon size={36} className="text-slate-300 dark:text-slate-600">{icon}</FuseSvgIcon>
                                    )}
                                </div>

                                {/* Info area */}
                                <div className="p-12 flex flex-col gap-6 flex-1">
                                    <div>
                                        <p className="text-[12px] font-black text-slate-800 dark:text-white leading-tight truncate">
                                            {item.brand} {item.model}
                                        </p>
                                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide mt-1">{item.category}</p>
                                    </div>

                                    {item.asset_tag && (
                                        <span className="font-mono text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-5 py-1 rounded self-start">
                                            {item.asset_tag}
                                        </span>
                                    )}

                                    <p className="font-mono text-[9px] text-slate-400 dark:text-slate-500 truncate">{item.serial_number}</p>

                                    {/* Details link on hover */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDetailItem(item); }}
                                        className="mt-auto text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity text-left hover:underline"
                                    >
                                        View Details →
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Detail Drawer ── */}
            <Drawer
                anchor="right"
                open={!!detailItem}
                onClose={() => setDetailItem(null)}
                PaperProps={{ sx: { width: 340, p: 0, borderLeft: '1px solid rgba(148,163,184,0.12)' } }}
            >
                {detailItem && (() => {
                    const s = STATUS[detailItem.status] || STATUS['Available'];
                    const icon = CAT_ICON[detailItem.category] || DEFAULT_ICON;
                    return (
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between px-20 py-14 border-b border-slate-100 dark:border-white/5">
                                <Typography className="font-black text-sm text-slate-800 dark:text-white">Asset Detail</Typography>
                                <IconButton size="small" onClick={() => setDetailItem(null)}
                                    sx={{ width: 28, height: 28, '&:hover': { background: '#f1f5f9' } }}>
                                    <FuseSvgIcon size={14}>heroicons-outline:x-mark</FuseSvgIcon>
                                </IconButton>
                            </div>

                            <div className="flex-1 overflow-y-auto flex flex-col">
                                {/* Image hero */}
                                <div className="bg-slate-50 dark:bg-slate-800 flex items-center justify-center" style={{ height: 180 }}>
                                    {detailItem.image_url ? (
                                        <img src={detailItem.image_url} alt={`${detailItem.brand} ${detailItem.model}`}
                                            className="w-full h-full object-contain p-16" />
                                    ) : (
                                        <FuseSvgIcon size={56} className="text-slate-300 dark:text-slate-600">{icon}</FuseSvgIcon>
                                    )}
                                </div>

                                <div className="px-20 py-16 flex flex-col gap-14">
                                    {/* Title + status */}
                                    <div>
                                        <p className="font-black text-slate-800 dark:text-white text-base leading-tight">
                                            {detailItem.brand} {detailItem.model}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 mb-8">{detailItem.category}</p>
                                        <span className={clsx('inline-flex items-center gap-4 px-8 py-1.5 rounded-full text-[10px] font-black uppercase', s.bg, s.text)}>
                                            <span className={clsx('w-5 h-5 rounded-full', s.dot)} />
                                            {detailItem.status}
                                        </span>
                                    </div>

                                    <Divider sx={{ borderColor: 'rgba(148,163,184,0.1)' }} />

                                    {/* Info rows */}
                                    {[
                                        { label: 'Asset Tag',     value: detailItem.asset_tag,                                    mono: true },
                                        { label: 'Serial Number', value: detailItem.serial_number,                                mono: true },
                                        { label: 'Quantity',      value: detailItem.quantity,                                     mono: false },
                                        { label: 'Purchase Date', value: detailItem.purchase_date,                                mono: false },
                                        { label: 'Cost',          value: detailItem.cost != null ? `RM ${detailItem.cost}` : null, mono: false },
                                        { label: 'Remarks',       value: detailItem.remarks,                                      mono: false },
                                    ].map(({ label, value, mono }) => value ? (
                                        <div key={label} className="flex flex-col gap-2">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                                            <p className={clsx('text-[12px] text-slate-700 dark:text-slate-200 break-words', mono ? 'font-mono font-bold' : 'font-semibold')}>
                                                {value}
                                            </p>
                                        </div>
                                    ) : null)}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-20 py-14 border-t border-slate-100 dark:border-white/5 flex gap-8">
                                <Button fullWidth size="small" variant="outlined"
                                    onClick={() => { setDetailItem(null); openForm(detailItem); }}
                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '12px' }}>
                                    Edit
                                </Button>
                                <Button fullWidth size="small" variant="outlined" color="error"
                                    onClick={() => deleteMutation.mutate(detailItem.id)}
                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '12px' }}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    );
                })()}
            </Drawer>

            {/* ── Add / Edit Dialog ── */}
            <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', border: '1px solid rgba(148,163,184,0.15)' } }}>
                <DialogTitle sx={{ px: 3, pt: 3, pb: 1, fontWeight: 900, fontSize: '15px', color: '#1e293b' }}>
                    {selectedItem?.id ? 'Edit Asset' : 'Register New Asset'}
                </DialogTitle>
                <DialogContent sx={{ px: 3, pt: 1 }}>
                    <Grid container spacing={1.5}>

                        {/* Image Upload */}
                        <Grid size={12}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-8 relative w-full h-[120px] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors overflow-hidden group"
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="preview" className="w-full h-full object-contain p-8" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white text-[11px] font-bold">Click to change</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <FuseSvgIcon size={24} className="text-slate-300 mb-6">heroicons-outline:photo</FuseSvgIcon>
                                        <p className="text-[11px] font-bold text-slate-400">Click to upload device image</p>
                                        <p className="text-[9px] text-slate-300 mt-1">PNG, JPG up to 4MB</p>
                                    </>
                                )}
                            </div>
                        </Grid>

                        {/* Fields */}
                        {[
                            { label: 'Category',      key: 'category',      select: ['Laptop','Mobile Phone','Tablet','Monitor','Workstation','Other'] },
                            { label: 'Asset Tag',     key: 'asset_tag' },
                            { label: 'Brand',         key: 'brand' },
                            { label: 'Model',         key: 'model' },
                            { label: 'Serial Number', key: 'serial_number', full: true },
                            { label: 'Status',        key: 'status',        select: ['Available','In Use','Maintenance','Retired'] },
                            { label: 'Quantity',      key: 'quantity',      inputType: 'number' },
                            { label: 'Purchase Date', key: 'purchase_date', inputType: 'date' },
                            { label: 'Cost (RM)',     key: 'cost',          inputType: 'number' },
                            { label: 'Remarks',       key: 'remarks',       full: true, rows: 2 },
                        ].map(({ label, key, select, full, rows, inputType }) => (
                            <Grid key={key} size={{ xs: 12, sm: full ? 12 : 6 }}>
                                <TextField
                                    label={label}
                                    select={!!select}
                                    fullWidth
                                    size="small"
                                    margin="dense"
                                    multiline={!!rows}
                                    rows={rows}
                                    type={inputType || 'text'}
                                    InputLabelProps={inputType === 'date' ? { shrink: true } : undefined}
                                    value={(selectedItem as any)?.[key] ?? ''}
                                    onChange={(e) => setSelectedItem({ ...selectedItem, [key]: e.target.value })}
                                >
                                    {select?.map(o => (
                                        <MenuItem key={o} value={o}>
                                            {o === '' ? <span className="text-slate-400 italic">None</span> : o}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
                    <Button size="small" onClick={() => setIsFormOpen(false)}
                        sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b', borderRadius: '8px' }}>
                        Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={handleSave}
                        disabled={createMutation.isPending || updateMutation.isPending}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 3, background: '#4f46e5', '&:hover': { background: '#4338ca' } }}>
                        {selectedItem?.id ? 'Update Asset' : 'Save Asset'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
