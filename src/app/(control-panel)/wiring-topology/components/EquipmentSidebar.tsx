import React from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { SettingsInputComponent as PortIcon, Router as SwitchIcon, SettingsInputComponent as PatchPanelIcon } from '@mui/icons-material';

export interface EquipmentTemplate {
    type: 'patch' | 'ethernet';
    name: string;
    icon: React.ReactNode;
}

const templates: EquipmentTemplate[] = [
    { type: 'patch', name: 'Patch Panel', icon: <PatchPanelIcon className="text-purple-400" /> },
    { type: 'ethernet', name: 'Ethernet Switch', icon: <SwitchIcon className="text-green-400" /> },
];

const EquipmentSidebar: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly }) => {
    const handleDragStart = (e: React.DragEvent, template: EquipmentTemplate) => {
        if (isReadOnly) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('equipmentTemplate', JSON.stringify(template));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <Box className="w-64 h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 flex flex-col gap-6">
            <div>
                <Typography variant="caption" className="font-black text-gray-400 uppercase tracking-widest block mb-4">
                    Equipment Library
                </Typography>
                <div className="flex flex-col gap-3">
                    {templates.map((template) => (
                        <Paper
                            key={template.type}
                            elevation={0}
                            draggable
                            onDragStart={(e) => handleDragStart(e, template)}
                            className="p-3 border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex items-center gap-3"
                        >
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                {template.icon}
                            </div>
                            <div>
                                <Typography variant="body2" className="font-bold text-gray-700 dark:text-gray-200">
                                    {template.name}
                                </Typography>
                                <Typography variant="caption" className="text-gray-400 block leading-tight">
                                    Drag into rack
                                </Typography>
                            </div>
                        </Paper>
                    ))}
                </div>
            </div>

            <div className="mt-auto p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <Typography variant="caption" className="text-blue-600 dark:text-blue-400 font-bold block mb-1">
                    Pro Tip
                </Typography>
                <Typography className="text-[10px] text-blue-700 dark:text-blue-300 leading-normal">
                    Drag equipment into the rack enclosure on the right to start building your layout.
                </Typography>
            </div>
        </Box>
    );
};

export default EquipmentSidebar;
