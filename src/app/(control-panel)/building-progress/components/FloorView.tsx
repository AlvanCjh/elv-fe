import { FC, useState, useMemo, useRef, MouseEvent, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton, Tooltip, Tabs, Tab } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useFloorDetails, Zone, fetchObjects, fetchAnnotations, ObjectComponent, PlanAnnotation, createObject, createAnnotation, updateObjectStatus, uploadFloorImage, createZone, deleteZone } from '../buildingApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DetailedPlanView from './DetailedPlanView';
import BoqApp from '../../bill-of-quantity/BoqApp';
import { CableTopology } from './CableTopology';
import useUser from '@auth/useUser';
import { useProject } from '@/context/ProjectContext';
import DeleteIcon from '@mui/icons-material/Delete';
import { LegendDialog } from './LegendDialog';
import { useBuildings } from '../buildingApi';

interface FloorViewProps {
    buildingId: string;
    floorId: string;
    initialZoneId?: number;
    initialSystemType?: string;
}

// Base dimensions fallback if image hasn't loaded
const DEFAULT_SVG_WIDTH = 1392.640;
const DEFAULT_SVG_HEIGHT = 1123.200;

const SYSTEM_TYPES = [
    { id: 'all', label: 'LAYOUT', color: 'bg-gray-600' },
    { id: 'bss', label: 'BSS', color: 'bg-blue-600' },
    { id: 'pa', label: 'PA', color: 'bg-orange-600' },
    { id: 'telco', label: 'TELCO', color: 'bg-purple-600' },
];

