'use client';

import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useEffect, useState } from 'react';
import useUser from '@auth/useUser';
import { authFetchUsers, authAddUser, authUpdateUserStatus } from '@auth/authApi';
import { User } from '@auth/user';
import {
    Typography,
    Avatar,
    Switch,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Chip,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';
import { useProject } from '@/context/ProjectContext';

function IctUsersPage() {
    const { data: currentUser } = useUser();
    const { activeSystem } = useProject();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [openAdd, setOpenAdd] = useState(false);

    let managedRole = 'elv';
    if (activeSystem === 'ict') managedRole = 'ict';
    if (activeSystem === 'business') managedRole = 'businesses';
    const systemLabel = activeSystem === 'business' ? 'BUSINESS' : managedRole.toUpperCase();

    let ROLE_OPTIONS = [
        { value: managedRole, label: activeSystem === 'business' ? 'Business User' : `${systemLabel} Specialist` },
        { value: 'supervisor', label: 'Supervisor' },
    ];

    if (activeSystem === 'elv') {
        ROLE_OPTIONS.push({ value: 'facilitator', label: 'Facilitator' });
    }

    if (activeSystem === 'business') {
        ROLE_OPTIONS = [
            { value: 'businesses', label: 'Business Member' },
            { value: 'business_admin', label: 'Project Manager' },
            { value: 'business_higher_admin', label: 'General Manager' },
            { value: 'admin', label: 'Director' },
            { value: 'supervisor', label: 'Supervisor' }
        ];
    }

    const [form, setForm] = useState({ name: '', email: '', password: '', role: managedRole });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await authFetchUsers();
            const filtered = data.filter(u => {
                const roles = Array.isArray(u.role) ? u.role : [u.role];
                let allowedRoles = [managedRole, 'supervisor'];

                if (activeSystem === 'elv') {
                    allowedRoles.push('facilitator');
                }

                if (activeSystem === 'business') {
                    allowedRoles = ['businesses', 'business_admin', 'business_higher_admin', 'admin', 'superadmin', 'supervisor'];
                }

                return roles.some(r => allowedRoles.includes(r?.toLowerCase() || ''));
            });
            setUsers(filtered);
        } catch {
            enqueueSnackbar(`Failed to load ${systemLabel} users`, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (user: User) => {
        try {
            const newStatus = !user.isBlocked;
            const { user: updated } = await authUpdateUserStatus(user.id, { isBlocked: newStatus });
            setUsers(prev => prev.map(u => u.id === user.id ? updated : u));
            enqueueSnackbar(`User ${newStatus ? 'blocked' : 'unblocked'} successfully`, { variant: 'success' });
        } catch {
            enqueueSnackbar('Failed to update user', { variant: 'error' });
        }
    };

    const handleAddUser = async () => {
        setSubmitting(true);
        try {
            const { user: newUser } = await authAddUser({ ...form });
            setUsers(prev => [...prev, newUser]);
            enqueueSnackbar(`User created successfully`, { variant: 'success' });
            setOpenAdd(false);
            setForm({ name: '', email: '', password: '', role: managedRole });
        } catch (err: any) {
            const errorData = err?.response?.data;
            enqueueSnackbar(errorData?.message || `Failed to create user`, { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <FuseLoading />;

    const isSupervisor = Array.isArray(currentUser?.role)
        ? currentUser.role.some(r => ['supervisor', 'admin', 'superadmin', 'director'].includes(r.toLowerCase()))
        : ['supervisor', 'admin', 'superadmin', 'director'].includes(currentUser?.role?.toLowerCase() || '');

    if (!isSupervisor) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-8 text-slate-400">
                <FuseSvgIcon size={40} className="text-slate-300">heroicons-outline:lock-closed</FuseSvgIcon>
                <Typography variant="h6" className="font-bold text-slate-600">Access Denied</Typography>
                <Typography variant="body2" className="text-slate-400">Only supervisors can manage {systemLabel} personnel.</Typography>
            </div>
        );
    }

    return (
        <div className="p-24 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-20">
                <div>
                    <Typography variant="h5" className="font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {systemLabel} User Management
                    </Typography>
                    <Typography className="text-slate-400 dark:text-gray-400 text-sm mt-1">
                        {activeSystem === 'business'
                            ? "Manage business user accounts and system access"
                            : `Manage ${systemLabel} specialist accounts and system access`}
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<FuseSvgIcon size={16}>heroicons-outline:user-plus</FuseSvgIcon>}
                    onClick={() => setOpenAdd(true)}
                    sx={{
                        borderRadius: '12px',
                        fontWeight: 900,
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        '&:hover': { 
                            background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                        },
                        boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)',
                        px: 3,
                        py: 1.2,
                        fontSize: '13px'
                    }}
                >
                    Add {systemLabel} User
                </Button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-12 mb-20">
                {[
                    { label: 'Total', value: users.length, color: '#6366f1' },
                    { label: 'Active', value: users.filter(u => !u.isBlocked).length, color: '#10b981' },
                    { label: 'Blocked', value: users.filter(u => u.isBlocked).length, color: '#ef4444' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm px-16 py-12 flex items-center gap-12">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}18` }}>
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
                        </div>
                        <div>
                            <Typography className="text-xl font-black text-slate-800 dark:text-white leading-none">{stat.value}</Typography>
                            <Typography className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">{stat.label}</Typography>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="grid gap-6 px-20 py-10 bg-slate-50 dark:bg-gray-900/50 border-b border-slate-100 dark:border-white/10"
                    style={{ gridTemplateColumns: '2fr 120px 160px 80px' }}>
                    {[(activeSystem === 'business' ? 'User' : 'Specialist'), 'Status', 'Last Login', 'Manage'].map(h => (
                        <Typography key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">
                            {h}
                        </Typography>
                    ))}
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-50 dark:divide-white/5">
                    {users.map(user => {
                        const isSelf = user.id === currentUser?.id;
                        return (
                            <div
                                key={user.id}
                                className="grid gap-6 px-20 py-12 items-center hover:bg-slate-50/60 dark:hover:bg-white/[0.03] transition-colors"
                                style={{ gridTemplateColumns: '2fr 120px 160px 80px' }}
                            >
                                <div className="flex items-center gap-12 min-w-0">
                                    <Avatar
                                        src={user.photoURL}
                                        sx={{
                                            width: 36, height: 36,
                                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                            fontSize: '14px', fontWeight: 700
                                        }}
                                    >
                                        {user.displayName?.[0] || user.name?.[0]}
                                    </Avatar>
                                    <div className="min-w-0">
                                        <Typography className="font-bold text-slate-800 dark:text-gray-100 text-sm truncate leading-tight">
                                            {user.displayName || user.name}
                                        </Typography>
                                        <Typography className="text-xs text-slate-400 dark:text-gray-500 truncate font-mono">
                                            {user.email}
                                        </Typography>
                                    </div>
                                </div>

                                <div>
                                    <Chip
                                        label={user.isBlocked ? 'Blocked' : 'Active'}
                                        size="small"
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '10px',
                                            backgroundColor: user.isBlocked ? '#fef2f2' : '#f0fdf4',
                                            color: user.isBlocked ? '#ef4444' : '#10b981',
                                            border: `1px solid ${user.isBlocked ? '#fecaca' : '#bbf7d0'}`,
                                        }}
                                    />
                                </div>

                                <Typography className="text-xs text-slate-400 dark:text-gray-500 font-medium">
                                    {user.lastSeenAt ? format(new Date(user.lastSeenAt), 'MMM dd, HH:mm') : '—'}
                                </Typography>

                                <div className="flex justify-start">
                                    <Switch
                                        checked={!!user.isBlocked}
                                        onChange={() => handleToggleBlock(user)}
                                        size="small"
                                        disabled={isSelf}
                                        sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#ef4444' },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#ef4444' },
                                            opacity: isSelf ? 0.3 : 1,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {users.length === 0 && (
                    <div className="py-40 text-center flex flex-col items-center gap-8">
                        <FuseSvgIcon size={36} className="text-slate-200 dark:text-gray-700">heroicons-outline:users</FuseSvgIcon>
                        <Typography className="text-slate-400 dark:text-gray-500 font-bold text-sm">No {systemLabel} {activeSystem === 'business' ? 'users' : 'personnel'} registered yet</Typography>
                    </div>
                )}
            </div>

            {/* Add User Dialog */}
            <Dialog
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: '20px' } }}
            >
                <DialogTitle className="px-24 pt-20 pb-4 font-black text-xl text-slate-800 dark:text-white uppercase tracking-tight">
                    Add {systemLabel} User
                </DialogTitle>
                <DialogContent className="px-24 pt-0">
                    <Typography className="text-slate-400 dark:text-gray-400 text-xs mb-16 font-medium">
                        Configure {activeSystem === 'business' ? 'user' : 'specialist'} account and permissions.
                    </Typography>
                    
                    <div className="flex flex-col gap-12 pt-4">
                        <div className="grid grid-cols-2 gap-12">
                            <TextField label="Full Name" fullWidth size="small" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })} />
                            <TextField label="Email" fullWidth size="small" value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                        
                        <TextField label="Password" type="password" fullWidth size="small" value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })} />

                        {/* Role selector */}
                        <div className="mt-8">
                            <Typography className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-12">
                                System Role
                            </Typography>
                            <div className={`grid gap-12 ${activeSystem === 'elv' || activeSystem === 'business' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                {ROLE_OPTIONS.map(opt => {
                                    const isSelected = form.role === opt.value;
                                    const roleIcons: Record<string, string> = {
                                        ict: 'heroicons-outline:identification',
                                        elv: 'heroicons-outline:identification',
                                        business: 'heroicons-outline:identification',
                                        businesses: 'heroicons-outline:identification',
                                        business_admin: 'heroicons-outline:briefcase',
                                        business_higher_admin: 'heroicons-outline:academic-cap',
                                        admin: 'heroicons-outline:shield-check',
                                        supervisor: 'heroicons-outline:cog-8-tooth',
                                        facilitator: 'heroicons-outline:user-group',
                                    };

                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, role: opt.value })}
                                            className={`flex flex-col items-center justify-center p-16 rounded-2xl border-2 transition-all duration-200 group ${
                                                isSelected
                                                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm ring-4 ring-indigo-500/10'
                                                    : 'border-slate-100 dark:border-white/5 bg-white dark:bg-gray-800/50 hover:border-slate-200 dark:hover:border-white/10'
                                            }`}
                                        >
                                            <div className={`mb-8 p-8 rounded-xl transition-colors ${
                                                isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-slate-500'
                                            }`}>
                                                <FuseSvgIcon size={20}>{roleIcons[opt.value] || 'heroicons-outline:user'}</FuseSvgIcon>
                                            </div>
                                            <div className="flex flex-col items-center text-center">
                                                <span className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${
                                                    isSelected ? 'text-indigo-500' : 'text-slate-400 dark:text-gray-500'
                                                }`}>Access</span>
                                                <span className={`font-black text-[11px] leading-tight ${
                                                    isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-gray-200'
                                                }`}>{opt.label}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </DialogContent>
                <DialogActions className="px-24 pb-24 pt-8 gap-12">
                    <Button 
                        variant="text" 
                        onClick={() => setOpenAdd(false)}
                        className="flex-1 rounded-xl font-bold py-10 text-slate-500 normal-case text-sm hover:bg-slate-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        disabled={submitting || !form.name || !form.email || !form.password}
                        onClick={handleAddUser}
                        className="flex-1 rounded-xl font-black py-10 shadow-lg shadow-indigo-500/20 normal-case text-sm"
                        sx={{ 
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
                            '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #4338ca)' },
                            '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' }
                        }}
                    >
                        {submitting ? 'Creating...' : (
                            form.role === managedRole 
                                ? (activeSystem === 'business' ? `Create Business User` : `Create ${systemLabel} Specialist`)
                                : `Create ${form.role.charAt(0).toUpperCase() + form.role.slice(1)}`
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default IctUsersPage;
