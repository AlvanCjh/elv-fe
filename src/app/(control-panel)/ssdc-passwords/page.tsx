'use client';
import { FC, useState } from 'react';
import { 
    Typography, Paper, Box, Button, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, 
    CircularProgress, Tooltip, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, alpha, useTheme 
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useProject } from '@/context/ProjectContext';
import { 
    useSsdcPasswords, useAddSsdcPassword, 
    useUpdateSsdcPassword, useDeleteSsdcPassword, SsdcPassword 
} from './ssdcPasswordsApi';
import { enqueueSnackbar } from 'notistack';

const SsdcPasswordsPage: FC = () => {
    const theme = useTheme();
    const { activeProjectId } = useProject();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPassword, setEditingPassword] = useState<SsdcPassword | null>(null);
    const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

    // Form state
    const [systemName, setSystemName] = useState('');
    const [username, setUsername] = useState('');
    const [passwordText, setPasswordText] = useState('');
    const [notes, setNotes] = useState('');

    const { data: passwords = [], isLoading } = useSsdcPasswords(activeProjectId);
    const addMutation = useAddSsdcPassword();
    const updateMutation = useUpdateSsdcPassword();
    const deleteMutation = useDeleteSsdcPassword();

    const handleOpenDialog = (pw?: SsdcPassword) => {
        if (pw) {
            setEditingPassword(pw);
            setSystemName(pw.system_name);
            setUsername(pw.username || '');
            setPasswordText(pw.password || '');
            setNotes(pw.notes || '');
        } else {
            setEditingPassword(null);
            setSystemName('');
            setUsername('');
            setPasswordText('');
            setNotes('');
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!activeProjectId || !systemName.trim()) return;

        const payload = {
            project_id: activeProjectId,
            system_name: systemName,
            username,
            password: passwordText,
            notes
        };

        try {
            if (editingPassword) {
                await updateMutation.mutateAsync({ id: editingPassword.id, payload });
                enqueueSnackbar('Password record updated', { variant: 'success' });
            } else {
                await addMutation.mutateAsync(payload);
                enqueueSnackbar('Password record added', { variant: 'success' });
            }
            setIsDialogOpen(false);
        } catch (error) {
            enqueueSnackbar('Failed to save record', { variant: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this credentials record?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            enqueueSnackbar('Record deleted', { variant: 'info' });
        } catch (error) {
            enqueueSnackbar('Failed to delete record', { variant: 'error' });
        }
    };

    const togglePasswordView = (id: number) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-slate-50 dark:bg-slate-950">
                <CircularProgress sx={{ color: '#f59e0b' }} size={48} />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Box className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <FuseSvgIcon size={28} className="text-white">heroicons-outline:key</FuseSvgIcon>
                            </Box>
                            SSDC Passwords
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium ml-15">Secure access management for site infrastructure</p>
                    </div>

                    <Button 
                        variant="contained"
                        onClick={() => handleOpenDialog()}
                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-2xl px-8 py-3.5 font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 dark:shadow-none"
                    >
                        New Credentials
                    </Button>
                </div>

                {/* Main Content */}
                <Paper className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl dark:shadow-2xl">
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow className="bg-slate-50/50 dark:bg-white/5">
                                    <TableCell className="font-black text-[11px] uppercase tracking-widest text-slate-400 py-6 pl-10">System / Infrastructure</TableCell>
                                    <TableCell className="font-black text-[11px] uppercase tracking-widest text-slate-400 py-6">Username</TableCell>
                                    <TableCell className="font-black text-[11px] uppercase tracking-widest text-slate-400 py-6">Password</TableCell>
                                    <TableCell className="font-black text-[11px] uppercase tracking-widest text-slate-400 py-6">Notes</TableCell>
                                    <TableCell className="font-black text-[11px] uppercase tracking-widest text-slate-400 py-6 pr-10 text-right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {passwords.map((pw) => (
                                    <TableRow key={pw.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                        <TableCell className="py-6 pl-10">
                                            <Typography className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{pw.system_name}</Typography>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                {pw.username || '—'}
                                            </code>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex items-center gap-2">
                                                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    {showPasswords[pw.id] ? pw.password : '••••••••'}
                                                </code>
                                                <IconButton size="small" onClick={() => togglePasswordView(pw.id)} className="text-slate-400 hover:text-indigo-500">
                                                    <FuseSvgIcon size={16}>{showPasswords[pw.id] ? 'heroicons-outline:eye-slash' : 'heroicons-outline:eye'}</FuseSvgIcon>
                                                </IconButton>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 max-w-xs">
                                            <Typography className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{pw.notes || 'No technical notes'}</Typography>
                                        </TableCell>
                                        <TableCell className="py-6 pr-10 text-right">
                                            <Box className="flex items-center justify-end gap-1">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleOpenDialog(pw)}
                                                    className="text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleDelete(pw.id)}
                                                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {passwords.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Box className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                    <FuseSvgIcon size={32}>heroicons-outline:shield-check</FuseSvgIcon>
                                                </Box>
                                                <Typography className="text-slate-400 font-bold uppercase tracking-widest text-xs">No credentials found for this project</Typography>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </div>

            {/* Dialog */}
            <Dialog 
                open={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)}
                PaperProps={{
                    sx: { borderRadius: '32px', padding: '8px', maxWidth: '500px', width: '100%', backgroundImage: 'none', bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff' }
                }}
            >
                <DialogTitle>
                    <div className="flex items-center gap-3">
                        <Box className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <FuseSvgIcon size={20}>heroicons-outline:key</FuseSvgIcon>
                        </Box>
                        <Typography className="text-xl font-black">{editingPassword ? 'Edit Credentials' : 'Add Credentials'}</Typography>
                    </div>
                </DialogTitle>
                <DialogContent>
                    <div className="flex flex-col gap-5 pt-4">
                        <TextField
                            label="System / Service Name"
                            placeholder="e.g. Cisco Swtich Core, Fire Alarm Panel"
                            fullWidth
                            value={systemName}
                            onChange={(e) => setSystemName(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }}
                        />
                        <div className="flex gap-4">
                            <TextField
                                label="Username"
                                fullWidth
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }}
                            />
                            <TextField
                                label="Password"
                                fullWidth
                                value={passwordText}
                                onChange={(e) => setPasswordText(e.target.value)}
                                slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }}
                            />
                        </div>
                        <TextField
                            label="Security & Technical Notes"
                            multiline
                            rows={3}
                            fullWidth
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 700 } } }}
                        />
                    </div>
                </DialogContent>
                <DialogActions className="p-6">
                    <Button onClick={() => setIsDialogOpen(false)} className="rounded-xl font-black uppercase tracking-widest px-6">Cancel</Button>
                    <Button 
                        onClick={handleSave}
                        variant="contained" 
                        color="warning"
                        disabled={!systemName || addMutation.isPending || updateMutation.isPending}
                        className="rounded-2xl font-black uppercase tracking-widest px-10 py-3.5 shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        {(addMutation.isPending || updateMutation.isPending) ? <CircularProgress size={20} color="inherit" /> : 'Save Key'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default SsdcPasswordsPage;
