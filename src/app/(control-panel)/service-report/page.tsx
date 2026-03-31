'use client';
import { FC, useState, useRef } from 'react';
import { 
    Typography, Paper, Box, Button, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, 
    CircularProgress, Chip, Grid, MenuItem, Select, FormControl, 
    InputLabel, useTheme, Checkbox, FormControlLabel,
    Card, CardMedia, Divider, Table, TableBody, TableCell, 
    TableContainer, TableRow, TableHead
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useProject } from '@/context/ProjectContext';
import { 
    useServiceReports, useAddServiceReport, 
    useUpdateServiceReport, useDeleteServiceReport, 
    useDeleteServicePhoto, ServiceReport 
} from './serviceApi';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/utils/api';

const SERVICE_TYPES = [
    'New installation', 'Equipment breakdown', 'Fire Panel',
    'Routine maintenance', 'Air conditioning', 'Water Leak',
    'Service & Repair', 'CCTV', 'Main switchboard',
    'Testing & commissioning', 'Generator', 'Network Equipment',
    'Others'
];

const ServiceReportPage: FC = () => {
    const theme = useTheme();
    const { activeProjectId } = useProject();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingReport, setEditingReport] = useState<ServiceReport | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [photoRemarks, setPhotoRemarks] = useState<string[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        company_name: '',
        address: '',
        contact_person: '',
        telephone_no: '',
        taken_by: '',
        date_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        service_types: [] as string[],
        service_type_others_text: '',
        description: '',
        service_summary: [''] as string[],
        summary_date: format(new Date(), 'yyyy-MM-dd'),
        summary_time: format(new Date(), 'HH:mm'),
    });

    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

    const { data: reports = [], isLoading } = useServiceReports(activeProjectId);
    const addMutation = useAddServiceReport();
    const updateMutation = useUpdateServiceReport();
    const deleteMutation = useDeleteServiceReport();
    const deletePhotoMutation = useDeleteServicePhoto();

    const handleOpenForm = (report?: ServiceReport) => {
        if (report) {
            setEditingReport(report);
            setFormData({
                company_name: report.company_name || '',
                address: report.address || '',
                contact_person: report.contact_person || '',
                telephone_no: report.telephone_no || '',
                taken_by: report.taken_by || '',
                date_time: report.date_time.slice(0, 16),
                service_types: report.service_types || [],
                service_type_others_text: report.service_type_others_text || '',
                description: report.description || '',
                service_summary: report.service_summary || [''],
                summary_date: report.summary_date ? report.summary_date.split('T')[0] : '',
                summary_time: report.summary_time || '',
            });
        } else {
            setEditingReport(null);
            setFormData({
                company_name: '',
                address: '',
                contact_person: '',
                telephone_no: '',
                taken_by: '',
                date_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                service_types: [],
                service_type_others_text: '',
                description: '',
                service_summary: [''],
                summary_date: format(new Date(), 'yyyy-MM-dd'),
                summary_time: format(new Date(), 'HH:mm'),
            });
        }
        setSelectedPhotos([]);
        setPhotoPreviews([]);
        setPhotoRemarks([]);
        setView('form');
    };

    const renderPrintLayout = () => {
        const data = editingReport || { ...formData, service_report_no: 'DRAFT', photos: [] };
        return (
            <div className="bg-white text-black font-sans mx-auto print:max-w-none print:w-full min-h-0 flex flex-col pt-8 print:pt-0 transform print:scale-[0.98] origin-top">
                {/* Formal Header */}
                <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-8">
                    <div>
                        <Typography className="text-3xl font-black uppercase tracking-tight leading-none text-slate-800">Service Report</Typography>
                        <Typography className="text-xs font-bold mt-1.5 uppercase text-slate-500 tracking-widest">Official Service & Maintenance Record</Typography>
                    </div>
                    <div className="text-right">
                        <Typography className="text-xl font-black uppercase tracking-widest text-slate-800">{data.service_report_no || 'SR-DRAFT'}</Typography>
                        <Typography className="text-[10px] font-bold uppercase mt-1.5 text-slate-500 tracking-widest">Date: {format(new Date(data.date_time), 'dd/MM/yyyy')}</Typography>
                    </div>
                </div>

                {/* Section 1: General Info */}
                <table className="w-full border-collapse border border-slate-800 mb-8 text-sm">
                    <tbody>
                        <tr>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold w-1/4 uppercase text-[10px] tracking-wider text-slate-600">Client Company</td>
                            <td className="border border-slate-800 p-2.5 font-semibold text-slate-900" colSpan={3}>{data.company_name || 'Individual Client'}</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold w-1/4 uppercase text-[10px] tracking-wider text-slate-600">Address</td>
                            <td className="border border-slate-800 p-2.5 font-semibold text-slate-900" colSpan={3}>{data.address || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold w-1/4 uppercase text-[10px] tracking-wider text-slate-600">Contact Person</td>
                            <td className="border border-slate-800 p-2.5 w-1/4 font-semibold text-slate-900">{data.contact_person || 'N/A'}</td>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold w-1/4 uppercase text-[10px] tracking-wider text-slate-600">Telephone No</td>
                            <td className="border border-slate-800 p-2.5 w-1/4 font-semibold text-slate-900">{data.telephone_no || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold uppercase text-[10px] tracking-wider text-slate-600">Service Category</td>
                            <td className="border border-slate-800 p-2.5 font-semibold text-slate-900" colSpan={3}>
                                {data.service_types?.join(' | ')}
                                {data.service_types?.includes('OTHERS') && data.service_type_others_text && ` (${data.service_type_others_text})`}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold w-1/4 uppercase text-[10px] tracking-wider text-slate-600">Taken By</td>
                            <td className="border border-slate-800 p-2.5 font-semibold uppercase text-slate-900" colSpan={3}>{data.taken_by || '-'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Section 2: Details */}
                <div className="border border-slate-800 mb-8">
                    <div className="border-b border-slate-800 p-2 bg-slate-50 font-bold uppercase text-[10px] tracking-widest text-slate-600">General Job Description</div>
                    <div className="p-5 min-h-[100px] text-sm whitespace-pre-wrap font-semibold leading-relaxed text-slate-800">
                        {data.description || 'No job description provided.'}
                    </div>
                </div>

                {/* Section 3: Chronological Steps */}
                <div className="border border-slate-800 mb-8 flex-1">
                    <div className="border-b border-slate-800 p-2 bg-slate-50 font-bold uppercase text-[10px] tracking-widest text-slate-600">Chronological Service Steps & Resolution</div>
                    <table className="w-full border-collapse text-sm">
                        <tbody>
                            {data.service_summary.map((step, i) => (
                                <tr key={i}>
                                    <td className="border-b border-r border-slate-800 p-2.5 font-bold w-12 text-center text-[10px] text-slate-500">{i+1}</td>
                                    <td className="border-b border-slate-800 p-2.5 font-medium leading-relaxed text-slate-800">{step}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Appendix: Photos */}
                {data.photos && data.photos.length > 0 && (
                    <div className="mt-8 page-break-before">
                        <div className="border border-slate-800 p-2 bg-slate-50 font-bold uppercase text-[10px] tracking-widest text-slate-600 mb-6">Appendix: Photo Evidence</div>
                        <div className="grid grid-cols-2 gap-6">
                            {data.photos.map((photo, i) => (
                                <div key={i} className="border border-slate-300 p-1 flex flex-col bg-slate-50 rounded-sm">
                                    <div className="h-[300px] w-full bg-white border border-slate-200">
                                        <img src={photo.id ? `${API_BASE_URL}/storage/${photo.photo_path}` : photoPreviews[i]} className="w-full h-full object-contain" alt="Appendix" />
                                    </div>
                                    <div className="mt-3 text-[10px] font-bold uppercase text-center text-slate-600 tracking-wider">
                                        " {photo.id ? (photo.caption || `Figure ${i + 1}`) : (photoRemarks[i] || `New Image ${i + 1}`)} "
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 min-h-[40px]"></div>

                {/* Verified By */}
                <div className="mt-16 pt-10 border-t-2 border-slate-800 grid grid-cols-2 gap-16">
                    <div>
                        <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8">Representative Authorization:</Typography>
                        <div className="border-b border-slate-800 pb-2 mb-2">
                            <Typography className="text-sm font-black uppercase text-slate-800">{data.taken_by || '___________________________'}</Typography>
                        </div>
                        <Typography className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Assigned Engineer</Typography>
                    </div>
                    <div className="text-right">
                        <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8">Client / Receiver Acknowledgment:</Typography>
                        <div className="border-b border-slate-800 pb-2 mb-2">
                            <Typography className="text-sm font-black uppercase italic text-slate-800">___________________________</Typography>
                        </div>
                        <Typography className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Date: _________________</Typography>
                    </div>
                </div>
            </div>
        );
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedPhotos(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPhotoPreviews(prev => [...prev, ...newPreviews]);
            setPhotoRemarks(prev => [...prev, ...files.map(() => '')]);
        }
    };

    const addSummaryStep = () => {
        setFormData(prev => ({ ...prev, service_summary: [...prev.service_summary, ''] }));
    };

    const updateSummaryStep = (index: number, val: string) => {
        const newSummary = [...formData.service_summary];
        newSummary[index] = val;
        setFormData(prev => ({ ...prev, service_summary: newSummary }));
    };

    const removeSummaryStep = (index: number) => {
        if (formData.service_summary.length <= 1) return;
        setFormData(prev => ({ ...prev, service_summary: prev.service_summary.filter((_, i) => i !== index) }));
    };

    const handleSave = async () => {
        if (!activeProjectId) return;

        // Frontend Validation
        if (formData.service_types.length === 0) {
            enqueueSnackbar('Please select at least one Service Category', { variant: 'warning' });
            return;
        }

        if (formData.service_summary.filter(s => s.trim()).length === 0) {
            enqueueSnackbar('Please add at least one line of Service Summary', { variant: 'warning' });
            return;
        }

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => data.append(`${key}[]`, v));
            } else {
                data.append(key, value || '');
            }
        });
        
        data.append('project_id', activeProjectId.toString());
        selectedPhotos.forEach((p, index) => {
            data.append('photos[]', p);
            data.append(`photo_remarks[${index}]`, photoRemarks[index] || '');
        });

        try {
            if (editingReport) {
                await updateMutation.mutateAsync({ id: editingReport.id, formData: data });
                enqueueSnackbar('Service Report Updated Successfully', { variant: 'success' });
            } else {
                await addMutation.mutateAsync(data);
                enqueueSnackbar('Service Report Submitted Successfully', { variant: 'success' });
            }
            setView('list');
        } catch (error: any) {
            console.error('[ServiceReport] Save error:', error);
            let msg = 'Error saving report';
            
            if (error?.response?.status === 422) {
                try {
                    const errorData = await error.response.json();
                    if (errorData.errors) {
                        const firstError = Object.values(errorData.errors)[0] as string[];
                        msg = `Validation Error: ${firstError[0]}`;
                    } else {
                        msg = errorData.message || 'Validation failed. Please check all required fields.';
                    }
                } catch (e) {
                    msg = 'Incomplete form. Please check Service Types and Summary.';
                }
            } else if (error?.message) {
                msg = error.message;
            }
            
            enqueueSnackbar(msg, { 
                variant: 'error', 
                autoHideDuration: 6000,
                style: { whiteSpace: 'pre-wrap' }
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this service report?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            enqueueSnackbar('Deleted', { variant: 'info' });
        } catch (error) {
            enqueueSnackbar('Failed', { variant: 'error' });
        }
    };

    const handleDeletePhoto = async (photoId: number) => {
        if (!editingReport) return;
        try {
            await deletePhotoMutation.mutateAsync({ reportId: editingReport.id, photoId });
            setEditingReport(prev => prev ? {
                ...prev,
                photos: prev.photos.filter(p => p.id !== photoId)
            } : null);
            enqueueSnackbar('Photo removed', { variant: 'success' });
        } catch (e) {
            enqueueSnackbar('Failed to delete photo', { variant: 'error' });
        }
    };

    const pdfImportInputRef = useRef<HTMLInputElement>(null);

    const handleImportPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeProjectId) return;

        try {
            enqueueSnackbar('Parsing PDF...', { variant: 'info' });
            const { extractTextFromPdf } = await import('@/utils/pdfParser');
            const text = await extractTextFromPdf(file);

            const extractBetween = (startLabel: string, endLabel: string, defaultVal = '') => {
                const startIndex = text.indexOf(startLabel);
                if (startIndex === -1) return defaultVal;
                const contentStart = startIndex + startLabel.length;
                const endIndex = text.indexOf(endLabel, contentStart);
                if (endIndex === -1) return text.substring(contentStart, contentStart + 100).trim() || defaultVal;
                return text.substring(contentStart, endIndex).trim();
            };

            const clientCompany = extractBetween('Client Company', 'Address', 'Unknown Client');
            const address = extractBetween('Address', 'Date', 'Unknown Address');
            const generalDescription = extractBetween('General Job Description', 'Chronological Service Steps', 'Imported Description');
            
            let blocks = extractBetween('Chronological Service Steps & Resolution', 'Representative Authorization', 'Checked System.');
            const steps = blocks.split('\n').filter(s=>s.trim() && s.length > 2).map(s => s.replace(/^\d+\s/, '').trim());
            if (steps.length === 0) steps.push('Service completed.');

            const parsedData = {
                company_name: clientCompany.length > 50 ? 'Imported Client' : clientCompany,
                address: address.length > 150 ? 'Imported Address' : address,
                date_time: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"), // fallback
                service_types: ["OTHERS"],
                description: generalDescription.length > 500 ? 'Imported from PDF' : generalDescription,
                service_summary: steps.slice(0, 10), // Limit array length
                taken_by: 'System Auto Import',
            };

            setEditingReport(null);
            setFormData({
                company_name: parsedData.company_name,
                address: parsedData.address,
                contact_person: '',
                telephone_no: '',
                taken_by: parsedData.taken_by,
                date_time: parsedData.date_time,
                service_types: parsedData.service_types,
                service_type_others_text: 'PDF AUTO IMPORT',
                description: parsedData.description,
                service_summary: parsedData.service_summary as string[],
                summary_date: format(new Date(), 'yyyy-MM-dd'),
                summary_time: format(new Date(), 'HH:mm'),
            });
            setSelectedPhotos([]);
            setPhotoPreviews([]);
            setPhotoRemarks([]);
            setView('form');
            
            enqueueSnackbar('PDF extracted! Please review the form before saving.', { variant: 'success' });
            if (pdfImportInputRef.current) pdfImportInputRef.current.value = '';
        } catch (err) {
            console.error(err);
            enqueueSnackbar('Failed to extract and save PDF data.', { variant: 'error' });
            if (pdfImportInputRef.current) pdfImportInputRef.current.value = '';
        }
    };

    if (isLoading) return <Box className="flex justify-center p-20"><CircularProgress color="secondary" /></Box>;

    return (
        <div className="w-full min-h-screen bg-slate-100 dark:bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {view === 'list' ? (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4 uppercase italic">
                                        <div className="w-12 h-12 bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center rounded-2xl shadow-xl">
                                            <FuseSvgIcon size={28}>heroicons-outline:wrench-screwdriver</FuseSvgIcon>
                                        </div>
                                        Service Registry
                                    </h1>
                                    <p className="text-slate-500 font-black ml-16 mt-1 tracking-widest text-[10px] uppercase underline decoration-indigo-500 decoration-2 underline-offset-4">Technical Service Record Archive</p>
                                </div>
                                <div className="flex gap-4">
                                    <input 
                                        type="file" 
                                        accept="application/pdf" 
                                        style={{ display: 'none' }} 
                                        ref={pdfImportInputRef} 
                                        onChange={handleImportPdf} 
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={() => pdfImportInputRef.current?.click()}
                                        className="bg-white hover:bg-slate-50 text-slate-800 rounded-2xl px-8 py-4 font-black shadow-sm uppercase tracking-widest text-[10px] border border-slate-300"
                                        startIcon={<FuseSvgIcon size={18}>heroicons-outline:document-arrow-up</FuseSvgIcon>}
                                    >
                                        Import PDF
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleOpenForm()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-10 py-4 font-black shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-xs"
                                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
                                    >
                                        New Service Job
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {reports.map(report => (
                                    <Card key={report.id} className="rounded-[2.5rem] bg-white border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all">
                                        <div className="p-8">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="px-5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-black tracking-widest border border-indigo-100 uppercase">
                                                    {report.service_report_no}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingReport(report); setTimeout(() => window.print(), 100); }} className="text-slate-400 hover:bg-slate-100"><FuseSvgIcon size={18}>heroicons-outline:printer</FuseSvgIcon></IconButton>
                                                    <IconButton size="small" onClick={() => handleOpenForm(report)} className="text-indigo-500 bg-indigo-50"><FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon></IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(report.id)} className="text-rose-500 bg-rose-50"><FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon></IconButton>
                                                </div>
                                            </div>
                                            <Typography className="text-2xl font-black mb-1 italic truncate">{report.company_name || 'Individual Client'}</Typography>
                                            <Typography className="text-[10px] uppercase font-black text-slate-400 mb-6 tracking-widest line-clamp-1">{report.address}</Typography>
                                            <Divider className="mb-6 opacity-30" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Typography className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</Typography>
                                                    <Typography className="text-xs font-black">{format(new Date(report.date_time), 'dd MMM yyyy')}</Typography>
                                                </div>
                                                <div>
                                                    <Typography className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</Typography>
                                                    <Typography className="text-xs font-black">{format(new Date(report.date_time), 'HH:mm')}</Typography>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                            <Paper className="rounded-[4rem] border border-slate-200 shadow-3xl overflow-hidden mb-10 bg-white">
                                <Box className="bg-slate-900 p-12 text-white flex justify-between items-center border-b-[6px] border-indigo-500">
                                    <div className="flex-1">
                                        <Typography className="text-5xl font-black tracking-tighter uppercase italic tracking-[-0.05em]">Service Report</Typography>
                                        <Typography className="text-indigo-400 font-bold tracking-[0.3em] text-[11px] uppercase mt-2">Kinetic Motion Performance Documentation</Typography>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Print Button */}
                                        <Button
                                            variant="outlined"
                                            startIcon={<FuseSvgIcon size={20}>heroicons-outline:printer</FuseSvgIcon>}
                                            onClick={() => window.print()}
                                            className="rounded-xl border-slate-700 text-white hover:bg-slate-800 font-black px-6"
                                        >
                                            Print PDF
                                        </Button>

                                        {editingReport && (
                                            <div className="text-right border-l border-slate-700 pl-4 hidden sm:block">
                                                <Typography className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Identity</Typography>
                                                <Typography className="text-3xl font-black text-indigo-500">{editingReport.service_report_no}</Typography>
                                            </div>
                                        )}
                                        <IconButton onClick={() => setView('list')} className="bg-slate-800 text-white hover:bg-rose-500 transition-colors">
                                            <FuseSvgIcon size={28}>heroicons-outline:x-mark</FuseSvgIcon>
                                        </IconButton>
                                    </div>
                                </Box>

                                <div className="p-12 space-y-16">
                                    {/* Section 1: Client Info */}
                                    <div>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">01</div>
                                            <Typography className="text-2xl font-black uppercase italic tracking-tight underline decoration-indigo-500 underline-offset-8">Client Identification</Typography>
                                        </div>
                                        <Grid container spacing={5}>
                                            <Grid size={{ xs: 12, md: 6 }}><TextField label="Company Name" fullWidth value={formData.company_name} onChange={e=>setFormData({...formData, company_name: e.target.value})} slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 800 } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 6 }}><TextField label="Service Location / Address" fullWidth value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 800 } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 3 }}><TextField label="Contact Person" fullWidth value={formData.contact_person} onChange={e=>setFormData({...formData, contact_person: e.target.value})} slotProps={{ input: { sx: { borderRadius: '16px' } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 3 }}><TextField label="Telephone No" fullWidth value={formData.telephone_no} onChange={e=>setFormData({...formData, telephone_no: e.target.value})} slotProps={{ input: { sx: { borderRadius: '16px' } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 3 }}><TextField label="Taken By *" fullWidth value={formData.taken_by} onChange={e=>setFormData({...formData, taken_by: e.target.value})} slotProps={{ input: { sx: { borderRadius: '16px' } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 3 }}><TextField label="Date & Time *" type="datetime-local" fullWidth value={formData.date_time} onChange={e=>setFormData({...formData, date_time: e.target.value})} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 900 } } }} /></Grid>
                                        </Grid>
                                    </div>

                                    {/* Section 2: Type of Services */}
                                    <div>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">02</div>
                                            <Typography className="text-2xl font-black uppercase italic tracking-tight underline decoration-indigo-500 underline-offset-8">Type of Services *</Typography>
                                        </div>
                                        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {SERVICE_TYPES.map(type => (
                                                <FormControlLabel
                                                    key={type}
                                                    control={<Checkbox checked={formData.service_types.includes(type)} onChange={e => {
                                                        const nt = e.target.checked ? [...formData.service_types, type] : formData.service_types.filter(v => v !== type);
                                                        setFormData({...formData, service_types: nt});
                                                    }} color="secondary" />}
                                                    label={<Typography className="text-xs font-black uppercase text-slate-600">{type}</Typography>}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Section 3: Job Description */}
                                    <div className="space-y-12">
                                        <TextField label="General Job Description" multiline rows={4} fullWidth value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} slotProps={{ input: { sx: { borderRadius: '32px', padding: '24px' } } }} />
                                        
                                        <div>
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">03</div>
                                                    <Typography className="text-2xl font-black uppercase italic tracking-tight underline decoration-indigo-500 underline-offset-8">Service Summary *</Typography>
                                                </div>
                                                <Button onClick={addSummaryStep} variant="outlined" className="rounded-xl font-black" startIcon={<FuseSvgIcon>heroicons-outline:plus-circle</FuseSvgIcon>}>Add Step</Button>
                                            </div>
                                            <div className="space-y-4">
                                                {formData.service_summary.map((step, i) => (
                                                    <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-4 fade-in">
                                                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black flex-shrink-0">{i + 1}</div>
                                                        <TextField fullWidth placeholder={`Step ${i+1} details...`} value={step} onChange={e => updateSummaryStep(i, e.target.value)} variant="standard" slotProps={{ input: { sx: { fontWeight: 600 } } }} />
                                                        <IconButton onClick={() => removeSummaryStep(i)} className="text-slate-300 hover:text-rose-500"><FuseSvgIcon size={18}>heroicons-outline:x-circle</FuseSvgIcon></IconButton>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 4: Photo Documentation */}
                                    <div>
                                        <div className="flex justify-between items-center mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">04</div>
                                                <Typography className="text-2xl font-black uppercase italic tracking-tight">Visual Appendix</Typography>
                                            </div>
                                            <Button onClick={() => fileInputRef.current?.click()} variant="contained" className="bg-slate-900 border-2 rounded-2xl py-3 px-8 font-black">Open Camera/Upload</Button>
                                            <input type="file" hidden multiple ref={fileInputRef} onChange={handlePhotoChange} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {editingReport?.photos.map(p => (
                                                <div key={p.id} className="space-y-4">
                                                    <div 
                                                        onClick={() => setLightboxImage(`${API_BASE_URL}/storage/${p.photo_path}`)}
                                                        className="relative group rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white h-[500px] cursor-zoom-in"
                                                    >
                                                        <CardMedia 
                                                            component="img" 
                                                            image={`${API_BASE_URL}/storage/${p.photo_path}`} 
                                                            className="h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all bg-gradient-to-t from-slate-900/80 to-transparent">
                                                            <IconButton onClick={(e)=>{ e.stopPropagation(); handleDeletePhoto(p.id); }} className="bg-rose-500 text-white p-4 shadow-xl">
                                                                <FuseSvgIcon size={28}>heroicons-outline:trash</FuseSvgIcon>
                                                            </IconButton>
                                                        </div>
                                                    </div>
                                                    {p.caption && (
                                                        <Box className="px-8 py-4 bg-indigo-50 rounded-3xl border border-indigo-100 italic">
                                                            <Typography className="text-sm font-black text-indigo-900 tracking-tight">" {p.caption} "</Typography>
                                                        </Box>
                                                    )}
                                                </div>
                                            ))}
                                            {photoPreviews.map((p, i) => (
                                                <div key={i} className="space-y-4">
                                                    <div 
                                                        onClick={() => setLightboxImage(p)}
                                                        className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-dashed border-indigo-400 h-[500px] animate-pulse cursor-zoom-in"
                                                    >
                                                        <CardMedia component="img" image={p} className="h-full object-cover opacity-80" />
                                                        <div className="absolute top-6 right-6 bg-indigo-600 text-white px-5 py-2 rounded-full text-[10px] font-black tracking-widest shadow-lg">NEW SESSION EVIDENCE</div>
                                                    </div>
                                                    <TextField
                                                        placeholder="Add specific job remark for this photo..."
                                                        fullWidth
                                                        value={photoRemarks[i]}
                                                        onChange={(e) => {
                                                            const nr = [...photoRemarks];
                                                            nr[i] = e.target.value;
                                                            setPhotoRemarks(nr);
                                                        }}
                                                        slotProps={{ input: { sx: { borderRadius: '24px', fontWeight: 700 } } }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Final Verification Section */}
                                    <Box className="p-12 border-4 border-slate-900 rounded-[4rem] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <FuseSvgIcon size={150}>heroicons-outline:check-badge</FuseSvgIcon>
                                        </div>
                                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                                            <div>
                                                <Typography className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-10">Job Summary Signature</Typography>
                                                <TextField label="Date" type="date" value={formData.summary_date} onChange={e=>setFormData({...formData, summary_date: e.target.value})} fullWidth variant="standard" />
                                            </div>
                                            <div>
                                                <Typography className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-10">Verification Time</Typography>
                                                <TextField label="Time" type="time" value={formData.summary_time} onChange={e=>setFormData({...formData, summary_time: e.target.value})} fullWidth variant="standard" />
                                            </div>
                                            <div className="flex flex-col justify-end">
                                                <Typography className="text-sm font-black italic text-indigo-600 mb-2">Certified Documentation</Typography>
                                                <Divider className="border-slate-900 border-2" />
                                            </div>
                                        </div>
                                    </Box>

                                    <div className="flex justify-end gap-4 pt-10">
                                        <Button onClick={() => setView('list')} className="rounded-2xl px-12 py-5 font-black text-slate-400 text-xs uppercase tracking-widest">Discard Form</Button>
                                        <Button onClick={handleSave} variant="contained" className="bg-indigo-600 rounded-3xl px-20 py-5 font-black text-white shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest text-lg">
                                            {addMutation.isPending || updateMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Finalize & Archive Report'}
                                        </Button>
                                    </div>
                                </div>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Lightbox Dialog */}
            <Dialog
                fullScreen
                open={!!lightboxImage}
                onClose={() => setLightboxImage(null)}
                PaperProps={{
                    sx: { bgcolor: 'rgba(15, 23, 42, 0.98)', color: 'white' }
                }}
            >
                <div className="relative w-full h-full flex items-center justify-center p-12">
                    <IconButton 
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-10 right-10 text-white bg-white/10 hover:bg-white/20 p-4"
                    >
                        <FuseSvgIcon size={40}>heroicons-outline:x-mark</FuseSvgIcon>
                    </IconButton>
                    <motion.img 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={lightboxImage || ''} 
                        className="max-w-full max-h-full object-contain rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                        alt="Service Documentation Full"
                    />
                </div>
            </Dialog>

            {/* Hidden Print Layout */}
            <div id="print-service-report-container" className="hidden print:block bg-white min-h-screen">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        * { 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                            color-adjust: exact !important;
                        }
                        /* Hide navigation, sidebar, and other UI layers specifically */
                        header, nav, aside, [role="navigation"], .navbar, .sidebar { 
                            display: none !important; 
                        }

                        body * { visibility: hidden !important; }
                        #print-service-report-container, #print-service-report-container * { visibility: visible !important; }
                        #print-service-report-container { 
                            position: fixed !important; 
                            left: 0 !important; 
                            top: 0 !important; 
                            width: 100% !important;
                            height: auto !important;
                            display: block !important; 
                            margin: 0 !important;
                            padding: 15mm !important;
                            box-sizing: border-box !important;
                            background: white !important;
                            z-index: 9999999 !important;
                        }
                        @page { margin: 0; size: A4 portrait; }
                    }
                `}} />
                <div className="w-full">
                    {renderPrintLayout()}
                </div>
            </div>
        </div>
    );
};

export default ServiceReportPage;
