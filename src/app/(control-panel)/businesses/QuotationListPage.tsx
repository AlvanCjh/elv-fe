import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from '@/utils/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { motion } from 'motion/react';

export default function QuotationListPage() {
    const navigate = useNavigate();
    const [tenders, setTenders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('tenders').json<any[]>()
            .then(data => setTenders(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = tenders.filter(t => {
        const q = search.toLowerCase();
        return !q
            || (t.internal_quotation || '').toLowerCase().includes(q)
            || (t.project_title || '').toLowerCase().includes(q)
            || (t.customer || '').toLowerCase().includes(q)
            || (t.project_code || '').toLowerCase().includes(q);
    });

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: 42, height: 42, borderRadius: 2.5, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ReceiptLongIcon sx={{ color: '#fff', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Quotations</Typography>
                            <Typography variant="caption" color="text.secondary">
                                View and print quotation documents for all tenders
                            </Typography>
                        </Box>
                    </Box>
                    <TextField
                        size="small"
                        placeholder="Search quotation, project, customer..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        sx={{ width: 320, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }}
                    />
                </Box>
            </motion.div>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
                        <ReceiptLongIcon sx={{ fontSize: 56, opacity: 0.15, mb: 2, display: 'block', mx: 'auto' }} />
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            {search ? 'No matching quotations' : 'No tenders found'}
                        </Typography>
                        <Typography variant="body2">
                            {search ? 'Try a different search term.' : 'Create a tender first to generate quotations.'}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                        {filtered.map((tender, idx) => (
                            <motion.div
                                key={tender.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5, borderRadius: 3,
                                        border: '1px solid', borderColor: 'divider',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                        '&:hover': { borderColor: '#2563eb', boxShadow: '0 4px 20px rgba(37,99,235,0.12)', transform: 'translateY(-2px)' }
                                    }}
                                    onClick={() => navigate(`/businesses/tenders/${tender.id}/quotation`)}
                                >
                                    {/* Top row */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                        <Box sx={{
                                            px: 1.5, py: 0.5, borderRadius: 1.5, bgcolor: '#eff6ff',
                                            color: '#1d4ed8', fontSize: 11, fontWeight: 800, fontFamily: 'monospace'
                                        }}>
                                            {tender.internal_quotation || `#${tender.id}`}
                                        </Box>
                                        {tender.company && (
                                            <Chip label={tender.company} size="small"
                                                sx={{ fontWeight: 700, fontSize: 10, height: 22 }} />
                                        )}
                                    </Box>

                                    {/* Project title */}
                                    <Typography fontWeight={700} sx={{ mb: 0.75, fontSize: 14, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {tender.project_title || 'Untitled Project'}
                                    </Typography>

                                    {/* Customer */}
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: 12 }}>
                                        {tender.customer || '—'}
                                    </Typography>

                                    {/* Meta info */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                        <Box sx={{ fontSize: 11, color: 'text.secondary' }}>
                                            {tender.date || '—'}
                                        </Box>
                                        {tender.sales_price != null && (
                                            <Box sx={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                                                RM {Number(tender.sales_price).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Open button */}
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                                        onClick={e => { e.stopPropagation(); navigate(`/businesses/tenders/${tender.id}/quotation`); }}
                                        sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700, borderRadius: 2, fontSize: 12 }}
                                    >
                                        View Quotation
                                    </Button>
                                </Paper>
                            </motion.div>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
