import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import api, { API_BASE_URL } from '@/utils/api';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Backup {
    id: number;
    backup_date: string;
    responsible_first_name: string;
    responsible_last_name: string;
    department: string;
    systems: string[];
    location: string;
    status: 'success' | 'unsuccess' | 'recovery' | 'in progress' | 'failed';
    attachment_url?: string;
    remarks?: string;
}

const IctDashboardApp = () => {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [filter, setFilter] = useState('all');
    const [category, setCategory] = useState('backup');
    const [loading, setLoading] = useState(true);

    const fetchBackups = async () => {
        try {
            setLoading(true);
            const response = await api.get('ict-backups', {
                searchParams: {
                    ...(filter !== 'all' ? { status: filter } : {}),
                    category: category
                }
            });
            const data = await response.json() as Backup[];
            setBackups(data);
        } catch (error) {
            console.error("Failed to fetch backups:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBackups();
    }, [filter, category]);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await api.delete(`ict-backups/${id}`);
            fetchBackups();
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const getStatusChip = (status: Backup['status']) => {
        const configs: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
            success: { bg: '#f0fdf4', text: '#10b981', border: '#bbf7d0', icon: <CheckCircleIcon sx={{ fontSize: 12 }} /> },
            unsuccess: { bg: '#fef2f2', text: '#ef4444', border: '#fecaca', icon: <ErrorIcon sx={{ fontSize: 12 }} /> },
            recovery: { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe', icon: <RotateLeftIcon sx={{ fontSize: 12 }} /> },
            'in progress': { bg: '#fffbeb', text: '#f59e0b', border: '#fef3c7', icon: <RotateLeftIcon className="animate-spin" sx={{ fontSize: 12 }} /> },
            failed: { bg: '#fef2f2', text: '#ef4444', border: '#fecaca', icon: <ErrorIcon sx={{ fontSize: 12 }} /> }
        };

        const config = configs[status] || { 
            bg: '#f8fafc', 
            text: '#64748b', 
            border: '#e2e8f0', 
            icon: null 
        };

        return (
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '9999px',
                    backgroundColor: config.bg,
                    color: config.text,
                    border: `1px solid ${config.border}`,
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}
            >
                {config.icon}
                {status}
            </Box>
        );
    };

    const stats = [
        { label: 'Success', value: backups.filter(b => b.status === 'success').length, color: '#10b981', status: 'success' },
        { label: 'Unsuccessful', value: backups.filter(b => b.status === 'unsuccess' || b.status === 'failed').length, color: '#ef4444', status: 'unsuccess' },
        { label: 'Recovery', value: backups.filter(b => b.status === 'recovery').length, color: '#3b82f6', status: 'recovery' }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <Box className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <Typography variant="h4" className="font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        ICT {category === 'vulnerability' ? 'Vulnerability' : category === 'virus_scan' ? 'Virus Scan' : 'Backup'} Dashboard
                    </Typography>
                    <Typography className="text-slate-500 dark:text-gray-400 font-medium">
                        Monitor and manage system {category === 'vulnerability' ? 'vulnerability testing' : category === 'virus_scan' ? 'virus scan' : 'backup'} forms across all servers.
                    </Typography>
                </div>
                <Box className="flex bg-slate-100 dark:bg-gray-800 p-1 rounded-xl">
                    {['backup', 'vulnerability', 'virus_scan'].map((cat) => (
                        <Button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm capitalize ${category === cat ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-gray-400'}`}
                            sx={{ textTransform: 'none' }}
                        >
                            {cat.replace('_', ' ')}
                        </Button>
                    ))}
                </Box>
            </Box>

            {/* Stats Summary */}
            <Box className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setFilter(filter === stat.status ? 'all' : stat.status)}
                    >
                        <Card
                            className={`border rounded-3xl cursor-pointer transition-all border-slate-100 dark:border-white/10 bg-white dark:bg-gray-800 ${filter === stat.status
                                ? 'ring-2 ring-indigo-500 scale-105 shadow-xl'
                                : 'hover:shadow-lg'}`}
                            sx={{ background: 'transparent' }}
                        >
                            <CardContent className="p-8 flex items-center justify-between">
                                <div>
                                    <Typography className="text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">
                                        {stat.label}
                                    </Typography>
                                    <Typography variant="h3" className="font-black text-slate-900 dark:text-white">
                                        {stat.value}
                                    </Typography>
                                </div>
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                    style={{ background: `${stat.color}15`, color: stat.color }}
                                >
                                    {stat.label === 'Success' ? <CheckCircleIcon /> : stat.label === 'Recovery' ? <RotateLeftIcon /> : <ErrorIcon />}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </Box>

            {/* Backups Table */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                {/* Table Header */}
                <div className="hidden md:grid gap-4 px-24 py-6 bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-white/10"
                    style={{ gridTemplateColumns: '120px 1.5fr 80px 2fr 1fr 140px 80px' }}>
                    {['DATE', 'RESPONSIBLE', 'DEPT', 'SYSTEMS', 'LOCATION', 'STATUS', 'ACTIONS'].map(h => (
                        <Typography key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">
                            {h}
                        </Typography>
                    ))}
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-50 dark:divide-white/5">
                    {backups.map((backup) => (
                        <div
                            key={backup.id}
                            className="grid md:grid-cols-7 gap-4 px-24 py-6 items-center hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors"
                            style={{ gridTemplateColumns: '120px 1.5fr 80px 2fr 1fr 140px 80px' }}
                        >
                            {/* Date */}
                            <div>
                                <Typography className="text-xs font-bold text-slate-500 dark:text-gray-400">
                                    {format(new Date(backup.backup_date), 'dd MMM yyyy')}
                                </Typography>
                            </div>

                            {/* Responsible */}
                            <div className="flex items-center gap-3">
                                <Avatar
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                        color: 'white'
                                    }}
                                >
                                    {backup.responsible_first_name?.[0]}{backup.responsible_last_name?.[0]}
                                </Avatar>
                                <Typography className="font-bold text-slate-800 dark:text-white text-sm">
                                    {backup.responsible_first_name} {backup.responsible_last_name}
                                </Typography>
                            </div>

                            {/* Dept */}
                            <div>
                                <Chip
                                    label={backup.department}
                                    size="small"
                                    className="font-bold text-[10px] bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300"
                                />
                            </div>

                            {/* Systems */}
                            <div className="flex flex-wrap gap-1.5">
                                {backup.systems.map(s => (
                                    <span
                                        key={s}
                                        className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-600 dark:text-gray-400 bg-white dark:bg-gray-800/50"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>

                            {/* Location */}
                            <div>
                                <Typography className="text-slate-500 dark:text-gray-400 text-xs font-medium truncate">
                                    {backup.location}
                                </Typography>
                            </div>

                            {/* Status */}
                            <div>
                                {getStatusChip(backup.status)}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-1">
                                {backup.attachment_url && (
                                    <IconButton
                                        size="small"
                                        component="a"
                                        href={`${API_BASE_URL}/${backup.attachment_url}`}
                                        target="_blank"
                                        sx={{ color: '#6366f1' }}
                                    >
                                        <DownloadIcon fontSize="small" />
                                    </IconButton>
                                )}
                                <IconButton
                                    size="small"
                                    onClick={() => handleDelete(backup.id)}
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </div>
                        </div>
                    ))}
                </div>

                {backups.length === 0 && !loading && (
                    <Box className="p-24 text-center">
                        <Typography className="text-slate-400 dark:text-gray-500 italic text-sm font-medium">
                            No backup records found matching the criteria.
                        </Typography>
                    </Box>
                )}
            </div>
        </div>
    );
};

export default IctDashboardApp;
