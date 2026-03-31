import { FC, useState, useRef, useMemo } from 'react';
import { Box, Typography, Paper, Grid, alpha, useTheme, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider, TextField, MenuItem, Select, FormControl, InputLabel, CircularProgress, Badge } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useOnsiteReports, useAddOnsiteReport, useDeleteOnsiteReport, useUpdateOnsiteReport, OnsiteReportDocument } from './reportApi';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import { useProject } from '@/context/ProjectContext';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { api } from '@/utils/api';

const useUsers = () => useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('users').json<{ id: number; name: string; role: string }[]>(),
});

// ─── Weather API ─────────────────────────────────────────────────────────────
const MET_BASE = 'https://api.data.gov.my/weather';
const DEFAULT_LOC = 'Kota+Kinabalu';

const FORECAST_MAP: Record<string, string> = {
    'Tiada hujan': 'No Rain', 'Hujan': 'Rain',
    'Hujan di satu dua tempat': 'Light Showers',
    'Hujan di beberapa tempat': 'Scattered Showers',
    'Hujan di banyak kawasan': 'Widespread Rain',
    'Ribut petir': 'Thunderstorms',
    'Ribut petir di satu dua tempat': 'Light Thunderstorms',
    'Ribut petir di beberapa tempat': 'Scattered Thunderstorms',
    'Ribut petir di banyak kawasan': 'Widespread Thunderstorms',
    'Sepanjang Hari': 'All Day', 'Pagi': 'Morning', 'Petang': 'Afternoon', 'Malam': 'Night',
};
const tx = (t: string) => FORECAST_MAP[t] ?? t;
const wxEmoji = (f: string) => {
    const t = f.toLowerCase();
    if (t.includes('ribut') || t.includes('thunder')) return '⛈️';
    if (t.includes('hujan di banyak') || t.includes('widespread')) return '🌧️';
    if (t.includes('hujan di beberapa') || t.includes('scattered')) return '🌦️';
    if (t.includes('hujan') || t.includes('rain')) return '🌧️';
    if (t.includes('tiada hujan') || t.includes('no rain')) return '☀️';
    return '🌤️';
};

/** Hyper-local weather for the Pinned Place circle on the map */
const usePinnedPlaceWeather = (lat?: number, lon?: number) => useQuery({
    queryKey: ['pinned-weather', lat, lon],
    queryFn: async () => {
        if (!lat || !lon) return null;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
        return res.json();
    },
    enabled: !!lat && !!lon,
    staleTime: 10 * 60 * 1000,
});

/** MET Malaysia Contextual Data (District Focus) */
const useMetForecast = (location: string = DEFAULT_LOC) => useQuery({
    queryKey: ['met-forecast', location],
    queryFn: () => fetch(`${MET_BASE}/forecast?contains=${location}@location__location_name&limit=5&sort=-date`).then(r => r.json()) as Promise<WxForecast[]>,
    staleTime: 15 * 60 * 1000, retry: 1,
});

/** Specialized Warning Sync for the Pinned Location ONLY */
const usePinnedWarnings = (targetLocation: string = 'Kota Kinabalu') => useQuery({
    queryKey: ['pinned-warnings', targetLocation],
    queryFn: async () => {
        // Fetch more to ensure we don't miss any recent regional alerts
        const res = await fetch(`${MET_BASE}/warning?limit=50&sort=-valid_from`);
        const all: WxWarning[] = await res.json();
        
        const loc = targetLocation.replace(/\+/g, ' ').toLowerCase();
        const now = new Date();
        
        // Filter: Active + Mentioning District or State (e.g. Sabah if in KK)
        return all.filter(w => {
            const h = w.heading_en.toLowerCase();
            const t = w.text_en.toLowerCase();
            const isValid = new Date(w.valid_to) > now;
            
            // Area matching logic
            const matchesDistrict = h.includes(loc) || t.includes(loc);
            const matchesState = (loc === 'kota kinabalu' || loc === 'sabah') && (h.includes('sabah') || t.includes('sabah'));
            
            return isValid && (matchesDistrict || matchesState);
        });
    },
    staleTime: 15 * 60 * 1000, retry: 1,
});

