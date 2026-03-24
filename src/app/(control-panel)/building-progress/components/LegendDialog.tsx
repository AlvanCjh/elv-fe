import { FC, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography, ToggleButton, ToggleButtonGroup, Checkbox, Divider, IconButton, Slider, FormGroup, FormControlLabel } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLegend, Building } from '../buildingApi';
import { useProject } from '@/context/ProjectContext';
import { Close as CloseIcon } from '@mui/icons-material';

interface LegendDialogProps {
    open: boolean;
    onClose: () => void;
    systemType: string;
    buildings: Building[];
    currentFloorId: number;
}

const SHAPES = [
    { id: 'circle', label: 'Circle' },
    { id: 'square', label: 'Square' },
    { id: 'hexagon', label: 'Hexagon' },
];

const COLORS = [
    '#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#db2777', '#4b5563', '#000000'
];

export const LegendDialog: FC<LegendDialogProps> = ({ open, onClose, systemType, buildings, currentFloorId }) => {
    const [name, setName] = useState('');
    const [shortName, setShortName] = useState('');
    const [shape, setShape] = useState('circle');
    const [color, setColor] = useState('#2563eb');
    const [width, setWidth] = useState(24);
    const [height, setHeight] = useState(24);
    const [assignedFloorIds, setAssignedFloorIds] = useState<number[]>([currentFloorId]);
    const [assignToAll, setAssignToAll] = useState(false);

    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();

    const createMutation = useMutation({
        mutationFn: createLegend,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['legends', systemType, activeProjectId] });
            onClose();
            // Reset form
            setName('');
            setShortName('');
            setShape('circle');
            setColor('#2563eb');
            setWidth(24);
            setHeight(24);
            setAssignedFloorIds([currentFloorId]);
            setAssignToAll(false);
        }
    });

    const generateSvg = () => {
        let path = '';
        const halfW = width / 2;
        const halfH = height / 2;

        if (shape === 'circle') {
            path = `<ellipse cx="0" cy="0" rx="${halfW}" ry="${halfH}" fill="${color}" stroke="white" stroke-width="1.5" />`;
        } else if (shape === 'square') {
            path = `<rect x="-${halfW}" y="-${halfH}" width="${width}" height="${height}" rx="2" fill="${color}" stroke="white" stroke-width="1.5" />`;
        } else if (shape === 'hexagon') {
            // Scale points based on width/height
            const pts = [
                `0,-${halfH}`, 
                `${halfW},-${halfH/2}`, 
                `${halfW},${halfH/2}`, 
                `0,${halfH}`, 
                `-${halfW},${halfH/2}`, 
                `-${halfW},-${halfH/2}`
            ].join(' ');
            path = `<polygon points="${pts}" fill="${color}" stroke="white" stroke-width="1.5" />`;
        }

        const label = shortName || (name ? name.substring(0, 3).toUpperCase() : '');
        const fontSize = Math.min(width / (label.length * 0.6), height * 0.4);
        const text = `<text x="0" y="0" dominant-baseline="central" text-anchor="middle" font-size="${fontSize}" font-family="Arial" font-weight="900" fill="white">${label}</text>`;
        
        return `<g>${path}${text}</g>`;
    };

    const handleSave = () => {
        if (!name) return;

        const data = {
            system_type: systemType,
            name: name,
            shape_type: 'point', 
            icon_svg: generateSvg(),
            style: { color, shape, text: shortName, width, height },
            floor_ids: assignToAll ? [] : assignedFloorIds
        };

        createMutation.mutate(data);
    };

    const allFloors = buildings.flatMap(b => (b.floors || []).map(f => ({
        id: f.id,
        label: b.name ? `${b.name} - ${f.floor_number}` : f.floor_number
    })));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: "rounded-2xl" }}>
            <DialogTitle className="flex justify-between items-center border-b pb-4">
                <Typography component="span" variant="h6" className="font-black uppercase tracking-tight">Design New {systemType.toUpperCase()} Icon</Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent className="p-8">
                <Box className="flex flex-col gap-6">
                    {/* Preview Area */}
                    <Box className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest mb-4">Preview</Typography>
                        <div className="w-20 h-20 flex items-center justify-center bg-white dark:bg-black rounded-full shadow-inner">
                            <svg width="40" height="40" viewBox="-20 -20 40 40" dangerouslySetInnerHTML={{ __html: generateSvg() }} />
                        </div>
                    </Box>

                    <div className="grid grid-cols-2 gap-4">
                        <TextField
                            label="Full Icon Name"
                            placeholder="e.g. CCTV Camera"
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            size="small"
                        />
                        <TextField
                            label="Inner Label (Short)"
                            placeholder="e.g. CAMERA"
                            fullWidth
                            value={shortName}
                            onChange={(e) => setShortName(e.target.value.substring(0, 8).toUpperCase())}
                            size="small"
                            helperText="Max 8 characters"
                        />
                    </div>

                    <Box>
                        <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest block mb-2">Base Shape</Typography>
                        <ToggleButtonGroup
                            value={shape}
                            exclusive
                            onChange={(_, val) => val && setShape(val)}
                            fullWidth
                            size="small"
                            className="bg-white dark:bg-gray-800"
                        >
                            {SHAPES.map(s => (
                                <ToggleButton key={s.id} value={s.id} className="py-2 capitalize font-bold">
                                    {s.label}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Box>

                    <div className="grid grid-cols-2 gap-6">
                        <Box>
                            <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest block mb-2">Width ({width}px)</Typography>
                            <Slider
                                value={width}
                                min={10}
                                max={100}
                                onChange={(_, val) => setWidth(val as number)}
                                size="small"
                            />
                        </Box>
                        <Box>
                            <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest block mb-2">Height ({height}px)</Typography>
                            <Slider
                                value={height}
                                min={10}
                                max={100}
                                onChange={(_, val) => setHeight(val as number)}
                                size="small"
                            />
                        </Box>
                    </div>

                    <Box>
                        <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest block mb-2">Primary Color</Typography>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map(c => (
                                <Box
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full cursor-pointer transition-all border-2 ${color === c ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                    sx={{ backgroundColor: c }}
                                />
                            ))}
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-8 h-8 p-0 border-0 rounded-full cursor-pointer bg-transparent"
                            />
                        </div>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-widest block mb-1">Deployment</Typography>
                        <div className="flex items-center gap-2 mb-2">
                             <Checkbox 
                                checked={assignToAll} 
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setAssignToAll(checked);
                                    if (checked) {
                                        setAssignedFloorIds(allFloors.map(f => f.id));
                                    } else {
                                        setAssignedFloorIds([]);
                                    }
                                }} 
                                size="small"
                             />
                             <Typography variant="body2" className="font-medium text-gray-700">Assign to all floors in project</Typography>
                        </div>
                        
                        <Box className="max-h-48 overflow-y-auto border rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50 mt-2 shadow-inner">
                            {allFloors.length > 0 ? (
                                <FormGroup>
                                    {allFloors.map((floor) => (
                                        <FormControlLabel
                                            key={floor.id}
                                            control={
                                                <Checkbox
                                                    checked={assignedFloorIds.indexOf(floor.id) > -1}
                                                    onChange={(e) => {
                                                        const id = floor.id;
                                                        setAssignedFloorIds(prev => {
                                                            const next = e.target.checked
                                                                ? [...prev, id]
                                                                : prev.filter(x => x !== id);
                                                            
                                                            // If all floors are manually checked, set assignToAll to true
                                                            if (next.length === allFloors.length) {
                                                                setAssignToAll(true);
                                                            } else {
                                                                setAssignToAll(false);
                                                            }
                                                            return next;
                                                        });
                                                    }}
                                                    size="small"
                                                />
                                            }
                                            label={<Typography variant="body2" className="text-gray-700 dark:text-gray-300 font-medium">Floor {floor.label}</Typography>}
                                        />
                                    ))}
                                </FormGroup>
                            ) : (
                                <Box className="py-8 text-center">
                                    <Typography variant="body2" className="text-gray-400 font-bold uppercase tracking-widest">
                                        No floors found or loading...
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions className="p-6 pt-0">
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSave} 
                    disabled={createMutation.isPending || !name}
                    className="bg-blue-600 hover:bg-blue-700 font-black rounded-lg px-8"
                >
                    {createMutation.isPending ? 'Creating...' : 'Create Icon'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
