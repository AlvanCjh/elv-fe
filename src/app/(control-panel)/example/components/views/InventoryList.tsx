import { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton, Tooltip } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { getInventory, addMaterial, updateMaterial, deleteMaterial, InventoryItem, InventoryType, Material, Tool } from '@auth/inventoryApi';
import InventoryDashboard from './InventoryDashboard';

interface InventoryListProps {
    type?: InventoryType;
}

function InventoryList({ type = 'material' }: InventoryListProps) {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '', // Consolidated name field
        brand: '',
        quantity_in_stock: 0,
        unit_of_measure: 'pcs',
        location: '',
        description: '',
        // status: 'available', // Removed manual status, let stock decide
        type: '' // Tool type: electronic, handy, devices
    });

    useEffect(() => {
        refreshInventory();
    }, [type]);

    const refreshInventory = () => getInventory(type).then(setInventory);

    const handleOpen = () => {
        setFormData({
            name: '',
            brand: '',
            quantity_in_stock: 0,
            unit_of_measure: 'pcs',
            location: '',
            description: '',
            // status: 'available',
            type: ''
        });
        setEditMode(false);
        setSelectedId(null);
        setOpen(true);
    };

    const handleEdit = (item: InventoryItem) => {
        setFormData({
            name: (item as Material).material_name || (item as Tool).tool_name || '',
            brand: item.brand || '',
            quantity_in_stock: item.quantity_in_stock,
            unit_of_measure: item.unit_of_measure,
            location: item.location || '',
            description: item.description || '',
            // status: item.status || 'available',
            type: (item as Tool).type || ''
        });
        setEditMode(true);
        setSelectedId(item.id!);
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            await deleteMaterial(id, type);
            refreshInventory();
        }
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async () => {
        const payload: any = {
            ...formData,
            // API expects material_name or tool_name based on type, or we can send generic name if backend handles it
            // Based on my backend update: I added 'name' handling in backend too!
            // But let's be explicit for types:
            [(type === 'tool' ? 'tool_name' : 'material_name')]: formData.name
        };

        if (editMode && selectedId) {
            await updateMaterial(selectedId, payload, type);
        } else {
            await addMaterial(payload, type);
        }
        refreshInventory();
        handleClose();
    };

    const itemNameLabel = type === 'tool' ? 'Tool Name' : 'Material Name';

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* Compact sub-header */}
            <div className="flex items-center justify-between mb-3">
                <Typography variant="subtitle2" className="font-bold text-gray-700 dark:text-gray-200">
                    {type === 'tool' ? 'Tools Inventory' : 'Material Inventory'}
                </Typography>
                <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    className="rounded-lg shadow-sm"
                    startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
                    onClick={handleOpen}
                >
                    Add New {type === 'tool' ? 'Tool' : 'Material'}
                </Button>
            </div>

            <InventoryDashboard inventory={inventory} />

            <Paper className="rounded-xl shadow-sm overflow-hidden dark:bg-gray-800">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                    <Typography variant="body2" className="font-bold dark:text-gray-100">Inventory List</Typography>
                    <Typography variant="caption" className="text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                        {inventory.length} items
                    </Typography>
                </div>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell className="font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 text-xs py-2 pl-4">{itemNameLabel}</TableCell>
                            {type === 'tool' && <TableCell className="font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 text-xs py-2">Type</TableCell>}
                            <TableCell className="font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 text-xs py-2">Description</TableCell>
                            <TableCell className="font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 text-xs py-2">Brand</TableCell>
                            <TableCell className="font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 text-xs py-2">Status</TableCell>
                            <TableCell className="font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 text-xs py-2">Stock</TableCell>
                            <TableCell className="font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 text-xs py-2">Location</TableCell>
                            <TableCell className="font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 text-xs py-2 pr-4" align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {inventory.map((item) => (
                            <TableRow key={item.id} hover className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/50 group">
                                <TableCell className="font-medium text-gray-900 dark:text-gray-100 text-sm py-1.5 pl-4">
                                    {(item as Material).material_name || (item as Tool).tool_name}
                                </TableCell>
                                {type === 'tool' && (
                                    <TableCell className="py-1.5">
                                        <Chip label={(item as Tool).type || 'General'} size="small" className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-200 font-medium text-xs capitalize" sx={{ height: 20, fontSize: '0.7rem' }} />
                                    </TableCell>
                                )}
                                <TableCell className="text-gray-500 dark:text-gray-400 text-xs py-1.5 max-w-[160px] truncate" title={item.description}>{item.description || '-'}</TableCell>
                                <TableCell className="py-1.5">
                                    <Chip label={item.brand || 'Generic'} size="small" className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 font-medium text-xs" sx={{ height: 20, fontSize: '0.7rem' }} />
                                </TableCell>
                                <TableCell className="py-1.5">
                                    {(item.quantity_in_stock === 0) ? (
                                        <Chip label="Out of Stock" size="small" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 font-bold text-xs" sx={{ height: 20, fontSize: '0.68rem' }} />
                                    ) : item.quantity_in_stock < 10 ? (
                                        <Chip label="Low Stock" size="small" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 font-bold text-xs" sx={{ height: 20, fontSize: '0.68rem' }} />
                                    ) : (
                                        <Chip label="In Stock" size="small" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 font-bold text-xs" sx={{ height: 20, fontSize: '0.68rem' }} />
                                    )}
                                </TableCell>
                                <TableCell className="font-mono text-gray-700 dark:text-gray-300 text-sm py-1.5">
                                    {item.quantity_in_stock} {type !== 'tool' && <span className="text-gray-400 text-xs ml-1">{item.unit_of_measure}</span>}
                                </TableCell>
                                <TableCell className="text-gray-500 dark:text-gray-400 text-xs py-1.5">{item.location || '-'}</TableCell>
                                <TableCell className="py-1.5 pr-3" align="right">
                                    <Tooltip title="Edit">
                                        <IconButton onClick={() => handleEdit(item)} size="small" className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                                            <FuseSvgIcon size={15}>heroicons-outline:pencil</FuseSvgIcon>
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton onClick={() => handleDelete(item.id!)} size="small" className="text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                                            <FuseSvgIcon size={15}>heroicons-outline:trash</FuseSvgIcon>
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>{editMode ? `Edit ${type === 'tool' ? 'Tool' : 'Material'}` : `Add New ${type === 'tool' ? 'Tool' : 'Material'}`}</DialogTitle>
                <DialogContent className="flex flex-col gap-4 pt-4">
                    <TextField
                        label={itemNameLabel}
                        fullWidth
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        variant="outlined"
                        className="mt-2"
                    />

                    {type === 'tool' && (
                        <TextField
                            select
                            label="Tool Type"
                            fullWidth
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            SelectProps={{ native: true }}
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                        >
                            <option value="">Select Type...</option>
                            <option value="electronic">Electric & Electronic Tools</option>
                            <option value="handy">Handy Tools</option>
                            <option value="devices">Electronic Devices</option>
                            <option value="other">Other</option>
                        </TextField>
                    )}

                    <TextField
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        variant="outlined"
                    />

                    <div className="flex gap-4">
                        <TextField
                            label="Brand"
                            fullWidth
                            value={formData.brand}
                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            variant="outlined"
                        />
                        <TextField
                            label="Location"
                            fullWidth
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            variant="outlined"
                        />
                    </div>

                    <div className="flex gap-4">
                        <TextField
                            label="Quantity"
                            type="number"
                            fullWidth
                            value={formData.quantity_in_stock}
                            onChange={e => setFormData({ ...formData, quantity_in_stock: Number(e.target.value) })}
                            variant="outlined"
                        />
                        {type !== 'tool' && (
                            <TextField
                                label="Unit (pcs, m, etc)"
                                fullWidth
                                value={formData.unit_of_measure}
                                onChange={e => setFormData({ ...formData, unit_of_measure: e.target.value })}
                                variant="outlined"
                            />
                        )}
                    </div>
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="secondary">{editMode ? 'Update Item' : 'Save Item'}</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default InventoryList;
