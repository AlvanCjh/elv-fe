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
}

interface StockIn {
    id: number;
    business_inventory_id: number;
    user_id: number;
    quantity: number;
    created_at: string;
    inventory: InventoryItem;
    user: User;
}

export default function StockInPage() {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const [selectedAsset, setSelectedAsset] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number>(1);

    const { data: assets = [] } = useQuery({
        queryKey: ['business-inventory'],
        queryFn: () => api.get('business-inventory').json() as Promise<InventoryItem[]>,
    });

    const { data: stockIns = [], isLoading } = useQuery({
        queryKey: ['inventory-stock-ins'],
        queryFn: () => api.get('inventory-stock-ins').json() as Promise<StockIn[]>,
    });

    const stockInMutation = useMutation({
        mutationFn: (data: any) => api.post('inventory-stock-ins', { json: data }).json(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-stock-ins'] });
            queryClient.invalidateQueries({ queryKey: ['business-inventory'] });
            setSelectedAsset('');
            setQuantity(1);
            enqueueSnackbar('Stock added successfully', { variant: 'success' });
        }
    });

    const handleStockIn = () => {
        if (!selectedAsset || quantity < 1) {
            enqueueSnackbar('Please fill all fields', { variant: 'warning' });
            return;
        }
        stockInMutation.mutate({
            business_inventory_id: selectedAsset,
            quantity
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
                    Stock In
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, fontWeight: 500 }}>
                    Record new stock acquisitions and track replenishment history
                </Typography>
            </div>

            <Grid container spacing={3}>
                {/* ── Left: Add Stock Form ── */}
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
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <FuseSvgIcon size={16} style={{ color: '#fff' }}>heroicons-outline:plus-circle</FuseSvgIcon>
                            </div>
                            <Typography sx={{ fontWeight: 800, fontSize: 13, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Add New Stock
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
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Current stock: {asset.quantity}</div>
                                        </div>
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Quantity to Add"
                                type="number"
                                fullWidth
                                size="small"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                inputProps={{ min: 1 }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 13 },
                                    '& .MuiInputLabel-root': { fontSize: 13 },
                                }}
                            />

                            {/* Preview badge */}
                            {selectedAsset && quantity > 0 && (
                                <div style={{
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: 10,
                                    padding: '10px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                    <FuseSvgIcon size={14} style={{ color: '#16a34a', flexShrink: 0 }}>heroicons-outline:arrow-trending-up</FuseSvgIcon>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
                                        Adding <strong>+{quantity}</strong> unit{quantity !== 1 ? 's' : ''} to stock
                                    </span>
                                </div>
                            )}

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleStockIn}
                                disabled={stockInMutation.isPending}
                                startIcon={<FuseSvgIcon size={16}>heroicons-outline:inbox-arrow-down</FuseSvgIcon>}
                                sx={{
                                    borderRadius: '10px',
                                    py: 1.25,
                                    fontWeight: 700,
                                    fontSize: 13,
                                    textTransform: 'none',
                                    mt: 0.5,
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                                    '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 4px 18px rgba(16,185,129,0.45)' },
                                    '&:disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' },
                                }}
                            >
                                {stockInMutation.isPending ? 'Processing…' : 'Add Stock'}
                            </Button>
                        </div>
                    </Paper>
                </Grid>

                {/* ── Right: Stock In Logs ── */}
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
                                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FuseSvgIcon size={16} style={{ color: '#fff' }}>heroicons-outline:queue-list</FuseSvgIcon>
                                </div>
                                <Typography sx={{ fontWeight: 800, fontSize: 13, color: '#334155', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Stock In Logs
                                </Typography>
                            </div>
                            {stockIns.length > 0 && (
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: '#0284c7',
                                    background: '#e0f2fe', padding: '2px 10px', borderRadius: 20,
                                }}>
                                    {stockIns.length} entr{stockIns.length !== 1 ? 'ies' : 'y'}
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500" />
                            </div>
                        ) : stockIns.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: '50%',
                                    background: '#f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <FuseSvgIcon size={28} style={{ color: '#cbd5e1' }}>heroicons-outline:inbox</FuseSvgIcon>
                                </div>
                                <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#64748b' }}>No stock-in records yet</Typography>
                                <Typography sx={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                                    Use the form on the left to record your first stock addition.
                                </Typography>
                            </div>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ '& th': { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' } }}>
                                            {['Asset', 'Added By', 'Qty', 'Date'].map(h => (
                                                <TableCell key={h} sx={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', py: 1.5, px: 2.5 }}>
                                                    {h}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {stockIns.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                sx={{
                                                    '&:hover': { background: '#f8fafc' },
                                                    '& td': { borderBottom: '1px solid #f1f5f9', py: 1.5, px: 2.5 },
                                                }}
                                            >
                                                <TableCell>
                                                    <div style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{row.inventory?.brand} {row.inventory?.model}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{
                                                            width: 26, height: 26, borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #10b981, #059669)',
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
                                                        fontSize: 12, fontWeight: 800,
                                                        color: '#059669',
                                                        background: '#dcfce7', padding: '2px 10px', borderRadius: 6,
                                                    }}>
                                                        +{row.quantity}
                                                    </span>
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                                                    {format(new Date(row.created_at), 'dd MMM yyyy, HH:mm')}
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
