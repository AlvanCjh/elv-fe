import { useParams, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import api from '@/utils/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';
import TenderCostingReportDialog from './components/TenderCostingReportDialog';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Checkbox from '@mui/material/Checkbox';
import InputAdornment from '@mui/material/InputAdornment';

const SUCCESS_RATES = [
    { value: '10% Submission', color: '#991b1b', bgcolor: '#fee2e2' },
    { value: '50%, Project created by us', color: '#9a3412', bgcolor: '#ffedd5' },
    { value: '75%, Negotiated & High Chance to award', color: '#3f6212', bgcolor: '#ecfccb' },
    { value: '100%, Pending Official Award', color: '#065f46', bgcolor: '#d1fae5' },
];

export default function TenderCostingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tender, setTender] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    
    const { authState } = useAuth();
    const currentUser = authState?.user;
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    
    const canEdit = tender && (!tender.creator || (currentUser && tender.creator.id == (currentUser as any).id) || (currentUser as any)?.role === 'admin');
    
    // Tender Summary Form
    const [form, setForm] = useState({
        internal_quotation: '',
        sales_price: '',
        cost_price: '',
        submission_date: '',
        success_rate: ''
    });

    // New Item Form
    const [newItem, setNewItem] = useState({
        item_name: '', details: '', quotation_breakdown: '', quantity: 1, unit_cost: 0, unit_price: 0, markup: 0, has_sst: false, has_costing_sst: false
    });

    // Input text states for formatting
    const [unitCostStr, setUnitCostStr] = useState('');
    const [salesPriceStr, setSalesPriceStr] = useState('');
    const [costPriceStr, setCostPriceStr] = useState('');

    const parseCurrency = (val: string): number => {
        const cleaned = val.replace(/,/g, '');
        return cleaned === '' ? 0 : Number(cleaned);
    };

    const formatCurrency = (val: string | number): string => {
        if (val === undefined || val === null || val === '') return '';
        let clean = String(val).replace(/[^0-9.]/g, '');
        const parts = clean.split('.');
        if (parts.length > 2) {
            clean = parts[0] + '.' + parts.slice(1).join('');
        }
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        if (clean.includes('.')) {
            const decimalPart = parts[1] !== undefined ? parts[1].slice(0, 2) : '';
            return `${integerPart}.${decimalPart}`;
        }
        return integerPart;
    };

    const handleNewItemCostChange = (costVal: number) => {
        setNewItem(prev => {
            const cost = costVal;
            const price = cost * (1 + prev.markup / 100);
            return {
                ...prev,
                unit_cost: cost,
                unit_price: Number(price.toFixed(2))
            };
        });
    };

    const handleNewItemMarkupChange = (markupVal: number) => {
        setNewItem(prev => {
            const markup = markupVal;
            const price = prev.unit_cost * (1 + markup / 100);
            return {
                ...prev,
                markup: markup,
                unit_price: Number(price.toFixed(2))
            };
        });
    };

    const handleNewItemPriceChange = (priceVal: number) => {
        setNewItem(prev => {
            const price = priceVal;
            const markup = prev.unit_cost > 0 ? ((price - prev.unit_cost) / prev.unit_cost) * 100 : 0;
            return {
                ...prev,
                unit_price: price,
                markup: Number(markup.toFixed(2))
            };
        });
    };

    useEffect(() => {
        if (id) {
            api.get(`tenders/${id}`).json().then(data => {
                setTender(data);
                const salesVal = (data as any).sales_price || '';
                const costVal = (data as any).cost_price || '';
                setForm({
                    internal_quotation: (data as any).internal_quotation || '',
                    sales_price: String(salesVal),
                    cost_price: String(costVal),
                    submission_date: (data as any).submission_date || '',
                    success_rate: (data as any).success_rate || ''
                });
                setSalesPriceStr(salesVal ? Number(salesVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
                setCostPriceStr(costVal ? Number(costVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
            }).catch(console.error);

            fetchItems();
        }
    }, [id]);

    const fetchItems = () => {
        api.get(`tenders/${id}/costing-items`).json().then(data => setItems(data as any[])).catch(console.error);
    };

    const handleSaveSummary = async () => {
        setSaving(true);
        try {
            const payload: any = { 
                internal_quotation: form.internal_quotation || null,
                submission_date: form.submission_date || null,
                success_rate: form.success_rate || null
            };
            if (items.length === 0) {
                const rawSales = String(form.sales_price).replace(/,/g, '');
                const rawCost = String(form.cost_price).replace(/,/g, '');
                payload.sales_price = rawSales !== '' ? Number(rawSales) : null;
                payload.cost_price = rawCost !== '' ? Number(rawCost) : null;
                payload.margin = (payload.sales_price || 0) - (payload.cost_price || 0);
            }

            const res = await api.put(`tenders/${id}`, { json: payload }).json();
            setTender(res);
            setIsEditing(false);
        } catch (e: any) {
            console.error(e);
            if (e.response) {
                const errJson = await e.response.json().catch(() => ({}));
                console.error("API Error details:", errJson);
                alert("Save failed: " + (errJson.message || e.message));
            } else {
                alert("Save failed: " + e.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancelSummary = () => {
        if (tender) {
            const salesVal = tender.sales_price || '';
            const costVal = tender.cost_price || '';
            setForm({
                internal_quotation: tender.internal_quotation || '',
                sales_price: String(salesVal),
                cost_price: String(costVal),
                submission_date: tender.submission_date || '',
                success_rate: tender.success_rate || ''
            });
            setSalesPriceStr(salesVal ? Number(salesVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
            setCostPriceStr(costVal ? Number(costVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
        }
        setIsEditing(false);
    };

    const handleAddItem = async () => {
        if (!newItem.item_name) return;
        try {
            await api.post(`tenders/${id}/costing-items`, { json: newItem });
            setNewItem({ item_name: '', details: '', quotation_breakdown: '', quantity: 1, unit_cost: 0, unit_price: 0, markup: 0, has_sst: false, has_costing_sst: false });
            setUnitCostStr('');
            fetchItems();
            // Refresh tender to get updated totals from backend calculation
            const updatedTender = await api.get(`tenders/${id}`).json();
            setTender(updatedTender);
            const salesVal = (updatedTender as any).sales_price || '';
            const costVal = (updatedTender as any).cost_price || '';
            setForm(prev => ({
                ...prev, 
                sales_price: String(salesVal), 
                cost_price: String(costVal) 
            }));
            setSalesPriceStr(salesVal ? Number(salesVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
            setCostPriceStr(costVal ? Number(costVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateItemField = async (item: any, fieldName: string, value: any) => {
        if (item[fieldName] === value) return;
        try {
            const updatedItem = {
                item_name: item.item_name,
                details: item.details,
                quotation_breakdown: item.quotation_breakdown,
                supplier: item.supplier,
                quantity: item.quantity,
                unit_cost: item.unit_cost,
                unit_price: item.unit_price,
                has_sst: !!item.has_sst,
                has_costing_sst: !!item.has_costing_sst,
                [fieldName]: value
            };
            
            await api.put(`tenders/${id}/costing-items/${item.id}`, {
                json: updatedItem
            });
            
            fetchItems();
            const updatedTender = await api.get(`tenders/${id}`).json();
            setTender(updatedTender);
            const salesVal = (updatedTender as any).sales_price || '';
            const costVal = (updatedTender as any).cost_price || '';
            setForm(prev => ({
                ...prev, 
                sales_price: String(salesVal), 
                cost_price: String(costVal) 
            }));
            setSalesPriceStr(salesVal ? Number(salesVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
            setCostPriceStr(costVal ? Number(costVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
        } catch (e) {
            console.error("Failed to update item field:", e);
        }
    };

    const handleToggleSst = async (item: any, field: 'has_sst' | 'has_costing_sst', checked: boolean) => {
        try {
            await api.put(`tenders/${id}/costing-items/${item.id}`, {
                json: {
                    item_name: item.item_name,
                    quantity: item.quantity,
                    unit_cost: item.unit_cost,
                    unit_price: item.unit_price,
                    has_sst: field === 'has_sst' ? checked : !!item.has_sst,
                    has_costing_sst: field === 'has_costing_sst' ? checked : !!item.has_costing_sst
                }
            });
            fetchItems();
            const updatedTender = await api.get(`tenders/${id}`).json();
            setTender(updatedTender);
            const salesVal = (updatedTender as any).sales_price || '';
            const costVal = (updatedTender as any).cost_price || '';
            setForm(prev => ({
                ...prev, 
                sales_price: String(salesVal), 
                cost_price: String(costVal) 
            }));
            setSalesPriceStr(salesVal ? Number(salesVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
            setCostPriceStr(costVal ? Number(costVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`tenders/${id}/costing-items/${itemId}`);
            fetchItems();
            const updatedTender = await api.get(`tenders/${id}`).json();
            setTender(updatedTender);
            const salesVal = (updatedTender as any).sales_price || '';
            const costVal = (updatedTender as any).cost_price || '';
            setForm(prev => ({
                ...prev, 
                sales_price: String(salesVal), 
                cost_price: String(costVal) 
            }));
            setSalesPriceStr(salesVal ? Number(salesVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
            setCostPriceStr(costVal ? Number(costVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
        } catch (e) {
            console.error(e);
        }
    };

    const sales = Number(form.sales_price) || 0;
    const cost = Number(form.cost_price) || 0;
    const margin = sales - cost;
    const marginPercent = sales > 0 ? ((margin / sales) * 100).toFixed(1) : 0;

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
            bgcolor: 'background.default',
        }}>
            {/* Page Header */}
            <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/businesses/tenders')} size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Tender Costing</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ mt: 0.25, display: 'block', color: 'text.secondary' }}>
                            Financial calculations and breakdown for Tender: {tender?.project_code || `ID ${id}`}
                        </Typography>
                    </Box>
                </Box>
                
                {tender && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" size="small" startIcon={<ReceiptLongIcon />}
                            onClick={() => navigate(`/businesses/tenders/${id}/quotation`)}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2 }}>
                            View Quotation
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<AssessmentIcon />} onClick={() => setReportOpen(true)}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2 }}>
                            View Report
                        </Button>
                        {!isEditing ? (
                            canEdit && (
                                <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2, background: '#10b981', '&:hover': { background: '#059669' } }}>
                                    Edit Summary
                                </Button>
                            )
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="outlined" size="small" startIcon={<CloseIcon />} onClick={handleCancelSummary} disabled={saving}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}>
                                    Cancel
                                </Button>
                                <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleSaveSummary} disabled={saving}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
                                    {saving ? 'Saving...' : 'Save'}
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* Content Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                {tender ? (
                    <>
                        {/* Summary Green Bar */}
                        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', mb: 4 }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Internal Quotation</th>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Sales Price (RM)</th>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Cost Price (RM)</th>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Margin (RM)</th>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Submission Date</th>
                                        <th style={{ padding: '12px 16px', background: '#2e7d32', color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'left' }}>Success Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${theme.palette.divider}`, fontSize: 14, fontWeight: 600 }}>
                                            {isEditing ? (
                                                <TextField size="small" fullWidth value={form.internal_quotation} onChange={e => setForm({ ...form, internal_quotation: e.target.value })}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 14 } }} />
                                            ) : (
                                                tender.internal_quotation || <span style={{ color: theme.palette.text.disabled, fontWeight: 400 }}>Not set</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${theme.palette.divider}` }}>
                                            {isEditing && items.length === 0 ? (
                                                <TextField size="small" fullWidth value={salesPriceStr}
                                                    onChange={e => {
                                                        const formatted = formatCurrency(e.target.value);
                                                        setSalesPriceStr(formatted);
                                                        setForm({ ...form, sales_price: String(parseCurrency(formatted)) });
                                                    }}
                                                    onBlur={() => {
                                                        if (salesPriceStr) {
                                                            const parsed = parseCurrency(salesPriceStr);
                                                            setSalesPriceStr(parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                                            setForm(prev => ({ ...prev, sales_price: String(parsed) }));
                                                        }
                                                    }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 14 } }} />
                                            ) : (
                                                <Typography variant="body2" fontWeight={600} sx={{ color: items.length > 0 && isEditing ? 'text.disabled' : 'inherit' }}>
                                                    {tender.sales_price ? `RM ${Number(tender.sales_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                                    {items.length > 0 && isEditing && <span style={{display:'block', fontSize: 10, fontWeight: 400}}>Auto-calculated from items</span>}
                                                </Typography>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${theme.palette.divider}` }}>
                                            {isEditing && items.length === 0 ? (
                                                <TextField size="small" fullWidth value={costPriceStr}
                                                    onChange={e => {
                                                        const formatted = formatCurrency(e.target.value);
                                                        setCostPriceStr(formatted);
                                                        setForm({ ...form, cost_price: String(parseCurrency(formatted)) });
                                                    }}
                                                    onBlur={() => {
                                                        if (costPriceStr) {
                                                            const parsed = parseCurrency(costPriceStr);
                                                            setCostPriceStr(parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                                                            setForm(prev => ({ ...prev, cost_price: String(parsed) }));
                                                        }
                                                    }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 14 } }} />
                                            ) : (
                                                <Typography variant="body2" fontWeight={600} sx={{ color: items.length > 0 && isEditing ? 'text.disabled' : 'inherit' }}>
                                                    {tender.cost_price ? `RM ${Number(tender.cost_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                                                    {items.length > 0 && isEditing && <span style={{display:'block', fontSize: 10, fontWeight: 400}}>Auto-calculated from items</span>}
                                                </Typography>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${theme.palette.divider}` }}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} sx={{ color: margin >= 0 ? '#10b981' : '#ef4444' }}>
                                                    RM {margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{marginPercent}%</Typography>
                                            </Box>
                                        </td>
                                        <td style={{ padding: '12px 16px', borderRight: `1px solid ${theme.palette.divider}` }}>
                                            {isEditing ? (
                                                <TextField size="small" fullWidth type="date" value={form.submission_date} onChange={e => setForm({ ...form, submission_date: e.target.value })}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 14 } }} />
                                            ) : (
                                                <Typography variant="body2">{tender.submission_date || '—'}</Typography>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {isEditing ? (
                                                <Select
                                                    size="small"
                                                    fullWidth
                                                    value={form.success_rate}
                                                    onChange={e => setForm({ ...form, success_rate: e.target.value as string })}
                                                    displayEmpty
                                                    sx={{ borderRadius: 1.5, fontSize: 13, '& .MuiSelect-select': { py: 1 } }}
                                                >
                                                    <MenuItem value="" disabled>Select Rate</MenuItem>
                                                    {SUCCESS_RATES.map(rate => (
                                                        <MenuItem key={rate.value} value={rate.value} sx={{ fontSize: 13, fontWeight: 500 }}>
                                                            <Box sx={{ display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, bgcolor: rate.bgcolor, color: rate.color }}>
                                                                {rate.value}
                                                            </Box>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            ) : (
                                                tender.success_rate ? (() => {
                                                    const rateDef = SUCCESS_RATES.find(r => r.value === tender.success_rate);
                                                    return (
                                                        <Box sx={{ 
                                                            display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: 13, fontWeight: 600,
                                                            bgcolor: rateDef ? rateDef.bgcolor : '#f1f5f9',
                                                            color: rateDef ? rateDef.color : '#475569'
                                                        }}>
                                                            {tender.success_rate}
                                                        </Box>
                                                    );
                                                })() : <Typography variant="body2">—</Typography>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Box>

                        {/* Costing Items Table */}
                        <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px" mb={2}>Costing Items Breakdown</Typography>
                        <Box sx={{ borderRadius: 2, overflowX: 'auto', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1500px' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '280px' }}>Specification</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '220px' }}>Details</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '220px' }}>Quotation Breakdown</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '100px' }}>Qty</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '140px' }}>Unit Cost (RM)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '120px' }}>Total Cost (RM)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '90px' }}>Cost SST</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '140px' }}>Unit Price (RM)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '120px' }}>Total Price (RM)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '90px' }}>Sales SST</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '110px' }}>Markup (%)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '100px' }}>Margin (%)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'left', borderBottom: `1px solid ${theme.palette.divider}`, width: '120px' }}>GP (RM)</th>
                                        <th style={{ padding: '12px 16px', background: isDark ? '#1e293b' : '#f8fafc', color: theme.palette.text.secondary, fontSize: 13, fontWeight: 600, textAlign: 'center', borderBottom: `1px solid ${theme.palette.divider}`, width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => {
                                        const totalCost = item.quantity * item.unit_cost;
                                        const totalPrice = item.quantity * item.unit_price;
                                        const gp = totalPrice - totalCost;
                                        const markup = totalCost > 0 ? (gp / totalCost) * 100 : 0;
                                        const margin = totalPrice > 0 ? (gp / totalPrice) * 100 : 0;
                                        return (
                                        <tr key={item.id}>
                                            {/* Specification (Item Name) - Editable, Long Text */}
                                            <td style={{ padding: '4px 8px', borderBottom: `1px solid ${theme.palette.divider}`, width: '280px' }}>
                                                <TextField
                                                    multiline
                                                    fullWidth
                                                    disabled={!canEdit}
                                                    defaultValue={item.item_name}
                                                    onBlur={e => handleUpdateItemField(item, 'item_name', e.target.value)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)' },
                                                        '& .MuiOutlinedInput-root': { padding: '4px 8px', fontSize: 13 }
                                                    }}
                                                />
                                            </td>
                                            {/* Details - Editable, Long Text */}
                                            <td style={{ padding: '4px 8px', borderBottom: `1px solid ${theme.palette.divider}`, width: '220px' }}>
                                                <TextField
                                                    multiline
                                                    fullWidth
                                                    disabled={!canEdit}
                                                    defaultValue={item.details || ''}
                                                    placeholder={canEdit ? "Add details..." : "—"}
                                                    onBlur={e => handleUpdateItemField(item, 'details', e.target.value)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)' },
                                                        '& .MuiOutlinedInput-root': { padding: '4px 8px', fontSize: 13 }
                                                    }}
                                                />
                                            </td>
                                            {/* Quotation Breakdown - Editable, Long Text */}
                                            <td style={{ padding: '4px 8px', borderBottom: `1px solid ${theme.palette.divider}`, width: '220px' }}>
                                                <TextField
                                                    multiline
                                                    fullWidth
                                                    disabled={!canEdit}
                                                    defaultValue={item.quotation_breakdown || ''}
                                                    placeholder={canEdit ? "Add breakdown..." : "—"}
                                                    onBlur={e => handleUpdateItemField(item, 'quotation_breakdown', e.target.value)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                                        '&:hover .MuiOutlinedInput-notchedOutline': { border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)' },
                                                        '& .MuiOutlinedInput-root': { padding: '4px 8px', fontSize: 13 }
                                                    }}
                                                />
                                            </td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{item.quantity}</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{Number(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14, fontWeight: 600 }}>{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td style={{ padding: '6px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                                                <Checkbox
                                                    checked={!!item.has_costing_sst}
                                                    disabled={!canEdit}
                                                    onChange={e => handleToggleSst(item, 'has_costing_sst', e.target.checked)}
                                                    size="small"
                                                    sx={{ p: 0.5 }}
                                                />
                                            </td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14, fontWeight: 600, color: '#10b981' }}>{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td style={{ padding: '6px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>
                                                <Checkbox
                                                    checked={!!item.has_sst}
                                                    disabled={!canEdit}
                                                    onChange={e => handleToggleSst(item, 'has_sst', e.target.checked)}
                                                    size="small"
                                                    sx={{ p: 0.5 }}
                                                />
                                            </td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{markup.toFixed(2)}%</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14 }}>{margin.toFixed(2)}%</td>
                                            <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}`, fontSize: 14, fontWeight: 600, color: gp >= 0 ? '#10b981' : '#ef4444' }}>{gp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td style={{ padding: '8px', borderBottom: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
                                                {canEdit && (
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteItem(item.id)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </td>
                                        </tr>
                                    )})}
                                    
                                    {/* Add New Item Row */}
                                    {canEdit && (() => {
                                         const newTotalCost = newItem.quantity * newItem.unit_cost;
                                         const newTotalPrice = newItem.quantity * newItem.unit_price;
                                         const newGp = newTotalPrice - newTotalCost;
                                         const newMargin = newTotalPrice > 0 ? (newGp / newTotalPrice) * 100 : 0;
                                         return (
                                         <tr style={{ background: isDark ? '#1e293b' : '#f8fafc' }}>
                                         {/* Specification (Item Name) Input - Multi-line */}
                                         <td style={{ padding: '8px 12px', width: '280px' }}>
                                             <TextField
                                                 multiline
                                                 minRows={1}
                                                 maxRows={4}
                                                 size="small"
                                                 fullWidth
                                                 placeholder="Specification (long text)..."
                                                 value={newItem.item_name}
                                                 onChange={e => setNewItem({...newItem, item_name: e.target.value})}
                                                 sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontSize: 13 } }}
                                             />
                                         </td>
                                         {/* Details Input - Multi-line */}
                                         <td style={{ padding: '8px 12px', width: '220px' }}>
                                             <TextField
                                                 multiline
                                                 minRows={1}
                                                 maxRows={4}
                                                 size="small"
                                                 fullWidth
                                                 placeholder="Details..."
                                                 value={newItem.details}
                                                 onChange={e => setNewItem({...newItem, details: e.target.value})}
                                                 sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontSize: 13 } }}
                                             />
                                         </td>
                                         {/* Quotation Breakdown Input - Multi-line */}
                                         <td style={{ padding: '8px 12px', width: '220px' }}>
                                             <TextField
                                                 multiline
                                                 minRows={1}
                                                 maxRows={4}
                                                 size="small"
                                                 fullWidth
                                                 placeholder="Breakdown..."
                                                 value={newItem.quotation_breakdown}
                                                 onChange={e => setNewItem({...newItem, quotation_breakdown: e.target.value})}
                                                 sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontSize: 13 } }}
                                             />
                                         </td>
                                         <td style={{ padding: '8px 8px', minWidth: '90px', width: '100px' }}>
                                             <TextField size="small" fullWidth type="number" 
                                                 value={newItem.quantity === 0 ? '' : newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} onFocus={e => e.target.select()}
                                                 sx={{ 
                                                     '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontSize: 13 },
                                                     '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                                         '-webkit-appearance': 'none',
                                                         margin: 0
                                                     },
                                                     '& input[type=number]': {
                                                         '-moz-appearance': 'textfield'
                                                     }
                                                 }} />
                                         </td>
                                         <td style={{ padding: '8px 8px', minWidth: '130px', width: '140px' }}>
                                             <TextField size="small" fullWidth 
                                                 value={unitCostStr} onChange={e => { const formatted = formatCurrency(e.target.value); setUnitCostStr(formatted); handleNewItemCostChange(parseCurrency(formatted)); }} onBlur={() => { if (unitCostStr) { const parsed = parseCurrency(unitCostStr); setUnitCostStr(parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })); } }} onFocus={e => e.target.select()}
                                                 slotProps={{ input: { startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: 12 } }}>RM</InputAdornment> } }}
                                                 sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontSize: 13 } }} />
                                         </td>
                                         <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>
                                             {newTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                         </td>
                                         <td style={{ padding: '6px 16px', textAlign: 'center' }}>
                                             <Checkbox
                                                 checked={newItem.has_costing_sst}
                                                 onChange={e => setNewItem({ ...newItem, has_costing_sst: e.target.checked })}
                                                 size="small"
                                                 sx={{ p: 0.5 }}
                                             />
                                         </td>
                                         <td style={{ padding: '8px 8px', minWidth: '130px', width: '140px' }}>
                                             <TextField size="small" fullWidth 
                                                 value={newItem.unit_price === 0 ? '' : newItem.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                 slotProps={{ input: { readOnly: true, startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: 12 } }}>RM</InputAdornment> } }}
                                                 sx={{ '& .MuiOutlinedInput-root': { bgcolor: isDark ? '#334155' : '#f1f5f9', fontSize: 13 } }} />
                                         </td>
                                         <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                                             {newTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                         </td>
                                         <td style={{ padding: '6px 16px', textAlign: 'center' }}>
                                             <Checkbox
                                                 checked={newItem.has_sst}
                                                 onChange={e => setNewItem({ ...newItem, has_sst: e.target.checked })}
                                                 size="small"
                                                 sx={{ p: 0.5 }}
                                             />
                                         </td>
                                         <td style={{ padding: '8px 8px', minWidth: '100px', width: '110px' }}>
                                             <TextField size="small" fullWidth type="number" 
                                                 value={newItem.markup === 0 ? '' : newItem.markup} onChange={e => handleNewItemMarkupChange(Number(e.target.value))} onFocus={e => e.target.select()}
                                                 slotProps={{ input: { endAdornment: <InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontSize: 12 } }}>%</InputAdornment> } }}
                                                 sx={{ 
                                                     '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontSize: 13 },
                                                     '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                                         '-webkit-appearance': 'none',
                                                         margin: 0
                                                     },
                                                     '& input[type=number]': {
                                                         '-moz-appearance': 'textfield'
                                                     }
                                                 }} />
                                         </td>
                                         <td style={{ padding: '12px 16px', fontSize: 14 }}>{newMargin.toFixed(2)}%</td>
                                         <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: newGp >= 0 ? '#10b981' : '#ef4444' }}>
                                             {newGp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                         </td>
                                         <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                             <IconButton size="small" sx={{ bgcolor: '#2563eb', color: '#fff', '&:hover': { bgcolor: '#1d4ed8' } }} 
                                                 onClick={handleAddItem} disabled={!newItem.item_name}>
                                                 <AddIcon fontSize="small" />
                                             </IconButton>
                                         </td>
                                     </tr>
                                     );
                                     })()}
                                </tbody>
                            </table>
                        </Box>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <Typography color="text.secondary">Loading costing data...</Typography>
                    </Box>
                )}
            </Box>

            <TenderCostingReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                tender={tender}
                items={items}
                currentUser={currentUser}
                onVerify={(signature) => {
                    api.post(`tenders/${id}/verify`, { json: { signature } }).json().then(() => {
                        setReportOpen(false);
                        window.location.reload();
                    });
                }}
                onApprove={(signature) => {
                    api.post(`tenders/${id}/approve`, { json: { signature } }).json().then(() => {
                        setReportOpen(false);
                        window.location.reload();
                    });
                }}
            />
        </Box>
    );
}
