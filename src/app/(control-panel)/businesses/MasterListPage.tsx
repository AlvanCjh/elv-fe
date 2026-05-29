import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import { motion, AnimatePresence } from 'motion/react';
import { useMasterList, MasterListCategory, MasterListItem } from './context/MasterListContext';

const CATEGORIES: { id: MasterListCategory; label: string; icon: string; hasContact: boolean; hasItems?: boolean }[] = [
    { id: 'status',           label: 'Status',            icon: '🔵', hasContact: false },
    { id: 'type',             label: 'Type',              icon: '🏷️', hasContact: false },
    { id: 'agencyTypes',      label: 'Agency Types',      icon: '🏛️', hasContact: true  },
    { id: 'company',          label: 'Company',           icon: '🏢', hasContact: true  },
    { id: 'customer',         label: 'Customer',          icon: '👤', hasContact: true  },
    { id: 'supplier',         label: 'Supplier',          icon: '📦', hasContact: true, hasItems: true },
    { id: 'quotationVersion', label: 'Quotation Version', icon: '📄', hasContact: false },
];

// ── Colour picker ─────────────────────────────────────────────────
const PRESET_COLORS = [
    '#16a34a','#22c55e','#15803d','#166534',
    '#3b82f6','#1d4ed8','#1e40af','#1e3a8a',
    '#dc2626','#991b1b','#ef4444','#f97316',
    '#d97706','#f59e0b','#78350f','#c2410c',
    '#7c3aed','#a78bfa','#0d9488','#0f766e',
    '#6b7280','#374151','#1e293b','#111827',
    '#f9a8d4','#831843',
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
            {PRESET_COLORS.map(c => (
                <Box key={c} onClick={() => onChange(c)} sx={{
                    width: 24, height: 24, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                    border: value === c ? '3px solid #60a5fa' : '2px solid transparent',
                    transition: 'border 0.15s, transform 0.15s',
                    '&:hover': { transform: 'scale(1.15)' }
                }} />
            ))}
            {/* None */}
            <Box onClick={() => onChange('')} sx={{
                width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
                border: !value ? '3px solid #60a5fa' : '2px solid #e5e7eb',
                background: 'repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 3px,#fff 3px,#fff 6px)',
            }} />
        </Box>
    );
}

// ── Hover tooltip content ─────────────────────────────────────────
function ContactTooltipContent({ item }: { item: MasterListItem }) {
    const hasAny = item.email || item.contact1 || item.contact2 || item.contact3 || item.picName || item.picPhone || item.picEmail;
    if (!hasAny) return (
        <Box sx={{ p: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>No contact info saved</Typography>
        </Box>
    );
    return (
        <Box sx={{ p: 0.5, minWidth: 180 }}>
            <Typography variant="caption" fontWeight={800} sx={{ color: '#fff', display: 'block', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10 }}>
                {item.label}
            </Typography>
            {item.itemsSupplied && (
                <Box sx={{ mb: 1, p: 0.75, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: '#e2e8f0', fontSize: 11, display: 'block', fontStyle: 'italic' }}>
                        📦 Supplies: {item.itemsSupplied}
                    </Typography>
                </Box>
            )}

            {/* Company Contacts */}
            {(item.email || item.contact1 || item.contact2 || item.contact3) && (
                <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 9, display: 'block', textTransform: 'uppercase', fontWeight: 700, mb: 0.5 }}>
                        Company Contacts
                    </Typography>
                    {item.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 12, color: '#93c5fd' }} />
                            <Typography variant="caption" sx={{ color: '#e2e8f0', fontSize: 11 }}>{item.email}</Typography>
                        </Box>
                    )}
                    {[item.contact1, item.contact2, item.contact3].filter(Boolean).map((c, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                            <PhoneIcon sx={{ fontSize: 12, color: '#86efac' }} />
                            <Typography variant="caption" sx={{ color: '#e2e8f0', fontSize: 11 }}>{c}</Typography>
                        </Box>
                    ))}
                </Box>
            )}

            {/* PIC Contacts */}
            {(item.picName || item.picPhone || item.picEmail) && (
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: 9, display: 'block', textTransform: 'uppercase', fontWeight: 700, mb: 0.5 }}>
                        Person In Charge (PIC)
                    </Typography>
                    {item.picName && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                            <PersonIcon sx={{ fontSize: 12, color: '#fb7185' }} />
                            <Typography variant="caption" sx={{ color: '#e2e8f0', fontSize: 11, fontWeight: 700 }}>{item.picName}</Typography>
                        </Box>
                    )}
                    {item.picPhone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                            <PhoneIcon sx={{ fontSize: 12, color: '#fb7185' }} />
                            <Typography variant="caption" sx={{ color: '#e2e8f0', fontSize: 11 }}>{item.picPhone}</Typography>
                        </Box>
                    )}
                    {item.picEmail && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                            <EmailIcon sx={{ fontSize: 12, color: '#fda4af' }} />
                            <Typography variant="caption" sx={{ color: '#e2e8f0', fontSize: 11 }}>{item.picEmail}</Typography>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}

