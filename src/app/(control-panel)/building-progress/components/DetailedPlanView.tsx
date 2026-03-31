import React, { FC, useState, useRef, MouseEvent, useEffect, useMemo } from 'react';
import { useProject } from '../../../../context/ProjectContext';
import { Dialog, Box, Typography, IconButton, Tooltip, CircularProgress, Button, Paper, TextField, MenuItem, FormControl, InputLabel, Select, Slider, Popover, Chip, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CropFreeIcon from '@mui/icons-material/CropFree';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RoomLocationIcon from '@mui/icons-material/LocationOn';
import PolylineIcon from '@mui/icons-material/ShowChart';
import PolygonIcon from '@mui/icons-material/Category';
import Crop169Icon from '@mui/icons-material/Crop169';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAnnotations, createAnnotation, fetchObjects, createObject, fetchLegends, fetchFloorDetails, Zone, Legend, updateObjectDetails, updateObjectStatus, deleteObject, useAllObjects, useBuildings } from '../buildingApi';
import { Autocomplete } from '@mui/material';
import useUser from '@auth/useUser';
import { DetailedPlanPopover } from './DetailedPlanPopover';
import { DetailedPlanDeleteDialog } from './DetailedPlanDeleteDialog';
import { DetailedPlanSidebar } from './DetailedPlanSidebar';
import { CsvItem, updateCsvItemStatus } from './boqCsvApi';

interface DetailedPlanViewProps {
    isOpen: boolean;
    onClose: () => void;
    floorId: string;
    zoneId: number | null;
    zones: Zone[];
    selectedSystem: string;
    overviewImage: string | null;
}

