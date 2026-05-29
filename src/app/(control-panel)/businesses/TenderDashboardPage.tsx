import { useState, useMemo, useEffect } from 'react';
import api from '@/utils/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { alpha } from '@mui/material/styles';
import { motion } from 'motion/react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useNavigate } from 'react-router';
import { useMasterList, MasterListItem } from './context/MasterListContext';

// ── Types ─────────────────────────────────────────────────────────
type Tender = {
    id: string;
    date: string;
    projectCode: string;
    status: string;
    type: string;
    company: string;
    customer: string;
    projectTitle: string;
    salesPrice?: number;
    costPrice?: number;
    margin?: number;
};

function fromApi(raw: any): Tender {
    return {
        id: String(raw.id),
        date: raw.date ?? '',
        projectCode: raw.project_code ?? '',
        status: raw.status ?? '',
        type: raw.type ?? '',
        company: raw.company ?? '',
        customer: raw.customer ?? '',
        projectTitle: raw.project_title ?? '',
        salesPrice: raw.sales_price != null ? Number(raw.sales_price) : undefined,
        costPrice: raw.cost_price != null ? Number(raw.cost_price) : undefined,
        margin: raw.margin != null ? Number(raw.margin) : undefined,
    };
}

// ── Format helpers ────────────────────────────────────────────────
const fmtRM = (n: number) => `RM ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

// ── KPI Card ──────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color, delay }: {
    label: string; value: string; sub?: string; icon: React.ReactNode; color: string; delay: number;
}) {
    return (
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45 }}>
                <Box sx={{
                    position: 'relative', overflow: 'hidden',
                    bgcolor: 'background.paper', borderRadius: 4,
                    border: '1px solid', borderColor: 'divider',
                    p: 3, height: '100%',
                    transition: 'box-shadow 0.3s',
                    '&:hover': { boxShadow: `0 8px 32px ${alpha(color, 0.18)}` },
                }}>
                    <Box sx={{
                        position: 'absolute', top: -16, right: -16, width: 80, height: 80,
                        borderRadius: '50%', bgcolor: alpha(color, 0.08),
                    }} />
                    <Box sx={{
                        width: 44, height: 44, borderRadius: 3,
                        bgcolor: alpha(color, 0.12), color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
                        {label}
                    </Typography>
                    <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-1px', mt: 0.5, color: 'text.primary' }}>
                        {value}
                    </Typography>
                    {sub && (
                        <Typography variant="caption" fontWeight={600} sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                            {sub}
                        </Typography>
                    )}
                </Box>
            </motion.div>
        </Grid>
    );
}

// ── Status Card ───────────────────────────────────────────────────
function StatusCard({ label, count, total, color, sales, cost, gp, marginPct, tenders, delay, onClick }: {
    label: string; count: number; total: number; color: string;
    sales: number; cost: number; gp: number; marginPct: number;
    tenders: Tender[]; delay: number; onClick: () => void;
}) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.4 }}>
                <Box onClick={onClick} sx={{
                    bgcolor: 'background.paper', borderRadius: 4,
                    border: '1px solid', borderColor: 'divider',
                    p: 2.5, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    transition: 'all 0.3s',
                    '&:hover': {
                        borderColor: color, boxShadow: `0 8px 24px ${alpha(color, 0.2)}`,
                        transform: 'translateY(-3px)',
                    },
                }}>
                    {/* Top accent */}
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: color }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Chip label={label} size="small" sx={{
                            bgcolor: color, color: '#fff', fontWeight: 800, fontSize: 11,
                            height: 26, letterSpacing: '0.02em',
                        }} />
                        <Typography variant="h5" fontWeight={900} sx={{ color }}>{count}</Typography>
                    </Box>

                    {/* Progress bar */}
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">{pct.toFixed(0)}% of total</Typography>
                            <Typography variant="caption" fontWeight={700} color="text.disabled">{count}/{total}</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct} sx={{
                            height: 6, borderRadius: 3, bgcolor: alpha(color, 0.1),
                            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
                        }} />
                    </Box>

                    {/* Financial summary */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>Sales</Typography>
                            <Typography variant="caption" fontWeight={700}>{fmtRM(sales)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>Cost</Typography>
                            <Typography variant="caption" fontWeight={700}>{fmtRM(cost)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: gp >= 0 ? '#10b981' : '#ef4444' }}>
                                GP: {fmtRM(gp)}
                            </Typography>
                            <Typography variant="caption" fontWeight={700} sx={{ color: '#3b82f6' }}>
                                {fmtPct(marginPct)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Recent projects */}
                    {tenders.length > 0 && (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                            {tenders.slice(0, 3).map(t => (
                                <Typography key={t.id} variant="caption" sx={{
                                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap', color: 'text.secondary', fontSize: 10, lineHeight: 1.8,
                                }}>
                                    <span style={{ fontWeight: 700, color: color }}>{t.projectCode}</span> — {t.projectTitle || 'Untitled'}
                                </Typography>
                            ))}
                            {tenders.length > 3 && (
                                <Typography variant="caption" fontWeight={600} sx={{ color: 'text.disabled', fontSize: 10 }}>
                                    +{tenders.length - 3} more
                                </Typography>
                            )}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: 1 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ color, fontSize: 10, mr: 0.5 }}>View tenders</Typography>
                        <ArrowForwardIcon sx={{ fontSize: 12, color }} />
                    </Box>
                </Box>
            </motion.div>
        </Grid>
    );
}

// ── Distribution Bar ──────────────────────────────────────────────
function DistributionSection({ title, icon, items }: {
    title: string; icon: React.ReactNode;
    items: { label: string; count: number; color: string; sales: number }[];
}) {
    const maxCount = Math.max(...items.map(i => i.count), 1);
    return (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <Box sx={{ color: '#6366f1', display: 'flex' }}>{icon}</Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11, color: 'text.secondary' }}>
                    {title}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {items.filter(i => i.count > 0).map((item, idx) => (
                    <Box key={idx}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                                <Typography variant="body2" fontWeight={600} sx={{ fontSize: 12 }}>{item.label}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="caption" fontWeight={600} color="text.disabled">{fmtRM(item.sales)}</Typography>
                                <Chip label={item.count} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: alpha(item.color, 0.12), color: item.color }} />
                            </Box>
                        </Box>
                        <LinearProgress variant="determinate" value={(item.count / maxCount) * 100} sx={{
                            height: 4, borderRadius: 2, bgcolor: alpha(item.color, 0.08),
                            '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 2 },
                        }} />
                    </Box>
                ))}
                {items.filter(i => i.count > 0).length === 0 && (
                    <Typography variant="caption" color="text.disabled">No data available</Typography>
                )}
            </Box>
        </Box>
    );
}

// ── Recent Tenders ────────────────────────────────────────────────
function RecentTenders({ tenders, statusItems }: { tenders: Tender[]; statusItems: MasterListItem[] }) {
    const recent = [...tenders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
    const getColor = (status: string) => statusItems.find(s => s.label === status)?.color || '#64748b';

    return (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <Box sx={{ color: '#f59e0b', display: 'flex' }}><CalendarMonthIcon sx={{ fontSize: 18 }} /></Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11, color: 'text.secondary' }}>
                    Recent Tenders
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {recent.map((t, idx) => (
                    <Box key={t.id} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, py: 1, px: 1.5, borderRadius: 2,
                        transition: 'background 0.2s',
                        '&:hover': { bgcolor: alpha('#000', 0.03) },
                        borderBottom: idx < recent.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
                    }}>
                        <Typography variant="caption" fontWeight={600} sx={{ color: 'text.disabled', fontSize: 10, minWidth: 70 }}>
                            {t.date}
                        </Typography>
                        <Typography variant="caption" fontWeight={800} sx={{ color: getColor(t.status), minWidth: 75 }}>
                            {t.projectCode}
                        </Typography>
                        <Typography variant="caption" fontWeight={500} sx={{
                            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary', fontSize: 11,
                        }}>
                            {t.projectTitle || '—'}
                        </Typography>
                        <Chip label={t.status || '—'} size="small" sx={{
                            height: 20, fontSize: 9, fontWeight: 800,
                            bgcolor: alpha(getColor(t.status), 0.12), color: getColor(t.status),
                        }} />
                        <Typography variant="caption" fontWeight={700} sx={{ minWidth: 80, textAlign: 'right', fontSize: 11 }}>
                            {t.salesPrice ? fmtRM(t.salesPrice) : '—'}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function TenderDashboardPage() {
    const navigate = useNavigate();
    const { data: masterData, loading: masterLoading } = useMasterList();
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const fetchTenders = (isInitial = false) => {
            if (isInitial) setLoading(true);
            api.get('tenders').json<any[]>()
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

    // ── Computed stats ────────────────────────────────────────────
    const stats = useMemo(() => {
        const totalSales = tenders.reduce((s, t) => s + (t.salesPrice || 0), 0);
        const totalCost = tenders.reduce((s, t) => s + (t.costPrice || 0), 0);
        const gp = totalSales - totalCost;
        const marginPct = totalSales > 0 ? (gp / totalSales) * 100 : 0;
        return { totalSales, totalCost, gp, marginPct };
    }, [tenders]);

    const statusBreakdown = useMemo(() => {
        return (masterData?.status || []).map(s => {
            const list = tenders.filter(t => t.status === s.label);
            const sales = list.reduce((a, t) => a + (t.salesPrice || 0), 0);
            const cost = list.reduce((a, t) => a + (t.costPrice || 0), 0);
            const gp = sales - cost;
            const marginPct = sales > 0 ? (gp / sales) * 100 : 0;
            return { label: s.label, color: s.color || '#64748b', count: list.length, sales, cost, gp, marginPct, tenders: list };
        });
    }, [tenders, masterData?.status]);

    const companyBreakdown = useMemo(() => {
        return (masterData?.company || []).map(c => {
            const list = tenders.filter(t => t.company === c.label);
            const sales = list.reduce((a, t) => a + (t.salesPrice || 0), 0);
            return { label: c.label, color: c.color || '#6366f1', count: list.length, sales };
        });
    }, [tenders, masterData?.company]);

    const typeBreakdown = useMemo(() => {
        return (masterData?.type || []).map(tp => {
            const list = tenders.filter(t => t.type === tp.label);
            const sales = list.reduce((a, t) => a + (t.salesPrice || 0), 0);
            return { label: tp.label, color: tp.color || '#64748b', count: list.length, sales };
        });
    }, [tenders, masterData?.type]);

    const customerBreakdown = useMemo(() => {
        const map = new Map<string, { count: number; sales: number }>();
        tenders.forEach(t => {
            if (!t.customer) return;
            const prev = map.get(t.customer) || { count: 0, sales: 0 };
            map.set(t.customer, { count: prev.count + 1, sales: prev.sales + (t.salesPrice || 0) });
        });
        return Array.from(map.entries())
            .map(([label, { count, sales }]) => {
                const found = (masterData?.customer || []).find(c => c.label === label);
                return { label, color: found?.color || '#0ea5e9', count, sales };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [tenders, masterData?.customer]);

    if (loading || masterLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <CircularProgress size={40} sx={{ color: '#6366f1' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', overflow: 'auto', bgcolor: 'background.default' }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>

                {/* ── Page Header ── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="h4" fontWeight={900} letterSpacing="-1px">
                                Tender <span style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Analytics</span>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                                Overview of all tender statuses, financials, and distribution metrics
                            </Typography>
                        </Box>
                        <Tooltip title="Open Tenders Table">
                            <IconButton onClick={() => navigate('/businesses/tenders')} sx={{
                                border: '1px solid', borderColor: 'divider', borderRadius: 3, px: 2, gap: 1,
                                '&:hover': { bgcolor: alpha('#6366f1', 0.08) },
                            }}>
                                <FolderOpenIcon sx={{ fontSize: 18 }} />
                                <Typography variant="caption" fontWeight={700}>View All Tenders</Typography>
                            </IconButton>
                        </Tooltip>
                    </Box>
                </motion.div>

                {/* ── KPI Row ── */}
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    <KpiCard label="Total Tenders" value={String(tenders.length)} sub={`${statusBreakdown.filter(s => s.count > 0).length} active statuses`}
                        icon={<ReceiptLongIcon sx={{ fontSize: 22 }} />} color="#6366f1" delay={0.05} />
                    <KpiCard label="Total Sales" value={fmtRM(stats.totalSales)}
                        sub={`Avg ${fmtRM(tenders.length > 0 ? stats.totalSales / tenders.length : 0)} per tender`}
                        icon={<AttachMoneyIcon sx={{ fontSize: 22 }} />} color="#10b981" delay={0.1} />
                    <KpiCard label="Gross Profit" value={fmtRM(stats.gp)}
                        sub={stats.gp >= 0 ? 'Positive performance' : 'Needs attention'}
                        icon={stats.gp >= 0 ? <TrendingUpIcon sx={{ fontSize: 22 }} /> : <TrendingDownIcon sx={{ fontSize: 22 }} />}
                        color={stats.gp >= 0 ? '#10b981' : '#ef4444'} delay={0.15} />
                    <KpiCard label="Avg Margin" value={fmtPct(stats.marginPct)}
                        sub={`Cost: ${fmtRM(stats.totalCost)}`}
                        icon={<PieChartIcon sx={{ fontSize: 22 }} />} color="#3b82f6" delay={0.2} />
                </Grid>

                {/* ── Status Section Header ── */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: '#6366f1' }} />
                    <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.3px">Status Breakdown</Typography>
                    <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ ml: 1 }}>
                        Click to filter tenders
                    </Typography>
                </Box>

                {/* ── Status Cards Grid ── */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {statusBreakdown.map((s, i) => (
                        <StatusCard key={s.label} label={s.label} count={s.count} total={tenders.length}
                            color={s.color} sales={s.sales} cost={s.cost} gp={s.gp} marginPct={s.marginPct}
                            tenders={s.tenders} delay={0.05 * i}
                            onClick={() => navigate('/businesses/tenders', { state: { statusFilter: s.label } })} />
                    ))}
                </Grid>

                {/* ── Distribution Charts + Recent ── */}
                <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <DistributionSection title="By Company" icon={<BusinessIcon sx={{ fontSize: 18 }} />} items={companyBreakdown} />
                        </motion.div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                            <DistributionSection title="By Type" icon={<CategoryIcon sx={{ fontSize: 18 }} />} items={typeBreakdown} />
                        </motion.div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <DistributionSection title="Top Customers" icon={<BarChartIcon sx={{ fontSize: 18 }} />} items={customerBreakdown} />
                        </motion.div>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                            <RecentTenders tenders={tenders} statusItems={masterData?.status || []} />
                        </motion.div>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