const FloorView: FC<FloorViewProps> = ({ buildingId, floorId, initialZoneId, initialSystemType }) => {
    const { data: floor, isLoading, isError } = useFloorDetails(floorId);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [hoveredZoneId, setHoveredZoneId] = useState<number | null>(null);
    const [selectedSystem, setSelectedSystem] = useState<string>('all');
    const [isOverviewOpen, setIsOverviewOpen] = useState(false);

    const { data: user } = useUser();
    const isSupervisor = Array.isArray(user?.role) ? user.role.includes('supervisor') : user?.role === 'supervisor';
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();

    // Analytics Dashboard Tabs
    const [activeBottomTab, setActiveBottomTab] = useState(0);

    const [isUploadingPlan, setIsUploadingPlan] = useState(false);
    const [isLegendDialogOpen, setIsLegendDialogOpen] = useState(false);
    const { data: buildings = [] } = useBuildings();

    // Dynamic map dimensions
    const [mapDims, setMapDims] = useState({ width: DEFAULT_SVG_WIDTH, height: DEFAULT_SVG_HEIGHT });
    const handleImageLoad = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = e.currentTarget;
        const { naturalWidth, naturalHeight, src } = img;

        if (naturalWidth && naturalHeight) {
            setMapDims({ width: naturalWidth, height: naturalHeight });
        } else if (src && src.endsWith('.svg')) {
            // For SVGs that don't report natural dimensions, fetch and parse the viewBox
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

    // --- ZONE DRAWING STATE ---
    const [isDrawingZone, setIsDrawingZone] = useState(false);
    const [polygonPoints, setPolygonPoints] = useState<{ x: number, y: number }[]>([]);
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
    const [newZoneOpen, setNewZoneOpen] = useState(false);
    const [newZoneDetails, setNewZoneDetails] = useState({ alias_id: '', name: '', area: '', location_desc: '' });
    const [newZoneSvgPath, setNewZoneSvgPath] = useState('');

    const createZoneMutation = useMutation({
        mutationFn: (data: any) => createZone(Number(floorId), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['floor', floorId, activeProjectId] });
            setNewZoneOpen(false);
            setPolygonPoints([]);
            setIsDrawingZone(false);
            setNewZoneDetails({ alias_id: '', name: '', area: '', location_desc: '' });
            setNewZoneSvgPath('');
        }
    });

    const deleteZoneMutation = useMutation({
        mutationFn: (id: number) => deleteZone(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['floor', floorId, activeProjectId] });
            setSelectedZone(null);
        }
    });

    const floorPlanMutation = useMutation({
        mutationFn: ({ file, system }: { file: File, system?: string }) => uploadFloorImage(floorId, file, system),
        onMutate: () => setIsUploadingPlan(true),
        onSettled: () => {
            setIsUploadingPlan(false);
            queryClient.invalidateQueries({ queryKey: ['floor', floorId, activeProjectId] });
        }
    });

    const handleUploadPlan = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            floorPlanMutation.mutate({ 
                file: e.target.files[0], 
                system: selectedSystem !== 'all' ? selectedSystem : undefined 
            });
        }
    };

    useEffect(() => {
        if (floor && initialZoneId) {
            const zone = floor.zones?.find(z => z.id === initialZoneId);
            if (zone) {
                setSelectedZone(zone);
                if (initialSystemType) setSelectedSystem(initialSystemType);
                setIsOverviewOpen(true);
            }
        }
    }, [floor, initialZoneId, initialSystemType]);

    // Zoom & Pan State
    const [zoomLevel, setZoomLevel] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Refs for drag calculations to avoid closure staleness in event listeners
    const dragInfo = useRef({
        startX: 0,
        startY: 0,
        panX: 0,
        panY: 0
    });

    const { data: objects, isLoading: isLoadingObjects } = useQuery({
        queryKey: ['objects', selectedZone?.id, selectedSystem, activeProjectId],
        queryFn: () => fetchObjects(selectedZone!.id, selectedSystem),
        enabled: !!selectedZone && selectedSystem !== 'all',
    });

    const handleSystemChange = (systemId: string) => {
        setSelectedSystem(systemId);
    };

    // Zoom Limits
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 5));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
    const handleResetZoom = () => {
        setZoomLevel(1);
        setPan({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || e.button !== 0) return;

        setIsDragging(true);
        dragInfo.current = {
            startX: e.clientX,
            startY: e.clientY,
            panX: pan.x,
            panY: pan.y
        };
        e.preventDefault();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: globalThis.MouseEvent) => {
            const dx = e.clientX - dragInfo.current.startX;
            const dy = e.clientY - dragInfo.current.startY;
            setPan({
                x: dragInfo.current.panX + dx,
                y: dragInfo.current.panY + dy
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Filter and prepare zones
    const zonesDisplay = useMemo(() => {
        return floor?.zones || [];
    }, [floor]);

    const backgroundMap = useMemo(() => {
        if (!floor) return `${import.meta.env.BASE_URL}assets/maps/floor_plans/zone.svg`;

        if (floor.floor_plan_image_url) {
            try {
                const url = new URL(floor.floor_plan_image_url);
                return url.pathname + url.search;
            } catch (e) {
                return floor.floor_plan_image_url;
            }
        }

        let mapName = 'zone.svg';
        if (floor.floor_number === 'LG') mapName = 'LG.svg';
        if (floor.floor_number === 'G') mapName = 'G.svg';

        return `${import.meta.env.BASE_URL}assets/maps/floor_plans/${mapName}`;
    }, [floor]);

    // Overview image based on system type
    const overviewImage = useMemo(() => {
        if (!floor || selectedSystem === 'all') return null;

        const resolveUrl = (imageUrl: string) => {
            try { return new URL(imageUrl).pathname + new URL(imageUrl).search; } catch { return imageUrl; }
        };

        // Check if dynamic upload exists
        if (selectedSystem === 'bss' && floor.bss_plan_image_url) return resolveUrl(floor.bss_plan_image_url);
        if (selectedSystem === 'pa' && floor.pa_plan_image_url) return resolveUrl(floor.pa_plan_image_url);
        if (selectedSystem === 'telco' && floor.telco_plan_image_url) return resolveUrl(floor.telco_plan_image_url);

        let floorLabel = floor.floor_number;
        if (/^\d+$/.test(floorLabel)) {
            floorLabel = `L${floorLabel}`;
        }

        const system = selectedSystem.toLowerCase();
        // Example: /assets/maps/bss_floor_plans/bss-L5.jpg
        return `${import.meta.env.BASE_URL}assets/maps/${system}_floor_plans/${system}-${floorLabel}.jpg`;
    }, [selectedSystem, floor]);

    const getZonePathData = (zone: Zone) => {
        if (!zone.svg_path) return { d: null, transform: undefined };
        // Extracts 'd' content if user saved full <path> tag, else returns raw string
        const dMatch = zone.svg_path.match(/d\s*=\s*["']([^"']+)["']/i);
        const transformMatch = zone.svg_path.match(/transform\s*=\s*["']([^"']+)["']/i);

        return {
            d: dMatch ? dMatch[1] : zone.svg_path,
            transform: transformMatch ? transformMatch[1] : undefined
        };
    };

    const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!isDrawingZone) return;
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
        setMousePos({ x: cursorPt.x, y: cursorPt.y });
    };

    const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
        // Only draw if we're actually in draw mode and not dragging the view
        if (!isDrawingZone || isDragging) return;

        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

        setPolygonPoints(prev => [...prev, { x: svgPt.x, y: svgPt.y }]);
    };

    const handleSvgDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!isDrawingZone) return;
        e.preventDefault();
        if (polygonPoints.length >= 3) {
            const pathData = polygonPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + ' Z';
            setNewZoneSvgPath(pathData);
            setNewZoneOpen(true);
        }
    };

    const submitNewZone = () => {
        if (!newZoneSvgPath) return;

        // Ensure we save a usable path. If it doesn't start with M, it might be legacy or partial.
        // But here we expect the optimized M...Z format.
        // Wrap in <path> if it's just coordinates for backend consistency IF needed, 
        // but let's stick to the raw path for now as requested.
        createZoneMutation.mutate({
            alias_id: newZoneDetails.alias_id,
            name: newZoneDetails.name,
            area: newZoneDetails.area,
            location_desc: newZoneDetails.location_desc,
            svg_path: newZoneSvgPath
        });
    };

    if (isLoading) return <Box className="w-full h-full flex items-center justify-center"><CircularProgress /></Box>;
    if (isError) return <Typography color="error" className="p-4">Error loading floor plan.</Typography>;

    return (
        <Box className="w-full min-h-full flex flex-col gap-6 p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            {/* TOP ROW: MAP AND UNIT DETAILS */}
            <div className="w-full flex flex-col md:flex-row gap-6 flex-shrink-0" style={{ height: 'calc(100vh - 140px)', minHeight: '600px' }}>

                {/* LEFT: INTERACTIVE MAP AREA */}
                <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm relative flex flex-col overflow-hidden">

                    {/* TOOLBAR */}
                    <Box className="w-full flex flex-col xl:flex-row justify-between xl:items-center p-6 border-b dark:border-gray-700 z-10 bg-white dark:bg-gray-800 shrink-0 gap-4">
                        <div>
                            <Typography variant="h5" className="font-bold text-gray-800 dark:text-gray-100">Floor {floor?.floor_number}</Typography>
                            <Typography variant="body2" className="text-gray-500 dark:text-gray-400">Interactive Zoning Layout</Typography>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Mini Nav Bar for System Types */}
                            <div className="flex flex-wrap items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-lg">
                                {SYSTEM_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleSystemChange(type.id)}
                                        className={`
                                        px-4 py-2 rounded-md text-sm font-bold transition-all duration-200
                                        ${selectedSystem === type.id
                                                ? `${type.color} text-white shadow-md transform scale-105`
                                                : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-white'}
                                    `}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* Supervisor Upload Built-in Toolbar */}
                            {isSupervisor && selectedSystem === 'all' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant={isDrawingZone ? "contained" : "outlined"}
                                        color={isDrawingZone ? "primary" : "inherit"}
                                        startIcon={<FuseSvgIcon size={20}>{isDrawingZone ? "heroicons-outline:check" : "heroicons-outline:pencil"}</FuseSvgIcon>}
                                        onClick={() => {
                                            if (isDrawingZone) {
                                                setIsDrawingZone(false);
                                                setPolygonPoints([]);
                                            } else {
                                                setIsDrawingZone(true);
                                                setSelectedSystem('all'); // Usually draw physical layout, not sys zones
                                            }
                                        }}
                                        className="h-10 dark:text-gray-100 whitespace-nowrap"
                                    >
                                        {isDrawingZone ? 'Cancel Drawing' : 'Draw Zone'}
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={isUploadingPlan ? <CircularProgress size={16} /> : <FuseSvgIcon size={20}>heroicons-outline:upload</FuseSvgIcon>}
                                        disabled={isUploadingPlan}
                                        className="h-10 border-dashed border-2 dark:border-gray-500 dark:text-gray-100 whitespace-nowrap"
                                    >
                                        {isUploadingPlan ? 'Uploading...' : 'Replace Map'}
                                        <input type="file" hidden accept="image/*, .svg" onChange={handleUploadPlan} />
                                    </Button>
                                </div>
                            )}

                            {selectedSystem !== 'all' && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:eye</FuseSvgIcon>}
                                        onClick={() => { setIsOverviewOpen(true); setZoomLevel(1); }}
                                        className="h-10 dark:text-white dark:border-white dark:hover:bg-white/10"
                                    >
                                        Overview
                                    </Button>
                                    
                                    {isSupervisor && (
                                        <Button
                                            variant="outlined"
                                            component="label"
                                            startIcon={isUploadingPlan ? <CircularProgress size={16} /> : <FuseSvgIcon size={20}>heroicons-outline:upload</FuseSvgIcon>}
                                            disabled={isUploadingPlan}
                                            className="h-10 border-dashed border-2 dark:border-gray-500 dark:text-gray-100 whitespace-nowrap"
                                        >
                                            {isUploadingPlan ? 'Uploading...' : `Upload ${selectedSystem.toUpperCase()} Plan`}
                                            <input type="file" hidden accept="image/*, .svg" onChange={handleUploadPlan} />
                                        </Button>
                                    )}

                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsLegendDialogOpen(true)}
                                        className={`h-10 ${SYSTEM_TYPES.find(s => s.id === selectedSystem)?.color || 'bg-blue-600'} hover:opacity-90 font-bold whitespace-nowrap shadow-lg`}
                                    >
                                        Add Icon
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Box>

                    {/* SCROLLABLE MAP CONTAINER */}
                    <div className="flex-1 overflow-auto p-8 bg-gray-50/50 dark:bg-gray-900/50">
                        {/* THE SYNCED WRAPPER: Matches Map Ratio Exactly */}
                        <div
                            className="relative shadow-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 mx-auto"
                            style={{
                                width: '100%',
                                maxWidth: `${mapDims.width}px`,
                                aspectRatio: `${mapDims.width} / ${mapDims.height}`,
                            }}
                        >
                            {/* 1. IMAGE LAYER */}
                            <img
                                src={backgroundMap}
                                alt="Background"
                                onLoad={handleImageLoad}
                                className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
                            />

                            {/* 2. SVG INTERACTION LAYER */}
                            <svg
                                viewBox={`0 0 ${mapDims.width} ${mapDims.height}`}
                                className={`absolute inset-0 w-full h-full z-10 ${isDrawingZone ? 'cursor-crosshair' : ''}`}
                                preserveAspectRatio="none"
                                onClick={handleSvgClick}
                                onMouseMove={handleSvgMouseMove}
                                onDoubleClick={handleSvgDoubleClick}
                            >
                                <defs>
                                    <style>{`
                                    @keyframes pendingPulse {
                                        0%, 100% {
                                            fill: rgba(239, 68, 68, 0.18);
                                            stroke: #ef4444;
                                            filter: drop-shadow(0 0 3px rgba(239,68,68,0.4));
                                        }
                                        50% {
                                            fill: rgba(239, 68, 68, 0.55);
                                            stroke: #dc2626;
                                            filter: drop-shadow(0 0 10px rgba(239,68,68,0.85));
                                        }
                                    }
                                    .pending-pulse {
                                        animation: pendingPulse 1.6s ease-in-out infinite;
                                        stroke-width: 2.5;
                                    }
                                `}</style>
                                </defs>

                                {zonesDisplay.map((zone) => {
                                    const { d, transform } = getZonePathData(zone);
                                    if (!d) return null;

                                    const isHovered = hoveredZoneId === zone.id;
                                    const isSelected = selectedZone?.id === zone.id;

                                    // Check if any object in this zone has a Pending status
                                    const hasPendingObjects = zone.object_components?.some(
                                        (obj) => obj.latest_status?.current_status === 'Pending' && (selectedSystem === 'all' || obj.system_type === selectedSystem)
                                    );

                                    // Pending zones get the CSS animation — hover/select override via inline style
                                    const isPulsingRed = hasPendingObjects && !isSelected && !isHovered;

                                    let fill = 'transparent';
                                    let stroke = 'transparent';
                                    let strokeWidth = 0;
                                    let filter = 'none';

                                    if (isSelected) {
                                        fill = 'rgba(37, 99, 235, 0.4)';
                                        stroke = '#1e40af';
                                        strokeWidth = 3;
                                        filter = 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.6))';
                                    } else if (isHovered) {
                                        fill = 'rgba(59, 130, 246, 0.25)';
                                        stroke = '#3b82f6';
                                        strokeWidth = 2;
                                        filter = 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.4))';
                                    } else if (!isPulsingRed) {
                                        // Normal state without animation
                                        stroke = 'rgba(156, 163, 175, 0.4)'; // Subtle gray
                                        strokeWidth = 1;
                                    }

                                    return (
                                        <path
                                            key={zone.id}
                                            d={d}
                                            transform={transform}
                                            className={`transition-all duration-300 ${isPulsingRed ? 'pending-pulse' : 'cursor-pointer'}`}
                                            onClick={() => {
                                                if (isDrawingZone) return;
                                                setSelectedZone(zone);
                                                setIsOverviewOpen(true);
                                                setZoomLevel(1);
                                            }}
                                            onMouseOver={() => setHoveredZoneId(zone.id)}
                                            style={{
                                                // Only apply inline fill/stroke when NOT in pulse mode (inline overrides CSS animation)
                                                ...(isPulsingRed ? {} : { fill, stroke, strokeWidth, filter }),
                                            }}
                                            onMouseOut={() => setHoveredZoneId(null)}
                                        />
                                    );
                                })}

                                {/* DRAWING ZONE PREVIEW */}
                                {isDrawingZone && polygonPoints.length > 0 && (
                                    <>
                                        <polygon
                                            points={polygonPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                            fill="rgba(37, 99, 235, 0.2)"
                                            stroke="#3b82f6"
                                            strokeWidth="2"
                                        />
                                        {mousePos && (
                                            <line
                                                x1={polygonPoints[polygonPoints.length - 1].x}
                                                y1={polygonPoints[polygonPoints.length - 1].y}
                                                x2={mousePos.x}
                                                y2={mousePos.y}
                                                stroke="#3b82f6"
                                                strokeWidth="2"
                                                strokeDasharray="4 4"
                                            />
                                        )}
                                        {polygonPoints.map((p, i) => (
                                            <circle key={i} cx={p.x} cy={p.y} r={5 / zoomLevel} fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                                        ))}
                                    </>
                                )}
                            </svg>

                            {/* 3. HARDWARE RENDERING LAYER */}
                        </div>
                    </div>
                </div>

                {/* RIGHT: DETAILS SIDEBAR */}
                <div className="w-full md:w-96 flex-shrink-0 flex flex-col min-h-0">
                    <Paper className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 flex-1 flex flex-col h-full overflow-hidden">
                        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
                            <Typography variant="h6" className="font-bold text-gray-800 dark:text-gray-100">
                                {isDrawingZone ? 'Draw New Zone' : selectedZone ? (selectedZone.alias_id || selectedZone.name) : 'Unit Details'}
                            </Typography>
                            {selectedZone && isSupervisor && !isDrawingZone && (
                                <Tooltip title="Delete Zone">
                                    <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete zone "${selectedZone.name}"?`)) {
                                                deleteZoneMutation.mutate(selectedZone.id);
                                            }
                                        }}
                                        disabled={deleteZoneMutation.isPending}
                                    >
                                        {deleteZoneMutation.isPending ? <CircularProgress size={20} /> : <DeleteIcon />}
                                    </IconButton>
                                </Tooltip>
                            )}
                        </div>

                        {isDrawingZone ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <FuseSvgIcon size={48} className="text-blue-500 mb-4 animate-bounce">heroicons-outline:pencil-alt</FuseSvgIcon>
                                <Typography variant="h6" className="text-blue-700 dark:text-blue-400 font-bold mb-2">Drawing Mode Active</Typography>
                                <Typography variant="body2" className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    • Click corners on the map to outline the room.<br /><br />
                                    • Double-click anywhere to finish the shape.
                                </Typography>
                            </div>
                        ) : selectedZone ? (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex flex-col gap-4 shrink-0">
                                    <DetailItem label="Unit Type" value={selectedZone.name} highlight />
                                    <DetailItem label="Total Area" value={selectedZone.area} />
                                    <DetailItem label="Position" value={selectedZone.location_desc} />
                                </div>

                                {selectedSystem !== 'all' && (
                                    <div className="mt-6 w-full flex-1 flex flex-col min-h-0">
                                        <Typography variant="caption" className="font-bold uppercase tracking-wider mb-2 border-b dark:border-gray-700 pb-2 shrink-0">
                                            {selectedSystem.toUpperCase()} Objects in {selectedZone.name}
                                        </Typography>

                                        {isLoadingObjects ? (
                                            <div className="flex justify-center p-4"><CircularProgress size={24} /></div>
                                        ) : objects && objects.length > 0 ? (
                                            <div className="space-y-3 mt-2 flex-1 overflow-y-auto pr-2 pb-2 mr-[-4px]">
                                                {objects.map((obj) => {
                                                    const status = obj.latest_status?.current_status || 'Pending';
                                                    let statusColorClass = 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
                                                    if (status === 'Completed') statusColorClass = 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
                                                    else if (status === 'Pending') statusColorClass = 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
                                                    else if (status === 'Fix2') statusColorClass = 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';

                                                    return (
                                                        <Paper key={obj.id} elevation={0} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm w-full box-border transition-colors hover:border-gray-300 dark:hover:border-gray-600">
                                                            <div className="flex justify-between items-start mb-1 gap-2">
                                                                <Typography variant="body2" className="font-bold text-gray-800 dark:text-gray-100 break-words">{obj.item_alias_id}</Typography>
                                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColorClass}`}>
                                                                    {status}
                                                                </span>
                                                            </div>
                                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block break-words">{obj.item_name}</Typography>

                                                            {obj.gridline_coords && (
                                                                <Typography variant="caption" className="text-gray-400 dark:text-gray-500 mt-2 block break-words">
                                                                    <span className="font-medium text-gray-500 dark:text-gray-400">Grid: </span>{obj.gridline_coords}
                                                                </Typography>
                                                            )}
                                                        </Paper>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <Typography variant="body2" className="text-gray-400 italic mt-4 text-center">
                                                No objects found in this zone for {selectedSystem.toUpperCase()}.
                                            </Typography>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                <FuseSvgIcon size={80} color="disabled">heroicons-outline:cursor-click</FuseSvgIcon>
                                <Typography className="mt-4">Click a zone to view details</Typography>
                            </div>
                        )}
                    </Paper>
                </div>
            </div>

            {/* BOTTOM ROW: ANALYTICS TABS */}
            <div className="w-full shrink-0">
                <Box className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden relative">
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }} className="bg-gray-50/50 dark:bg-gray-900/50">
                        <Tabs
                            value={activeBottomTab}
                            onChange={(_, newValue) => setActiveBottomTab(newValue)}
                            className="px-4 pt-2"
                        >
                            <Tab label="BILL OF QUANTITIES" className="font-bold tracking-widest text-xs" />
                            <Tab label="CABLE RUNS" className="font-bold tracking-widest text-xs" />
                        </Tabs>
                    </Box>

                    {activeBottomTab === 0 ? (
                        <BoqApp floorId={Number(floorId)} externalSystemFilter={selectedSystem} />
                    ) : (
                        <CableTopology floorId={Number(floorId)} externalSystemFilter={selectedSystem === 'all' ? 'All Types' : selectedSystem} />
                    )}
                </Box>
            </div>

            <DetailedPlanView
                isOpen={isOverviewOpen}
                onClose={() => setIsOverviewOpen(false)}
                floorId={floorId}
                zoneId={selectedZone?.id || null}
                zones={floor?.zones || []}
                selectedSystem={selectedSystem}
                overviewImage={overviewImage}
            />

            <LegendDialog 
                open={isLegendDialogOpen} 
                onClose={() => setIsLegendDialogOpen(false)} 
                systemType={selectedSystem}
                buildings={buildings}
                currentFloorId={Number(floorId)}
            />

            {/* SAVE DRAWN ZONE DIALOG */}
            <Dialog open={newZoneOpen} onClose={() => !createZoneMutation.isPending && setNewZoneOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Save New Zone</DialogTitle>
                <DialogContent dividers className="space-y-4 pt-4">
                    <TextField
                        label="Alias ID (e.g., ZN-01)"
                        fullWidth
                        size="small"
                        required
                        value={newZoneDetails.alias_id}
                        onChange={(e) => setNewZoneDetails({ ...newZoneDetails, alias_id: e.target.value })}
                        disabled={createZoneMutation.isPending}
                    />
                    <TextField
                        label="Zone Name (e.g., Server Room)"
                        fullWidth
                        size="small"
                        required
                        value={newZoneDetails.name}
                        onChange={(e) => setNewZoneDetails({ ...newZoneDetails, name: e.target.value })}
                        disabled={createZoneMutation.isPending}
                    />
                    <TextField
                        label="Area (e.g., 200 sqm)"
                        fullWidth
                        size="small"
                        value={newZoneDetails.area}
                        onChange={(e) => setNewZoneDetails({ ...newZoneDetails, area: e.target.value })}
                        disabled={createZoneMutation.isPending}
                    />
                    <TextField
                        label="Description / Location Notes"
                        fullWidth
                        size="small"
                        multiline
                        rows={3}
                        value={newZoneDetails.location_desc}
                        onChange={(e) => setNewZoneDetails({ ...newZoneDetails, location_desc: e.target.value })}
                        disabled={createZoneMutation.isPending}
                    />
                    <TextField
                        label="Generated SVG Path code"
                        fullWidth
                        size="small"
                        multiline
                        rows={3}
                        value={newZoneSvgPath}
                        onChange={(e) => setNewZoneSvgPath(e.target.value)}
                        disabled={createZoneMutation.isPending}
                        helperText="You can manually tweak the raw coordinates or styles before saving."
                        InputProps={{
                            style: { fontFamily: 'monospace', fontSize: '12px' }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewZoneOpen(false)} color="inherit" disabled={createZoneMutation.isPending}>Cancel</Button>
                    <Button
                        onClick={submitNewZone}
                        color="primary"
                        variant="contained"
                        disabled={!newZoneDetails.alias_id || !newZoneDetails.name || !newZoneSvgPath || createZoneMutation.isPending}
                    >
                        {createZoneMutation.isPending ? 'Saving...' : 'Save Zone Outline'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// Simple reusable component for the sidebar data
const DetailItem = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div>
        <Typography variant="caption" className="text-gray-400 dark:text-gray-500 uppercase font-bold tracking-tighter">{label}</Typography>
        <Typography variant="body1" className={`font-medium ${highlight ? 'text-blue-600 dark:text-blue-400 text-lg' : 'text-gray-700 dark:text-gray-300'}`}>
            {value || 'N/A'}
        </Typography>
    </div>
);

export default FloorView;