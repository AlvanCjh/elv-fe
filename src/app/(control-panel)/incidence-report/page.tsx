'use client';
import { FC, useState, useRef } from 'react';
import { 
    Typography, Paper, Box, Button, IconButton, Dialog, 
    DialogTitle, DialogContent, DialogActions, TextField, 
    CircularProgress, Chip, Grid, MenuItem, Select, FormControl, 
    InputLabel, useTheme, alpha, Checkbox, FormControlLabel,
    Card, CardMedia, Tooltip, Stack, Divider
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useProject } from '@/context/ProjectContext';
import { 
    useIncidentReports, useAddIncidentReport, 
    useUpdateIncidentReport, useDeleteIncidentReport, 
    useDeleteIncidentPhoto, IncidentReport 
} from './incidentApi';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/utils/api';

const INCIDENT_TYPES = [
    'EMSB', 'HSSD', 'NETWORK', 'OTHERS',
    'GENERATOR', 'WATER LEAK', 'CCTV',
    'AIRCON', 'UPS', 'FIRE SYSTEM'
];

const SCENARIOS = ['MINOR', 'MAJOR', 'CRITICAL'];

const IncidentReportPage: FC = () => {
    const theme = useTheme();
    const { activeProjectId } = useProject();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [photoRemarks, setPhotoRemarks] = useState<string[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        reported_by: '',
        report_date: format(new Date(), 'yyyy-MM-dd'),
        role_of_recorded: 'CUSTOMER SERVICE ENGINEER',
        incident_types: [] as string[],
        incident_type_others_text: '',
        affected_equipment: '',
        incident_location: 'DATA CENTRE',
        finding_date: format(new Date(), 'yyyy-MM-dd'),
        incident_scenario: 'MINOR',
        incident_description: '',
        specifications: '',
        inability: '',
        impact: '',
        operation: '',
        recommendations: '',
        replacement_capability: '',
        remarks: '',
        verified_by: '',
        verified_designation: 'Customer Service Engineer',
        verified_date: format(new Date(), 'yyyy-MM-dd'),
    });

    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

    const { data: incidents = [], isLoading } = useIncidentReports(activeProjectId);
    const addMutation = useAddIncidentReport();
    const updateMutation = useUpdateIncidentReport();
    const deleteMutation = useDeleteIncidentReport();
    const deletePhotoMutation = useDeleteIncidentPhoto();

    const renderPrintLayout = () => {
        const data = editingIncident || { ...formData, ir_no: 'DRAFT', photos: [] };
        return (
            <div className="bg-white text-black font-sans mx-auto print:max-w-none print:w-full min-h-0 flex flex-col pt-8 print:pt-0 transform print:scale-[0.98] origin-top">
                {/* Formal Header */}
                <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-8">
                    <div>
                        <Typography className="text-3xl font-black uppercase tracking-tight leading-none text-slate-800">Incidence Report</Typography>
                        <Typography className="text-xs font-bold mt-1.5 uppercase text-slate-500 tracking-widest">Official Maintenance & Safety Documentation</Typography>
                    </div>
                    <div className="text-right">
                        <Typography className="text-xl font-black uppercase tracking-widest text-slate-800">{data.ir_no || 'IR-N/A'}</Typography>
                        <Typography className="text-[10px] font-bold uppercase mt-1.5 text-slate-500 tracking-widest">Date: {format(new Date(data.report_date), 'dd/MM/yyyy')}</Typography>
                    </div>
                </div>

                {/* Section 1: General Info */}
                <table className="w-full border-collapse border border-slate-800 mb-8 text-sm">
                    <tbody>
                        <tr>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold w-1/4 uppercase text-[10px] tracking-wider text-slate-600">Reported By</td>
                            <td className="border border-slate-800 p-2.5 w-1/4 font-semibold text-slate-900">{data.reported_by}</td>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold w-1/4 uppercase text-[10px] tracking-wider text-slate-600">Role</td>
                            <td className="border border-slate-800 p-2.5 w-1/4 font-semibold text-slate-900">{data.role_of_recorded}</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold w-1/4 uppercase text-[10px] tracking-wider text-slate-600">Location</td>
                            <td className="border border-slate-800 p-2.5 w-1/4 font-semibold text-slate-900">{data.incident_location || 'DATA CENTRE'}</td>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold w-1/4 uppercase text-[10px] tracking-wider text-slate-600">Affected Equipment</td>
                            <td className="border border-slate-800 p-2.5 w-1/4 font-semibold text-slate-900">{data.affected_equipment || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold uppercase text-[10px] tracking-wider text-slate-600">Incident Type(s)</td>
                            <td className="border border-slate-800 p-2.5 font-semibold text-slate-900" colSpan={3}>
                                {data.incident_types?.join(' | ')}
                                {data.incident_types?.includes('OTHERS') && data.incident_type_others_text && ` (${data.incident_type_others_text})`}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold uppercase text-[10px] tracking-wider text-slate-600">Scenario Priority</td>
                            <td className="border border-slate-800 p-2.5 font-bold uppercase text-slate-900" colSpan={3}>
                                {data.incident_scenario}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Section 2: Details */}
                <div className="border border-slate-800 mb-8">
                    <div className="border-b border-slate-800 p-2 bg-slate-50 font-bold uppercase text-[10px] tracking-widest text-slate-600">Incident Description / Findings</div>
                    <div className="p-5 min-h-[150px] text-sm whitespace-pre-wrap font-semibold leading-relaxed text-slate-800">
                        {data.incident_description || 'No description provided.'}
                    </div>
                </div>

                <table className="w-full border-collapse border border-slate-800 mb-8 text-sm">
                    <tbody>
                        <tr>
                            <td className="border border-slate-800 p-0 w-1/3 align-top">
                                <div className="border-b border-slate-800 p-2 bg-slate-50 font-bold uppercase text-[9px] tracking-widest text-slate-600 text-center">Specifications</div>
                                <div className="p-4 min-h-[100px] text-[11px] font-medium leading-relaxed">{data.specifications || '-'}</div>
                            </td>
                            <td className="border border-slate-800 p-0 w-1/3 align-top">
                                <div className="border-b border-slate-800 p-2 bg-slate-50 font-bold uppercase text-[9px] tracking-widest text-slate-600 text-center">Inability / Failures</div>
                                <div className="p-4 min-h-[100px] text-[11px] font-medium leading-relaxed">{data.inability || '-'}</div>
                            </td>
                            <td className="border border-slate-800 p-0 w-1/3 align-top">
                                <div className="border-b border-slate-800 p-2 bg-slate-50 font-bold uppercase text-[9px] tracking-widest text-slate-600 text-center">Operational Impact</div>
                                <div className="p-4 min-h-[100px] text-[11px] font-medium leading-relaxed">{data.impact || '-'}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Section 3: Recommendations */}
                <div className="border border-slate-800 mb-8">
                    <div className="border-b border-slate-800 p-2 bg-slate-50 font-bold uppercase text-[10px] tracking-widest text-slate-600">Recommended Solutions</div>
                    <table className="w-full border-collapse text-sm">
                        <tbody>
                            <tr>
                                <td className="border-b border-r border-slate-800 p-3 bg-white font-bold w-[25%] uppercase text-[10px] tracking-widest text-slate-500">Action Plan</td>
                                <td className="border-b border-slate-800 p-3 font-semibold text-slate-800 leading-relaxed">{data.recommendations || '-'}</td>
                            </tr>
                            <tr>
                                <td className="border-r border-slate-800 p-3 bg-white font-bold w-[25%] uppercase text-[10px] tracking-widest text-slate-500">Replacement Capability</td>
                                <td className="border-slate-800 p-3 font-semibold text-slate-800">{data.replacement_capability || '-'}</td>
                            </tr>
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
                        <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8">Verified By Representative:</Typography>
                        <div className="border-b border-slate-800 pb-2 mb-2">
                            <Typography className="text-sm font-black uppercase text-slate-800">{data.verified_by || '___________________________'}</Typography>
                        </div>
                        <Typography className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{data.verified_designation || 'Signatory Representative'}</Typography>
                    </div>
                    <div className="text-right">
                        <Typography className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8">Approval & Endorsement:</Typography>
                        <div className="border-b border-slate-800 pb-2 mb-2">
                            <Typography className="text-sm font-black uppercase italic text-slate-800">___________________________</Typography>
                        </div>
                        <Typography className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Date: _________________</Typography>
                    </div>
                </div>
            </div>
        );
    };

    const handleOpenForm = (incident?: IncidentReport) => {
        if (incident) {
            setEditingIncident(incident);
            setFormData({
                reported_by: incident.reported_by,
                report_date: incident.report_date.split('T')[0],
                role_of_recorded: incident.role_of_recorded,
                incident_types: incident.incident_types || [],
                incident_type_others_text: incident.incident_type_others_text || '',
                affected_equipment: incident.affected_equipment || '',
                incident_location: incident.incident_location || '',
                finding_date: incident.finding_date ? incident.finding_date.split('T')[0] : '',
                incident_scenario: incident.incident_scenario || 'MINOR',
                incident_description: incident.incident_description || '',
                specifications: incident.specifications || '',
                inability: incident.inability || '',
                impact: incident.impact || '',
                operation: incident.operation || '',
                recommendations: incident.recommendations || '',
                replacement_capability: incident.replacement_capability || '',
                remarks: incident.remarks || '',
                verified_by: incident.verified_by || '',
                verified_designation: incident.verified_designation || '',
                verified_date: incident.verified_date ? incident.verified_date.split('T')[0] : '',
            });
        } else {
            setEditingIncident(null);
            setFormData({
                reported_by: '',
                report_date: format(new Date(), 'yyyy-MM-dd'),
                role_of_recorded: 'CUSTOMER SERVICE ENGINEER',
                incident_types: [],
                incident_type_others_text: '',
                affected_equipment: '',
                incident_location: 'DATA CENTRE',
                finding_date: format(new Date(), 'yyyy-MM-dd'),
                incident_scenario: 'MINOR',
                incident_description: '',
                specifications: '',
                inability: '',
                impact: '',
                operation: '',
                recommendations: '',
                replacement_capability: '',
                remarks: '',
                verified_by: '',
                verified_designation: 'Customer Service Engineer',
                verified_date: format(new Date(), 'yyyy-MM-dd'),
            });
        }
        setSelectedPhotos([]);
        setPhotoPreviews([]);
        setPhotoRemarks([]);
        setView('form');
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

    const removeNewPhoto = (index: number) => {
        setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
        setPhotoRemarks(prev => prev.filter((_, i) => i !== index));
    };

    const handleDeleteServerPhoto = async (photoId: number) => {
        if (!editingIncident) return;
        try {
            await deletePhotoMutation.mutateAsync({ reportId: editingIncident.id, photoId });
            setEditingIncident(prev => prev ? {
                ...prev,
                photos: prev.photos.filter(p => p.id !== photoId)
            } : null);
            enqueueSnackbar('Photo removed from server', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to remove photo', { variant: 'error' });
        }
    };

    const handleSave = async () => {
        if (!activeProjectId || !formData.reported_by) {
            enqueueSnackbar('Please fill in required fields', { variant: 'warning' });
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

        selectedPhotos.forEach((photo, index) => {
            data.append('photos[]', photo);
            data.append(`photo_remarks[${index}]`, photoRemarks[index] || '');
        });

        try {
            if (editingIncident) {
                await updateMutation.mutateAsync({ id: editingIncident.id, formData: data });
                enqueueSnackbar('Incident report updated', { variant: 'success' });
            } else {
                await addMutation.mutateAsync(data);
                enqueueSnackbar('Incident report submitted', { variant: 'success' });
            }
            setView('list');
        } catch (error) {
            enqueueSnackbar('Failed to save report', { variant: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this report exactly?')) return;
        try {
            await deleteMutation.mutateAsync(id);
            enqueueSnackbar('Report deleted', { variant: 'info' });
        } catch (error) {
            enqueueSnackbar('Failed to delete', { variant: 'error' });
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

            const reportedBy = extractBetween('Reported By ', ' Role', 'System Extracted User');
            const role = extractBetween('Role ', ' Incident Type(s)', 'Unknown Role');
            const affectedOrg = extractBetween('Affected Equipment ', ' Location', '');
            const location = extractBetween('Location ', ' Scenario Priority', 'DATA CENTRE');
            const descMatch = text.match(/Incident Description \/ Findings([\s\S]*?)Specifications/i);
            const description = descMatch ? descMatch[1].trim() : text.substring(0, 150).trim();

            const parsedData = {
                reported_by: reportedBy.length > 50 ? 'System' : reportedBy,
                report_date: format(new Date(), 'yyyy-MM-dd'),
                role_of_recorded: role.length > 50 ? 'Unknown' : role,
                incident_types: ["OTHERS"],
                incident_type_others_text: 'PDF AUTO IMPORT',
                affected_equipment: affectedOrg.length > 50 ? '' : affectedOrg,
                incident_location: location.length > 50 ? 'DATA CENTRE' : location,
                finding_date: format(new Date(), 'yyyy-MM-dd'),
                incident_scenario: 'MINOR',
                incident_description: description || 'Imported from PDF',
                specifications: 'PDF auto imported',
                inability: '',
                impact: '',
                operation: '',
                recommendations: '',
                replacement_capability: '',
                remarks: 'Auto-imported from PDF.',
                verified_by: 'System',
                verified_designation: 'Auto',
                verified_date: format(new Date(), 'yyyy-MM-dd'),
            };

            setEditingIncident(null);
            setFormData({
                reported_by: parsedData.reported_by,
                report_date: parsedData.report_date,
                role_of_recorded: parsedData.role_of_recorded,
                incident_types: parsedData.incident_types,
                incident_type_others_text: parsedData.incident_type_others_text,
                affected_equipment: parsedData.affected_equipment,
                incident_location: parsedData.incident_location,
                finding_date: parsedData.finding_date,
                incident_scenario: parsedData.incident_scenario as 'MINOR'|'MAJOR'|'CRITICAL',
                incident_description: parsedData.incident_description,
                specifications: parsedData.specifications,
                inability: parsedData.inability,
                impact: parsedData.impact,
                operation: parsedData.operation,
                recommendations: parsedData.recommendations,
                replacement_capability: parsedData.replacement_capability,
                remarks: parsedData.remarks,
                verified_by: parsedData.verified_by,
                verified_designation: parsedData.verified_designation,
                verified_date: parsedData.verified_date,
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <CircularProgress color="error" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-6 transition-all">
            <div className="max-w-7xl mx-auto">
                
                <AnimatePresence mode="wait">
                    {view === 'list' ? (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                <div>
                                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                        <div className="p-3 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                                            <FuseSvgIcon size={32}>heroicons-outline:shield-exclamation</FuseSvgIcon>
                                        </div>
                                        Incident Archive
                                    </h1>
                                    <p className="text-slate-500 font-bold ml-16 mt-1 uppercase tracking-widest text-xs">Official Critical Failure Logging</p>
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
                                        className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-200 rounded-2xl px-6 py-4 font-black hover:bg-slate-100 transition-all border border-slate-300 dark:border-slate-700 shadow-sm"
                                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:document-arrow-up</FuseSvgIcon>}
                                    >
                                        Import PDF
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => handleOpenForm()}
                                        className="bg-slate-900 text-white rounded-2xl px-8 py-4 font-black shadow-2xl hover:bg-slate-800 transition-all border border-slate-700"
                                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>}
                                    >
                                        New Incident Report
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {incidents.map(report => (
                                    <Card 
                                        key={report.id}
                                        className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden group hover:shadow-2xl transition-all hover:-translate-y-1"
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-200 dark:border-rose-500/30">
                                                    {report.ir_no}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingIncident(report); setTimeout(() => window.print(), 100); }} className="text-slate-400 hover:bg-slate-100"><FuseSvgIcon size={18}>heroicons-outline:printer</FuseSvgIcon></IconButton>
                                                    <IconButton size="small" onClick={() => handleOpenForm(report)} className="text-indigo-500 hover:bg-indigo-50"><FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon></IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(report.id)} className="text-rose-500 hover:bg-rose-50"><FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon></IconButton>
                                                </div>
                                            </div>
                                            <Typography className="text-xl font-black mb-1 line-clamp-1 dark:text-white uppercase">{report.affected_equipment || 'General Incident'}</Typography>
                                            <Typography className="text-xs text-slate-500 font-bold mb-4 line-clamp-2">{report.incident_description}</Typography>
                                            
                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {report.incident_types.slice(0, 3).map(type => (
                                                    <Chip key={type} label={type} size="small" className="h-5 text-[9px] font-black bg-slate-100 text-slate-600 uppercase" />
                                                ))}
                                                {report.incident_types.length > 3 && <Chip label={`+${report.incident_types.length - 3}`} size="small" className="h-5 text-[9px] font-black bg-slate-100 text-slate-600" />}
                                            </div>

                                            <Divider className="mb-4 opacity-50" />
                                            
                                            <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                <div className="flex items-center gap-1">
                                                    <FuseSvgIcon size={14}>heroicons-outline:user</FuseSvgIcon>
                                                    {report.reported_by}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FuseSvgIcon size={14}>heroicons-outline:calendar</FuseSvgIcon>
                                                    {format(new Date(report.report_date), 'dd MMM yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Paper className="rounded-[3rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xl overflow-hidden mb-10">
                                {/* Professional Header */}
                                <Box className="bg-slate-900 p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-rose-500">
                                    <div className="flex-1">
                                        <Typography className="text-4xl font-black tracking-tighter uppercase italic">Incidence Report</Typography>
                                        <Typography className="text-rose-500 font-black tracking-widest text-[13px] uppercase mt-1">Kinetic Motion Official Documentation</Typography>
                                    </div>
                                    <div className="flex items-center gap-4 mt-6 md:mt-0">
                                        <Button
                                            variant="outlined"
                                            startIcon={<FuseSvgIcon size={20}>heroicons-outline:printer</FuseSvgIcon>}
                                            onClick={() => window.print()}
                                            className="rounded-xl border-slate-700 text-white hover:bg-slate-800 font-black px-6"
                                        >
                                            Print PDF
                                        </Button>
                                        {editingIncident && (
                                            <Box className="text-right border-l border-slate-700 pl-4 hidden sm:block">
                                                <Typography className="text-[10px] font-black opacity-50 uppercase tracking-widest">Registry</Typography>
                                                <Typography className="text-xl font-black text-rose-500 leading-none">{editingIncident.ir_no}</Typography>
                                            </Box>
                                        )}
                                        <IconButton onClick={() => setView('list')} className="bg-slate-800 text-white hover:bg-rose-500 transition-colors">
                                            <FuseSvgIcon size={24}>heroicons-outline:x-mark</FuseSvgIcon>
                                        </IconButton>
                                    </div>
                                </Box>

                                <div className="p-10 space-y-12">
                                    {/* Section 1: Meta */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs">01</div>
                                            <Typography className="text-lg font-black uppercase tracking-tight">Report Metadata</Typography>
                                        </div>
                                        <Grid container spacing={4}>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField
                                                    label="Reported By"
                                                    fullWidth
                                                    value={formData.reported_by}
                                                    onChange={e => setFormData({ ...formData, reported_by: e.target.value })}
                                                    slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 800 } } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField
                                                    type="date"
                                                    label="Date of Report"
                                                    fullWidth
                                                    value={formData.report_date}
                                                    onChange={e => setFormData({ ...formData, report_date: e.target.value })}
                                                    slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 800 } } }}
                                                />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField
                                                    label="Role of Recorded"
                                                    fullWidth
                                                    value={formData.role_of_recorded}
                                                    onChange={e => setFormData({ ...formData, role_of_recorded: e.target.value })}
                                                    slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 800 } } }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </div>

                                    {/* Section 2: Types */}
                                    <Box className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs">02</div>
                                            <Typography className="text-lg font-black uppercase tracking-tight">Type of Incident</Typography>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {INCIDENT_TYPES.map(type => (
                                                <FormControlLabel
                                                    key={type}
                                                    control={
                                                        <Checkbox 
                                                            checked={formData.incident_types.includes(type)}
                                                            onChange={e => {
                                                                const newTypes = e.target.checked 
                                                                    ? [...formData.incident_types, type]
                                                                    : formData.incident_types.filter(t => t !== type);
                                                                setFormData({ ...formData, incident_types: newTypes });
                                                            }}
                                                            color="error"
                                                        />
                                                    }
                                                    label={<Typography className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">{type}</Typography>}
                                                />
                                            ))}
                                        </div>
                                        {formData.incident_types.includes('OTHERS') && (
                                            <TextField 
                                                className="mt-4"
                                                label="Specify Other Type"
                                                fullWidth
                                                value={formData.incident_type_others_text}
                                                onChange={e => setFormData({ ...formData, incident_type_others_text: e.target.value })}
                                                variant="standard"
                                            />
                                        )}
                                    </Box>

                                    {/* Section 3: Details */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs">03</div>
                                            <Typography className="text-lg font-black uppercase tracking-tight">Incident Details</Typography>
                                        </div>
                                        <Grid container spacing={4}>
                                            <Grid size={{ xs: 12, md: 3 }}>
                                                <TextField label="Affected Equipment" fullWidth value={formData.affected_equipment} onChange={e => setFormData({...formData, affected_equipment: e.target.value})} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 800 } } }} />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 3 }}>
                                                <TextField label="Incident Location" fullWidth value={formData.incident_location} onChange={e => setFormData({...formData, incident_location: e.target.value})} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 800 } } }} />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 3 }}>
                                                <TextField type="date" label="Finding Date" fullWidth value={formData.finding_date} onChange={e => setFormData({...formData, finding_date: e.target.value})} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 800 } } }} />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 3 }}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Incident Scenario</InputLabel>
                                                    <Select value={formData.incident_scenario} onChange={e => setFormData({...formData, incident_scenario: e.target.value})} sx={{ borderRadius: '16px', fontWeight: 800 }} label="Incident Scenario">
                                                        {SCENARIOS.map(s => <MenuItem key={s} value={s} className="font-black uppercase">{s}</MenuItem>)}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        </Grid>
                                    </div>

                                    {/* Section 4: Narrative */}
                                    <div className="space-y-6">
                                        <TextField label="Incident Description" multiline rows={4} fullWidth value={formData.incident_description} onChange={e => setFormData({...formData, incident_description: e.target.value})} slotProps={{ input: { sx: { borderRadius: '24px', fontWeight: 700 } } }} />
                                        <Grid container spacing={4}>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField label="Specifications" multiline rows={3} fullWidth value={formData.specifications} onChange={e => setFormData({...formData, specifications: e.target.value})} slotProps={{ input: { sx: { borderRadius: '24px' } } }} />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField label="Inability" multiline rows={3} fullWidth value={formData.inability} onChange={e => setFormData({...formData, inability: e.target.value})} slotProps={{ input: { sx: { borderRadius: '24px' } } }} />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField label="Impact" multiline rows={3} fullWidth value={formData.impact} onChange={e => setFormData({...formData, impact: e.target.value})} slotProps={{ input: { sx: { borderRadius: '24px' } } }} />
                                            </Grid>
                                        </Grid>
                                        <TextField label="Chronological Operation (Process Steps)" multiline rows={4} fullWidth value={formData.operation} onChange={e => setFormData({...formData, operation: e.target.value})} slotProps={{ input: { sx: { borderRadius: '24px' } } }} />
                                    </div>

                                    {/* Section 5: Recommendations */}
                                    <Box className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">04</div>
                                            <Typography className="text-lg font-black uppercase tracking-tight text-indigo-900">Recommended Solutions</Typography>
                                        </div>
                                        <div className="space-y-6">
                                            <TextField label="Recommendations / Solution" multiline rows={3} fullWidth value={formData.recommendations} onChange={e => setFormData({...formData, recommendations: e.target.value})} slotProps={{ input: { sx: { borderRadius: '24px', bgcolor: 'white' } } }} />
                                            <TextField label="Replacement Capability" multiline rows={2} fullWidth value={formData.replacement_capability} onChange={e => setFormData({...formData, replacement_capability: e.target.value})} slotProps={{ input: { sx: { borderRadius: '24px', bgcolor: 'white' } } }} />
                                        </div>
                                    </Box>

                                    {/* Section 6: Photos / Appendix */}
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs">05</div>
                                                <Typography className="text-lg font-black uppercase tracking-tight">Appendix / Photo Evidence</Typography>
                                            </div>
                                            <Button
                                                variant="outlined"
                                                onClick={() => fileInputRef.current?.click()}
                                                startIcon={<FuseSvgIcon size={20}>heroicons-outline:camera</FuseSvgIcon>}
                                                className="rounded-xl border-dashed border-2 px-6 font-black"
                                            >
                                                Add More Pictures
                                            </Button>
                                            <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={handlePhotoChange} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Server Photos */}
                                            {editingIncident?.photos.map(photo => (
                                                <div key={photo.id} className="space-y-3">
                                                    <div 
                                                        onClick={() => setLightboxImage(`${API_BASE_URL}/storage/${photo.photo_path}`)}
                                                        className="relative group rounded-[2.5rem] overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-xl h-[400px] cursor-zoom-in"
                                                    >
                                                        <CardMedia
                                                            component="img"
                                                            image={`${API_BASE_URL}/storage/${photo.photo_path}`}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-6">
                                                            <Typography className="text-white font-black uppercase text-xs tracking-widest">Evidence Asset #{photo.id}</Typography>
                                                            <IconButton onClick={(e) => { e.stopPropagation(); handleDeleteServerPhoto(photo.id); }} className="text-white bg-rose-500 hover:bg-rose-600 shadow-lg">
                                                                <FuseSvgIcon size={24}>heroicons-outline:trash</FuseSvgIcon>
                                                            </IconButton>
                                                        </div>
                                                    </div>
                                                    {photo.caption && (
                                                        <Box className="px-6 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                            <Typography className="text-sm font-bold text-slate-700 dark:text-slate-300 italic">" {photo.caption} "</Typography>
                                                        </Box>
                                                    )}
                                                </div>
                                            ))}
                                            {/* Local Previews */}
                                            {photoPreviews.map((preview, i) => (
                                                <div key={i} className="space-y-4">
                                                    <div 
                                                        onClick={() => setLightboxImage(preview)}
                                                        className="relative group rounded-[2.5rem] overflow-hidden border-4 border-dashed border-rose-500/50 shadow-2xl h-[400px] animate-in zoom-in-95 duration-500 cursor-zoom-in"
                                                    >
                                                        <CardMedia
                                                            component="img"
                                                            image={preview}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <IconButton onClick={(e) => { e.stopPropagation(); removeNewPhoto(i); }} className="text-white bg-slate-900 hover:bg-black p-4">
                                                                <FuseSvgIcon size={32}>heroicons-outline:x-mark</FuseSvgIcon>
                                                            </IconButton>
                                                        </div>
                                                        <div className="absolute top-6 left-6 px-4 py-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-lg">NEW ASSET PENDING</div>
                                                    </div>
                                                    <TextField
                                                        placeholder="Write assessment / photo description..."
                                                        fullWidth
                                                        value={photoRemarks[i]}
                                                        onChange={(e) => {
                                                            const newRemarks = [...photoRemarks];
                                                            newRemarks[i] = e.target.value;
                                                            setPhotoRemarks(newRemarks);
                                                        }}
                                                        slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 600, bgcolor: 'white' } } }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Section 7: Verification */}
                                    <Box className="mt-12 p-10 border-2 border-slate-900 rounded-[3rem]">
                                        <Typography className="text-center font-black uppercase text-xl mb-10 tracking-widest decoration-rose-500 underline underline-offset-8">Final Verification</Typography>
                                        <Grid container spacing={6}>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField label="Verified By" fullWidth value={formData.verified_by} onChange={e => setFormData({...formData, verified_by: e.target.value})} variant="standard" slotProps={{ input: { sx: { fontWeight: 900, fontSize: '1.2rem' } } }} />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField label="Designation" fullWidth value={formData.verified_designation} onChange={e => setFormData({...formData, verified_designation: e.target.value})} variant="standard" />
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 4 }}>
                                                <TextField type="date" label="Date and Sign" fullWidth value={formData.verified_date} onChange={e => setFormData({...formData, verified_date: e.target.value})} variant="standard" />
                                            </Grid>
                                        </Grid>
                                        <TextField className="mt-8" label="Remarks" fullWidth value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} multiline rows={2} variant="outlined" slotProps={{ input: { sx: { borderRadius: '20px' } } }} />
                                    </Box>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                                        <Button
                                            onClick={() => setView('list')}
                                            className="rounded-2xl px-10 py-4 font-black text-slate-500 uppercase tracking-widest"
                                        >
                                            Cancel Documentation
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            variant="contained"
                                            disabled={addMutation.isPending || updateMutation.isPending}
                                            className="rounded-2xl px-16 py-4 font-black bg-rose-600 text-white shadow-2xl hover:bg-rose-700 transform active:scale-95 transition-all text-lg"
                                        >
                                            {addMutation.isPending || updateMutation.isPending ? <CircularProgress size={24} color="inherit" /> : editingIncident ? 'Update Documentation' : 'Seal & Submit Report'}
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
                    sx: { bgcolor: 'rgba(0,0,0,0.95)', color: 'white' }
                }}
            >
                <div className="relative w-full h-full flex items-center justify-center p-10">
                    <IconButton 
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20"
                    >
                        <FuseSvgIcon size={32}>heroicons-outline:x-mark</FuseSvgIcon>
                    </IconButton>
                    <img 
                        src={lightboxImage || ''} 
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                        alt="Evidence Full Size"
                    />
                </div>
            </Dialog>

            {/* Hidden Print Layout */}
            <div id="print-report-container" className="hidden print:block bg-white min-h-screen">
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
                        #print-report-container, #print-report-container * { visibility: visible !important; }
                        #print-report-container { 
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

export default IncidentReportPage;
