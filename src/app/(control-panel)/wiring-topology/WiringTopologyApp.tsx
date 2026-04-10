import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, MenuItem, Select, FormControl, InputLabel, CircularProgress, Breadcrumbs, Chip, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { useBuildings, useBuildingDetails, useAllObjects, ObjectComponent, ObjectPort } from '../building-progress/buildingApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Storage as RackIcon, Router as SwitchIcon, SettingsInputComponent as PatchPanelIcon, Business as BuildingIcon, Layers as FloorIcon, Share as TopologyIcon, Link as LinkIcon, Edit as EditIcon } from '@mui/icons-material';
import RackView from './components/RackView';
import EquipmentSidebar, { EquipmentTemplate } from './components/EquipmentSidebar';
import CableRunEditDialog from './components/CableRunEditDialog';
import { updateObjectDetails } from '../building-progress/buildingApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import useUser from '@auth/useUser';

const WiringTopologyApp: React.FC = () => {
    const { data: user } = useUser();
    const isSupervisor = user?.role === 'supervisor' || (Array.isArray(user?.role) && user.role.includes('supervisor'));
    const isReadOnly = !isSupervisor;

    const { data: buildings, isLoading: isBuildingsLoading } = useBuildings();
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
    const [selectedFloorId, setSelectedFloorId] = useState<string>('');
    const [selectedRiserId, setSelectedRiserId] = useState<number | null>(null);
    const { data: allObjects, isLoading: isObjectsLoading } = useAllObjects();
    const { data: buildingDetails, isLoading: isBuildingLoading } = useBuildingDetails(selectedBuildingId);
    
    const [editingPort, setEditingPort] = useState<ObjectPort | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDragOverRack, setIsDragOverRack] = useState(false);
    
    // Filter floors for the building
    const floors = useMemo(() => buildingDetails?.floors || [], [buildingDetails]);

    // Filter objects to find Risers or Servers on the selected floor
    const risers = useMemo(() => {
        if (!allObjects || !selectedFloorId) return [];
        return allObjects.filter(obj => 
            (obj.item_name === 'RISER' || obj.item_alias_id?.toUpperCase().includes('RISER') ||
             obj.item_name === 'SERVER' || obj.item_alias_id?.toUpperCase().includes('SERVER')) && 
            String(obj.zone?.floor_id) === String(selectedFloorId)
        );
    }, [allObjects, selectedFloorId]);

    const selectedRiser = useMemo(() => 
        risers.find(r => r.id === selectedRiserId), 
    [risers, selectedRiserId]);

    const rackLayout = useMemo(() => {
        if (!selectedRiser?.geometry?.rackLayout) return [];
        return selectedRiser.geometry.rackLayout as any[];
    }, [selectedRiser]);

    const queryClient = useQueryClient();

    const updateRiserMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => updateObjectDetails(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-objects'] });
        }
    });

    const handleUpdateLayout = (newLayout: any[]) => {
        if (isReadOnly || !selectedRiserId) return;
        const riser = risers.find(r => r.id === selectedRiserId);
        const geometry = { ...(riser?.geometry || {}), rackLayout: newLayout };
        updateRiserMutation.mutate({ id: selectedRiserId, data: { geometry: JSON.stringify(geometry) } });
    };

    const handleDrop = (e: React.DragEvent, targetIndex?: number) => {
        setIsDragOverRack(false);
        if (isReadOnly) return;
        e.preventDefault();
        
        // 1. Handle Reordering
        const sourceIndexStr = e.dataTransfer.getData('sourceIndex');
        if (sourceIndexStr !== '') {
            const sourceIndex = parseInt(sourceIndexStr);
            if (!isNaN(sourceIndex)) {
                if (sourceIndex === targetIndex) return;
                
                const newLayout = [...rackLayout];
                const [movedItem] = newLayout.splice(sourceIndex, 1);
                
                if (targetIndex !== undefined) {
                    newLayout.splice(targetIndex, 0, movedItem);
                } else {
                    newLayout.push(movedItem);
                }
                
                handleUpdateLayout(newLayout);
                return;
            }
        }

        // 2. Handle New Item
        const templateStr = e.dataTransfer.getData('equipmentTemplate');
        if (!templateStr) return;

        const template = JSON.parse(templateStr) as EquipmentTemplate;
        const newEquipment = {
            id: uuidv4(),
            type: template.type,
            name: `${template.name} ${rackLayout.length + 1}`,
            ports: []
        };

        if (targetIndex !== undefined) {
            const newLayout = [...rackLayout];
            newLayout.splice(targetIndex, 0, newEquipment);
            handleUpdateLayout(newLayout);
        } else {
            handleUpdateLayout([...rackLayout, newEquipment]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (isReadOnly) return;
        e.preventDefault();
        setIsDragOverRack(true);
    };

    const handleDragLeave = () => {
        setIsDragOverRack(false);
    };

    if (isBuildingsLoading || isObjectsLoading) {
        return (
            <Box className="flex items-center justify-center h-full w-full">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header section */}
            <div className="flex flex-col mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                        <TopologyIcon />
                    </div>
                    <Typography variant="h4" className="font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">
                        Wiring Topology {isReadOnly && <Chip label="View Only" size="small" className="ml-2 font-black bg-gray-200 text-gray-700" />}
                    </Typography>
                </div>
                <Typography variant="body2" className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl">
                    Navigate through building risers and racks to manage point-to-point wiring connections. 
                    Inspired by network topology visualization.
                </Typography>
            </div>

            {/* Selection Bar */}
            <Paper elevation={0} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 mb-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <FormControl fullWidth size="small">
                        <InputLabel id="building-select-label">Building</InputLabel>
                        <Select
                            labelId="building-select-label"
                            value={selectedBuildingId}
                            label="Building"
                            onChange={(e) => {
                                setSelectedBuildingId(e.target.value);
                                setSelectedFloorId('');
                                setSelectedRiserId(null);
                            }}
                            startAdornment={<BuildingIcon fontSize="small" className="mr-2 text-gray-400" />}
                        >
                            {buildings?.map(b => (
                                <MenuItem key={b.id} value={String(b.id)}>{b.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <FormControl fullWidth size="small" disabled={!selectedBuildingId}>
                        <InputLabel id="floor-select-label">Floor</InputLabel>
                        <Select
                            labelId="floor-select-label"
                            value={selectedFloorId}
                            label="Floor"
                            onChange={(e) => {
                                setSelectedFloorId(e.target.value);
                                setSelectedRiserId(null);
                            }}
                            startAdornment={<FloorIcon fontSize="small" className="mr-2 text-gray-400" />}
                        >
                            {floors.map(f => (
                                <MenuItem key={f.id} value={String(f.id)}>Floor {f.floor_number}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small" disabled={!selectedFloorId}>
                        <InputLabel id="riser-select-label">Riser / Server</InputLabel>
                        <Select
                            labelId="riser-select-label"
                            value={selectedRiserId || ''}
                            label="Riser / Server"
                            onChange={(e) => setSelectedRiserId(Number(e.target.value))}
                            startAdornment={<RackIcon fontSize="small" className="mr-2 text-gray-400" />}
                        >
                            {risers.map(r => (
                                <MenuItem key={r.id} value={r.id}>{r.item_alias_id || `${r.item_name} ${r.id}`}</MenuItem>
                            ))}
                            {risers.length === 0 && <MenuItem disabled>No Risers or Servers found on this floor</MenuItem>}
                        </Select>
                    </FormControl>
                </div>
            </Paper>

            {/* Main Content Area with Sidebar */}
            <div className="flex gap-8 h-[calc(100vh-280px)]">
                <EquipmentSidebar isReadOnly={isReadOnly} />

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {selectedRiser ? (
                            <motion.div
                                key={selectedRiser.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className="min-h-full pb-12"
                            >
                                <Box className="mb-6 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <Breadcrumbs aria-label="breadcrumb" className="mb-2">
                                            <Typography color="text.secondary" className="text-xs font-bold uppercase tracking-widest">{buildingDetails?.name}</Typography>
                                            <Typography color="text.secondary" className="text-xs font-bold uppercase tracking-widest">Floor {floors.find(f => String(f.id) === selectedFloorId)?.floor_number}</Typography>
                                            <Chip
                                                label={selectedRiser.item_alias_id || `${selectedRiser.item_name} ${selectedRiser.id}`}
                                                size="small"
                                                color="primary"
                                                className="font-bold text-[10px]"
                                            />
                                        </Breadcrumbs>
                                        <Typography variant="h5" className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">
                                            {selectedRiser.item_alias_id || `${selectedRiser.item_name} CABINET`} LAYOUT
                                        </Typography>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <AnimatePresence>
                                            {updateRiserMutation.isPending && (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full"
                                                >
                                                    <CircularProgress size={10} color="inherit" className="text-amber-500" />
                                                    <Typography className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em]">Saving Changes</Typography>
                                                </motion.div>
                                            )}
                                            {updateRiserMutation.isSuccess && !updateRiserMutation.isPending && (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full"
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    <Typography className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em]">Layout Updated</Typography>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <Tooltip title="Total ports connected in this riser">
                                            <Paper elevation={0} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                                                <Typography className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Active Links</Typography>
                                                <Typography variant="h6" className="font-black text-blue-800 dark:text-blue-100 leading-none mt-1">
                                                    {selectedRiser.ports?.filter(p => !!p.cable_id).length || 0}
                                                </Typography>
                                            </Paper>
                                        </Tooltip>
                                    </div>
                                </Box>

                                {/* Racks Layout (Dynamic) */}
                                <div className="max-w-4xl mx-auto flex flex-col items-center">
                                    <div className={`w-full bg-[#0d1520] border-x-[20px] border-[#05070a] rounded-t-[40px] pt-12 pb-8 px-6 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] relative border-t-[10px] border-[#1a2332] transition-all duration-300 ${isDragOverRack ? 'ring-4 ring-blue-500/50 brightness-110' : ''}`}>
                                        {/* Rack Rails Decoration - more depth */}
                                        <div className="absolute top-0 bottom-0 left-[-45px] w-10 flex flex-col justify-around py-12 items-end pr-3">
                                            {[...Array(24)].map((_, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <Typography className="text-[10px] font-black text-gray-700 font-mono opacity-50">{i + 1}</Typography>
                                                    <div className="w-2 h-2 rounded-full bg-black shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] border border-gray-900/50"></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="absolute top-0 bottom-0 right-[-10px] w-2.5 flex flex-col justify-around py-12">
                                            {[...Array(24)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-black shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] border border-gray-900/50"></div>)}
                                        </div>


                                        <div className="flex flex-col gap-1 min-h-[400px]">
                                            {rackLayout.map((item, index) => (
                                                <RackView
                                                    key={item.id}
                                                    title={item.name}
                                                    type={item.type}
                                                    item={item}
                                                    riser={selectedRiser}
                                                    allObjects={allObjects || []}
                                                    uNumber={index + 1}
                                                    currentFloorId={selectedFloorId}
                                                    isReadOnly={isReadOnly}
                                                    onDrop={(e) => handleDrop(e, index)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDelete={() => {
                                                        const newLayout = rackLayout.filter((_, i) => i !== index);
                                                        handleUpdateLayout(newLayout);
                                                    }}
                                                />
                                            ))}
                                            {rackLayout.length === 0 && (
                                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl opacity-30 py-20 px-10 text-center">
                                                    <RackIcon sx={{ fontSize: 48 }} className="text-gray-600 mb-4" />
                                                    <Typography className="font-bold text-gray-500">Rack Enclosure Empty</Typography>
                                                    <Typography variant="caption" className="text-gray-600">Drag equipment from the library here</Typography>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Rack Base - enhanced */}
                                    <div className="w-[105%] h-10 bg-gradient-to-b from-[#05070a] to-[#010203] rounded-b-3xl shadow-[0_20px_40px_-5px_rgba(0,0,0,0.8)] border-t border-gray-800/30"></div>

                                </div>
                            </motion.div>
                        ) : (
                            <Box className="flex flex-col items-center justify-center py-32 opacity-40">
                                <TopologyIcon sx={{ fontSize: 80 }} className="text-gray-300 mb-4" />
                                <Typography variant="h6" className="font-bold text-gray-400">Select a Riser or Server to view topology</Typography>
                                <Typography variant="body2" className="text-gray-400">Cables and connections will appear here</Typography>
                            </Box>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Separate Full-Width Section for Cable Run Listing at the very bottom */}
            {selectedRiser && (
                <Box className="mt-20 pt-16 border-t border-gray-200 dark:border-gray-800 w-full px-8 pb-32">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                <LinkIcon sx={{ fontSize: 24 }} />
                            </div>
                            <div>
                                <Typography variant="h5" className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter leading-none mb-1">
                                    Cable Run Inventory
                                </Typography>
                                <Typography variant="body2" className="text-gray-500 font-medium tracking-tight">
                                    Comprehensive listing of all active point-to-point connections for {selectedRiser.item_alias_id || selectedRiser.item_name}
                                </Typography>
                            </div>
                        </div>
                        <Chip
                            label={`${selectedRiser.ports?.filter(p => !!p.cable_id).length || 0} ESTABLISHED LINKS`}
                            className="bg-blue-600 text-white font-black text-[10px] px-3 h-8 shadow-lg shadow-blue-500/20"
                        />
                    </div>

                    <TableContainer component={Paper} elevation={0} className="border border-gray-200 dark:border-gray-800 rounded-[32px] overflow-hidden bg-white dark:bg-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                        <Table>
                            <TableHead>
                                <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                                    <TableCell className="font-bold text-gray-400 uppercase text-[10px] tracking-[0.2em] py-6 pl-10">Cable ID</TableCell>
                                    <TableCell className="font-bold text-gray-400 uppercase text-[10px] tracking-[0.2em] py-6">Source Port</TableCell>
                                    <TableCell className="font-bold text-gray-400 uppercase text-[10px] tracking-[0.2em] py-6">Destination Object</TableCell>
                                    <TableCell className="font-bold text-gray-400 uppercase text-[10px] tracking-[0.2em] py-6">Dest Port</TableCell>
                                    <TableCell className="font-bold text-gray-400 uppercase text-[10px] tracking-[0.2em] py-6">Status</TableCell>
                                    <TableCell className="font-bold text-gray-400 uppercase text-[10px] tracking-[0.2em] py-6 pr-10 text-right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(selectedRiser.ports || []).filter(p => !!p.cable_id).map((port) => {
                                    const targetObj = allObjects?.find(o => String(o.id) === String(port.connected_to_object_id));
                                    const cleanSourcePort = port.port_name.includes(':') ? port.port_name.split(':')[1] : port.port_name;

                                    // Map status to visual styles
                                    const statusConfig: any = {
                                        online: { color: 'green', label: 'ONLINE' },
                                        offline: { color: 'red', label: 'OFFLINE' },
                                        problem: { color: 'amber', label: 'PROBLEM' }
                                    };
                                    const config = statusConfig[port.status?.toLowerCase()] || statusConfig.online;

                                    return (
                                        <TableRow key={port.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-all duration-300 group">
                                            <TableCell className="py-6 pl-10">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2.5 h-2.5 rounded-full 
                                                        ${config.color === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                            config.color === 'amber' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                                'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}
                                                    ></div>
                                                    <Typography className="font-black text-blue-600 dark:text-blue-400 text-sm tracking-tight">
                                                        {port.cable_id}
                                                    </Typography>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 font-bold text-gray-700 dark:text-gray-300 text-xs">
                                                {cleanSourcePort}
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex flex-col">
                                                    <Typography className="font-black text-gray-800 dark:text-gray-100 text-xs uppercase leading-none mb-1">
                                                        {targetObj?.item_alias_id || targetObj?.item_name || 'Unknown'}
                                                    </Typography>
                                                    <Typography variant="caption" className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">
                                                        {targetObj?.zone?.name || 'No Zone'}
                                                    </Typography>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 font-bold text-gray-600 dark:text-gray-400 text-xs tracking-tighter">
                                                {((port as any).connected_port_name || '').includes(':') 
                                                    ? (port as any).connected_port_name.split(':')[1] 
                                                    : (port as any).connected_port_name || 'N/A'}
                                            </TableCell>
                                            <TableCell className="py-6">
                                                <Chip
                                                    label={config.label}
                                                    className={`
                                                        ${port.status?.toLowerCase() === 'offline' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                                            port.status?.toLowerCase() === 'problem' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                                                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'} 
                                                        font-black text-[9px] h-6 px-3 rounded-lg`}
                                                />
                                            </TableCell>
                                            <TableCell className="py-6 pr-10 text-right">
                                                <Tooltip title="Edit Connection">
                                                    <IconButton
                                                        size="small"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700"
                                                        onClick={() => {
                                                            setEditingPort(port);
                                                            setIsEditOpen(true);
                                                        }}
                                                    >
                                                        <EditIcon fontSize="small" className="text-gray-400 hover:text-blue-500" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                {(!selectedRiser.ports || selectedRiser.ports.filter(p => !!p.cable_id).length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-32 text-center">
                                            <TopologyIcon className="text-gray-200 dark:text-gray-700 mb-4 opacity-50" sx={{ fontSize: 64 }} />
                                            <Typography className="text-gray-400 italic text-sm font-medium">
                                                No active cable runs found for this cabinet.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {editingPort && selectedRiser && (
                <CableRunEditDialog
                    open={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    port={editingPort}
                    riser={selectedRiser}
                />
            )}
        </Box>
    );
};

export default WiringTopologyApp;
