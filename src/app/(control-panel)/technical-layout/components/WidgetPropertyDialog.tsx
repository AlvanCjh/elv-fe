import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, Typography, Button, IconButton, TextField, Radio, RadioGroup, FormControlLabel, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useAddTechnicalLayoutWidget, useUpdateTechnicalLayoutWidget, useDeleteTechnicalLayoutWidget, TechnicalLayoutWidget, TechnicalLayoutZone } from '../technicalLayoutApi';

interface WidgetPropertyDialogProps {
    open: boolean;
    onClose: () => void;
    widget: Partial<TechnicalLayoutWidget> | null;
    layoutId: number;
    zones: TechnicalLayoutZone[];
}

export const WidgetPropertyDialog: React.FC<WidgetPropertyDialogProps> = ({ open, onClose, widget, layoutId, zones }) => {
    const [temperature, setTemperature] = useState('25.0');
    const [humidity, setHumidity] = useState('40.0');
    const [theme, setTheme] = useState<'blue' | 'yellow' | 'orange'>('blue');
    const [zoneId, setZoneId] = useState<number | ''>('');
    const [status, setStatus] = useState<'ok' | 'warning' | 'critical'>('ok');

    const addMutation = useAddTechnicalLayoutWidget();
    const updateMutation = useUpdateTechnicalLayoutWidget(layoutId);
    const deleteMutation = useDeleteTechnicalLayoutWidget(layoutId);

    useEffect(() => {
        if (widget) {
            setTemperature(widget.metadata?.temperature || '25.0');
            setHumidity(widget.metadata?.humidity || '40.0');
            setTheme((widget.color_theme as any) || 'blue');
            setZoneId(widget.technical_layout_zone_id || '');
            setStatus((widget.status as any) || 'ok');
        } else {
            setTemperature('25.0');
            setHumidity('40.0');
            setTheme('blue');
            setZoneId('');
            setStatus('ok');
        }
    }, [widget]);

    const handleSave = () => {
        if (!widget) return;

        const payload = {
            technical_layout_id: layoutId,
            type: 'sensor',
            technical_layout_zone_id: zoneId || null,
            status,
            color_theme: theme,
            x_pos: widget.x_pos,
            y_pos: widget.y_pos,
            metadata: {
                temperature,
                humidity
            }
        };

        if (widget.id) {
            updateMutation.mutate({ id: widget.id, data: payload }, { onSuccess: onClose });
        } else {
            addMutation.mutate(payload, { onSuccess: onClose });
        }
    };

    const handleDelete = () => {
        if (widget?.id) {
            deleteMutation.mutate(widget.id, { onSuccess: onClose });
        } else {
            onClose(); // Deleting a non-persisted widget just closes it
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ className: "rounded-2xl" }}>
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
                <Typography className="font-black text-slate-800 text-lg tracking-tight">
                    {widget?.id ? 'Edit Widget' : 'Add Widget'}
                </Typography>
                <IconButton onClick={onClose} size="small" className="bg-white border">
                    <FuseSvgIcon size={16}>heroicons-outline:x</FuseSvgIcon>
                </IconButton>
            </div>
            <DialogContent className="p-6 space-y-5 flex flex-col pt-4">
                
                <div className="flex flex-col gap-4">
                    <FormControl size="small" fullWidth>
                        <InputLabel className="text-xs font-black uppercase">Assign to Zone</InputLabel>
                        <Select
                            value={zoneId}
                            label="Assign to Zone"
                            onChange={(e) => setZoneId(e.target.value as number | '')}
                            className="rounded-xl"
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {zones.map(z => (
                                <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth>
                        <InputLabel className="text-xs font-black uppercase">Status Level</InputLabel>
                        <Select
                            value={status}
                            label="Status Level"
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="rounded-xl"
                        >
                            <MenuItem value="ok">Optimized (OK)</MenuItem>
                            <MenuItem value="warning">Warning / Anomalous</MenuItem>
                            <MenuItem value="critical">Critical Issue</MenuItem>
                        </Select>
                    </FormControl>
                </div>

                <div>
                    <Typography className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 mt-2">Color Theme</Typography>
                    <RadioGroup row value={theme} onChange={(e) => setTheme(e.target.value as any)}>
                        <FormControlLabel value="blue" control={<Radio color="primary" />} label={<Typography className="text-sm font-bold">Blue</Typography>} />
                        <FormControlLabel value="yellow" control={<Radio color="warning" />} label={<Typography className="text-sm font-bold">Yellow</Typography>} />
                        <FormControlLabel value="orange" control={<Radio color="error" />} label={<Typography className="text-sm font-bold">Orange</Typography>} />
                    </RadioGroup>
                </div>
                
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Typography className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Temperature (°C)</Typography>
                        <TextField
                            size="small"
                            fullWidth
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            placeholder="e.g. 26.5"
                            InputProps={{ className: "rounded-xl font-mono font-bold" }}
                        />
                    </div>
                    <div className="flex-1">
                        <Typography className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Humidity (%)</Typography>
                        <TextField
                            size="small"
                            fullWidth
                            value={humidity}
                            onChange={(e) => setHumidity(e.target.value)}
                            placeholder="e.g. 40.5"
                            InputProps={{ className: "rounded-xl font-mono font-bold" }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-5 border-t border-slate-100 mt-2">
                    {widget?.id && (
                        <Button 
                            color="error" 
                            variant="outlined" 
                            className="rounded-xl px-4 font-black h-11"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            Delete
                        </Button>
                    )}
                    <Button 
                        variant="contained" 
                        color="primary" 
                        className="rounded-xl px-4 font-black shadow-lg ml-auto h-11"
                        onClick={handleSave}
                        disabled={addMutation.isPending || updateMutation.isPending}
                    >
                        Save Widget
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
