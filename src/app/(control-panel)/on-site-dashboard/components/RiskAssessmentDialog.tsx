import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, Typography, IconButton, Avatar } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useQueryClient } from '@tanstack/react-query';
import { RiskAssessment, createRiskAssessment, updateRiskAssessment, deleteRiskAssessment } from '../../scheduling/scheduleApi';
import { useSnackbar } from 'notistack';
import { LoadingButton } from '@mui/lab';
import useUser from '@auth/useUser';

interface RiskAssessmentDialogProps {
    open: boolean;
    onClose: () => void;
    report: RiskAssessment | null;
}

const RISK_TYPES = [
    { value: 'fire', label: 'Fire Risk', icon: 'heroicons-outline:fire', color: 'text-red-500' },
    { value: 'hazard', label: 'Physical Hazard', icon: 'heroicons-outline:exclamation-triangle', color: 'text-amber-500' },
    { value: 'health', label: 'Health & Safety', icon: 'heroicons-outline:heart', color: 'text-rose-500' },
    { value: 'security', label: 'Security Risk', icon: 'heroicons-outline:shield-check', color: 'text-blue-500' },
    { value: 'environmental', label: 'Environmental', icon: 'heroicons-outline:globe-alt', color: 'text-green-500' },
    { value: 'other', label: 'Other', icon: 'heroicons-outline:document-text', color: 'text-gray-500' },
];

const RISK_LEVELS = [
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'high', label: 'High', color: 'error' },
    { value: 'extreme', label: 'Extreme', color: 'error' },
];

const STATUS_OPTIONS = [
    { value: 'open', label: 'Open' },
    { value: 'in review', label: 'In Review' },
    { value: 'mitigated', label: 'Mitigated' },
    { value: 'closed', label: 'Closed' },
];

function RiskAssessmentDialog({ open, onClose, report }: RiskAssessmentDialogProps) {
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { data: user } = useUser();
    
    const [formData, setFormData] = useState({
        title: '',
        type: 'fire',
        risk_level: 'medium',
        description: '',
        mitigation_plan: '',
        status: 'open',
        assessment_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (report) {
            setFormData({
                title: report.title,
                type: report.type,
                risk_level: report.risk_level,
                description: report.description || '',
                mitigation_plan: report.mitigation_plan || '',
                status: report.status,
                assessment_date: report.assessment_date,
            });
        } else {
            setFormData({
                title: '',
                type: 'fire',
                risk_level: 'medium',
                description: '',
                mitigation_plan: '',
                status: 'open',
                assessment_date: new Date().toISOString().split('T')[0],
            });
        }
    }, [report, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (report) {
                await updateRiskAssessment(report.id, formData);
                enqueueSnackbar('Assessment updated successfully', { variant: 'success' });
            } else {
                await createRiskAssessment(formData);
                enqueueSnackbar('Assessment created successfully', { variant: 'success' });
            }
            queryClient.invalidateQueries({ queryKey: ['risk-assessments'] });
            onClose();
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to save assessment', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!report) return;
        if (!window.confirm('Are you sure you want to delete this assessment?')) return;
        
        setDeleting(true);
        try {
            await deleteRiskAssessment(report.id);
            enqueueSnackbar('Assessment deleted', { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['risk-assessments'] });
            onClose();
        } catch (error) {
            enqueueSnackbar('Failed to delete assessment', { variant: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    const isSupervisor = user?.role === 'supervisor' || (Array.isArray(user?.role) && user.role.includes('supervisor'));

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{ className: "rounded-[32px] p-4" }}
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle className="flex justify-between items-center px-6 pt-6">
                    <Box className="flex items-center gap-4">
                        <Avatar className="bg-red-50 text-red-600 w-12 h-12 rounded-2xl">
                            <FuseSvgIcon size={28}>heroicons-outline:shield-exclamation</FuseSvgIcon>
                        </Avatar>
                        <Box>
                            <Typography variant="h5" className="font-black text-gray-800 dark:text-gray-100">
                                {report ? 'Edit Risk Assessment' : 'New Risk Assessment'}
                            </Typography>
                            <Typography variant="body2" className="text-gray-500 font-medium">
                                {report ? `Assessment #${report.id}` : 'Identify and document site hazards'}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small" className="bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <FuseSvgIcon size={20}>heroicons-outline:x-mark</FuseSvgIcon>
                    </IconButton>
                </DialogTitle>

                <DialogContent className="px-6 py-8">
                    <Box className="flex flex-col md:flex-row gap-8">
                        <Box className="flex-1 flex flex-col gap-6">
                            <TextField
                                label="Assessment Title"
                                fullWidth
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                            />
                            <TextField
                                label="Risk Description"
                                multiline
                                rows={4}
                                fullWidth
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                            />
                            <TextField
                                label="Mitigation & Control Plan"
                                placeholder="How will this risk be controlled or eliminated?"
                                multiline
                                rows={4}
                                fullWidth
                                value={formData.mitigation_plan}
                                onChange={(e) => setFormData({ ...formData, mitigation_plan: e.target.value })}
                                className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                            />
                        </Box>

                        <Box className="w-full md:w-[320px] flex flex-col gap-6 bg-gray-50/50 dark:bg-gray-900/50 p-6 rounded-[24px]">
                            <TextField
                                select
                                label="Risk Type"
                                fullWidth
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                            >
                                {RISK_TYPES.map((option) => (
                                    <MenuItem key={option.value} value={option.value} className="flex items-center gap-3">
                                        <FuseSvgIcon size={20} className={option.color}>{option.icon}</FuseSvgIcon>
                                        <Typography variant="body2" className="font-bold ml-2">{option.label}</Typography>
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label="Initial Risk Level"
                                fullWidth
                                value={formData.risk_level}
                                onChange={(e) => setFormData({ ...formData, risk_level: e.target.value as any })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                            >
                                {RISK_LEVELS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        <Typography variant="body2" className="font-black uppercase tracking-widest">{option.label}</Typography>
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label="Current Status"
                                fullWidth
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        <Typography variant="body2" className="font-bold">{option.label}</Typography>
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Assessment Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.assessment_date}
                                onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                            />
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions className="px-6 pb-6 pt-0 flex justify-between">
                    <Box>
                        {report && isSupervisor && (
                            <LoadingButton 
                                color="error" 
                                onClick={handleDelete}
                                loading={deleting}
                                startIcon={<FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>}
                                className="rounded-xl font-bold"
                            >
                                Delete
                            </LoadingButton>
                        )}
                    </Box>
                    <Box className="flex gap-3">
                        <Button onClick={onClose} className="rounded-xl font-bold text-gray-400">Cancel</Button>
                        <LoadingButton
                            type="submit"
                            variant="contained"
                            color="primary"
                            loading={loading}
                            className="rounded-xl px-8 font-black bg-indigo-600 hover:bg-indigo-700 h-[48px] shadow-lg shadow-indigo-500/20"
                        >
                            {report ? 'Update Assessment' : 'Save Assessment'}
                        </LoadingButton>
                    </Box>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default RiskAssessmentDialog;
