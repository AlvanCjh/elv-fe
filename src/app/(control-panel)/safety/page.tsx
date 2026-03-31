import { FC, useState, useMemo, ReactNode } from 'react';
import {
    Typography, Paper, IconButton, Button, TextField, Chip, Tooltip, Skeleton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Select, MenuItem, FormControl, InputLabel, alpha, Grid, Box, useTheme
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import {
    useSafetyDocuments, useAddSafetyDocument, useDeleteSafetyDocument,
    useSafetyAgendas, useAddSafetyAgenda, useDeleteSafetyAgenda,
    useSafetyPpes, useAddSafetyPpe, useUpdateSafetyPpe, useDeleteSafetyPpe,
    useSafetyNotifications, useAddSafetyNotification, useDeleteSafetyNotification,
    SafetyAgenda, SafetyPpe,
} from './safetyApi';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend as ChartLegend } from 'recharts';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { useProject } from '@/context/ProjectContext';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const fmtDateTime = (s: string) =>
    new Date(s).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const PPE_STATUS: Record<string, { fg: string; bg: string; bar: string }> = {
    Available: { fg: '#16a34a', bg: '#dcfce7', bar: '#22c55e' },
    'In Use':  { fg: '#1d4ed8', bg: '#dbeafe', bar: '#3b82f6' },
    Defective: { fg: '#b91c1c', bg: '#fee2e2', bar: '#ef4444' },
};

// ── tiny reusable UI pieces ───────────────────────────────────────────────────

