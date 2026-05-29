'use client';

import React, { FC, useState, useRef, useCallback, useEffect } from 'react';
import { 
    Box, Typography, Button, IconButton, Paper, TextField, 
    List, ListItem, ListItemText, ListItemSecondaryAction,
    Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, CircularProgress, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Point, TechnicalLayout, TechnicalLayoutZone, useUpdateTechnicalLayoutZones, useDeleteTechnicalLayoutZone,
    useAddTechnicalLayoutZoneObject, useDeleteTechnicalLayoutZoneObject,
    useAddTechnicalLayoutZoneAnnotation, useDeleteTechnicalLayoutZoneAnnotation,
    useUpdateTechnicalLayoutZoneStatus
} from './technicalLayoutApi';
import { API_BASE_URL } from '@/utils/api';
import { enqueueSnackbar } from 'notistack';

const getFullUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

interface TechnicalLayoutEditorProps {
    layout: TechnicalLayout;
    onClose: () => void;
}

export const TechnicalLayoutEditor: FC<TechnicalLayoutEditorProps> = ({ layout, onClose }) => {
    // Canvas State
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [mode, setMode] = useState<'draw' | 'pan'>('draw');
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    
    // Drawing State
    const [points, setPoints] = useState<Point[]>([]);
    const [isClosed, setIsClosed] = useState(false);
    const [mousePos, setMousePos] = useState<Point | null>(null);

    // Sidebar State
    const [newZoneName, setNewZoneName] = useState('');
    
    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const lastMouse = useRef({ x: 0, y: 0 });
    const isPanning = useRef(false);

    const updateZonesMutation = useUpdateTechnicalLayoutZones();
    const deleteZoneMutation = useDeleteTechnicalLayoutZone();

    // Coordinate Conversion (Normalized to 1000x1000 for consistency)
    const getSvgPoint = useCallback((e: React.MouseEvent | MouseEvent): Point | null => {
        if (!imageRef.current) return null;
        const rect = imageRef.current.getBoundingClientRect();
        
        let rx = (e.clientX - rect.left) / rect.width;
        let ry = (e.clientY - rect.top) / rect.height;
        
        rx = Math.max(0, Math.min(1, rx));
        ry = Math.max(0, Math.min(1, ry));
        
        return { 
            x: +(rx * 1000).toFixed(1),
            y: +(ry * 1000).toFixed(1) 
        };
    }, []);

    // Panning/Drawing Handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Support Left click with modifiers, Middle click (1), or Right click (2)
        const canDrag = mode === 'pan' || isSpacePressed || e.button === 1 || e.button === 2 || e.altKey;
        
        if (canDrag) {
            e.preventDefault();
            isPanning.current = true;
            lastMouse.current = { x: e.clientX, y: e.clientY };
            if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
            return;
        }

        if (mode === 'draw' && e.button === 0 && !isClosed) {
            const pt = getSvgPoint(e);
            if (!pt) return;

            // Snap to start logic (2% threshold)
            if (points.length >= 3) {
                const start = points[0];
                const dx = pt.x - start.x;
                const dy = pt.y - start.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 20) {
                    setIsClosed(true);
                    return;
                }
            }
            setPoints(prev => [...prev, pt]);
        }
    }, [mode, isSpacePressed, isClosed, points, getSvgPoint]);

    const undoLastPoint = useCallback(() => {
        if (isClosed) setIsClosed(false);
        else setPoints(prev => prev.slice(0, -1));
    }, [isClosed]);

    const resetDrawing = useCallback(() => {
        setPoints([]);
        setIsClosed(false);
        setMousePos(null);
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                setIsSpacePressed(true);
            }
            if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
                undoLastPoint();
            }
            if (e.key === 'Escape') {
                resetDrawing();
            }
            if (e.key.toLowerCase() === 'v') setMode('draw');
            if (e.key.toLowerCase() === 'h') setMode('pan');
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [undoLastPoint, resetDrawing]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning.current) {
            const dx = e.clientX - lastMouse.current.x;
            const dy = e.clientY - lastMouse.current.y;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            lastMouse.current = { x: e.clientX, y: e.clientY };
            return;
        }
        if (mode === 'draw' && !isClosed) {
            setMousePos(getSvgPoint(e));
        }
    }, [isClosed, mode, getSvgPoint]);

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
        if (containerRef.current) {
            containerRef.current.style.cursor = mode === 'pan' ? 'grab' : mode === 'draw' ? 'crosshair' : 'default';
        }
    }, [mode]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY;
        const scaleChange = delta > 0 ? 0.9 : 1.1;
        setScale(s => Math.max(0.1, Math.min(8, (s * scaleChange))));
    }, []);

    const handleSaveZone = () => {
        if (!newZoneName || points.length < 3 || !isClosed) return;
        
        const svgPath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
        const newZ = { name: newZoneName, svg_path: svgPath };

        updateZonesMutation.mutate({
            id: layout.id,
            zones: [...layout.zones.map(z => ({ id: z.id, name: z.name, svg_path: z.svg_path })), newZ]
        }, {
            onSuccess: () => {
                resetDrawing();
                setNewZoneName('');
                enqueueSnackbar('Zone saved successfully', { variant: 'success' });
            },
            onError: () => {
                enqueueSnackbar('Failed to save zone', { variant: 'error' });
            }
        });
    };

    const handleDeleteZone = (index: number) => {
        const zoneToDelete = layout.zones[index];
        if (!zoneToDelete || !window.confirm('Are you sure you want to delete this zone?')) return;
        
        deleteZoneMutation.mutate(zoneToDelete.id, {
            onSuccess: () => {
                enqueueSnackbar('Zone deleted', { variant: 'info' });
            },
            onError: () => {
                enqueueSnackbar('Failed to delete zone', { variant: 'error' });
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
            <Paper className="w-full max-w-6xl h-[85vh] rounded-[24px] overflow-hidden flex flex-col bg-white shadow-2xl border border-slate-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-white">
                    <div className="flex items-center gap-8">
                        <Typography className="text-lg font-black text-slate-800 uppercase tracking-tight">
                            Manage Floor Zones
                        </Typography>

                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <Tooltip title="Draw Tool (V)">
                                <IconButton size="small" onClick={() => setMode('draw')} className={`rounded-lg p-1.5 transition-all ${mode === 'draw' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                                    <FuseSvgIcon size={16}>heroicons-outline:pencil-square</FuseSvgIcon>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Pan Tool (H or Space)">
                                <IconButton size="small" onClick={() => setMode('pan')} className={`rounded-lg p-1.5 transition-all ${mode === 'pan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                                    <FuseSvgIcon size={16}>heroicons-outline:hand-raised</FuseSvgIcon>
                                </IconButton>
                            </Tooltip>
                        </div>
                    </div>
                    
                    <IconButton onClick={onClose} size="small" className="bg-slate-50 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                        <FuseSvgIcon size={20}>heroicons-outline:x-mark</FuseSvgIcon>
                    </IconButton>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Sidebar */}
                    <div className="w-72 border-r flex flex-col bg-slate-50/50 p-5 gap-5 overflow-y-auto">
                        <div className="flex flex-col gap-4">
                            <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Add New Zone</Typography>
                            <TextField 
                                label="Zone Name" 
                                size="small" 
                                fullWidth 
                                value={newZoneName}
                                onChange={e => setNewZoneName(e.target.value)}
                                className="bg-white"
                            />
                            
                            <div className="p-3 bg-white border border-dashed rounded-xl flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <Typography className="text-[10px] font-bold text-slate-500">DRAWING STATUS</Typography>
                                    {points.length > 0 && (
                                        <button onClick={resetDrawing} className="text-[10px] text-rose-500 font-bold hover:underline">Reset</button>
                                    )}
                                </div>
                                <div className="text-[11px] font-mono text-slate-400 leading-relaxed min-h-[60px]">
                                    {isClosed ? 'Shape Closed! Ready to save.' : points.length === 0 ? 'Click map to drop start point...' : `${points.length} points defined. Click start point to close.`}
                                </div>
                            </div>

                            <Button 
                                variant="contained" 
                                fullWidth 
                                disabled={!newZoneName || !isClosed}
                                onClick={handleSaveZone}
                                sx={{ py: 1.5, fontWeight: 800, borderRadius: '12px', boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)' }}
                            >
                                {updateZonesMutation.isPending ? 'SAVING...' : 'SAVE ZONE'}
                            </Button>
                        </div>

                        <Divider className="opacity-50" />

                        <div className="flex-1 shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Existing Zones ({layout.zones.length})</Typography>
                                {layout.zones.length > 0 && (
                                    <Button 
                                        size="small" 
                                        color="error" 
                                        onClick={() => {
                                            if(window.confirm('Delete ALL zones?')) {
                                                updateZonesMutation.mutate({ id: layout.id, zones: [] });
                                            }
                                        }}
                                        sx={{ fontSize: '9px', minWidth: 0, p: '2px 8px' }}
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                {layout.zones.map((zone, idx) => (
                                    <div key={idx} className="p-3 bg-white border rounded-xl shadow-sm group hover:border-indigo-200 transition-all flex items-center justify-between">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <Typography className="text-[12px] font-bold truncate">{zone.name}</Typography>
                                            <div className="text-[8px] font-mono text-slate-300 truncate">{zone.svg_path}</div>
                                        </div>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleDeleteZone(idx)} 
                                            className="text-slate-300 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 transition-all"
                                        >
                                            <FuseSvgIcon size={14}>heroicons-outline:trash</FuseSvgIcon>
                                        </IconButton>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 relative bg-[#f8fafc] overflow-hidden flex items-center justify-center">
                        
                        {/* Live Status Banner */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
                            <motion.div 
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={`backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4 border transition-colors ${isClosed ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/90 border-slate-200 text-slate-700'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${isClosed ? 'bg-white' : 'bg-indigo-500'} animate-pulse`} />
                                <Typography className="text-inherit text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                                    {isClosed ? 'SHAPE CLOSED' : points.length === 0 ? 'START DRAWING (LEFT CLICK)' : `POINT ${points.length + 1}: TRACING ZONE`}
                                </Typography>
                            </motion.div>
                        </div>

                        {/* Right Zoom Controls */}
                        <div className="absolute bottom-10 right-10 z-20 flex bg-white/90 backdrop-blur-md rounded-2xl p-1.5 border border-slate-200 shadow-xl gap-1">
                            <IconButton size="small" onClick={() => setScale(s => s / 1.2)}><FuseSvgIcon size={18}>heroicons-outline:minus</FuseSvgIcon></IconButton>
                            <div className="w-12 text-center text-[11px] font-black self-center font-mono">{Math.round(scale * 100)}%</div>
                            <IconButton size="small" onClick={() => setScale(s => s * 1.2)}><FuseSvgIcon size={18}>heroicons-outline:plus</FuseSvgIcon></IconButton>
                            <Divider orientation="vertical" flexItem className="mx-1" />
                            <IconButton size="small" onClick={() => {setScale(1); setPan({x:0,y:0});}}><FuseSvgIcon size={18}>heroicons-outline:arrows-pointing-out</FuseSvgIcon></IconButton>
                        </div>

                        {/* Interactive Area */}
                        <div 
                            ref={containerRef}
                            className="w-full h-full flex items-center justify-center relative touch-none select-none overflow-hidden"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                            onContextMenu={(e) => {
                                // Only prevent default if we're not using it for something else
                                // Since we use it for panning, we must prevent the menu
                                e.preventDefault();
                            }}
                            style={{ cursor: isPanning.current ? 'grabbing' : mode === 'pan' ? 'grab' : mode === 'draw' ? 'crosshair' : 'default' }}
                        >
                            <div 
                                style={{ 
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                                    transformOrigin: '50% 50%',
                                    transition: isPanning.current ? 'none' : 'transform 0.1s ease-out'
                                }}
                                className="relative flex items-center justify-center shrink-0"
                            >
                                <img 
                                    ref={imageRef}
                                    src={getFullUrl(layout.image_path)} 
                                    alt="Layout" 
                                    className="max-w-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] rounded-sm bg-white border border-slate-200 block"
                                    draggable={false}
                                    onLoad={(e) => {
                                        const i = e.currentTarget;
                                        if (containerRef.current) {
                                            const c = containerRef.current.getBoundingClientRect();
                                            const sc = Math.min((c.width * 0.82) / i.naturalWidth, (c.height * 0.82) / i.naturalHeight);
                                            setScale(sc);
                                            setPan({ x: 0, y: 0 });
                                        }
                                    }}
                                />
                                <svg 
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                    viewBox="0 0 1000 1000"
                                    preserveAspectRatio="none"
                                >
                                    {layout.zones.map((zone, i) => (
                                        <path 
                                            key={i}
                                            d={zone.svg_path}
                                            fill="rgba(79, 70, 229, 0.15)"
                                            stroke="#4f46e5"
                                            strokeWidth={2 / scale}
                                            className="transition-all duration-200 hover:fill-indigo-600/30 cursor-pointer pointer-events-auto"
                                        />
                                    ))}

                                    {points.length > 0 && (
                                        <g>
                                            <path 
                                                d={`M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}${isClosed ? ' Z' : (mousePos ? ` L ${mousePos.x} ${mousePos.y}` : '')}`}
                                                fill={isClosed ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.08)"}
                                                stroke={isClosed ? "#10b981" : "#6366f1"}
                                                strokeWidth={2.5 / scale}
                                                strokeDasharray={isClosed ? "none" : `${6/scale},${4/scale}`}
                                            />
                                            {points.map((p, i) => (
                                                <circle 
                                                    key={i} 
                                                    cx={p.x} cy={p.y} 
                                                    r={(i === 0 ? 5 : 2.5) / scale} 
                                                    fill={i === 0 ? (isClosed ? "#10b981" : "#6366f1") : "white"}
                                                    stroke={i === 0 ? "white" : "#6366f1"}
                                                    strokeWidth={1.5 / scale} 
                                                />
                                            ))}
                                        </g>
                                    )}
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </Paper>
        </div>
    );
};