const DetailedPlanView: FC<DetailedPlanViewProps> = ({ isOpen, onClose, floorId, zoneId, zones, selectedSystem, overviewImage }) => {
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();
    const { data: user } = useUser();
    const isSupervisor = Array.isArray(user?.role) ? user.role.includes('supervisor') : user?.role === 'supervisor';

    // Zoom & Pan State
    const [zoomLevel, setZoomLevel] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [imgSize, setImgSize] = useState({ width: 1000, height: 1000 });

    // Drawing UI State
    const [selectedLegend, setSelectedLegend] = useState<Legend | null>(null);
    const drawMode = (selectedLegend?.shape_type as 'point' | 'polyline' | 'polygon' | 'cloud' | 'none') || 'none';
    const [tempPoints, setTempPoints] = useState<{ x: number, y: number }[]>([]);
    const [cloudScaleX, setCloudScaleX] = useState<number>(1);
    const [cloudScaleY, setCloudScaleY] = useState<number>(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentZoneId, setCurrentZoneId] = useState<number | null>(zoneId);

    // Edit Object State
    const [isEditingObject, setIsEditingObject] = useState(false);
    const [relocatingObjectId, setRelocatingObjectId] = useState<number | null>(null);
    const [relocatingPointIndex, setRelocatingPointIndex] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});

    useEffect(() => {
        if (isOpen) {
            setCurrentZoneId(zoneId);
        }
    }, [zoneId, isOpen]);

    // Popover state
    const [popoverAnchor, setPopoverAnchor] = useState<{ top: number, left: number } | null>(null);
    const [selectedObjectData, setSelectedObjectData] = useState<any>(null);

    // Cross-zone navigation: when user clicks "View Object" on a different zone,
    // we switch the zone, wait for objects to load, then open the popover
    const [pendingNavigationObject, setPendingNavigationObject] = useState<any>(null);
    const [isNavigatingToZone, setIsNavigatingToZone] = useState(false);

    const handleNavigateToObject = (targetObject: any) => {
        const targetZoneId = targetObject?.zone_id ?? targetObject?.zone?.id ?? null;
        if (!targetZoneId) {
            // Same zone or zone unknown — just open the popover with data
            setSelectedObjectData(targetObject);
            // Centre the popover in the viewport
            setPopoverAnchor({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 180 });
            return;
        }

        if (targetZoneId === currentZoneId) {
            // Already on correct zone — just open popover
            setSelectedObjectData(targetObject);
            setPopoverAnchor({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 180 });
            return;
        }

        // Different zone: close current popover, switch zone, and schedule opening
        setPopoverAnchor(null);
        setSelectedObjectData(null);
        setPendingNavigationObject(targetObject);
        setIsNavigatingToZone(true);
        setCurrentZoneId(targetZoneId);
    };

    const handleObjectClick = (e: MouseEvent<SVGElement>, objData: any) => {
        e.stopPropagation();
        if (drawMode !== 'none') return;
        setPopoverAnchor({ top: e.clientY, left: e.clientX });
        setSelectedObjectData(objData);
    };

    const handleClosePopover = () => {
        setPopoverAnchor(null);
        setSelectedObjectData(null);
        setIsEditingObject(false);
        setRelocatingPointIndex(null);
    };

    // Form inputs
    const [formData, setFormData] = useState({
        item_alias_id: '',
        item_name: '',
        cabling_type: '',
        gridline_coords: '',
        status: 'Fix1',
        remarks: '',
        rotation: 0,
        status_image: null as File | null
    });

    // CSV Drag and Drop State
    const [csvItems, setCsvItems] = useState<CsvItem[]>([]);
    const draggedCsvItemRef = useRef<CsvItem | null>(null);
    const activeCsvItemRef = useRef<CsvItem | null>(null);

    const handleCsvDragStart = (item: CsvItem) => {
        draggedCsvItemRef.current = item;
    };

    // Refs for drag calculations
    const dragInfo = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });

    const { data: floorData } = useQuery({
        queryKey: ['floor', floorId, activeProjectId],
        queryFn: () => fetchFloorDetails(floorId as string),
        enabled: isOpen && !!floorId,
    });

    const { data: annotations, isLoading: isAnnotationsLoading } = useQuery({
        queryKey: ['annotations', floorId, selectedSystem, activeProjectId],
        queryFn: () => fetchAnnotations(Number(floorId), selectedSystem),
        enabled: isOpen && selectedSystem !== 'all',
    });

    const { data: objects, isLoading: isObjectsLoading } = useQuery({
        queryKey: ['objects', currentZoneId, selectedSystem, activeProjectId],
        queryFn: () => currentZoneId ? fetchObjects(currentZoneId, selectedSystem) : Promise.resolve([]),
        enabled: isOpen && !!currentZoneId && selectedSystem !== 'all',
    });

    // Fetch ALL objects across all zones (for cross-zone target linking, e.g. Riser on a different zone)
    const { data: allObjectsForLinking } = useAllObjects();

    // Cross-zone navigation resolver: once new zone's objects finish loading,
    // auto-open the popover for the pending navigation target
    useEffect(() => {
        if (!pendingNavigationObject || isObjectsLoading || !objects) return;
        const target = objects.find((o: any) => o.id === pendingNavigationObject.id) || pendingNavigationObject;
        setSelectedObjectData(target);
        // Centre the popover in the viewport so it's visible regardless of scroll position
        setPopoverAnchor({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 180 });
        setPendingNavigationObject(null);
        setIsNavigatingToZone(false);
    }, [objects, isObjectsLoading, pendingNavigationObject]);
    const { data: buildings = [] } = useBuildings();
    const [legendFloorFilter, setLegendFloorFilter] = useState<string | 'all'>('all');
    const [legendCategory, setLegendCategory] = useState<'all' | 'icon' | 'cloud'>('all');

    const allFloorOptions = useMemo(() => {
        const floorList = buildings.flatMap(b => (b.floors || []).map(f => ({
            id: String(f.id),
            label: b.name ? `${b.name} - ${f.floor_number}` : `Floor ${f.floor_number}`
        })));
        return [{ id: 'all', label: 'All Floors' }, ...floorList];
    }, [buildings]);

    const { data: legends, isLoading: isLegendsLoading } = useQuery({
        queryKey: ['legends', selectedSystem, activeProjectId],
        queryFn: () => fetchLegends(selectedSystem),
        enabled: isOpen && selectedSystem !== 'all',
    });

    const filteredLegends = useMemo(() => {
        if (!legends) return [];
        let filtered = legends;

        // 1. Filter by Shape Category (Icon vs Cloud)
        if (legendCategory === 'icon') {
            filtered = filtered.filter(l => l.shape_type !== 'cloud');
        } else if (legendCategory === 'cloud') {
            filtered = filtered.filter(l => l.shape_type === 'cloud');
        }

        // 1.5. Inject RISER & SERVER globally if missing (User request)
        const riserIcon = `
            <g>
                <rect x="-25" y="-12" width="50" height="24" rx="4" fill="purple" fill-opacity="0.3" stroke="purple" stroke-width="2"/>
                <text x="0" y="4" font-family="Arial" font-size="10" font-weight="bold" fill="purple" text-anchor="middle">RISER</text>
            </g>
        `;
        const serverIcon = `
            <g>
                <rect x="-25" y="-12" width="50" height="24" rx="4" fill="navy" fill-opacity="0.3" stroke="navy" stroke-width="2"/>
                <text x="0" y="4" font-family="Arial" font-size="10" font-weight="bold" fill="navy" text-anchor="middle">SERVER</text>
            </g>
        `;

        const hasRiser = filtered.some(l => l.name === 'RISER');
        if (!hasRiser && selectedSystem !== 'all') {
            filtered.push({
                id: 9999, // Mock ID
                system_type: selectedSystem,
                name: 'RISER',
                shape_type: 'point',
                icon_svg: riserIcon,
                color: 'purple',
                border_color: 'black',
                border_style: 'solid',
                border_width: '2px',
                fill_color: 'rgba(128,0,128,0.3)',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                unit: 'pcs',
                unit_cost: '0.00'
            } as Legend);
        }

        const hasServer = filtered.some(l => l.name === 'SERVER');
        // The SERVER injection logic was tied to the old 'floor-g' filter.
        // If a dynamic floor filter is used, this specific injection might need re-evaluation
        // based on new requirements for 'SERVER' visibility. For now, it's removed as per instruction.
        // const isGroundFloor = legendFloorFilter === 'floor-g';
        // if (!hasServer && isGroundFloor && selectedSystem !== 'all') {
        //     filtered.push({
        //         id: 9998, // Mock ID
        //         system_type: selectedSystem,
        //         name: 'SERVER',
        //         shape_type: 'point',
        //         icon_svg: serverIcon,
        //         color: 'navy',
        //         border_color: 'black',
        //         border_style: 'solid',
        //         border_width: '2px',
        //         fill_color: 'rgba(0,0,128,0.3)',
        //         created_at: new Date().toISOString(),
        //         updated_at: new Date().toISOString(),
        //         unit: 'pcs',
        //         unit_cost: '0.00'
        //     } as Legend);
        // }

        // Force icons for RISER and SERVER
        filtered = filtered.map(l => {
            if (l.name === 'RISER') return { ...l, shape_type: 'point' as const, icon_svg: riserIcon };
            if (l.name === 'SERVER') return { ...l, shape_type: 'point' as const, icon_svg: serverIcon };
            return l;
        });
        // 2. Filter by Floor Availability
        if (legendFloorFilter !== 'all') {
            filtered = filtered.filter(l => {
                const name = l.name.trim().toUpperCase();
                if (name === 'RISER') return true;
                if (!l.floors || l.floors.length === 0) return true;
                return l.floors.some(f => String(f.id) === String(legendFloorFilter));
            });
        }

        return filtered;
    }, [legends, legendCategory, legendFloorFilter, floorData?.id]);

    const visibleObjects = useMemo(() => {
        if (!objects) return [];
        if (legendCategory === 'all') return objects;
        if (legendCategory === 'icon') return objects.filter((o: any) => o.shape_type !== 'cloud');
        if (legendCategory === 'cloud') return objects.filter((o: any) => o.shape_type === 'cloud');
        return objects;
    }, [objects, legendCategory]);

    const objectMutation = useMutation({
        mutationFn: createObject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['objects', currentZoneId, selectedSystem, activeProjectId] });
            queryClient.invalidateQueries({ queryKey: ['floor', floorId, activeProjectId] });
            queryClient.invalidateQueries({ queryKey: ['boq-summary'] });
            // Note: handleCancelDrawing() is intentionally removed here. 
            // It is now called locally inside handleSave's onSuccess so we can process activeCsvItem first.
        }
    });

    const updateCsvItemStatusMutation = useMutation({
        mutationFn: ({ itemId, status }: { itemId: number, status: 'assigned' | 'unassigned' }) => updateCsvItemStatus(itemId, status),
        onSuccess: () => {
            // Optional: Invalidate CSV uploads to refetch updated state from backend
            queryClient.invalidateQueries({ queryKey: ['boq-csv-uploads', activeProjectId] });
        }
    });

    const annotationMutation = useMutation({
        mutationFn: createAnnotation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['annotations', floorId, selectedSystem, activeProjectId] });
            handleCancelDrawing();
        }
    });

    const updateObjectMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => updateObjectDetails(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['objects', currentZoneId, selectedSystem, activeProjectId] });
            queryClient.invalidateQueries({ queryKey: ['floor', floorId, activeProjectId] });
            queryClient.invalidateQueries({ queryKey: ['boq-summary'] });
            handleClosePopover();
            setRelocatingObjectId(null);
            setRelocatingPointIndex(null);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => updateObjectStatus(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['objects', currentZoneId, selectedSystem, activeProjectId] });
            queryClient.invalidateQueries({ queryKey: ['floor', floorId, activeProjectId] });
            queryClient.invalidateQueries({ queryKey: ['boq-summary'] });
        }
    });

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const deleteObjectMutation = useMutation({
        mutationFn: (id: number) => deleteObject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['objects', currentZoneId, selectedSystem, activeProjectId] });
            queryClient.invalidateQueries({ queryKey: ['floor', floorId, activeProjectId] });
            queryClient.invalidateQueries({ queryKey: ['boq-summary'] });
            setConfirmDeleteOpen(false);
            handleClosePopover();
        }
    });

    const handleEditClick = () => {
        setEditFormData({
            item_alias_id: selectedObjectData.item_alias_id || '',
            cabling_type: selectedObjectData.cabling_type || '',
            gridline_coords: selectedObjectData.gridline_coords || '',
            rotation: selectedObjectData.rotation || 0,
            remarks: selectedObjectData.latest_status?.remarks || '',
            status: selectedObjectData.latest_status?.current_status || 'Fix1',
            status_image: null
        });
        setIsEditingObject(true);
    };

    const handleSaveEdit = () => {
        updateObjectMutation.mutate({
            id: selectedObjectData.id,
            data: {
                item_alias_id: editFormData.item_alias_id,
                cabling_type: editFormData.cabling_type,
                gridline_coords: editFormData.gridline_coords,
                rotation: editFormData.rotation
            }
        });

        if (editFormData.status !== selectedObjectData.latest_status?.current_status || editFormData.status_image || editFormData.remarks !== selectedObjectData.latest_status?.remarks) {
            const formDataPayload = new FormData();
            formDataPayload.append('status', editFormData.status);
            if (editFormData.remarks) {
                formDataPayload.append('remarks', editFormData.remarks);
            }
            if (editFormData.status_image) {
                formDataPayload.append('image', editFormData.status_image);
            }
            updateStatusMutation.mutate({
                id: selectedObjectData.id,
                data: formDataPayload
            });
        }
    };

    const handleMoveClick = () => {
        setRelocatingObjectId(selectedObjectData.id);
        handleClosePopover();
    };

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 5));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.1));
    const handleResetZoom = () => { setZoomLevel(1); setPan({ x: 0, y: 0 }); };

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || e.button !== 0) return;
        if (relocatingPointIndex !== null) return;

        // --- Cloud interaction detection via coordinate math (bypasses SVG pointer-events) ---
        if (imageRef.current) {
            const rect = imageRef.current.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / rect.width;
            const my = (e.clientY - rect.top) / rect.height;

            // 1. Cloud drag-draw (drawMode=cloud, no temp cloud yet) — defines rect by dragging
            if (drawMode === 'cloud' && tempPoints.length === 0) {
                e.preventDefault();
                suppressNextImageClickRef.current = true;
                cloudDrawStartRef.current = { x: mx, y: my };
                isDrawingCloudRef.current = true;
                // Reset and hide the preview SVG rect (it will be shown on first mousemove)
                if (previewRectSvgRef.current) {
                    previewRectSvgRef.current.setAttribute('width', '0');
                    previewRectSvgRef.current.setAttribute('height', '0');
                    previewRectSvgRef.current.style.display = 'none';
                }
                return;
            }

            // 2. Temp cloud — drag to move or resize corner handle
            if (drawMode === 'cloud' && tempPoints.length > 0) {
                const tp = tempPoints[0];
                const hw = (50 * cloudScaleX) / imgSize.width;
                const hh = (50 * cloudScaleY) / imgSize.height;
                // Check resize handle (bottom-right corner)
                const hx = tp.x + hw;
                const hy = tp.y + hh;
                const handleRadiusNorm = 12 / imgSize.width;
                if (Math.hypot(mx - hx, my - hy) <= handleRadiusNorm) {
                    e.preventDefault();
                    suppressNextImageClickRef.current = true;
                    resizeStartScaleRef.current = { scaleX: cloudScaleX, scaleY: cloudScaleY };
                    resizeStartMouseRef.current = { x: e.clientX, y: e.clientY };
                    setResizingCloudId(-1); // -1 = temp cloud
                    return;
                }
                // Check cloud body
                if (Math.abs(mx - tp.x) <= hw && Math.abs(my - tp.y) <= hh) {
                    e.preventDefault();
                    suppressNextImageClickRef.current = true;
                    cloudDragInfo.current = { startX: e.clientX, startY: e.clientY, initialCloudX: tp.x, initialCloudY: tp.y };
                    setIsDraggingCloud(true);
                    return;
                }
                // Click outside temp cloud while in cloud mode — allow image click to re-place it
                return;
            }

            // Placed clouds in normal mode are fixed — drag/resize only via Edit Detail
        }
        // ---------------------------------------------------------------------------------

        if (drawMode !== 'none') return; // other drawing modes — no pan

        setIsDragging(true);
        dragInfo.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
        e.preventDefault();
    };

    const [isDraggingCloud, setIsDraggingCloud] = useState(false);
    const cloudDragInfo = useRef({ startX: 0, startY: 0, initialCloudX: 0, initialCloudY: 0 });
    const suppressNextImageClickRef = useRef(false);
    // Drag-draw: use refs + direct SVG DOM updates to avoid re-renders during mousemove
    const cloudDrawStartRef = useRef({ x: 0, y: 0 });
    const isDrawingCloudRef = useRef(false);
    const previewRectSvgRef = useRef<SVGRectElement | null>(null);

    // Effect: drag-to-draw cloud rectangle (no re-renders during drag)
    useEffect(() => {
        if (!isOpen || drawMode !== 'cloud') return;

        const handleMouseMove = (e: globalThis.MouseEvent) => {
            if (!isDrawingCloudRef.current || !imageRef.current || !previewRectSvgRef.current) return;
            const rect = imageRef.current.getBoundingClientRect();
            const mx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const my = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            const x1 = cloudDrawStartRef.current.x;
            const y1 = cloudDrawStartRef.current.y;
            const svgW = imgSize.width;
            const svgH = imgSize.height;
            previewRectSvgRef.current.setAttribute('x', String(Math.min(x1, mx) * svgW));
            previewRectSvgRef.current.setAttribute('y', String(Math.min(y1, my) * svgH));
            previewRectSvgRef.current.setAttribute('width', String(Math.abs(mx - x1) * svgW));
            previewRectSvgRef.current.setAttribute('height', String(Math.abs(my - y1) * svgH));
            previewRectSvgRef.current.style.display = 'block';
        };

        const handleMouseUp = (e: globalThis.MouseEvent) => {
            if (!isDrawingCloudRef.current || !imageRef.current) { isDrawingCloudRef.current = false; return; }
            isDrawingCloudRef.current = false;
            if (previewRectSvgRef.current) previewRectSvgRef.current.style.display = 'none';

            const rect = imageRef.current.getBoundingClientRect();
            const x2 = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const y2 = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            const x1 = cloudDrawStartRef.current.x;
            const y1 = cloudDrawStartRef.current.y;
            const widthSVG = Math.abs(x2 - x1) * imgSize.width;
            const heightSVG = Math.abs(y2 - y1) * imgSize.height;
            if (widthSVG > 10 && heightSVG > 10) {
                setTempPoints([{ x: (x1 + x2) / 2, y: (y1 + y2) / 2 }]);
                setCloudScaleX(Math.max(0.05, widthSVG / 100));
                setCloudScaleY(Math.max(0.05, heightSVG / 100));
                setIsFormOpen(true);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            isDrawingCloudRef.current = false;
        };
    }, [isOpen, drawMode, imgSize]);

    const handleCloudMouseDown = (e: React.MouseEvent<SVGGElement>) => {
        if (drawMode !== 'cloud' || tempPoints.length === 0) return;
        e.stopPropagation();
        setIsDraggingCloud(true);
        cloudDragInfo.current = { startX: e.clientX, startY: e.clientY, initialCloudX: tempPoints[0].x, initialCloudY: tempPoints[0].y };
    };

    // Ref to the SVG group that shows the temp cloud — used for direct DOM update during drag
    const tempCloudSvgRef = useRef<SVGGElement | null>(null);

    useEffect(() => {
        if (!isDraggingCloud) return;
        const handleCloudMouseMove = (e: globalThis.MouseEvent) => {
            if (!imageRef.current || !tempCloudSvgRef.current) return;
            const rect = imageRef.current.getBoundingClientRect();
            const dx = (e.clientX - cloudDragInfo.current.startX) / rect.width;
            const dy = (e.clientY - cloudDragInfo.current.startY) / rect.height;
            const nx = cloudDragInfo.current.initialCloudX + dx;
            const ny = cloudDragInfo.current.initialCloudY + dy;
            // Update SVG directly — no re-render
            tempCloudSvgRef.current.setAttribute('transform', `translate(${nx * imgSize.width} ${ny * imgSize.height})`);
        };
        const handleCloudMouseUp = (e: globalThis.MouseEvent) => {
            if (imageRef.current) {
                const rect = imageRef.current.getBoundingClientRect();
                const dx = (e.clientX - cloudDragInfo.current.startX) / rect.width;
                const dy = (e.clientY - cloudDragInfo.current.startY) / rect.height;
                setTempPoints([{
                    x: cloudDragInfo.current.initialCloudX + dx,
                    y: cloudDragInfo.current.initialCloudY + dy
                }]);
            }
            setIsDraggingCloud(false);
        };
        document.addEventListener('mousemove', handleCloudMouseMove);
        document.addEventListener('mouseup', handleCloudMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleCloudMouseMove);
            document.removeEventListener('mouseup', handleCloudMouseUp);
        };
    }, [isDraggingCloud, imgSize]);

    // Handle Cloud Drag Resizing
    const [resizingCloudId, setResizingCloudId] = useState<number | null>(null);
    const [previewCloudScale, setPreviewCloudScale] = useState<{ id: number; scaleX: number; scaleY: number } | null>(null);
    // State for dragging placed cloud objects (body drag = move)
    const [draggingCloudObj, setDraggingCloudObj] = useState<{ id: number; startMouseX: number; startMouseY: number; startPosX: number; startPosY: number } | null>(null);
    const [previewCloudPos, setPreviewCloudPos] = useState<{ id: number; posX: number; posY: number } | null>(null);
    // Ref to store initial resize scale when resize drag begins
    const resizeStartScaleRef = useRef<{ scaleX: number; scaleY: number }>({ scaleX: 1, scaleY: 1 });
    const resizeStartMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // Stable ref to updateObjectMutation so it never appears in effect deps (mutation object changes every render)
    const updateObjectMutationRef = useRef(updateObjectMutation);
    useEffect(() => { updateObjectMutationRef.current = updateObjectMutation; });

    // Effect: drag-to-move placed cloud objects — disabled (clouds are fixed; move via edit mode)
    // draggingCloudObj is kept for future use but never set in normal mode
    useEffect(() => {
        if (!draggingCloudObj || !imageRef.current) return;
        const handleMouseUp = () => { setDraggingCloudObj(null); };
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [draggingCloudObj]);

    // Effect: resize temp cloud (id=-1) only — placed cloud resize disabled
    useEffect(() => {
        if (resizingCloudId === null || resizingCloudId !== -1 || !imageRef.current) return;

        const handleMouseMove = (e: globalThis.MouseEvent) => {
            if (!imageRef.current) return;
            const rect = imageRef.current.getBoundingClientRect();
            const dxNorm = (e.clientX - resizeStartMouseRef.current.x) / rect.width;
            const dyNorm = (e.clientY - resizeStartMouseRef.current.y) / rect.height;
            const startHalfW = resizeStartScaleRef.current.scaleX * 100 / 2;
            const startHalfH = resizeStartScaleRef.current.scaleY * 100 / 2;
            const newScaleX = Math.max(0.1, (startHalfW + dxNorm * imgSize.width) * 2 / 100);
            const newScaleY = Math.max(0.1, (startHalfH + dyNorm * imgSize.height) * 2 / 100);
            setCloudScaleX(newScaleX);
            setCloudScaleY(newScaleY);
        };

        const handleMouseUp = () => { setResizingCloudId(null); };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingCloudId, imgSize]);

    // Handle Vertex Dragging for Shapes
    const [previewGeometry, setPreviewGeometry] = useState<any[] | null>(null);

    useEffect(() => {
        if (relocatingPointIndex === null || !relocatingObjectId || !imageRef.current) return;

        const objectToMove = objects?.find(o => o.id === relocatingObjectId);
        if (!objectToMove || (objectToMove.shape_type !== 'polygon' && objectToMove.shape_type !== 'polyline')) return;

        const initialGeometry = objectToMove.geometry || [];
        setPreviewGeometry(initialGeometry);

        const handleVertexMouseMove = (e: globalThis.MouseEvent) => {
            if (!imageRef.current) return;
            const rect = imageRef.current.getBoundingClientRect();
            let x = (e.clientX - rect.left) / rect.width;
            let y = (e.clientY - rect.top) / rect.height;

            // Clamp coordinate between 0 and 1
            x = Math.max(0, Math.min(1, x));
            y = Math.max(0, Math.min(1, y));

            setPreviewGeometry(prev => {
                if (!prev) return prev;
                const newGeo = [...prev];
                newGeo[relocatingPointIndex] = { x, y };
                return newGeo;
            });
        };

        const handleVertexMouseUp = (e: globalThis.MouseEvent) => {
            if (!imageRef.current) return;
            const rect = imageRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const finalGeometry = [...initialGeometry];
            finalGeometry[relocatingPointIndex] = {
                x: Math.max(0, Math.min(1, x)),
                y: Math.max(0, Math.min(1, y))
            };

            updateObjectMutation.mutate({
                id: relocatingObjectId,
                data: { geometry: JSON.stringify(finalGeometry) }
            });

            setRelocatingPointIndex(null);
            setPreviewGeometry(null);
        };

        document.addEventListener('mousemove', handleVertexMouseMove);
        document.addEventListener('mouseup', handleVertexMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleVertexMouseMove);
            document.removeEventListener('mouseup', handleVertexMouseUp);
        };
    }, [relocatingPointIndex, relocatingObjectId, objects, imageRef]);

    useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e: globalThis.MouseEvent) => {
            setPan({
                x: dragInfo.current.panX + (e.clientX - dragInfo.current.startX),
                y: dragInfo.current.panY + (e.clientY - dragInfo.current.startY)
            });
        };
        const handleMouseUp = () => setIsDragging(false);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        if (imageRef.current && imageRef.current.complete) {
            setImgSize({ width: imageRef.current.clientWidth, height: imageRef.current.clientHeight });
        }
    }, [overviewImage, isOpen]); // When image changes or modal opens

    const handleImageClick = (e: MouseEvent<HTMLDivElement>) => {
        // Suppress click if it was the end of a cloud drag/resize
        if (suppressNextImageClickRef.current) {
            suppressNextImageClickRef.current = false;
            return;
        }
        if (drawMode === 'none' && !relocatingObjectId) return;
        if (drawMode === 'cloud') return; // cloud is handled entirely via drag-draw in handleMouseDown
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        // Calculate coordinate normalized (0-1) based strictly on image native rect scaled rendering
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        if (relocatingObjectId) {
            const objectToMove = objects?.find(o => o.id === relocatingObjectId);
            if (objectToMove?.shape_type === 'polygon' || objectToMove?.shape_type === 'polyline') {
                // For shapes, map clicks don't blindly relocate the entire object anymore,
                // vertex dragging handles its own logic natively via onMouseDown handlers!
            } else {
                updateObjectMutation.mutate({
                    id: relocatingObjectId,
                    data: { pos_x: x, pos_y: y }
                });
            }
            return;
        }

        if (drawMode === 'point') {
            setTempPoints([{ x, y }]);
            setIsFormOpen(true);
        } else {
            setTempPoints(prev => [...prev, { x, y }]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        if (draggedCsvItemRef.current) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const draggedItem = draggedCsvItemRef.current;
        if (!draggedItem || !imageRef.current) return;

        // Ensure we have a valid zone selected before allowing drop
        if (!currentZoneId) {
            alert("Please select a Target Zone in the sidebar before dropping objects.");
            return;
        }

        const rect = imageRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Verify valid bounds
        if (x < 0 || x > 1 || y < 0 || y > 1) return;

        const matchingLegend = legends?.find(l =>
            l.name === draggedItem.legend_dbn_name ||
            l.name === draggedItem.alias_prefix ||
            (draggedItem.legend_dbn_name && l.name.startsWith(draggedItem.legend_dbn_name))
        );

        if (!matchingLegend) {
            alert(`Error: Legend code '${draggedItem.legend_dbn_name}' not found in the database. Please verify your CSV codes.`);
            return;
        }

        // In individual assignment mode, the Alias ID is exactly the itemId drawn from the CSV
        const generatedAliasId = draggedItem.item_id;

        // Instead of auto-committing, we populate the form and drawing state to let the user review/fill details
        setSelectedLegend(matchingLegend);
        setTempPoints([{ x, y }]);

        setFormData(prev => ({
            ...prev,
            item_alias_id: generatedAliasId,
            item_name: matchingLegend.name,
            shape_type: matchingLegend.shape_type,
            status: 'Fix1' // Default status
        }));

        activeCsvItemRef.current = draggedItem;
        setIsFormOpen(true);

        draggedCsvItemRef.current = null;
    };

    const handleCancelDrawing = () => {
        setSelectedLegend(null);
        setTempPoints([]);
        setIsFormOpen(false);
        activeCsvItemRef.current = null;
        setFormData({ item_alias_id: '', item_name: '', cabling_type: '', gridline_coords: '', status: 'Fix1', remarks: '', rotation: 0, status_image: null });
    };

    const handleFinishDrawingShape = () => {
        if (tempPoints.length > 0) setIsFormOpen(true);
    };

    const handleSave = () => {
        if (!selectedLegend) return;

        if (currentZoneId) {
            const formDataPayload = new FormData();
            formDataPayload.append('zone_id', currentZoneId.toString());
            if (formData.item_alias_id) formDataPayload.append('item_alias_id', formData.item_alias_id);
            formDataPayload.append('item_name', selectedLegend.name);
            formDataPayload.append('system_type', selectedSystem);
            if (formData.cabling_type) formDataPayload.append('cabling_type', formData.cabling_type);
            if (formData.gridline_coords) formDataPayload.append('gridline_coords', formData.gridline_coords);
            formDataPayload.append('pos_x', tempPoints[0].x.toString());
            formDataPayload.append('pos_y', tempPoints[0].y.toString());
            formDataPayload.append('rotation', formData.rotation.toString());
            formDataPayload.append('status', formData.status);
            formDataPayload.append('remarks', formData.remarks);

            if (formData.status_image) {
                formDataPayload.append('status_image', formData.status_image);
            }

            if (drawMode === 'cloud') {
                formDataPayload.append('shape_type', 'cloud');
                const scaleData = { scaleX: cloudScaleX, scaleY: cloudScaleY };
                formDataPayload.append('geometry', JSON.stringify(scaleData));
            } else if (drawMode === 'polyline' || drawMode === 'polygon') {
                formDataPayload.append('shape_type', drawMode);
                formDataPayload.append('geometry', JSON.stringify(tempPoints));
            } else {
                formDataPayload.append('shape_type', 'point');
            }

            const currentCsvItem = activeCsvItemRef.current;

            objectMutation.mutate(formDataPayload, {
                onSuccess: () => {
                    // Update CSV pool status if this was initiated via drag-and-drop
                    if (currentCsvItem && currentCsvItem.id) {
                        updateCsvItemStatusMutation.mutate({ itemId: currentCsvItem.id, status: 'assigned' }, {
                            onSuccess: () => {
                                setCsvItems(prevItems => prevItems.map(item =>
                                    item.id === currentCsvItem.id ? { ...item, status: 'assigned' as const } : item
                                ));
                            }
                        });
                    }

                    // Call handleCancelDrawing AFTER processing the CSV quantity deduction
                    handleCancelDrawing();
                }
            });
        } else if (drawMode === 'polyline' || drawMode === 'polygon') {
            // Fallback for drawing shapes WITHOUT a zone (Annotations)
            annotationMutation.mutate({
                floor_id: Number(floorId),
                zone_id: null,
                system_type: selectedSystem,
                annotation_type: drawMode,
                geometry: tempPoints,
                style: selectedLegend.style || {
                    strokeColor: drawMode === 'polyline' ? '#eab308' : '#3b82f6',
                    strokeWidth: 3,
                    fillColor: drawMode === 'polygon' ? 'rgba(59, 130, 246, 0.4)' : null
                }
            });
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="xl" fullWidth scroll="paper" PaperProps={{ className: "rounded-xl max-h-[95vh] dark:bg-gray-900" }}>
            <div className="flex flex-col bg-gray-50 dark:bg-gray-900">
                {/* Top toolbar row: title, zoom, close */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm z-10">
                    <Typography variant="h6" className="font-bold text-gray-700 dark:text-gray-100">
                        {selectedSystem.toUpperCase()} Detailed Plan
                    </Typography>

                    {/* Role badge for members */}
                    {!isSupervisor && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
                            <PersonIcon sx={{ fontSize: 14 }} className="text-blue-500" />
                            <Chip label="Field Member Mode" size="small" variant="outlined" className="h-5 text-[10px] font-bold border-blue-200 text-blue-600 uppercase" />
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
                            <IconButton size="small" onClick={handleZoomOut} className="dark:text-gray-300"><RemoveIcon fontSize="small" /></IconButton>
                            <Typography variant="caption" className="font-mono px-2 font-bold text-gray-600 dark:text-gray-300">
                                {Math.round(zoomLevel * 100)}%
                            </Typography>
                            <IconButton size="small" onClick={handleZoomIn} className="dark:text-gray-300"><AddIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={handleResetZoom} className="dark:text-gray-300"><RestartAltIcon fontSize="small" /></IconButton>
                        </div>
                        <IconButton onClick={onClose} className="text-gray-400 dark:text-gray-500"><CloseIcon /></IconButton>
                    </div>
                </div>

                {/* Legend row: category filter + scrollable legend buttons */}
                <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Category filter dropdown */}
                        <FormControl size="small" variant="outlined">
                            <Select
                                value={legendCategory}
                                onChange={(e) => { setLegendCategory(e.target.value as 'all' | 'icon' | 'cloud'); setSelectedLegend(null); }}
                                size="small"
                                className="bg-gray-100 dark:bg-gray-700 text-xs shadow-sm"
                                sx={{ '.MuiOutlinedInput-notchedOutline': { border: 'none' }, '.MuiSelect-select': { py: 0.5, px: 1.5, fontSize: '0.75rem', fontWeight: 'bold' } }}
                            >
                                <MenuItem value="all" className="text-xs">All Objects</MenuItem>
                                <MenuItem value="icon" className="text-xs">All Icon</MenuItem>
                                <MenuItem value="cloud" className="text-xs">All Cloud Group</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Floor Availability filter dropdown */}
                        <Autocomplete
                            options={allFloorOptions}
                            getOptionLabel={(option) => option.label || ''}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            value={allFloorOptions.find(o => o.id === legendFloorFilter) || allFloorOptions[0]}
                            onChange={(_, newValue) => { setLegendFloorFilter(newValue?.id || 'all'); setSelectedLegend(null); }}
                            size="small"
                            disableClearable
                            openOnFocus
                            autoHighlight
                            clearOnBlur={false}
                            componentsProps={{
                                popper: {
                                    sx: { zIndex: 10000 } // Ensure it's on top of the dialog (Dialog is ~1300)
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    size="small"
                                    placeholder="Search Floor..."
                                    className="bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm w-56"
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { border: 'none', py: 0, px: 1, fontSize: '0.75rem', fontWeight: 'bold' },
                                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                                    }}
                                />
                            )}
                        />
                    </div>

                    {/* Scrollable legend buttons — full remaining width */}
                    <div
                        className="flex gap-2 items-center overflow-x-auto overflow-y-hidden flex-1 py-1 px-1 custom-scrollbar"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
                    >
                        {isLegendsLoading ? <CircularProgress size={20} /> : (
                            filteredLegends?.map(legend => (
                                <Tooltip key={legend.id} title={legend.name}>
                                    <Button
                                        variant={selectedLegend?.id === legend.id ? 'contained' : 'outlined'}
                                        color="inherit"
                                        size="small"
                                        className={`border-gray-200 dark:border-gray-700 text-xs shadow-sm capitalize px-3 flex-shrink-0 whitespace-nowrap ${selectedLegend?.id === legend.id ? 'bg-blue-600 text-white border-blue-600 dark:border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                        onClick={() => { if (isSupervisor) { setSelectedLegend(legend); setTempPoints([]); } }}
                                        startIcon={
                                            legend.shape_type === 'point' ? <RoomLocationIcon fontSize="small" /> :
                                                legend.shape_type === 'polygon' ? <PolygonIcon fontSize="small" /> :
                                                    legend.shape_type === 'cloud' ? <Crop169Icon fontSize="small" /> :
                                                        <PolylineIcon fontSize="small" />
                                        }
                                    >
                                        {legend.name.split(' ').slice(0, 2).join(' ')}
                                    </Button>
                                </Tooltip>
                            ))
                        )}
                    </div>
                </div>

                <div className="h-[80vh] flex overflow-hidden flex-shrink-0">
                    {/* Map Workspace */}
                    <div
                        ref={containerRef}
                        className={`flex-1 relative overflow-hidden flex items-center justify-center p-8 bg-gray-200 dark:bg-gray-900/80 border-r dark:border-gray-700
                            ${drawMode !== 'none' || relocatingObjectId ? 'cursor-crosshair' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')} select-none`}
                        onMouseDown={handleMouseDown}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onWheel={(e) => {
                            setZoomLevel(prev => Math.min(Math.max(prev + (e.deltaY < 0 ? 0.1 : -0.1), 0.1), 5));
                        }}
                    >
                        {overviewImage || floorData?.bss_plan_image_url || floorData?.pa_plan_image_url || floorData?.telco_plan_image_url ? (
                            <div style={{
                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                                transition: isDragging || drawMode !== 'none' ? 'none' : 'transform 0.1s ease-out',
                                transformOrigin: 'center',
                                position: 'relative'
                            }}>
                                <img
                                    ref={imageRef}
                                    src={(() => {
                                        if (selectedSystem === 'bss' && floorData?.bss_plan_image_url) return floorData.bss_plan_image_url;
                                        if (selectedSystem === 'pa' && floorData?.pa_plan_image_url) return floorData.pa_plan_image_url;
                                        if (selectedSystem === 'telco' && floorData?.telco_plan_image_url) return floorData.telco_plan_image_url;
                                        return overviewImage || '';
                                    })()}
                                    alt="Overview"
                                    className="max-w-none shadow-2xl bg-white rounded-lg select-none"
                                    style={{ display: 'block' }}
                                    draggable={false}
                                    onClick={handleImageClick}
                                    onLoad={(e) => setImgSize({ width: e.currentTarget.clientWidth, height: e.currentTarget.clientHeight })}
                                />

                                <svg
                                    viewBox={`0 0 ${imgSize.width === 0 ? 1000 : imgSize.width} ${imgSize.height === 0 ? 1000 : imgSize.height}`}
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                    style={{ zIndex: 10 }}
                                >
                                    {/* TEMP DRAWING */}
                                    {tempPoints.length > 0 && drawMode !== 'point' && drawMode !== 'cloud' && (
                                        <polyline
                                            points={tempPoints.map(p => `${p.x * imgSize.width},${p.y * imgSize.height}`).join(' ')}
                                            fill={drawMode === 'polygon' ? (selectedLegend?.style?.fillColor || 'rgba(59, 130, 246, 0.4)') : 'none'}
                                            stroke={selectedLegend?.style?.strokeColor || '#3b82f6'}
                                            strokeWidth={(selectedLegend?.style?.strokeWidth || 3) / zoomLevel}
                                            strokeDasharray={selectedLegend?.style?.strokeDasharray !== 'none' ? selectedLegend?.style?.strokeDasharray : undefined}
                                        />
                                    )}
                                    {tempPoints.map((p, i) => (
                                        drawMode !== 'cloud' ? (
                                            <g key={i} transform={`translate(${p.x * imgSize.width} ${p.y * imgSize.height}) scale(${1 / zoomLevel}) rotate(${formData.rotation})`}>
                                                {selectedLegend?.icon_svg ? (
                                                    <g dangerouslySetInnerHTML={{ __html: selectedLegend.icon_svg }} />
                                                ) : (
                                                    <circle cx="0" cy="0" r="4" fill="red" />
                                                )}
                                            </g>
                                        ) : null
                                    ))}

                                    {/* CLOUD: drag-draw preview rect — hidden, updated directly via DOM ref */}
                                    {drawMode === 'cloud' && (
                                        <rect
                                            ref={previewRectSvgRef}
                                            x="0" y="0" width="0" height="0"
                                            fill="rgba(59,130,246,0.15)" stroke="#2563eb"
                                            strokeWidth={2 / zoomLevel} strokeDasharray="6,3"
                                            style={{ display: 'none' }}
                                        />
                                    )}

                                    {/* CLOUD: finalised temp cloud (after drag-draw, awaiting save) */}
                                    {drawMode === 'cloud' && tempPoints.length > 0 && (() => {
                                        const tp = tempPoints[0];
                                        const cx = tp.x * imgSize.width;
                                        const cy = tp.y * imgSize.height;
                                        const hw = 50 * cloudScaleX;
                                        const hh = 50 * cloudScaleY;
                                        return (
                                            <g>
                                                {/* Cloud rectangle */}
                                                <rect
                                                    x={cx - hw} y={cy - hh}
                                                    width={hw * 2} height={hh * 2}
                                                    fill="rgba(59,130,246,0.25)"
                                                    stroke="#2563eb" strokeWidth={2 / zoomLevel}
                                                    style={{ cursor: isDraggingCloud ? 'grabbing' : 'grab' }}
                                                />
                                                {/* Resize handle — bottom-right corner */}
                                                <circle
                                                    cx={cx + hw} cy={cy + hh}
                                                    r={7 / zoomLevel}
                                                    fill="#ffffff" stroke="#2563eb" strokeWidth={2 / zoomLevel}
                                                    style={{ cursor: 'nwse-resize' }}
                                                />
                                            </g>
                                        );
                                    })()}



                                    {/* SAVED ANNOTATIONS */}
                                    {annotations?.map(anno => (
                                        anno.annotation_type === 'polygon' ? (
                                            <polygon
                                                key={anno.id}
                                                points={anno.geometry.map((p: any) => `${p.x * imgSize.width},${p.y * imgSize.height}`).join(' ')}
                                                fill={anno.style?.fillColor || 'rgba(59, 130, 246, 0.4)'}
                                                stroke={anno.style?.strokeColor || '#3b82f6'}
                                                strokeWidth={(anno.style?.strokeWidth || 3) / zoomLevel}
                                                strokeDasharray={anno.style?.strokeDasharray !== 'none' ? anno.style?.strokeDasharray : undefined}
                                                onClick={(e) => handleObjectClick(e, anno)}
                                                className={`transition-all ${drawMode === 'none' && !relocatingObjectId ? 'cursor-pointer hover:opacity-80' : ''}`}
                                                style={{ pointerEvents: drawMode === 'none' && !relocatingObjectId ? 'auto' : 'none' }}
                                            />
                                        ) : (
                                            <g
                                                key={anno.id}
                                                onClick={(e) => handleObjectClick(e, anno)}
                                                className={`transition-all ${drawMode === 'none' && !relocatingObjectId ? 'cursor-pointer hover:opacity-80' : ''}`}
                                                style={{ pointerEvents: drawMode === 'none' && !relocatingObjectId ? 'auto' : 'none' }}
                                            >
                                                <polyline
                                                    points={anno.geometry.map((p: any) => `${p.x * imgSize.width},${p.y * imgSize.height}`).join(' ')}
                                                    fill="none"
                                                    stroke="transparent"
                                                    strokeWidth={24 / zoomLevel}
                                                />
                                                <polyline
                                                    points={anno.geometry.map((p: any) => `${p.x * imgSize.width},${p.y * imgSize.height}`).join(' ')}
                                                    fill="none"
                                                    stroke={anno.style?.strokeColor || '#eab308'}
                                                    strokeWidth={(anno.style?.strokeWidth || 3) / zoomLevel}
                                                    strokeDasharray={anno.style?.strokeDasharray !== 'none' ? anno.style?.strokeDasharray : undefined}
                                                />
                                            </g>
                                        )
                                    ))}

                                    {/* SAVED OBJECTS */}
                                    {visibleObjects?.map((obj: any) => {
                                        const matchingLegend = legends?.find(l => l.name === obj.item_name);

                                        // Status Color Mapping
                                        const status = obj.latest_status?.current_status;
                                        let strokeClr = '#3b82f6'; // Default Fix1 Blue
                                        if (status === 'Pending') strokeClr = '#ef4444';
                                        else if (status === 'Fix2' || status === 'Finish') strokeClr = '#eab308';
                                        else if (status === 'Completed' || status === 'Approved') strokeClr = '#22c55e';

                                        const isRelocatingThis = relocatingObjectId === obj.id;

                                        // Shape specific logic
                                        if (obj.shape_type === 'polygon' || obj.shape_type === 'polyline') {

                                            // Priority: Use temporary preview geometry while mid-drag, else fallback to standard DB geometry state
                                            const pointsArr = isRelocatingThis && previewGeometry ? previewGeometry : (obj.geometry && Array.isArray(obj.geometry) ? obj.geometry : []);
                                            if (pointsArr.length === 0) return null;

                                            return (
                                                <g key={obj.id} style={{ pointerEvents: (drawMode === 'none' && (!relocatingObjectId || isRelocatingThis)) ? 'auto' : 'none' }}>
                                                    {obj.shape_type === 'polygon' ? (
                                                        <polygon
                                                            points={pointsArr.map((p: any) => `${p.x * imgSize.width},${p.y * imgSize.height}`).join(' ')}
                                                            fill={matchingLegend?.style?.fillColor || `${strokeClr}40`}
                                                            stroke={matchingLegend?.style?.strokeColor || strokeClr}
                                                            strokeWidth={(matchingLegend?.style?.strokeWidth || 3) / zoomLevel}
                                                            strokeDasharray={matchingLegend?.style?.strokeDasharray !== 'none' ? matchingLegend?.style?.strokeDasharray : undefined}
                                                            onClick={(e) => !isRelocatingThis && handleObjectClick(e, obj)}
                                                            className={drawMode === 'none' && !isRelocatingThis ? 'cursor-pointer hover:opacity-80' : ''}
                                                            style={{ pointerEvents: isRelocatingThis ? 'none' : 'auto' }}
                                                        />
                                                    ) : (
                                                        <g
                                                            onClick={(e) => !isRelocatingThis && handleObjectClick(e, obj)}
                                                            className={`transition-all ${drawMode === 'none' && !isRelocatingThis ? 'cursor-pointer hover:opacity-80' : ''}`}
                                                            style={{ pointerEvents: isRelocatingThis ? 'none' : 'auto' }}
                                                        >
                                                            <polyline
                                                                points={pointsArr.map((p: any) => `${p.x * imgSize.width},${p.y * imgSize.height}`).join(' ')}
                                                                fill="none"
                                                                stroke="transparent"
                                                                strokeWidth={24 / zoomLevel}
                                                            />
                                                            <polyline
                                                                points={pointsArr.map((p: any) => `${p.x * imgSize.width},${p.y * imgSize.height}`).join(' ')}
                                                                fill="none"
                                                                stroke={matchingLegend?.style?.strokeColor || strokeClr}
                                                                strokeWidth={(matchingLegend?.style?.strokeWidth || 3) / zoomLevel}
                                                                strokeDasharray={matchingLegend?.style?.strokeDasharray !== 'none' ? matchingLegend?.style?.strokeDasharray : undefined}
                                                            />
                                                        </g>
                                                    )}

                                                    {isRelocatingThis && pointsArr.map((p: any, idx: number) => (
                                                        <circle
                                                            key={`anchor-${idx}`}
                                                            cx={p.x * imgSize.width}
                                                            cy={p.y * imgSize.height}
                                                            r={6 / zoomLevel}
                                                            fill={relocatingPointIndex === idx ? '#ef4444' : '#ffffff'}
                                                            stroke="#2563eb"
                                                            strokeWidth={2 / zoomLevel}
                                                            className={relocatingPointIndex !== null ? 'cursor-grabbing' : 'cursor-grab'}
                                                            style={{ pointerEvents: 'auto' }}
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                setRelocatingPointIndex(idx);
                                                            }}
                                                        />
                                                    ))}
                                                </g>
                                            );
                                        }

                                        const isPreviewingCloudScale = previewCloudScale?.id === obj.id;
                                        const cScaleX = obj.shape_type === 'cloud' ? (isPreviewingCloudScale ? previewCloudScale.scaleX : (obj.geometry?.scaleX || 1)) : 1;
                                        const cScaleY = obj.shape_type === 'cloud' ? (isPreviewingCloudScale ? previewCloudScale.scaleY : (obj.geometry?.scaleY || 1)) : 1;

                                        const renderRotation = (isEditingObject && selectedObjectData?.id === obj.id) ? (editFormData.rotation || 0) : (obj.rotation || 0);


                                        // Determine live position (body drag preview)
                                        const isBodyDragging = draggingCloudObj?.id === obj.id;
                                        const livePosX = (isBodyDragging && previewCloudPos?.id === obj.id) ? previewCloudPos.posX : obj.pos_x;
                                        const livePosY = (isBodyDragging && previewCloudPos?.id === obj.id) ? previewCloudPos.posY : obj.pos_y;

                                        // For non-cloud objects, keep the icon svg
                                        const finalIconSvg = obj.shape_type !== 'cloud' ? (matchingLegend?.icon_svg || '') : '';



                                        return (
                                            <g key={obj.id} style={{ pointerEvents: (drawMode === 'none' && !relocatingObjectId) ? 'auto' : 'none' }}>
                                                <g
                                                    transform={`translate(${livePosX * imgSize.width} ${livePosY * imgSize.height})`}
                                                >
                                                    {obj.shape_type === 'cloud' ? (
                                                        // Cloud body — drag to move
                                                        <>
                                                            {/* Visible cloud rectangle */}
                                                            <rect
                                                                x={-50 * cScaleX} y={-50 * cScaleY}
                                                                width={100 * cScaleX} height={100 * cScaleY}
                                                                fill={`${strokeClr}40`}
                                                                stroke={strokeClr}
                                                                strokeWidth={2 / zoomLevel}
                                                                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                                                                onClick={(e) => { handleObjectClick(e, obj); }}
                                                            />
                                                        </>
                                                    ) : (
                                                        // Non-cloud: regular point/icon object
                                                        <>
                                                            <circle cx="0" cy="0" r={20 / zoomLevel} fill="transparent"
                                                                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                                                                onClick={(e) => handleObjectClick(e, obj)}
                                                            />
                                                            <g transform={`scale(${1 / zoomLevel}) rotate(${renderRotation})`}>
                                                                {finalIconSvg ? (
                                                                    <g dangerouslySetInnerHTML={{ __html: finalIconSvg }} />
                                                                ) : (
                                                                    <circle cx="0" cy="0" r="6" fill={strokeClr} stroke="white" strokeWidth="2" />
                                                                )}
                                                            </g>
                                                            {(status === 'Completed' || status === 'Approved' || status === 'Finish') && (
                                                                <g transform={`scale(${1 / zoomLevel}) translate(12, -12)`} style={{ pointerEvents: 'none' }}>
                                                                    <circle 
                                                                        cx="0" cy="0" r="7" 
                                                                        fill={status === 'Finish' ? "#F59E0B" : "#22c55e"} 
                                                                        stroke="white" strokeWidth="1.5" 
                                                                    />
                                                                    <path d="M-2 0.5 L-0.5 2 L3 -2" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                </g>
                                                            )}
                                                        </>
                                                    )}
                                                </g>
                                                {zoomLevel > 1.5 && obj.shape_type !== 'cloud' && <text
                                                    transform={`translate(${livePosX * imgSize.width} ${livePosY * imgSize.height})`}
                                                    x="0" y="-14" fontSize="10" fill="white" stroke="black" strokeWidth="0.5"
                                                    textAnchor="middle" style={{ pointerEvents: 'none' }}>{obj.item_alias_id}</text>}
                                            </g>
                                        );
                                    })}
                                </svg>
                            </div>
                        ) : (
                            <div className="p-12 text-gray-400">No overview available.</div>
                        )}
                    </div>

                    {/* Right Toolbar / Form — Supervisor only */}
                    <DetailedPlanSidebar
                        isSupervisor={isSupervisor}
                        drawMode={drawMode}
                        isFormOpen={isFormOpen}
                        selectedLegend={selectedLegend}
                        tempPoints={tempPoints}
                        handleFinishDrawingShape={handleFinishDrawingShape}
                        handleCancelDrawing={handleCancelDrawing}
                        currentZoneId={currentZoneId}
                        setCurrentZoneId={setCurrentZoneId}
                        zones={zones}
                        cloudScaleX={cloudScaleX}
                        setCloudScaleX={setCloudScaleX}
                        cloudScaleY={cloudScaleY}
                        setCloudScaleY={setCloudScaleY}
                        formData={formData}
                        setFormData={setFormData}
                        handleSave={handleSave}
                        isSaving={objectMutation.isPending || annotationMutation.isPending}
                        csvItems={csvItems}
                        setCsvItems={setCsvItems}
                        onCsvDragStart={handleCsvDragStart}
                        floorId={floorId}
                        currentFloorNumber={floorData?.floor_number}
                    />
                </div>
            </div >

            <DetailedPlanPopover
                anchorPosition={popoverAnchor}
                onClose={handleClosePopover}
                selectedObjectData={selectedObjectData}
                isEditing={isEditingObject}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
                onSaveEdit={handleSaveEdit}
                isSaving={updateObjectMutation.isPending}
                onCancelEdit={() => setIsEditingObject(false)}
                isSupervisor={isSupervisor}
                onEditClick={handleEditClick}
                onMoveClick={selectedObjectData?.shape_type === 'cloud' ? undefined : handleMoveClick}
                onDeleteClick={() => setConfirmDeleteOpen(true)}
                allObjects={objects || []}
                allObjectsForLinking={allObjectsForLinking || []}
                onObjectSelect={setSelectedObjectData}
                onNavigateToObject={handleNavigateToObject}
            />

            <DetailedPlanDeleteDialog
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                selectedObjectAlias={selectedObjectData?.item_alias_id}
                selectedObjectId={selectedObjectData?.id}
                onConfirmDelete={(id) => deleteObjectMutation.mutate(id)}
                isDeleting={deleteObjectMutation.isPending}
            />
        </Dialog >
    );
};

export default DetailedPlanView;
