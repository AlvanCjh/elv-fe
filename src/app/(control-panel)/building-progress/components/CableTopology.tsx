import { Box, Typography, Paper, Chip } from '@mui/material';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ContentCopy as LinkIcon, CheckCircleOutline as CheckCircleIcon, Devices as DevicesIcon, ArrowRightAlt as ArrowRightIcon } from '@mui/icons-material';
import { useCableTopology } from '../../bill-of-quantity/boqApi';

interface CableTopologyProps {
    floorId: number;
    externalSystemFilter: string;
}

export const CableTopology: React.FC<CableTopologyProps> = ({ floorId, externalSystemFilter }) => {
    const { data: cables, isFetching, error } = useCableTopology(floorId, externalSystemFilter);

    const stats = useMemo(() => {
        if (!cables) return { totalRuns: 0, activeLinks: 0, devicesLinked: 0 };

        const totalRuns = cables.length;
        const activeLinks = cables.filter(c => c.status?.toLowerCase() === 'online').length;

        const uniqueDevices = new Set<number>();
        cables.forEach(c => {
            uniqueDevices.add(c.object_component_id);
            if (c.connected_to_object_id) {
                uniqueDevices.add(c.connected_to_object_id);
            }
        });

        return {
            totalRuns: Array.from(new Set(cables.map(c => c.cable_id))).length,
            activeLinks,
            devicesLinked: uniqueDevices.size
        };
    }, [cables]);

    // Group cables by cable_id to show bidirectional links as a single row
    const groupedCables = useMemo(() => {
        if (!cables) return [];

        const groups = new Map<string, typeof cables>();
        cables.forEach(cable => {
            if (!groups.has(cable.cable_id)) {
                groups.set(cable.cable_id, []);
            }
            groups.get(cable.cable_id)!.push(cable);
        });

        return Array.from(groups.values());
    }, [cables]);

    if (error) {
        return (
            <div className="flex justify-center flex-col items-center h-48 opacity-50 p-6">
                <Typography className="mb-2 text-red-500 font-bold">Error loading cable topology</Typography>
            </div>
        );
    }

    const cleanPortName = (name: string) => {
        if (!name) return '';
        const index = name.indexOf(':');
        return index > -1 ? name.substring(index + 1) : name;
    };

    return (
        <Box className="w-full flex flex-col p-6 animate-fade-in bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex flex-col mb-6">
                <Typography variant="h6" className="font-extrabold text-gray-800 dark:text-gray-100 tracking-tight">Cable Topology</Typography>
                <Typography variant="body2" className="text-gray-500 dark:text-gray-400 font-bold text-[11px] tracking-widest uppercase mt-0.5">
                    {stats.totalRuns} Cable {stats.totalRuns === 1 ? 'Run' : 'Runs'} Registered on this Floor
                </Typography>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                    <Paper elevation={0} className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                            <LinkIcon fontSize="small" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold tracking-wider text-blue-500 uppercase">Total Runs</span>
                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100 leading-none mt-1">{isFetching ? '...' : stats.totalRuns}</span>
                        </div>
                    </Paper>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
                    <Paper elevation={0} className="p-4 rounded-xl border border-green-100 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/10 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                            <CheckCircleIcon fontSize="small" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold tracking-wider text-green-600 uppercase">Active Links</span>
                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100 leading-none mt-1">{isFetching ? '...' : stats.activeLinks}</span>
                        </div>
                    </Paper>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
                    <Paper elevation={0} className="p-4 rounded-xl border border-orange-100 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-900/10 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400">
                            <DevicesIcon fontSize="small" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold tracking-wider text-orange-600 uppercase">Devices Linked</span>
                            <span className="text-2xl font-black text-gray-800 dark:text-gray-100 leading-none mt-1">{isFetching ? '...' : stats.devicesLinked}</span>
                        </div>
                    </Paper>
                </motion.div>
            </div>

            {/* List Row */}
            <div className="flex flex-col gap-3 pb-4">
                {isFetching && !cables?.length ? (
                    <div className="py-8 text-center opacity-50"><Typography variant="body2" className="animate-pulse font-bold tracking-wider">LOADING TOPOLOGY...</Typography></div>
                ) : cables?.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center opacity-50 flex items-center justify-center">
                        <Typography variant="body2" className="font-bold text-gray-500 uppercase tracking-widest">No Links Established</Typography>
                    </div>
                ) : (
                    groupedCables.map((cableGroup, idx) => {
                        const primaryCable = cableGroup[0]; // Use the first cable for primary details

                        return (
                            <motion.div key={primaryCable.cable_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.05 }}>
                                <Paper elevation={0} className="w-full flex items-center p-0 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/50 group">
                                    {/* Cable ID Column */}
                                    <div className="w-48 shrink-0 bg-gray-50/50 dark:bg-gray-800/80 p-4 border-r border-gray-100 dark:border-gray-700 flex flex-col justify-center h-full">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">CABLE ID</span>
                                        <Typography variant="body2" className="font-mono font-bold text-blue-700 dark:text-blue-400">{primaryCable.cable_id}</Typography>
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${primaryCable.status?.toLowerCase() === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                            <span className="text-[10px] uppercase font-bold text-gray-500">{primaryCable.status || 'UNKNOWN'}</span>
                                        </div>
                                    </div>

                                    {/* Flow Track */}
                                    <div className="flex-1 flex items-center justify-between p-4 px-6 gap-6 min-w-0">
                                        {/* Source */}
                                        <div className="flex-1 min-w-0 bg-blue-50/30 dark:bg-blue-900/10 border py-3 px-4 border-blue-100 dark:border-blue-800/30 rounded-lg flex flex-col relative overflow-hidden group-hover:bg-blue-50/80 transition-colors">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-1.5">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> SOURCE DEVICE
                                            </span>
                                            <Typography variant="body2" className="font-bold text-gray-800 dark:text-gray-100 truncate" title={primaryCable.object_component.item_alias_id || primaryCable.object_component.item_name}>
                                                {primaryCable.object_component.item_alias_id || primaryCable.object_component.item_name}
                                            </Typography>
                                            <div className="flex gap-2 flex-wrap mt-1">
                                                <span className="text-[11px] font-mono text-gray-500 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded shadow-sm border border-gray-100 dark:border-gray-700">Port: {cleanPortName(primaryCable.port_name)}</span>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex flex-col items-center shrink-0 px-2 opacity-50">
                                            {cableGroup.length > 1 ? (
                                                <div className="flex items-center text-gray-400 gap-1">
                                                    <ArrowRightIcon fontSize="small" className="rotate-180" />
                                                    <ArrowRightIcon fontSize="small" />
                                                </div>
                                            ) : (
                                                <ArrowRightIcon fontSize="small" className="text-gray-400" />
                                            )}
                                            <span className="text-[8px] font-bold tracking-widest uppercase text-gray-400 mt-1">SIGNAL FLOW</span>
                                        </div>

                                        {/* Sink */}
                                        <div className="flex-1 min-w-0 bg-green-50/30 dark:bg-green-900/10 border py-3 px-4 border-green-100 dark:border-green-800/30 rounded-lg flex flex-col relative overflow-hidden group-hover:bg-green-50/80 transition-colors">
                                            {primaryCable.connected_to_object ? (
                                                <>
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400"></div>
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-1.5 mb-1.5">
                                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> TARGET DEVICE
                                                    </span>
                                                    <Typography variant="body2" className="font-bold text-gray-800 dark:text-gray-100 truncate" title={primaryCable.connected_to_object.item_alias_id || primaryCable.connected_to_object.item_name}>
                                                        {primaryCable.connected_to_object.item_alias_id || primaryCable.connected_to_object.item_name}
                                                    </Typography>
                                                    {cableGroup.length > 1 && cableGroup[1].port_name && (
                                                        <div className="flex gap-2 flex-wrap mt-1">
                                                            <span className="text-[11px] font-mono text-gray-500 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded shadow-sm border border-gray-100 dark:border-gray-700">Port: {cleanPortName(cableGroup[1].port_name)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> UNLINKED TARGET
                                                    </span>
                                                    <Typography variant="body2" className="font-medium text-amber-600 dark:text-amber-500 italic">No Target Object Configured</Typography>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* System Type Label */}
                                    <div className="shrink-0 pr-6">
                                        <Chip size="small" label={primaryCable.object_component.system_type} className="font-bold text-[10px] bg-gray-100 dark:bg-gray-800" />
                                    </div>
                                </Paper>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </Box>
    );
};
