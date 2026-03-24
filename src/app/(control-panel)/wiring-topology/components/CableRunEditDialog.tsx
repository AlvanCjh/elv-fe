import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress, Divider, IconButton, Autocomplete } from '@mui/material';
import { Close as CloseIcon, Edit as EditIcon, Link as LinkIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateObjectPortLink, addObjectPort, ObjectComponent, ObjectPort, useAllObjects } from '../../building-progress/buildingApi';
import { useProject } from '../../../../context/ProjectContext';

interface CableRunEditDialogProps {
    open: boolean;
    onClose: () => void;
    port: ObjectPort;
    riser: ObjectComponent;
}

const CableRunEditDialog: React.FC<CableRunEditDialogProps> = ({ open, onClose, port, riser }) => {
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();
    const { data: allObjects = [] } = useAllObjects();

    const [sourcePortName, setSourcePortName] = useState(port.port_name);
    const [status, setStatus] = useState(port.status);
    const [cableId, setCableId] = useState(port.cable_id || '');
    const [targetObjectId, setTargetObjectId] = useState<number | ''>(port.connected_to_object_id || '');
    const [targetPortName, setTargetPortName] = useState((port as any).connected_port_name || '');

    useEffect(() => {
        if (open) {
            setSourcePortName(port.port_name);
            setStatus(port.status);
            setCableId(port.cable_id || '');
            setTargetObjectId(port.connected_to_object_id || '');
            setTargetPortName((port as any).connected_port_name || '');
        }
    }, [open, port]);

    const updatePortMutation = useMutation({
        mutationFn: (data: any) => updateObjectPortLink(riser.id, port.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-objects', activeProjectId] });
            onClose();
        }
    });

    const handleSave = async () => {
        let finalTargetPortName = targetPortName;
        const targetObject = allObjects.find(o => o.id === targetObjectId);
        const targetPortExists = targetObject?.ports?.some(p => p.port_name === targetPortName);

        if (!targetPortExists && targetPortName && targetObjectId) {
            try {
                await addObjectPort(Number(targetObjectId), { port_name: targetPortName });
                finalTargetPortName = targetPortName;
            } catch (error) {
                console.error("Failed to create target port", error);
                return;
            }
        }

        updatePortMutation.mutate({
            port_name: sourcePortName,
            status: status,
            cable_id: cableId,
            connected_to_object_id: targetObjectId || null,
            connected_port_name: finalTargetPortName || null,
        });
    };

    const cleanPortName = (name: string) => {
        if (!name) return '';
        const index = name.indexOf(':');
        return index > -1 ? name.substring(index + 1) : name;
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                className: "rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800"
            }}
        >
            <DialogTitle className="flex justify-between items-center p-6 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <EditIcon fontSize="small" />
                    </div>
                    <div>
                        <Typography variant="h6" className="font-black uppercase tracking-tight leading-none mb-1">Edit Connection</Typography>
                        <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest">{port.cable_id || 'unnamed cable'}</Typography>
                    </div>
                </div>
                <IconButton onClick={onClose} size="small" className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent className="p-8">
                <Box className="flex flex-col gap-8">
                    {/* Status & Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormControl fullWidth size="small">
                            <InputLabel>Connection Status</InputLabel>
                            <Select
                                value={status}
                                label="Connection Status"
                                onChange={(e) => setStatus(e.target.value as string)}
                                className="rounded-xl"
                            >
                                <MenuItem value="online">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="font-bold text-xs uppercase">Online</span>
                                    </div>
                                </MenuItem>
                                <MenuItem value="offline">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className="font-bold text-xs uppercase">Offline</span>
                                    </div>
                                </MenuItem>
                                <MenuItem value="problem">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                        <span className="font-bold text-xs uppercase">Problem</span>
                                    </div>
                                </MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Cable ID"
                            size="small"
                            value={cableId}
                            onChange={(e) => setCableId(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>

                    <Divider className="dark:border-gray-800" />

                    {/* Source Port */}
                    <Box>
                         <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest block mb-4">Source Configuration</Typography>
                         <FormControl fullWidth size="small">
                            <InputLabel>Source Port Name</InputLabel>
                            <Select
                                value={sourcePortName}
                                label="Source Port Name"
                                onChange={(e) => setSourcePortName(e.target.value as string)}
                                renderValue={(selected) => cleanPortName(selected as string)}
                                className="rounded-xl"
                            >
                                {riser.ports?.map(p => (
                                    <MenuItem key={p.id} value={p.port_name}>
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-bold text-xs">{cleanPortName(p.port_name)}</span>
                                            {p.cable_id && p.cable_id !== port.cable_id && (
                                                <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded uppercase font-black">In Use</span>
                                            )}
                                        </div>
                                    </MenuItem>
                                ))}
                                {!riser.ports?.some(p => p.port_name === sourcePortName) && (
                                    <MenuItem value={sourcePortName}>{cleanPortName(sourcePortName)}</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Destination Config */}
                    <Box className="flex flex-col gap-4">
                        <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest block mb-2">Destination Configuration</Typography>
                        
                        <Autocomplete
                            size="small"
                            options={allObjects.filter(o => o.id !== riser.id)}
                            getOptionLabel={(option) => `${option.item_alias_id || option.item_name} (${option.zone?.floor?.floor_number || option.zone?.floor_id})`}
                            value={allObjects.find(o => o.id === targetObjectId) || null}
                            onChange={(event, newValue) => {
                                setTargetObjectId(newValue ? (newValue.id as number) : '');
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
                            disablePortal={true}
                            slotProps={{
                                popper: {
                                    sx: { zIndex: (theme) => theme.zIndex.modal + 10 }
                                }
                            }}
                        />

                        <FormControl fullWidth size="small">
                            <InputLabel>Target Port Name</InputLabel>
                                <Select
                                    value={targetPortName}
                                    label="Target Port Name"
                                    onChange={(e) => {
                                        const val = e.target.value as string;
                                        if (val === 'NEW_PORT') {
                                            const targetObject = allObjects.find(o => o.id === targetObjectId);
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
                                    className="rounded-xl"
                                    disabled={!targetObjectId}
                                >
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {allObjects.find(o => o.id === targetObjectId)?.ports?.map(p => (
                                        <MenuItem key={p.id} value={p.port_name}>
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-bold text-xs">{cleanPortName(p.port_name)}</span>
                                                {p.cable_id && p.cable_id !== port.cable_id && (
                                                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded uppercase font-black">In Use</span>
                                                )}
                                            </div>
                                        </MenuItem>
                                    ))}
                                    <MenuItem value="NEW_PORT">+ Add New Port</MenuItem>
                                    {targetPortName && !allObjects.find(o => o.id === targetObjectId)?.ports?.some(p => p.port_name === targetPortName) && (
                                        <MenuItem value={targetPortName}>{cleanPortName(targetPortName)}</MenuItem>
                                    )}
                                </Select>
                                {targetPortName && !allObjects.find(o => o.id === targetObjectId)?.ports?.some(p => p.port_name === targetPortName) && (
                                    <Typography variant="caption" className="text-blue-500 font-bold mt-1 ml-1 block animate-pulse">
                                        Note: New port will be created upon saving
                                    </Typography>
                                )}
                        </FormControl>
                    </Box>

                    <Box className="mt-4">
                        <Button 
                            variant="contained" 
                            fullWidth 
                            className="bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 text-sm uppercase tracking-widest"
                            onClick={handleSave}
                            disabled={updatePortMutation.isPending}
                            startIcon={updatePortMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <LinkIcon />}
                        >
                            Save Changes
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default CableRunEditDialog;
