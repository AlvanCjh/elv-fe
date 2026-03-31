import React, { useState } from 'react';
import { Box, Typography, Paper, Button, FormControl, InputLabel, Select, MenuItem, Slider, TextField, CircularProgress } from '@mui/material';
import { CsvUploadSidebar } from './CsvUploadSidebar';
import { CsvItem } from './boqCsvApi';

interface DetailedPlanSidebarProps {
    isSupervisor: boolean;
    drawMode: string;
    isFormOpen: boolean;
    selectedLegend: any;
    tempPoints: any[];
    handleFinishDrawingShape: () => void;
    handleCancelDrawing: () => void;
    currentZoneId: number | null;
    setCurrentZoneId: (val: number) => void;
    zones: any[];
    cloudScaleX: number;
    setCloudScaleX: (val: number) => void;
    cloudScaleY: number;
    setCloudScaleY: (val: number) => void;
    formData: any;
    setFormData: (val: any) => void;
    handleSave: () => void;
    isSaving: boolean;
    // CSV Drag and Drop Props
    csvItems: CsvItem[];
    setCsvItems: React.Dispatch<React.SetStateAction<CsvItem[]>>;
    onCsvDragStart: (item: CsvItem) => void;
    currentFloorNumber?: string;
    floorId: string;
}

