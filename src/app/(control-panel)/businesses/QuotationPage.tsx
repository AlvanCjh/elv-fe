import { useParams, useNavigate } from 'react-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/utils/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import SettingsIcon from '@mui/icons-material/Settings';
import DrawIcon from '@mui/icons-material/Draw';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import useAuth from '@fuse/core/FuseAuthProvider/useAuth';
import { useTheme } from '@mui/material/styles';

const SST_RATE_DEFAULT = 8;

function ElegantAspireLogo({ size = 72 }: { size?: number }) {
    return (
        <svg width={size} height={size * 1.08} viewBox="0 0 72 78" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="36,2 70,39 36,76 2,39" stroke="#aaa" strokeWidth="1" fill="none"/>
            {[11,20,30,39,48,58,67].map((y,i) => (
                <line key={`h${i}`} x1="2" y1={y} x2="70" y2={y} stroke="#d8d8d8" strokeWidth="0.6"/>
            ))}
            {[-18,-9,0,9,18,27,36].map((offset,i) => (
                <line key={`dl${i}`} x1={offset} y1={0} x2={offset+78} y2={78} stroke="#d8d8d8" strokeWidth="0.6"/>
            ))}
            {[90,81,72,63,54,45,36].map((offset,i) => (
                <line key={`dr${i}`} x1={offset} y1={0} x2={offset-78} y2={78} stroke="#d8d8d8" strokeWidth="0.6"/>
            ))}
            {[[36,2],[70,39],[36,76],[2,39]].map(([x,y],i) => (
                <circle key={`v${i}`} cx={x} cy={y} r="2" fill="#999"/>
            ))}
            {[[36,11],[20,20],[52,20],[10,30],[36,30],[62,30],[2,39],[36,39],[70,39],
              [10,48],[36,48],[62,48],[20,58],[52,58],[36,67]].map(([x,y],i) => (
                <circle key={`n${i}`} cx={x} cy={y} r="1.3" fill="#bbb"/>
            ))}
            <polygon points="36,25 46.4,44 25.6,44" fill="#22c55e"/>
            <polygon points="36,53 46.4,34 25.6,34" fill="#16a34a"/>
        </svg>
    );
}

