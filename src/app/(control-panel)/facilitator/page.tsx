'use client';
import { FC, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useNavigate } from 'react-router';
import { CircularProgress, Grid } from '@mui/material';
import useJwtAuth from '@auth/services/jwt/useJwtAuth';
import { format } from 'date-fns';
import { useProject } from '@/context/ProjectContext';

const FacilitatorDashboard: FC = () => {
    const { user } = useJwtAuth();
    const navigate = useNavigate();
    const { activeProjectId } = useProject();
    const [isLoading] = useState(false);

    useEffect(() => {
        if (!activeProjectId) {
            navigate('/select-project');
            return;
        }
    }, [activeProjectId, navigate]);

    const facilitatorModules = [
        { id: 'attendance', label: 'Attendance Report', icon: 'material-outline:fact_check', color: 'from-blue-500 to-indigo-600', url: '/attendance-report' },
        { id: 'ssdc', label: 'Password for SSDC', icon: 'heroicons-outline:key', color: 'from-amber-500 to-orange-600', url: '/ssdc-passwords' },
        { id: 'incidence', label: 'Incidence & Service Report', icon: 'heroicons-outline:shield-exclamation', color: 'from-rose-500 to-pink-600', url: '/incidence-report' },
        { id: 'inspection', label: 'Inspection Report', icon: 'heroicons-outline:clipboard-document-check', color: 'from-sky-400 to-indigo-600', url: '/inspection-report' },
        { id: 'external-maint', label: 'External Maintenance', icon: 'heroicons-outline:wrench-screwdriver', color: 'from-emerald-500 to-teal-600', url: '/maintenance/external' },
        { id: 'internal-maint', label: 'Internal Maintenance', icon: 'heroicons-outline:cog-8-tooth', color: 'from-cyan-500 to-blue-600', url: '/maintenance/internal' },
        { id: 'boq', label: 'Live BoQ', icon: 'heroicons-outline:document-text', color: 'from-violet-500 to-purple-600', url: '/bill-of-quantity' },
        { id: 'audit', label: 'Audit Log', icon: 'heroicons-outline:clipboard-document-list', color: 'from-gray-500 to-slate-600', url: '/pending-history' },
        { id: 'material', label: 'Material Inventory', icon: 'heroicons-outline:cube', color: 'from-sky-500 to-blue-600', url: '/inventory/material' },
        { id: 'tools', label: 'Tools Inventory', icon: 'heroicons-outline:wrench', color: 'from-teal-500 to-emerald-600', url: '/inventory/tool' },
        { id: 'safety', label: 'Safety Dashboard', icon: 'heroicons-outline:shield-check', color: 'from-red-500 to-rose-600', url: '/safety' },
        { id: 'daily-checklist', label: 'Facility Daily Checklist', icon: 'heroicons-outline:clipboard-document-check', color: 'from-emerald-600 to-teal-700', url: '/daily-checklist' },
        { id: 'pdu-checklist', label: 'PDU Checklist', icon: 'heroicons-outline:bolt', color: 'from-indigo-600 to-blue-700', url: '/pdu-checklist' },
        { id: 'technical-layout', label: 'Technical Layout', icon: 'heroicons-outline:map', color: 'from-amber-400 to-orange-500', url: '/technical-layout' },
    ].filter(module => {
        if (module.id === 'technical-layout') {
            const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
            const isAuthorized = userRoles.some(r => ['supervisor', 'superadmin', 'admin'].includes(r as string));
            return isAuthorized;
        }
        return true;
    });

    const recentActivities = [
        { id: 1, type: 'report', user: 'Azmil', action: 'submitted a new Onsite Report', target: 'Project Alpha', time: '10 mins ago', icon: 'heroicons-outline:document-text' },
        { id: 2, type: 'inventory', user: 'Sarah', action: 'returned 5 Drill Bits', target: 'Central Store', time: '45 mins ago', icon: 'heroicons-outline:archive-box' },
        { id: 3, type: 'safety', user: 'John', action: 'flagged a safety hazard', target: 'Zone B, Floor 4', time: '2 hours ago', icon: 'heroicons-outline:exclamation-triangle' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-slate-950">
                <CircularProgress sx={{ color: '#6366f1' }} size={48} />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 p-6 lg:p-10 transition-colors duration-300">
            {/* Header section with glassmorphism */}
            <div className="relative mb-10">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 blur-[100px] rounded-full" />
                
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2"
                        >
                            Facilitator <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-indigo-400 dark:to-blue-400">Hub</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 dark:text-slate-400 font-medium"
                        >
                            Access your managed modules and site reports for {format(new Date(), 'eeee, do MMMM')}.
                        </motion.p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-3 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3 shadow-sm dark:shadow-none"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                            {user?.name?.[0] || 'F'}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Authenticated as</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{(user?.name as string) || 'Facilitator'}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Modules Grid */}
            <Grid container spacing={3}>
                {facilitatorModules.map((module, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={module.id}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            onClick={() => navigate(module.url)}
                            className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 h-full cursor-pointer relative overflow-hidden group transition-all shadow-sm hover:shadow-xl dark:shadow-none"
                        >
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${module.color} opacity-5 blur-2xl group-hover:opacity-15 transition-opacity`} />
                            
                            <div className="flex flex-col h-full gap-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg text-white group-hover:scale-110 transition-transform`}>
                                    <FuseSvgIcon size={28}>{module.icon}</FuseSvgIcon>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-1">{module.label}</h3>
                                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Open Module</p>
                                </div>
                            </div>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            {/* Bottom Section */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Recent Site Activity</h2>
                    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden p-2 shadow-sm dark:shadow-none">
                        {recentActivities.map((activity, i) => (
                            <div 
                                key={activity.id}
                                className={`flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${i !== recentActivities.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 font-bold text-slate-500">
                                    <FuseSvgIcon size={20}>{activity.icon}</FuseSvgIcon>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        <span className="font-bold text-slate-900 dark:text-white">{activity.user}</span> {activity.action}
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 dark:from-indigo-900/40 to-white dark:to-slate-900 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-center shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Project Health</p>
                    </div>
                    <h4 className="text-slate-900 dark:text-white font-black text-lg mb-2">Operation Status</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-6">
                        Normal telemetry across all project sectors. No critical alerts for the current shift.
                    </p>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 w-[94%]" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacilitatorDashboard;
