import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, TextField, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Divider } from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Delete as DeleteIcon, SettingsInputComponent as PortIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addObjectPort, deleteObjectPort, ObjectComponent } from '../../building-progress/buildingApi';
import { useProject } from '../../../../context/ProjectContext';

interface EquipmentPortManagerProps {
    open: boolean;
    onClose: () => void;
    equipment: any;
    riser: ObjectComponent;
}

const EquipmentPortManager: React.FC<EquipmentPortManagerProps> = ({ open, onClose, equipment, riser }) => {
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();
    const [newPortName, setNewPortName] = useState('');

    const addPortMutation = useMutation({
        mutationFn: (name: string) => addObjectPort(riser.id, { port_name: `${equipment.id}:${name}` }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-objects', activeProjectId] });
            setNewPortName('');
        }
    });

    const deletePortMutation = useMutation({
        mutationFn: (portId: number) => deleteObjectPort(riser.id, portId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-objects', activeProjectId] });
        }
    });

    const handleAddPort = () => {
        if (!newPortName) return;
        addPortMutation.mutate(newPortName);
    };

    const equipmentPorts = (riser.ports || []).filter(p => p.port_name.startsWith(`${equipment.id}:`));

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ className: "rounded-2xl" }}
        >
            <DialogTitle className="flex justify-between items-center border-b">
                <Typography className="font-black uppercase tracking-tight">Manage Ports: {equipment.name}</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent className="p-6">
                <Box className="flex flex-col gap-6">
                    <Box className="flex gap-2">
                        <TextField 
                            label="Port Name (e.g. P01)" 
                            size="small" 
                            fullWidth 
                            value={newPortName}
                            onChange={(e) => setNewPortName(e.target.value)}
                        />
                        <Button 
                            variant="contained" 
                            onClick={handleAddPort}
                            disabled={addPortMutation.isPending || !newPortName}
                            startIcon={<AddIcon />}
                            className="bg-blue-600"
                        >
                            Add
                        </Button>
                    </Box>

                    <Divider />

                    <Typography variant="caption" className="font-bold text-gray-400 uppercase tracking-widest">
                        Existing Ports ({equipmentPorts.length})
                    </Typography>

                    <List className="max-h-60 overflow-y-auto">
                        {equipmentPorts.map((port) => (
                            <ListItem key={port.id} className="hover:bg-gray-50 rounded-lg mb-1">
                                <PortIcon fontSize="small" className="mr-3 text-gray-400" />
                                <ListItemText 
                                    primary={port.port_name.substring(port.port_name.indexOf(':') + 1)} 
                                    primaryTypographyProps={{ className: "font-bold text-gray-700" }} 
                                />
                                <ListItemSecondaryAction>
                                    <IconButton 
                                        edge="end" 
                                        size="small" 
                                        onClick={() => deletePortMutation.mutate(port.id)}
                                        disabled={deletePortMutation.isPending}
                                    >
                                        <DeleteIcon fontSize="small" className="text-red-400" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                        {equipmentPorts.length === 0 && (
                            <Typography variant="body2" className="text-center py-4 text-gray-400 italic">
                                No ports added yet
                            </Typography>
                        )}
                    </List>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default EquipmentPortManager;
