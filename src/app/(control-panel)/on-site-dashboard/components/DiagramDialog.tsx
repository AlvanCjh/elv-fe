import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    MenuItem,
    IconButton,
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useProject } from '../../../../context/ProjectContext';
import { createDiagram, updateDiagram, Diagram } from '../../scheduling/scheduleApi';
import { useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';

interface DiagramDialogProps {
    open: boolean;
    onClose: () => void;
    diagram?: Diagram | null;
    type: 'drawing' | 'schematic';
}

const DiagramDialog = ({ open, onClose, diagram, type }: DiagramDialogProps) => {
    const { activeProjectId } = useProject();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        project_title: '',
        status: 'submitted',
    });
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (diagram) {
            setFormData({
                project_title: diagram.project_title,
                status: diagram.status,
            });
        } else {
            setFormData({
                project_title: '',
                status: 'submitted',
            });
        }
        setFile(null);
    }, [diagram, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('project_title', formData.project_title);
            data.append('status', formData.status);
            if (file) {
                data.append('pdf_file', file);
            }
            if (!diagram && activeProjectId) {
                data.append('project_id', activeProjectId.toString());
            }

            if (diagram) {
                await updateDiagram(type, diagram.id, data);
                enqueueSnackbar('Diagram updated successfully', { variant: 'success' });
            } else {
                await createDiagram(type, data);
                enqueueSnackbar('Diagram created successfully', { variant: 'success' });
            }

            queryClient.invalidateQueries({ queryKey: ['diagrams', type] });
            onClose();
        } catch (error: any) {
            let errorMsg = 'Failed to save diagram';
            if (error.response) {
                try {
                    const errorData = await error.response.json();
                    if (errorData.message) {
                        errorMsg = errorData.message;
                    }
                    if (errorData.errors) {
                        errorMsg += ': ' + Object.values(errorData.errors).flat().join(', ');
                    }
                } catch (e) {
                    // Ignore JSON parse error
                }
            }
            enqueueSnackbar(errorMsg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-3xl p-4' }}>
            <DialogTitle className="flex justify-between items-center pb-2">
                <Typography variant="h5" className="font-black text-indigo-900 dark:text-indigo-100">
                    {diagram ? 'Edit Diagram' : `New ${type === 'drawing' ? 'Drawing' : 'Schematic'} Diagram`}
                </Typography>
                <IconButton onClick={onClose} size="small" className="bg-gray-50 dark:bg-gray-800">
                    <FuseSvgIcon size={20}>heroicons-outline:x-mark</FuseSvgIcon>
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent className="space-y-6">
                    <TextField
                        fullWidth
                        label="Project Title"
                        required
                        value={formData.project_title}
                        onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                        variant="outlined"
                        className="bg-gray-50 dark:bg-gray-900/50"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                    />

                    <TextField
                        fullWidth
                        select
                        label="Status"
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        variant="outlined"
                        className="bg-gray-50 dark:bg-gray-900/50"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                    >
                        <MenuItem value="submitted">Submitted</MenuItem>
                        <MenuItem value="approve">Approved</MenuItem>
                    </TextField>

                    <Box 
                        className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 bg-gray-50/50 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-900/50 transition-colors cursor-pointer group"
                        component="label"
                    >
                        <input type="file" hidden accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        <IconButton className="bg-indigo-50 text-indigo-500 w-12 h-12 group-hover:scale-110 transition-transform">
                            <FuseSvgIcon size={24}>heroicons-outline:cloud-arrow-up</FuseSvgIcon>
                        </IconButton>
                        <Box className="text-center">
                            <Typography className="font-black text-sm text-gray-700 dark:text-gray-200">
                                {file ? file.name : 'Click to upload PDF'}
                            </Typography>
                            <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest mt-1 block">
                                PDF only, max 10MB
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions className="p-6">
                    <Button onClick={onClose} className="rounded-2xl font-black px-6">Cancel</Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={loading}
                        className="rounded-2xl font-black px-8 py-3 shadow-xl shadow-indigo-500/20"
                    >
                        {loading ? 'Processing...' : diagram ? 'Update Diagram' : 'Create Diagram'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default DiagramDialog;