const StatCard: FC<{ label: string; value: number | string; icon: string; color: string; loading?: boolean }> = ({
    label, value, icon, color, loading,
}) => {
    const theme = useTheme();
    return (
        <Paper 
            elevation={0} 
            className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl h-full"
            sx={{
                p: '16px', borderRadius: '24px', border: '1px solid', borderColor: alpha(color, 0.2),
                background: theme.palette.mode === 'dark' 
                    ? `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`
                    : `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, #ffffff 100%)`,
            }}
        >
            <div className="relative z-10">
                <Box sx={{ 
                    width: 48, height: 48, borderRadius: '16px', mb: 1.5,
                    background: alpha(color, 0.1),
                    color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 8px 16px -4px ${alpha(color, 0.2)}`
                }}>
                    <FuseSvgIcon size={24}>{icon}</FuseSvgIcon>
                </Box>
                {loading ? <Skeleton width={60} height={40} /> : (
                    <Typography className="text-4xl font-black mb-1 leading-none text-gray-800 dark:text-gray-100">{value}</Typography>
                )}
                <Typography className="text-gray-500 font-bold uppercase tracking-wider text-[11px]">{label}</Typography>
            </div>
            <Box sx={{ 
                position: 'absolute', right: -20, bottom: -20, opacity: 0.07, color: color,
                transform: 'rotate(-15deg)', transition: 'transform 0.3s ease-out'
            }} className="group-hover:scale-110">
                <FuseSvgIcon size={120}>{icon}</FuseSvgIcon>
            </Box>
        </Paper>
    );
};

const PanelHead: FC<{
    icon: string; color: string; title: string; subtitle: string; action: ReactNode;
}> = ({ icon, color, title, subtitle, action }) => (
    <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
            <Box sx={{
                width: 48, height: 48, borderRadius: '14px',
                background: alpha(color, 0.1),
                color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <FuseSvgIcon size={24}>{icon}</FuseSvgIcon>
            </Box>
            <div>
                <Typography className="font-black text-lg leading-tight">{title}</Typography>
                <Typography className="text-gray-500 font-medium text-sm">{subtitle}</Typography>
            </div>
        </div>
        {action}
    </div>
);

const Row: FC<{ accent: string; children: ReactNode }> = ({ accent, children }) => {
    const theme = useTheme();
    return (
        <Paper elevation={0} className="p-4 mb-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden relative border border-solid" sx={{
            borderRadius: '20px', 
            borderColor: alpha(accent, 0.2),
            bgcolor: theme.palette.mode === 'dark' ? alpha(accent, 0.05) : alpha(accent, 0.03),
            '&:hover': { 
                bgcolor: theme.palette.mode === 'dark' ? alpha(accent, 0.1) : alpha(accent, 0.04), 
                borderColor: alpha(accent, 0.3),
                '& .active-bar': { height: '100%', top: 0, opacity: 1 }
            },
        }}>
            <Box className="active-bar" sx={{ 
                position: 'absolute', left: 0, top: '25%', height: '50%', width: 5, 
                bgcolor: accent, borderRadius: '0 4px 4px 0', transition: 'all 0.3s ease',
                opacity: 0.6
            }} />
            <div className="flex items-center gap-4 relative z-10 pl-1">
                {children}
            </div>
        </Paper>
    );
};

const Tag: FC<{ label: string; fg: string; bg: string }> = ({ label, fg, bg }) => (
    <Chip label={label} size="small" sx={{
        height: 20, fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
        borderRadius: '6px', bgcolor: bg, color: fg,
        border: `1px solid ${alpha(fg, 0.2)}`,
        textTransform: 'uppercase'
    }} />
);

const Empty: FC<{ icon: string; text: string; action?: ReactNode }> = ({ icon, text, action }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500">
        <Box sx={{ 
            p: 3, 
            borderRadius: '24px', 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.03) : alpha(theme.palette.common.black, 0.03), 
            mb: 3,
            position: 'relative',
            '&::after': {
                content: '""',
                position: 'absolute',
                inset: -4,
                borderRadius: '28px',
                border: '1px dashed rgba(0,0,0,0.1)',
                dark: { borderColor: 'rgba(255,255,255,0.1)' }
            }
        }}>
            <FuseSvgIcon size={40} className="text-gray-400">{icon}</FuseSvgIcon>
        </Box>
        <Typography variant="body1" className="font-black text-gray-400 mb-2 uppercase tracking-wider text-xs">{text}</Typography>
        {action}
    </div>
);

// ── Dialog wrapper ────────────────────────────────────────────────────────────
const ModalDialog: FC<{
    open: boolean; onClose: () => void; title: string; icon: string; color: string;
    onConfirm: () => void; confirmLabel: string; confirmColor?: string;
    confirmBg?: string; confirmHover?: string; pending?: boolean; disabled?: boolean;
    children: ReactNode;
}> = ({ open, onClose, title, icon, color, onConfirm, confirmLabel, confirmColor, confirmBg, confirmHover, pending, disabled, children }) => {
    const theme = useTheme();
    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth 
            PaperProps={{ 
                sx: { 
                    borderRadius: '32px',
                    boxShadow: `0 24px 48px -12px ${alpha(color, 0.15)}`
                } 
            }}
        >
            <DialogTitle sx={{ p: 4, pb: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: alpha(color, 0.1), color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FuseSvgIcon size={20}>{icon}</FuseSvgIcon>
                    </Box>
                    <Typography className="text-2xl font-black">{title}</Typography>
                </div>
            </DialogTitle>
            <DialogContent sx={{ p: 4, pt: 2 }}>
                <Box className="flex flex-col gap-6 pt-2">
                    {children}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 4, gap: 1 }}>
                <Button 
                    onClick={onClose} 
                    className="rounded-xl font-bold px-5"
                    sx={{ color: theme.palette.text.secondary }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    disabled={!!disabled || !!pending}
                    className="rounded-xl font-bold px-6 py-3"
                    sx={{
                        ...(confirmBg ? { bgcolor: confirmBg, '&:hover': { bgcolor: confirmHover || confirmBg } } : { bgcolor: color }),
                        ...(confirmColor ? { color: confirmColor } : {}),
                        shadow: 3
                    }}
                >
                    {pending ? 'Saving…' : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

import useUser from '@auth/useUser';

// ═════════════════════════════════════════════════════════════════════════════
const SafetyDashboard: FC = () => {
    const { activeProjectId } = useProject();
    const navigate = useNavigate();
    const { data: user } = useUser();
    const isManagement = user?.role?.includes('superadmin') || user?.role?.includes('facilitator') || user?.role?.includes('admin');

    useEffect(() => {
        if (!activeProjectId) {
            navigate('/project-selection');
        }
    }, [activeProjectId, navigate]);

    // ── queries ───────────────────────────────────────────────────────────────
    const { data: docs = [],   isLoading: docsL }  = useSafetyDocuments(activeProjectId);
    const { data: agendas = [], isLoading: agL }   = useSafetyAgendas(activeProjectId);
    const { data: ppes = [],   isLoading: ppeL }   = useSafetyPpes(activeProjectId);
    const { data: notifs = [], isLoading: notifL } = useSafetyNotifications(activeProjectId);

    // ── mutations ─────────────────────────────────────────────────────────────
    const addDoc   = useAddSafetyDocument();
    const delDoc   = useDeleteSafetyDocument();
    const addAg    = useAddSafetyAgenda();
    const delAg    = useDeleteSafetyAgenda();
    const addPpe   = useAddSafetyPpe();
    const updPpe   = useUpdateSafetyPpe();
    const delPpe   = useDeleteSafetyPpe();
    const addNotif = useAddSafetyNotification();
    const delNotif = useDeleteSafetyNotification();

    const ppeOk  = useMemo(() => ppes.filter(p => p.status === 'Available').length, [ppes]);
    const ppeBad = useMemo(() => ppes.filter(p => p.status === 'Defective').length, [ppes]);

    // ── Document dialog ───────────────────────────────────────────────────────
    const [docOpen, setDocOpen] = useState(false);
    const [docTitle, setDocTitle] = useState('');
    const [docDesc, setDocDesc] = useState('');
    const [docFile, setDocFile] = useState<File | null>(null);
    const submitDoc = () => {
        if (!docTitle || !docFile || !activeProjectId) return;
        addDoc.mutate({ title: docTitle, description: docDesc || undefined, file: docFile, project_id: activeProjectId }, {
            onSuccess: () => { setDocOpen(false); setDocTitle(''); setDocDesc(''); setDocFile(null); },
        });
    };

    // ── Agenda dialog ─────────────────────────────────────────────────────────
    const [agOpen, setAgOpen] = useState(false);
    const [agTitle, setAgTitle] = useState('');
    const [agDesc, setAgDesc] = useState('');
    const [agDate, setAgDate] = useState('');
    const submitAg = () => {
        if (!agTitle || !agDate || !activeProjectId) return;
        addAg.mutate({ title: agTitle, description: agDesc || null, agenda_date: agDate, project_id: activeProjectId }, {
            onSuccess: () => { setAgOpen(false); setAgTitle(''); setAgDesc(''); setAgDate(''); },
        });
    };

    // ── PPE dialog ────────────────────────────────────────────────────────────
    const [ppeOpen, setPpeOpen] = useState(false);
    const [editPpe, setEditPpe] = useState<SafetyPpe | null>(null);
    const [ppeName, setPpeName] = useState('');
    const [ppeStatus, setPpeStatus] = useState<'Available' | 'In Use' | 'Defective'>('Available');
    const [ppeRemarks, setPpeRemarks] = useState('');

    const openAddPpe  = () => { setEditPpe(null); setPpeName(''); setPpeStatus('Available'); setPpeRemarks(''); setPpeOpen(true); };
    const openEditPpe = (p: SafetyPpe) => { setEditPpe(p); setPpeName(p.item_name); setPpeStatus(p.status); setPpeRemarks(p.remarks ?? ''); setPpeOpen(true); };
    const submitPpe   = () => {
        if (!ppeName || !activeProjectId) return;
        const body = { item_name: ppeName, status: ppeStatus, remarks: ppeRemarks || null, project_id: activeProjectId };
        if (editPpe) updPpe.mutate({ id: editPpe.id, ...body }, { onSuccess: () => setPpeOpen(false) });
        else addPpe.mutate(body, { onSuccess: () => setPpeOpen(false) });
    };

    // ── Broadcast dialog ──────────────────────────────────────────────────────
    const [msgOpen, setMsgOpen] = useState(false);
    const [msgTitle, setMsgTitle] = useState('');
    const [msgText, setMsgText] = useState('');
    const [msgType, setMsgType] = useState<'info' | 'alert'>('alert');
    const submitMsg = () => {
        if (!msgTitle || !msgText || !activeProjectId) return;
        addNotif.mutate({ title: msgTitle, message: msgText, type: msgType, sent_to_all: true, project_id: activeProjectId }, {
            onSuccess: () => { setMsgOpen(false); setMsgTitle(''); setMsgText(''); setMsgType('alert'); },
        });
    };

    const theme = useTheme();
    const storageBase = (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000') + '/storage/';

    // Prepare chart data
    const ppeChartData = [
        { name: 'Available', value: ppeOk, color: '#22c55e' },
        { name: 'In Use', value: ppes.filter(p => p.status === 'In Use').length, color: '#3b82f6' },
        { name: 'Defective', value: ppeBad, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Mock data for notification trends if empty
    const notifTrends = notifs.length > 0 
        ? notifs.slice(0, 7).reverse().map(n => ({ date: fmtDate(n.created_at), count: 1 }))
        : [ {date: 'Mon', count: 2}, {date: 'Tue', count: 5}, {date: 'Wed', count: 3} ];

    const container = {
        show: { transition: { staggerChildren: 0.05 } }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            style={{ padding: '16px 20px', maxWidth: 1400, margin: '0 auto' }}
        >

            {/* ── Page header ───────────────────────────────────────────────── */}
            <motion.div variants={item} className="flex flex-col lg:flex-row items-center justify-between mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-lg dark:shadow-none gap-6 relative overflow-hidden">
                <div className="flex items-center gap-5">
                    <Box sx={{
                        width: 72, height: 72, borderRadius: '24px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 12px 24px -6px rgba(239, 68, 68, 0.4)',
                        flexShrink: 0
                    }}>
                        <FuseSvgIcon size={40} color="inherit" sx={{ color: '#fff' }}>heroicons-solid:shield-check</FuseSvgIcon>
                    </Box>
                    <div>
                        <Typography className="text-4xl font-black tracking-tight leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-400">
                            Safety Management Hub
                        </Typography>
                        <div className="flex flex-wrap items-center gap-3">
                            <Box className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100 dark:border-green-800/50">
                                <Box className="relative flex h-2 w-2">
                                    <Box className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></Box>
                                    <Box className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></Box>
                                </Box>
                                <Typography className="text-[10px] font-black uppercase tracking-wider text-green-700 dark:text-green-400">Live Status: Protected</Typography>
                            </Box>
                            <Typography className="text-gray-500 dark:text-gray-400 font-bold text-sm">
                                {ppes.length} PPE items tracked across all zones
                            </Typography>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    {isManagement && (
                        <Box className="flex-1 lg:flex-none flex items-center gap-2 bg-gray-100/50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-200/50 dark:border-gray-800">
                            <Button
                                variant="text"
                                onClick={() => setAgOpen(true)}
                                className="rounded-xl px-4 py-2 font-black text-xs hover:bg-gray-200 dark:hover:bg-gray-800"
                                sx={{ color: theme.palette.text.primary, height: 40 }}
                                startIcon={<FuseSvgIcon size={16}>heroicons-outline:calendar</FuseSvgIcon>}
                            >
                                Agenda
                            </Button>
                            <Button
                                variant="text"
                                onClick={() => setDocOpen(true)}
                                className="rounded-xl px-4 py-2 font-black text-xs hover:bg-gray-200 dark:hover:bg-gray-800"
                                sx={{ color: theme.palette.text.primary, height: 40 }}
                                startIcon={<FuseSvgIcon size={16}>heroicons-outline:document-plus</FuseSvgIcon>}
                            >
                                Upload
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => setMsgOpen(true)}
                                className="rounded-xl px-5 font-black shadow-lg shadow-red-200/50 dark:shadow-none"
                                sx={{ height: 40 }}
                                startIcon={<FuseSvgIcon size={18}>heroicons-solid:speakerphone</FuseSvgIcon>}
                            >
                                Broadcast
                            </Button>
                        </Box>
                    )}
                </div>
            </motion.div>

            {/* ── Stats Summary ── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <motion.div variants={item}>
                        <StatCard label="PPE Items" value={ppes.length} icon="heroicons-outline:shield-check" color="#f59e0b" loading={ppeL} />
                    </motion.div>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <motion.div variants={item}>
                        <StatCard label="Defective PPE" value={ppeBad} icon="heroicons-outline:exclamation-circle" color="#ef4444" loading={ppeL} />
                    </motion.div>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <motion.div variants={item}>
                        <StatCard label="Agendas" value={agendas.length} icon="heroicons-outline:calendar" color="#0ea5e9" loading={agL} />
                    </motion.div>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <motion.div variants={item}>
                        <StatCard label="Documents" value={docs.length} icon="heroicons-outline:document-text" color="#6366f1" loading={docsL} />
                    </motion.div>
                </Grid>
            </Grid>

            {/* ── Analytics Row ── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <motion.div variants={item} style={{ height: '100%' }}>
                        <Paper elevation={0} className="p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 dark:bg-gray-800 shadow-sm overflow-hidden relative" sx={{ 
                            height: '100%',
                            background: theme.palette.mode === 'dark' ? `linear-gradient(to bottom, ${alpha('#f59e0b', 0.05)} 0%, ${theme.palette.background.paper} 100%)` : `linear-gradient(to bottom, #ffffff 0%, ${alpha('#f59e0b', 0.02)} 100%)`
                        }}>
                            <Typography className="text-[11px] font-black uppercase tracking-[2px] text-gray-400 mb-5 flex items-center justify-between">
                                <span>PPE Health Index</span>
                                <Tag label={`${Math.round((ppeOk / (ppes.length || 1)) * 100)}% OK`} fg="#16a34a" bg={alpha('#16a34a', 0.1)} />
                            </Typography>
                            <Box sx={{ height: 260, position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        {/* Background ring */}
                                        <Pie 
                                            data={[{ value: 1 }]} 
                                            innerRadius={70} 
                                            outerRadius={90} 
                                            dataKey="value" 
                                            stroke="none" 
                                            fill={theme.palette.divider} 
                                            opacity={0.1} 
                                            isAnimationActive={false} 
                                        />
                                        <Pie 
                                            data={ppeChartData.length > 0 ? ppeChartData : [{ name: 'Empty', value: 1, color: theme.palette.divider }]} 
                                            innerRadius={70} 
                                            outerRadius={90} 
                                            paddingAngle={ppeChartData.length > 0 ? 8 : 0} 
                                            dataKey="value" 
                                            stroke="none"
                                        >
                                            {ppeChartData.length > 0 
                                                ? ppeChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)
                                                : <Cell fill={theme.palette.divider} opacity={0.2} />
                                            }
                                        </Pie>
                                        <ChartTooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                    <Typography className="text-4xl font-black text-gray-800 dark:text-gray-100 leading-none">{ppes.length}</Typography>
                                    <Typography className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Items</Typography>
                                </Box>
                            </Box>
                            <div className="flex justify-center gap-4 mt-2">
                                {ppeChartData.map(d => (
                                    <div key={d.name} className="flex items-center gap-1">
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                                        <Typography className="text-[10px] font-bold text-gray-500 uppercase">{d.name}</Typography>
                                    </div>
                                ))}
                            </div>
                        </Paper>
                    </motion.div>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <motion.div variants={item} style={{ height: '100%' }}>
                        <Paper elevation={0} className="p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 dark:bg-gray-800 shadow-sm" sx={{ 
                            height: '100%',
                            background: theme.palette.mode === 'dark' ? `linear-gradient(to bottom, ${alpha('#ef4444', 0.05)} 0%, ${theme.palette.background.paper} 100%)` : `linear-gradient(to bottom, #ffffff 0%, ${alpha('#ef4444', 0.02)} 100%)`
                        }}>
                            <Typography className="text-[11px] font-black uppercase tracking-[2px] text-gray-400 mb-5">
                                SAFETY ENGAGEMENT (WEEKLY)
                            </Typography>
                            <Box sx={{ height: 280 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={notifTrends}>
                                        <defs>
                                            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.2)} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dx={-10} />
                                        <ChartTooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: theme.palette.background.paper }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="count" 
                                            stroke="#ef4444" 
                                            strokeWidth={4} 
                                            fillOpacity={1} 
                                            fill="url(#lineGrad)" 
                                            dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} 
                                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3 }} 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>



            {/* ── 2-column main grid ───────────────────────────────────────── */}
            <Grid container spacing={4}>

                {/* Documents */}
                <Grid size={{ xs: 12, md: 6 }}>
                <motion.div variants={item} className="h-full">
                <Paper elevation={0} className="p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 dark:bg-gray-800 shadow-sm h-full overflow-hidden">
                    <PanelHead
                        icon="heroicons-solid:document-text" color="#6366f1"
                        title="Compliance Docs" subtitle={`${docs.length} active files`}
                        action={
                            <Button size="small" variant="contained" onClick={() => setDocOpen(true)}
                                className="rounded-xl font-bold px-4 h-10 shadow-md"
                                sx={{ bgcolor: '#6366f1', display: docs.length > 0 ? 'flex' : 'none' }}
                                startIcon={<FuseSvgIcon size={16}>heroicons-outline:upload</FuseSvgIcon>}>
                                Upload
                            </Button>
                        }
                    />
                    <div className="custom-scrollbar" style={{ overflowY: 'auto', minHeight: 180, maxHeight: 310, paddingRight: 8 }}>
                        {docsL && [1, 2].map(i => <Skeleton key={i} height={46} sx={{ borderRadius: 2, mb: 1 }} variant="rectangular" />)}
                        {!docsL && docs.length === 0 && (
                            <Empty 
                                icon="heroicons-outline:document" 
                                text="No compliance documents" 
                                action={
                                    <Button 
                                        size="small" 
                                        variant="outlined" 
                                        onClick={() => setDocOpen(true)}
                                        className="rounded-xl font-bold px-4 h-9"
                                        sx={{ borderColor: alpha('#6366f1', 0.2), color: '#6366f1' }}
                                        startIcon={<FuseSvgIcon size={16}>heroicons-outline:upload</FuseSvgIcon>}
                                    >
                                        Upload First Doc
                                    </Button>
                                }
                            />
                        )}
                        {docs.map(doc => (
                            <Row key={doc.id} accent="#6366f1">
                                <span style={{ width: 30, height: 30, borderRadius: 8, background: alpha('#6366f1', 0.10), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FuseSvgIcon size={15} style={{ color: '#6366f1' }}>heroicons-solid:document-text</FuseSvgIcon>
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Typography fontWeight={700} fontSize={13} noWrap>{doc.title}</Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                        {doc.uploader?.name} · {fmtDate(doc.created_at)}
                                    </Typography>
                                </div>
                                <Tooltip title="Download">
                                    <IconButton size="small" sx={{ color: '#6366f1' }} onClick={() => window.open(storageBase + doc.file_path, '_blank')}>
                                        <FuseSvgIcon size={15}>heroicons-outline:download</FuseSvgIcon>
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton size="small" color="error" onClick={() => delDoc.mutate(doc.id)}>
                                        <FuseSvgIcon size={15}>heroicons-outline:trash</FuseSvgIcon>
                                    </IconButton>
                                </Tooltip>
                            </Row>
                        ))}
                    </div>
                </Paper>
                </motion.div>
                </Grid>

                {/* Agenda */}
                <Grid size={{ xs: 12, md: 6 }}>
                <motion.div variants={item} className="h-full">
                <Paper elevation={0} className="p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 dark:bg-gray-800 shadow-sm h-full overflow-hidden">
                    <PanelHead
                        icon="heroicons-solid:calendar" color="#0ea5e9"
                        title="Safety Agenda" subtitle={`${agendas.length} items`}
                        action={
                            <Button size="small" variant="contained" onClick={() => setAgOpen(true)}
                                className="rounded-xl font-bold px-4 h-10 shadow-md"
                                sx={{ bgcolor: '#0ea5e9', display: agendas.length > 0 ? 'flex' : 'none' }}
                                startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>}>
                                Add
                            </Button>
                        }
                    />
                    <div className="custom-scrollbar" style={{ overflowY: 'auto', minHeight: 180, maxHeight: 310, paddingRight: 8 }}>
                        {agL && [1, 2].map(i => <Skeleton key={i} height={52} sx={{ borderRadius: 2, mb: 1 }} variant="rectangular" />)}
                        {!agL && agendas.length === 0 && (
                            <Empty 
                                icon="heroicons-outline:calendar" 
                                text="No scheduled agendas" 
                                action={
                                    <Button 
                                        size="small" 
                                        variant="outlined" 
                                        onClick={() => setAgOpen(true)}
                                        className="rounded-xl font-bold px-4 h-9"
                                        sx={{ borderColor: alpha('#0ea5e9', 0.2), color: '#0ea5e9' }}
                                        startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>}
                                    >
                                        Schedule Item
                                    </Button>
                                }
                            />
                        )}
                        {agendas.map((a: SafetyAgenda) => {
                            const past = new Date(a.agenda_date) < new Date();
                            const col  = past ? '#94a3b8' : '#0ea5e9';
                            return (
                                <Row key={a.id} accent={col}>
                                    <Box sx={{ width: 44, height: 44, borderRadius: '14px', background: alpha(col, 0.10), color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <div className="flex flex-col items-center">
                                            <Typography className="text-[10px] font-black leading-none">{format(new Date(a.agenda_date), 'MMM')}</Typography>
                                            <Typography className="text-sm font-black">{format(new Date(a.agenda_date), 'dd')}</Typography>
                                        </div>
                                    </Box>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="flex items-center gap-2">
                                            <Typography className="font-black text-[14px] leading-tight text-gray-800 dark:text-gray-100" noWrap>{a.title}</Typography>
                                            {past && <Tag label="PAST" fg="#64748b" bg="#f1f5f9" />}
                                        </div>
                                        <Typography className="text-gray-500 font-bold text-[11px] mt-2 flex items-center gap-1">
                                            <FuseSvgIcon size={12}>heroicons-outline:clock</FuseSvgIcon>
                                            Scheduled for {fmtDate(a.agenda_date)}
                                        </Typography>
                                    </div>
                                    <Tooltip title="Delete">
                                        <IconButton size="small" color="error" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => delAg.mutate(a.id)}>
                                            <FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
                                        </IconButton>
                                    </Tooltip>
                                </Row>
                            );
                        })}
                    </div>
                </Paper>
                </motion.div>
                </Grid>

                {/* PPE Inventory — full width */}
                <Grid size={{ xs: 12 }}>
                <motion.div variants={item}>
                <Paper elevation={0} className="p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 dark:bg-gray-800 shadow-sm mt-8">
                    <PanelHead
                        icon="heroicons-solid:shield-exclamation" color="#f59e0b"
                        title="PPE Global Inventory"
                        subtitle={`${ppes.length} tracked items · ${ppeOk} active · ${ppeBad} defective`}
                        action={
                            <Button variant="contained" onClick={openAddPpe}
                                className="rounded-2xl font-black px-6 h-12 shadow-lg shadow-orange-100"
                                sx={{ bgcolor: '#f59e0b', display: ppes.length > 0 ? 'flex' : 'none' }}
                                startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}>
                                Add PPE Item
                            </Button>
                        }
                    />
                    {/* Status summary chips */}
                    {!ppeL && ppes.length > 0 && (
                        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                            {(['Available', 'In Use', 'Defective'] as const).map(s => {
                                const c = PPE_STATUS[s];
                                const n = ppes.filter(p => p.status === s).length;
                                return n > 0 ? (
                                    <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, background: c.bg, color: c.fg, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.bar }} />
                                        {s} ({n})
                                    </span>
                                ) : null;
                            })}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {ppeL && [1, 2, 3, 4].map(i => <Skeleton key={i} height={110} sx={{ borderRadius: 3 }} variant="rectangular" />)}
                        {!ppeL && ppes.length === 0 && (
                            <div className="col-span-full py-16">
                                <Empty 
                                    icon="heroicons-outline:shield-exclamation" 
                                    text="Global Inventory is empty" 
                                    action={
                                        <Button 
                                            variant="outlined" 
                                            onClick={openAddPpe}
                                            className="rounded-2xl font-black px-6 h-11 mt-4"
                                            sx={{ borderColor: alpha('#f59e0b', 0.3), color: '#f59e0b' }}
                                            startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
                                        >
                                            Register PPE Item
                                        </Button>
                                    }
                                />
                            </div>
                        )}
                        {ppes.map((p: SafetyPpe) => {
                            const c = PPE_STATUS[p.status] ?? PPE_STATUS.Available;
                            return (
                                <Paper key={p.id} elevation={0} className="p-5 rounded-[28px] transition-all hover:shadow-xl hover:-translate-y-2 border border-gray-100 dark:border-gray-700 group flex flex-col gap-3 relative overflow-hidden" sx={{
                                    background: theme.palette.mode === 'dark' ? `linear-gradient(135deg, ${alpha(c.bar, 0.1)} 0%, ${theme.palette.background.paper} 100%)` : `linear-gradient(135deg, ${alpha(c.bar, 0.05)} 0%, #ffffff 100%)`,
                                    borderLeft: `6px solid ${c.bar}`
                                }}>
                                    <div className="flex justify-between items-start z-10 relative">
                                        <div className="flex flex-col">
                                            <Typography className="font-black text-[16px] text-gray-800 leading-tight" noWrap title={p.item_name}>
                                                {p.item_name}
                                            </Typography>
                                            <Typography className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                                ID: #{p.id.toString().padStart(4, '0')}
                                            </Typography>
                                        </div>
                                        <div className="flex gap-1">
                                            <IconButton size="small" onClick={() => openEditPpe(p)} className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-all">
                                                <FuseSvgIcon size={14}>heroicons-outline:pencil</FuseSvgIcon>
                                            </IconButton>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 z-10 relative">
                                        <Tag label={p.status} fg={c.fg} bg={c.bg} />
                                    </div>

                                    <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-50/50 z-10 relative">
                                        {p.assignee && (
                                            <div className="flex items-center gap-1.5">
                                                <Box sx={{ width: 20, height: 20, borderRadius: '6px', bgcolor: alpha(theme.palette.text.primary, 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FuseSvgIcon size={12}>heroicons-outline:user</FuseSvgIcon>
                                                </Box>
                                                <Typography className="text-[11px] font-black text-gray-600 truncate">
                                                    {p.assignee.name}
                                                </Typography>
                                            </div>
                                        )}
                                        {p.remarks ? (
                                            <Typography className="text-[11px] font-bold text-gray-400 italic flex items-center gap-1 truncate" title={p.remarks}>
                                                <FuseSvgIcon size={12}>heroicons-outline:chat-bubble-bottom-center-text</FuseSvgIcon> {p.remarks}
                                            </Typography>
                                        ) : (
                                            <Typography className="text-[10px] font-bold text-gray-300 uppercase italic">No remarks recorded</Typography>
                                        )}
                                    </div>

                                    {/* Background Decor */}
                                    <Box sx={{ 
                                        position: 'absolute', right: -15, bottom: -15, 
                                        opacity: 0.05, color: c.bar, transform: 'rotate(-15deg)'
                                    }}>
                                        <FuseSvgIcon size={100}>heroicons-outline:shield-check</FuseSvgIcon>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </div>
                </Paper>
                </motion.div>
                </Grid>

                {/* Notifications — full width */}
                <Grid size={{ xs: 12 }}>
                <motion.div variants={item}>
                <Paper elevation={0} className="p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 dark:bg-gray-800 shadow-sm mt-8 overflow-hidden">
                    <PanelHead
                        icon="heroicons-solid:speakerphone" color="#ef4444"
                        title="Broadcast Center" subtitle="Emergency alerts & company-wide safety news"
                        action={
                            <Button variant="contained" color="error" onClick={() => setMsgOpen(true)}
                                className="rounded-2xl font-black px-6 h-12 shadow-lg shadow-red-100"
                                sx={{ display: notifs.length > 0 ? 'flex' : 'none' }}
                                startIcon={<FuseSvgIcon size={20}>heroicons-solid:speakerphone</FuseSvgIcon>}>
                                Broadcast Alert
                            </Button>
                        }
                    />
                    <div className="flex flex-col gap-3 max-h-[500px] overflow-auto pr-2 custom-scrollbar">
                        {notifL && [1, 2].map(i => <Skeleton key={i} height={100} sx={{ borderRadius: 4, mb: 1 }} variant="rectangular" />)}
                        {!notifL && notifs.length === 0 && (
                            <Empty 
                                icon="heroicons-outline:speakerphone" 
                                text="No previous broadcasts found" 
                                action={
                                    <Button 
                                        variant="outlined" 
                                        color="error" 
                                        onClick={() => setMsgOpen(true)}
                                        className="rounded-2xl font-black px-6 h-11 mt-4"
                                        sx={{ borderColor: alpha('#ef4444', 0.2) }}
                                        startIcon={<FuseSvgIcon size={20}>heroicons-solid:speakerphone</FuseSvgIcon>}
                                    >
                                        Send First Broadcast
                                    </Button>
                                }
                            />
                        )}
                        {notifs.map(n => {
                            const isAlert = n.type === 'alert';
                            const color   = isAlert ? '#dc2626' : '#2563eb';
                            return (
                                <Row key={n.id} accent={color}>
                                    <Box sx={{ 
                                        width: 52, height: 52, borderRadius: '18px', flexShrink: 0, 
                                        background: alpha(color, 0.1), color: color, 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 4px 12px -2px ${alpha(color, 0.2)}`
                                    }}>
                                        <FuseSvgIcon size={24}>{isAlert ? 'heroicons-solid:exclamation' : 'heroicons-solid:speakerphone'}</FuseSvgIcon>
                                    </Box>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-3">
                                                <Typography className="font-black text-[16px] text-gray-800">{n.title}</Typography>
                                                <Tag label={isAlert ? 'Urgent' : 'Update'} fg={color} bg={alpha(color, 0.1)} />
                                            </div>
                                            <Typography className="text-[10px] font-black text-gray-400 uppercase">{fmtDateTime(n.created_at)}</Typography>
                                        </div>
                                        <Typography className="text-gray-600 font-bold text-[13px] leading-relaxed mb-2">{n.message}</Typography>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: alpha(theme.palette.divider, 0.5), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FuseSvgIcon size={10}>heroicons-solid:user</FuseSvgIcon>
                                                </Box>
                                                <Typography className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                                    Issued by {n.sender?.name || 'System Admin'}
                                                </Typography>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: alpha(theme.palette.divider, 0.5), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FuseSvgIcon size={10}>heroicons-solid:globe-alt</FuseSvgIcon>
                                                </Box>
                                                <Typography className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                                    Broadcasted to All
                                                </Typography>
                                            </div>
                                        </div>
                                    </div>
                                    <IconButton size="small" color="error" className="opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50" onClick={() => delNotif.mutate(n.id)}>
                                        <FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
                                    </IconButton>
                                </Row>
                            );
                        })}
                    </div>
                </Paper>
                </motion.div>
                </Grid>
            </Grid>{/* end grid */}

            {/* ════ DIALOGS ════════════════════════════════════════════════════ */}

            {/* Upload Document */}
            <ModalDialog
                open={docOpen} onClose={() => setDocOpen(false)}
                title="Upload Safety Document" icon="heroicons-solid:document-text" color="#6366f1"
                onConfirm={submitDoc} confirmLabel="Upload"
                confirmBg="#6366f1" confirmHover="#4f46e5"
                pending={addDoc.isPending} disabled={!docTitle || !docFile}
            >
                <TextField sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} label="Document Title" value={docTitle} onChange={e => setDocTitle(e.target.value)} fullWidth required size="small" />
                <TextField sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} label="Description (optional)" value={docDesc} onChange={e => setDocDesc(e.target.value)} fullWidth size="small" multiline rows={2} />
                <Button variant="outlined" component="label" size="small"
                    startIcon={<FuseSvgIcon size={14}>heroicons-outline:paper-clip</FuseSvgIcon>}
                    sx={{ borderRadius: '12px', borderStyle: 'dashed', textTransform: 'none', justifyContent: 'flex-start', py: 1.5 }}>
                    {docFile ? `📄 ${docFile.name}` : 'Choose file…'}
                    <input type="file" hidden onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
                </Button>
            </ModalDialog>

            {/* Add Agenda */}
            <ModalDialog
                open={agOpen} onClose={() => setAgOpen(false)}
                title="Add Safety Agenda Item" icon="heroicons-solid:calendar" color="#0ea5e9"
                onConfirm={submitAg} confirmLabel="Add Agenda Item"
                confirmBg="#0ea5e9" confirmHover="#0284c7"
                pending={addAg.isPending} disabled={!agTitle || !agDate}
            >
                <TextField sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} label="Title" value={agTitle} onChange={e => setAgTitle(e.target.value)} fullWidth required size="small" />
                <TextField sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} label="Description (optional)" value={agDesc} onChange={e => setAgDesc(e.target.value)} fullWidth size="small" multiline rows={2} />
                <TextField sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} label="Date" type="date" value={agDate} onChange={e => setAgDate(e.target.value)} fullWidth required size="small" InputLabelProps={{ shrink: true }} />
            </ModalDialog>

            {/* Add / Edit PPE */}
            <ModalDialog
                open={ppeOpen} onClose={() => setPpeOpen(false)}
                title={editPpe ? 'Edit PPE Item' : 'Add PPE Item'} icon="heroicons-solid:shield-exclamation" color="#f59e0b"
                onConfirm={submitPpe} confirmLabel={editPpe ? 'Save Changes' : 'Add PPE'}
                confirmBg="#f59e0b" confirmHover="#d97706" confirmColor="#fff"
                pending={addPpe.isPending || updPpe.isPending} disabled={!ppeName}
            >
                <TextField sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} label="Item Name" value={ppeName} onChange={e => setPpeName(e.target.value)} fullWidth required size="small" />
                <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select sx={{ borderRadius: '12px' }} value={ppeStatus} label="Status" onChange={e => setPpeStatus(e.target.value as any)}>
                        <MenuItem value="Available">✅ Available</MenuItem>
                        <MenuItem value="In Use">🔵 In Use</MenuItem>
                        <MenuItem value="Defective">❌ Defective</MenuItem>
                    </Select>
                </FormControl>
                <TextField sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} label="Remarks (optional)" value={ppeRemarks} onChange={e => setPpeRemarks(e.target.value)} fullWidth size="small" multiline rows={2} />
            </ModalDialog>

            {/* Broadcast */}
            <ModalDialog
                open={msgOpen} onClose={() => setMsgOpen(false)}
                title="Broadcast Safety Notification" icon="heroicons-solid:speakerphone" color="#ef4444"
                onConfirm={submitMsg} confirmLabel="Send Broadcast"
                pending={addNotif.isPending} disabled={!msgTitle || !msgText}
            >
                <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select sx={{ borderRadius: '12px' }} value={msgType} label="Type" onChange={e => setMsgType(e.target.value as any)}>
                        <MenuItem value="alert">⚠️ Critical Alert</MenuItem>
                        <MenuItem value="info">💬 Info</MenuItem>
                    </Select>
                </FormControl>
                <TextField sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} label="Subject" value={msgTitle} onChange={e => setMsgTitle(e.target.value)} fullWidth required size="small" />
                <TextField sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} label="Message" value={msgText} onChange={e => setMsgText(e.target.value)} fullWidth required size="small" multiline rows={4} />
                <div style={{ display: 'flex', gap: 7, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.18)' }}>
                    <FuseSvgIcon size={14} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }}>heroicons-solid:information-circle</FuseSvgIcon>
                    <Typography fontSize={12} color="error">This will be sent immediately to ALL users.</Typography>
                </div>
            </ModalDialog>

        </motion.div>
    );
};

export default SafetyDashboard;
