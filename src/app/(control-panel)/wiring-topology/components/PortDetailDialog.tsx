import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Chip, Divider, IconButton, Autocomplete } from '@mui/material';
import { Close as CloseIcon, SettingsInputComponent as PortIcon, Link as LinkIcon, OpenInNew as NavigateIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addObjectPort, establishObjectPortLink, ObjectComponent, ObjectPort, useAllObjects } from '../../building-progress/buildingApi';
import { useProject } from '../../../../context/ProjectContext';

interface PortDetailDialogProps {
    open: boolean;
    onClose: () => void;
    portName: string;
    portData?: ObjectPort;
    riser: ObjectComponent;
    isReadOnly?: boolean;
}

const cleanPortName = (name: string) => {
    if (!name) return '';
    const index = name.indexOf(':');
    return index > -1 ? name.substring(index + 1) : name;
};

const PortDetailDialog: React.FC<PortDetailDialogProps> = ({ open, onClose, portName, portData, riser, isReadOnly }) => {
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();
    const { data: allObjects = [] } = useAllObjects();

    const [isEstablishingLink, setIsEstablishingLink] = useState(false);
    const [cableId, setCableId] = useState(portData?.cable_id || '');
    const [targetObjectId, setTargetObjectId] = useState<number | ''>(portData?.connected_to_object_id || '');
    const [targetPortName, setTargetPortName] = useState(portData?.status || ''); // Using status as port name if needed, or we might need another field

    const addPortMutation = useMutation({
        mutationFn: (name: string) => addObjectPort(riser.id, { port_name: name }),
        onSuccess: (newPort) => {
            queryClient.invalidateQueries({ queryKey: ['all-objects', activeProjectId] });
            return newPort;
        }
    });

    const establishLinkMutation = useMutation({
        mutationFn: (data: { portId: number, cable_id: string, connected_to_object_id: number, connected_port_name: string }) =>
            establishObjectPortLink(riser.id, data.portId, {
                cable_id: data.cable_id,
                connected_to_object_id: data.connected_to_object_id,
                connected_port_name: data.connected_port_name
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-objects', activeProjectId] });
            setIsEstablishingLink(false);
            onClose();
        }
    });

    const handleLink = async () => {
        if (!cableId || !targetObjectId || !targetPortName) return;

        let portToLink = portData;

        // 1. If source port doesn't exist in DB yet, create it first
        if (!portToLink) {
            try {
                const response: any = await addPortMutation.mutateAsync(portName);
                portToLink = response.data; // Backend returns { data: port }
            } catch (error) {
                console.error("Failed to create source port", error);
                return;
            }
        }

        // 2. If target port is new (doesn't exist in targetObject.ports), create it
        let finalTargetPortName = targetPortName;
        const targetPortExists = targetObject?.ports?.some(p => p.port_name === targetPortName);
        
        if (!targetPortExists && targetPortName) {
            try {
                await addObjectPort(Number(targetObjectId), { port_name: targetPortName });
                finalTargetPortName = targetPortName;
            } catch (error) {
                console.error("Failed to create target port", error);
                return;
            }
        }

        if (portToLink?.id) {
            establishLinkMutation.mutate({
                portId: portToLink.id,
                cable_id: cableId,
                connected_to_object_id: Number(targetObjectId),
                connected_port_name: finalTargetPortName
            });
        }
    };

    const targetObject = allObjects.find(o => o.id === targetObjectId);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                className: "rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800"
            }}
        >
            <DialogTitle className="flex justify-between items-center p-4 border-b dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <PortIcon className="text-blue-500" />
                    <Typography variant="h6" className="font-bold uppercase tracking-tight">Port Detail</Typography>
                </div>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent className="p-6">
                <Box className="flex flex-col gap-6">
                    {/* Header Info */}
                    <div className="flex justify-between items-center">
                        <div>
                            <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest block mb-1">Port Name</Typography>
                            <Typography variant="h5" className="font-black text-gray-800 dark:text-gray-100">{portName}</Typography>
                        </div>
                        <Chip
                            label={portData?.cable_id ? 'Linked' : 'Available'}
                            color={portData?.cable_id ? 'success' : 'default'}
                            variant="outlined"
                            size="small"
                            className="font-bold"
                        />
                    </div>

                    <Divider className="dark:border-gray-800" />

                    {/* Connection Form */}
                    <Box className="flex flex-col gap-4">
                        <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest block">Wiring Connection</Typography>

                        <TextField
                            label="Cable ID"
                            size="small"
                            value={cableId}
                            onChange={(e) => setCableId(e.target.value)}
                            placeholder="e.g. C-L5-01"
                            fullWidth
                            disabled={isReadOnly}
                        />

                        <Autocomplete
                            size="small"
                            options={allObjects.filter(o => o.id !== riser.id)}
                            getOptionLabel={(option) => `${option.item_alias_id || option.item_name} (${option.zone?.floor?.floor_number || option.zone?.floor_id})`}
                            value={allObjects.find(o => o.id === targetObjectId) || null}
                            onChange={(event, newValue) => {
                                setTargetObjectId(newValue ? newValue.id : '');
                                setTargetPortName('');
                            }}
                            renderInput={(params) => <TextField {...params} label="Target Object" fullWidth />}
                            renderOption={(props, option) => (
                                <li {...props} key={option.id}>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xs">{option.item_alias_id || option.item_name}</span>
                                        <span className="text-[10px] text-gray-500">
                                            {option.zone?.name} • {option.zone?.floor?.floor_number ? `Floor ${option.zone.floor.floor_number}` : `Floor ${option.zone?.floor_id}`}
                                        </span>
                                    </div>
                                </li>
                            )}
                            fullWidth
                            disabled={isReadOnly}
                            disablePortal={true}
                            slotProps={{
                                popper: {
                                    sx: { zIndex: (theme) => theme.zIndex.modal + 10 }
                                }
                            }}
                        />

                        {targetObjectId && (
                            <FormControl fullWidth size="small" disabled={isReadOnly}>
                                <InputLabel>Target Port Name</InputLabel>
                                <Select
                                    value={targetPortName}
                                    label="Target Port Name"
                                    onChange={(e) => {
                                        const val = e.target.value as string;
                                        if (val === 'NEW_PORT') {
                                            // Automatically generate next port name
                                            const existingPortNames = targetObject?.ports?.map(p => p.port_name) || [];
                                            let nextNum = 1;
                                            existingPortNames.forEach(name => {
                                                const match = name.match(/(\d+)$/);
                                                if (match) {
                                                    const num = parseInt(match[1]);
                                                    if (num >= nextNum) nextNum = num + 1;
                                                }
                                            });
                                            setTargetPortName(`PORT-${String(nextNum).padStart(2, '0')}`);
                                        } else {
                                            setTargetPortName(val);
                                        }
                                    }}
                                    renderValue={(selected) => cleanPortName(selected as string)}
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {targetObject?.ports?.map(p => (
                                        <MenuItem key={p.id} value={p.port_name} disabled={!!p.cable_id && p.cable_id !== portData?.cable_id}>
                                            {cleanPortName(p.port_name)} {p.cable_id ? '(In Use)' : ''}
                                        </MenuItem>
                                    )) || (
                                            <MenuItem disabled><em>No ports on target</em></MenuItem>
                                        )}
                                    {!isReadOnly && <MenuItem value="NEW_PORT">+ Add New Port</MenuItem>}
                                </Select>
                            </FormControl>
                        )}

                        {targetPortName && !targetObject?.ports?.some(p => p.port_name === targetPortName) && (
                            <TextField
                                label="Target Port Name (Auto-generated)"
                                size="small"
                                value={targetPortName}
                                onChange={(e) => setTargetPortName(e.target.value)}
                                placeholder="e.g. PORT-01"
                                fullWidth
                                helperText="Proceed to create this port on the target device"
                            />
                        )}
                    </Box>

                    {!isReadOnly && (
                        <Box className="mt-4">
                            <Button
                                variant="contained"
                                fullWidth
                                className="bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20"
                                onClick={handleLink}
                                disabled={establishLinkMutation.isPending || addPortMutation.isPending || !cableId || !targetObjectId || (!targetPortName && targetPortName !== 'NEW_PORT')}
                                startIcon={(establishLinkMutation.isPending || addPortMutation.isPending) ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
                            >
                                {portData?.cable_id ? 'Update Link' : 'Establish Connection'}
                            </Button>
                        </Box>
                    )}

                    {portData?.cable_id && (
                        <Typography variant="caption" className="text-gray-400 italic text-center block">
                            Last modified: {new Date(portData.created_at).toLocaleDateString()}
                        </Typography>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default PortDetailDialog;
