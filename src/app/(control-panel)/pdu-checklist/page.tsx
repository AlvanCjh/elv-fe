"use client";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Typography, Paper, Box, Button, TextField, Divider, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, CircularProgress
} from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { useProject } from '@/context/ProjectContext';
import { enqueueSnackbar } from 'notistack';
import { usePduChecklists, useAddPduChecklist, useUpdatePduChecklist, useDeletePduChecklist, PduChecklist } from "./pduApi";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type RcdStatus = "ON" | "OFF" | "";
interface RcdRow { id: string; onStatus: RcdStatus; offStatus: RcdStatus; }
interface PduUnit { label: string; model: string; sn: string; rows: RcdRow[]; }
interface SignatoryMeta {
  attendedByName: string; attendedByDesignation: string; attendedByDate: string;
  verifiedByName: string; verifiedByDesignation: string; verifiedByDate: string;
  acknowledgedByName: string; acknowledgedByDesignation: string; acknowledgedByDate: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RCD_IDS_LEFT = ["R1", "Y1", "B1", "R2", "Y2", "B2", "R3", "Y3", "B3", "R4", "Y4", "B4", "R5", "Y5", "B5", "R6", "Y6", "B6", "R7", "Y7", "B7", "R8", "Y8", "B8", "R9", "Y9", "B9"];
const RCD_IDS_RIGHT = ["R10", "Y10", "B10", "R11", "Y11", "B11", "R12", "Y12", "B12", "R13", "Y13", "B13", "R14", "Y14", "B14", "R15", "Y15", "B15", "R16", "Y16", "B16", "R17", "Y17", "B17", "R18", "Y18", "B18"];

const buildDefaultRows = (): RcdRow[] => {
  const all_ids = [...RCD_IDS_LEFT, ...RCD_IDS_RIGHT];
  return all_ids.map(id => ({ id, onStatus: "" as RcdStatus, offStatus: "/" as RcdStatus }));
};

const DEFAULT_PDU_UNITS = (): PduUnit[] => [
  { label: "PDU 3A", model: "Multilin EPM 5500P - PL5500C", sn: "EP09101219", rows: buildDefaultRows() },
  { label: "PDU 3B", model: "Multilin EPM 5500P - PL5500C", sn: "EP09101158", rows: buildDefaultRows() },
  { label: "PDU 3C", model: "Multilin EPM 5500P - PL5500C", sn: "EP09100595", rows: buildDefaultRows() },
  { label: "PDU 3D", model: "Multilin EPM 5500P - PL5500C", sn: "EP09071364", rows: buildDefaultRows() },
];

const DEFAULT_META: SignatoryMeta = {
  attendedByName: "Khairuddin Bin Khasnin", attendedByDesignation: "CSE", attendedByDate: format(new Date(), "dd MMMM yyyy"),
  verifiedByName: "Constantine Paidilin", verifiedByDesignation: "Facility Engineer", verifiedByDate: format(new Date(), "dd MMMM yyyy"),
  acknowledgedByName: "Rexcy Bin Sitol", acknowledgedByDesignation: "Data Centre", acknowledgedByDate: format(new Date(), "dd MMMM yyyy"),
};

// ─── Shared Comps ─────────────────────────────────────────────────────────────
const splitRows = (rows: RcdRow[]) => {
  const leftIds = new Set(RCD_IDS_LEFT);
  const left = rows.filter(r => leftIds.has(r.id));
  const right = rows.filter(r => !leftIds.has(r.id));
  return { left, right };
};

type CycleStatus = "" | "/" | "✓";
const CYCLE: CycleStatus[] = ["", "/", "✓"];

const StatusCell = ({ value, onChange, disabled }: { value: RcdStatus; onChange: (v: RcdStatus) => void; disabled?: boolean; }) => {
  const handleClick = () => {
    if (disabled) return;
    const currentIdx = CYCLE.indexOf(value as CycleStatus);
    const nextIdx = (currentIdx + 1) % CYCLE.length;
    onChange(CYCLE[nextIdx] as RcdStatus);
  };
  return (
    <button onClick={handleClick} disabled={disabled} style={{
      width: "100%", minHeight: 20, display: "flex", alignItems: "center", justifyContent: "center",
      cursor: disabled ? "default" : "pointer", background: value === "✓" ? "rgba(16,185,129,0.08)" : value === "/" ? "rgba(59,130,246,0.06)" : "transparent",
      border: "none", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
      color: value === "✓" ? "#059669" : value === "/" ? "#2563eb" : "#94a3b8", transition: "all 0.15s", borderRadius: 2, padding: "2px 0",
    }}>
      {value === "" ? <span style={{ opacity: 0.25, fontSize: 9 }}>—</span> : value}
    </button>
  );
};

const PduTable = ({ unit, onChange, disabled }: { unit: PduUnit; onChange: (rows: RcdRow[]) => void; disabled: boolean; }) => {
  const { left, right } = splitRows(unit.rows);
  const handleStatusChange = (id: string, field: "onStatus" | "offStatus", val: RcdStatus) => {
    const updated = unit.rows.map(r => r.id === id ? { ...r, [field]: val } : r);
    onChange(updated);
  };
  const thCls = "border border-gray-900 text-center font-black text-[10px] bg-gray-100 py-0.5 px-1 uppercase";
  const tdCls = "border border-gray-900 text-center text-[11px] p-0";
  const tdLbl = "border border-gray-900 text-center font-bold text-[10px] py-0.5 px-1 bg-white";
  return (
    <div className="flex-1 min-w-0">
      <div className="border border-gray-900 bg-gray-200 text-center py-1">
        <div className="text-[10px] font-black uppercase">{unit.label} # {unit.model}</div>
        <div className="text-[10px] font-bold text-gray-600">(S/N: {unit.sn})</div>
      </div>
      <table className="w-full border-collapse" style={{ fontSize: 10 }}>
        <thead>
          <tr>
            <th className={`${thCls} w-[22%]`} rowSpan={2}>RCD NO</th>
            <th className={`${thCls}`} colSpan={2}>STATUS</th>
            <th className={`${thCls} w-[22%]`} rowSpan={2}>RCD NO</th>
            <th className={`${thCls}`} colSpan={2}>STATUS</th>
          </tr>
          <tr>
            <th className={thCls}>ON</th><th className={thCls}>OFF</th><th className={thCls}>ON</th><th className={thCls}>OFF</th>
          </tr>
        </thead>
        <tbody>
          {left.map((lRow, i) => {
            const rRow = right[i];
            return (
              <tr key={lRow.id} className="hover:bg-indigo-50/20 transition-colors">
                <td className={tdLbl}>{lRow.id}</td>
                <td className={tdCls}><StatusCell value={lRow.onStatus} disabled={disabled} onChange={v => handleStatusChange(lRow.id, "onStatus", v)} /></td>
                <td className={tdCls}><StatusCell value={lRow.offStatus} disabled={disabled} onChange={v => handleStatusChange(lRow.id, "offStatus", v)} /></td>
                {rRow ? (
                  <><td className={tdLbl}>{rRow.id}</td>
                  <td className={tdCls}><StatusCell value={rRow.onStatus} disabled={disabled} onChange={v => handleStatusChange(rRow.id, "onStatus", v)} /></td>
                  <td className={tdCls}><StatusCell value={rRow.offStatus} disabled={disabled} onChange={v => handleStatusChange(rRow.id, "offStatus", v)} /></td></>
                ) : (<><td /><td /><td /></>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const PrintLayout = ({ pduUnits, meta, pduModel, pduRating, checklistRecordNo, checklistDate }: { pduUnits: PduUnit[]; meta: SignatoryMeta; pduModel: string; pduRating: string; checklistRecordNo: string; checklistDate: string; }) => {
  const thCls = "border border-gray-900 text-center font-bold text-[8px] bg-gray-100 py-0 px-0.5 uppercase";
  const tdCls = "border border-gray-900 text-center text-[8px] p-0";
  const tdLbl = "border border-gray-900 text-center font-bold text-[8px] py-0 px-0.5 bg-white";

  const PrintPduTable = ({ unit }: { unit: PduUnit }) => {
    const { left, right } = splitRows(unit.rows);
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ border: "1px solid #111", background: "#e5e7eb", textAlign: "center", padding: "2px 0" }}>
          <div style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase" }}>{unit.label} # {unit.model}</div>
          <div style={{ fontSize: 7.5, fontWeight: 700, color: "#444" }}>(S/N: {unit.sn})</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 7.5 }}>
          <thead>
            <tr>
              <th className={thCls} rowSpan={2} style={{ width: "22%" }}>RCD NO</th><th className={thCls} colSpan={2}>STATUS</th>
              <th className={thCls} rowSpan={2} style={{ width: "22%" }}>RCD NO</th><th className={thCls} colSpan={2}>STATUS</th>
            </tr>
            <tr><th className={thCls}>ON</th><th className={thCls}>OFF</th><th className={thCls}>ON</th><th className={thCls}>OFF</th></tr>
          </thead>
          <tbody>
            {left.map((lRow, i) => {
              const rRow = right[i];
              return (
                <tr key={lRow.id}>
                  <td className={tdLbl}>{lRow.id}</td><td className={tdCls}>{lRow.onStatus}</td><td className={tdCls}>{lRow.offStatus}</td>
                  {rRow ? (<><td className={tdLbl}>{rRow.id}</td><td className={tdCls}>{rRow.onStatus}</td><td className={tdCls}>{rRow.offStatus}</td></>) : (<><td /><td /><td /></>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="font-sans text-black" style={{ padding: "0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid #000", paddingBottom: "8px", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1 }}>PDU Daily Checklist</div>
          <div style={{ fontSize: "14px", fontWeight: 700, opacity: 0.8, marginTop: 4 }}>Site Operations · Reference: {checklistRecordNo}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>MODEL: {pduModel}</div>
          <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase" }}>RATING: {pduRating}</div>
          <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>Record Date: {format(new Date(checklistDate), 'dd MMMM yyyy')}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {pduUnits.map((u, i) => <PrintPduTable key={i} unit={u} />)}
      </div>
      <div style={{ border: "1px solid #111", display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div style={{ padding: "8px" }} className="flex flex-col h-full">
          <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", marginBottom: "30px", background: "#f3f4f6", padding: "4px", border: "1px solid #111" }}>Attended By</div>
          <div className="mt-auto border-t border-black mb-1"></div>
          <div style={{ fontSize: 10, fontWeight: 700 }}>{meta.attendedByName}</div>
          <div style={{ fontSize: 9, color: "#444" }}>{meta.attendedByDesignation}</div>
          <div style={{ fontSize: 9, color: "#444" }}>{meta.attendedByDate}</div>
        </div>
        <div style={{ borderLeft: "1px solid #111", padding: "8px" }} className="flex flex-col h-full">
          <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", marginBottom: "30px", background: "#f3f4f6", padding: "4px", border: "1px solid #111" }}>Verified By</div>
          <div className="mt-auto border-t border-black mb-1"></div>
          <div style={{ fontSize: 10, fontWeight: 700 }}>{meta.verifiedByName}</div>
          <div style={{ fontSize: 9, color: "#444" }}>{meta.verifiedByDesignation}</div>
          <div style={{ fontSize: 9, color: "#444" }}>{meta.verifiedByDate}</div>
        </div>
        <div style={{ borderLeft: "1px solid #111", padding: "8px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }} className="flex flex-col h-full">
              <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", marginBottom: "30px", background: "#f3f4f6", padding: "4px", border: "1px solid #111" }}>Acknowledged By</div>
              <div className="mt-auto border-t border-black mb-1"></div>
              <div style={{ fontSize: 10, fontWeight: 700 }}>{meta.acknowledgedByName}</div>
              <div style={{ fontSize: 9, color: "#444" }}>{meta.acknowledgedByDesignation}</div>
              <div style={{ fontSize: 9, color: "#444" }}>{meta.acknowledgedByDate}</div>
            </div>
            <div style={{ width: 60, marginLeft: 10 }}>
              <div style={{ fontSize: 8, fontWeight: 900, marginBottom: 4, textAlign: 'center' }}>Stamp</div>
              <div style={{ height: 60, border: "1px dashed #aaa", borderRadius: 4 }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PduChecklistPage = () => {
    const { activeProjectId } = useProject();
    const [view, setView] = useState<'list'|'form'>('list');
    const [editingId, setEditingId] = useState<number | null>(null);
  
    // Filter State
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const [dateFrom, setDateFrom] = useState(format(startOfMonth, 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(endOfMonth, 'yyyy-MM-dd'));
    const [searchText, setSearchText] = useState('');
  
    // API
    const { data: records = [], isLoading } = usePduChecklists(activeProjectId);
    const addChecklist = useAddPduChecklist();
    const updateChecklist = useUpdatePduChecklist();
    const deleteChecklist = useDeletePduChecklist();
  
    // Form State
    const [recordDate, setRecordDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [pduUnits, setPduUnits] = useState<PduUnit[]>(DEFAULT_PDU_UNITS());
    const [meta, setMeta] = useState<SignatoryMeta>(DEFAULT_META);
    const [pduModel, setPduModel] = useState("GE - 54 WAYS");
    const [pduRating, setPduRating] = useState("160 AMPS");
  
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
  
    // Filter logic
    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            if (searchText) {
                const query = searchText.toLowerCase();
                const matchedRef = r.pdu_ref_no?.toLowerCase().includes(query);
                if (!matchedRef) return false;
            }
            if (dateFrom && dateTo) {
                const itemDate = parseISO(r.record_date);
                return isWithinInterval(itemDate, { start: startOfDay(parseISO(dateFrom)), end: endOfDay(parseISO(dateTo)) });
            }
            return true;
        });
    }, [records, searchText, dateFrom, dateTo]);
  
    const handleOpenForm = (report?: PduChecklist) => {
        if (report) {
            setEditingId(report.id);
            setRecordDate(report.record_date);
            setPduUnits(report.units_data || DEFAULT_PDU_UNITS());
            setMeta(report.meta_data || DEFAULT_META);
            setView('form');
        } else {
            setEditingId(null);
            setRecordDate(format(new Date(), 'yyyy-MM-dd'));
            setPduUnits(DEFAULT_PDU_UNITS());
            setMeta(DEFAULT_META);
            setView('form');
        }
    };
  
    const handleSave = async () => {
        if (!activeProjectId) return;
        try {
            const data = {
                project_id: activeProjectId,
                record_date: recordDate,
                units_data: pduUnits,
                meta_data: meta
            };
            if (editingId) {
                await updateChecklist.mutateAsync({ id: editingId, data, projectId: activeProjectId });
                enqueueSnackbar('PDU Checklist updated', { variant: 'success' });
            } else {
                await addChecklist.mutateAsync({ projectId: activeProjectId, data });
                enqueueSnackbar('PDU Checklist created', { variant: 'success' });
            }
            setView('list');
        } catch (e) {
            enqueueSnackbar('Failed to save checklist', { variant: 'error' });
        }
    };
  
    const handleDelete = async (id: number) => {
        if (!activeProjectId) return;
        if (window.confirm("Are you sure you want to delete this checklist?")) {
            try {
                await deleteChecklist.mutateAsync({ id, projectId: activeProjectId });
                enqueueSnackbar("Deleted successfully", { variant: 'info' });
            } catch (e) {
                enqueueSnackbar("Failed to delete", { variant: 'error' });
            }
        }
    };
  
    const handlePrint = async () => {
        // Automatically save first if it's new so we ge a ref id
        if (!editingId) {
            enqueueSnackbar("You must save the checklist before printing to generate a reference number.", { variant: 'warning' });
            handleSave();
            return;
        }
        window.print();
    };

    if (view === 'list') {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-10 transition-colors duration-300">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <FuseSvgIcon size={20} className="text-white">heroicons-outline:bolt</FuseSvgIcon>
                            </div>
                            PDU Checklists
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-slate-500 dark:text-slate-400 mt-2 font-medium ml-14">
                            Manage Power Distribution Unit daily checks.
                        </motion.p>
                    </div>
                    <Button
                        variant="contained"
                        onClick={() => handleOpenForm()}
                        startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
                        className="rounded-xl px-6 py-2.5 font-bold shadow-lg whitespace-nowrap bg-indigo-600 hover:bg-indigo-700"
                    >
                        New Checklist
                    </Button>
                </div>
                
                <Paper className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                    <TextField label="Search Reference No." size="small" value={searchText} onChange={e => setSearchText(e.target.value)}
                        slotProps={{ input: { className: 'rounded-xl bg-slate-50 dark:bg-slate-800' } }} />
                    <TextField label="Date From" type="date" size="small" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true }, input: { className: 'rounded-xl bg-slate-50 dark:bg-slate-800' } }} />
                    <TextField label="Date To" type="date" size="small" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true }, input: { className: 'rounded-xl bg-slate-50 dark:bg-slate-800' } }} />
                </Paper>

                <Paper className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:bg-slate-900 relative">
                    <Table>
                        <TableHead className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow>
                                <TableCell className="font-black text-slate-500 uppercase tracking-wider text-xs">Ref No</TableCell>
                                <TableCell className="font-black text-slate-500 uppercase tracking-wider text-xs">Record Date</TableCell>
                                <TableCell className="font-black text-slate-500 uppercase tracking-wider text-xstext-right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10">
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredRecords.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-10 text-slate-400 font-bold uppercase tracking-wider text-sm">
                                        No checklists found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRecords.map(r => (
                                    <TableRow key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <TableCell className="font-black text-indigo-600 dark:text-indigo-400">{r.pdu_ref_no}</TableCell>
                                        <TableCell className="font-bold text-slate-700 dark:text-slate-300">{format(new Date(r.record_date), 'dd MMM yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Tooltip title="View / Edit">
                                                    <IconButton size="small" onClick={() => handleOpenForm(r)} className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/40">
                                                        <FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" onClick={() => handleDelete(r.id)} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40">
                                                        <FuseSvgIcon size={18}>heroicons-outline:trash</FuseSvgIcon>
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Paper>
            </div>
        );
    }
  
    // ── FORM VIEW ──
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-6 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <IconButton onClick={() => setView('list')} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
                <FuseSvgIcon size={20}>heroicons-outline:arrow-left</FuseSvgIcon>
            </IconButton>
            <div>
              <Typography className="font-black text-slate-800 dark:text-white text-base leading-tight">{editingId ? 'Edit Checklist' : 'New Checklist'}</Typography>
              <Typography className="text-[11px] text-slate-400 font-medium">Power Distribution Unit</Typography>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="small" onClick={() => setPduUnits(DEFAULT_PDU_UNITS())} startIcon={<FuseSvgIcon size={16}>heroicons-outline:arrow-path</FuseSvgIcon>} className="rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold px-4">Reset</Button>
            <Button variant="contained" size="small" onClick={handleSave} disabled={addChecklist.isPending || updateChecklist.isPending} startIcon={<FuseSvgIcon size={16}>heroicons-outline:document-check</FuseSvgIcon>} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black px-5">Save</Button>
            <Button variant="contained" size="small" onClick={handlePrint} startIcon={<FuseSvgIcon size={16}>heroicons-outline:printer</FuseSvgIcon>} className="rounded-xl bg-slate-800 hover:bg-slate-900 font-black px-5 shadow-lg shadow-slate-200 dark:shadow-none">Print</Button>
          </div>
        </div>
  
        <div className="flex-1 p-4 md:p-6 no-print max-w-[1400px] w-full mx-auto">
          <Paper className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mb-5 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Record Date</span>
              <TextField type="date" size="small" value={recordDate} onChange={e => setRecordDate(e.target.value)} variant="outlined" slotProps={{ input: { className: "font-bold text-sm bg-slate-50 dark:bg-slate-800" } }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">PDU Model</span>
              <TextField size="small" value={pduModel} onChange={e => setPduModel(e.target.value)} variant="outlined" className="w-36" slotProps={{ input: { className: "font-bold text-sm bg-slate-50 dark:bg-slate-800" } }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">PDU Rating</span>
              <TextField size="small" value={pduRating} onChange={e => setPduRating(e.target.value)} variant="outlined" className="w-32" slotProps={{ input: { className: "font-bold text-sm bg-slate-50 dark:bg-slate-800" } }} />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-blue-50 border border-blue-300 flex items-center justify-center text-[9px] font-bold text-blue-700">/</div><span className="text-xs text-slate-500">Default / OFF</span></div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-300 flex items-center justify-center text-[10px] font-bold text-emerald-700">✓</div><span className="text-xs text-slate-500">Checked / ON</span></div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-slate-50 border border-slate-200"></div><span className="text-xs text-slate-500">Empty</span></div>
              <span className="text-[11px] text-slate-400 italic ml-1">Click cells</span>
            </div>
          </Paper>
  
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {pduUnits.map((unit, idx) => (
              <Paper key={idx} className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                <div className="px-4 py-2.5 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-slate-100 dark:to-slate-700 flex items-center justify-between">
                  <div>
                    <Typography className="font-black text-slate-800 dark:text-white text-sm">{unit.label}</Typography>
                    <Typography className="text-[10px] text-slate-500 dark:text-slate-400">{unit.model} · S/N: {unit.sn}</Typography>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">S/N</span>
                  <input className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-indigo-400 px-1 w-36" value={unit.sn} onChange={e => setPduUnits(prev => prev.map((u, i) => i === idx ? { ...u, sn: e.target.value } : u))} />
                </div>
                <div className="overflow-x-auto p-1 bg-white dark:bg-slate-900/50">
                  <PduTable unit={unit} onChange={rows => setPduUnits(prev => prev.map((u, i) => i === idx ? { ...u, rows } : u))} disabled={false} />
                </div>
              </Paper>
            ))}
          </div>
  
          <Paper className="rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-4 bg-white dark:bg-slate-900">
            <div className="px-4 py-2.5 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-slate-100 dark:to-slate-700">
              <Typography className="font-black text-slate-800 dark:text-white text-sm">Signatures & Acknowledgement</Typography>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2"><Typography className="text-xs font-black text-slate-400 uppercase tracking-wider">Attended By</Typography><Divider />
                {[ { label: "Name", key: "attendedByName" }, { label: "Designation", key: "attendedByDesignation" }, { label: "Date/Time", key: "attendedByDate" } ].map(({ label, key }) => (
                  <div key={key} className="flex items-center gap-2"><span className="text-[11px] font-bold text-slate-500 w-20 shrink-0">{label}</span>
                    <TextField size="small" variant="standard" fullWidth value={meta[key as keyof SignatoryMeta]} onChange={e => setMeta(prev => ({ ...prev, [key]: e.target.value }))} slotProps={{ input: { className: "text-[12px] font-semibold dark:text-white" } }} />
                  </div>
                ))}
              </div>
              <div className="space-y-2"><Typography className="text-xs font-black text-slate-400 uppercase tracking-wider">Verified By</Typography><Divider />
                {[ { label: "Name", key: "verifiedByName" }, { label: "Designation", key: "verifiedByDesignation" }, { label: "Date/Time", key: "verifiedByDate" } ].map(({ label, key }) => (
                  <div key={key} className="flex items-center gap-2"><span className="text-[11px] font-bold text-slate-500 w-20 shrink-0">{label}</span>
                    <TextField size="small" variant="standard" fullWidth value={meta[key as keyof SignatoryMeta]} onChange={e => setMeta(prev => ({ ...prev, [key]: e.target.value }))} slotProps={{ input: { className: "text-[12px] font-semibold dark:text-white" } }} />
                  </div>
                ))}
              </div>
              <div className="space-y-2"><Typography className="text-xs font-black text-slate-400 uppercase tracking-wider">Acknowledge By</Typography><Divider />
                {[ { label: "Name", key: "acknowledgedByName" }, { label: "Designation", key: "acknowledgedByDesignation" }, { label: "Date/Time", key: "acknowledgedByDate" } ].map(({ label, key }) => (
                  <div key={key} className="flex items-center gap-2"><span className="text-[11px] font-bold text-slate-500 w-20 shrink-0">{label}</span>
                    <TextField size="small" variant="standard" fullWidth value={meta[key as keyof SignatoryMeta]} onChange={e => setMeta(prev => ({ ...prev, [key]: e.target.value }))} slotProps={{ input: { className: "text-[12px] font-semibold dark:text-white" } }} />
                  </div>
                ))}
              </div>
            </div>
          </Paper>
        </div>
  
        <style dangerouslySetInnerHTML={{ __html: `@media print { html, body { background: white !important; } body > *:not(#pdu-print-container) { display: none !important; } @page { margin: 8mm; size: A4 portrait; } }`}} />
        {mounted && createPortal(
          <div id="pdu-print-container" style={{ position: 'fixed', top: -99999, left: -99999, pointerEvents: 'none' }}>
            <style dangerouslySetInnerHTML={{ __html: `@media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; } #pdu-print-container { visibility: visible !important; position: static !important; display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; pointer-events: auto !important; } #pdu-print-container * { visibility: visible !important; } table { page-break-inside: auto !important; } tr { page-break-inside: avoid !important; page-break-after: auto !important; } }`}} />
            <PrintLayout pduUnits={pduUnits} meta={meta} pduModel={pduModel} pduRating={pduRating} checklistDate={recordDate} checklistRecordNo={records.find(r => r.id === editingId)?.pdu_ref_no || "DRAFT"} />
          </div>,
          document.body
        )}
      </div>
    );
  };
  
  export default PduChecklistPage;