// ── Add / Edit Dialog ─────────────────────────────────────────────
function ItemDialog({ open, item, hasContact, hasItems, onClose, onSave }: {
    open: boolean;
    item: Partial<MasterListItem> | null;
    hasContact: boolean;
    hasItems?: boolean;
    onClose: () => void;
    onSave: (data: Omit<MasterListItem, 'id'>) => void;
}) {
    const [label,    setLabel]    = useState(item?.label    ?? '');
    const [color,    setColor]    = useState(item?.color    ?? '');
    const [textColor,setTextColor]= useState(item?.textColor?? '#ffffff');
    const [email,    setEmail]    = useState(item?.email    ?? '');
    const [contact1, setContact1] = useState(item?.contact1 ?? '');
    const [contact2, setContact2] = useState(item?.contact2 ?? '');
    const [contact3, setContact3] = useState(item?.contact3 ?? '');
    const [picName,  setPicName]  = useState(item?.picName  ?? '');
    const [picPhone, setPicPhone] = useState(item?.picPhone ?? '');
    const [picEmail, setPicEmail] = useState(item?.picEmail ?? '');
    const [itemsSupplied, setItemsSupplied] = useState(item?.itemsSupplied ?? '');

    const isEdit = !!item?.id;

    const handleSave = () => {
        if (!label.trim()) return;
        onSave({
            label: label.trim(), color, textColor: color ? textColor : '#000000',
            ...(hasContact ? {
                email: email.trim(),
                contact1: contact1.trim(),
                contact2: contact2.trim(),
                contact3: contact3.trim(),
                picName: picName.trim(),
                picPhone: picPhone.trim(),
                picEmail: picEmail.trim(),
            } : {}),
            ...(hasItems ? { itemsSupplied: itemsSupplied.trim() } : {})
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 800, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                {isEdit ? 'Edit Item' : 'Add Item'}
            </DialogTitle>
            <DialogContent sx={{ pt: 2.5 }}>
                <TextField autoFocus fullWidth size="small" label="Label" value={label}
                    onChange={e => setLabel(e.target.value)} sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    onKeyDown={e => !hasContact && e.key === 'Enter' && handleSave()} />

                {/* Contact fields */}
                {hasContact && (
                    <>
                        <Divider sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Contact Details
                            </Typography>
                        </Divider>
                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth size="small" label="Email" type="email" value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    InputProps={{ startAdornment: <EmailIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.75 }} /> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField fullWidth size="small" label="Contact 1 (Name & No.)" value={contact1}
                                    onChange={e => setContact1(e.target.value)}
                                    InputProps={{ startAdornment: <PhoneIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.75 }} /> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField fullWidth size="small" label="Contact 2 (Name & No.)" value={contact2}
                                    onChange={e => setContact2(e.target.value)}
                                    InputProps={{ startAdornment: <PhoneIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.75 }} /> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField fullWidth size="small" label="Contact 3 (Name & No.)" value={contact3}
                                    onChange={e => setContact3(e.target.value)}
                                    InputProps={{ startAdornment: <PhoneIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.75 }} /> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </Grid>
                        </Grid>

                        <Divider sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Person In Charge (PIC) Details
                            </Typography>
                        </Divider>
                        <Grid container spacing={2} sx={{ mb: 2.5 }}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField fullWidth size="small" label="PIC Name" value={picName}
                                    onChange={e => setPicName(e.target.value)}
                                    InputProps={{ startAdornment: <PersonIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.75 }} /> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField fullWidth size="small" label="PIC Contact No." value={picPhone}
                                    onChange={e => setPicPhone(e.target.value)}
                                    InputProps={{ startAdornment: <PhoneIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.75 }} /> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField fullWidth size="small" label="PIC Email" type="email" value={picEmail}
                                    onChange={e => setPicEmail(e.target.value)}
                                    InputProps={{ startAdornment: <EmailIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.75 }} /> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            </Grid>
                        </Grid>
                    </>
                )}

                {hasItems && (
                    <>
                        <Divider sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Supplies Details
                            </Typography>
                        </Divider>
                        <TextField fullWidth size="small" label="Items Supplied" value={itemsSupplied}
                            onChange={e => setItemsSupplied(e.target.value)} placeholder="e.g. Cables, Switches, Sensors..."
                            multiline minRows={3} maxRows={8}
                            sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </>
                )}

                <Divider sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Colour
                    </Typography>
                </Divider>

                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Background
                </Typography>
                <ColorPicker value={color} onChange={setColor} />

                {color && (
                    <>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mt: 2 }}>
                            Text Colour
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                            {['#ffffff', '#000000', '#1e293b', '#fef3c7'].map(tc => (
                                <Box key={tc} onClick={() => setTextColor(tc)} sx={{
                                    width: 24, height: 24, borderRadius: '50%', bgcolor: tc, cursor: 'pointer',
                                    border: textColor === tc ? '3px solid #60a5fa' : '2px solid #e5e7eb',
                                }} />
                            ))}
                        </Box>
                    </>
                )}

                {/* Preview */}
                <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">Preview:</Typography>
                    {label ? (
                        <Chip label={label} size="small" sx={{
                            bgcolor: color || 'transparent',
                            color: color ? textColor : 'text.primary',
                            fontWeight: 700, fontSize: 11,
                            border: !color ? '1px solid #e5e7eb' : 'none',
                        }} />
                    ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={!label.trim()}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}>
                    {isEdit ? 'Save Changes' : 'Add'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Category Panel ────────────────────────────────────────────────
function CategoryPanel({ category, hasContact, hasItems }: { category: MasterListCategory; hasContact: boolean; hasItems?: boolean }) {
    const { data, addItem, updateItem, deleteItem, resetCategory } = useMasterList();
    const items = data[category];
    const [dialogOpen, setDialogOpen]   = useState(false);
    const [editItem, setEditItem]       = useState<MasterListItem | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    const openAdd  = () => { setEditItem(null); setDialogOpen(true); };
    const openEdit = (item: MasterListItem) => { setEditItem(item); setDialogOpen(true); };

    const handleSave = (d: Omit<MasterListItem, 'id'>) => {
        if (editItem) updateItem(category, editItem.id, d);
        else          addItem(category, d);
        setDialogOpen(false);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                    {hasContact && (
                        <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                            · Hover a chip to see contact details
                        </Typography>
                    )}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Reset to defaults">
                        <IconButton size="small" onClick={() => setConfirmReset(true)}
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                            <RestartAltIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}
                        sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, boxShadow: 'none',
                              background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                              '&:hover': { background: 'linear-gradient(135deg, #1a3354, #1d4ed8)', boxShadow: 'none' } }}>
                        Add Item
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <AnimatePresence>
                    {items.map(item => (
                        <motion.div key={item.id}
                            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.18 }}>
                            <Tooltip
                                title={hasContact ? <ContactTooltipContent item={item} /> : item.label}
                                arrow
                                placement="top"
                                componentsProps={{
                                    tooltip: {
                                        sx: {
                                            bgcolor: '#1e293b',
                                            borderRadius: 2,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                            p: 1,
                                        }
                                    },
                                    arrow: { sx: { color: '#1e293b' } }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
                                           bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                                           borderRadius: 5, px: 1, py: 0.5,
                                           transition: 'box-shadow 0.15s',
                                           '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' } }}>
                                    <Chip label={item.label} size="small" sx={{
                                        bgcolor: item.color || 'transparent',
                                        color: item.color ? (item.textColor || '#fff') : 'text.primary',
                                        fontWeight: 700, fontSize: 11,
                                        border: !item.color ? '1px solid #e5e7eb' : 'none',
                                        userSelect: 'none',
                                    }} />
                                    {/* Contact indicator dots */}
                                    {hasContact && (item.email || item.contact1) && (
                                        <Box sx={{ display: 'flex', gap: 0.25, ml: 0.25 }}>
                                            {item.email    && <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#93c5fd' }} />}
                                            {item.contact1 && <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#86efac' }} />}
                                        </Box>
                                    )}
                                    <IconButton size="small" onClick={() => openEdit(item)} sx={{ p: 0.25 }}>
                                        <EditIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => deleteItem(category, item.id)} sx={{ p: 0.25 }}>
                                        <DeleteIcon sx={{ fontSize: 13, color: '#ef4444' }} />
                                    </IconButton>
                                </Box>
                            </Tooltip>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {items.length === 0 && (
                    <Typography variant="body2" color="text.disabled" sx={{ py: 4, width: '100%', textAlign: 'center' }}>
                        No items yet. Click <strong>Add Item</strong> to get started.
                    </Typography>
                )}
            </Box>

            {/* Legend */}
            {hasContact && (
                <Box sx={{ mt: 2.5, display: 'flex', gap: 2, opacity: 0.6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#93c5fd' }} />
                        <Typography variant="caption" color="text.disabled" fontSize={10}>Has email</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#86efac' }} />
                        <Typography variant="caption" color="text.disabled" fontSize={10}>Has contact</Typography>
                    </Box>
                </Box>
            )}

            {/* Add/Edit Dialog */}
            {dialogOpen && (
                <ItemDialog open={dialogOpen} item={editItem} hasContact={hasContact} hasItems={hasItems}
                    onClose={() => setDialogOpen(false)} onSave={handleSave} />
            )}

            {/* Reset confirm */}
            <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Reset to defaults?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This will restore all original items for this category. Any custom additions and contact info will be lost.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmReset(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" color="error"
                        onClick={() => { resetCategory(category); setConfirmReset(false); }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}>
                        Reset
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function MasterListPage() {
    const [tab, setTab] = useState(0);
    const cat = CATEGORIES[tab];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Master List</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                        Manage dropdown options used in Tender forms · Agency Types, Company and Customer include contact details
                    </Typography>
                </Box>
            </motion.div>

            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 48, fontSize: 13 },
                        '& .Mui-selected': { color: '#2563eb' },
                        '& .MuiTabs-indicator': { bgcolor: '#2563eb', height: 3, borderRadius: 2 },
                    }}>
                    {CATEGORIES.map(c => (
                        <Tab key={c.id} label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <span>{c.icon}</span>
                                <span>{c.label}</span>
                                {c.hasContact && (
                                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#93c5fd', mb: 0.5 }} />
                                )}
                            </Box>
                        } />
                    ))}
                </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
                <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
                    <Paper sx={{ m: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }} elevation={0}>
                        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={800}>
                                    {cat.icon}&nbsp; {cat.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    These items appear in the <strong>{cat.label}</strong> dropdown when adding or editing a Tender.
                                    {cat.hasContact && ' Each item can store an email and up to 3 contact numbers.'}
                                    {cat.hasItems && ' You can also specify the items they supply.'}
                                </Typography>
                            </Box>
                            {cat.hasContact && (
                                <Chip label="Has contact info" size="small"
                                    icon={<PhoneIcon style={{ fontSize: 12 }} />}
                                    sx={{ fontSize: 10, fontWeight: 700, bgcolor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }} />
                            )}
                        </Box>
                        <CategoryPanel category={cat.id} hasContact={cat.hasContact} hasItems={cat.hasItems} />
                    </Paper>
                </motion.div>
            </Box>
        </Box>
    );
}
