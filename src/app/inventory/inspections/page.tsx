'use client';

import { useState, useRef } from 'react';
import {
    Typography,
    Button,
    TextField,
    MenuItem,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import clsx from 'clsx';

interface Assignment {
    id: number;
    inventory: {
        brand: string;
        model: string;
    };
}

interface Inspection {
    id: number;
    condition_status: 'Good' | 'Broken' | 'Needs Repair';
    photo_url: string | null;
    remarks: string | null;
    created_at: string;
    user: { name: string };
    assignment: {
        inventory: { brand: string, model: string };
    };
}

export default function InspectionsPage() {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        inventory_assignment_id: '',
        condition_status: 'Good',
        remarks: '',
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const { data: myAssignments = [] } = useQuery({
        queryKey: ['inventory-my-items'],
        queryFn: () => api.get('inventory-my-items').json() as Promise<Assignment[]>,
    });

    const { data: inspections = [], isLoading } = useQuery({
        queryKey: ['inventory-inspections'],
        queryFn: () => api.get('inventory-inspections').json() as Promise<Inspection[]>,
    });

    const inspectionMutation = useMutation({
        mutationFn: (fd: FormData) => api.post('inventory-inspections', { body: fd }).json(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-inspections'] });
            setIsDialogOpen(false);
            setForm({ inventory_assignment_id: '', condition_status: 'Good', remarks: '' });
            setPhotoFile(null);
            setPhotoPreview(null);
            enqueueSnackbar('Inspection submitted successfully', { variant: 'success' });
        }
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = () => {
        if (!form.inventory_assignment_id) {
            enqueueSnackbar('Please select an item', { variant: 'warning' });
            return;
        }
        const fd = new FormData();
        fd.append('inventory_assignment_id', form.inventory_assignment_id);
        fd.append('condition_status', form.condition_status);
        fd.append('remarks', form.remarks);
        if (photoFile) fd.append('photo', photoFile);
        
        inspectionMutation.mutate(fd);
    };

    return (
        <div className="flex flex-col w-full p-24 max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between mb-24">
                <div>
                    <Typography variant="h5" className="font-black tracking-tight text-slate-800 dark:text-white">
                        Item Inspections
                    </Typography>
                    <Typography variant="caption" className="text-slate-400 font-medium">
                        Condition monitoring and equipment health reports
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>}
                    onClick={() => setIsDialogOpen(true)}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, background: '#2563eb' }}
                >
                    New Inspection
                </Button>
            </div>

            <Paper className="rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                                <TableCell className="font-bold text-slate-400 uppercase text-[10px]">User</TableCell>
                                <TableCell className="font-bold text-slate-400 uppercase text-[10px]">Item</TableCell>
                                <TableCell className="font-bold text-slate-400 uppercase text-[10px]">Condition</TableCell>
                                <TableCell className="font-bold text-slate-400 uppercase text-[10px]">Photo</TableCell>
                                <TableCell className="font-bold text-slate-400 uppercase text-[10px]">Remarks</TableCell>
                                <TableCell className="font-bold text-slate-400 uppercase text-[10px]">Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={6} align="center" className="py-40">Loading...</TableCell></TableRow>
                            ) : inspections.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" className="py-40 text-slate-400">No inspections yet</TableCell></TableRow>
                            ) : inspections.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-bold text-[12px]">{row.user.name}</TableCell>
                                    <TableCell className="font-medium text-[12px]">{row.assignment.inventory.brand} {row.assignment.inventory.model}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={row.condition_status} 
                                            size="small" 
                                            className={clsx(
                                                'font-black text-[9px] uppercase',
                                                row.condition_status === 'Good' ? 'bg-emerald-50 text-emerald-600' : 
                                                row.condition_status === 'Broken' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {row.photo_url && (
                                            <a href={row.photo_url} target="_blank" rel="noreferrer">
                                                <img src={row.photo_url} alt="inspection" className="w-40 h-40 object-cover rounded-lg border border-slate-200" />
                                            </a>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-[11px] text-slate-500 max-w-[200px] truncate">{row.remarks}</TableCell>
                                    <TableCell className="text-[11px] text-slate-500">{format(new Date(row.created_at), 'dd MMM yyyy')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle className="font-black text-slate-800">New Inspection Form</DialogTitle>
                <DialogContent>
                    <div className="flex flex-col gap-16 pt-8">
                        <TextField
                            label="Select Your Item"
                            select
                            fullWidth
                            size="small"
                            value={form.inventory_assignment_id}
                            onChange={(e) => setForm({ ...form, inventory_assignment_id: e.target.value })}
                        >
                            {myAssignments.map(a => (
                                <MenuItem key={a.id} value={a.id}>{a.inventory.brand} {a.inventory.model}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Condition"
                            select
                            fullWidth
                            size="small"
                            value={form.condition_status}
                            onChange={(e) => setForm({ ...form, condition_status: e.target.value })}
                        >
                            <MenuItem value="Good">Good</MenuItem>
                            <MenuItem value="Broken">Broken</MenuItem>
                            <MenuItem value="Needs Repair">Needs Repair</MenuItem>
                        </TextField>

                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-100 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden"
                        >
                            {photoPreview ? (
                                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <FuseSvgIcon size={24} className="text-slate-300">heroicons-outline:camera</FuseSvgIcon>
                                    <span className="text-[11px] font-bold text-slate-400 mt-4">Upload Photo</span>
                                </>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                        </div>

                        <TextField
                            label="Remarks"
                            multiline
                            rows={3}
                            fullWidth
                            size="small"
                            value={form.remarks}
                            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                        />
                    </div>
                </DialogContent>
                <DialogActions className="p-16 pt-0">
                    <Button onClick={() => setIsDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit} 
                        disabled={inspectionMutation.isPending}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 3, background: '#2563eb' }}
                    >
                        {inspectionMutation.isPending ? 'Submitting...' : 'Submit Inspection'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