const useWxQuakes = () => useQuery({
    queryKey: ['met-earthquakes'],
    queryFn: () => fetch(`${MET_BASE}/warning/earthquake?limit=5&sort=-localdatetime`).then(r => r.json()) as Promise<WxQuake[]>,
    staleTime: 30 * 60 * 1000, retry: 1,
});

interface WxForecast {
    location: { location_id: string; location_name: string };
    date: string; morning_forecast: string; afternoon_forecast: string;
    night_forecast: string; summary_forecast: string; summary_when: string;
    min_temp: number; max_temp: number;
}
interface WxWarning {
    warning_issue: { issued: string; title_en: string };
    valid_from: string; valid_to: string;
    heading_en: string; text_en: string;
}
interface WxQuake {
    localdatetime: string; location: string; n_distancemas: string;
    magdefault: number; magtypedefault: string; depth: number;
}

// ─── Weather Report Modal ─────────────────────────────────────────────────────
const WeatherReportModal: FC<{ open: boolean; onClose: () => void; project: any }> = ({ open, onClose, project }) => {
    const { data: pinnedWx } = usePinnedPlaceWeather(project?.latitude, project?.longitude);
    const { data: metFc = [], isLoading: metLoading } = useMetForecast(project?.location || DEFAULT_LOC);
    const { data: activeWarnings = [], isLoading: warnLoading } = usePinnedWarnings(project?.location || 'Kota Kinabalu');
    const { data: quakes = [] } = useWxQuakes();

    const today = new Date().toISOString().slice(0, 10);
    const todayFc = metFc.find(f => f.date === today) ?? metFc[0] ?? null;
    const currentTemp = pinnedWx?.current_weather?.temperature ?? (todayFc ? (todayFc.min_temp + todayFc.max_temp) / 2 : 28);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ className: 'rounded-3xl shadow-2xl overflow-hidden', sx: { bgcolor: 'background.paper' } }}>

            <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 px-8 pt-8 pb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-[10px] font-black text-sky-200 uppercase tracking-[0.2em] mb-2">
                             📍 Area: {project?.location || 'Kota Kinabalu'} · {Number(project?.latitude).toFixed(4)}, {Number(project?.longitude).toFixed(4)}
                        </div>
                        {metLoading ? (
                            <div className="flex items-center gap-3"><CircularProgress color="inherit" size={20} /><span className="text-white font-bold">Pinpointing current position...</span></div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span className="text-6xl">{wxEmoji(todayFc?.summary_forecast || '')}</span>
                                <div>
                                    <div className="text-4xl font-black text-white leading-none">
                                        {Math.round(currentTemp)}°C
                                    </div>
                                    <div className="text-sky-200 font-bold mt-1">
                                        {tx(todayFc?.summary_forecast || '')} {pinnedWx ? '(Hyper-local)' : '(Regional)'}
                                    </div>
                                    <div className="text-sky-300 text-[11px] font-bold mt-0.5 uppercase tracking-widest">
                                        {todayFc?.min_temp || '-'}° low · {todayFc?.max_temp || '-'}° high · {new Date().toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                         <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}><FuseSvgIcon>heroicons-outline:x-mark</FuseSvgIcon></IconButton>
                         {activeWarnings.length > 0 && (
                            <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-lg border border-white/20 animate-pulse">
                                <span className="text-white text-[10px] font-black uppercase tracking-tighter">Localized Threat Alert</span>
                            </div>
                         )}
                    </div>
                </div>

                {todayFc && (
                    <div className="grid grid-cols-3 gap-3 mt-6">
                        {[
                            { emoji: '🌅', label: 'Morning', text: todayFc.morning_forecast },
                            { emoji: '☀️', label: 'Afternoon', text: todayFc.afternoon_forecast },
                            { emoji: '🌙', label: 'Night', text: todayFc.night_forecast },
                        ].map(({ emoji, label, text }) => (
                            <div key={label} className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3">
                                <div className="text-sky-200 text-[10px] font-black uppercase tracking-widest mb-1">{emoji} {label}</div>
                                <div className="text-white text-sm font-bold leading-snug">{tx(text)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <DialogContent className="p-0" sx={{ maxHeight: '55vh', overflowY: 'auto' }}>
                {activeWarnings.length > 0 ? (
                    <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-amber-50/30">
                        <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">⚠️ ACTIVE WARNINGS FOR YOUR AREA</div>
                        <div className="flex flex-col gap-3">
                            {activeWarnings.map((w, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-white border border-amber-200 shadow-sm">
                                    <div className="text-[11px] font-black text-amber-700 uppercase tracking-widest mb-1.5">{w.heading_en}</div>
                                    <div className="text-sm text-gray-600 font-medium leading-relaxed">{w.text_en}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="px-8 py-6 text-center border-b border-gray-50">
                        <Typography className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active threats detected for {project?.location || 'Kota Kinabalu'}</Typography>
                    </div>
                )}
                
                {quakes.length > 0 && (
                     <div className="px-8 py-5">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Seismic Stability Monitor</div>
                        <div className="flex flex-col gap-2">
                             {quakes.slice(0, 3).map((q, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 opacity-60">
                                     <div className="font-black text-gray-700">{q.magdefault} M</div>
                                     <div className="text-xs text-gray-500 font-bold">{q.location}</div>
                                </div>
                             ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

// ─── Reporting Dialog (Hazard/Inspection/etc) ─────────────────────────────────
const ReportNewDialog: FC<{ open: boolean; onClose: () => void; category: string; projectId: number }> = ({ open, onClose, category, projectId }) => {
    const { mutate: addReport, isPending } = useAddOnsiteReport(category, projectId);
    const { data: users = [] } = useUsers();
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [loc, setLoc]     = useState('');
    const [assignedTo, setAssignedTo] = useState<number | ''>('');
    const [file, setFile]   = useState<File | null>(null);

    const handleSubmit = () => {
        if (!title || !file) return alert("Please provide a title and attachment.");
        addReport({
            title, description: desc, location: loc,
            assigned_to: assignedTo === '' ? undefined : assignedTo,
            file, category, project_id: projectId,
            status: 'reported', priority: category === 'hazard' ? 'high' : 'medium'
        }, {
            onSuccess: () => {
                onClose(); setTitle(''); setDesc(''); setLoc(''); setFile(null); setAssignedTo('');
            }
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-3xl shadow-2xl' }}>
            <DialogTitle className="font-black text-2xl pb-2">New {category.toUpperCase()} Report</DialogTitle>
            <DialogContent className="flex flex-col gap-4 pt-4">
                <TextField label="Report Title" fullWidth value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Water Leak Floor 5" />
                <TextField label="Detailed Description" fullWidth multiline rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
                <TextField label="Location / Zone" fullWidth value={loc} onChange={e => setLoc(e.target.value)} placeholder="e.g. Zone B, Riser Room" />
                
                <FormControl fullWidth>
                    <InputLabel>Assign To</InputLabel>
                    <Select value={assignedTo} label="Assign To" onChange={e => setAssignedTo(e.target.value as number)}>
                        <MenuItem value=""><em>None</em></MenuItem>
                        {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name} ({u.role})</MenuItem>)}
                    </Select>
                </FormControl>

                <div className="mt-2">
                    <Typography className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">📸 Evidence Image / File</Typography>
                    <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
            </DialogContent>
            <DialogActions className="p-6 bg-gray-50 border-t border-gray-100">
                <Button onClick={onClose} className="font-bold text-gray-500">Cancel</Button>
                <Button disabled={isPending || !file || !title} onClick={handleSubmit} variant="contained" className="rounded-xl px-8 font-black bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                    {isPending ? <CircularProgress size={20} color="inherit" /> : 'Submit Report'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ─── Report List Modal ────────────────────────────────────────────────────────
const ReportFilesModal: FC<{ open: boolean; onClose: () => void; category: string; title: string; projectId?: number }> = ({ open, onClose, category, title, projectId }) => {
    const { data: reports = [], isLoading } = useOnsiteReports(category, projectId);
    const { mutate: deleteReport } = useDeleteOnsiteReport(category, projectId);
    const { mutate: updateReport } = useUpdateOnsiteReport(category, projectId);
    
    const [createOpen, setCreateOpen] = useState(false);

    const getStatusColor = (s: string) => {
        if (s === 'reported') return '#ef4444';
        if (s === 'in_progress') return '#f59e0b';
        if (s === 'complete') return '#10b981';
        return '#6366f1';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ className: 'rounded-3xl shadow-xl' }}>
            <DialogTitle className="font-black text-2xl flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600"><FuseSvgIcon size={24}>heroicons-outline:document-duplicate</FuseSvgIcon></span>
                    {title}
                </div>
                <IconButton onClick={onClose}><FuseSvgIcon size={20}>heroicons-outline:x-mark</FuseSvgIcon></IconButton>
            </DialogTitle>
            <DialogContent className="min-h-[400px] bg-gray-50/30 p-6">
                <div className="flex justify-between items-center mb-6">
                    <Typography className="text-sm font-bold text-gray-500 uppercase tracking-widest">{reports.length} Reports Found</Typography>
                    <Button onClick={() => setCreateOpen(true)} variant="contained" className="rounded-xl font-bold bg-indigo-600 text-white shadow-md" startIcon={<FuseSvgIcon size={18}>heroicons-outline:plus</FuseSvgIcon>}>Add New</Button>
                </div>

                {isLoading ? <div className="p-20 flex justify-center"><CircularProgress /></div> : (
                    <div className="grid grid-cols-1 gap-4">
                        {reports.length === 0 && <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 font-bold text-gray-400">No reports documented yet.</div>}
                        {reports.map(doc => (
                            <Paper key={doc.id} elevation={0} className="p-5 rounded-3xl border border-gray-100 hover:shadow-lg transition-all bg-white relative overflow-hidden">
                                <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: getStatusColor(doc.status) }} />
                                <div className="flex gap-5">
                                    <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-50 cursor-pointer" onClick={() => window.open(`${API_BASE_URL}/storage/${doc.file_path}`, '_blank')}>
                                        <img src={`${API_BASE_URL}/storage/${doc.file_path}`} className="w-full h-full object-cover hover:scale-110 transition-transform" alt="Report Attachment" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <Typography className="font-black text-lg text-gray-800 leading-tight">{doc.title}</Typography>
                                                <Typography className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">📍 {doc.location || 'Unknown Location'}</Typography>
                                            </div>
                                            <Chip label={doc.status.replace('_', ' ').toUpperCase()} size="small" sx={{ bgcolor: alpha(getStatusColor(doc.status), 0.1), color: getStatusColor(doc.status), fontWeight: 900, px: 1 }} />
                                        </div>
                                        <Typography className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{doc.description}</Typography>
                                        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <Typography className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Reporting User</Typography>
                                                    <Typography className="text-[11px] font-bold text-gray-700">{doc.uploader?.name}</Typography>
                                                </div>
                                                <Divider orientation="vertical" flexItem className="h-4 self-center" />
                                                <div>
                                                    <Typography className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Assigned To</Typography>
                                                    <Typography className="text-[11px] font-bold text-indigo-600">{doc.assigned_to_user?.name || 'Unassigned'}</Typography>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select value={doc.status} size="small" sx={{ height: 32, fontSize: 11, fontWeight: 800, borderRadius: '8px' }} onChange={e => updateReport({ id: doc.id, status: e.target.value as any })}>
                                                    <MenuItem value="reported">REPORTED</MenuItem>
                                                    <MenuItem value="in_progress">IN PROGRESS</MenuItem>
                                                    <MenuItem value="complete">COMPLETE</MenuItem>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Paper>
                        ))}
                    </div>
                )}
            </DialogContent>
            {projectId && <ReportNewDialog open={createOpen} category={category} projectId={projectId} onClose={() => setCreateOpen(false)} />}
        </Dialog>
    );
};

const ReportCard: FC<{
    title: string; subtitle: string; icon: string; color: string; status: string; statusColor: string; onClick?: () => void; blinking?: boolean;
}> = ({ title, subtitle, icon, color, status, statusColor, onClick, blinking }) => {
    const theme = useTheme();
    return (
        <Paper elevation={0} onClick={onClick} className={`p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group cursor-pointer ${blinking ? 'animate-pulse ring-2 ring-red-400 ring-offset-4' : ''}`} sx={{
            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : '#fff'
        }}>
            <Box sx={{
                position: 'absolute', right: -30, top: -30, width: 140, height: 140,
                background: `radial-gradient(circle, ${alpha(color, 0.15)} 0%, transparent 70%)`,
                borderRadius: '50%', zIndex: 0
            }} className="group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative z-10 flex flex-col h-full gap-5">
                <div className="flex items-start justify-between">
                    <Box sx={{
                        width: 56, height: 56, borderRadius: '20px',
                        background: alpha(color, 0.1), color: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 8px 16px -4px ${alpha(color, 0.2)}`
                    }}>
                        <FuseSvgIcon size={28}>{icon}</FuseSvgIcon>
                    </Box>
                    <Chip label={status} size="small" sx={{
                        height: 28, fontSize: 12, fontWeight: 800,
                        bgcolor: alpha(statusColor, 0.1), color: statusColor,
                        border: `1px solid ${alpha(statusColor, 0.2)}`
                    }} />
                </div>
                <div className="mt-2 flex-grow">
                    <Typography className="font-black text-xl text-gray-800 dark:text-gray-100 leading-tight mb-2">{title}</Typography>
                    <Typography className="text-gray-500 text-sm font-medium leading-relaxed">{subtitle}</Typography>
                </div>
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <Typography className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tap to View Reports</Typography>
                    <FuseSvgIcon size={20} className="text-gray-400 group-hover:text-gray-800 transition-colors">heroicons-outline:arrow-right</FuseSvgIcon>
                </div>
            </div>
        </Paper>
    );
};

const OnsiteReportDashboard: FC = () => {
    const { activeProject: selectedProject } = useProject();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [modalTitle, setModalTitle] = useState('');
    const [weatherOpen, setWeatherOpen] = useState(false);

    useEffect(() => {
        if (!selectedProject) navigate('/select-project');
    }, [selectedProject, navigate]);

    // Live weather for the "Real-time" Pinned Place
    const { data: pinnedWx } = usePinnedPlaceWeather(selectedProject?.latitude, selectedProject?.longitude);
    const { data: localizedWarnings = [] } = usePinnedWarnings(selectedProject?.location || 'Kota Kinabalu');
    const [showLocalAlert, setShowLocalAlert] = useState(false);

    useEffect(() => {
        if (localizedWarnings.length > 0) {
            setShowLocalAlert(true);
            const timer = setTimeout(() => setShowLocalAlert(false), 60000); // 1 minute auto-dismiss
            return () => clearTimeout(timer);
        } else {
            setShowLocalAlert(false);
        }
    }, [localizedWarnings.length, selectedProject?.id]);

    const hasActiveLocalWarnings = showLocalAlert;

    const { data: allReports = [] } = useQuery({
        queryKey: ['onsite-reports-all', selectedProject?.id],
        queryFn: () => api.get(`onsite-reports?project_id=${selectedProject?.id}`).json<OnsiteReportDocument[]>(),
        enabled: !!selectedProject?.id
    });

    const openModal = (category: string, title: string) => {
        setSelectedCategory(category);
        setModalTitle(title);
    };

    const currentLocTemp = pinnedWx?.current_weather?.temperature ? `${Math.round(pinnedWx.current_weather.temperature)}°C` : '🌤️ LIVE';

    return (
        <div className="flex flex-col w-full min-h-[calc(100vh-80px)] bg-gray-50/50 dark:bg-gray-900 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 max-w-[1600px] mx-auto w-full">
                
                <Box className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                    <div>
                        <Typography variant="h3" className="font-black tracking-tight mb-1 text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-800">
                             {selectedProject?.name || 'Onsite Reports'}
                        </Typography>
                        <div className="flex items-center gap-2">
                             <span className="text-indigo-500"><FuseSvgIcon size={14}>heroicons-outline:map-pin</FuseSvgIcon></span>
                             <Typography className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">
                                Site Region: {selectedProject?.location || 'Kota Kinabalu'} · {Number(selectedProject?.latitude).toFixed(4)}, {Number(selectedProject?.longitude).toFixed(4)}
                             </Typography>
                        </div>
                    </div>
                    {hasActiveLocalWarnings && (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-100 px-6 py-3 rounded-3xl animate-bounce shadow-lg shadow-red-200/50">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <Typography className="text-red-700 font-black text-xs uppercase tracking-widest">LOCAL AREA WARNING</Typography>
                                <Typography className="text-red-500 font-bold text-[10px]">Verified threats for {selectedProject?.location || 'Kota Kinabalu'}</Typography>
                            </div>
                        </div>
                    )}
                </Box>

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <ReportCard 
                            title="Hazard Report" 
                            subtitle="Leakages & structural issues. Immediate reporting & assignment."
                            icon="heroicons-outline:exclamation-triangle"
                            color="#ef4444"
                            status={allReports.filter(r => r.category === 'hazard' && r.status !== 'complete').length + " Pending"}
                            statusColor="#ef4444"
                            onClick={() => openModal('hazard', 'Hazard & Safety Incidents')}
                        />
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <ReportCard 
                            title="Inspection Report" 
                            subtitle="Routine structural & safety inspections for site engineers."
                            icon="heroicons-outline:clipboard-document-check"
                            color="#f59e0b"
                            status="Review Items"
                            statusColor="#f59e0b"
                            onClick={() => openModal('inspection', 'Inspection Logs')}
                        />
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <ReportCard 
                            title="Maintenance Report" 
                            subtitle="Direct assignment to site workers for asset upkeep."
                            icon="heroicons-outline:wrench-screwdriver"
                            color="#10b981"
                            status="Operations"
                            statusColor="#10b981"
                            onClick={() => openModal('maintenance', 'Maintenance Records')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <ReportCard 
                            title="Fire Risk Assessment" 
                            subtitle="Routine fire safety & risk analysis. Compliance verification."
                            icon="heroicons-outline:fire"
                            color="#dc2626"
                            status="Compliance"
                            statusColor="#dc2626"
                            onClick={() => openModal('fire_risk', 'Fire Risk Assessments')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <ReportCard 
                            title="Contractor Report" 
                            subtitle="Brochures & site progress updates for external teams."
                            icon="heroicons-outline:user-group"
                            color="#6366f1"
                            status="Submissions"
                            statusColor="#6366f1"
                            onClick={() => openModal('contractor', 'Contractor Reports')}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                        <ReportCard 
                            title="Weather Report" 
                            subtitle="Precise Local Weather + Filtered Site Warnings (No National Spam)."
                            icon="heroicons-outline:cloud"
                            color="#0ea5e9"
                            status={hasActiveLocalWarnings ? "⚠️ LOCAL WARNING" : currentLocTemp}
                            statusColor={hasActiveLocalWarnings ? "#ef4444" : "#0ea5e9"}
                            blinking={hasActiveLocalWarnings}
                            onClick={() => setWeatherOpen(true)}
                        />
                    </Grid>
                </Grid>

                {selectedCategory && (
                    <ReportFilesModal
                        open={!!selectedCategory}
                        category={selectedCategory}
                        title={modalTitle}
                        projectId={selectedProject?.id}
                        onClose={() => { setSelectedCategory(null); setModalTitle(''); }}
                    />
                )}
                <WeatherReportModal open={weatherOpen} onClose={() => setWeatherOpen(false)} project={selectedProject} />
            </motion.div>
        </div>
    );
};

export default OnsiteReportDashboard;
