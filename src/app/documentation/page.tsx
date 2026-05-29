import React, { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Card from '@mui/material/Card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import TopicIcon from '@mui/icons-material/Topic';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import FolderZipIcon from '@mui/icons-material/FolderZip';

interface DocRef {
    id: number;
    title: string;
    description: string | null;
    location_stored: string;
    created_at: string;
}

const fetchDocRefs = async (search: string): Promise<DocRef[]> => {
    return await api.get('documentation-references', { searchParams: { search } }).json();
};

export default function DocumentationPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [formData, setFormData] = useState({ id: 0, title: '', description: '', location_stored: '' });

    React.useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const { data: docs, isLoading } = useQuery({
        queryKey: ['documentation-references', debouncedSearch],
        queryFn: () => fetchDocRefs(debouncedSearch),
    });

    const createMutation = useMutation({
        mutationFn: (data: { title: string; description?: string; location_stored: string }) =>
            api.post('documentation-references', { json: data }).json(),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documentation-references'] }); setIsCreateOpen(false); resetForm(); },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; title: string; description?: string; location_stored: string }) =>
            api.put(`documentation-references/${data.id}`, { json: data }).json(),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['documentation-references'] }); setIsEditOpen(false); resetForm(); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`documentation-references/${id}`).json(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentation-references'] }),
    });

    const resetForm = () => setFormData({ id: 0, title: '', description: '', location_stored: '' });

    const handleCreate = () => { if (!formData.title || !formData.location_stored) return; createMutation.mutate(formData); };
    const handleUpdate = () => { if (!formData.title || !formData.location_stored) return; updateMutation.mutate(formData); };

    const openEdit = (doc: DocRef) => {
        setFormData({ id: doc.id, title: doc.title, description: doc.description || '', location_stored: doc.location_stored });
        setIsEditOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this document?')) deleteMutation.mutate(id);
    };

    const DIALOG_PAPER_SX = { borderRadius: '16px', border: '1px solid rgba(148,163,184,0.15)' };

    return (
        <>
            <div className="flex flex-col w-full p-16 md:p-24 max-w-[1600px] mx-auto min-h-full">

                {/* ── Compact Top Bar ── */}
                <div className="flex items-center justify-between gap-12 mb-16">
                    <div>
                        <Typography variant="h5" className="font-black tracking-tight text-slate-800 dark:text-white leading-none">
                            Documentation
                        </Typography>
                        <Typography variant="caption" className="text-slate-400 dark:text-slate-500 font-medium">
                            Physical reference tracking and documentation management
                        </Typography>
                    </div>
                    <div className="flex items-center gap-8">
                        <TextField
                            placeholder="Search documents…"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ 
                                width: 260,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    backgroundColor: 'rgba(248, 250, 252, 0.8)',
                                    transition: 'all 0.2s',
                                    '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.2)' },
                                    '&:hover fieldset': { borderColor: 'rgba(59, 130, 246, 0.4)' },
                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6', borderWidth: '1.5px' },
                                    '&.Mui-focused': { backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)' }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon sx={{ fontSize: '15px !important' }} />}
                            onClick={() => { resetForm(); setIsCreateOpen(true); }}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 2, py: '7px', fontSize: '13px', background: '#2563eb', '&:hover': { background: '#1d4ed8' }, whiteSpace: 'nowrap' }}
                        >
                            New Document
                        </Button>
                    </div>
                </div>

                {/* ── Table ── */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center py-40">
                        <CircularProgress sx={{ color: '#3b82f6' }} size={28} />
                    </div>
                ) : (
                    <Card sx={{ borderRadius: '14px', border: '1px solid rgba(148,163,184,0.15)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', background: 'white' }}
                        className="dark:bg-slate-900/60">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-white/5">
                                        <th className="px-16 py-10 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 w-1/4">Title</th>
                                        <th className="px-16 py-10 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 w-1/4">Location Stored</th>
                                        <th className="px-16 py-10 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Description</th>
                                        <th className="px-16 py-10 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                                    {!docs || docs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-16 py-40 text-center">
                                                <div className="flex flex-col items-center gap-16 text-slate-300 dark:text-slate-600">
                                                    <div className="w-64 h-64 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                                                        <TopicIcon sx={{ fontSize: 32, opacity: 0.5 }} />
                                                    </div>
                                                    <div className="flex flex-col items-center gap-4">
                                                        <Typography variant="body2" className="font-bold text-slate-400 dark:text-slate-500">No documentation references found</Typography>
                                                        <Typography variant="caption" className="text-slate-400/60 font-medium">Try adjusting your search or add a new document</Typography>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        docs.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-16 py-12">
                                                    <div className="flex items-center gap-12">
                                                        <div className="flex items-center justify-center w-32 h-32 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                                                            <FolderZipIcon sx={{ fontSize: 16 }} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight">
                                                                {row.title}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium mt-2">
                                                                #{row.id.toString().padStart(4, '0')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-16 py-12">
                                                    <div className="flex items-center gap-10">
                                                        <div className="flex items-center justify-center w-28 h-28 rounded-lg bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-500 border border-indigo-100/50 dark:border-indigo-500/20">
                                                            <InventoryIcon sx={{ fontSize: 14 }} />
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 leading-tight truncate">
                                                                {row.location_stored.split(',')[0].trim()}
                                                            </span>
                                                            {row.location_stored.includes(',') && (
                                                                <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 mt-2 flex items-center gap-4">
                                                                    <LocationOnIcon sx={{ fontSize: 10 }} />
                                                                    {row.location_stored.split(',').slice(1).join(',').trim()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-16 py-12">
                                                    <span className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                        {row.description || <span className="italic text-slate-300 dark:text-slate-600">—</span>}
                                                    </span>
                                                </td>
                                                <td className="px-16 py-12 text-right">
                                                    <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <IconButton size="small" onClick={() => openEdit(row)}
                                                            sx={{ width: 32, height: 32, borderRadius: '8px', border: '1px solid #e2e8f0', '&:hover': { background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' } }}>
                                                            <EditIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={() => handleDelete(row.id)}
                                                            sx={{ width: 32, height: 32, borderRadius: '8px', border: '1px solid #fee2e2', color: '#f87171', '&:hover': { background: '#fef2f2', color: '#ef4444', borderColor: '#fecaca' } }}>
                                                            <DeleteIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* ── Create Dialog ── */}
            <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: DIALOG_PAPER_SX }}>
                <DialogTitle sx={{ px: 4, pt: 4, pb: 1, fontWeight: 900, fontSize: '18px', color: '#1e293b' }}>
                    Add Document Reference
                </DialogTitle>
                <DialogContent sx={{ px: 4, pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography variant="caption" className="text-slate-400 font-semibold uppercase tracking-wider mb-[-8px]">Document Details</Typography>
                    <TextField size="small" label="Document Title" fullWidth autoFocus
                        value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                    
                    <Typography variant="caption" className="text-slate-400 font-semibold uppercase tracking-wider mb-[-8px]">Storage Information</Typography>
                    <TextField size="small" label="Location Stored" fullWidth placeholder="e.g., Cabinet NHR-470-90, Level 3"
                        value={formData.location_stored} onChange={(e) => setFormData({ ...formData, location_stored: e.target.value })}
                        helperText="Use comma to separate Cabinet and Level (e.g. Cabinet A, Level 1)"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                    
                    <Typography variant="caption" className="text-slate-400 font-semibold uppercase tracking-wider mb-[-8px]">Additional Context</Typography>
                    <TextField size="small" label="Description (Optional)" fullWidth multiline rows={3}
                        value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 4, pt: 1, gap: 1.5 }}>
                    <Button size="medium" onClick={() => setIsCreateOpen(false)}
                        sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b', borderRadius: '10px', px: 3 }}>Cancel</Button>
                    <Button size="medium" variant="contained" onClick={handleCreate}
                        disabled={!formData.title || !formData.location_stored || createMutation.isPending}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 4, background: '#2563eb', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', '&:hover': { background: '#1d4ed8', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)' } }}>
                        {createMutation.isPending ? 'Adding…' : 'Add Document'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Edit Dialog ── */}
            <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: DIALOG_PAPER_SX }}>
                <DialogTitle sx={{ px: 4, pt: 4, pb: 1, fontWeight: 900, fontSize: '18px', color: '#1e293b' }}>
                    Edit Document Reference
                </DialogTitle>
                <DialogContent sx={{ px: 4, pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Typography variant="caption" className="text-slate-400 font-semibold uppercase tracking-wider mb-[-8px]">Document Details</Typography>
                    <TextField size="small" label="Document Title" fullWidth autoFocus
                        value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                    
                    <Typography variant="caption" className="text-slate-400 font-semibold uppercase tracking-wider mb-[-8px]">Storage Information</Typography>
                    <TextField size="small" label="Location Stored" fullWidth placeholder="e.g., Cabinet NHR-470-90, Level 3"
                        value={formData.location_stored} onChange={(e) => setFormData({ ...formData, location_stored: e.target.value })}
                        helperText="Use comma to separate Cabinet and Level (e.g. Cabinet A, Level 1)"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                    
                    <Typography variant="caption" className="text-slate-400 font-semibold uppercase tracking-wider mb-[-8px]">Additional Context</Typography>
                    <TextField size="small" label="Description (Optional)" fullWidth multiline rows={3}
                        value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 4, pt: 1, gap: 1.5 }}>
                    <Button size="medium" onClick={() => setIsEditOpen(false)}
                        sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b', borderRadius: '10px', px: 3 }}>Cancel</Button>
                    <Button size="medium" variant="contained" onClick={handleUpdate}
                        disabled={!formData.title || !formData.location_stored || updateMutation.isPending}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 4, background: '#2563eb', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', '&:hover': { background: '#1d4ed8', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)' } }}>
                        {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
