import { useState, useEffect } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip, Tab, Tabs, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import { getInventoryHistory, InventoryHistory, StockInRecordType, UsageRecordType, InventoryType, Material, Tool } from '@auth/inventoryApi';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { format } from 'date-fns';

interface InventoryHistoryViewProps {
    type?: InventoryType;
}

function InventoryHistoryView({ type = 'material' }: InventoryHistoryViewProps) {
    const [history, setHistory] = useState<InventoryHistory | null>(null);
    const [tabValue, setTabValue] = useState(0);

    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<UsageRecordType | null>(null);

    useEffect(() => {
        getInventoryHistory().then(setHistory).catch(console.error);
    }, [type]);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleViewHistory = (record: UsageRecordType) => {
        setSelectedHistory(record);
        setHistoryOpen(true);
    };

    const handleCloseHistory = () => {
        setHistoryOpen(false);
        setSelectedHistory(null);
    };

    const getItemName = (record: StockInRecordType | UsageRecordType) => {
        const item = record.item as (Material | Tool);
        if (!item) return 'Unknown';
        return (item as Material).material_name || (item as Tool).tool_name || 'Unknown';
    };

    const getItemUnit = (record: StockInRecordType | UsageRecordType) => {
        const item = record.item;
        return item?.unit_of_measure || '';
    };

    const getItemBrand = (record: StockInRecordType | UsageRecordType) => {
        const item = record.item;
        return item?.brand || '-';
    };

    if (!history) {
        return <Typography className="p-24">Loading history...</Typography>;
    }

    // Filter history based on type client-side since API returns all (or server filtering handling if we updated API to filter)
    // The current API `getInventoryHistory` does not take type in my previous update, so I filter here.
    // Ideally update API to filter, but client-side is OK for now if data is small. 
    // Wait, `StockInRecord` has `item_type`. I can filter.

    // Correction: `item_type` likely stores full class name 'App\Models\Material' or 'App\Models\Tool'.
    // Or if I didn't update API to return `item_type` explicitly, I can check if `item.material_name` exists.

    const filterRecord = (record: StockInRecordType | UsageRecordType) => {
        // Simple heuristic: if type is 'tool', we expect tool_name. If material, material_name.
        const item = record.item as any;
        if (!item) return false;
        if (type === 'tool') return !!item.tool_name || item.item_type?.includes('Tool');
        return !!item.material_name || item.item_type?.includes('Material');
    };

    const stockIn = history.stock_in.filter(filterRecord);
    const stockOut = history.stock_out.filter(filterRecord);




    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
                <div>
                    <Typography variant="h4" className="font-extrabold tracking-tight leading-none text-gray-900 dark:text-gray-100">Transaction History</Typography>
                    <Typography variant="subtitle1" className="text-gray-500 mt-2 font-medium">View past {type} stock in and usage records</Typography>
                </div>
            </div>

            <Paper className="w-full overflow-hidden rounded-2xl shadow-sm dark:bg-gray-800">
                <Box className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <Tabs value={tabValue} onChange={handleChange} indicatorColor="secondary" textColor="secondary">
                        <Tab label="Stock In (Deliveries)" />
                        <Tab label="Stock Out (Usage)" />
                    </Tabs>
                </Box>

                {tabValue === 0 && (
                    <Table stickyHeader>
                        <TableHead className="bg-gray-50 dark:bg-gray-900">
                            <TableRow>
                                <TableCell className="font-semibold py-6 pl-16 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">Date</TableCell>
                                <TableCell className="font-semibold py-6 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">Item</TableCell>
                                <TableCell className="font-semibold py-6 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">Brand</TableCell>
                                <TableCell className="font-semibold py-6 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">Quantity In</TableCell>
                                <TableCell className="font-semibold py-6 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stockIn.map((record: StockInRecordType) => (
                                <TableRow key={record.id} hover className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                                    <TableCell className="py-6 pl-16 text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                                        {format(new Date(record.date_in || record.created_at), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell className="py-6 font-medium text-gray-900 dark:text-gray-100 border-b dark:border-gray-700">
                                        {getItemName(record)}
                                    </TableCell>
                                    <TableCell className="py-6 text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                                        {getItemBrand(record)}
                                    </TableCell>
                                    <TableCell className="py-6 border-b dark:border-gray-700">
                                        <Chip
                                            label={`+ ${record.in_qty} ${getItemUnit(record)}`}
                                            size="small"
                                            className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 font-bold"
                                        />
                                    </TableCell>
                                    <TableCell className="py-6 text-gray-500 dark:text-gray-400 max-w-xs truncate border-b dark:border-gray-700" title={record.remarks}>
                                        {record.remarks || '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {stockIn.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" className="py-24 text-gray-500 dark:text-gray-400">No stock in records found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}

                {tabValue === 1 && (
                    <Table stickyHeader>
                        <TableHead className="bg-gray-50 dark:bg-gray-900">
                            <TableRow>
                                <TableCell className="font-semibold py-6 pl-16 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">Date</TableCell>
                                <TableCell className="font-semibold py-6 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">Item</TableCell>
                                <TableCell className="font-semibold py-6 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">Used By</TableCell>
                                <TableCell className="font-semibold py-6 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">Quantity / Status</TableCell>
                                <TableCell className="font-semibold py-6 bg-gray-50 dark:bg-gray-900 dark:text-gray-400">Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stockOut.map((record: UsageRecordType) => {
                                const returns = record.remarks ? record.remarks.split('\n[Return]:').slice(1) : [];
                                const originalRemark = record.remarks ? record.remarks.split('\n[Return]:')[0] : '';

                                return (
                                    <TableRow key={record.id} hover className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                                        <TableCell className="py-6 pl-16 text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                                            {format(new Date(record.date_out || record.created_at), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell className="py-6 font-medium text-gray-900 dark:text-gray-100 border-b dark:border-gray-700">
                                            {getItemName(record)}
                                        </TableCell>
                                        <TableCell className="py-6 text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                                            {record.user?.displayName || record.user?.name || record.user?.email || 'Unknown User'}
                                        </TableCell>
                                        <TableCell className="py-6 border-b dark:border-gray-700">
                                            <Chip
                                                label={`- ${record.out_qty} ${getItemUnit(record)}`}
                                                size="small"
                                                className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400 font-bold"
                                            />
                                            {record.status && (
                                                <Chip
                                                    label={record.status}
                                                    size="small"
                                                    className={`ml-2 font-bold h-24 text-xs capitalize ${record.status === 'overdue' ? 'bg-red-50 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
                                                        record.status === 'partial_return' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300' :
                                                            record.status === 'returned' ? 'bg-green-50 text-green-600 dark:bg-green-900/40 dark:text-green-300' :
                                                                'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                                                        }`}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell className="py-6 text-gray-500 dark:text-gray-400 max-w-xs border-b dark:border-gray-700">
                                            <div className="mb-1">{originalRemark || '-'}</div>
                                            {returns.length > 0 && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="inherit"
                                                    className="text-xs py-0 px-2 mt-1 border-gray-300 text-gray-600 bg-gray-50 normal-case dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800"
                                                    onClick={() => handleViewHistory(record)}
                                                    startIcon={<FuseSvgIcon size={14}>heroicons-outline:clipboard-list</FuseSvgIcon>}
                                                >
                                                    View {returns.length} Return(s)
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {stockOut.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" className="py-24 text-gray-500 dark:text-gray-400">No usage records found</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            <Dialog open={historyOpen} onClose={handleCloseHistory} fullWidth maxWidth="sm">
                <DialogTitle>Return History</DialogTitle>
                <DialogContent className="flex flex-col gap-4 pt-4">
                    {selectedHistory && (
                        <>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-2">
                                <Typography variant="subtitle2" className="text-gray-500 dark:text-gray-300">Original Borrowing</Typography>
                                <Typography variant="body1" className="font-semibold dark:text-gray-100">{getItemName(selectedHistory)}</Typography>
                                <Typography variant="body2" className="mt-1 dark:text-gray-300">
                                    Date Out: {format(new Date(selectedHistory.date_out), 'dd MMM yyyy')} <br />
                                    Quantity: {selectedHistory.out_qty} <br />
                                    Borrowed By: {selectedHistory.user?.displayName || selectedHistory.user?.name || 'Unknown'} <br />
                                    Initial Remark: {selectedHistory.remarks?.split('\n[Return]:')[0] || '-'}
                                </Typography>
                            </div>

                            <Typography variant="h6" className="font-bold border-b dark:border-gray-600 pb-2 dark:text-gray-100">Return Log</Typography>

                            <div className="space-y-3">
                                {selectedHistory.remarks?.split('\n[Return]:').slice(1).map((log, index) => (
                                    <div key={index} className="flex gap-3 text-sm border-l-2 border-green-500 pl-3 py-1">
                                        <div className="flex-1">
                                            <Typography variant="body2" className="text-gray-800 dark:text-gray-200">{log.trim()}</Typography>
                                            {/* Note: In a real system we'd ideally store return dates in a separate table to show exact date here. 
                                                Currently we are parsing the appended remark string. */}
                                            <Typography variant="caption" className="text-gray-400 dark:text-gray-500 block mt-1">
                                                Return #{index + 1}
                                            </Typography>
                                        </div>
                                    </div>
                                ))}
                                {(!selectedHistory.remarks || selectedHistory.remarks.split('\n[Return]:').length <= 1) && (
                                    <Typography className="text-gray-500 dark:text-gray-400 italic">No returns recorded yet.</Typography>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseHistory}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default InventoryHistoryView;
