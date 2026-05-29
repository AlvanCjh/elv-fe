import { FC, useState, useMemo, useRef, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useBuildingDetails, Floor, uploadBuildingElevation, createFloor, deleteFloor } from '../buildingApi';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import useUser from '@auth/useUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useProject } from '@/context/ProjectContext';

interface BuildingViewProps {
    buildingId: string;
    onSelectFloor: (floorId: string) => void;
}

const DEFAULT_SVG_WIDTH = 1745.28;
const DEFAULT_SVG_HEIGHT = 2705.92;

// Assign a color accent per floor type for visual richness
const FLOOR_TYPE_COLORS: Record<string, string> = {
    'basement': '#6366f1',
    'ground': '#10b981',
    'lobby': '#10b981',
    'typical': '#3b82f6',
    'plant': '#f59e0b',
    'roof': '#ef4444',
};

function getFloorColor(floor: Floor): string {
    const type = (floor.type || '').toLowerCase();
    for (const [key, color] of Object.entries(FLOOR_TYPE_COLORS)) {
        if (type.includes(key)) return color;
    }
    return '#3b82f6'; // default blue
}

// Helper function to assign a numeric weight to floor names for logical sorting
function getFloorWeight(floorNumberStr: string): number {
    const fn = floorNumberStr.toUpperCase().trim();

    const weights: Record<string, number> = {
        'ROOF': 1000,
        'R': 1000,
        'UG': 0.5,
        'G': 0,
        'GROUND': 0,
        'LG': -1,
        'B1': -2,
        'B2': -3,
        'B3': -4,
        'B4': -5,
        'B5': -6,
    };

    if (weights[fn] !== undefined) {
        return weights[fn];
    }

    const numMatch = fn.match(/(\d+)/);
    const num = numMatch ? parseInt(numMatch[1], 10) : 0;

    if (fn.startsWith('B') && !fn.startsWith('BL')) {
        return -num;
    }

    return num;
}

