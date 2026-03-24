import { useState, useEffect } from 'react';
import { Button, TextField, Typography, Paper, Autocomplete, Box } from '@mui/material';
import { getInventory, stockOut, InventoryItem, InventoryType, Material, Tool } from '@auth/inventoryApi';
import useUser from '@auth/useUser';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';

interface StockOutProps {
    type?: InventoryType;
}

function StockOut({ type = 'material' }: StockOutProps) {
    const { enqueueSnackbar } = useSnackbar();
    const { data: user } = useUser();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState<InventoryItem | null>(null);
    const [quantity, setQuantity] = useState<number | string>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        setInventory([]);
        setSelectedMaterial(null);
        getInventory(type).then(setInventory).catch(console.error);
    }, [type]);

    const handleSubmit = async () => {
        if (!selectedMaterial || !quantity) {
            enqueueSnackbar('Please select an item and enter quantity', { variant: 'warning' });
            return;
        }

        const qty = Number(quantity);
        if (qty > (selectedMaterial.quantity_in_stock || 0)) {
            enqueueSnackbar(`Insufficient stock! perform stock out failed. Available: ${selectedMaterial.quantity_in_stock}`, { variant: 'error' });
            return;
        }

        try {
            await stockOut({
                id: selectedMaterial.id!,
                type: type,
                quantity: qty,
                date,
                user_id: user?.id,
                remarks
            });
            enqueueSnackbar('Stock Out successful', { variant: 'success' });
            setQuantity('');
            setRemarks('');
            setSelectedMaterial(null);
            // proactive refresh
            getInventory(type).then(setInventory);
        } catch (error: any) {
            console.error(error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to update stock', { variant: 'error' });
        }
    };

    return (
        <Paper className="p-24 max-w-2xl mx-auto mt-24 dark:bg-gray-800">
            <Typography variant="h6" className="font-bold mb-24 dark:text-gray-100">
                {type === 'tool' ? 'Tool Stock Out (Usage)' : 'Material Stock Out (Usage)'}
            </Typography>

            <Box className="flex flex-col gap-16">
                <Autocomplete
                    options={inventory}
                    getOptionLabel={(option) => {
                        const name = (option as Material).material_name || (option as Tool).tool_name;
                        return `${name} (Stock: ${option.quantity_in_stock})`;
                    }}
                    value={selectedMaterial}
                    onChange={(_, newValue) => setSelectedMaterial(newValue)}
                    renderInput={(params) => <TextField {...params} label={`Select ${type === 'tool' ? 'Tool' : 'Material'}`} fullWidth />}
                />

                <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    helperText={selectedMaterial ? `Available: ${selectedMaterial.quantity_in_stock}` : ''}
                />

                <TextField
                    label="Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />

                <TextField
                    label="Taken By (User)"
                    fullWidth
                    value={user?.displayName || user?.email || 'Unknown'}
                    disabled
                />

                <TextField
                    label="Remarks / Location of Use"
                    fullWidth
                    multiline
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                />

                <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    startIcon={<FuseSvgIcon>heroicons-outline:minus-circle</FuseSvgIcon>}
                    onClick={handleSubmit}
                    disabled={!selectedMaterial || !quantity}
                >
                    Confirm Stock Out
                </Button>
            </Box>
        </Paper>
    );
}

export default StockOut;
