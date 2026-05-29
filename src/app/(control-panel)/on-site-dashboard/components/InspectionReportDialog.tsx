import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Typography,
    Box,
    CircularProgress,
    IconButton
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInspectionReport, updateInspectionReport, deleteInspectionReport, useUsers, InspectionReport } from '../../scheduling/scheduleApi';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useProject } from '@/context/ProjectContext';
import useUser from '@auth/useUser';
import { enqueueSnackbar } from 'notistack';

interface InspectionReportDialogProps {
    open: boolean;
    onClose: () => void;
    report?: InspectionReport | null;
    initialDate?: Date;
}

function InspectionReportDialog({ open, onClose, report, initialDate }: InspectionReportDialogProps) {
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();
    const { data: users } = useUsers();
    const { data: currentUser } = useUser();

    const isSupervisor = currentUser?.role === 'supervisor' || (Array.isArray(currentUser?.role) && currentUser.role.includes('supervisor'));
    const isAssignedUser = currentUser?.id?.toString() === report?.assigned_to_user_id?.toString();
    const canUpdateStatus = !report || isSupervisor || isAssignedUser;
    const canDelete = isSupervisor;
    const canEditBasicInfo = !report || isSupervisor;

    const [formData, setFormData] = useState({
        title: '',
        rfwi_ref_no: '',
        location: '',
        gridline_zone: '',
        date_inspected: new Date().toLocaleDateString('en-CA'),
        consultant_comments: '',
        description: '',
        assigned_to_user_id: '',
        inspection_date: new Date().toLocaleDateString('en-CA'), // Submission Date
        status: 'pending' as any
    });

    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (report) {
            setFormData({
                title: report.title,
                rfwi_ref_no: report.rfwi_ref_no || '',
                location: report.location || '',
                gridline_zone: report.gridline_zone || '',
                date_inspected: report.date_inspected || '',
                consultant_comments: report.consultant_comments || '',
                description: report.description || '',
                assigned_to_user_id: report.assigned_to_user_id,
                inspection_date: report.inspection_date,
                status: report.status
            });
        } else {
            setFormData({
                title: '',
                rfwi_ref_no: '',
                location: '',
                gridline_zone: '',
                date_inspected: initialDate ? initialDate.toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
                consultant_comments: '',
                description: '',
                assigned_to_user_id: '',
                inspection_date: initialDate ? initialDate.toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
                status: 'pending'
            });
            setFile(null);
        }
    }, [report, open, initialDate]);

    const createMutation = useMutation({
        mutationFn: createInspectionReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-reports'] });
            enqueueSnackbar('Inspection report created successfully', { variant: 'success' });
            onClose();
        },
        onError: async (error: any) => {
            let errorMsg = 'Failed to create report';
            if (error.response) {
                try {
                    const errorData = await error.response.json();
                    if (errorData.message) errorMsg = errorData.message;
                    if (errorData.errors) errorMsg += ': ' + Object.values(errorData.errors).flat().join(', ');
                } catch (e) {}
            }
            enqueueSnackbar(errorMsg, { variant: 'error' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; formData: FormData }) => updateInspectionReport(data.id, data.formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-reports'] });
            enqueueSnackbar('Inspection report updated successfully', { variant: 'success' });
            onClose();
        },
        onError: async (error: any) => {
            let errorMsg = 'Failed to update report';
            if (error.response) {
                try {
                    const errorData = await error.response.json();
                    if (errorData.message) errorMsg = errorData.message;
                    if (errorData.errors) errorMsg += ': ' + Object.values(errorData.errors).flat().join(', ');
                } catch (e) {}
            }
            enqueueSnackbar(errorMsg, { variant: 'error' });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteInspectionReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-reports'] });
            onClose();
        }
    });

    const handleSubmit = () => {
        const data = new FormData();
        data.append('project_id', activeProjectId!.toString());
        data.append('category', 'inspection'); // Added default category
        data.append('title', formData.title);
        data.append('rfwi_ref_no', formData.rfwi_ref_no);
        data.append('location', formData.location);
        data.append('gridline_zone', formData.gridline_zone);
        data.append('date_inspected', formData.date_inspected);
        data.append('consultant_comments', formData.consultant_comments);
        data.append('description', formData.description);
        data.append('assigned_to_user_id', formData.assigned_to_user_id);
        data.append('inspection_date', formData.inspection_date);
        data.append('status', formData.status);
        
        if (file) {
            data.append('file', file);
        }

        if (report) {
            updateMutation.mutate({ id: report.id, formData: data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this inspection report?')) {
            deleteMutation.mutate(report!.id);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle className="flex justify-between items-center">
                <Typography variant="h6" className="font-bold">
                    {report ? 'Edit Inspection Report' : 'Upload Inspection Report'}
                </Typography>
                {report && canDelete && (
                    <IconButton color="error" onClick={handleDelete} disabled={isPending}>
                        <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
                    </IconButton>
                )}
            </DialogTitle>
            <DialogContent>
                <Box className="flex flex-col gap-4 mt-2">
                    <TextField
                        label="Report Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        fullWidth
                        required
                        disabled={!canEditBasicInfo}
                    />

                    <Box className="grid grid-cols-2 gap-4">
                        <TextField
                            label="RFWI Ref No"
                            value={formData.rfwi_ref_no}
                            onChange={(e) => setFormData({ ...formData, rfwi_ref_no: e.target.value })}
                            fullWidth
                            disabled={!canEditBasicInfo}
                        />
                        <TextField
                            label="Location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            fullWidth
                            disabled={!canEditBasicInfo}
                        />
                    </Box>

                    <Box className="grid grid-cols-2 gap-4">
                        <TextField
                            label="Gridline/Zone"
                            value={formData.gridline_zone}
                            onChange={(e) => setFormData({ ...formData, gridline_zone: e.target.value })}
                            fullWidth
                            disabled={!canEditBasicInfo}
                        />
                        <TextField
                            label="Date Inspected"
                            type="date"
                            value={formData.date_inspected}
                            onChange={(e) => setFormData({ ...formData, date_inspected: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            disabled={!canEditBasicInfo}
                        />
                    </Box>
                    
                    <TextField
                        label="Assigned Site Engineer"
                        select
                        value={formData.assigned_to_user_id}
                        onChange={(e) => setFormData({ ...formData, assigned_to_user_id: e.target.value })}
                        fullWidth
                        required
                        disabled={!canEditBasicInfo}
                    >
                        {users?.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                                {user.displayName || user.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Submission Date"
                        type="date"
                        value={formData.inspection_date}
                        onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        disabled={!canEditBasicInfo}
                    />

                    <TextField
                        label="Status"
                        select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        fullWidth
                        disabled={!canUpdateStatus}
                    >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approve">Approve</MenuItem>
                        <MenuItem value="approve with comment">Approve with Comment</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="standby">Standby</MenuItem>
                    </TextField>

                    <TextField
                        label="Consultant Comments"
                        value={formData.consultant_comments}
                        onChange={(e) => setFormData({ ...formData, consultant_comments: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        disabled={!canUpdateStatus}
                    />

                    <TextField
                        label="Remarks/Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        fullWidth
                        multiline
                        rows={2}
                        disabled={!canEditBasicInfo && !canUpdateStatus}
                    />

                    <Box 
                        className={`border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-colors ${
                            canEditBasicInfo ? 'cursor-pointer hover:border-blue-500' : 'cursor-not-allowed opacity-50'
                        }`}
                        onClick={() => canEditBasicInfo && document.getElementById('report-file-input')?.click()}
                    >
                        <input
                            type="file"
                            id="report-file-input"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            disabled={!canEditBasicInfo}
                        />
                        <FuseSvgIcon className="text-gray-400">heroicons-outline:cloud-arrow-up</FuseSvgIcon>
                        <Typography variant="body2" color="textSecondary">
                            {file ? file.name : report?.file_path ? 'Replace PDF Document' : 'Click to upload PDF document'}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions className="p-4">
                <Button onClick={onClose} disabled={isPending}>Cancel</Button>
                <LoadingButton
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    loading={isPending}
                    disabled={!formData.title || !formData.assigned_to_user_id || (!file && !report) || (!canEditBasicInfo && !canUpdateStatus)}
                >
                    {report ? 'Update Report' : 'Create & Assign'}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}

export default InspectionReportDialog;