const BuildingView: FC<BuildingViewProps> = ({ buildingId, onSelectFloor }) => {
    const { data: building, isLoading, isError } = useBuildingDetails(buildingId);
    const [hoveredFloorId, setHoveredFloorId] = useState<number | null>(null);
    const [isUploadingElevation, setIsUploadingElevation] = useState(false);
    
    const { data: user } = useUser();
    const isSupervisor = Array.isArray(user?.role) ? user.role.includes('supervisor') : user?.role === 'supervisor';
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();

    // Dynamic map dimensions
    const [mapDims, setMapDims] = useState({ width: DEFAULT_SVG_WIDTH, height: DEFAULT_SVG_HEIGHT });
    
    const handleImageLoad = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.currentTarget;
        const { naturalWidth, naturalHeight, src } = img;

        if (naturalWidth && naturalHeight) {
            setMapDims({ width: naturalWidth, height: naturalHeight });
        } else if (src && src.endsWith('.svg')) {
            try {
                const response = await fetch(src);
                const text = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "image/svg+xml");
                const svgElement = xmlDoc.getElementsByTagName("svg")[0];

                if (svgElement) {
                    const viewBox = svgElement.getAttribute("viewBox");
                    if (viewBox) {
                        const [, , w, h] = viewBox.split(" ").map(Number);
                        if (w && h) {
                            setMapDims({ width: w, height: h });
                            return;
                        }
                    }

                    const w = svgElement.getAttribute("width");
                    const h = svgElement.getAttribute("height");
                    if (w && h) {
                        setMapDims({ width: parseFloat(w), height: parseFloat(h) });
                    }
                }
            } catch (err) {
                console.error("Failed to parse SVG dimensions:", err);
            }
        }
    };

    // --- FLOOR DRAWING STATE ---
    const [isDrawingFloor, setIsDrawingFloor] = useState(false);
    const [polygonPoints, setPolygonPoints] = useState<{ x: number, y: number }[]>([]);
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
    const [newFloorOpen, setNewFloorOpen] = useState(false);
    const [newFloorDetails, setNewFloorDetails] = useState({ floor_number: '', type: '' });
    const [newFloorSvgPath, setNewFloorSvgPath] = useState('');

    const createFloorMutation = useMutation({
        mutationFn: (data: any) => createFloor(buildingId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['building', buildingId, activeProjectId] });
            setNewFloorOpen(false);
            setPolygonPoints([]);
            setIsDrawingFloor(false);
            setNewFloorDetails({ floor_number: '', type: '' });
            setNewFloorSvgPath('');
        }
    });

    const deleteFloorMutation = useMutation({
        mutationFn: (id: number) => deleteFloor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['building', buildingId, activeProjectId] });
        }
    });

    const elevationMutation = useMutation({
        mutationFn: (file: File) => uploadBuildingElevation(buildingId, file),
        onMutate: () => setIsUploadingElevation(true),
        onSettled: () => {
            setIsUploadingElevation(false);
            queryClient.invalidateQueries({ queryKey: ['building', buildingId, activeProjectId] });
        }
    });

    const handleUploadElevation = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            elevationMutation.mutate(e.target.files[0]);
        }
    };

    const sortedFloors = useMemo(() => {
        if (!building?.floors) return [];
        return [...building.floors].sort((a, b) => {
            const weightA = getFloorWeight(a.floor_number);
            const weightB = getFloorWeight(b.floor_number);
            return weightB - weightA;
        });
    }, [building?.floors]);

    const getPathData = (floor: Floor) => {
        if (!floor.floor_plan_svg) return { d: null, transform: undefined };
        const dMatch = floor.floor_plan_svg.match(/d\s*=\s*["']([^"']+)["']/i);
        const transformMatch = floor.floor_plan_svg.match(/transform\s*=\s*["']([^"']+)["']/i);
        return {
            d: dMatch ? dMatch[1] : floor.floor_plan_svg,
            transform: transformMatch ? transformMatch[1] : undefined
        };
    };

    const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!isDrawingFloor) return;
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        setMousePos({ x: cursorPt.x, y: cursorPt.y });
    };

    const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!isDrawingFloor) return;
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        setPolygonPoints(prev => [...prev, { x: svgPt.x, y: svgPt.y }]);
    };

    const handleSvgDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!isDrawingFloor) return;
        e.preventDefault();
        if (polygonPoints.length >= 3) {
            const pathData = polygonPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z';
            setNewFloorSvgPath(pathData);
            setNewFloorOpen(true);
        }
    };

    const submitNewFloor = () => {
        if (!newFloorSvgPath) return;
        createFloorMutation.mutate({
            floor_number: newFloorDetails.floor_number,
            type: newFloorDetails.type,
            floor_plan_svg: newFloorSvgPath
        });
    };

    const hoveredFloor = useMemo(
        () => sortedFloors.find(f => f.id === hoveredFloorId) ?? null,
        [hoveredFloorId, sortedFloors]
    );

    const backgroundMap = useMemo(() => {
        if (building?.elevation_image_url) {
            try {
                const url = new URL(building.elevation_image_url);
                return url.pathname + url.search;
            } catch (e) {
                return building.elevation_image_url;
            }
        }
        return `${import.meta.env.BASE_URL}assets/maps/floor_plans/floor.svg`;
    }, [building]);

    if (isLoading) return <Box className="w-full h-full flex items-center justify-center"><CircularProgress /></Box>;
    if (isError || !building) return <Box className="w-full h-full flex items-center justify-center text-red-500">Error loading details</Box>;

    return (
        <div className="flex w-full h-[calc(100vh-180px)] overflow-hidden rounded-xl shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

            {/* ─── LEFT: Floor List ─────────────────────────────────────── */}
            <div className="w-64 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                    <Typography variant="caption" className="font-bold uppercase tracking-widest text-gray-400">
                        {building.name}
                    </Typography>
                    <Typography variant="body2" className="font-semibold text-gray-700 dark:text-gray-200 mt-0.5">
                        {isDrawingFloor ? 'Drawing Mode' : 'Select a Floor'}
                    </Typography>
                </div>

                {/* Supervisor Controls */}
                {isSupervisor && (
                    <div className="p-3 border-b dark:border-gray-700 flex flex-col gap-2 bg-white dark:bg-gray-800">
                        <Button
                            variant={isDrawingFloor ? "contained" : "outlined"}
                            color={isDrawingFloor ? "primary" : "inherit"}
                            startIcon={<FuseSvgIcon size={20}>{isDrawingFloor ? "heroicons-outline:check" : "heroicons-outline:pencil"}</FuseSvgIcon>}
                            onClick={() => {
                                if (isDrawingFloor) {
                                    setIsDrawingFloor(false);
                                    setPolygonPoints([]);
                                } else {
                                    setIsDrawingFloor(true);
                                }
                            }}
                            fullWidth
                            size="small"
                        >
                            {isDrawingFloor ? 'Cancel Drawing' : 'Draw Floor'}
                        </Button>

                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={isUploadingElevation ? <CircularProgress size={16} /> : <FuseSvgIcon size={20}>heroicons-outline:upload</FuseSvgIcon>}
                            disabled={isUploadingElevation}
                            fullWidth
                            size="small"
                            className="border-dashed"
                        >
                            {isUploadingElevation ? 'Uploading...' : 'Replace Elevation'}
                            <input type="file" hidden accept="image/*, .svg" onChange={handleUploadElevation} />
                        </Button>
                    </div>
                )}

                {/* Floor buttons */}
                <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                    {isDrawingFloor ? (
                        <div className="p-4 text-center">
                            <Typography variant="body2" className="text-blue-600 font-bold mb-2">Instructions:</Typography>
                            <Typography variant="caption" className="text-gray-500 leading-tight block">
                                1. Click corners to outline a floor.<br/>
                                2. Double-click to finish.<br/>
                                3. Enter floor details in dialog.
                            </Typography>
                        </div>
                    ) : sortedFloors.map((floor) => {
                        const color = getFloorColor(floor);
                        const isHovered = hoveredFloorId === floor.id;
                        return (
                            <Box key={floor.id} className="relative group/item">
                                <button
                                    onMouseEnter={() => setHoveredFloorId(floor.id)}
                                    onMouseLeave={() => setHoveredFloorId(null)}
                                    onClick={() => onSelectFloor(floor.id.toString())}
                                    style={{
                                        borderLeft: `4px solid ${isHovered ? color : 'transparent'}`,
                                        background: isHovered ? `${color}18` : 'transparent',
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 hover:shadow-sm"
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs transition-all duration-150"
                                        style={{
                                            background: isHovered ? color : '#e5e7eb',
                                            color: isHovered ? 'white' : '#6b7280',
                                            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                        }}
                                    >
                                        {floor.floor_number}
                                    </div>

                                    <div className="flex flex-col min-w-0 flex-1 pr-6">
                                        <span
                                            className="text-sm font-semibold truncate transition-colors duration-150"
                                            style={{ color: isHovered ? color : undefined }}
                                        >
                                            Floor {floor.floor_number}
                                        </span>
                                        <span className="text-[10px] text-gray-400 truncate capitalize">
                                            {floor.type || 'N/A'}
                                        </span>
                                    </div>
                                </button>
                                
                                {isSupervisor && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity z-10">
                                        <Tooltip title="Delete Floor">
                                            <IconButton 
                                                size="small" 
                                                color="error" 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (window.confirm(`Are you sure you want to delete floor ${floor.floor_number}?`)) {
                                                        deleteFloorMutation.mutate(floor.id);
                                                    }
                                                }}
                                                disabled={deleteFloorMutation.isPending}
                                            >
                                                <FuseSvgIcon size={16}>heroicons-outline:trash</FuseSvgIcon>
                                            </IconButton>
                                        </Tooltip>
                                    </div>
                                )}
                            </Box>
                        );
                    })}
                </div>
            </div>

            {/* ─── RIGHT: Building Image ────────────────────────────────── */}
            <div className="flex-1 relative flex flex-col overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800">

                {/* Floating floor label on hover */}
                <div
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-200 pointer-events-none"
                    style={{ opacity: hoveredFloor ? 1 : 0, transform: `translateX(-50%) translateY(${hoveredFloor ? '0' : '-8px'})` }}
                >
                    {hoveredFloor && (
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-full shadow-xl text-white text-sm font-bold backdrop-blur-sm"
                            style={{ background: getFloorColor(hoveredFloor) }}
                        >
                            <span>Floor {hoveredFloor.floor_number}</span>
                            {hoveredFloor.type && (
                                <span className="text-xs font-normal opacity-80 capitalize">— {hoveredFloor.type}</span>
                            )}
                            <span className="text-xs opacity-70">Click to open</span>
                        </div>
                    )}
                </div>

                {/* Building image + SVG overlay — fills width, scrollable vertically */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                    <div
                        className="relative w-full shadow-2xl rounded-lg overflow-hidden mx-auto bg-white dark:bg-gray-800"
                        style={{ 
                            width: '100%',
                            maxWidth: `${mapDims.width}px`,
                            aspectRatio: `${mapDims.width} / ${mapDims.height}`,
                        }}
                    >
                        {/* Background image */}
                        <img
                            src={backgroundMap}
                            alt="Building Elevation"
                            onLoad={handleImageLoad}
                            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0"
                            draggable={false}
                        />

                        {/* Interactive SVG overlay */}
                        <svg
                            viewBox={`0 0 ${mapDims.width} ${mapDims.height}`}
                            className={`absolute inset-0 w-full h-full z-10 ${isDrawingFloor ? 'cursor-crosshair' : ''}`}
                            preserveAspectRatio="none"
                            onClick={handleSvgClick}
                            onMouseMove={handleSvgMouseMove}
                            onDoubleClick={handleSvgDoubleClick}
                        >
                            {sortedFloors.map((floor) => {
                                const { d, transform } = getPathData(floor);
                                if (!d) return null;
                                const isHovered = hoveredFloorId === floor.id;
                                const color = getFloorColor(floor);

                                return (
                                    <path
                                        key={floor.id}
                                        d={d}
                                        transform={transform}
                                        onMouseEnter={() => setHoveredFloorId(floor.id)}
                                        onMouseLeave={() => setHoveredFloorId(null)}
                                        onClick={() => onSelectFloor(floor.id.toString())}
                                        style={{
                                            cursor: 'pointer',
                                            pointerEvents: 'all',
                                            fill: isHovered ? `${color}55` : 'transparent',
                                            stroke: isHovered ? color : 'transparent',
                                            strokeWidth: isHovered ? 5 : 0,
                                            filter: isHovered ? `drop-shadow(0 0 6px ${color}88)` : 'none',
                                            transition: 'all 0.15s ease-out',
                                        }}
                                    />
                                );
                            })}

                            {/* DRAWING FLOOR PREVIEW */}
                            {isDrawingFloor && polygonPoints.length > 0 && (
                                <>
                                    <polygon
                                        points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                        fill="rgba(37, 99, 235, 0.2)"
                                        stroke="#3b82f6"
                                        strokeWidth="5"
                                    />
                                    {mousePos && (
                                        <line
                                            x1={polygonPoints[polygonPoints.length - 1].x}
                                            y1={polygonPoints[polygonPoints.length - 1].y}
                                            x2={mousePos.x}
                                            y2={mousePos.y}
                                            stroke="#3b82f6"
                                            strokeWidth="3"
                                            strokeDasharray="8 8"
                                        />
                                    )}
                                    {polygonPoints.map((p, i) => (
                                        <circle key={i} cx={p.x} cy={p.y} r={10} fill="#ffffff" stroke="#2563eb" strokeWidth="4" />
                                    ))}
                                </>
                            )}
                        </svg>
                    </div>
                </div>

                {/* Bottom hint */}
                <div className="shrink-0 py-2 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <Typography variant="caption" className="text-gray-400">
                        {isDrawingFloor ? 'DOUBLE CLICK to finish drawing the area' : 'Hover a floor to highlight · Click to open floor plan'}
                    </Typography>
                </div>
            </div>

            {/* SAVE DRAWN FLOOR DIALOG */}
            <Dialog open={newFloorOpen} onClose={() => !createFloorMutation.isPending && setNewFloorOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Save New Floor</DialogTitle>
                <DialogContent dividers className="space-y-4 pt-4">
                    <TextField
                        label="Floor Number (e.g., L5, UG, Roof)"
                        fullWidth
                        size="small"
                        required
                        value={newFloorDetails.floor_number}
                        onChange={(e) => setNewFloorDetails({ ...newFloorDetails, floor_number: e.target.value })}
                        disabled={createFloorMutation.isPending}
                    />
                    <TextField
                        label="Floor Type (e.g., Typical, Commercial, Plant)"
                        fullWidth
                        size="small"
                        value={newFloorDetails.type}
                        onChange={(e) => setNewFloorDetails({ ...newFloorDetails, type: e.target.value })}
                        disabled={createFloorMutation.isPending}
                    />
                    <TextField
                        label="Generated SVG Path"
                        fullWidth
                        size="small"
                        multiline
                        rows={5}
                        value={newFloorSvgPath}
                        onChange={(e) => setNewFloorSvgPath(e.target.value)}
                        disabled={createFloorMutation.isPending}
                        InputProps={{
                            style: { fontFamily: 'monospace', fontSize: '11px' }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewFloorOpen(false)} color="inherit" disabled={createFloorMutation.isPending}>Cancel</Button>
                    <Button
                        onClick={submitNewFloor}
                        color="primary"
                        variant="contained"
                        disabled={!newFloorDetails.floor_number || !newFloorSvgPath || createFloorMutation.isPending}
                    >
                        {createFloorMutation.isPending ? 'Saving...' : 'Create Floor'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default BuildingView;