import React, { useState, useRef, useEffect, useMemo, FC } from 'react';
import { Typography, Button, Paper, CircularProgress, Chip, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCsvUploads, createCsvUpload, BoqCsvUpload, CsvItem } from './boqCsvApi';
import { useProject } from '../../../../context/ProjectContext';
interface CsvUploadSidebarProps {
    onDragStart: (item: CsvItem) => void;
    csvItems: CsvItem[];
    setCsvItems: React.Dispatch<React.SetStateAction<CsvItem[]>>;
    floorId: string;
    currentFloorNumber?: string;
}

export const CsvUploadSidebar: FC<CsvUploadSidebarProps> = ({ onDragStart, csvItems, setCsvItems, floorId, currentFloorNumber }) => {
    const queryClient = useQueryClient();
    const { activeProjectId } = useProject();
    const [activeUploadId, setActiveUploadId] = useState<number | ''>('');

    const { data: uploads, isLoading: isUploadsLoading } = useQuery({
        queryKey: ['boq-csv-uploads', activeProjectId],
        queryFn: fetchCsvUploads,
        enabled: !!activeProjectId
    });

    const createUploadMutation = useMutation({
        mutationFn: createCsvUpload,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['boq-csv-uploads', activeProjectId] });
            // setActiveUploadId(data.id); // Removed as activeUploadId state is removed
            setCsvItems(data.items || []);
        },
        onError: () => {
            // setErrorMsg("Failed to save CSV upload to server."); // Removed as errorMsg state is removed
        }
    });

    // Aggregate ALL items from ALL uploads to form the global pool
    useEffect(() => {
        if (uploads) {
            const allItems = uploads.reduce((acc, upload) => {
                if (upload.items) {
                    return [...acc, ...upload.items];
                }
                return acc;
            }, [] as CsvItem[]);
            setCsvItems(allItems);
        }
    }, [uploads, setCsvItems]);

    const handleClearCsv = () => {
        setActiveUploadId('');
    };

    const filteredUploads = useMemo(() => {
        if (!uploads) return [];
        if (!currentFloorNumber) return uploads;

        return uploads.filter(upload =>
            upload.items?.some(item =>
                item.floor_number?.trim().toLowerCase() === currentFloorNumber.trim().toLowerCase()
            )
        );
    }, [uploads, currentFloorNumber]);

    const filteredItems = useMemo(() => {
        let items = csvItems;
        if (activeUploadId !== '') {
            items = items.filter(item => item.boq_csv_upload_id === activeUploadId);
        }
        if (currentFloorNumber) {
            items = items.filter(item => item.floor_number?.trim().toLowerCase() === currentFloorNumber.trim().toLowerCase());
        }
        return items;
    }, [csvItems, currentFloorNumber, activeUploadId]);

    const unassignedItems = filteredItems.filter(item => item.status === 'unassigned');
    const assignedItems = filteredItems.filter(item => item.status === 'assigned');

    return (
        <div className="flex flex-col gap-4 mt-6 pt-6 border-t dark:border-gray-700">
            <Typography variant="subtitle2" className="font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>CSV Object Pool</span>
                {filteredItems.length > 0 && (
                    <IconButton size="small" onClick={handleClearCsv} sx={{ padding: '2px' }}>
                        <CloseIcon fontSize="small" className="text-gray-500" />
                    </IconButton>
                )}
            </Typography>

            {filteredUploads && filteredUploads.length > 0 && (
                <FormControl size="small" fullWidth className="mb-2">
                    <InputLabel id="csv-upload-select-label">Select CSV History</InputLabel>
                    <Select
                        labelId="csv-upload-select-label"
                        value={activeUploadId}
                        label="Select CSV History"
                        onChange={(e) => setActiveUploadId(e.target.value as number | '')}
                    >
                        <MenuItem value=""><em>All Uploads</em></MenuItem>
                        {filteredUploads.map(u => (
                            <MenuItem key={u.id} value={u.id}>{u.filename} - {new Date(u.created_at).toLocaleDateString()}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {filteredItems.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/50">
                    <Typography variant="body2" className="text-gray-500 mb-3 font-medium">
                        No items available for this floor or no CSV uploaded.
                    </Typography>
                </div>
            ) : (
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {filteredItems.map((item) => {
                        const isFinished = item.status === 'assigned';
                        return (
                            <Paper
                                key={item.id}
                                className={`p-3 rounded-lg border shadow-sm flex items-center justify-between transition-colors
                                    ${isFinished
                                        ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                                        : 'bg-white dark:bg-gray-800 border-indigo-200 hover:border-indigo-400 dark:border-indigo-800/50 cursor-grab active:cursor-grabbing'
                                    }`}
                                draggable={!isFinished}
                                onDragStart={(e) => {
                                    if (isFinished) {
                                        e.preventDefault();
                                        return;
                                    }
                                    onDragStart(item);
                                    // Required for Firefox drag and drop
                                    e.dataTransfer.setData('text/plain', item.item_id);
                                    e.dataTransfer.effectAllowed = 'copy';
                                }}
                            >
                                <div className="flex flex-col">
                                    <Typography className={`font-bold text-sm ${isFinished ? 'text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {item.item_id}
                                    </Typography>
                                    <Typography variant="caption" className={`${isFinished ? 'text-gray-400' : 'text-gray-500'} dark:text-gray-400 flex items-center`}>
                                        <span className="text-[10px] mr-1 uppercase font-semibold">Legend:</span> {item.alias_prefix}
                                    </Typography>
                                </div>
                                <Chip
                                    label={isFinished ? 'Assigned' : 'Unassigned'}
                                    size="small"
                                    className={`font-mono font-bold ${isFinished
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                                        }`}
                                    sx={{ height: 24, fontSize: '0.75rem' }}
                                />
                            </Paper>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
