import { useState } from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import InventoryList from './InventoryList';
import StockIn from './StockIn';
import StockOut from './StockOut';
import InventoryHistoryView from './InventoryHistoryView';
import ReturnTool from './ReturnTool';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { InventoryType } from '@auth/inventoryApi';

interface ExampleViewProps {
    type?: InventoryType;
}

function ExampleView({ type = 'material' }: ExampleViewProps) {
    const [currentTab, setCurrentTab] = useState(0);
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const title = type === 'tool' ? 'Tools Inventory' : 'Material Inventory';
    const subtitle = type === 'tool' ? 'Manage tools, equipment, and tracking' : 'Manage stocks, deliveries, and usage';

    return (
        <div className="flex flex-col w-full min-h-full bg-gray-100 dark:bg-gray-900">
            {/* Compact header bar */}
            <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-1 h-8 rounded-full bg-blue-500 shrink-0" />
                <div>
                    <Typography variant="subtitle1" className="font-bold leading-tight text-gray-800 dark:text-gray-100">
                        {title}
                    </Typography>
                    <Typography variant="caption" className="text-gray-400 leading-none">
                        {subtitle}
                    </Typography>
                </div>
            </div>

            <Box className="w-full px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    indicatorColor="secondary"
                    textColor="secondary"
                    variant="scrollable"
                    scrollButtons="auto"
                    className="w-full"
                    sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0, fontSize: '0.78rem' } }}
                >
                    <Tab label="Inventory List" icon={<FuseSvgIcon>heroicons-outline:view-list</FuseSvgIcon>} iconPosition="start" />
                    <Tab label="Stock In (Delivery)" icon={<FuseSvgIcon>heroicons-outline:plus-circle</FuseSvgIcon>} iconPosition="start" />
                    <Tab label="Stock Out (Usage)" icon={<FuseSvgIcon>heroicons-outline:minus-circle</FuseSvgIcon>} iconPosition="start" />
                    {type === 'tool' && (
                        <Tab label="Return Tool" icon={<FuseSvgIcon>heroicons-outline:arrow-path</FuseSvgIcon>} iconPosition="start" />
                    )}
                    <Tab label="History" icon={<FuseSvgIcon>heroicons-outline:clock</FuseSvgIcon>} iconPosition="start" />
                </Tabs>
            </Box>

            <div className="p-4 w-full max-w-7xl mx-auto">
                {currentTab === 0 && <InventoryList type={type} />}
                {currentTab === 1 && <StockIn type={type} />}
                {currentTab === 2 && <StockOut type={type} />}
                {type === 'tool' ? (
                    <>
                        {currentTab === 3 && <ReturnTool type={type} />}
                        {currentTab === 4 && <InventoryHistoryView type={type} />}
                    </>
                ) : (
                    currentTab === 3 && <InventoryHistoryView type={type} />
                )}
            </div>
        </div>
    );
}

export default ExampleView;