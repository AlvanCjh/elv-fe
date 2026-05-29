import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api from '@/utils/api';

const departments = ['ICT', 'ELV', 'SSDC', 'Others'];
const statuses = ['success', 'unsuccess', 'recovery', 'in progress', 'failed'];
const defaultSystems = ['KM-NAS', 'EA-UBS', 'KM-UBS'];

const BackupFormDialog = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        backup_date: new Date().toISOString().split('T')[0],
        responsible_first_name: '',
        responsible_last_name: '',
        department: 'ICT',
        systems: ['KM-NAS'],
        status: 'success',
        location: ''
    });
    const [extraSystem, setExtraSystem] = useState('');
    const [availableSystems, setAvailableSystems] = useState(defaultSystems);
    const [attachment, setAttachment] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSystemToggle = (system) => {
        const current = [...formData.systems];
        const index = current.indexOf(system);
        if (index === -1) {
            current.push(system);
        } else {
            current.splice(index, 1);
        }
        setFormData(prev => ({ ...prev, systems: current }));
    };

    const addSystemOption = () => {
        if (extraSystem && !availableSystems.includes(extraSystem)) {
            setAvailableSystems(prev => [...prev, extraSystem]);
            handleSystemToggle(extraSystem);
            setExtraSystem('');
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'systems') {
                    data.append(key, JSON.stringify(formData[key]));
                } else {
                    data.append(key, formData[key]);
                }
            });
            
            if (attachment) {
                data.append('attachment', attachment);
            }

            await api.post('ict-backups', { body: data });
            onSuccess();
        } catch (error) {
            console.error("Submission failed:", error);
            alert("Failed to create backup record. Please check the fields.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: 'rounded-3xl p-4' }}>
            <form onSubmit={handleSubmit}>
                <DialogTitle className="font-black text-2xl uppercase tracking-tighter text-slate-800">
                    New Backup Checklist
                </DialogTitle>
                <DialogContent>
                    <Typography className="text-slate-400 text-sm mb-6 font-medium">Please complete this checklist to ensure all IT system backups are completed properly.</Typography>
                    
                    <Grid container spacing={3}>
                        <Grid size={12}>
                            <TextField
                                label="Date of Backup"
                                type="date"
                                name="backup_date"
                                fullWidth
                                required
                                value={formData.backup_date}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                variant="outlined"
                            />
                        </Grid>
                        
                        <Grid size={6}>
                            <TextField
                                label="Responsible First Name"
                                name="responsible_first_name"
                                fullWidth
                                required
                                value={formData.responsible_first_name}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid size={6}>
                            <TextField
                                label="Responsible Last Name"
                                name="responsible_last_name"
                                fullWidth
                                required
                                value={formData.responsible_last_name}
                                onChange={handleChange}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid size={12}>
                            <TextField
                                select
                                label="Department"
                                name="department"
                                fullWidth
                                required
                                value={formData.department}
                                onChange={handleChange}
                            >
                                {departments.map(dept => (
                                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={12}>
                            <Typography variant="subtitle2" className="text-slate-700 font-bold mb-2">Systems to Backup</Typography>
                            <Box className="flex flex-wrap gap-x-4 gap-y-1 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                {availableSystems.map(system => (
                                    <FormControlLabel
                                        key={system}
                                        control={
                                            <Checkbox 
                                                checked={formData.systems.includes(system)} 
                                                onChange={() => handleSystemToggle(system)} 
                                                color="primary"
                                                size="small"
                                            />
                                        }
                                        label={<span className="text-sm font-medium">{system}</span>}
                                    />
                                ))}
                                <Box className="w-full mt-2 flex items-center gap-2">
                                    <TextField 
                                        size="small" 
                                        placeholder="Add other system..." 
                                        className="bg-white"
                                        value={extraSystem}
                                        onChange={(e) => setExtraSystem(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSystemOption())}
                                    />
                                    <IconButton onClick={addSystemOption} color="primary" size="small">
                                        <AddCircleIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={12}>
                            <TextField
                                select
                                label="Backup Status"
                                name="status"
                                fullWidth
                                required
                                value={formData.status}
                                onChange={handleChange}
                            >
                                {statuses.map(st => (
                                    <MenuItem key={st} value={st} className="uppercase font-bold text-xs">{st}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid size={12}>
                            <TextField
                                label="Backup Location"
                                name="location"
                                fullWidth
                                required
                                placeholder="e.g. Offsite Tape, Cloud Storage A, External HDD"
                                value={formData.location}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={12}>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                fullWidth
                                className="border-dashed py-4 border-slate-200 text-slate-500 rounded-2xl normal-case font-medium hover:bg-slate-50 transition-colors"
                            >
                                {attachment ? attachment.name : 'Upload Screenshot / Attachment (JPG, PDF)'}
                                <input type="file" hidden accept="image/*,.pdf" onChange={handleFileChange} />
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className="p-6">
                    <Button onClick={onClose} className="text-slate-400 font-bold normal-case">Cancel</Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={submitting}
                        className="bg-indigo-600 hover:bg-indigo-700 px-8 rounded-xl font-bold shadow-lg shadow-indigo-100 normal-case"
                    >
                        {submitting ? 'Saving...' : 'Save Record'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default BackupFormDialog;
