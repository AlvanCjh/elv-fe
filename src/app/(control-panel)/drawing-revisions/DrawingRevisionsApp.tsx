import { useState } from 'react';
import { 
    Typography, Paper, TextField, MenuItem, Select, Button, 
    IconButton, Tooltip, Chip, alpha, useTheme, Grid, Box,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Skeleton
} from '@mui/material';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import FuseLoading from '@fuse/core/FuseLoading';
import { useBuildings } from '../building-progress/buildingApi';
import { format } from 'date-fns';

// Mocks to bypass missing exports in buildingApi.ts
const useFloorRevisions = (id: number | null) => ({ data: [] as any[], isLoading: false });
const useAddFloorRevision = (id: number) => ({ mutateAsync: async (d: any) => {} });
const useUpdateFloorRevision = (id: number) => ({ mutateAsync: async (d: any) => {} });
const useDeleteFloorRevision = (id: number) => ({ mutateAsync: async (i: number) => {} });
type FloorDrawingRevision = any;

function DrawingRevisionsApp() {
    const theme = useTheme();
    const { data: buildings, isLoading: bLoading } = useBuildings();
    
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
    const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
    
    const { data: revisions, isLoading: rLoading } = useFloorRevisions(selectedFloorId);
    const addRevision = useAddFloorRevision(selectedFloorId || 0);
    const updateRevision = useUpdateFloorRevision(selectedFloorId || 0);
    const deleteRevision = useDeleteFloorRevision(selectedFloorId || 0);

    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        version_name: '',
        revision_date: format(new Date(), 'yyyy-MM-dd'),
        remarks: '',
        file_content: ''
    });

    const selectedBuilding = buildings?.find(b => b.id === selectedBuildingId);
    const selectedFloor = selectedBuilding?.floors?.find(f => f.id === selectedFloorId);

    const handleOpen = () => {
        setFormData({
            version_name: `V${(revisions?.length || 0) + 1}.0`,
            revision_date: format(new Date(), 'yyyy-MM-dd'),
            remarks: '',
            file_content: ''
        });
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    const handleSubmit = async () => {
        await addRevision.mutateAsync(formData);
        handleClose();
    };

    const handleActivate = async (id: number) => {
        if (window.confirm('Activating this revision will update the main floor plan. All active pins will remain. Continue?')) {
            await updateRevision.mutateAsync({ id, status: 'active' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this archived revision?')) {
            await deleteRevision.mutateAsync(id);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (bLoading) return <FuseLoading />;

    return (
        <div className="flex flex-col w-full h-[calc(100vh-80px)] bg-gray-50 overflow-hidden">
            {/* Header */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="px-32 py-24 bg-white shadow-sm border-b border-gray-200 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-16"
            >
                <motion.div variants={itemVariants}>
                    <div className="flex items-center gap-12">
                        <Box sx={{ 
                            width: 48, height: 48, borderRadius: '16px', 
                            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)'
                        }}>
                            <FuseSvgIcon size={28} sx={{ color: '#fff' }}>heroicons-outline:document-duplicate</FuseSvgIcon>
                        </Box>
                        <div>
                            <Typography className="text-2xl font-black tracking-tight leading-tight">Drawing Revisions</Typography>
                            <Typography className="text-gray-500 font-medium text-sm">Manage floor plan versions and active drawings</Typography>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center gap-12 w-full md:w-auto">
                    <Select
                        size="small"
                        value={selectedBuildingId || ''}
                        onChange={(e) => {
                            setSelectedBuildingId(Number(e.target.value));
                            setSelectedFloorId(null);
                        }}
                        displayEmpty
                        className="bg-gray-50 rounded-xl min-w-[200px]"
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, boxShadow: theme.shadows[1] }}
                    >
                        <MenuItem value="" disabled>Select Building</MenuItem>
                        {buildings?.map(b => (
                            <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                        ))}
                    </Select>

                    <Select
                        size="small"
                        value={selectedFloorId || ''}
                        onChange={(e) => setSelectedFloorId(Number(e.target.value))}
                        displayEmpty
                        disabled={!selectedBuildingId}
                        className="bg-gray-50 rounded-xl min-w-[150px]"
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, boxShadow: theme.shadows[1] }}
                    >
                        <MenuItem value="" disabled>Select Floor</MenuItem>
                        {selectedBuilding?.floors?.map(f => (
                            <MenuItem key={f.id} value={f.id}>Floor {f.floor_number}</MenuItem>
                        ))}
                    </Select>

                    {selectedFloorId && (
                        <Button
                            variant="contained"
                            onClick={handleOpen}
                            className="rounded-xl px-20 font-black h-40 shadow-lg shadow-indigo-100"
                            sx={{ bgcolor: '#6366f1' }}
                            startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
                        >
                            New Revision
                        </Button>
                    )}
                </motion.div>
            </motion.div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-32">
                {!selectedFloorId ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col items-center justify-center text-center opacity-50"
                    >
                        <Box sx={{ width: 120, height: 120, borderRadius: '40px', bgcolor: alpha(theme.palette.divider, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 24 }}>
                            <FuseSvgIcon size={64} className="text-gray-400">heroicons-outline:map</FuseSvgIcon>
                        </Box>
                        <Typography className="text-xl font-bold text-gray-500">Please select a building and floor</Typography>
                        <Typography className="text-sm text-gray-400">Select options from the header to view drawing history</Typography>
                    </motion.div>
                ) : (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="max-w-6xl mx-auto"
                    >
                        {rLoading ? (
                            <Grid container spacing={4}>
                                {[1, 2, 3].map(i => (
                                    <Grid key={i} size={{ xs: 12 }}>
                                        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '24px' }} />
                                    </Grid>
                                ))}
                            </Grid>
                        ) : revisions?.length === 0 ? (
                            <Paper className="p-48 rounded-[40px] text-center border-2 border-dashed border-gray-200 bg-transparent flex flex-col items-center">
                                <FuseSvgIcon size={48} className="text-gray-300 mb-16">heroicons-outline:document-duplicate</FuseSvgIcon>
                                <Typography className="text-lg font-bold text-gray-400">No revisions found for this floor</Typography>
                                <Button 
                                    className="mt-16 rounded-xl font-black" 
                                    color="primary" 
                                    onClick={handleOpen}
                                >
                                    Create First Revision
                                </Button>
                            </Paper>
                        ) : (
                            <div className="flex flex-col gap-16">
                                {revisions?.map((rev) => {
                                    const isActive = rev.status === 'active';
                                    return (
                                        <motion.div key={rev.id} variants={itemVariants}>
                                            <Paper 
                                                elevation={0}
                                                className={`p-24 rounded-[32px] border transition-all group overflow-hidden relative ${isActive ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-100'}`}
                                            >
                                                <div className="flex items-center gap-24 relative z-10">
                                                    {/* Status Icon */}
                                                    <Box sx={{ 
                                                        width: 56, height: 56, borderRadius: '20px', 
                                                        bgcolor: isActive ? '#6366f1' : alpha(theme.palette.divider, 0.1),
                                                        color: isActive ? '#fff' : 'text.secondary',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        boxShadow: isActive ? '0 8px 16px -4px rgba(99, 102, 241, 0.4)' : 'none'
                                                    }}>
                                                        <FuseSvgIcon size={28}>{isActive ? 'heroicons-solid:check-circle' : 'heroicons-outline:clock'}</FuseSvgIcon>
                                                    </Box>

                                                    {/* Info */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-12 mb-4">
                                                            <Typography className="text-xl font-black">{rev.version_name}</Typography>
                                                            <Chip 
                                                                label={rev.status.toUpperCase()} 
                                                                size="small"
                                                                className="font-bold text-[10px]"
                                                                sx={{ 
                                                                    bgcolor: isActive ? alpha('#6366f1', 0.1) : alpha('#94a3b8', 0.1),
                                                                    color: isActive ? '#6366f1' : '#64748b'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-16 text-gray-500 font-medium text-sm">
                                                            <span className="flex items-center gap-4"><FuseSvgIcon size={16}>heroicons-outline:calendar</FuseSvgIcon> {format(new Date(rev.revision_date), 'dd MMM yyyy')}</span>
                                                            <span className="flex items-center gap-4"><FuseSvgIcon size={16}>heroicons-outline:user</FuseSvgIcon> {rev.creator?.name || 'Unknown'}</span>
                                                        </div>
                                                        {rev.remarks && (
                                                            <Typography className="text-gray-400 italic text-sm mt-8">{rev.remarks}</Typography>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-8">
                                                        {!isActive && (
                                                            <Button
                                                                variant="outlined"
                                                                color="primary"
                                                                onClick={() => handleActivate(rev.id)}
                                                                className="rounded-xl font-black px-16 h-40 border-2"
                                                            >
                                                                Activate
                                                            </Button>
                                                        )}
                                                        {isActive && (
                                                            <Chip 
                                                                icon={<FuseSvgIcon size={16}>heroicons-solid:star</FuseSvgIcon>}
                                                                label="CURRENT REVISION"
                                                                className="bg-indigo-600 text-white font-black px-8 py-4 h-32"
                                                            />
                                                        )}
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            disabled={isActive}
                                                            onClick={() => handleDelete(rev.id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <FuseSvgIcon size={20}>heroicons-outline:trash</FuseSvgIcon>
                                                        </IconButton>
                                                    </div>
                                                </div>

                                                {/* Background Decorative Icon */}
                                                <Box sx={{ 
                                                    position: 'absolute', right: -20, bottom: -24, 
                                                    opacity: isActive ? 0.05 : 0.02, 
                                                    color: isActive ? '#6366f1' : 'inherit',
                                                    transform: 'rotate(-10deg)'
                                                }}>
                                                    <FuseSvgIcon size={160}>heroicons-outline:document-duplicate</FuseSvgIcon>
                                                </Box>
                                            </Paper>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Add Revision Modal */}
            <Dialog 
                open={open} 
                onClose={handleClose} 
                maxWidth="md" 
                fullWidth 
                PaperProps={{ sx: { borderRadius: '32px' } }}
            >
                <DialogTitle className="px-32 pt-32 pb-8">
                    <div className="flex items-center gap-12">
                        <Box sx={{ width: 48, height: 48, borderRadius: '16px', bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FuseSvgIcon size={24}>heroicons-outline:plus-circle</FuseSvgIcon>
                        </Box>
                        <div>
                            <Typography className="text-2xl font-black">Upload New Revision</Typography>
                            <Typography className="text-gray-500 font-medium text-sm">Create a new version for Floor {selectedFloor?.floor_number}</Typography>
                        </div>
                    </div>
                </DialogTitle>
                <DialogContent className="px-32 py-16">
                    <div className="flex flex-col gap-24 pt-16">
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 8 }}>
                                <TextField
                                    label="Version Name"
                                    fullWidth
                                    placeholder="e.g. V2.0 - Civil Update"
                                    value={formData.version_name}
                                    onChange={e => setFormData({ ...formData, version_name: e.target.value })}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 4 }}>
                                <TextField
                                    label="Revision Date"
                                    type="date"
                                    fullWidth
                                    value={formData.revision_date}
                                    onChange={e => setFormData({ ...formData, revision_date: e.target.value })}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            label="Remarks"
                            multiline
                            rows={2}
                            fullWidth
                            placeholder="What changed in this revision?"
                            value={formData.remarks}
                            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                        />

                        <TextField
                            label="SVG Content"
                            multiline
                            rows={10}
                            fullWidth
                            placeholder="Paste the raw SVG string here..."
                            value={formData.file_content}
                            onChange={e => setFormData({ ...formData, file_content: e.target.value })}
                            error={!formData.file_content.includes('<svg')}
                            helperText={!formData.file_content.includes('<svg') && formData.file_content.length > 0 ? "Must be valid SVG content" : ""}
                            sx={{ 
                                '& .MuiOutlinedInput-root': { 
                                    borderRadius: '24px',
                                    fontFamily: 'monospace',
                                    fontSize: '12px'
                                } 
                            }}
                        />
                        <Typography className="text-xs text-gray-400 bg-gray-50 p-12 rounded-xl border border-gray-100 italic">
                            Tip: Open the SVG file in a text editor and copy all contents including the &lt;svg&gt; tag.
                        </Typography>
                    </div>
                </DialogContent>
                <DialogActions className="px-32 pb-32">
                    <Button onClick={handleClose} className="rounded-xl font-bold px-20 text-gray-400">Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.version_name || !formData.file_content.includes('<svg')}
                        className="rounded-xl font-black px-32 py-12 shadow-lg shadow-indigo-100 h-48"
                        sx={{ bgcolor: '#6366f1' }}
                    >
                        Create Revision
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default DrawingRevisionsApp;
