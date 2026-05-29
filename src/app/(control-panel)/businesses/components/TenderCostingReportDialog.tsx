import React, { useRef, useState, useEffect } from 'react';
import api from '@/utils/api';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { useTheme } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SignatureCanvas from 'react-signature-canvas';
import RefreshIcon from '@mui/icons-material/Refresh';

type Tender = any;
type CostingItem = any;

interface TenderCostingReportDialogProps {
    open: boolean;
    onClose: () => void;
    tender: Tender;
    items: CostingItem[];
    currentUser: any;
    onRequestChecking?: (signature: string) => void;
    onCheck?: (signature: string) => void;
    onVerify?: (signature: string) => void;
    onApprove?: (signature: string) => void;
}

export default function TenderCostingReportDialog({
    open,
    onClose,
    tender,
    items,
    currentUser,
    onRequestChecking,
    onCheck,
    onVerify,
    onApprove
}: TenderCostingReportDialogProps) {
    const theme = useTheme();
    const printRef = useRef<HTMLDivElement>(null);
    const sigPad = useRef<any>(null);
    const [signing, setSigning] = useState(false);
    const [actionType, setActionType] = useState<'request-verification' | 'check' | 'verify' | 'approve' | null>(null);
    const [sstRate, setSstRate] = useState<number>(8);

    useEffect(() => {
        if (open) {
            api.get('system-configs')
                .json<any>()
                .then(res => {
                    if (res && res.sst_rate !== undefined) {
                        const parsed = parseFloat(res.sst_rate);
                        if (!isNaN(parsed)) setSstRate(parsed);
                    }
                })
                .catch(console.error);
        }
    }, [open]);

    const sstMultiplier = sstRate / 100;

    if (!tender) return null;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const tableRows = items.map((item, idx) => {
            const tc = Number(item.quantity) * Number(item.unit_cost);
            const tp = Number(item.quantity) * Number(item.unit_price);
            const sst = item.has_sst ? tp * sstMultiplier : 0;
            const sstCostingItem = item.has_costing_sst ? tc * sstMultiplier : 0;
            const gp = tp - tc;
            const markup = tc > 0 ? (gp / tc) * 100 : 0;
            const margin = tp > 0 ? (gp / tp) * 100 : 0;
            return `
                <tr>
                    <td style="text-align: center; border: 1px solid #000;">${idx + 1}</td>
                    <td style="border: 1px solid #000; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word;">${item.item_name || ''}</td>
                    <td style="border: 1px solid #000; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word;">${item.details || '—'}</td>
                    <td style="border: 1px solid #000; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word;">${item.quotation_breakdown || '—'}</td>
                    <td style="text-align: center; border: 1px solid #000;">${item.quantity || 0}</td>
                    <td style="text-align: right; border: 1px solid #000;">${(Number(item.unit_cost) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right; border: 1px solid #000;">${tc.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right; border: 1px solid #000;">${sstCostingItem.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right; border: 1px solid #000;">${(Number(item.unit_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right; border: 1px solid #000;">${tp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: right; border: 1px solid #000;">${sst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style="text-align: center; border: 1px solid #000;">${markup.toFixed(1)}%</td>
                    <td style="text-align: center; border: 1px solid #000;">${margin.toFixed(1)}%</td>
                    <td style="text-align: right; border: 1px solid #000;">${gp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Costing Report - ${tender.projectCode || ''}</title>
                    <style>
                        @page { size: landscape; margin: 10mm; }
                        body { font-family: Arial, sans-serif; font-size: 10px; color: #000; margin: 20px; }
                        .header { font-weight: bold; text-decoration: underline; font-size: 14px; margin-bottom: 20px; text-transform: uppercase; }
                        .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
                        .info-table td { padding: 2px; border: none !important; font-size: 11px; }
                        .main-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; table-layout: fixed; }
                        .main-table colgroup col:nth-child(1) { width: 4%; }
                        .main-table colgroup col:nth-child(2) { width: 18%; }
                        .main-table colgroup col:nth-child(3) { width: 11%; }
                        .main-table colgroup col:nth-child(4) { width: 13%; }
                        .main-table colgroup col:nth-child(5) { width: 4%; }
                        .main-table colgroup col:nth-child(n+6) { width: 7%; }
                        .main-table th, .main-table td { border: 1px solid black; padding: 4px; font-size: 9px; word-break: break-word; overflow-wrap: break-word; }
                        .main-table th { background-color: #f0f0f0; font-weight: bold; }
                        .signature-section { display: flex; justify-content: space-between; margin-top: 80px; }
                        .sig-box { width: 22%; border-top: 1px solid black; padding-top: 5px; position: relative; min-height: 80px; }
                        .sig-title { font-weight: bold; font-size: 11px; position: absolute; top: -75px; left: 0; }
                        .sig-img { height: 50px; position: absolute; top: -55px; left: 10px; z-index: 10; }
                        .totals { background-color: #ffffcc !important; font-weight: bold; }
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    </style>
                </head>
                <body>
                    <div class="header">LATEST COSTING TEMPLATE (${new Date().toLocaleDateString('en-GB')})</div>
                    
                    <table class="info-table">
                        <tr><td width="150"><b>Company</b></td><td>: ${tender.company || ''}</td></tr>
                        <tr><td><b>Ref No</b></td><td>: ${tender.internalQuotation || tender.internal_quotation || ''}</td></tr>
                        <tr><td><b>Date</b></td><td>: ${tender.date || ''}</td></tr>
                        <tr><td><b>Customer</b></td><td>: ${tender.customer || ''}</td></tr>
                        <tr><td><b>Project Name</b></td><td>: ${tender.projectTitle || tender.project_title || ''}</td></tr>
                        <tr><td><b>Project Type</b></td><td>: ${tender.type || ''}</td></tr>
                        <tr><td><b>Project Owner (PIC)</b></td><td>: ${tender.personInCharge || tender.person_in_charge || '—'}</td></tr>
                        <tr><td><b>PIC Contact No.</b></td><td>: ${tender.contactNo || tender.contact_no || '—'}</td></tr>
                        <tr><td><b>PIC Email</b></td><td>: ${tender.email || '—'}</td></tr>
                    </table>

                    <table class="main-table">
                        <colgroup>
                            <col /><col /><col /><col /><col />
                            <col /><col /><col /><col /><col /><col />
                            <col /><col /><col />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>NO</th><th>Specification</th><th>Details</th><th>Quotation Breakdown</th><th>Qty</th>
                                <th>Unit Cost (RM)</th><th>Total Cost (RM)</th><th>SST</th>
                                <th>Unit Price (RM)</th><th>Total Price (RM)</th><th>SST (${sstRate}%)</th>
                                <th>Markup%</th><th>Margin%</th><th>GP (RM)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                            <tr class="totals">
                                <td colspan="4" style="text-align:right; border: 1px solid #000;">TOTALS</td>
                                <td style="text-align:center; border: 1px solid #000;">-</td>
                                <td style="text-align:center; border: 1px solid #000;">-</td>
                                <td style="text-align:right; border: 1px solid #000;">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style="text-align:right; border: 1px solid #000;">${sstCosting.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style="text-align:center; border: 1px solid #000;">-</td>
                                <td style="text-align:right; border: 1px solid #000;">${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style="text-align:right; border: 1px solid #000;">${sstSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style="text-align:center; border: 1px solid #000;">${totalMarkup.toFixed(2)}%</td>
                                <td style="text-align:center; border: 1px solid #000;">${totalMargin.toFixed(2)}%</td>
                                <td style="text-align:right; border: 1px solid #000;">${totalGp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="signature-section">
                        <div class="sig-box">
                            <span class="sig-title">Prepared By:</span>
                            ${tender.creator_signature ? `<img src="${tender.creator_signature}" class="sig-img">` : ''}
                            <b>${tender.creatorName || tender.creator?.name || ''}</b> <span style="font-weight:normal">(Business Member)</span><br>
                            <small>Date/Time: ${tender.createdAt ? new Date(tender.createdAt).toLocaleString() : ''}</small>
                        </div>
                        <div class="sig-box">
                            <span class="sig-title">Checked By:</span>
                            ${tender.checker_signature ? `<img src="${tender.checker_signature}" class="sig-img">` : ''}
                            <b>${tender.checker?.name || ''}</b> <span style="font-weight:normal">(Project Manager)</span><br>
                            <small>Date/Time: ${tender.checked_at ? new Date(tender.checked_at).toLocaleString() : ''}</small>
                        </div>
                        <div class="sig-box">
                            <span class="sig-title">Verified By:</span>
                            ${tender.verifier_signature ? `<img src="${tender.verifier_signature}" class="sig-img">` : ''}
                            <b>${tender.verifier?.name || ''}</b> <span style="font-weight:normal">(General Manager)</span><br>
                            <small>Date/Time: ${tender.verified_at ? new Date(tender.verified_at).toLocaleString() : ''}</small>
                        </div>
                        <div class="sig-box">
                            <span class="sig-title">Approved By:</span>
                            ${tender.approver_signature ? `<img src="${tender.approver_signature}" class="sig-img">` : ''}
                            <b>${tender.approver?.name || ''}</b> <span style="font-weight:normal">(Director)</span><br>
                            <small>Date/Time: ${tender.approved_at ? new Date(tender.approved_at).toLocaleString() : ''}</small>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        
        // Wait for signatures to load before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1500);
    };

    const role = currentUser?.role;
    const userRoles = Array.isArray(role) ? role : [role];
    const isProjectManager = userRoles.includes('business_admin');
    const isGeneralManager = userRoles.includes('business_higher_admin');
    const isDirector = userRoles.includes('superadmin') || userRoles.includes('admin');
    
    const vStatus = tender.verification_status;

    // Calculations
    const totalCost = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_cost)), 0);
    const totalPrice = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    const sstSales = items.reduce((sum, item) => sum + (item.has_sst ? (Number(item.quantity) * Number(item.unit_price) * sstMultiplier) : 0), 0);
    const sstCosting = items.reduce((sum, item) => sum + (item.has_costing_sst ? (Number(item.quantity) * Number(item.unit_cost) * sstMultiplier) : 0), 0);
    const totalSalesWithSst = totalPrice + sstSales;
    const totalCostWithSst = totalCost + sstCosting;
    const totalGp = totalPrice - totalCost;
    const totalMargin = totalPrice > 0 ? (totalGp / totalPrice) * 100 : 0;
    const totalMarkup = totalCost > 0 ? (totalGp / totalCost) * 100 : 0;

    const startSigning = (type: 'request-verification' | 'check' | 'verify' | 'approve') => {
        setActionType(type);
        setSigning(true);
    };

    const handleConfirmSignature = () => {
        if (!sigPad.current || sigPad.current.isEmpty()) {
            alert("Please sign before confirming.");
            return;
        }
        const signature = sigPad.current.toDataURL('image/png');
        if (actionType === 'request-verification' && onRequestChecking) onRequestChecking(signature);
        if (actionType === 'check' && onCheck) onCheck(signature);
        if (actionType === 'verify' && onVerify) onVerify(signature);
        if (actionType === 'approve' && onApprove) onApprove(signature);
        setSigning(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
            <Box sx={{ 
                p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: '#fff'
            }}>
                <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>Costing Report Analysis</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Auto-generated summary with digital signature support</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="contained" size="small" 
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                        Print Report
                    </Button>
                    <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>

            <DialogContent sx={{ p: 4, bgcolor: '#f1f5f9' }}>
                {signing ? (
                    <Box sx={{ bgcolor: '#fff', p: 4, borderRadius: 2, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom fontWeight={700} sx={{ color: actionType === 'approve' ? '#ef4444' : 'inherit' }}>
                            Please Sign using Mouse or Touch ({
                                actionType === 'request-verification' ? 'Prepared by Business Member' :
                                actionType === 'check' ? 'Checked by Project Manager' :
                                actionType === 'verify' ? 'Verified by General Manager' :
                                'Approved by Director'
                            })
                        </Typography>
                        <Box sx={{ border: actionType === 'approve' ? '2px dashed #ef4444' : '2px dashed #cbd5e1', borderRadius: 2, mb: 3, display: 'inline-block', bgcolor: actionType === 'approve' ? 'rgba(239, 68, 68, 0.02)' : '#f8fafc' }}>
                            <SignatureCanvas 
                                ref={sigPad}
                                canvasProps={{ width: 500, height: 200, className: 'sigCanvas' }}
                                penColor="black"
                            />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                            <Button variant="outlined" onClick={() => setSigning(false)} sx={{ textTransform: 'none', borderRadius: 1.5 }}>Cancel</Button>
                            <Button variant="outlined" color="warning" startIcon={<RefreshIcon />} onClick={() => sigPad.current?.clear()} sx={{ textTransform: 'none', borderRadius: 1.5 }}>Clear</Button>
                            <Button variant="contained" onClick={handleConfirmSignature}
                                sx={{ bgcolor: actionType === 'approve' ? '#ef4444' : 'primary.main', '&:hover': { bgcolor: actionType === 'approve' ? '#dc2626' : 'primary.dark' }, color: '#fff', textTransform: 'none', fontWeight: 700, borderRadius: 1.5, boxShadow: 'none' }}>
                                Confirm & Submit
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box ref={printRef} sx={{ 
                            bgcolor: '#fff', p: 5, borderRadius: 1, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            width: '1100px', mx: 'auto',
                            '& table': { borderCollapse: 'collapse', width: '100%', mb: 4 },
                            '& th, & td': { border: '1px solid #000', p: 1, fontSize: '11px', fontFamily: 'Tahoma, sans-serif' }
                        }}>
                            {/* Report Header */}
                            <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 3, textTransform: 'uppercase', textDecoration: 'underline', color: '#000' }}>
                                LATEST COSTING TEMPLATE ({new Date().toLocaleDateString('en-GB')})
                            </Typography>

                            {/* Info Grid */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 0.5, mb: 4, color: '#000' }}>
                                <Typography variant="caption" fontWeight={900}>Company</Typography>
                                <Typography variant="caption">: {tender.company || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Ref No</Typography>
                                <Typography variant="caption">: {tender.internalQuotation || tender.internal_quotation || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Date</Typography>
                                <Typography variant="caption">: {tender.date || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Customer</Typography>
                                <Typography variant="caption">: {tender.customer || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Project Name</Typography>
                                <Typography variant="caption">: {tender.projectTitle || tender.project_title || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Project Type</Typography>
                                <Typography variant="caption">: {tender.type || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Closing Date</Typography>
                                <Typography variant="caption">: {tender.submissionDate || tender.submission_date || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>Project Owner (PIC)</Typography>
                                <Typography variant="caption">: {tender.personInCharge || tender.person_in_charge || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>PIC Contact No.</Typography>
                                <Typography variant="caption">: {tender.contactNo || tender.contact_no || '—'}</Typography>
                                <Typography variant="caption" fontWeight={900}>PIC Email</Typography>
                                <Typography variant="caption">: {tender.email || '—'}</Typography>
                            </Box>

                            {/* Main Table */}
                            <table style={{ tableLayout: 'fixed', width: '100%' }}>
                                <colgroup>
                                    <col style={{ width: '4%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '11%' }} />
                                    <col style={{ width: '13%' }} />
                                    <col style={{ width: '4%' }} />
                                    <col style={{ width: '6%' }} />
                                    <col style={{ width: '8%' }} />
                                    <col style={{ width: '6%' }} />
                                    <col style={{ width: '6%' }} />
                                    <col style={{ width: '8%' }} />
                                    <col style={{ width: '6%' }} />
                                    <col style={{ width: '5%' }} />
                                    <col style={{ width: '5%' }} />
                                    <col style={{ width: '8%' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th rowSpan={2}>NO</th>
                                        <th rowSpan={2}>Specification</th>
                                        <th rowSpan={2}>Details</th>
                                        <th rowSpan={2}>Quotation Breakdown</th>
                                        <th rowSpan={2}>Qty</th>
                                        <th colSpan={3} style={{ backgroundColor: '#cffafe' }}>Costing</th>
                                        <th colSpan={3} style={{ backgroundColor: '#fee2e2' }}>SALES</th>
                                        <th colSpan={3} style={{ backgroundColor: '#e2e8f0' }}>MARKUP</th>
                                    </tr>
                                    <tr>
                                        <th style={{ backgroundColor: '#cffafe' }}>Unit Cost</th>
                                        <th style={{ backgroundColor: '#cffafe' }}>Total Cost (RM)</th>
                                        <th style={{ backgroundColor: '#cffafe' }}>SST</th>
                                        <th style={{ backgroundColor: '#fee2e2' }}>Unit price</th>
                                        <th style={{ backgroundColor: '#fee2e2' }}>Total Price (RM)</th>
                                        <th style={{ backgroundColor: '#fee2e2' }}>SST ({sstRate}%)</th>
                                        <th style={{ backgroundColor: '#e2e8f0' }}>MARKUP (%)</th>
                                        <th style={{ backgroundColor: '#e2e8f0' }}>Margin (%)</th>
                                        <th style={{ backgroundColor: '#e2e8f0' }}>GP (RM)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => {
                                        const tc = Number(item.quantity) * Number(item.unit_cost);
                                        const tp = Number(item.quantity) * Number(item.unit_price);
                                        const sst = item.has_sst ? tp * sstMultiplier : 0;
                                        const sstCostingItem = item.has_costing_sst ? tc * sstMultiplier : 0;
                                        const gp = tp - tc;
                                        const markup = tc > 0 ? (gp / tc) * 100 : 0;
                                        const margin = tp > 0 ? (gp / tp) * 100 : 0;
                                        return (
                                            <tr key={item.id}>
                                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{idx + 1}</td>
                                                <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.item_name}</td>
                                                <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.details || '—'}</td>
                                                <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{item.quotation_breakdown || '—'}</td>
                                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{item.quantity}</td>
                                                <td style={{ textAlign: 'right' }}>{Number(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>{tc.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>{sstCostingItem.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>{tp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>{sst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right' }}>{markup.toFixed(1)}%</td>
                                                <td style={{ textAlign: 'right' }}>{margin.toFixed(1)}%</td>
                                                <td style={{ textAlign: 'right' }}>{gp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        );
                                    })}
                                    {/* Empty rows */}
                                    {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, i) => (
                                        <tr key={`empty-${i}`} style={{ height: '24px' }}>
                                            {Array.from({ length: 14 }).map((__, j) => <td key={j}></td>)}
                                        </tr>
                                    ))}
                                    <tr style={{ backgroundColor: '#fef9c3', fontWeight: 'bold' }}>
                                        <td colSpan={5} style={{ textAlign: 'right', fontSize: '12px' }}>TOTALS</td>
                                        <td style={{ textAlign: 'right' }}>—</td>
                                        <td style={{ textAlign: 'right' }}>{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ textAlign: 'right' }}>{sstCosting.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ textAlign: 'right' }}>—</td>
                                        <td style={{ textAlign: 'right' }}>{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ textAlign: 'right' }}>{sstSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td style={{ textAlign: 'right' }}>{totalMarkup.toFixed(2)}%</td>
                                        <td style={{ textAlign: 'right' }}>{totalMargin.toFixed(2)}%</td>
                                        <td style={{ textAlign: 'right', backgroundColor: '#fef08a' }}>{totalGp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5} rowSpan={2} style={{ border: 'none' }}></td>
                                        <td colSpan={2} style={{ textAlign: 'right', fontWeight: 900, backgroundColor: '#cffafe' }}>Total Cost with SST</td>
                                        <td style={{ textAlign: 'right', fontWeight: 900, backgroundColor: '#fef08a' }}>{totalCostWithSst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td colSpan={2} style={{ textAlign: 'right', fontWeight: 900, backgroundColor: '#fee2e2' }}>Total Sales Price with SST</td>
                                        <td style={{ textAlign: 'right', fontWeight: 900, backgroundColor: '#fef08a' }}>{totalSalesWithSst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td colSpan={3} style={{ border: 'none' }}></td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Signature Blocks */}
                            <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-between', color: '#000' }}>
                                {/* Prepared By */}
                                <Box sx={{ width: '22%', display: 'flex', flexDirection: 'column', height: '130px' }}>
                                    <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 'auto' }}>Prepared By :</Typography>
                                    <Box sx={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        {tender.creator_signature && (
                                            <img src={tender.creator_signature} alt="sig" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                        )}
                                    </Box>
                                    <Box sx={{ borderTop: '1px solid #000', pt: 0.5 }}>
                                        <Typography variant="caption" display="block">
                                            <strong>{tender.creatorName || tender.creator?.name || '—'}</strong>
                                            {' '}<span style={{ fontWeight: 400 }}>(Business Member)</span>
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ fontSize: '9px', opacity: 0.7 }}>
                                            Date/Time: {tender.createdAt ? new Date(tender.createdAt).toLocaleString() : '—'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Checked By */}
                                <Box sx={{ width: '22%', display: 'flex', flexDirection: 'column', height: '130px' }}>
                                    <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 'auto' }}>Checked By :</Typography>
                                    <Box sx={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        {tender.checker_signature && (
                                            <img src={tender.checker_signature} alt="sig" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                        )}
                                    </Box>
                                    <Box sx={{ borderTop: '1px solid #000', pt: 0.5 }}>
                                        <Typography variant="caption" display="block">
                                            <strong>{tender.checker?.name || '—'}</strong>
                                            {' '}<span style={{ fontWeight: 400 }}>(Project Manager)</span>
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ fontSize: '9px', opacity: 0.7 }}>
                                            Date/Time: {tender.checked_at ? new Date(tender.checked_at).toLocaleString() : '—'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Verified By */}
                                <Box sx={{ width: '22%', display: 'flex', flexDirection: 'column', height: '130px' }}>
                                    <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 'auto' }}>Verified By :</Typography>
                                    <Box sx={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        {tender.verifier_signature && (
                                            <img src={tender.verifier_signature} alt="sig" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                        )}
                                    </Box>
                                    <Box sx={{ borderTop: '1px solid #000', pt: 0.5 }}>
                                        <Typography variant="caption" display="block">
                                            <strong>{tender.verifier?.name || '—'}</strong>
                                            {' '}<span style={{ fontWeight: 400 }}>(General Manager)</span>
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ fontSize: '9px', opacity: 0.7 }}>
                                            Date/Time: {tender.verified_at ? new Date(tender.verified_at).toLocaleString() : '—'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Approved By */}
                                <Box sx={{
                                    width: '22%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '130px',
                                    border: tender.approver_signature ? '1px dashed #ef4444' : 'none',
                                    borderRadius: '8px',
                                    p: tender.approver_signature ? 1 : 0,
                                    bgcolor: tender.approver_signature ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
                                }}>
                                    <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 'auto', color: tender.approver_signature ? '#ef4444' : '#000' }}>Approved By :</Typography>
                                    <Box sx={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        {tender.approver_signature && (
                                            <img src={tender.approver_signature} alt="sig" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                        )}
                                    </Box>
                                    <Box sx={{ borderTop: tender.approver_signature ? 'none' : '1px solid #000', pt: 0.5 }}>
                                        <Typography variant="caption" display="block" sx={{ color: tender.approver_signature ? '#ef4444' : '#000' }}>
                                            <strong>{tender.approver?.name || '—'}</strong>
                                            {' '}<span style={{ fontWeight: 400 }}>(Director)</span>
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ fontSize: '9px', opacity: 0.7, color: tender.approver_signature ? '#b91c1c' : 'inherit' }}>
                                            Date/Time: {tender.approved_at ? new Date(tender.approved_at).toLocaleString() : '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', gap: 2, bgcolor: '#f8fafc' }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3 }}>
                    Close Preview
                </Button>

                {!signing && (!vStatus || vStatus === 'draft') && onRequestChecking && (
                    <Button variant="contained" color="primary" startIcon={<CheckCircleOutlineIcon />} onClick={() => startSigning('request-verification')}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 4, boxShadow: 'none' }}>
                        Sign & Request Checking
                    </Button>
                )}
                
                {!signing && (vStatus === 'pending_supervisor') && (isProjectManager || isGeneralManager) && onCheck && (
                    <Button variant="contained" color="secondary" startIcon={<CheckCircleOutlineIcon />} onClick={() => startSigning('check')}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 4, boxShadow: 'none' }}>
                        Check & Request Verification
                    </Button>
                )}

                {!signing && (vStatus === 'pending_verify') && isGeneralManager && onVerify && (
                    <Button variant="contained" color="warning" startIcon={<CheckCircleOutlineIcon />} onClick={() => startSigning('verify')}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 4, boxShadow: 'none' }}>
                        Verify & Request Approval
                    </Button>
                )}
                
                {!signing && (vStatus === 'pending_superadmin') && isDirector && onApprove && (
                    <Button variant="contained" startIcon={<DoneAllIcon />} onClick={() => startSigning('approve')}
                        sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 4, boxShadow: 'none', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
                        Final Approval
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
