'use client';
import { FC, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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

import { useIncidentReports } from '../incidence-report/incidentApi';
import { useInspectionReports } from '../inspection-report/inspectionApi';

const SERVICE_TYPES = [
    'New installation', 'Equipment breakdown', 'Fire Panel',
    'Routine maintenance', 'Air conditioning', 'Water Leak',
    'Service & Repair', 'CCTV', 'Main switchboard',
    'Testing & commissioning', 'Generator', 'Network Equipment',
    'Others'
];

const ServiceReportPage: FC = () => {
    const theme = useTheme();
    const { activeProject: selectedProject } = useProject();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingReport, setEditingReport] = useState<ServiceReport | null>(null);
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [photoRemarks, setPhotoRemarks] = useState<string[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        company_name: 'SABAH NET SDN BHD',
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
        linked_incident_report_id: '' as number | '',
        linked_inspection_report_id: '' as number | '',
        incidentReport: null as any,
        inspectionReport: null as any,
    });

    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

    const { data: reports = [], isLoading } = useServiceReports(selectedProject?.id);
    const { data: incidentReports = [] } = useIncidentReports(selectedProject?.id);
    const { data: inspectionReports = [] } = useInspectionReports(selectedProject?.id);

    const addMutation = useAddServiceReport();
    const updateMutation = useUpdateServiceReport();
    const deleteMutation = useDeleteServiceReport();
    const deletePhotoMutation = useDeleteServicePhoto();

    // ── Filter state ──────────────────────────────────────────────
    const [srSearchText, setSrSearchText] = useState('');
    const [srDateFrom, setSrDateFrom] = useState('');
    const [srDateTo, setSrDateTo] = useState('');

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const q = srSearchText.toLowerCase();
            const matchText = !q ||
                (r.service_report_no || '').toLowerCase().includes(q) ||
                (r.taken_by || '').toLowerCase().includes(q) ||
                (r.company_name || '').toLowerCase().includes(q) ||
                (r.contact_person || '').toLowerCase().includes(q) ||
                (r.description || '').toLowerCase().includes(q) ||
                (r.address || '').toLowerCase().includes(q) ||
                (r.service_types || []).some(t => t.toLowerCase().includes(q));
            const rDate = new Date(r.date_time || r.created_at);
            const matchFrom = !srDateFrom || rDate >= new Date(srDateFrom);
            const matchTo = !srDateTo || rDate <= new Date(srDateTo + 'T23:59:59');
            return matchText && matchFrom && matchTo;
        });
    }, [reports, srSearchText, srDateFrom, srDateTo]);
    // ───────────────────────────────────────────────────────────

    const handleOpenForm = (report?: ServiceReport) => {
        if (report) {
            setEditingReport(report);
            setFormData({
                company_name: report.company_name || 'SABAH NET SDN BHD',
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
                linked_incident_report_id: report.linked_incident_report_id || '',
                linked_inspection_report_id: report.linked_inspection_report_id || '',
                incidentReport: report.incidentReport || null,
                inspectionReport: report.inspectionReport || null,
            });
        } else {
            setEditingReport(null);
            setFormData({
                company_name: 'SABAH NET SDN BHD',
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
                linked_incident_report_id: '',
                linked_inspection_report_id: '',
                incidentReport: null,
                inspectionReport: null,
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
            <div className="bg-white text-black font-sans mx-auto print:max-w-none print:w-full min-h-0 flex flex-col pt-8 print:!pt-0">
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
                        {(data.linked_incident_report_id || data.linked_inspection_report_id) && (
                            <tr>
                                <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold uppercase text-[10px] tracking-wider text-slate-600">Linked Reports</td>
                                <td className="border border-slate-800 p-2.5 font-semibold text-slate-900" colSpan={3}>
                                    {data.linked_incident_report_id && (
                                        <div className="flex gap-2 items-center">
                                            <span className="font-bold text-[10px] uppercase text-indigo-600 bg-indigo-50 px-2 rounded-md">Incident</span>
                                            {data.incidentReport?.ir_no || `ID: ${data.linked_incident_report_id}`}
                                        </div>
                                    )}
                                    {data.linked_inspection_report_id && (
                                        <div className="flex gap-2 items-center mt-1">
                                            <span className="font-bold text-[10px] uppercase text-rose-600 bg-rose-50 px-2 rounded-md">Inspection</span>
                                            {data.inspectionReport?.rfwi_ref_no || data.inspectionReport?.title || `ID: ${data.linked_inspection_report_id}`}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )}
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
                                    <td className="border-b border-r border-slate-800 p-2.5 font-bold w-12 text-center text-[10px] text-slate-500">{i + 1}</td>
                                    <td className="border-b border-slate-800 p-2.5 font-medium leading-relaxed text-slate-800">{step}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Photo Evidence Section */}
                {(() => {
                    const serverPhotos = (data.photos || []).map((photo, i) => ({
                        src: `${API_BASE_URL}/storage/${photo.photo_path}`,
                        caption: photo.caption || '',
                        key: `server-${photo.id || i}`,
                    }));
                    const localPhotos = photoPreviews.map((preview, i) => ({
                        src: preview,
                        caption: photoRemarks[i] || '',
                        key: `local-${i}`,
                    }));
                    const allPhotos = [...serverPhotos, ...localPhotos];
                    if (allPhotos.length === 0) return null;
                    return (
                        <div className="mt-12 page-break-before-always">
                            <div className="border-l-4 border-slate-800 pl-4 py-2 bg-slate-50 font-black uppercase text-[12px] tracking-[0.2em] text-slate-800 mb-8 border-y border-r">
                                Photo Evidence Documentation
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                {allPhotos.map((photo, i) => (
                                    <div key={photo.key} className="photo-block border border-slate-800 p-2 flex flex-col bg-white">
                                        <div className="h-[350px] w-full bg-white flex items-center justify-center overflow-hidden border border-slate-100">
                                            <img
                                                src={photo.src}
                                                className="max-w-full max-h-full object-contain block"
                                                alt={`Photo ${i + 1}`}
                                            />
                                        </div>
                                        <div className="mt-4 text-[10px] font-black uppercase text-center text-slate-800 tracking-widest border-t border-slate-100 pt-2 bg-slate-50/50 flex-1 flex items-center justify-center px-4">
                                            {photo.caption || `Figure ${i + 1}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}


                <div className="flex-1 min-h-[60px]"></div>

                {/* Verified By */}
                <div className="mt-auto pt-10 border-t-2 border-slate-800 grid grid-cols-2 gap-20">
                    <div className="photo-block flex flex-col h-full">
                        <Typography className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">I. Technical Authorization:</Typography>
                        <div className="mt-auto border-b-2 border-slate-800 pb-3 mb-3">
                            <Typography className="text-[15px] font-black uppercase text-slate-900 tracking-tight leading-none min-h-[15px]">{data.taken_by || '___________________________'}</Typography>
                        </div>
                        <Typography className="text-[11px] font-black uppercase text-slate-500 tracking-[0.1em]">Lead Service Engineer</Typography>
                    </div>
                    <div className="text-right photo-block flex flex-col h-full">
                        <Typography className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">II. Client Acknowledgement:</Typography>
                        <div className="mt-auto border-b-2 border-slate-800 pb-3 mb-3">
                            <Typography className="text-[15px] font-black uppercase italic text-slate-300 tracking-tight leading-none min-h-[15px]">Name & Signature</Typography>
                        </div>
                        <Typography className="text-[11px] font-black uppercase text-slate-500 tracking-[0.1em]">Date: {format(new Date(), 'dd / MM / yyyy')}</Typography>
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
        if (!selectedProject || !formData.date_time) return;

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value === '' || value === null) return;
            if (Array.isArray(value)) {
                value.forEach(v => data.append(`${key}[]`, v));
            } else {
                data.append(key, typeof value === 'number' ? String(value) : String(value));
            }
        });
        data.append('project_id', selectedProject.id.toString());
        selectedPhotos.forEach((p, index) => {
            data.append('photos[]', p);
            data.append(`photo_remarks[${index}]`, photoRemarks[index] || '');
        });

        try {
            if (editingReport) {
                await updateMutation.mutateAsync({ id: editingReport.id, formData: data });
                enqueueSnackbar('Service Report Updated', { variant: 'success' });
            } else {
                await addMutation.mutateAsync(data);
                enqueueSnackbar('Service Report Submitted', { variant: 'success' });
            }
            setSelectedPhotos([]);
            setPhotoPreviews([]);
            setPhotoRemarks([]);
            setView('list');
        } catch (error) {
            enqueueSnackbar('Error saving report', { variant: 'error' });
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
        if (!file || !selectedProject) return;

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
            const steps = blocks.split('\n').filter(s => s.trim() && s.length > 2).map(s => s.replace(/^\d+\s/, '').trim());
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
                company_name: 'SABAH NET SDN BHD',
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
                linked_incident_report_id: '',
                linked_inspection_report_id: '',
                incidentReport: null,
                inspectionReport: null,
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
        <div className="w-full min-h-screen bg-slate-100 dark:bg-slate-950 p-6 print:p-0 print:min-h-0 transition-all">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    html, body { background: white !important; }
                    /* display:none removes layout space (no blank pages) */
                    body > *:not(#print-service-report-container) { display: none !important; }
                    @page { margin: 1.5cm; size: A4 portrait; }
                }
            `}} />

            <div id="normal-app-container" className="max-w-7xl mx-auto print-hidden-wrapper">
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

                            {/* ── Filter / Search Bar ── */}
                            <div className="mb-8 flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                {/* Search */}
                                <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
                                    <FuseSvgIcon size={16} className="text-slate-400 shrink-0">heroicons-outline:magnifying-glass</FuseSvgIcon>
                                    <input
                                        type="text"
                                        placeholder="Search by SR No, technician, location, customer…"
                                        value={srSearchText}
                                        onChange={e => setSrSearchText(e.target.value)}
                                        className="flex-1 bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400 placeholder:font-normal"
                                    />
                                    {srSearchText && (
                                        <button onClick={() => setSrSearchText('')} className="text-slate-300 hover:text-indigo-400 transition-colors">
                                            <FuseSvgIcon size={14}>heroicons-outline:x-mark</FuseSvgIcon>
                                        </button>
                                    )}
                                </div>
                                {/* Date From */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">From</span>
                                    <input
                                        type="date"
                                        value={srDateFrom}
                                        onChange={e => setSrDateFrom(e.target.value)}
                                        className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 transition-colors"
                                    />
                                </div>
                                {/* Date To */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">To</span>
                                    <input
                                        type="date"
                                        value={srDateTo}
                                        onChange={e => setSrDateTo(e.target.value)}
                                        className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 transition-colors"
                                    />
                                </div>
                                {/* Clear */}
                                {(srDateFrom || srDateTo || srSearchText) && (
                                    <button
                                        onClick={() => { setSrSearchText(''); setSrDateFrom(''); setSrDateTo(''); }}
                                        className="flex items-center gap-1.5 text-[11px] font-black uppercase text-indigo-500 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl px-3 py-2 transition-all whitespace-nowrap"
                                    >
                                        <FuseSvgIcon size={12}>heroicons-outline:x-circle</FuseSvgIcon>
                                        Clear
                                    </button>
                                )}
                                {/* Results count */}
                                <div className="flex items-center px-2 text-[11px] font-black text-slate-400 whitespace-nowrap">
                                    {filteredReports.length} / {reports.length}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredReports.length === 0 ? (
                                    <div className="col-span-3 py-20 text-center">
                                        <FuseSvgIcon size={40} className="text-slate-200 mx-auto mb-3">heroicons-outline:magnifying-glass</FuseSvgIcon>
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No reports match your filters</p>
                                    </div>
                                ) : filteredReports.map(report => (
                                    <Card key={report.id} className="rounded-[2.5rem] bg-white border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all">
                                        <div className="p-8">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="px-5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-black tracking-widest border border-indigo-100 uppercase">
                                                    {report.service_report_no}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setSelectedPhotos([]);
                                                            setPhotoPreviews([]);
                                                            setPhotoRemarks([]);
                                                            setEditingReport(report);
                                                            // Wait for React to commit the new state, then wait for images
                                                            requestAnimationFrame(() => requestAnimationFrame(async () => {
                                                                const printContainer = document.getElementById('print-service-report-container');
                                                                if (printContainer) {
                                                                    const images = Array.from(printContainer.getElementsByTagName('img'));
                                                                    await Promise.all(images.map(img =>
                                                                        img.complete ? Promise.resolve() : new Promise(resolve => {
                                                                            img.onload = resolve;
                                                                            img.onerror = resolve;
                                                                        })
                                                                    ));
                                                                    setTimeout(() => window.print(), 150);
                                                                } else {
                                                                    window.print();
                                                                }
                                                            }));
                                                        }} 
                                                        className="text-slate-400 hover:bg-slate-100"
                                                    >
                                                        <FuseSvgIcon size={18}>heroicons-outline:printer</FuseSvgIcon>
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleOpenForm(report)} className="text-indigo-500 bg-indigo-50"><FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon></IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(report.id)} className="text-rose-500 bg-rose-50"><FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon></IconButton>
                                                </div>
                                            </div>
                                            <Typography className="text-2xl font-black mb-1 italic truncate">{report.company_name || 'Individual Client'}</Typography>
                                            <Typography className="text-[10px] uppercase font-black text-slate-400 mb-6 tracking-widest line-clamp-1">{report.address}</Typography>
                                            
                                            {(report.linked_incident_report_id || report.linked_inspection_report_id) && (
                                                <div className="flex flex-col gap-2 mb-4">
                                                    {report.linked_incident_report_id && (
                                                        <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 w-fit px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-800">
                                                            <FuseSvgIcon size={14} className="text-rose-500">heroicons-outline:shield-exclamation</FuseSvgIcon>
                                                            <Typography className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                                                                {report.incidentReport?.ir_no || `IR-ID: ${report.linked_incident_report_id}`}
                                                            </Typography>
                                                        </div>
                                                    )}
                                                    {report.linked_inspection_report_id && (
                                                        <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 w-fit px-3 py-1.5 rounded-lg border border-sky-100 dark:border-sky-800">
                                                            <FuseSvgIcon size={14} className="text-sky-500">heroicons-outline:clipboard-document-check</FuseSvgIcon>
                                                            <Typography className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">
                                                                {report.inspectionReport?.rfwi_ref_no || report.inspectionReport?.title || `INSP-ID: ${report.linked_inspection_report_id}`}
                                                            </Typography>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

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
                                            onClick={async () => {
                                                window.scrollTo(0, 0);
                                                const printContainer = document.getElementById('print-service-report-container');
                                                if (printContainer) {
                                                    const images = Array.from(printContainer.getElementsByTagName('img'));
                                                    await Promise.all(images.map(img =>
                                                        img.complete ? Promise.resolve() : new Promise(resolve => {
                                                            img.onload = resolve;
                                                            img.onerror = resolve;
                                                        })
                                                    ));
                                                    setTimeout(() => window.print(), 500);
                                                } else {
                                                    window.print();
                                                }
                                            }}
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
                                            <Grid size={{ xs: 12, md: 6 }}><TextField label="Company Name" disabled fullWidth value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 800 } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 6 }}><TextField label="Service Location / Address" fullWidth value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} slotProps={{ input: { sx: { borderRadius: '20px', fontWeight: 800 } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 3 }}><TextField label="Contact Person" fullWidth value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} slotProps={{ input: { sx: { borderRadius: '16px' } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 3 }}><TextField label="Telephone No" fullWidth value={formData.telephone_no} onChange={e => setFormData({ ...formData, telephone_no: e.target.value })} slotProps={{ input: { sx: { borderRadius: '16px' } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 3 }}><TextField label="Taken By" fullWidth value={formData.taken_by} onChange={e => setFormData({ ...formData, taken_by: e.target.value })} slotProps={{ input: { sx: { borderRadius: '16px' } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 3 }}><TextField label="Date & Time" type="datetime-local" fullWidth value={formData.date_time} onChange={e => setFormData({ ...formData, date_time: e.target.value })} slotProps={{ input: { sx: { borderRadius: '16px', fontWeight: 900 } } }} /></Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Link Incident Report</InputLabel>
                                                    <Select
                                                        value={formData.linked_incident_report_id || ''}
                                                        onChange={e => setFormData({ ...formData, linked_incident_report_id: e.target.value as number | '' })}
                                                        label="Link Incident Report"
                                                        sx={{ borderRadius: '16px' }}
                                                    >
                                                        <MenuItem value=""><em>None</em></MenuItem>
                                                        {incidentReports.map((ir) => (
                                                            <MenuItem key={ir.id} value={ir.id}>{ir.ir_no} - {ir.incident_location}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Link Inspection Report</InputLabel>
                                                    <Select
                                                        value={formData.linked_inspection_report_id || ''}
                                                        onChange={e => setFormData({ ...formData, linked_inspection_report_id: e.target.value as number | '' })}
                                                        label="Link Inspection Report"
                                                        sx={{ borderRadius: '16px' }}
                                                    >
                                                        <MenuItem value=""><em>None</em></MenuItem>
                                                        {inspectionReports.map((insp) => (
                                                            <MenuItem key={insp.id} value={insp.id}>{insp.rfwi_ref_no || insp.title} - {insp.location}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        </Grid>
                                    </div>

                                    {/* Section 2: Type of Services */}
                                    <div>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">02</div>
                                            <Typography className="text-2xl font-black uppercase italic tracking-tight">Type of Services</Typography>
                                        </div>
                                        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {SERVICE_TYPES.map(type => (
                                                <FormControlLabel
                                                    key={type}
                                                    control={<Checkbox checked={formData.service_types.includes(type)} onChange={e => {
                                                        const nt = e.target.checked ? [...formData.service_types, type] : formData.service_types.filter(v => v !== type);
                                                        setFormData({ ...formData, service_types: nt });
                                                    }} color="secondary" />}
                                                    label={<Typography className="text-xs font-black uppercase text-slate-600">{type}</Typography>}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Section 3: Job Description */}
                                    <div className="space-y-12">
                                        <TextField label="General Job Description" multiline rows={4} fullWidth value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} slotProps={{ input: { sx: { borderRadius: '32px', padding: '24px' } } }} />

                                        <div>
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">03</div>
                                                    <Typography className="text-2xl font-black uppercase italic tracking-tight">Service Summary</Typography>
                                                </div>
                                                <Button onClick={addSummaryStep} variant="outlined" className="rounded-xl font-black" startIcon={<FuseSvgIcon>heroicons-outline:plus-circle</FuseSvgIcon>}>Add Step</Button>
                                            </div>
                                            <div className="space-y-4">
                                                {formData.service_summary.map((step, i) => (
                                                    <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-4 fade-in">
                                                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black flex-shrink-0">{i + 1}</div>
                                                        <TextField fullWidth placeholder={`Step ${i + 1} details...`} value={step} onChange={e => updateSummaryStep(i, e.target.value)} variant="standard" slotProps={{ input: { sx: { fontWeight: 600 } } }} />
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
                                                            <IconButton onClick={(e) => { e.stopPropagation(); handleDeletePhoto(p.id); }} className="bg-rose-500 text-white p-4 shadow-xl">
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
                                                <TextField label="Date" type="date" value={formData.summary_date} onChange={e => setFormData({ ...formData, summary_date: e.target.value })} fullWidth variant="standard" />
                                            </div>
                                            <div>
                                                <Typography className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-10">Verification Time</Typography>
                                                <TextField label="Time" type="time" value={formData.summary_time} onChange={e => setFormData({ ...formData, summary_time: e.target.value })} fullWidth variant="standard" />
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

            {/* Forced Image Preloader - Uses opaque negligible dimensions to force eager network decoding */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', overflow: 'hidden', opacity: 0.001, pointerEvents: 'none', zIndex: -1 }}>
                {(editingReport?.photos || []).map(p => <img key={`preload-server-${p.id}`} src={`${API_BASE_URL}/storage/${p.photo_path}`} alt="" loading="eager" crossOrigin="anonymous" />)}
                {photoPreviews.map((p, i) => <img key={`preload-local-${i}`} src={p} alt="" loading="eager" />)}
            </div>

            {/* Print Layout - Positioned off-screen to force eager image loading in the browser thread */}
            {/* Print Portal - Direct child of body to guarantee layout freedom */}
            {mounted && createPortal(
                <div id="print-service-report-container" style={{ position: 'fixed', top: -99999, left: -99999, pointerEvents: 'none' }}>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @media print {
                            * { 
                                -webkit-print-color-adjust: exact !important; 
                                print-color-adjust: exact !important; 
                                color-adjust: exact !important;
                            }

                            /* Body visibility:hidden is set in the main style above.
                               Everything inside our portal is made visible again. */
                            #print-service-report-container {
                                display: block !important;
                                visibility: visible !important;
                                position: static !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: white !important;
                                pointer-events: auto !important;
                            }

                            #print-service-report-container * {
                                visibility: visible !important;
                            }

                            #print-service-report-container img {
                                display: block !important;
                                max-width: 100% !important;
                                height: auto !important;
                                object-fit: contain !important;
                            }

                            table, tr, td, div { page-break-inside: auto !important; }
                            tr, .photo-block { page-break-inside: avoid !important; }
                            .page-break-before-always { page-break-before: always !important; }

                            @page { margin: 1.5cm; size: A4 portrait; }
                        }
                    `}} />
                    <div className="w-full">
                        {renderPrintLayout()}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ServiceReportPage;
