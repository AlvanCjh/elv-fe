'use client';

import { useState } from 'react';
import {
    Typography,
    Button,
    TextField,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

interface User {
    id: string;
    name: string;
}

interface InventoryItem {
    id: number;
    brand: string;
    model: string;
    quantity: number;
    category: string;
}

interface Assignment {
    id: number;
    business_inventory_id: number;
    user_id: number;
    quantity: number;
    assigned_at: string;
    status: 'active' | 'returned';
    inventory: InventoryItem;
    user: User;
}

export default function AssignPage() {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [selectedAsset, setSelectedAsset] = useState<number | ''>('');
    const [selectedUser, setSelectedUser] = useState<string | ''>('');
    const [assignQuantity, setAssignQuantity] = useState<number>(1);

    const { data: assets = [] } = useQuery({
        queryKey: ['business-inventory'],
        queryFn: () => api.get('business-inventory').json() as Promise<InventoryItem[]>,
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('users').json() as Promise<User[]>,
    });

    const { data: assignments = [], isLoading } = useQuery({
        queryKey: ['inventory-assignments'],
        queryFn: () => api.get('inventory-assignments').json() as Promise<Assignment[]>,
    });

    const assignMutation = useMutation({
        mutationFn: (data: any) => api.post('inventory-assignments', { json: data }).json(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['business-inventory'] });
            setSelectedAsset('');
            setSelectedUser('');
            setAssignQuantity(1);
            enqueueSnackbar('Asset assigned successfully', { variant: 'success' });
        },
        onError: (error: any) => {
            enqueueSnackbar(error.response?.data?.message || 'Failed to assign asset', { variant: 'error' });
        }
    });

    const returnMutation = useMutation({
        mutationFn: (id: number) => api.post(`inventory-assignments/${id}/return`).json(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-assignments'] });
            queryClient.invalidateQueries({ queryKey: ['business-inventory'] });
            enqueueSnackbar('Asset returned successfully', { variant: 'success' });
        }
    });

    const handleAssign = () => {
        if (!selectedAsset || !selectedUser || assignQuantity < 1) {
            enqueueSnackbar('Please fill all fields correctly', { variant: 'warning' });
            return;
        }
        assignMutation.mutate({
            business_inventory_id: selectedAsset,
            user_id: selectedUser,
            quantity: assignQuantity
        });
    };

    return (
        <div style={{ padding: '24px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>

            {/* ── Header ── */}
            <div style={{ marginBottom: 28 }}>
                <Typography
                    variant="h5"
                    sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a', lineHeight: 1.2 }}
                >
                    Assign Assets
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, fontWeight: 500 }}>
                    Allocate hardware to registered personnel and track lifecycle
                </Typography>
            </div>

            <Grid container spacing={3}>
                {/* ── Left: Assign Form ── */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Card header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #f1f5f9',
                            background: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <FuseSvgIcon size={16} style={{ color: '#fff' }}>heroicons-outline:user-plus</FuseSvgIcon>
                            </div>
                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                New Assignment
                            </Typography>
                        </div>

                        {/* Form body */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <TextField
                                label="Select Asset"
                                select
                                fullWidth
                                size="small"
                                value={selectedAsset}
                                onChange={(e) => setSelectedAsset(Number(e.target.value))}
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 13 },
                                    '& .MuiInputLabel-root': { fontSize: 13 },
                                }}
                            >
                                <MenuItem value="" disabled><em style={{ fontSize: 13, color: '#94a3b8' }}>Choose an asset…</em></MenuItem>
                                {assets.map(asset => (
                                    <MenuItem key={asset.id} value={asset.id}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13 }}>{asset.brand} {asset.model}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Available: {asset.quantity}</div>
                                        </div>
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Assign To"
                                select
                                fullWidth
                                size="small"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 13 },
                                    '& .MuiInputLabel-root': { fontSize: 13 },
                                }}
                            >
                                <MenuItem value="" disabled><em style={{ fontSize: 13, color: '#94a3b8' }}>Choose a person…</em></MenuItem>
                                {users.map(user => (
                                    <MenuItem key={user.id} value={user.id} sx={{ fontSize: 13, fontWeight: 600 }}>
                                        {user.name}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Quantity"
                                type="number"
                                fullWidth
                                size="small"
                                value={assignQuantity}
                                onChange={(e) => setAssignQuantity(Number(e.target.value))}
                                inputProps={{ min: 1 }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 13 },
                                    '& .MuiInputLabel-root': { fontSize: 13 },
                                }}
                            />

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleAssign}
                                disabled={assignMutation.isPending}
                                startIcon={<FuseSvgIcon size={16}>heroicons-outline:check-circle</FuseSvgIcon>}
                                sx={{
                                    borderRadius: '10px',
                                    py: 1.25,
                                    fontWeight: 700,
                                    fontSize: 13,
                                    textTransform: 'none',
                                    mt: 0.5,
                                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                                    '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #1e40af)', boxShadow: '0 4px 18px rgba(37,99,235,0.45)' },
                                    '&:disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' },
                                }}
                            >
                                {assignMutation.isPending ? 'Assigning…' : 'Confirm Assignment'}
                            </Button>
                        </div>
                    </Paper>
                </Grid>

                {/* ── Right: Assignment History ── */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper
                        elevation={0}
                        sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}
                    >
                        {/* Table header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #f1f5f9',
                            background: '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FuseSvgIcon size={16} style={{ color: '#fff' }}>heroicons-outline:clipboard-document-list</FuseSvgIcon>
                                </div>
                                <Typography sx={{ fontWeight: 800, fontSize: 13, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Assignment History
                                </Typography>
                            </div>
                            {assignments.length > 0 && (
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: '#7c3aed',
                                    background: '#f3e8ff', padding: '2px 10px', borderRadius: 20,
                                }}>
                                    {assignments.length} record{assignments.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
                            </div>
                        ) : assignments.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: '50%',
                                    background: '#f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FuseSvgIcon size={28} style={{ color: '#cbd5e1' }}>heroicons-outline:user-group</FuseSvgIcon>
                                </div>
                                <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>No assignments yet</Typography>
                                <Typography sx={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                                    Use the form on the left to assign an asset to a team member.
                                </Typography>
                            </div>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ '& th': { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' } }}>
                                            {['Asset', 'Assigned To', 'Qty', 'Date', 'Status', ''].map(h => (
                                                <TableCell key={h} sx={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', py: 1.5, px: 2.5 }}>
                                                    {h}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {assignments.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                sx={{
                                                    '&:hover': { background: '#f8fafc' },
                                                    '& td': { borderBottom: '1px solid #f1f5f9', py: 1.5, px: 2.5 },
                                                }}
                                            >
                                                <TableCell>
                                                    <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{row.inventory?.brand} {row.inventory?.model}</div>
                                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{row.inventory?.category}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{
                                                            width: 26, height: 26, borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0,
                                                        }}>
                                                            {row.user?.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{row.user?.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span style={{
                                                        fontSize: 12, fontWeight: 800, color: '#1e293b',
                                                        background: '#f1f5f9', padding: '2px 8px', borderRadius: 6,
                                                    }}>
                                                        ×{row.quantity}
                                                    </span>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                                                    {format(new Date(row.assigned_at), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                                                        padding: '3px 10px', borderRadius: 20,
                                                        background: row.status === 'active' ? '#dcfce7' : '#f1f5f9',
                                                        color: row.status === 'active' ? '#16a34a' : '#94a3b8',
                                                        letterSpacing: '0.05em',
                                                    }}>
                                                        {row.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell align="right">
                                                    {row.status === 'active' && (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => returnMutation.mutate(row.id)}
                                                            sx={{
                                                                fontSize: 10, fontWeight: 700, borderRadius: '8px',
                                                                textTransform: 'none', py: 0.25, px: 1.5,
                                                                borderColor: '#f59e0b', color: '#d97706',
                                                                '&:hover': { background: '#fef3c7', borderColor: '#f59e0b' },
                                                            }}
                                                        >
                                                            Return
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}
