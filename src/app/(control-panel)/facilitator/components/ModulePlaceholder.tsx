import { FC } from 'react';
import { Typography, Paper, Box, alpha } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion } from 'motion/react';

const ModulePlaceholder: FC<{ title: string; icon: string; description: string }> = ({ title, icon, description }) => {
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full"
            >
                <Paper className="p-12 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center bg-white dark:!bg-slate-900">
                    <Box sx={{
                        width: 80, height: 80, borderRadius: '24px', mb: 4,
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 12px 32px rgba(99, 102, 241, 0.3)'
                    }}>
                        <FuseSvgIcon size={40} className="text-white">{icon}</FuseSvgIcon>
                    </Box>
                    <Typography className="text-4xl font-black text-slate-800 dark:text-white mb-4">
                        {title}
                    </Typography>
                    <Typography className="text-slate-500 font-medium text-lg leading-relaxed mb-8">
                        {description}
                    </Typography>
                    <Box sx={{
                        px: 3, py: 1.5, borderRadius: 'full',
                        bgcolor: alpha('#6366f1', 0.1),
                        border: '1px solid', borderColor: alpha('#6366f1', 0.2)
                    }}>
                        <Typography className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                            Facilitator Module · Development in Progress
                        </Typography>
                    </Box>
                </Paper>
            </motion.div>
        </div>
    );
};

export default ModulePlaceholder;
