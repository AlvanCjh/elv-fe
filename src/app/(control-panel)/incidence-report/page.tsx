'use client';
import { FC, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { useServiceReports } from '../service-report/serviceApi';
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
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

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
        linked_service_report_id: '' as number | '',
        linkedServiceReport: null as any,
    });

    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

    const { data: incidents = [], isLoading } = useIncidentReports(activeProjectId);
    const { data: serviceReports = [] } = useServiceReports(activeProjectId);
    const addMutation = useAddIncidentReport();
    const updateMutation = useUpdateIncidentReport();
    const deleteMutation = useDeleteIncidentReport();
    const deletePhotoMutation = useDeleteIncidentPhoto();

    // ── Filter state ──────────────────────────────────────────────
    const [searchText, setSearchText] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const filteredIncidents = useMemo(() => {
        return incidents.filter(r => {
            const q = searchText.toLowerCase();
            const matchText = !q ||
                (r.ir_no || '').toLowerCase().includes(q) ||
                (r.reported_by || '').toLowerCase().includes(q) ||
                (r.affected_equipment || '').toLowerCase().includes(q) ||
                (r.incident_location || '').toLowerCase().includes(q) ||
                (r.incident_description || '').toLowerCase().includes(q) ||
                (r.incident_types || []).some(t => t.toLowerCase().includes(q));
            const rDate = new Date(r.report_date);
            const matchFrom = !dateFrom || rDate >= new Date(dateFrom);
            const matchTo = !dateTo || rDate <= new Date(dateTo + 'T23:59:59');
            return matchText && matchFrom && matchTo;
        });
    }, [incidents, searchText, dateFrom, dateTo]);
    // ─────────────────────────────────────────────────────────────

    const renderPrintLayout = () => {
        const data = editingIncident || { ...formData, ir_no: 'DRAFT', photos: [] };
        return (
            <div className="bg-white text-black font-sans mx-auto print:max-w-none print:w-full min-h-0 flex flex-col pt-8 print:!pt-0">
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
                        {data.linked_service_report_id && (
                            <tr>
                                <td className="border border-slate-800 p-2.5 bg-slate-50 font-bold uppercase text-[10px] tracking-wider text-slate-600">Assigned Service Report</td>
                                <td className="border border-slate-800 p-2.5 font-semibold text-slate-900" colSpan={3}>
                                    <div className="flex gap-2 items-center">
                                        <span className="font-bold text-[10px] uppercase text-emerald-600 bg-emerald-50 px-2 rounded-md">Linked</span>
                                        {data.linkedServiceReport?.service_report_no || `ID: ${data.linked_service_report_id}`}
                                    </div>
                                </td>
                            </tr>
                        )}
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

                {/* Photo Evidence Section */}
                {(() => {
                    // Build a unified photo list: server photos first, then unsaved local previews
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
                        <Typography className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">I. Field Verification:</Typography>
                        <div className="mt-auto border-b-2 border-slate-800 pb-3 mb-3">
                            <Typography className="text-[15px] font-black uppercase text-slate-900 tracking-tight leading-none min-h-[15px]">{data.reported_by || '___________________________'}</Typography>
                        </div>
                        <Typography className="text-[11px] font-black uppercase text-slate-500 tracking-[0.1em]">{data.role_of_recorded || 'Technician / Engineer'}</Typography>
                    </div>
                    <div className="text-right photo-block flex flex-col h-full">
                        <Typography className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">II. Management Endorsement:</Typography>
                        <div className="mt-auto border-b-2 border-slate-800 pb-3 mb-3">
                            <Typography className="text-[15px] font-black uppercase italic text-slate-300 tracking-tight leading-none min-h-[15px]">Signature & Official Stamp</Typography>
                        </div>
                        <Typography className="text-[11px] font-black uppercase text-slate-500 tracking-[0.1em]">Date: {format(new Date(), 'dd / MM / yyyy')}</Typography>
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
                linked_service_report_id: incident.linked_service_report_id || '',
                linkedServiceReport: incident.linkedServiceReport || null,
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
                linked_service_report_id: '',
                linkedServiceReport: null,
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
            if (key === 'linkedServiceReport') return;
            if (value === null) return;
            if (Array.isArray(value)) {
                value.forEach(v => data.append(`${key}[]`, v));
            } else {
                data.append(key, typeof value === 'number' ? String(value) : String(value));
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
            setSelectedPhotos([]);
            setPhotoPreviews([]);
            setPhotoRemarks([]);
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
                linked_service_report_id: '',
                linkedServiceReport: null,
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
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 p-6 print:p-0 print:min-h-0 transition-all">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    html, body { background: white !important; }
                    /* display:none removes layout space (no blank pages) */
                    body > *:not(#print-report-container) { display: none !important; }
                    @page { margin: 1.5cm; size: A4 portrait; }
                }
            `}} />


            <div id="normal-app-container" className="max-w-7xl mx-auto print-hidden-wrapper">
                
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

                            {/* ── Filter / Search Bar ── */}
                            <div className="mb-6 flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                {/* Search */}
                                <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
                                    <FuseSvgIcon size={16} className="text-slate-400 shrink-0">heroicons-outline:magnifying-glass</FuseSvgIcon>
                                    <input
                                        type="text"
                                        placeholder="Search by IR No, equipment, reporter, type…"
                                        value={searchText}
                                        onChange={e => setSearchText(e.target.value)}
                                        className="flex-1 bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400 placeholder:font-normal"
                                    />
                                    {searchText && (
                                        <button onClick={() => setSearchText('')} className="text-slate-300 hover:text-rose-400 transition-colors">
                                            <FuseSvgIcon size={14}>heroicons-outline:x-mark</FuseSvgIcon>
                                        </button>
                                    )}
                                </div>
                                {/* Date From */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">From</span>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={e => setDateFrom(e.target.value)}
                                        className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-rose-400 transition-colors"
                                    />
                                </div>
                                {/* Date To */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">To</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={e => setDateTo(e.target.value)}
                                        className="text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-rose-400 transition-colors"
                                    />
                                </div>
                                {/* Clear filters */}
                                {(dateFrom || dateTo || searchText) && (
                                    <button
                                        onClick={() => { setSearchText(''); setDateFrom(''); setDateTo(''); }}
                                        className="flex items-center gap-1.5 text-[11px] font-black uppercase text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl px-3 py-2 transition-all whitespace-nowrap"
                                    >
                                        <FuseSvgIcon size={12}>heroicons-outline:x-circle</FuseSvgIcon>
                                        Clear
                                    </button>
                                )}
                                {/* Results count */}
                                <div className="flex items-center px-2 text-[11px] font-black text-slate-400 whitespace-nowrap">
                                    {filteredIncidents.length} / {incidents.length}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredIncidents.length === 0 ? (
                                    <div className="col-span-3 py-20 text-center">
                                        <FuseSvgIcon size={40} className="text-slate-200 mx-auto mb-3">heroicons-outline:magnifying-glass</FuseSvgIcon>
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No reports match your filters</p>
                                    </div>
                                ) : filteredIncidents.map(report => (
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
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setSelectedPhotos([]);
                                                            setPhotoPreviews([]);
                                                            setPhotoRemarks([]);
                                                            setEditingIncident(report);
                                                            // Wait for React to commit the new state, then wait for images
                                                            requestAnimationFrame(() => requestAnimationFrame(async () => {
                                                                const printContainer = document.getElementById('print-report-container');
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

                                            {report.linked_service_report_id && (
                                                <div className="flex items-center gap-2 mb-4 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                                    <FuseSvgIcon size={14} className="text-emerald-500">heroicons-outline:link</FuseSvgIcon>
                                                    <Typography className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                                        {report.linkedServiceReport?.service_report_no || `SR-ID: ${report.linked_service_report_id}`}
                                                    </Typography>
                                                </div>
                                            )}

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
                                            onClick={async () => {
                                                window.scrollTo(0, 0);
                                                const printContainer = document.getElementById('print-report-container');
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
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Link Service Report (Optional)</InputLabel>
                                                    <Select
                                                        value={formData.linked_service_report_id || ''}
                                                        onChange={e => setFormData({ ...formData, linked_service_report_id: e.target.value as number | '' })}
                                                        label="Link Service Report (Optional)"
                                                        sx={{ borderRadius: '16px', fontWeight: 800 }}
                                                    >
                                                        <MenuItem value=""><em>None</em></MenuItem>
                                                        {serviceReports.map((sr) => (
                                                            <MenuItem key={sr.id} value={sr.id}>{sr.service_report_no} - {sr.company_name}</MenuItem>
                                                        ))}
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

            {/* Forced Image Preloader - Uses opaque negligible dimensions to force eager network decoding */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', overflow: 'hidden', opacity: 0.001, pointerEvents: 'none', zIndex: -1 }}>
                {(editingIncident?.photos || []).map(p => <img key={`preload-server-${p.id}`} src={`${API_BASE_URL}/storage/${p.photo_path}`} alt="" loading="eager" crossOrigin="anonymous" />)}
                {photoPreviews.map((p, i) => <img key={`preload-local-${i}`} src={p} alt="" loading="eager" />)}
            </div>

            {/* Print Layout - Positioned off-screen to force eager image loading in the browser thread */}
            {/* Print Portal - Direct child of body to guarantee layout freedom */}
            {mounted && createPortal(
                <div id="print-report-container" style={{ position: 'fixed', top: -99999, left: -99999, pointerEvents: 'none' }}>
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
                            #print-report-container {
                                display: block !important;
                                visibility: visible !important;
                                position: static !important;
                                width: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                background: white !important;
                                pointer-events: auto !important;
                            }

                            #print-report-container * {
                                visibility: visible !important;
                            }

                            #print-report-container img {
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

export default IncidentReportPage;