export const DetailedPlanSidebar: React.FC<DetailedPlanSidebarProps> = ({
    isSupervisor,
    drawMode,
    isFormOpen,
    selectedLegend,
    tempPoints,
    handleFinishDrawingShape,
    handleCancelDrawing,
    currentZoneId,
    setCurrentZoneId,
    zones,
    cloudScaleX,
    setCloudScaleX,
    cloudScaleY,
    setCloudScaleY,
    formData,
    setFormData,
    handleSave,
    isSaving,
    csvItems,
    setCsvItems,
    onCsvDragStart,
    currentFloorNumber,
    floorId
}) => {
    if (!isSupervisor || (drawMode === 'none' && !isFormOpen && csvItems.length === 0 && !selectedLegend)) {
        // We still want to render if they are just viewing, but maybe we only hide if they aren't supervisor?
        // Actually, supervisor should always see the sidebar so they can upload CSVs even if not drawing yet.
    }

    if (!isSupervisor) return null;

    return (
        <div className="w-[350px] bg-white dark:bg-gray-800 shadow-xl flex flex-col p-4 overflow-auto border-l dark:border-gray-700">
            <Typography variant="h6" className="font-bold mb-4 border-b dark:border-gray-700 pb-2 dark:text-gray-100">
                {drawMode === 'point' ? 'Add ' + selectedLegend?.name : isFormOpen ? 'Save Structure' : 'Drawing ' + selectedLegend?.name}
            </Typography>

            {!isFormOpen ? (
                <div className="space-y-4">
                    <Paper className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800" elevation={0}>
                        <Typography variant="body2" className="text-blue-800 dark:text-blue-300">
                            {drawMode === 'point' ? "Click anywhere on the plan to place it." : drawMode === 'cloud' ? "Click anywhere to place the cloud. You can resize it in the panel." : "Click to place vertices. Finish to save."}
                        </Typography>
                        {(drawMode === 'polyline' || drawMode === 'polygon') && (
                            <Button fullWidth variant="contained" className="mt-4" onClick={handleFinishDrawingShape} disabled={tempPoints.length < 2}>
                                Complete Shape
                            </Button>
                        )}
                    </Paper>
                    {(drawMode !== 'none' || isFormOpen) && (
                        <Button fullWidth onClick={handleCancelDrawing} color="error" variant="text">Cancel</Button>
                    )}

                    {/* CSV Upload Section */}
                    {drawMode === 'none' && !isFormOpen && (
                        <div>
                            {/* Global Master BOQ Alert */}
                            <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg flex items-start gap-3">
                                <Typography variant="body2" className="text-emerald-800 dark:text-emerald-300 text-xs">
                                    <strong>Global Master BOQ Enabled.</strong> CSV Upload has been moved to the Analytics Overview Dashboard. This sidebar now automatically filters to show only the draggable objects assigned to <strong>{currentFloorNumber || 'this floor'}</strong>.
                                </Typography>
                            </div>

                            <CsvUploadSidebar
                                csvItems={csvItems}
                                setCsvItems={setCsvItems}
                                onDragStart={onCsvDragStart}
                                floorId={floorId}
                                currentFloorNumber={currentFloorNumber}
                            />
                        </div>
                    )}
                </div >
            ) : (
                <div className="space-y-4 flex-col flex">
                    <FormControl size="small" fullWidth>
                        <InputLabel>Target Zone</InputLabel>
                        <Select
                            value={currentZoneId || ''}
                            label="Target Zone"
                            onChange={e => setCurrentZoneId(e.target.value as number)}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {zones.map(z => (
                                <MenuItem key={z.id} value={z.id}>{z.alias_id} - {z.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Unified Object Properties Form */}
                    <Box className={drawMode === 'cloud' ? '' : 'block'}>
                        {(drawMode === 'polyline' || drawMode === 'polygon') && (
                            <Typography variant="body2" className="text-blue-600 dark:text-blue-400 mb-4 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
                                Shape drawn with {tempPoints.length} points. Fill in the object details to save.
                            </Typography>
                        )}

                        <div className="flex flex-col gap-4">
                            <TextField size="small" label="Item Alias ID" value={formData.item_alias_id} onChange={e => setFormData({ ...formData, item_alias_id: e.target.value })} required={drawMode !== 'cloud'} />
                            <TextField disabled size="small" label="Item Name" value={selectedLegend?.name || ''} />

                            {drawMode !== 'polyline' && drawMode !== 'polygon' && (
                                <Box sx={{ mt: 1, px: 1 }}>
                                    <Typography variant="caption" className="dark:text-gray-400" color="textSecondary">Rotation ({formData.rotation}°)</Typography>
                                    <Slider
                                        size="small"
                                        value={formData.rotation}
                                        onChange={(_, newValue) => setFormData({ ...formData, rotation: newValue as number })}
                                        min={0}
                                        max={359}
                                        step={15}
                                    />
                                </Box>
                            )}

                            <TextField size="small" label="Cabling Type" value={formData.cabling_type} onChange={e => setFormData({ ...formData, cabling_type: e.target.value })} />
                            <TextField size="small" label="Gridline Coords" value={formData.gridline_coords} onChange={e => setFormData({ ...formData, gridline_coords: e.target.value })} />

                            <FormControl size="small">
                                <InputLabel>Status</InputLabel>
                                <Select value={formData.status} label="Status" onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <MenuItem value="Fix1">Fix1 (Point Installation)</MenuItem>
                                    <MenuItem value="Fix2">Fix2 (Equipment)</MenuItem>
                                    <MenuItem value="Finish">Work Finished</MenuItem>
                                    <MenuItem value="Pending">Pending (Environment)</MenuItem>
                                    <MenuItem value="Approved">Approved / Complete</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField size="small" label="Remarks / Reason" multiline rows={2} value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} />

                            <Box>
                                <Button variant="outlined" component="label" size="small" fullWidth color={formData.status === 'Pending' && !formData.status_image ? "error" : "primary"}>
                                    {formData.status_image ? formData.status_image.name : 'Upload Image (Req for Pending)'}
                                    <input type="file" hidden accept="image/*" onChange={(e) => setFormData({ ...formData, status_image: e.target.files ? e.target.files[0] : null })} />
                                </Button>
                                {formData.status === 'Pending' && !formData.status_image && <Typography color="error" variant="caption" className="mt-1 block">Image is required when status is Pending.</Typography>}
                            </Box>

                            {!currentZoneId && <Typography color="error" variant="caption">Warning: No zone selected. You must select a zone before placing objects.</Typography>}
                        </div>
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        disabled={isSaving || ((drawMode === 'point' || drawMode === 'cloud') && (!currentZoneId || (drawMode === 'point' && !formData.item_alias_id) || (formData.status === 'Pending' && !formData.status_image)))}
                        className="mt-4"
                    >
                        {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save'}
                    </Button>
                    <Button variant="outlined" color="inherit" onClick={handleCancelDrawing}>Cancel</Button>
                </div>
            )
            }
        </div >
    );
};
