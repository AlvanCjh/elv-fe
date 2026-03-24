import React, { useState } from 'react';
import { Paper, Typography, Box, Tooltip, IconButton, Button } from '@mui/material';
import { SettingsInputComponent as PortIcon, Link as LinkIcon, LinkOff as UnlinkedIcon, DeleteOutline as DeleteIcon, Build as ManageIcon } from '@mui/icons-material';
import { ObjectComponent, ObjectPort } from '../../building-progress/buildingApi';
import PortDetailDialog from './PortDetailDialog';
import EquipmentPortManager from './EquipmentPortManager';

interface RackViewProps {
    title: string;
    type: 'patch' | 'ethernet' | 'general';
    item: any;
    riser: ObjectComponent;
    allObjects: ObjectComponent[];
    uNumber: number;
    currentFloorId: string | number;
    isReadOnly?: boolean;
    onDelete: () => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
}

const RackView: React.FC<RackViewProps> = ({ title, type, item, riser, allObjects, uNumber, currentFloorId, isReadOnly, onDelete, onDrop, onDragOver }) => {
    const [selectedPort, setSelectedPort] = useState<{ portName: string, portData?: ObjectPort } | null>(null);
    const [isPortManagerOpen, setIsPortManagerOpen] = useState(false);
    const [isDragOverLocally, setIsDragOverLocally] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Filter ports for this specific equipment ID
    const displayPorts = (riser.ports || []).filter(p => p.port_name.startsWith(`${item.id}:`));

    const handleDragStart = (e: React.DragEvent) => {
        if (isReadOnly) return;
        setIsDragging(true);
        e.dataTransfer.setData('rackItemId', item.id);
        e.dataTransfer.setData('sourceIndex', String(uNumber - 1));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleLocalDragEnter = (e: React.DragEvent) => {
        if (isReadOnly) return;
        e.preventDefault();
        setIsDragOverLocally(true);
    };

    const handleLocalDragLeave = () => {
        setIsDragOverLocally(false);
    };

    const handleLocalDrop = (e: React.DragEvent) => {
        setIsDragOverLocally(false);
        if (onDrop) onDrop(e);
    };

    return (
        <Paper
            elevation={isDragOverLocally ? 24 : 8}
            draggable={!isReadOnly}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragEnter={handleLocalDragEnter}
            onDragLeave={handleLocalDragLeave}
            onDrop={handleLocalDrop}
            onDragOver={onDragOver}
            className={`
                p-1 rounded-md bg-gray-700 border-x-[10px] shadow-2xl overflow-hidden group mb-1.5 transition-all duration-200
                ${isReadOnly ? '' : 'cursor-grab active:cursor-grabbing'}
                ${isDragOverLocally ? 'scale-[1.02] border-blue-400 z-10 brightness-110' : 'border-gray-600'}
                ${isDragging ? 'opacity-40 grayscale' : 'opacity-100'}
            `}
            sx={{
                background: isDragOverLocally 
                    ? 'linear-gradient(180deg, #4b5563 0%, #374151 100%)'
                    : 'linear-gradient(180deg, #374151 0%, #1f2937 100%)',
                position: 'relative',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(0,0,0,0.3)',
            }}
        >
            {/* Glossy overlay */}
            <div className="absolute top-0 left-0 right-0 h-[40%] bg-white/5 pointer-events-none"></div>

            {/* Rack Mount Ears Decoration - more metallic */}
            <div className="absolute top-3 left-[-6px] w-3 h-4 bg-gradient-to-r from-gray-400 to-gray-600 rounded-sm shadow-sm border border-gray-500/50 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-gray-800/50"></div>
            </div>
            <div className="absolute bottom-3 left-[-6px] w-3 h-4 bg-gradient-to-r from-gray-400 to-gray-600 rounded-sm shadow-sm border border-gray-500/50 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-gray-800/50"></div>
            </div>
            <div className="absolute top-3 right-[-6px] w-3 h-4 bg-gradient-to-l from-gray-400 to-gray-600 rounded-sm shadow-sm border border-gray-500/50 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-gray-800/50"></div>
            </div>
            <div className="absolute bottom-3 right-[-6px] w-3 h-4 bg-gradient-to-l from-gray-400 to-gray-600 rounded-sm shadow-sm border border-gray-500/50 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-gray-800/50"></div>
            </div>

            <Box className="px-4 py-2 bg-gray-900/60 flex justify-between items-center border-b border-black/20">
                <div className="flex items-center gap-3">
                    <Typography variant="caption" className="font-black text-gray-200 uppercase tracking-[0.2em] text-[10px] drop-shadow-sm">
                        {title}
                    </Typography>
                    <Typography variant="caption" className="text-[9px] font-black text-blue-300 bg-blue-900/40 border border-blue-500/30 px-1.5 py-0.5 rounded-sm">{uNumber}U</Typography>

                    <div className="flex gap-1 opacity-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
                    </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isReadOnly && (
                        <>
                            <Button
                                size="small"
                                variant="text"
                                className="text-[9px] font-bold text-blue-400 py-0 min-w-0"
                                onClick={() => setIsPortManagerOpen(true)}
                                startIcon={<ManageIcon sx={{ fontSize: 10 }} />}
                            >
                                PORTS
                            </Button>
                            <IconButton size="small" className="text-gray-500 hover:text-red-400 p-0.5" onClick={onDelete}>
                                <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </>
                    )}
                </div>
            </Box>

            <div className={`p-3 grid gap-1.5 grid-cols-6 sm:grid-cols-12`}>
                {displayPorts.map((portData) => {
                    const fullName = portData.port_name;
                    const index = fullName.indexOf(':');
                    const portName = index > -1 ? fullName.substring(index + 1) : fullName;
                    const isLinked = !!portData?.cable_id;
                    const targetObj = allObjects.find(o => o.id === portData?.connected_to_object_id);
                    const isDifferentFloor = targetObj && String(targetObj.zone?.floor_id) !== String(currentFloorId);

                    return (
                        <Tooltip
                            key={portData.id || fullName}
                            title={
                                <Box className="p-1">
                                    <Typography variant="caption" className="font-bold block">{portName}</Typography>
                                    {isLinked ? (
                                        <>
                                            <Typography variant="caption" className="text-green-400 block">Cable: {portData?.cable_id}</Typography>
                                            <Typography variant="caption" className="text-gray-300 block">
                                                To: {targetObj?.item_alias_id || targetObj?.item_name || portData?.connected_to_object_id}
                                                {isDifferentFloor && ` (Floor ${targetObj?.zone?.floor_id})`}
                                            </Typography>
                                        </>
                                    ) : (
                                        <Typography variant="caption" className="text-amber-400">Available Port</Typography>
                                    )}
                                </Box>
                            }
                            arrow
                        >
                            <Box
                                onClick={() => setSelectedPort({ portName, portData: portData })}
                                className={`
                                    aspect-square rounded-[3px] border flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                                    ${isLinked
                                        ? isDifferentFloor
                                            ? 'bg-purple-900/40 border-purple-500/50 text-purple-400 hover:bg-purple-800/60 shadow-[inset_0_0_5px_rgba(168,85,247,0.2)]'
                                            : 'bg-blue-900/40 border-blue-500/50 text-blue-400 hover:bg-blue-800/60 shadow-[inset_0_0_5px_rgba(59,130,246,0.2)]'
                                        : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500 hover:bg-gray-700'
                                    }
                                `}
                            >
                                <PortIcon sx={{ fontSize: 14 }} />
                                <span className="text-[7px] font-black mt-0.5 truncate w-full text-center px-1">
                                    {portName}
                                </span>
                                {isLinked && (
                                    <div className="absolute top-0 right-0 p-0.5">
                                        <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></div>
                                    </div>
                                )}
                            </Box>
                        </Tooltip>
                    );
                })}
                {displayPorts.length === 0 && !isReadOnly && (
                    <Box className="col-span-full py-4 flex flex-col items-center opacity-20 cursor-pointer hover:opacity-40 transition-opacity" onClick={() => setIsPortManagerOpen(true)}>
                        <Typography variant="caption" className="text-[10px] uppercase font-bold tracking-widest text-white">Add Ports</Typography>
                    </Box>
                )}
            </div>

            <PortDetailDialog
                open={!!selectedPort}
                onClose={() => setSelectedPort(null)}
                portName={selectedPort?.portName || ''}
                portData={selectedPort?.portData}
                riser={riser}
                isReadOnly={isReadOnly}
            />

            <EquipmentPortManager
                open={isPortManagerOpen}
                onClose={() => setIsPortManagerOpen(false)}
                equipment={item}
                riser={riser}
            />
        </Paper>
    );
};

export default RackView;