export default function QuotationPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { authState } = useAuth();
    const user = authState?.user as any;

    // Role check — only project manager (business_admin) can sign
    const canSign = user?.role === 'business_admin' || (Array.isArray(user?.role) && user.role.includes('business_admin'));

    const [tender, setTender] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [configs, setConfigs] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    // Signature state
    const [signature, setSignature] = useState<string | null>(null);
    const [signOpen, setSignOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);

    // Load saved signature from localStorage
    useEffect(() => {
        if (id) {
            const saved = localStorage.getItem(`q_sig_${id}`);
            if (saved) setSignature(saved);
        }
    }, [id]);

    // Per-tender delivery & validity — only the variable part (loaded from config defaults, overridable per tender)
    const [deliveryPeriod, setDeliveryPeriod] = useState('8 - 12 working weeks');
    const [validityPeriod, setValidityPeriod] = useState('30 days');
    useEffect(() => {
        if (id && Object.keys(configs).length > 0) {
            // Config defaults
            const cfgDelivery = configs.quotation_delivery_period || '8 - 12 working weeks';
            const cfgValidity = configs.quotation_validity_period || '30 days';
            // Per-tender overrides (from localStorage)
            const d = localStorage.getItem(`q_delivery_${id}`) ?? cfgDelivery;
            const v = localStorage.getItem(`q_validity_${id}`) ?? cfgValidity;
            setDeliveryPeriod(d);
            setValidityPeriod(v);
        }
    }, [id, configs]);
    const saveDeliveryPeriod = (val: string) => { setDeliveryPeriod(val); localStorage.setItem(`q_delivery_${id}`, val); };
    const saveValidityPeriod = (val: string) => { setValidityPeriod(val); localStorage.setItem(`q_validity_${id}`, val); };

    // Canvas drawing helpers
    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if ('touches' in e) {
            return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const onMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current; if (!canvas) return;
        isDrawing.current = true;
        const { x, y } = getPos(e, canvas);
        const ctx = canvas.getContext('2d')!;
        ctx.beginPath(); ctx.moveTo(x, y);
    };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing.current) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const { x, y } = getPos(e, canvas);
        const ctx = canvas.getContext('2d')!;
        ctx.lineTo(x, y); ctx.stroke();
    };
    const onMouseUp = () => { isDrawing.current = false; };

    const clearCanvas = () => {
        const canvas = canvasRef.current; if (!canvas) return;
        canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
        initCanvas();
    };

    const saveSignature = () => {
        const canvas = canvasRef.current; if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        setSignature(dataUrl);
        localStorage.setItem(`q_sig_${id}`, dataUrl);
        setSignOpen(false);
    };

    const removeSignature = () => {
        setSignature(null);
        localStorage.removeItem(`q_sig_${id}`);
    };

    useEffect(() => {
        if (id) {
            Promise.all([
                api.get(`tenders/${id}`).json<any>(),
                api.get(`tenders/${id}/costing-items`).json<any[]>(),
                api.get('system-configs').json<Record<string, string>>(),
            ]).then(([t, it, cfg]) => {
                setTender(t); setItems(it); setConfigs(cfg);
            }).catch(console.error).finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <Box sx={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%' }}><CircularProgress/></Box>;
    if (!tender) return <Box sx={{ p:6, textAlign:'center' }}><Typography color="text.secondary">Tender not found.</Typography></Box>;

    const company = (tender.company || '').toUpperCase();
    let letterhead: any = null;
    try { const raw = configs[`quotation_letterhead_${company}`]; if (raw) letterhead = JSON.parse(raw); } catch {}

    const companyName = letterhead?.name || 'ELEGANT ASPIRE SDN. BHD.';
    const address = letterhead?.address || 'Lot 25, 1st Floor, Likas Square Commercial Centre,\nJalan Istiadat, 88400 Kota Kinabalu, Sabah.';
    const tel = letterhead?.tel || '088 266 051';
    const fax = letterhead?.fax || '088 266 015';

    const sstRate = Number(configs.sst_rate || SST_RATE_DEFAULT);
    const sstFactor = sstRate / 100;

    const fmt = (n: number) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Per-item calculations (sales only)
    const tableRows = items.map(item => {
        const totalPrice = item.quantity * Number(item.unit_price);
        const sstAmt = item.has_sst ? totalPrice * sstFactor : 0;
        return { ...item, totalPrice, sstAmt };
    });

    const subtotal = tableRows.reduce((s, r) => s + r.totalPrice, 0);
    const totalSst = tableRows.reduce((s, r) => s + r.sstAmt, 0);
    const grandTotal = subtotal + totalSst;

    // Notes: (a)(b) use per-tender period values; (c)(d)(e) are completely fixed
    const noteLines = [
        `Delivery : ${deliveryPeriod} upon Official Purchase Order.`,
        `Validity : ${validityPeriod} from today's date.`,
        'Effective from 1st March 2024, the rate of services tax under the Service Tax Act 2018 will be increased from 6% to 8%.',
        'The above price quoted is based on current exchange rate and subject to review of exchange rate fluctuation at time of order. We reserved the rights to vary the price and delivery period based on market situation then on the supply and availability of our product without prior notice.',
        'Any other accessories or extra works will subject to additional charges.',
    ];

    // Format date dd/mm/yyyy
    const fmtDate = (d: string) => {
        if (!d) return '—';
        const parts = d.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return d;
    };

    // Dear salutation — use person_in_charge
    const attn = tender.person_in_charge || '';

    return (
        <Box sx={{ height:'100%', display:'flex', flexDirection:'column', bgcolor: isDark ? '#0f172a' : '#e8eaf0' }}>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 10mm 12mm; }
                    #quotation-document { box-shadow: none !important; }

                    /* ── Print-only font scaling ── */
                    #quotation-document {
                        font-size: 13pt !important;
                    }
                    #quotation-document table {
                        font-size: 11pt !important;
                    }
                    #quotation-document .quotation-company-name {
                        font-size: 16pt !important;
                    }
                    #quotation-document .quotation-address {
                        font-size: 10pt !important;
                    }
                    #quotation-document .quotation-title {
                        font-size: 28pt !important;
                    }
                    #quotation-document .quotation-grand-total {
                        font-size: 14pt !important;
                    }
                    #quotation-document .quotation-notes {
                        font-size: 9.5pt !important;
                    }
                }
            `}</style>

            {/* Toolbar */}
            <Box className="no-print" sx={{ px:3, py:2, borderBottom:'1px solid', borderColor:'divider', bgcolor:'background.paper', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
                    <IconButton onClick={() => navigate(`/businesses/tenders/${id}/costing`)} size="small" sx={{ border:'1px solid', borderColor:'divider', borderRadius:1.5 }}>
                        <ArrowBackIcon fontSize="small"/>
                    </IconButton>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Quotation</Typography>
                        <Typography variant="caption" color="text.secondary">{tender.internal_quotation || `Tender ${id}`}</Typography>
                    </Box>
                </Box>
                {/* Delivery & Validity — only the variable part, hidden on print */}
                <Box sx={{ display:'flex', gap:1.5, alignItems:'center', flex:1, mx:2 }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1, flex:1 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ whiteSpace:'nowrap', color:'text.secondary', minWidth:58 }}>Delivery:</Typography>
                        <input
                            value={deliveryPeriod}
                            onChange={e => saveDeliveryPeriod(e.target.value)}
                            style={{
                                flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'5px 10px',
                                fontSize:12, fontFamily:'inherit', outline:'none', background:'transparent', color:'inherit'
                            }}
                            placeholder="e.g. 8 - 12 working weeks"
                        />
                        <Typography variant="caption" color="text.disabled" sx={{ whiteSpace:'nowrap' }}>wks upon P.O.</Typography>
                    </Box>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1, flex:1 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ whiteSpace:'nowrap', color:'text.secondary', minWidth:52 }}>Validity:</Typography>
                        <input
                            value={validityPeriod}
                            onChange={e => saveValidityPeriod(e.target.value)}
                            style={{
                                flex:1, border:'1px solid #e2e8f0', borderRadius:8, padding:'5px 10px',
                                fontSize:12, fontFamily:'inherit', outline:'none', background:'transparent', color:'inherit'
                            }}
                            placeholder="e.g. 30 days"
                        />
                        <Typography variant="caption" color="text.disabled" sx={{ whiteSpace:'nowrap' }}>from today.</Typography>
                    </Box>
                </Box>
                <Box sx={{ display:'flex', gap:1.5 }}>
                    {canSign && (
                        <>
                            {signature && (
                                <Tooltip title="Remove signature">
                                    <IconButton size="small" color="error" onClick={removeSignature}
                                        sx={{ border:'1px solid', borderColor:'error.light', borderRadius:1.5 }}>
                                        <DeleteOutlineIcon fontSize="small"/>
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Button variant={signature ? 'outlined' : 'contained'} size="small"
                                startIcon={<DrawIcon/>} onClick={() => { setSignOpen(true); setTimeout(initCanvas, 50); }}
                                color={signature ? 'success' : 'primary'}
                                sx={{ textTransform:'none', fontWeight:700, borderRadius:2, boxShadow:'none' }}>
                                {signature ? '✓ Signed — Re-sign' : 'Sign Quotation'}
                            </Button>
                        </>
                    )}
                    <Tooltip title="Configure address & notes in Setup Config">
                        <Button variant="outlined" size="small" startIcon={<SettingsIcon/>} onClick={() => navigate('/businesses/setup-config')}
                            sx={{ textTransform:'none', fontWeight:700, borderRadius:2 }}>
                            Setup Config
                        </Button>
                    </Tooltip>
                    <Button variant="contained" size="small" startIcon={<PrintIcon/>} onClick={() => window.print()}
                        sx={{ textTransform:'none', fontWeight:700, borderRadius:2, boxShadow:'none', background:'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
                        Print / Save PDF
                    </Button>
                </Box>
            </Box>

            {/* Document */}
            <Box className="quotation-wrapper" sx={{ flex:1, overflow:'auto', p:{ xs:1, md:4 } }}>
                <Box id="quotation-document" className="print:block" sx={{
                    width:{ xs:'100%', md:'210mm' }, minHeight:'297mm', mx:'auto',
                    bgcolor:'#fff', boxShadow:'0 8px 40px rgba(0,0,0,0.15)',
                    px:'18mm', pt:'14mm', pb:'18mm',
                    fontFamily:'"Arial", sans-serif', fontSize:'13px', color:'#111',
                }}>

                    {/* ── 1. LETTERHEAD ── */}
                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb:'4mm' }}>
                        <Box><ElegantAspireLogo size={68}/></Box>
                        <Box sx={{ textAlign:'right' }}>
                            <Box className="quotation-company-name" sx={{ fontSize:17, fontWeight:900, letterSpacing:0.3 }}>{companyName}</Box>
                            {address.split('\n').map((line:string, i:number) => (
                                <Box key={i} className="quotation-address" sx={{ fontSize:12, color:'#333', lineHeight:1.7 }}>{line}</Box>
                            ))}
                            <Box className="quotation-address" sx={{ fontSize:12, color:'#333', mt:0.25 }}>TEL: {tel}&nbsp;&nbsp;&nbsp;FAX : {fax}</Box>
                        </Box>
                    </Box>

                    {/* ── 2. REF + QUOTATION TITLE ── */}
                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', mb:'4mm' }}>
                        <Box>
                            <Box sx={{ fontSize:13, mb:0.4 }}>
                                <span style={{ display:'inline-block', minWidth:38 }}>Ref.</span>
                                <span style={{ marginRight:6 }}>:</span>
                                <strong>{tender.internal_quotation || '—'}</strong>
                            </Box>
                            <Box sx={{ fontSize:13 }}>
                                <span style={{ display:'inline-block', minWidth:38 }}>Date</span>
                                <span style={{ marginRight:6 }}>:</span>
                                {fmtDate(tender.date || tender.submission_date || '')}
                            </Box>
                        </Box>
                        <Box className="quotation-title" sx={{ fontSize:30, fontWeight:900, fontStyle:'italic', letterSpacing:1, color:'#000' }}>
                            QUOTATION
                        </Box>
                    </Box>

                    {/* ── 3. CUSTOMER ADDRESS + ATTENTION ── */}
                    <Box sx={{ display:'flex', justifyContent:'space-between', mb:'3mm' }}>
                        {/* Left: customer address */}
                        <Box sx={{ maxWidth:'55%' }}>
                            <Box sx={{ fontSize:13, fontWeight:700 }}>{tender.customer || '—'}</Box>
                            {(tender.customer_address || '').split('\n').map((line:string, i:number) => (
                                <Box key={i} sx={{ fontSize:13 }}>{line}</Box>
                            ))}
                        </Box>
                        {/* Right: contact details */}
                        <Box sx={{ textAlign:'left', minWidth:200 }}>
                            {attn && (
                                <Box sx={{ fontSize:13, mb:0.4, display:'flex', gap:1 }}>
                                    <strong style={{ minWidth:80 }}>Attention:</strong> {attn}
                                </Box>
                            )}
                            {tender.contact_no && (
                                <Box sx={{ fontSize:13, mb:0.4, display:'flex', gap:1 }}>
                                    <strong style={{ minWidth:80 }}>Contact:</strong> {tender.contact_no}
                                </Box>
                            )}
                            {tender.email && (
                                <Box sx={{ fontSize:13, display:'flex', gap:1 }}>
                                    <strong style={{ minWidth:80 }}>Email:</strong> {tender.email}
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* ── 4. QUOTATION SUBJECT LINE ── */}
                    {tender.project_title && (
                        <Box sx={{ mb:'3mm', fontSize:13, fontWeight:700, textDecoration:'underline', wordBreak:'break-word', overflowWrap:'break-word' }}>
                            QUOTATION : {tender.project_title}
                        </Box>
                    )}

                    {/* ── 5. GREETING ── */}
                    {attn && (
                        <Box sx={{ mb:'2mm', fontSize:13 }}>Dear {attn},</Box>
                    )}

                    {/* ── 6. INTRO ── */}
                    <Box sx={{ mb:'4mm', fontSize:13 }}>
                        We are pleased to furnish you a quotation proposal for your kind consideration.
                    </Box>

                    {/* ── 7. ITEMS TABLE ── */}
                    <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'4mm', fontSize:12, border:'1px solid #555', tableLayout:'fixed' }}>
                        <colgroup>
                            <col style={{ width:'5%' }} />
                            <col style={{ width:'45%' }} />
                            <col style={{ width:'8%' }} />
                            <col style={{ width:'14%' }} />
                            <col style={{ width:'14%' }} />
                            <col style={{ width:'14%' }} />
                        </colgroup>
                        <thead>
                            <tr style={{ background:'#fff' }}>
                                <th style={{ padding:'6px 8px', border:'1px solid #555', textAlign:'center' }}>No.</th>
                                <th style={{ padding:'6px 8px', border:'1px solid #555', textAlign:'center' }}>Description</th>
                                <th style={{ padding:'6px 8px', border:'1px solid #555', textAlign:'center' }}>Qty</th>
                                <th style={{ padding:'6px 8px', border:'1px solid #555', textAlign:'center' }}>Unit Price<br/>(RM)</th>
                                <th style={{ padding:'6px 8px', border:'1px solid #555', textAlign:'center' }}>SST {sstRate}%</th>
                                <th style={{ padding:'6px 8px', border:'1px solid #555', textAlign:'center' }}>Price (RM)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.map((item, idx) => {
                                const desc = [item.item_name, item.details, item.quotation_breakdown].filter(Boolean).join('\n');
                                return (
                                    <tr key={item.id}>
                                        <td style={{ padding:'6px 8px', border:'1px solid #aaa', textAlign:'center', verticalAlign:'middle', wordBreak:'break-word' }}>{idx + 1}</td>
                                        <td style={{ padding:'6px 8px', border:'1px solid #aaa', verticalAlign:'top', whiteSpace:'pre-wrap', wordBreak:'break-word', overflowWrap:'break-word' }}>{desc}</td>
                                        <td style={{ padding:'6px 8px', border:'1px solid #aaa', textAlign:'center', verticalAlign:'middle', wordBreak:'break-word' }}>{item.quantity}</td>
                                        <td style={{ padding:'6px 8px', border:'1px solid #aaa', textAlign:'right', verticalAlign:'middle', wordBreak:'break-word' }}>{fmt(item.unit_price)}</td>
                                        <td style={{ padding:'6px 8px', border:'1px solid #aaa', textAlign:'right', verticalAlign:'middle', wordBreak:'break-word' }}>
                                            {item.has_sst ? fmt(item.sstAmt) : ''}
                                        </td>
                                        <td style={{ padding:'6px 8px', border:'1px solid #aaa', textAlign:'right', verticalAlign:'middle', fontWeight:600, wordBreak:'break-word' }}>{fmt(item.totalPrice)}</td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && (
                                <tr><td colSpan={6} style={{ padding:'20px', textAlign:'center', color:'#94a3b8', border:'1px solid #aaa' }}>No items found.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* ── 8. TOTALS ── */}
                    <Box sx={{ display:'flex', justifyContent:'flex-end', mb:'5mm' }}>
                        <table style={{ borderCollapse:'collapse', minWidth:280, fontSize:13 }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding:'3px 16px', textAlign:'right' }}>Total Without SST</td>
                                    <td style={{ padding:'3px 12px', textAlign:'right', width:120 }}>{fmt(subtotal)}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding:'3px 16px', textAlign:'right' }}>SST {sstRate}%</td>
                                    <td style={{ padding:'3px 12px', textAlign:'right' }}>{fmt(totalSst)}</td>
                                </tr>
                                <tr style={{ borderTop:'2px solid #111', borderBottom:'2px solid #111' }}>
                                    <td className="quotation-grand-total" style={{ padding:'5px 16px', textAlign:'right', fontWeight:900, fontSize:15 }}>GRAND TOTAL</td>
                                    <td className="quotation-grand-total" style={{ padding:'5px 12px', textAlign:'right', fontWeight:900, fontSize:15 }}>{fmt(grandTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </Box>

                    {/* ── 9. NOTES (lettered list) ── */}
                    <Box sx={{ mb:'6mm' }} className="quotation-notes">
                        <Box sx={{ fontSize:13, fontWeight:700, mb:'2mm' }}>Notes</Box>
                        {noteLines.map((line: string, idx: number) => (
                            <Box key={idx} sx={{ display:'flex', gap:'8px', mb:'1.5mm', fontSize:12, alignItems:'flex-start' }}>
                                <Box sx={{ minWidth:22, flexShrink:0, fontWeight:400 }}>({String.fromCharCode(97 + idx)})</Box>
                                <Box sx={{ flex:1, lineHeight:1.6, wordBreak:'break-word', overflowWrap:'break-word' }}>{line}</Box>
                            </Box>
                        ))}
                    </Box>

                    {/* ── 10. YOURS FAITHFULLY + SIGNATURE (LEFT) ── */}
                    <Box sx={{ mt:'6mm', mb:'4mm', fontSize:13 }}>Yours faithfully</Box>
                    <Box sx={{ display:'flex', justifyContent:'flex-start' }}>
                        <Box sx={{ textAlign:'left', minWidth:220 }}>
                            <Box sx={{ fontSize:13, fontWeight:700, mb: signature ? '2mm' : '14mm' }}>{companyName}</Box>
                            {signature && (
                                <Box sx={{ mb:'2mm' }}>
                                    <img src={signature} alt="Signature" style={{ height:50, maxWidth:180, display:'block' }}/>
                                </Box>
                            )}
                            {!signature && <Box sx={{ height:'12mm' }}/>}
                            <Box sx={{ width:180, borderBottom:'1px solid #222', mb:'2mm' }}/>
                            {/* Name + position label */}
                            <Box sx={{ fontSize:13, display:'flex', alignItems:'baseline', gap:'3px', flexWrap:'wrap' }}>
                                <span style={{ fontWeight:700 }}>{(user as any)?.displayName || ''}</span>
                                <span style={{ fontWeight:400 }}>(Project Manager)</span>
                            </Box>
                        </Box>
                    </Box>

                </Box>
            </Box>

            {/* ── SIGNATURE PAD DIALOG ── */}
            <Dialog open={signOpen} onClose={() => setSignOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
                    Sign Quotation
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, mt: 0.5 }}>
                        Draw your signature below. This will appear on the printed quotation.
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pt: 2.5, pb: 1 }}>
                    <Box sx={{
                        border: '2px solid', borderColor: 'divider', borderRadius: 2,
                        bgcolor: '#fafafa', cursor: 'crosshair', userSelect: 'none',
                        display: 'flex', justifyContent: 'center'
                    }}>
                        <canvas
                            ref={canvasRef}
                            width={520} height={160}
                            style={{ width: '100%', height: 160, display: 'block', touchAction: 'none' }}
                            onMouseDown={onMouseDown}
                            onMouseMove={onMouseMove}
                            onMouseUp={onMouseUp}
                            onMouseLeave={onMouseUp}
                        />
                    </Box>
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                        Draw your signature with mouse or touchpad
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={clearCanvas} startIcon={<DeleteOutlineIcon/>}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Clear</Button>
                    <Box sx={{ flex: 1 }}/>
                    <Button onClick={() => setSignOpen(false)}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>Cancel</Button>
                    <Button variant="contained" onClick={saveSignature}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none',
                            background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
                        Save Signature
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
