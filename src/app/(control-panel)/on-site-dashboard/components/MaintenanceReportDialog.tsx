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
    IconButton
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMaintenanceReport, updateMaintenanceReport, deleteMaintenanceReport, useUsers, MaintenanceReport } from '../../scheduling/scheduleApi';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useProject } from '@/context/ProjectContext';
import useUser from '@auth/useUser';
import { enqueueSnackbar } from 'notistack';

interface MaintenanceReportDialogProps {
    open: boolean;
    onClose: () => void;
    report?: MaintenanceReport | null;
    initialDate?: Date;
}

function MaintenanceReportDialog({ open, onClose, report, initialDate }: MaintenanceReportDialogProps) {
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
        description: '',
        assigned_to_user_id: '',
        maintenance_date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
        status: 'pending' as 'pending' | 'completed'
    });

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (report) {
            setFormData({
                title: report.title,
                description: report.description || '',
                assigned_to_user_id: report.assigned_to_user_id,
                maintenance_date: report.maintenance_date,
                status: report.status
            });
            setImagePreview(null);
        } else {
            setFormData({
                title: '',
                description: '',
                assigned_to_user_id: '',
                maintenance_date: initialDate ? initialDate.toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
                status: 'pending'
            });
            setImage(null);
            setImagePreview(null);
        }
    }, [report, open, initialDate]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const createMutation = useMutation({
        mutationFn: createMaintenanceReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-reports'] });
            enqueueSnackbar('Maintenance report created successfully', { variant: 'success' });
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
        mutationFn: (data: { id: number; formData: FormData }) => updateMaintenanceReport(data.id, data.formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-reports'] });
            enqueueSnackbar('Maintenance report updated successfully', { variant: 'success' });
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
        mutationFn: deleteMaintenanceReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-reports'] });
            onClose();
        }
    });

    const handleSubmit = () => {
        const data = new FormData();
        data.append('project_id', activeProjectId!.toString());
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('assigned_to_user_id', formData.assigned_to_user_id);
        data.append('maintenance_date', formData.maintenance_date);
        data.append('status', formData.status);
        
        if (image) {
            data.append('image', image);
        }

        if (report) {
            updateMutation.mutate({ id: report.id, formData: data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this maintenance report?')) {
            deleteMutation.mutate(report!.id);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle className="flex justify-between items-center">
                <Typography variant="h6" className="font-bold">
                    {report ? 'Edit Maintenance Report' : 'Upload Maintenance Report'}
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
                    
                    <TextField
                        label="Assigned Technician/Engineer"
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
                        label="Maintenance Date"
                        type="date"
                        value={formData.maintenance_date}
                        onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        disabled={!canEditBasicInfo}
                    />

                    {report && (
                        <TextField
                            label="Status"
                            select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            fullWidth
                            disabled={!canUpdateStatus}
                        >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                        </TextField>
                    )}

                    <TextField
                        label="Remarks/Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        fullWidth
                        multiline
                        rows={3}
                        disabled={!canEditBasicInfo && !canUpdateStatus}
                    />

                    <Box 
                        className={`border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center gap-2 transition-colors ${
                            canEditBasicInfo ? 'cursor-pointer hover:border-blue-500' : 'cursor-not-allowed opacity-50'
                        }`}
                        onClick={() => canEditBasicInfo && document.getElementById('maintenance-image-input')?.click()}
                    >
                        <input
                            type="file"
                            id="maintenance-image-input"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                            disabled={!canEditBasicInfo}
                        />
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                        ) : (
                            <>
                                <FuseSvgIcon className="text-gray-400">heroicons-outline:camera</FuseSvgIcon>
                                <Typography variant="body2" color="textSecondary">
                                    {image ? image.name : report?.image_path ? 'Replace Picture' : 'Click to upload maintenance picture'}
                                </Typography>
                            </>
                        )}
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
                    disabled={!formData.title || !formData.assigned_to_user_id || (!image && !report) || (!canEditBasicInfo && !canUpdateStatus)}
                >
                    {report ? 'Update Report' : 'Create & Assign'}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}

export default MaintenanceReportDialog;
