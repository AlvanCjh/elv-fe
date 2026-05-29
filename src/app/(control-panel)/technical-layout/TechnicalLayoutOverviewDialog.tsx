import React, { FC, useState, useMemo, useRef, useEffect } from 'react';
import {
    Dialog, DialogContent, Typography, Button, IconButton, TextField, Chip,
    Box, Paper, CircularProgress, Divider, List, ListItem, ListItemText
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion, AnimatePresence } from 'motion/react';
import { TechnicalLayout, TechnicalLayoutZone, useTechnicalLayouts, useTechnicalLayoutWidgets, TechnicalLayoutWidget, useUpdateTechnicalLayout, useUpdateTechnicalLayoutWidget } from './technicalLayoutApi';
import { EnvironmentalWidget } from './components/EnvironmentalWidget';
import { WidgetPropertyDialog } from './components/WidgetPropertyDialog';
import { API_BASE_URL } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';

interface BoqItem {
    id: number;
    item_code: string;
    item_name: string;
    category: string;
    total_quantity: number;
    assigned_count?: number;
}

interface TechnicalLayoutOverviewDialogProps {
    open: boolean;
    onClose: () => void;
    layout: TechnicalLayout;
    projectId: number;
}

const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const TechnicalLayoutOverviewDialog: FC<TechnicalLayoutOverviewDialogProps> = ({ open, onClose, layout, projectId }) => {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [hoveredZoneId, setHoveredZoneId] = useState<number | null>(null);
    const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

    const { data: boqItems = [] } = useQuery<BoqItem[]>({
        queryKey: ['boq-items', projectId],
        queryFn: () => api.get('boq-items').json<BoqItem[]>(),
    });

    const [isAddingWidget, setIsAddingWidget] = useState(false);
    const [editingWidget, setEditingWidget] = useState<Partial<TechnicalLayoutWidget> | null>(null);
    const { data: widgets = [] } = useTechnicalLayoutWidgets(layout.id);
    const updateLayoutMutation = useUpdateTechnicalLayout();
    const updateWidgetMutation = useUpdateTechnicalLayoutWidget(layout.id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleWidgetDragEnd = (widgetId: number, newX: number, newY: number) => {
        updateWidgetMutation.mutate({
            id: widgetId,
            data: { x_pos: newX, y_pos: newY }
        });
    };

    const handleMapClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isAddingWidget) return;
        const img = e.currentTarget;
        const rect = img.getBoundingClientRect();
        const x_pos = ((e.clientX - rect.left) / rect.width) * 100;
        const y_pos = ((e.clientY - rect.top) / rect.height) * 100;
        
        setEditingWidget({ x_pos, y_pos });
        setIsAddingWidget(false);
    };

    const handleReplaceMap = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const formData = new FormData();
            formData.append('image', file);
            updateLayoutMutation.mutate({ id: layout.id, payload: formData });
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const isPanning = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 2 || (e.button === 0 && e.altKey)) {
            isPanning.current = true;
            startPos.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning.current) return;
        setPan({
            x: e.clientX - startPos.current.x,
            y: e.clientY - startPos.current.y
        });
    };

    const handleMouseUp = () => {
        isPanning.current = false;
    };

    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        
        const container = mapContainerRef.current;
        if (!container) return;

        const handleNativeWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const direction = Math.sign(e.deltaY);
            const factor = 1.1;
            const delta = direction > 0 ? 1 / factor : factor;
            
            setZoom(prev => {
                const nextZoom = prev * delta;
                return Math.max(0.1, Math.min(10, nextZoom));
            });
        };

        container.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleNativeWheel);
        };
    }, [open, layout.id]);

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="xl" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    height: '92vh',
                    margin: '4vh auto',
                    backgroundImage: 'none',
                    bgcolor: '#f8fafc'
                }
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <Typography className="text-indigo-600 font-black text-xs">BSS</Typography>
                    </div>
                    <div className="flex flex-col">
                        <Typography className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            {layout.name} — Overview
                            <Chip label="1 obj" size="small" className="h-4 text-[8px] font-black bg-slate-100 text-slate-500" />
                        </Typography>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleReplaceMap} />
                    <Button 
                        variant="outlined"
                        onClick={() => fileInputRef.current?.click()}
                        startIcon={updateLayoutMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <FuseSvgIcon size={16}>heroicons-outline:photo</FuseSvgIcon>}
                        className="rounded-xl border-slate-200 text-slate-900 font-black text-[10px] px-6 h-10 bg-white"
                        disabled={updateLayoutMutation.isPending}
                    >
                        Replace Map
                    </Button>
                    <Button 
                        variant={isAddingWidget ? "contained" : "outlined"}
                        color={isAddingWidget ? "primary" : "inherit"}
                        startIcon={<FuseSvgIcon size={16}>heroicons-outline:plus-circle</FuseSvgIcon>}
                        onClick={() => setIsAddingWidget(!isAddingWidget)}
                        className={`rounded-xl font-black text-[10px] px-6 h-10 ${!isAddingWidget ? 'border-slate-200 text-slate-900 bg-white' : 'shadow-lg'}`}
                    >
                        {isAddingWidget ? 'Cancel Add' : 'Add Widget'}
                    </Button>
                    <IconButton onClick={onClose} className="bg-slate-50 border border-slate-100 dark:bg-slate-800">
                        <FuseSvgIcon size={20}>heroicons-outline:x</FuseSvgIcon>
                    </IconButton>
                </div>
            </div>

            <DialogContent className="p-0 flex overflow-hidden">
                {/* Main Map Area */}
                <div 
                    ref={mapContainerRef}
                    className="flex-1 relative bg-slate-50 dark:bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {isAddingWidget && (
                        <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
                            <div className="bg-indigo-600/90 backdrop-blur-md p-4 rounded-2xl border border-indigo-500 shadow-xl max-w-[280px]">
                                <Typography className="text-[10px] text-indigo-200 font-black uppercase tracking-widest mb-1">Placement Mode</Typography>
                                <Typography className="text-[11px] font-medium text-white leading-relaxed">
                                    Click anywhere on the map to place a new environmental widget.
                                </Typography>
                            </div>
                        </div>
                    )}

                    {/* Zoom / Pan Controls */}
                    <div className="absolute top-6 right-6 z-10 flex flex-col gap-1">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                            <IconButton size="small" onClick={() => setZoom(prev => prev * 1.2)} className="rounded-none border-b border-slate-100 h-10 w-10">
                                <FuseSvgIcon size={16}>heroicons-outline:plus</FuseSvgIcon>
                            </IconButton>
                            <IconButton size="small" onClick={() => setZoom(prev => prev / 1.2)} className="rounded-none border-b border-slate-100 h-10 w-10">
                                <FuseSvgIcon size={16}>heroicons-outline:minus</FuseSvgIcon>
                            </IconButton>
                            <IconButton size="small" onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="rounded-none h-10 w-10">
                                <FuseSvgIcon size={16}>heroicons-outline:arrow-path</FuseSvgIcon>
                            </IconButton>
                        </div>
                        <div className="bg-white dark:bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black text-center text-slate-400 shadow-lg capitalize">
                            {(zoom * 100).toFixed(0)}%
                        </div>
                    </div>

                    {/* The Interactive Map */}
                    <div 
                        className="w-full h-full flex items-center justify-center transition-all duration-100"
                        style={{ 
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: 'center center'
                        }}
                    >
                        <div className={`relative inline-block shadow-2xl rounded-sm overflow-hidden bg-white ${isAddingWidget ? 'cursor-crosshair' : ''}`}>
                            <img 
                                src={getFullUrl(layout.image_path)} 
                                alt={layout.name}
                                className="max-w-[85vw] max-h-[75vh] block object-contain"
                                draggable={false}
                                onClick={handleMapClick}
                            />
                            {/* Removed SVG Overlay per user request */}
                            
                            {widgets.map(w => (
                                <EnvironmentalWidget 
                                    key={w.id} 
                                    id={w.id}
                                    x_pos={w.x_pos} 
                                    y_pos={w.y_pos} 
                                    temperature={w.metadata?.temperature || '0'} 
                                    humidity={w.metadata?.humidity || '0'} 
                                    colorTheme={w.color_theme} 
                                    status={w.status}
                                    isEditing={!isAddingWidget} // only interact with widgets when not placing new ones
                                    onClick={() => setEditingWidget(w)}
                                    onDragEnd={(newX, newY) => handleWidgetDragEnd(w.id, newX, newY)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Master BOQ Item List */}
                <Paper square elevation={0} className="w-[380px] shrink-0 border-l border-slate-100 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <Typography className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Master BOQ Item List</Typography>
                            <Typography className="text-[10px] text-indigo-500 font-black uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">1/19</Typography>
                        </div>
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            size="small"
                            className="rounded-xl border-rose-100 text-rose-500 font-black text-[9px] h-10 hover:bg-rose-50"
                            startIcon={<FuseSvgIcon size={14}>heroicons-outline:trash</FuseSvgIcon>}
                        >
                            Unassign All Items
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {boqItems.map((item, idx) => (
                            <Paper 
                                key={item.id} 
                                elevation={0} 
                                className={`p-4 rounded-2xl border transition-all ${idx % 2 === 0 ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <Typography className="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-tight mb-1">
                                            {item.item_code}
                                        </Typography>
                                        <Typography className="text-[10px] text-slate-500 uppercase font-bold truncate">
                                            {item.item_name}
                                        </Typography>
                                    </div>
                                    <Button 
                                        variant={idx % 2 === 0 ? "contained" : "outlined"}
                                        size="small"
                                        className={`rounded-lg px-4 h-7 text-[8px] font-black uppercase tracking-widest ${idx % 2 === 0 ? 'bg-indigo-600 text-white shadow-lg' : 'border-indigo-200 text-indigo-600'}`}
                                    >
                                        {idx % 2 === 0 ? 'Assigned' : 'Place'}
                                    </Button>
                                </div>
                            </Paper>
                        ))}
                    </div>
                </Paper>
            </DialogContent>

            <WidgetPropertyDialog 
                open={!!editingWidget} 
                onClose={() => setEditingWidget(null)} 
                widget={editingWidget} 
                layoutId={layout.id} 
                zones={layout.zones || []}
            />
        </Dialog>
    );
};
