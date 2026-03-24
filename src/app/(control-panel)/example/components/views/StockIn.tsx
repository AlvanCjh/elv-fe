import { useState, useEffect } from 'react';
import { Button, TextField, Typography, Paper, Autocomplete, Box } from '@mui/material';
import { getInventory, stockIn, InventoryItem, InventoryType, Material, Tool } from '@auth/inventoryApi';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';

interface StockInProps {
    type?: InventoryType;
}

function StockIn({ type = 'material' }: StockInProps) {
    const { enqueueSnackbar } = useSnackbar();
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

        try {
            await stockIn({
                id: selectedMaterial.id!,
                type: type,
                quantity: Number(quantity),
                date,
                remarks
            });
            enqueueSnackbar('Stock In successful', { variant: 'success' });
            setQuantity('');
            setRemarks('');
            setSelectedMaterial(null);
            getInventory(type).then(setInventory).catch(console.error);
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to update stock', { variant: 'error' });
        }
    };

    return (
        <Paper className="p-24 max-w-2xl mx-auto mt-24 dark:bg-gray-800">
            <Typography variant="h6" className="font-bold mb-24 dark:text-gray-100">
                {type === 'tool' ? 'Tool Stock In' : 'Material Stock In (Delivery)'}
            </Typography>

            <Box className="flex flex-col gap-16">
                <Autocomplete
                    options={inventory}
                    getOptionLabel={(option) => {
                        const name = (option as Material).material_name || (option as Tool).tool_name;
                        return `${name} (${option.brand || 'No Brand'})`;
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
                    label="Remarks"
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
                    startIcon={<FuseSvgIcon>heroicons-outline:save</FuseSvgIcon>}
                    onClick={handleSubmit}
                    disabled={!selectedMaterial || !quantity}
                >
                    Confirm Stock In
                </Button>
            </Box>
        </Paper>
    );
}

export default StockIn;
