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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';

function UsersPage() {
    const { data: currentUser } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [openAdd, setOpenAdd] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
    const [submitting, setSubmitting] = useState(false);

    const isSupervisor = currentUser?.role === 'supervisor' || (Array.isArray(currentUser?.role) && currentUser.role.includes('supervisor'));
    const isBusinessAdmin = currentUser?.role === 'business_admin' || (Array.isArray(currentUser?.role) && currentUser.role.includes('business_admin'));
    const isSuperAdmin = currentUser?.role === 'superadmin' || (Array.isArray(currentUser?.role) && currentUser.role.includes('superadmin'));
    const isAdmin = currentUser?.role === 'admin' || (Array.isArray(currentUser?.role) && currentUser.role.includes('admin'));

    const canManageUsers = isSupervisor || isBusinessAdmin || isSuperAdmin || isAdmin;

    useEffect(() => { loadUsers(); }, []);

    useEffect(() => {
        if (openAdd) {
            setForm({
                name: '',
                email: '',
                password: '',
                role: isBusinessAdmin ? 'businesses' : 'member'
            });
        }
    }, [openAdd, isBusinessAdmin]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await authFetchUsers();
            setUsers(data);
        } catch {
            enqueueSnackbar('Failed to load users', { variant: 'error' });
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
            const { user: newUser } = await authAddUser(form);
            setUsers(prev => [...prev, newUser]);
            enqueueSnackbar('User created successfully', { variant: 'success' });
            setOpenAdd(false);
            setForm({ name: '', email: '', password: '', role: isBusinessAdmin ? 'businesses' : 'member' });
        } catch {
            enqueueSnackbar('Failed to create user', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const displayedUsers = isBusinessAdmin 
        ? users.filter(u => {
            const r = Array.isArray(u.role) ? u.role[0] : u.role;
            return ['businesses', 'business_admin', 'business_higher_admin', 'superadmin', 'admin'].includes(r);
        })
        : users;

    if (loading) return <FuseLoading />;

    if (currentUser && !canManageUsers) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-8">
                <FuseSvgIcon size={48} className="text-gray-300">heroicons-outline:lock-closed</FuseSvgIcon>
                <Typography variant="h6" className="font-bold">Access Denied</Typography>
                <Typography variant="body2" color="textSecondary">You do not have permission to manage users.</Typography>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-24">
            {/* Header — matches inventory style with left blue border accent */}
            <div className="flex items-start justify-between mb-24">
                <div className="flex items-start gap-12">
                    <div className="w-4 h-full min-h-[40px] bg-blue-500 rounded-full mt-1" />
                    <div>
                        <Typography className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                            User Management
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            Manage team accounts and access permissions
                        </Typography>
                    </div>
                </div>
                <button
                    onClick={() => setOpenAdd(true)}
                    className="flex items-center gap-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-14 py-5 rounded-lg transition-colors shrink-0"
                >
                    <FuseSvgIcon size={13}>heroicons-outline:plus</FuseSvgIcon>
                    Add New User
                </button>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden">

                {/* Section label row */}
                <div className="flex items-center justify-between px-16 py-10 border-b border-gray-100 dark:border-white/10">
                    <Typography className="text-sm font-bold text-gray-800 dark:text-white">
                        User List
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {displayedUsers.length} {displayedUsers.length === 1 ? 'user' : 'users'}
                    </Typography>
                </div>

                {/* Column Headers */}
                <div className="grid gap-4 px-16 py-8 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5"
                    style={{ gridTemplateColumns: '2fr 120px 100px 130px 70px' }}>
                    {['Name', 'Role', 'Status', 'Last Active', 'Block'].map(h => (
                        <Typography key={h} variant="caption"
                            className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {h}
                        </Typography>
                    ))}
                </div>

                {/* Rows */}
                {displayedUsers.map((user, i) => {
                    const role = Array.isArray(user.role) ? user.role[0] : user.role;
                    const isSelf = user.id === currentUser?.id;
                    return (
                        <div
                            key={user.id}
                            className={`grid gap-4 px-16 py-10 items-center hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors ${i < displayedUsers.length - 1 ? 'border-b border-gray-100 dark:border-white/[0.06]' : ''}`}
                            style={{ gridTemplateColumns: '2fr 120px 100px 130px 70px' }}
                        >
                            {/* Name + email */}
                            <div className="flex items-center gap-10 min-w-0">
                                <Avatar src={user.photoURL} sx={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                                    {user.displayName?.[0]}
                                </Avatar>
                                <div className="min-w-0">
                                    <Typography variant="body2" className="font-semibold text-sm truncate leading-tight">
                                        {user.displayName}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" className="truncate text-xs">
                                        {user.email}
                                    </Typography>
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <span className={`inline-flex items-center px-8 py-2 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                    role === 'supervisor'
                                         ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800'
                                     : role === 'facilitator'
                                         ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                                     : role === 'ict'
                                         ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                                     : role === 'business'
                                         ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800'
                                     : role === 'businesses'
                                         ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                                     : role === 'business_admin'
                                         ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800'
                                     : role === 'business_higher_admin'
                                         ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800'
                                     : role === 'superadmin' || role === 'admin'
                                         ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/20 dark:text-fuchsia-300 dark:border-fuchsia-800'
                                         : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800'
                                 }`}>
                                    {role}
                                </span>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-6">
                                <span className={`w-[7px] h-[7px] rounded-full ${user.isBlocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                <Typography variant="caption" className={`font-semibold ${user.isBlocked ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {user.isBlocked ? 'Blocked' : 'Active'}
                                </Typography>
                            </div>

                            {/* Last Active */}
                            <Typography variant="caption" color="textSecondary" className="text-xs">
                                {user.lastSeenAt ? format(new Date(user.lastSeenAt), 'MMM dd, HH:mm') : '—'}
                            </Typography>

                            {/* Block Toggle */}
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
                    );
                })}

                {displayedUsers.length === 0 && (
                    <div className="py-40 text-center text-gray-400">
                        <Typography variant="body2">No users found</Typography>
                    </div>
                )}
            </div>

            {/* Add User Dialog */}
            <Dialog
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ px: 3, pt: 3, pb: 1, fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                    Create New Account
                </DialogTitle>
                <DialogContent sx={{ px: 3, pt: 1 }}>
                    <div className="flex flex-col gap-14 py-8">
                        <TextField label="Full Name" fullWidth size="small" value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <TextField label="Email Address" fullWidth size="small" value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <TextField label="Temporary Password" type="password" fullWidth size="small" value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
                            <InputLabel>Role</InputLabel>
                            <Select value={form.role} label="Role" onChange={e => setForm({ ...form, role: e.target.value })}>
                                {isBusinessAdmin ? (
                                    <>
                                        <MenuItem value="businesses">Business Member</MenuItem>
                                        <MenuItem value="business_higher_admin">General Manager</MenuItem>
                                        <MenuItem value="superadmin">Director</MenuItem>
                                    </>
                                ) : (
                                    <>
                                        <MenuItem value="member">Member</MenuItem>
                                        <MenuItem value="supervisor">Supervisor</MenuItem>
                                        <MenuItem value="facilitator">Facilitator</MenuItem>
                                        <MenuItem value="elv">ELV</MenuItem>
                                        <MenuItem value="ict">ICT</MenuItem>
                                        <MenuItem value="business">Business</MenuItem>
                                        <MenuItem value="businesses">Business Member</MenuItem>
                                        <MenuItem value="business_admin">Project Manager</MenuItem>
                                        <MenuItem value="business_higher_admin">General Manager</MenuItem>
                                        <MenuItem value="superadmin">Director</MenuItem>
                                    </>
                                )}
                            </Select>
                        </FormControl>
                    </div>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
                    <button onClick={() => setOpenAdd(false)}
                        className="text-xs font-bold px-14 py-7 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleAddUser}
                        disabled={submitting || !form.name || !form.email || !form.password}
                        className="text-xs font-black px-16 py-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
                        {submitting ? 'Creating...' : 'Create Account'}
                    </button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default UsersPage;
