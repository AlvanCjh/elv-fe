import { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton, Tooltip } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { getInventoryHistory, returnTool, UsageRecordType, InventoryType, Tool } from '@auth/inventoryApi';
import { format } from 'date-fns';

interface ReturnToolProps {
    type?: InventoryType;
}

function ReturnTool({ type }: ReturnToolProps) {
    const [borrowedTools, setBorrowedTools] = useState<UsageRecordType[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<UsageRecordType | null>(null);
    const [formData, setFormData] = useState({
        quantity: 0,
        remarks: ''
    });

    useEffect(() => {
        refreshBorrowedTools();
    }, [type]);

    const refreshBorrowedTools = async () => {
        if (type !== 'tool') return;

        try {
            const history = await getInventoryHistory();
            // Filter for tools that are not fully returned
            const activeBorrows = history.stock_out.filter(record => {
                // Skip if item is null (e.g. deleted)
                if (!record.item) return false;

                // Check if it's a tool (simple check based on item structure)
                const isTool = (record.item as Tool).tool_name !== undefined;

                // Check status
                const isNotReturned = record.status !== 'returned';

                return isTool && isNotReturned;
            });
            setBorrowedTools(activeBorrows);
        } catch (error) {
            console.error("Failed to fetch borrowed tools", error);
        }
    };

    const handleOpen = (record: UsageRecordType) => {
        const remaining = record.out_qty - (record.return_qty || 0);
        setSelectedRecord(record);
        setFormData({
            quantity: remaining, // Default to full remaining return
            remarks: ''
        });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedRecord(null);
    };

    const handleSubmit = async () => {
        if (!selectedRecord) return;

        try {
            await returnTool({
                usage_record_id: selectedRecord.id,
                quantity: formData.quantity,
                remarks: formData.remarks
            });
            refreshBorrowedTools();
            handleClose();
        } catch (error) {
            console.error("Failed to return tool", error);
            alert("Failed to return tool. Check console for details.");
        }
    };

    if (type !== 'tool') return null;

    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
                <div>
                    <Typography variant="h4" className="font-extrabold tracking-tight leading-none text-gray-900 dark:text-gray-100">
                        Borrowed Tools Management
                    </Typography>
                    <Typography variant="subtitle1" className="text-gray-500 mt-2 font-medium">
                        Track and return borrowed tools
                    </Typography>
                </div>
            </div>

            <Paper className="rounded-2xl shadow-sm overflow-hidden dark:bg-gray-800">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                    <Typography variant="h6" className="font-bold dark:text-gray-100">Active Borrows</Typography>
                    <Typography variant="body2" className="text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-12 py-4 rounded-full border border-gray-200 dark:border-gray-700">
                        {borrowedTools.length} active records
                    </Typography>
                </div>
                {borrowedTools.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No active borrowed tools found.
                    </div>
                ) : (
                    <Table stickyHeader>
                        <TableHead className="p-5 bg-gray-50 dark:bg-gray-900">
                            <TableRow>
                                <TableCell className="font-semibold text-gray-600 dark:text-gray-400 py-12 pl-16 first:rounded-tl-lg bg-gray-50 dark:bg-gray-900">Tool Name</TableCell>
                                <TableCell className="font-semibold text-gray-600 dark:text-gray-400 py-12 px-8 bg-gray-50 dark:bg-gray-900">Borrowed By</TableCell>
                                <TableCell className="font-semibold text-gray-600 dark:text-gray-400 py-12 px-8 bg-gray-50 dark:bg-gray-900">Date Out</TableCell>
                                <TableCell className="font-semibold text-gray-600 dark:text-gray-400 py-12 px-8 bg-gray-50 dark:bg-gray-900">Exp. Return</TableCell>
                                <TableCell className="font-semibold text-gray-600 dark:text-gray-400 py-12 px-8 bg-gray-50 dark:bg-gray-900">Borrowed Qty</TableCell>
                                <TableCell className="font-semibold text-gray-600 dark:text-gray-400 py-12 px-8 bg-gray-50 dark:bg-gray-900">Returned Qty</TableCell>
                                <TableCell className="font-semibold text-gray-600 dark:text-gray-400 py-12 px-8 bg-gray-50 dark:bg-gray-900">Status</TableCell>
                                <TableCell className="font-semibold text-gray-600 dark:text-gray-400 py-12 pr-16 last:rounded-tr-lg bg-gray-50 dark:bg-gray-900" align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {borrowedTools.map((record) => {
                                const tool = record.item as Tool;
                                return (
                                    <TableRow key={record.id} hover className="p-5 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100 border-b border-gray-50 dark:border-gray-700 py-12 pl-16">
                                            {tool.tool_name}
                                            <Typography variant="caption" className="block text-gray-400">
                                                {tool.brand}
                                            </Typography>
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400 border-b border-gray-50 dark:border-gray-700 py-12 px-8">
                                            {record.user?.name || 'Unknown User'}
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400 border-b border-gray-50 dark:border-gray-700 py-12 px-8">
                                            {format(new Date(record.date_out), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400 border-b border-gray-50 dark:border-gray-700 py-12 px-8">
                                            {record.expected_return_date ? format(new Date(record.expected_return_date), 'dd MMM yyyy') : '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-700 py-12 px-8">
                                            {record.out_qty}
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-700 dark:text-gray-300 border-b border-gray-50 dark:border-gray-700 py-12 px-8">
                                            {record.return_qty || 0}
                                        </TableCell>
                                        <TableCell className="border-b border-gray-50 dark:border-gray-700 py-12 px-8">
                                            <Chip
                                                label={record.status || 'Borrowed'}
                                                size="small"
                                                className={`font-bold h-24 text-xs capitalize ${record.status === 'overdue' ? 'bg-red-50 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
                                                    record.status === 'partial_return' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' :
                                                        'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                                    }`}
                                            />
                                        </TableCell>
                                        <TableCell className="border-b border-gray-50 dark:border-gray-700 py-12 pr-10" align="right">
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                onClick={() => handleOpen(record)}
                                                startIcon={<FuseSvgIcon size={16}>heroicons-outline:arrow-path</FuseSvgIcon>}
                                            >
                                                Return
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>Return Tool</DialogTitle>
                <DialogContent className="flex flex-col gap-4 pt-4">
                    {selectedRecord && (
                        <Typography variant="body2" className="mb-2 dark:text-gray-300">
                            Returning: <strong className="dark:text-gray-100">{(selectedRecord.item as Tool).tool_name}</strong><br />
                            Borrowed: {selectedRecord.out_qty} | Returned: {selectedRecord.return_qty || 0} | Remaining: {selectedRecord.out_qty - (selectedRecord.return_qty || 0)}
                        </Typography>
                    )}
                    <TextField
                        label="Quantity to Return"
                        type="number"
                        fullWidth
                        autoFocus
                        value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        variant="outlined"
                        className="mt-2"
                        InputProps={{ inputProps: { min: 1, max: selectedRecord ? selectedRecord.out_qty - (selectedRecord.return_qty || 0) : 1 } }}
                    />

                    <TextField
                        label="Remarks / Condition"
                        fullWidth
                        multiline
                        rows={3}
                        value={formData.remarks}
                        onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                        variant="outlined"
                        placeholder="e.g. Good condition, Broken handle, etc."
                    />
                </DialogContent>
                <DialogActions className="p-4">
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="secondary">Confirm Return</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default ReturnTool;
