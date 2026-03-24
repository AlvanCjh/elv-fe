
import { useMemo } from 'react';
import { Paper, Typography, Box, Grid, Card, CardContent, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { InventoryItem, Material, Tool } from '@auth/inventoryApi';

interface InventoryDashboardProps {
    inventory: InventoryItem[];
}

function InventoryDashboard({ inventory }: InventoryDashboardProps) {
    const theme = useTheme();

    const stats = useMemo(() => {
        const totalItems = inventory.length;
        const totalStock = inventory.reduce((acc, curr) => acc + curr.quantity_in_stock, 0);
        const lowStock = inventory.filter(i => i.quantity_in_stock < 10).length;
        const outOfStock = inventory.filter(i => i.quantity_in_stock === 0).length;
        return { totalItems, totalStock, lowStock, outOfStock };
    }, [inventory]);

    const brandData = useMemo(() => {
        const brandCount: Record<string, number> = {};
        inventory.forEach(item => {
            const brand = item.brand || 'Unknown';
            brandCount[brand] = (brandCount[brand] || 0) + 1;
        });
        return Object.entries(brandCount).map(([name, value]) => ({ name, value }));
    }, [inventory]);

    const topStockData = useMemo(() => {
        return [...inventory]
            .sort((a, b) => b.quantity_in_stock - a.quantity_in_stock)
            .slice(0, 5)
            .map(item => ({
                name: (item as Material).material_name || (item as Tool).tool_name || 'Unknown',
                quantity: item.quantity_in_stock
            }));
    }, [inventory]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const STAT_CARDS = [
        { label: 'Total Items',   value: stats.totalItems,  icon: 'heroicons-outline:cube',              gradient: 'from-blue-500 to-blue-600' },
        { label: 'Total Stock',   value: stats.totalStock,  icon: 'heroicons-outline:chart-bar',         gradient: 'from-purple-500 to-purple-600' },
        { label: 'Low Stock',     value: stats.lowStock,    icon: 'heroicons-outline:exclamation-circle', gradient: 'from-orange-500 to-orange-600' },
        { label: 'Out of Stock',  value: stats.outOfStock,  icon: 'heroicons-outline:ban',               gradient: 'from-red-500 to-red-600' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full mb-4"
        >
            {/* ── Compact stat row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {STAT_CARDS.map(card => (
                    <Card key={card.label} className={`bg-gradient-to-br ${card.gradient} text-white shadow rounded-xl overflow-hidden relative`}>
                        <CardContent className="p-3 flex items-center gap-3">
                            <div className="opacity-20 absolute right-2 top-1">
                                <FuseSvgIcon size={40}>{card.icon}</FuseSvgIcon>
                            </div>
                            <div>
                                <Typography variant="caption" className="opacity-75 font-semibold uppercase tracking-wide block leading-tight">
                                    {card.label}
                                </Typography>
                                <Typography variant="h5" className="font-bold leading-tight">
                                    {card.value}
                                </Typography>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Compact charts row ── */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper className="p-3 rounded-xl shadow-sm flex flex-col" style={{ height: 220 }}>
                        <Typography variant="caption" className="font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">
                            By Brand
                        </Typography>
                        <Box className="flex-grow">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={brandData}
                                        cx="40%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {brandData.map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" iconSize={10}
                                        formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper className="p-3 rounded-xl shadow-sm flex flex-col" style={{ height: 220 }}>
                        <Typography variant="caption" className="font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">
                            Top 5 by Quantity
                        </Typography>
                        <Box className="flex-grow">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topStockData}
                                    layout="vertical"
                                    margin={{ top: 2, right: 16, left: 4, bottom: 2 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 10 }} />
                                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                                    <RechartsTooltip />
                                    <Bar dataKey="quantity" fill="#2196F3" radius={[0, 4, 4, 0]} barSize={14} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </motion.div>
    );
}

export default InventoryDashboard;
