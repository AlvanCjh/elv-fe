"use client";
import React, { FC, useState, useMemo, useEffect, Fragment } from "react";
import { createPortal } from "react-dom";
import {
  Typography,
  Paper,
  Box,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Chip,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  Divider,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { motion, AnimatePresence } from "motion/react";
import { useProject } from "@/context/ProjectContext";
import {
  useDailyChecklists,
  useAddDailyChecklist,
  useUpdateDailyChecklist,
  useDeleteDailyChecklist,
  DailyChecklist,
} from "./dailyApi";
import { enqueueSnackbar } from "notistack";
import { format } from "date-fns";

export const EText = ({ id, fallback, className = '', editable, bigger = false, onChange }: { id: string; fallback: string, className?: string, editable?: boolean, bigger?: boolean, onChange?: (val: string) => void }) => {
  const [val, setVal] = useState(fallback);

  useEffect(() => {
    const saved = localStorage.getItem('elv_tmpl_text');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data[id]) setVal(data[id]);
      } catch (e) { }
    }
  }, [id]);

  const handleBlur = (e: any) => {
    const newText = e.target.innerText;
    setVal(newText);
    const saved = localStorage.getItem('elv_tmpl_text') || '{}';
    try {
      const data = JSON.parse(saved);
      data[id] = newText;
      localStorage.setItem('elv_tmpl_text', JSON.stringify(data));
      if (onChange) onChange(newText);
    } catch (e) { }
  };

  return (
    <div
      contentEditable={editable}
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={`${className} ${bigger ? 'text-[15px] font-black' : ''} ${editable
          ? 'border-b-2 border-dashed border-amber-400 bg-amber-50/50 cursor-text px-1 rounded transition-all duration-200'
          : 'transition-all duration-200'
        }`}
    >
      {val}
    </div>
  );
};

const COMPANIES = [
  {
    id: "kinetic_motion",
    name: "Kinetic Motion",
    color: "#0ea5e9",
    logo: "KM",
  },
  { id: "sabahnet", name: "Sabah Net", color: "#f43f5e", logo: "SN" },
];

const DEFAULT_SECTIONS = () => ({
  ups_system: [
    {
      id: "UPS #P1", sn: "101200726177010001",
      r_in: { ry: "", yb: "", br: "", freq: "" },
      inv_out: { ry: "", yb: "", br: "", freq: "" },
      cur: { r: "", y: "", b: "" },
      load: { r: "", y: "", b: "" },
      dc: "",
    },
    {
      id: "UPS #P2", sn: "101200726177010002",
      r_in: { rn: "", yn: "", bn: "", freq: "" },
      inv_out: { rn: "", yn: "", bn: "", freq: "" },
      cur: { r: "", y: "", b: "" },
      load: { r: "", y: "", b: "" },
      dc: "",
    },
  ],
  pecs_system: [
    { id: "PEC #1", temp: "", hum: "", status: "STANDBY", cool: "", alarm: "OFF" },
    { id: "PEC #2", temp: "", hum: "", status: "ON DUTY", cool: "", alarm: "ON" },
  ],
  bms_readings: [
    { num: 1, id: "Telco Room", temp: "", hum: "" },
    { num: 2, id: "Staging Room", temp: "", hum: "" },
    { num: 3, id: "MNE Room", temp: "", hum: "" },
    { num: 4, id: "Zone 1", temp: "", hum: "" },
    { num: 5, id: "", temp: "", hum: "" },
    { num: 6, id: "Zone 2", temp: "", hum: "" },
    { num: 7, id: "", temp: "", hum: "" },
    { num: 8, id: "MNE UPS", temp: "", hum: "" },
    { num: 9, id: "", temp: "", hum: "" },
    { num: 10, id: "Zone 3", temp: "", hum: "" },
  ],
  pdu_system: [
    { id: "PDU #3A", p3: { ry: "", yb: "", br: "" }, p1: { rn: "", yn: "", bn: "" } },
    { id: "TOTAL CURRENT", neutral: "", total: "", isTotal: true },
    { id: "PDU #3B", p3: { ry: "", yb: "", br: "" }, p1: { rn: "", yn: "", bn: "" } },
    { id: "TOTAL CURRENT", neutral: "", total: "", isTotal: true },
    { id: "PDU #3C", p3: { ry: "", yb: "", br: "" }, p1: { rn: "", yn: "", bn: "" } },
    { id: "TOTAL CURRENT", neutral: "", total: "", isTotal: true },
    { id: "PDU #3D", p3: { ry: "", yb: "", br: "" }, p1: { rn: "", yn: "", bn: "" } },
    { id: "TOTAL CURRENT", neutral: "", total: "", isTotal: true },
  ],
  hssd_status: {
    operation: "NORMAL",
    detectors: [
      { id: "det1", fire: false, fault: false, ok: true },
      { id: "det2", fire: false, fault: false, ok: false },
      { id: "det3", fire: false, fault: false, ok: false },
    ],
  },
  leak_detection: { status: "NORMAL", controller: "" },
  ems_control: {
    items: [
      { id: "E101", status: "OK" },
      { id: "E102", status: "OK" },
      { id: "E103", status: "OK" },
    ],
  },
  ups_switchboard: {
    main_acb: "ON", genset_acb: "OFF", ess_avr_acb: "ON",
    v: { ry: "", yb: "", br: "", rn: "", yn: "", bn: "" },
    cur: { r: "", y: "", b: "", n: "" },
    load: "",
  },
  aircond_switchboard: {
    main_breaker: "ON",
    v: { ry: "", yb: "", br: "", rn: "", yn: "", bn: "" },
    cur: { r: "", y: "", b: "", n: "" },
    load: "",
  },
  genset: [
    { id: "GEN #1", dc: "ON", mode: "AUTO", charger: "ON", fuel: "", float_switch: "FLOAT", acb: "ON", emergency_stop: false },
    { id: "GEN #2", dc: "OFF", mode: "AUTO", charger: "OFF", fuel: "", float_switch: "FLOAT", acb: "ON", emergency_stop: false },
  ],
  fire_alarm: [
    { id: "Fire Panel #1 (Security Room)", bell: "ON", buzzer: "ON", fap: "ON", batt_v: "", amp: "" },
    { id: "Fire Panel #2 (Genset)", bell: "ON", buzzer: "ON", fap: "ON", batt_v: "", amp: "" },
    { id: "Fire Panel #3 (Lobby)", bell: "ON", buzzer: "ON", fap: "ON", batt_v: "", amp: "" },
  ],
  fcu_status: {
    fcu1a: "ON", fcu1b: "OFF", gas_leakage_1: "OFF (GAS LEAKAGE)",
    fcu2a: "ON", fcu2b: "ON",
  },
  transformer_fan: { f1: true, f2: true, f3: true, f4: true },
  mne_aircon: { ac1: "ON", ac2: "ON" },
  avr_fan: { f1: true, f2: true, f3: true, f4: true, f5: true, f6: true, f7: true, f8: true },
});

const CellIn = ({ value, onChange, disabled, sx, placeholder }: any) => (
  <TextField
    size="small" variant="standard"
    value={value} onChange={onChange} disabled={disabled}
    placeholder={placeholder} multiline maxRows={3} fullWidth
    slotProps={{
      input: {
        sx: {
          fontSize: 14, textAlign: "center", fontWeight: 600,
          padding: "2px 4px", borderRadius: "4px",
          backgroundColor: disabled ? "transparent" : "rgba(219,234,254,0.3)",
          "& input": { textAlign: "center" },
          "& textarea": { textAlign: "center" },
          ...sx,
        },
      },
    }}
  />
);

const OnOff = ({ value, onChange, disabled }: any) => (
  <button
    disabled={disabled}
    onClick={() => !disabled && onChange(value === "ON" ? "OFF" : "ON")}
    className={`px-1.5 py-0.5 text-[8px] font-black rounded border transition-all ${value === "ON"
        ? "bg-emerald-50 border-emerald-400 text-emerald-800"
        : "bg-red-50 border-red-400 text-red-700"
      }`}
  >{value}</button>
);

const renderUPSSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const th = "text-[12px] sm:text-[10px] font-black border border-slate-900 text-center bg-slate-100 p-1 uppercase";
  const td = "text-[13px] sm:text-[11px] border border-slate-900 p-0";
  const tdl = "text-[13px] sm:text-[11px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  const unitCount = fd.ups_system?.length || 0;

  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-b border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_1" fallback="1. UPS SYSTEM (APM-120KVA)" className="outline-none w-full block" editable={editable} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className={`${th} w-20`} rowSpan={2}><EText id="ups_th_desc" fallback="DESCRIPTIONS" editable={editable} /></th>
              {(Array.isArray(fd.ups_system) ? fd.ups_system : []).map((u: any, i: number) => (
                <th key={i} className={th} colSpan={4}>
                  <div className="flex flex-col items-center gap-1">
                    {editable && (
                      <IconButton size="small" className="p-0 text-rose-500" onClick={() => {
                        const nd = fd.ups_system
                          .filter((_: any, idx: number) => idx !== i)
                          .map((u: any, idx: number) => ({ ...u, id: `UPS Unit #${idx + 1}` }));
                        set({ ups_system: nd });
                      }}>
                        <FuseSvgIcon size={12}>heroicons-outline:trash</FuseSvgIcon>
                      </IconButton>
                    )}
                    <EText
                      id={`ups_grp_hdr_v2_${i}`} fallback={`${u.id} (s/n : ${u.sn})`} editable={editable}
                      onChange={(val) => {
                        const nd = [...fd.ups_system];
                        nd[i].id = val;
                        set({ ups_system: nd });
                      }}
                    />
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {(Array.isArray(fd.ups_system) ? fd.ups_system : []).map((_: any, i: number) => (
                <Fragment key={i}>
                  {['R-Y (L1)', 'Y-B (L2)', 'B-R (L3)', 'Freq'].map((h, hi) => <th key={hi} className={th}>{h}</th>)}
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Rectifier Input Voltage (Vac)', key: 'r_in', fields: ['ry', 'yb', 'br', 'freq'], id: 'ups_r1' },
              { label: 'Inverter Output Voltage (Vac)', key: 'inv_out', fields: ['ry', 'yb', 'br', 'freq'], id: 'ups_r2' },
              { label: 'Output Current (Amp)', key: 'cur', fields: ['r', 'y', 'b', null], id: 'ups_r3' },
              { label: 'Load %', key: 'load', fields: ['r', 'y', 'b', null], id: 'ups_r4' },
            ].map(row => (
              <tr key={row.id} className="even:bg-slate-50/50 hover:bg-indigo-50/10 transition-colors">
                <td className={tdl}><EText id={row.id} fallback={row.label} editable={editable} /></td>
                {(Array.isArray(fd.ups_system) ? fd.ups_system : []).map((u: any, ui: number) => (
                  row.fields.map((f: any, fi: number) => (
                    <td key={`${ui}-${fi}`} className={td}>
                      {f ? <CellIn disabled={disabled} value={u[row.key]?.[f] ?? ''} onChange={(e: any) => {
                        const nd = [...fd.ups_system];
                        nd[ui] = { ...nd[ui], [row.key]: { ...nd[ui][row.key], [f]: e.target.value } };
                        set({ ups_system: nd });
                      }} /> : <div className="bg-slate-50/30 h-5" />}
                    </td>
                  ))
                ))}
              </tr>
            ))}
            <tr className="even:bg-slate-50/50 hover:bg-indigo-50/10 transition-colors">
              <td className={tdl}><EText id="ups_r5" fallback="DC Voltage / Current" editable={editable} /></td>
              {(Array.isArray(fd.ups_system) ? fd.ups_system : []).map((u: any, ui: number) => (
                <td key={ui} colSpan={4} className={td}>
                  <CellIn disabled={disabled} value={u.dc ?? ''} onChange={(e: any) => { const nd = [...fd.ups_system]; nd[ui].dc = e.target.value; set({ ups_system: nd }); }} />
                </td>
              ))}
            </tr>
            {editable && (
              <tr>
                <td colSpan={1 + (unitCount * 4)} className="p-2 border border-slate-900 bg-slate-50">
                  <Button
                    size="small" fullWidth startIcon={<FuseSvgIcon size={14}>heroicons-outline:plus</FuseSvgIcon>}
                    className="font-black text-[10px] text-indigo-600 border border-dashed border-indigo-200"
                    onClick={() => {
                      const nd = [...fd.ups_system, { id: `UPS Unit #${fd.ups_system.length + 1}`, sn: "", r_in: { ry: "", yb: "", br: "", freq: "" }, inv_out: { ry: "", yb: "", br: "", freq: "" }, cur: { r: "", y: "", b: "" }, load: { r: "", y: "", b: "" }, dc: "" }];
                      set({ ups_system: nd });
                    }}
                  >Add UPS Unit</Button>
                </td>
              </tr>
            )}
            <tr><td colSpan={1 + (unitCount * 4)} className="border border-slate-900 p-1.5"><EText id="ups_note1" fallback="NOTE:" bigger editable={editable} /></td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

const renderPECSSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const th = "text-[12px] sm:text-[10px] font-black border border-slate-900 text-center bg-slate-100 p-1 uppercase";
  const td = "text-[13px] sm:text-[11px] border border-slate-900 p-0";
  const tdl = "text-[13px] sm:text-[11px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_2" fallback="2. PECS SYSTEM DB-AIRE / DBAD26Q Vision 2020I" className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className={`${th} w-12`} rowSpan={2}><EText id="pecs_th1" fallback="PECS No." editable={editable} /></th>
            <th className={th} colSpan={2}><EText id="pecs_th2" fallback="On-Panel Display (Of Return air)" editable={editable} /></th>
            <th className={th} colSpan={2}><EText id="pecs_th3" fallback="Operation Status" editable={editable} /></th>
            <th className={th} rowSpan={2}><EText id="pecs_th4" fallback="MSG Alarm" editable={editable} /></th>
          </tr>
          <tr>
            <th className={th}><EText id="pecs_th5" fallback="Temperature" editable={editable} /></th>
            <th className={th}><EText id="pecs_th6" fallback="Humidity" editable={editable} /></th>
            <th className={th}><EText id="pecs_th7" fallback="Mode" editable={editable} /></th>
            <th className={th}><EText id="pecs_th8" fallback="% Cooling" editable={editable} /></th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(fd.pecs_system) ? fd.pecs_system : []).map((p: any, idx: number) => (
            <tr key={idx} className="even:bg-slate-50/50 hover:bg-indigo-50/10 transition-colors">
              <td className={tdl}>
                <div className="flex items-center gap-1">
                  {editable && (
                    <IconButton size="small" className="p-0 text-rose-500" onClick={() => {
                      const nd = fd.pecs_system
                        .filter((_: any, i: number) => i !== idx)
                        .map((p: any, i: number) => ({ ...p, id: `PEC #${i + 1}` }));
                      set({ pecs_system: nd });
                    }}>
                      <FuseSvgIcon size={12}>heroicons-outline:trash</FuseSvgIcon>
                    </IconButton>
                  )}
                  <EText
                    id={`pecs_row_${idx}`} fallback={p.id} editable={editable}
                    onChange={(val) => {
                      const nd = [...fd.pecs_system];
                      nd[idx].id = val;
                      set({ pecs_system: nd });
                    }}
                  />
                </div>
              </td>
              <td className={td}><CellIn disabled={disabled} value={p.temp ?? ''} onChange={(e: any) => { const nd = [...fd.pecs_system]; nd[idx].temp = e.target.value; set({ pecs_system: nd }); }} /></td>
              <td className={td}><CellIn disabled={disabled} value={p.hum ?? ''} onChange={(e: any) => { const nd = [...fd.pecs_system]; nd[idx].hum = e.target.value; set({ pecs_system: nd }); }} /></td>
              <td className="border border-slate-900 text-center p-0.5 font-bold">
                <OnOff value={p.status ?? 'OFF'} disabled={disabled} onChange={(v: string) => { const nd = [...fd.pecs_system]; nd[idx].status = v; set({ pecs_system: nd }); }} />
              </td>
              <td className={td}><CellIn disabled={disabled} value={p.cool ?? ''} onChange={(e: any) => { const nd = [...fd.pecs_system]; nd[idx].cool = e.target.value; set({ pecs_system: nd }); }} /></td>
              <td className="border border-slate-900 text-center p-1.5">
                <Chip size="small" label={p.alarm ?? 'OFF'} color={(p.alarm ?? 'OFF') === 'OFF' ? 'success' : 'error'} sx={{ height: 20, fontSize: 10, fontWeight: 900 }} onClick={() => { if (!disabled) { const nd = [...fd.pecs_system]; nd[idx].alarm = nd[idx].alarm === 'OFF' ? 'ON' : 'OFF'; set({ pecs_system: nd }); } }} />
              </td>
            </tr>
          ))}
          {editable && (
            <tr>
              <td colSpan={6} className="p-2 border border-slate-900 bg-slate-50">
                <Button
                  size="small" fullWidth startIcon={<FuseSvgIcon size={14}>heroicons-outline:plus</FuseSvgIcon>}
                  className="font-black text-[10px] text-indigo-600 border border-dashed border-indigo-200"
                  onClick={() => {
                    const nd = [...fd.pecs_system, { id: `PEC #${fd.pecs_system.length + 1}`, temp: "", hum: "", status: "OFF", cool: "", alarm: "OFF" }];
                    set({ pecs_system: nd });
                  }}
                >
                  Add PEC Unit
                </Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

const renderPDUSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const th = "text-[12px] sm:text-[10px] font-black border border-slate-900 text-center bg-slate-100 p-1 uppercase";
  const td = "text-[13px] sm:text-[11px] border border-slate-900 p-0";
  const tdl = "text-[13px] sm:text-[11px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_3" fallback="3. PDU SYSTEM GE-160A / 54 WAYS" className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className={`${th} w-[18%]`} rowSpan={2}><EText id="pdu_th1" fallback="PDU (GE-160A / 54 WAYS)" editable={editable} /></th>
            <th className={th} colSpan={3}><EText id="pdu_th2" fallback="3 PHASE VOLTAGE" editable={editable} /></th>
            <th className={th} colSpan={3}><EText id="pdu_th3" fallback="1 PHASE VOLTAGE" editable={editable} /></th>
            <th className={th} rowSpan={2}><EText id="pdu_th4" fallback="NEU / TOT" editable={editable} /></th>
          </tr>
          <tr>
            {['R-Y', 'Y-B', 'B-R', 'R-N', 'Y-N', 'B-N'].map((h, i) => <th key={h} className={th}><EText id={`pdu_th_h${i}`} fallback={h} editable={editable} /></th>)}
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(fd.pdu_system) ? fd.pdu_system : []).map((p: any, idx: number) => (
            p.isTotal ? (
              <tr key={idx} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
                <td colSpan={7} className="border border-slate-900 p-0.5 text-right text-[8px] font-black italic bg-slate-50 uppercase tracking-widest leading-none mt-1">
                  <div className="flex justify-between items-center px-1">
                    {editable && (
                      <IconButton size="small" className="p-0 text-rose-300" onClick={() => {
                        const nd = fd.pdu_system.filter((_: any, i: number) => i !== idx);
                        set({ pdu_system: nd });
                      }}>
                        <FuseSvgIcon size={10}>heroicons-outline:trash</FuseSvgIcon>
                      </IconButton>
                    )}
                    <EText id="pdu_total" fallback="TOTAL CURRENT" editable={editable} />
                  </div>
                </td>
                <td className={td}><CellIn disabled={disabled} value={p.neutral ?? ''} onChange={(e: any) => { const nd = [...fd.pdu_system]; nd[idx].neutral = e.target.value; set({ pdu_system: nd }); }} /></td>
              </tr>
            ) : (
              <tr key={idx} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
                <td className={tdl}>
                  <div className="flex items-center gap-1">
                    {editable && (
                      <IconButton size="small" className="p-0 text-rose-500" onClick={() => {
                        const filtered = fd.pdu_system.filter((_: any, i: number) => i !== idx);
                        let pduCount = 0;
                        const finalND = filtered.map((p: any) => {
                          if (p.isTotal) return p;
                          pduCount++;
                          return { ...p, id: `PDU #${['A', 'B', 'C', 'D', 'E', 'F'][pduCount - 1] || pduCount}` };
                        });
                        set({ pdu_system: finalND });
                      }}>
                        <FuseSvgIcon size={12}>heroicons-outline:trash</FuseSvgIcon>
                      </IconButton>
                    )}
                    <EText
                      id={`pdu_row_${idx}`} fallback={p.id} editable={editable}
                      onChange={(val) => {
                        const nd = [...fd.pdu_system];
                        nd[idx].id = val;
                        set({ pdu_system: nd });
                      }}
                    />
                  </div>
                </td>
                {['ry', 'yb', 'br'].map(f => <td key={f} className={td}><CellIn disabled={disabled} value={p.p3?.[f] ?? ''} onChange={(e: any) => { const nd = [...fd.pdu_system]; nd[idx].p3 = { ...nd[idx].p3, [f]: e.target.value }; set({ pdu_system: nd }); }} /></td>)}
                {['rn', 'yn', 'bn'].map(f => <td key={f} className={td}><CellIn disabled={disabled} value={p.p1?.[f] ?? ''} onChange={(e: any) => { const nd = [...fd.pdu_system]; nd[idx].p1 = { ...nd[idx].p1, [f]: e.target.value }; set({ pdu_system: nd }); }} /></td>)}
                <td className="border border-slate-900 bg-slate-50" />
              </tr>
            )
          ))}
          {editable && (
            <tr>
              <td colSpan={8} className="p-2 border border-slate-900 bg-slate-50 space-x-2 flex">
                <Button
                  size="small" variant="outlined" startIcon={<FuseSvgIcon size={12}>heroicons-outline:plus</FuseSvgIcon>}
                  className="font-black text-[9px] text-indigo-600 flex-1 h-8"
                  onClick={() => {
                    const nd = [...fd.pdu_system, { id: `PDU #${fd.pdu_system.filter((x: any) => !x.isTotal).length + 1}`, p3: { ry: "", yb: "", br: "" }, p1: { rn: "", yn: "", bn: "" } }];
                    set({ pdu_system: nd });
                  }}
                >Add PDU</Button>
                <Button
                  size="small" variant="outlined" startIcon={<FuseSvgIcon size={12}>heroicons-outline:calculator</FuseSvgIcon>}
                  className="font-black text-[9px] text-emerald-600 flex-1 h-8"
                  onClick={() => {
                    const nd = [...fd.pdu_system, { id: "TOTAL CURRENT", neutral: "", total: "", isTotal: true }];
                    set({ pdu_system: nd });
                  }}
                >Add Total Row</Button>
              </td>
            </tr>
          )}
          <tr>
            <td colSpan={8} className="border border-slate-900 p-1 text-[9px] font-black text-center uppercase tracking-widest leading-none mt-1">
              <EText id="pdu_status" fallback="STATUS NORMAL" editable={editable} />
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

const renderBMSSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const th = "text-[10px] sm:text-[8px] font-black border border-slate-900 text-center bg-slate-100 p-0.5 uppercase";
  const td = "text-[11px] sm:text-[9px] border border-slate-900 p-0";
  const tdl = "text-[11px] sm:text-[9px] font-bold border border-slate-900 p-1 uppercase";
  return (
    <>
      <div className="text-[9px] font-black text-center bg-slate-200 border-b border-slate-900 p-0.5 uppercase text-slate-800">
        <EText id="hdr_4" fallback="BMS Reading" className="outline-none w-full block uppercase" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[8px]">
        <thead>
          <tr>
            <th className={`${th} w-6`} />
            <th className={th}><EText id="bms_th1" fallback="BMS Sensor" editable={editable} /></th>
            <th className={th}><EText id="bms_th2" fallback="Temperature" editable={editable} /></th>
            <th className={th}><EText id="bms_th3" fallback="Humidity" editable={editable} /></th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(fd.bms_readings) ? fd.bms_readings : []).map((r: any, idx: number) => (
            <tr key={idx} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
              <td className="border border-slate-900 text-center text-[8px] font-black">{r.num || idx + 1}</td>
              <td className={tdl}>
                <div className="flex items-center gap-1">
                  {editable && (
                    <IconButton size="small" className="p-0 text-rose-500" onClick={() => {
                      const nd = fd.bms_readings
                        .filter((_: any, i: number) => i !== idx)
                        .map((r: any, i: number) => ({ ...r, num: i + 1 }));
                      set({ bms_readings: nd });
                    }}>
                      <FuseSvgIcon size={10}>heroicons-outline:trash</FuseSvgIcon>
                    </IconButton>
                  )}
                  <EText
                    id={`bms_row_v2_${r.num}`} fallback={r.id} editable={editable}
                    onChange={(val) => {
                      const nd = [...fd.bms_readings];
                      const targetIdx = nd.findIndex(x => x.num === r.num);
                      if (targetIdx !== -1) {
                        nd[targetIdx].id = val;
                        set({ bms_readings: nd });
                      }
                    }}
                  />
                </div>
              </td>
              <td className={td}><CellIn disabled={disabled} value={r.temp ?? ''} onChange={(e: any) => { const nd = [...fd.bms_readings]; nd[idx].temp = e.target.value; set({ bms_readings: nd }); }} /></td>
              <td className={td}><CellIn disabled={disabled} value={r.hum ?? ''} onChange={(e: any) => { const nd = [...fd.bms_readings]; nd[idx].hum = e.target.value; set({ bms_readings: nd }); }} /></td>
            </tr>
          ))}
          {editable && (
            <tr>
              <td colSpan={4} className="p-1 border border-slate-900 bg-slate-50">
                <Button
                  size="small" fullWidth startIcon={<FuseSvgIcon size={12}>heroicons-outline:plus</FuseSvgIcon>}
                  className="font-black text-[8px] text-indigo-600 border border-dashed border-indigo-200 py-0"
                  onClick={() => {
                    const nextNum = fd.bms_readings.length + 1;
                    const nd = [...fd.bms_readings, { num: nextNum, id: `New Zone #${nextNum}`, temp: "", hum: "" }];
                    set({ bms_readings: nd });
                  }}
                >
                  Add Sensor
                </Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

const renderHSSDSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const th = "text-[12px] font-black border border-slate-900 text-center bg-slate-100 p-1 uppercase";
  const tdl = "text-[13px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_5" fallback="5. HSSD SYSTEM VESDA (RACK ROOM)" className="outline-none w-full block" editable={editable} />
      </div>
      <div className="border-b border-slate-900 p-2 flex justify-between items-center bg-slate-50">
        <span className="text-[12px] font-black uppercase text-slate-600 tracking-wider">
          <EText id="hssd_lbl1" fallback="Main Controller" editable={editable} />
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-black uppercase text-slate-500">
            <EText id="hssd_lbl2" fallback="Operation Status :" editable={editable} />
          </span>
          <Chip
            size="small"
            label={fd.hssd_status?.operation ?? 'NORMAL'}
            color={(fd.hssd_status?.operation ?? 'NORMAL') === 'NORMAL' ? 'success' : 'error'}
            sx={{ height: 24, fontSize: 11, fontWeight: 900 }}
            onClick={() => !disabled && set({ hssd_status: { ...fd.hssd_status, operation: fd.hssd_status.operation === 'NORMAL' ? 'ALARM' : 'NORMAL' } })}
          />
        </div>
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className={th}><EText id="hssd_th1" fallback="DETECTORS" editable={editable} /></th>
            <th className={th}><EText id="hssd_th2" fallback="Fire" editable={editable} /></th>
            <th className={th}><EText id="hssd_th3" fallback="Fault" editable={editable} /></th>
            <th className={th}><EText id="hssd_th4" fallback="OK" editable={editable} /></th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(fd.hssd_status?.detectors) ? fd.hssd_status.detectors : []).map((d: any, idx: number) => (
            <tr key={d.id} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
              <td className={tdl}>
                <div className="flex items-center gap-1">
                  {editable && (
                    <IconButton size="small" className="p-0 text-rose-500" onClick={() => {
                      const nd = {
                        ...fd.hssd_status, detectors: fd.hssd_status.detectors
                          .filter((_: any, i: number) => i !== idx)
                          .map((d: any, i: number) => ({ ...d, id: `Detector #${i + 1}` }))
                      };
                      set({ hssd_status: nd });
                    }}>
                      <FuseSvgIcon size={12}>heroicons-outline:trash</FuseSvgIcon>
                    </IconButton>
                  )}
                  <EText
                    id={`hssd_det_${idx}`} fallback={d.id === `det${idx + 1}` ? `Detector #${idx + 1}` : d.id} editable={editable}
                    onChange={(val) => {
                      const nd = { ...fd.hssd_status, detectors: fd.hssd_status.detectors.map((x: any, i: number) => i === idx ? { ...x, id: val } : x) };
                      set({ hssd_status: nd });
                    }}
                  />
                </div>
              </td>
              {(['fire', 'fault', 'ok'] as const).map(fld => (
                <td key={fld} className="border border-slate-900 text-center p-0">
                  <Checkbox size="small" checked={!!d[fld]} disabled={disabled}
                    onChange={() => { const nd = { ...fd.hssd_status, detectors: fd.hssd_status.detectors.map((x: any, i: number) => i === idx ? { ...x, [fld]: !x[fld] } : x) }; set({ hssd_status: nd }); }}
                    sx={{ p: 0.5, '& .MuiSvgIcon-root': { fontSize: 20 } }} />
                </td>
              ))}
            </tr>
          ))}
          {editable && (
            <tr>
              <td colSpan={4} className="p-2 border border-slate-900 bg-slate-50">
                <Button
                  size="small" fullWidth startIcon={<FuseSvgIcon size={14}>heroicons-outline:plus</FuseSvgIcon>}
                  className="font-black text-[10px] text-indigo-600 border border-dashed border-indigo-200"
                  onClick={() => {
                    const nd = { ...fd.hssd_status, detectors: [...fd.hssd_status.detectors, { id: `Detector #${fd.hssd_status.detectors.length + 1}`, fire: false, fault: false, ok: true }] };
                    set({ hssd_status: nd });
                  }}
                >Add Detector</Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

const renderLeakSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_6" fallback="6. LEAK DETECTION SYSTEM" className="outline-none w-full block" editable={editable} />
      </div>
      <div className="p-1 border-b border-slate-900 flex justify-between items-center even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
        <span className="text-[13px] font-black uppercase text-slate-700">
          <EText id="leak_lbl1" fallback="Main Controller :" editable={editable} />
        </span>
        <CellIn disabled={disabled} value={fd.leak_detection?.controller ?? ''} onChange={(e: any) => set({ leak_detection: { ...fd.leak_detection, controller: e.target.value } })} />
      </div>
    </>
  );
};

const renderEMSSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const tdl = "text-[13px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_7" fallback="7. ENVIRONMENTAL MONITORING SYSTEM (EMS)" className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[11px]">
        <tbody>
          {(Array.isArray(fd.ems_control?.items) ? fd.ems_control.items : []).map((item: any, idx: number) => (
            <tr key={item.id} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
              <td className={tdl}>
                <div className="flex items-center gap-1">
                  {editable && (
                    <IconButton size="small" className="p-0 text-rose-500" onClick={() => {
                      const nd = {
                        ...fd.ems_control, items: fd.ems_control.items
                          .filter((_: any, i: number) => i !== idx)
                          .map((item: any, i: number) => ({ ...item, id: `Item #${i + 1}` }))
                      };
                      set({ ems_control: nd });
                    }}>
                      <FuseSvgIcon size={12}>heroicons-outline:trash</FuseSvgIcon>
                    </IconButton>
                  )}
                  <EText
                    id={`ems_item_${idx}`} fallback={item.id} editable={editable}
                    onChange={(val) => {
                      const nd = { ...fd.ems_control, items: fd.ems_control.items.map((x: any, i: number) => i === idx ? { ...x, id: val } : x) };
                      set({ ems_control: nd });
                    }}
                  />
                </div>
              </td>
              <td className="border border-slate-900 text-center p-2">
                <button
                  disabled={disabled}
                  onClick={() => {
                    const nd = { ...fd.ems_control, items: fd.ems_control.items.map((x: any, i: number) => i === idx ? { ...x, status: x.status === 'OK' ? 'ALARM' : 'OK' } : x) };
                    set({ ems_control: nd });
                  }}
                  className={`px-4 py-1 text-[11px] font-black rounded-lg border transition-all ${item.status === 'OK' ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm' : 'bg-red-50 border-red-400 text-red-700 shadow-sm animate-pulse'
                    }`}
                >
                  {item.status === 'OK' ? '✓ NORMAL' : '⚠ ALARM'}
                </button>
              </td>
            </tr>
          ))}
          {editable && (
            <tr>
              <td colSpan={2} className="p-2 border border-slate-900 bg-slate-50">
                <Button
                  size="small" fullWidth startIcon={<FuseSvgIcon size={14}>heroicons-outline:plus</FuseSvgIcon>}
                  className="font-black text-[10px] text-indigo-600 border border-dashed border-indigo-200"
                  onClick={() => {
                    const nd = { ...fd.ems_control, items: [...fd.ems_control.items, { id: `Item #${fd.ems_control.items.length + 1}`, status: "OK" }] };
                    set({ ems_control: nd });
                  }}
                >Add EMS Item</Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

const renderUPSSBSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const th = "text-[12px] font-black border border-slate-900 text-center bg-slate-100 p-1 uppercase";
  const td = "text-[13px] border border-slate-900 p-0";
  const tdl = "text-[13px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_8" fallback="8. 1250A TPN UPS SWITCH BOARD" className="outline-none w-full block" editable={editable} />
      </div>
      <div className="border border-slate-900 border-t-0 bg-slate-50/50">
        {[
          { label: 'Main ACB Status', key: 'main_acb', id: 'upssb_lbl1' },
          { label: 'Genset ACB Status', key: 'genset_acb', id: 'upssb_lbl2' },
          { label: 'Essential AVR ACB Status', key: 'ess_avr_acb', id: 'upssb_lbl3' },
        ].map((row, idx) => (
          <div key={row.key} className={`flex justify-between items-center px-4 py-2 border-b border-slate-200 ${idx % 2 === 0 ? 'even:bg-slate-50/50' : ''} hover:bg-indigo-50/30 transition-colors`}>
            <span className="text-[12px] font-black uppercase text-slate-600">
              <EText id={row.id} fallback={row.label} editable={editable} /> :
            </span>
            <div className="flex gap-2">
              <OnOff value={fd.ups_switchboard?.[row.key]} disabled={disabled} onChange={(v: string) => set({ ups_switchboard: { ...fd.ups_switchboard, [row.key]: v } })} />
            </div>
          </div>
        ))}
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className={th} colSpan={2}><EText id="upssb_th1" fallback="Voltage (415V ±10%)" editable={editable} /></th>
            <th className={th} colSpan={2}><EText id="upssb_th2" fallback="Current (Amp)" editable={editable} /></th>
          </tr>
        </thead>
        <tbody>
          {[['R-Y', 'ry', 'R', 'r'], ['Y-B', 'yb', 'Y', 'y'], ['B-R', 'br', 'B', 'b'], ['R-N', 'rn', 'N', 'n'], ['Y-N', 'yn', '-', ''], ['B-N', 'bn', '-', '']].map(([vlbl, vfld, clbl, cfld], i) => (
            <tr key={vfld} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
              <td className={`${tdl} w-[20%]`}>{vlbl}</td>
              <td className={td}><CellIn disabled={disabled} value={fd.ups_switchboard?.v?.[vfld] ?? ''} onChange={(e: any) => set({ ups_switchboard: { ...fd.ups_switchboard, v: { ...fd.ups_switchboard?.v, [vfld]: e.target.value } } })} /></td>
              <td className={`${tdl} w-[20%]`}>{clbl}</td>
              <td className={td}>
                {cfld ? (
                  <CellIn disabled={disabled} value={fd.ups_switchboard?.cur?.[cfld] ?? ''} onChange={(e: any) => set({ ups_switchboard: { ...fd.ups_switchboard, cur: { ...fd.ups_switchboard?.cur, [cfld]: e.target.value } } })} />
                ) : null}
              </td>
            </tr>
          ))}
          <tr className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
            <td className={tdl} colSpan={2}><EText id="upssb_lbl4" fallback="Load Percentage (%)" editable={editable} /></td>
            <td className={td} colSpan={2}><CellIn disabled={disabled} value={fd.ups_switchboard?.load ?? ''} onChange={(e: any) => set({ ups_switchboard: { ...fd.ups_switchboard, load: e.target.value } })} /></td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

const renderACSSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const th = "text-[12px] font-black border border-slate-900 text-center bg-slate-100 p-1 uppercase";
  const td = "text-[13px] border border-slate-900 p-0";
  const tdl = "text-[13px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_9" fallback="9. 600A TPN AIR-COND SWITCH BOARD" className="outline-none w-full block" editable={editable} />
      </div>
      <div className="p-3 border border-slate-900 border-t-0 bg-slate-50/50 flex justify-between items-center hover:bg-indigo-50/30 transition-colors">
        <span className="text-[12px] font-black uppercase text-slate-600">
          <EText id="acs_lbl1" fallback="Main Breaker Status :" editable={editable} />
        </span>
        <OnOff value={fd.aircond_switchboard?.main_breaker} disabled={disabled} onChange={(v: string) => set({ aircond_switchboard: { ...fd.aircond_switchboard, main_breaker: v } })} />
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className={th} colSpan={2}><EText id="acs_th1" fallback="Voltage (415V ±10%)" editable={editable} /></th>
            <th className={th} colSpan={2}><EText id="acs_th2" fallback="Current (Amp)" editable={editable} /></th>
          </tr>
        </thead>
        <tbody>
          {[['R-Y', 'ry', 'R', 'r'], ['Y-B', 'yb', 'Y', 'y'], ['B-R', 'br', 'B', 'b'], ['R-N', 'rn', 'N', 'n'], ['Y-N', 'yn', '-', ''], ['B-N', 'bn', '-', '']].map(([vlbl, vfld, clbl, cfld], i) => (
            <tr key={vfld} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
              <td className={`${tdl} w-[20%]`}>{vlbl}</td>
              <td className={td}><CellIn disabled={disabled} value={fd.aircond_switchboard?.v?.[vfld] ?? ''} onChange={(e: any) => set({ aircond_switchboard: { ...fd.aircond_switchboard, v: { ...fd.aircond_switchboard?.v, [vfld]: e.target.value } } })} /></td>
              <td className={`${tdl} w-[20%]`}>{clbl}</td>
              <td className={td}>
                {cfld ? (
                  <CellIn disabled={disabled} value={fd.aircond_switchboard?.cur?.[cfld] ?? ''} onChange={(e: any) => set({ aircond_switchboard: { ...fd.aircond_switchboard, cur: { ...fd.aircond_switchboard?.cur, [cfld]: e.target.value } } })} />
                ) : null}
              </td>
            </tr>
          ))}
          <tr className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
            <td className={tdl} colSpan={2}><EText id="acs_lbl2" fallback="Load Percentage (%)" editable={editable} /></td>
            <td className={td} colSpan={2}><CellIn disabled={disabled} value={fd.aircond_switchboard?.load ?? ''} onChange={(e: any) => set({ aircond_switchboard: { ...fd.aircond_switchboard, load: e.target.value } })} /></td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

const renderGensetSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const th = "text-[12px] font-black border border-slate-900 text-center bg-slate-100 p-1 uppercase";
  const td = "text-[13px] border border-slate-900 p-0";
  const tdl = "text-[13px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_10" fallback="10. GENSET CUMMINS POWER GENERATORS (900KVA)" className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr>
            <th className={th}><EText id="gen_th1" fallback="Descriptions" editable={editable} /></th>
            {(Array.isArray(fd.genset) ? fd.genset : []).map((g: any, gi: number) => (
              <th key={gi} className={th}>
                <div className="flex flex-col items-center gap-1">
                  {editable && (
                    <IconButton size="small" className="p-0 text-rose-500" onClick={() => {
                      const nd = fd.genset
                        .filter((_: any, i: number) => i !== gi)
                        .map((g: any, i: number) => ({ ...g, id: `Genset ${i + 1}` }));
                      set({ genset: nd });
                    }}>
                      <FuseSvgIcon size={12}>heroicons-outline:trash</FuseSvgIcon>
                    </IconButton>
                  )}
                  <EText
                    id={`gen_row_${gi}`} fallback={g.id} editable={editable}
                    onChange={(val) => {
                      const nd = [...fd.genset];
                      nd[gi].id = val;
                      set({ genset: nd });
                    }}
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { label: 'DC Switch Status', key: 'dc', opts: ['ON', 'OFF'], id: 'gen_lbl1' },
            { label: 'Mode Switch Status', key: 'mode', opts: ['AUTO', 'OFF', 'RUN'], id: 'gen_lbl2' },
            { label: 'Charger Switch Status', key: 'charger', opts: ['ON', 'OFF'], id: 'gen_lbl3' },
            { label: 'Boost / Float Switch Status', key: 'float_switch', opts: ['FLOAT', 'BOOST'], id: 'gen_lbl4' },
            { label: 'Fuel Level (Litre)%', key: 'fuel', input: true, id: 'gen_lbl5' },
            { label: 'ACB Status (ON/OFF/TRIP)', key: 'acb', opts: ['ON', 'OFF', 'TRIP'], id: 'gen_lbl6' },
          ].map(row => (
            <tr key={row.key} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
              <td className={tdl}><EText id={row.id} fallback={row.label} editable={editable} /></td>
              {(Array.isArray(fd.genset) ? fd.genset : []).map((g: any, gi: number) => (
                <td key={gi} className={`${td} text-center p-1`}>
                  {row.input
                    ? <CellIn disabled={disabled} value={g[row.key] ?? ''} onChange={(e: any) => { const nd = [...fd.genset]; nd[gi][row.key] = e.target.value; set({ genset: nd }); }} />
                    : <Select size="small" variant="standard" disabled={disabled} value={g[row.key] ?? row.opts![0]} onChange={(e: any) => { const nd = [...fd.genset]; nd[gi][row.key] = e.target.value; set({ genset: nd }); }} sx={{ fontSize: 13, '.MuiSelect-select': { py: 0.5 } }}>
                      {row.opts!.map(o => <MenuItem key={o} value={o} sx={{ fontSize: 12 }}>{o}</MenuItem>)}
                    </Select>
                  }
                </td>
              ))}
            </tr>
          ))}
          {editable && (
            <tr>
              <td colSpan={(Array.isArray(fd.genset) ? fd.genset.length : 0) + 1} className="p-2 border border-slate-900 bg-slate-50">
                <Button
                  size="small" fullWidth startIcon={<FuseSvgIcon size={14}>heroicons-outline:plus</FuseSvgIcon>}
                  className="font-black text-[10px] text-indigo-600 border border-dashed border-indigo-200"
                  onClick={() => {
                    const nd = [...fd.genset, { id: `Genset ${fd.genset.length + 1}`, dc: "ON", mode: "AUTO", charger: "ON", float_switch: "FLOAT", fuel: "", acb: "OFF" }];
                    set({ genset: nd });
                  }}
                >Add Genset Unit</Button>
              </td>
            </tr>
          )}
          <tr>
            <td colSpan={(Array.isArray(fd.genset) ? fd.genset.length : 0) + 1} className="border border-slate-900 p-4 text-center bg-slate-50 text-slate-700 italic leading-tight">
              <EText id="gen_note" fallback="NOTES: ON DUTY (BLACKOUT) FOR GENSET 1 | GENSET 2 EMERGENCY STOP" bigger editable={editable} />
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

const renderFireAlarmSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const td = "text-[13px] border border-slate-900 p-0";
  const tdl = "text-[13px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-b border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_11" fallback="11. FIRE ALARM SYSTEM PANEL (FAP)" className="outline-none w-full block" editable={editable} />
      </div>
      {(Array.isArray(fd.fire_alarm) ? fd.fire_alarm : []).map((p: any, pi: number) => (
        <div key={pi} className="border-b border-slate-900">
          <div className="text-[11px] font-black uppercase bg-slate-50 px-3 py-1.5 border-b border-slate-200 text-indigo-700 flex justify-between items-center">
            <EText
              id={`fa_panel_${pi}`} fallback={p.id} editable={editable}
              onChange={(val) => {
                const nd = [...fd.fire_alarm];
                nd[pi].id = val;
                set({ fire_alarm: nd });
              }}
            />
            {editable && (
              <IconButton size="small" className="p-0 text-rose-500" onClick={() => {
                const nd = fd.fire_alarm
                  .filter((_: any, i: number) => i !== pi)
                  .map((f: any, i: number) => ({ ...f, id: `Panel #${i + 1}` }));
                set({ fire_alarm: nd });
              }}>
                <FuseSvgIcon size={12}>heroicons-outline:trash</FuseSvgIcon>
              </IconButton>
            )}
          </div>
          <table className="w-full border-collapse text-[11px]">
            <tbody>
              {[
                { lbl: 'Bell ISO', fld: 'bell', tid: 'fa_lbl1' },
                { lbl: 'Buzzer ISO', fld: 'buzzer', tid: 'fa_lbl2' },
                { lbl: 'FAP ISO', fld: 'fap', tid: 'fa_lbl3' }
              ].map((row, idx) => (
                <tr key={row.fld} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
                  <td className={tdl}><EText id={row.tid} fallback={row.lbl} editable={editable} /></td>
                  <td className="border border-slate-900 text-center p-0.5 w-[30%]">
                    <OnOff value={p[row.fld]} disabled={disabled} onChange={(v: string) => { const nd = [...fd.fire_alarm]; nd[pi][row.fld] = v; set({ fire_alarm: nd }); }} />
                  </td>
                </tr>
              ))}
              <tr>
                <td className={tdl}><EText id="fa_lbl4" fallback="Battery Voltage / Current" editable={editable} /></td>
                <td className={td}>
                  <div className="flex divide-x divide-slate-300">
                    <CellIn disabled={disabled} value={p.batt_v} placeholder="V" onChange={(e: any) => { const nd = [...fd.fire_alarm]; nd[pi].batt_v = e.target.value; set({ fire_alarm: nd }); }} />
                    <CellIn disabled={disabled} value={p.amp} placeholder="A" onChange={(e: any) => { const nd = [...fd.fire_alarm]; nd[pi].amp = e.target.value; set({ fire_alarm: nd }); }} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
};

const renderFCUSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const tdl = "text-[13px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-b border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_12" fallback="12. FCU UNIT STATUS" className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[11px]">
        <tbody>
          {[['FCU #1A', 'fcu1a'], ['FCU #1B', 'fcu1b']].map(([lbl, key]) => (
            <tr key={key} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
              <td className={tdl}>{lbl}</td>
              <td className="border border-slate-900 text-center p-1.5"><OnOff value={fd.fcu_status?.[key]} disabled={disabled} onChange={(v: string) => set({ fcu_status: { ...fd.fcu_status, [key]: v } })} /></td>
            </tr>
          ))}
          <tr className="bg-red-50/30">
            <td colSpan={2} className="border border-slate-900 p-3 text-center text-red-700 uppercase tracking-widest leading-none mt-1">
              <EText id="fcu_note" fallback="NOTES: OFF (GAS LEAKAGE DETECTED)" bigger editable={editable} />
            </td>
          </tr>
          {[['FCU #2A', 'fcu2a'], ['FCU #2B', 'fcu2b']].map(([lbl, key]) => (
            <tr key={key} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
              <td className={tdl}>{lbl}</td>
              <td className="border border-slate-900 text-center p-1.5"><OnOff value={fd.fcu_status?.[key]} disabled={disabled} onChange={(v: string) => set({ fcu_status: { ...fd.fcu_status, [key]: v } })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const renderFansSection = (fd: any, set: any, disabled: boolean, editable: boolean) => {
  const tdl = "text-[13px] font-bold border border-slate-900 p-2 uppercase text-slate-700";
  return (
    <>
      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800">
        <EText id="hdr_13" fallback="13. M&E TRANSFORMER FAN STATUS" className="outline-none w-full block" editable={editable} />
      </div>
      <div className="flex justify-around p-4 border border-slate-900 border-t-0 bg-slate-50/50">
        {(['f1', 'f2', 'f3', 'f4'] as const).map((f, i) => (
          <label key={f} className="flex flex-col items-center gap-2 cursor-pointer group">
            <span className="text-[11px] font-black text-slate-500 uppercase">
              <EText id={`fan_trans_${i}`} fallback={`FAN #${i + 1}`} editable={editable} />
            </span>
            <Checkbox
              size="small" checked={!!fd.transformer_fan?.[f]} disabled={disabled}
              onChange={() => set({ transformer_fan: { ...fd.transformer_fan, [f]: !fd.transformer_fan?.[f] } })}
              sx={{ '& .MuiSvgIcon-root': { fontSize: 24 } }}
            />
          </label>
        ))}
      </div>

      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800 mt-4">
        <EText id="hdr_14" fallback="14. M&E AIR-CON STATUS" className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[11px]">
        <tbody>
          {[
            { lbl: 'A/C #1', key: 'ac1', id: 'ac_lbl1' },
            { lbl: 'A/C #2', key: 'ac2', id: 'ac_lbl2' }
          ].map(row => (
            <tr key={row.key} className="even:bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
              <td className={tdl}><EText id={row.id} fallback={row.lbl} editable={editable} /></td>
              <td className="border border-slate-900 text-center p-1.5 font-bold"><OnOff value={fd.mne_aircon?.[row.key]} disabled={disabled} onChange={(v: string) => set({ mne_aircon: { ...fd.mne_aircon, [row.key]: v } })} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-[13px] font-black text-center bg-slate-200 border-y border-slate-900 p-1.5 uppercase text-slate-800 mt-4">
        <EText id="hdr_15" fallback="15. AVR FAN STATUS" className="outline-none w-full block" editable={editable} />
      </div>
      <div className="flex justify-around p-4 border border-slate-900 border-t-0 bg-slate-50/50 flex-wrap gap-4">
        {(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'] as const).map((f, i) => (
          <label key={f} className="flex flex-col items-center gap-1 cursor-pointer">
            <span className="text-[11px] font-black text-slate-500 uppercase">
              <EText id={`fan_avr_${i}`} fallback={`F#${i + 1}`} editable={editable} />
            </span>
            <Checkbox
              size="small" checked={!!fd.avr_fan?.[f]} disabled={disabled}
              onChange={() => set({ avr_fan: { ...fd.avr_fan, [f]: !fd.avr_fan?.[f] } })}
              sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
            />
          </label>
        ))}
      </div>
    </>
  );
};

const renderFooterSection = (meta: any, setMeta: any, disabled: boolean, editable: boolean) => {
  return (
    <div className="border border-slate-900 border-t-2 mt-0">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-900">
        <div className="p-3">
          <div className="text-[12px] font-black uppercase mb-3 text-slate-500"><EText id="foot_lbl1" fallback="Attended by :" editable={editable} /></div>
          <div className="space-y-3 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black whitespace-nowrap"><EText id="foot_lbl2" fallback="Name :" editable={editable} /></span>
              <TextField size="small" variant="standard" fullWidth disabled={disabled} value={meta.attendee} onChange={(e) => setMeta((m: any) => ({ ...m, attendee: e.target.value }))} inputProps={{ style: { fontSize: 13, fontWeight: 700 } }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black whitespace-nowrap"><EText id="foot_lbl3" fallback="Designation :" editable={editable} /></span>
              <TextField size="small" variant="standard" fullWidth disabled={disabled} value={meta.attendeeDesignation} onChange={(e) => setMeta((m: any) => ({ ...m, attendeeDesignation: e.target.value }))} inputProps={{ style: { fontSize: 13, fontWeight: 700 } }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black whitespace-nowrap"><EText id="foot_lbl4" fallback="Date/Time :" editable={editable} /></span>
              <TextField size="small" variant="standard" fullWidth disabled={disabled} value={meta.date} onChange={(e) => setMeta((m: any) => ({ ...m, date: e.target.value }))} inputProps={{ style: { fontSize: 13, fontWeight: 700 } }} />
            </div>
          </div>
        </div>
        <div className="p-3">
          <div className="text-[12px] font-black uppercase mb-3 text-slate-500"><EText id="foot_lbl5" fallback="Verified by :" editable={editable} /></div>
          <div className="space-y-3 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black whitespace-nowrap"><EText id="foot_lbl2_v" fallback="Name :" editable={editable} /></span>
              <TextField size="small" variant="standard" fullWidth disabled={disabled} value={meta.verifier} onChange={(e) => setMeta((m: any) => ({ ...m, verifier: e.target.value }))} inputProps={{ style: { fontSize: 13, fontWeight: 700 } }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black whitespace-nowrap"><EText id="foot_lbl3_v" fallback="Designation :" editable={editable} /></span>
              <TextField size="small" variant="standard" fullWidth disabled={disabled} value={meta.verifierDesignation} onChange={(e) => setMeta((m: any) => ({ ...m, verifierDesignation: e.target.value }))} inputProps={{ style: { fontSize: 13, fontWeight: 700 } }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-black whitespace-nowrap"><EText id="foot_lbl4_v" fallback="Date/Time :" editable={editable} /></span>
              <TextField size="small" variant="standard" fullWidth disabled={disabled} value={meta.date} onChange={(e) => setMeta((m: any) => ({ ...m, date: e.target.value }))} inputProps={{ style: { fontSize: 13, fontWeight: 700 } }} />
            </div>
          </div>
        </div>
        <div className="p-3">
          <div className="text-[12px] font-black uppercase mb-3 text-slate-500"><EText id="foot_lbl6" fallback="Remarks / Observations:" bigger editable={editable} /></div>
          <TextField size="small" variant="standard" fullWidth multiline rows={4} disabled={disabled} value={meta.remarks} onChange={(e) => setMeta((m: any) => ({ ...m, remarks: e.target.value }))} inputProps={{ style: { fontSize: 16, fontWeight: 700 } }} />
        </div>
      </div>
    </div>
  );
};

const DailyChecklistPage: FC = () => {
  const theme = useTheme();
  const { activeProject: selectedProject } = useProject();
  const [view, setView] = useState<"history" | "form">("history");
  const [isDesigning, setIsDesigning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState<"kinetic_motion" | "sabahnet">("kinetic_motion");
  const [selectedHistory, setSelectedHistory] = useState<DailyChecklist | null>(null);
  const [formData, setFormData] = useState<any>(DEFAULT_SECTIONS());

  // Load template on start
  useEffect(() => {
    const saved = localStorage.getItem('elv_checklist_tmpl');
    if (saved && view === 'form' && !isEditing && !selectedHistory) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) { }
    }
  }, [view, isEditing, selectedHistory]);

  const [meta, setMeta] = useState({
    attendee: "", verifier: "",
    attendeeDesignation: "CSE", verifierDesignation: "FACILITY ENGINEER",
    date: format(new Date(), "yyyy-MM-dd"),
    remarks: "", status: "NORMAL",
    docNo: "SN/SDC/F08", revNo: "3", classification: "Internal",
    shift: "NIGHT SHIFT",
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    "UPS System", "PECS & PDU", "BMS Readings", "HSSD, Leak & EMS",
    "Switchboards", "Genset", "Fire Alarm", "FCU Status", "Fans & AC", "Verification"
  ];
  const totalSteps = steps.length;
  const setFormDataPatch = (patch: any) => setFormData((p: any) => {
    const next = { ...p, ...patch };
    if (isDesigning) {
      localStorage.setItem('elv_checklist_tmpl', JSON.stringify(next));
    }
    return next;
  });
  const disabled = false;




  useEffect(() => {
    if (!selectedHistory || isEditing) {
      setMeta(prev => ({
        ...prev,
        shift: company === "sabahnet" ? "MORNING SHIFT" : "NIGHT SHIFT"
      }));
    }
  }, [company, selectedHistory, isEditing]);

  const { data: history = [], isLoading } = useDailyChecklists(
    selectedProject?.id,
    // No company filter - show ALL records so submitted entries are always visible
  );
  const addMutation = useAddDailyChecklist();
  const updateMutation = useUpdateDailyChecklist();
  const deleteMutation = useDeleteDailyChecklist();

  const handleSave = async () => {
    if (!selectedProject) return;

    if (isDesigning) {
      localStorage.setItem('elv_checklist_tmpl', JSON.stringify(formData));
      enqueueSnackbar('Master Checklist Template Updated Successfully!', { variant: 'success' });
      setIsDesigning(false);
      setView('history');
      return;
    }

    const payload = {
      project_id: selectedProject.id,
      company_type: company,
      check_date: meta.date,
      attendee_name: meta.attendee,
      verified_by: meta.verifier,
      status_summary: meta.status,
      sections_data: formData,
      remarks: meta.remarks,
    };
    try {
      if (selectedHistory)
        await updateMutation.mutateAsync({ id: selectedHistory.id, payload });
      else await addMutation.mutateAsync(payload);
      enqueueSnackbar("Report Submitted Successfully", { variant: "success" });
      setIsEditing(false);
      setSelectedHistory(null);
      setFormData(DEFAULT_SECTIONS());
      setView("history");
    } catch (error: any) {
      let msg = "Submission Failed";
      if (error?.response) {
        try {
          const body = await error.response.json();
          msg = body?.message || JSON.stringify(body?.errors || body);
        } catch { }
      } else if (error?.message) {
        msg = error.message;
      }
      enqueueSnackbar(msg, { variant: "error", autoHideDuration: 6000 });
      console.error('[DailyChecklist] Save error:', error);
    }
  };

  const handleViewHistory = (record: DailyChecklist) => {
    setSelectedHistory(record);
    // Always use structured data. If it's an old array format, fallback to default.
    // Ensure we have all sections by merging with default template
    const rawData = record.sections_data;
    const sections = Array.isArray(rawData) ? DEFAULT_SECTIONS() : { ...DEFAULT_SECTIONS(), ...rawData };
    setFormData(sections);
    setMeta({
      ...meta,
      attendee: record.attendee_name,
      verifier: record.verified_by,
      date: format(new Date(record.check_date), "yyyy-MM-dd"),
      remarks: record.remarks,
      status: record.status_summary,
      shift: record.company_type === "sabahnet" ? "MORNING SHIFT" : "NIGHT SHIFT",
    });
    setCompany(record.company_type as any);
    setIsEditing(false);
    setCurrentStep(1);
    setView("form");
  };

  const renderFullLayout = (disabled = false) => {
    const fd = formData;
    const set = (patch: any) => setFormData((p: any) => ({ ...p, ...patch }));

    return (
      <Paper elevation={0} className="bg-white overflow-x-auto min-w-[900px] text-slate-900">
        {/* ── DOCUMENT HEADER ── */}
        <div className="flex border-b-2 border-slate-900">
          <div className="flex-[3] text-center py-2 border-r-2 border-slate-900 bg-slate-50">
            <Typography className="text-[14px] font-black uppercase tracking-[0.2em]">
              <EText id="doc_title" fallback="Daily Checklist For All Equipment" editable={isDesigning} />
            </Typography>
          </div>
          <div className="flex-1 p-1 bg-slate-50 space-y-0.5 text-[8px] font-black">
            <div className="flex justify-between border-b border-slate-200">
              <span className="uppercase tracking-[0.1em]"><EText id="meta_th1" fallback="Document No:" editable={isDesigning} /></span>
              <span>{meta.docNo}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200">
              <span className="uppercase tracking-[0.1em]"><EText id="meta_th2" fallback="Revision No:" editable={isDesigning} /></span>
              <span>{meta.revNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="uppercase tracking-[0.1em]"><EText id="meta_th3" fallback="Classification:" editable={isDesigning} /></span>
              <span>{meta.classification}</span>
            </div>
          </div>
        </div>

        {/* ── 4-COLUMN BODY ── */}
        <div className="grid grid-cols-4 border border-slate-900" style={{ borderCollapse: 'collapse' }}>

          {/* COLUMN 1 */}
          <div className="border-r border-slate-900">
            {renderUPSSection(fd, set, disabled, isDesigning)}
            {renderPECSSection(fd, set, disabled, isDesigning)}
            {renderPDUSection(fd, set, disabled, isDesigning)}
          </div>

          {/* COLUMN 2 */}
          <div className="border-r border-slate-900">
            {renderBMSSection(fd, set, disabled, isDesigning)}
            {renderHSSDSection(fd, set, disabled, isDesigning)}
            {renderLeakSection(fd, set, disabled, isDesigning)}
            {renderEMSSection(fd, set, disabled, isDesigning)}
          </div>

          {/* COLUMN 3 */}
          <div className="border-r border-slate-900">
            {renderUPSSBSection(fd, set, disabled, isDesigning)}
            {renderACSSection(fd, set, disabled, isDesigning)}
            {renderGensetSection(fd, set, disabled, isDesigning)}
          </div>

          {/* COLUMN 4 */}
          <div>
            {renderFireAlarmSection(fd, set, disabled, isDesigning)}
            {renderFCUSection(fd, set, disabled, isDesigning)}
            {renderFansSection(fd, set, disabled, isDesigning)}
          </div>
        </div>

        {/* ── FOOTER ── */}
        {renderFooterSection(meta, setMeta, disabled, isDesigning)}
      </Paper>
    );
  };

  const totalRecords = history.length;
  const thisMonth = history.filter(r => {
    const d = new Date(r.check_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const alarmCount = history.filter(r => r.status_summary !== 'NORMAL').length;
  const normalCount = totalRecords - alarmCount;

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0a0f1e] relative overflow-hidden print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
            /* Root reset */
            html, body, #fuse-layout, #fuse-main, #root, #__next {
                margin: 0 !important;
                padding: 0 !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
            }
            /* Container absolute reset */
            #print-checklist-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                z-index: 999999 !important;
            }
            /* Hide EVERYTHING except report */
            .print-hidden-wrapper { 
                display: none !important; 
                height: 0 !important; 
                overflow: hidden !important; 
            }
            @page { margin: 1cm; size: A4 landscape; }
        }
      `}} />
      {/* Subtle bg grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06] print:hidden" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-500 to-sky-500 print:hidden" />

      <div id="normal-app-container" className="max-w-7xl mx-auto px-6 lg:px-10 py-10 relative z-10 print-hidden-wrapper">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 print:hidden">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em]">
                Infrastructure Assurance
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Operational <span className="text-indigo-600">Checklist</span>
            </h1>
            <p className="text-slate-400 text-sm font-semibold mt-1 tracking-wide">
              Daily Equipment Audit &amp; Verification System
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Company Selector Toggle */}
            {view === 'history' && (
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm">
                {[
                  { id: 'sabahnet', label: 'Sabah Net', sub: 'Morning', color: 'rose' },
                  { id: 'kinetic_motion', label: 'Kinetic', sub: 'Night', color: 'sky' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setCompany(opt.id as any)}
                    className={`relative px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${company === opt.id
                        ? opt.color === 'rose' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none' : 'bg-sky-500 text-white shadow-lg shadow-sky-200 dark:shadow-none'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                  >
                    <span className="block leading-none">{opt.label}</span>
                    <span className="block text-[8px] font-bold opacity-70 mt-0.5">{opt.sub} Shift</span>
                  </button>
                ))}
              </div>
            )}

            {view === 'history' ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outlined"
                  onClick={() => {
                    const saved = localStorage.getItem('elv_checklist_tmpl');
                    if (saved) setFormData(JSON.parse(saved));
                    setIsDesigning(true);
                    setCurrentStep(1);
                    setView('form');
                  }}
                  startIcon={<FuseSvgIcon size={18}>heroicons-outline:pencil-square</FuseSvgIcon>}
                  className={`rounded-2xl px-6 py-3.5 ${isDesigning ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-indigo-50 border-indigo-100 text-indigo-600'} font-black shadow-sm h-12 tracking-wide text-xs transition-all`}
                >
                  Edit Master Template
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setIsDesigning(false);
                    setIsEditing(false);
                    const saved = localStorage.getItem('elv_checklist_tmpl');
                    if (saved) {
                      setFormData(JSON.parse(saved));
                    } else {
                      setFormData(DEFAULT_SECTIONS());
                    }
                    setCurrentStep(1);
                    setView('form');
                  }}
                  startIcon={<FuseSvgIcon size={18}>heroicons-outline:plus-circle</FuseSvgIcon>}
                  className="rounded-2xl px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 font-black shadow-xl shadow-indigo-200 dark:shadow-none h-12 text-sm tracking-wide transform hover:scale-105 active:scale-95 transition-all"
                >
                  New Audit Entry
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {isDesigning && (
                  <Button
                    variant="outlined" color="error" size="small"
                    startIcon={<FuseSvgIcon size={16}>heroicons-outline:refresh</FuseSvgIcon>}
                    className="rounded-xl border-dashed px-4 font-black h-12"
                    onClick={() => {
                      if (window.confirm("Restore to default structural template? This will erase custom rows.")) {
                        setFormData(DEFAULT_SECTIONS());
                      }
                    }}
                  >
                    Reset Template
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={async () => {
                    const printContainer = document.getElementById('print-checklist-container');
                    if (printContainer) {
                        const images = Array.from(printContainer.getElementsByTagName('img'));
                        await Promise.all(images.map(img => 
                            img.complete ? Promise.resolve() : new Promise(resolve => {
                                img.onload = resolve;
                                img.onerror = resolve; 
                            })
                        ));
                        setTimeout(() => window.print(), 300);
                    } else {
                        window.print();
                    }
                  }}
                  startIcon={<FuseSvgIcon size={18}>heroicons-outline:printer</FuseSvgIcon>}
                  className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-slate-600 dark:text-slate-300 px-6 h-12 hover:bg-slate-50 transition-all shadow-sm"
                >
                  Print PDF
                </Button>
                <Button
                  onClick={() => { setView('history'); setIsDesigning(false); setIsEditing(false); }}
                  startIcon={<FuseSvgIcon size={18}>heroicons-outline:clock</FuseSvgIcon>}
                  className="font-black text-slate-500 hover:text-indigo-600 rounded-xl px-6 h-12 uppercase text-[10px] tracking-widest border border-slate-100"
                >
                  Audit History
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Row (history only) ── */}
        {view === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 print:hidden"
          >
            {[
              { label: 'Total Audits', value: totalRecords, icon: 'heroicons-outline:clipboard-document-list', color: 'indigo' },
              { label: 'This Month', value: thisMonth, icon: 'heroicons-outline:calendar-days', color: 'violet' },
              { label: 'Normal', value: normalCount, icon: 'heroicons-outline:check-circle', color: 'emerald' },
              { label: 'Alarm', value: alarmCount, icon: 'heroicons-outline:exclamation-triangle', color: 'rose' },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <Typography className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</Typography>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                      stat.color === 'violet' ? 'bg-violet-50 text-violet-600' :
                        stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-rose-50 text-rose-600'
                    }`}>
                    <FuseSvgIcon size={16}>{stat.icon}</FuseSvgIcon>
                  </div>
                </div>
                <Typography className="text-4xl font-black text-slate-900 dark:text-white leading-none">
                  {stat.value}
                </Typography>
              </div>
            ))}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {view === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6">
                    <FuseSvgIcon size={48} className="text-indigo-300">heroicons-outline:clipboard-document-list</FuseSvgIcon>
                  </div>
                  <Typography className="text-2xl font-black text-slate-300 mb-2">No Records Yet</Typography>
                  <Typography className="text-slate-400 text-sm font-semibold">Create your first daily audit entry to get started.</Typography>
                </div>
              ) : (
                <motion.div
                  variants={{ show: { transition: { staggerChildren: 0.07 } } }}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {history.map((record) => {
                    const isKM = record.company_type === 'kinetic_motion';
                    const isNormal = record.status_summary === 'NORMAL';
                    const dateObj = new Date(record.check_date);
                    return (
                      <motion.div
                        key={record.id}
                        variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      >
                        <Card
                          onClick={() => handleViewHistory(record)}
                          className="group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-[1.75rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden relative"
                          elevation={0}
                        >
                          {/* Color accent top bar */}
                          <div className={`h-1 w-full ${isNormal ? (isKM ? 'bg-gradient-to-r from-sky-400 to-indigo-500' : 'bg-gradient-to-r from-rose-400 to-pink-500') : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />

                          <div className="p-6">
                            {/* Header row */}
                            <div className="flex justify-between items-start mb-5">
                              <div>
                                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border ${isKM ? 'bg-sky-50 border-sky-100 text-sky-600 dark:bg-sky-900/20 dark:border-sky-900 dark:text-sky-400' : 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900 dark:text-rose-400'
                                  }`}>
                                  <div className={`w-2 h-2 rounded-full ${isKM ? 'bg-sky-500' : 'bg-rose-500'}`} />
                                  {isKM ? 'Kinetic Motion' : 'Sabah Net'}
                                </div>
                                <Typography className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-1">
                                  {isKM ? 'Night' : 'Morning'} Shift
                                </Typography>
                              </div>
                              <div className="flex items-center gap-2">
                                <IconButton
                                  size="small"
                                  onClick={async (e) => { 
                                    e.stopPropagation(); 
                                    handleViewHistory(record); 
                                    // Explicit wait for images to decode before printing
                                    setTimeout(async () => {
                                        const printContainer = document.getElementById('print-checklist-container');
                                        if (printContainer) {
                                            const images = Array.from(printContainer.getElementsByTagName('img'));
                                            await Promise.all(images.map(img => 
                                                img.complete ? Promise.resolve() : new Promise(resolve => {
                                                    img.onload = resolve;
                                                    img.onerror = resolve; 
                                                })
                                            ));
                                            // Final safe delay for browser repaint
                                            setTimeout(() => window.print(), 350);
                                        } else {
                                            window.print();
                                        }
                                    }, 1000); 
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                                >
                                  <FuseSvgIcon size={16}>heroicons-outline:printer</FuseSvgIcon>
                                </IconButton>
                                <div className={`px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${isNormal ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                  }`}>
                                  {record.status_summary}
                                </div>
                              </div>
                            </div>

                            {/* Date block */}
                            <div className="mb-6">
                              <Typography className="text-4xl font-black text-slate-900 dark:text-white leading-none group-hover:text-indigo-600 transition-colors">
                                {format(dateObj, 'dd')}
                                <span className="text-2xl font-black text-slate-400 ml-2">{format(dateObj, 'MMM yyyy')}</span>
                              </Typography>
                              <Typography className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
                                {format(dateObj, 'EEEE')}
                              </Typography>
                            </div>

                            {/* Attendee / Verifier */}
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[12px] font-black text-indigo-600">
                                  {record.attendee_name?.charAt(0).toUpperCase() ?? '?'}
                                </div>
                                <div>
                                  <Typography className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Attended</Typography>
                                  <Typography className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{record.attendee_name || 'N/A'}</Typography>
                                </div>
                              </div>
                              {record.verified_by && (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                    <FuseSvgIcon size={12} className="text-emerald-600">heroicons-outline:check-badge</FuseSvgIcon>
                                  </div>
                                  <div>
                                    <Typography className="text-[8px] uppercase font-black text-slate-300 tracking-widest leading-none">Verified</Typography>
                                    <Typography className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{record.verified_by}</Typography>
                                  </div>
                                </div>
                              )}
                            </div>

                            <Divider className="opacity-30 mb-4" />

                            {/* Footer */}
                            <div className="flex justify-between items-center">
                              <Typography className="text-indigo-500 font-black text-[10px] tracking-widest uppercase group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                View Details
                                <FuseSvgIcon size={12}>heroicons-outline:arrow-right</FuseSvgIcon>
                              </Typography>
                              <IconButton
                                size="small"
                                className="bg-slate-50 hover:bg-rose-500 text-slate-300 hover:text-white transition-all rounded-xl p-1.5"
                                onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this audit record?')) deleteMutation.mutate(record.id); }}
                              >
                                <FuseSvgIcon size={14}>heroicons-outline:trash</FuseSvgIcon>
                              </IconButton>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Form Toolbar */}
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${company === 'sabahnet' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'
                    }`}>
                    <FuseSvgIcon size={20}>heroicons-outline:clipboard-document-check</FuseSvgIcon>
                  </div>
                  <div>
                    <Typography className="font-black text-sm text-slate-900 dark:text-white">
                      {selectedHistory ? `Editing Audit #${selectedHistory.id}` : 'New Daily Audit'}
                    </Typography>
                    <Typography className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                      {company === 'sabahnet' ? 'Sabah Net · Morning' : 'Kinetic Motion · Night'} &nbsp;·&nbsp; Complete Protocol
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outlined"
                    startIcon={<FuseSvgIcon size={14}>heroicons-outline:printer</FuseSvgIcon>}
                    onClick={() => window.print()}
                    className="rounded-xl font-black text-xs border border-slate-200"
                  >
                    Print Full Report
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={currentStep !== totalSteps && !isDesigning}
                    className={`rounded-xl font-black text-xs ${isDesigning || currentStep === totalSteps ? 'bg-emerald-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    {isDesigning ? 'Save All Text Changes' : 'Final Submission'}
                  </Button>
                </div>
              </div>

              {/* Stepper Component (Entry Only) */}
              {/* Stepper Component (Re-enabled per request) */}
              <Paper
                elevation={0}
                className="p-3 md:p-6 mb-6 mt-4 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm"
              >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Current Section</span>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{steps[currentStep - 1]}</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="small" variant="outlined" disabled={currentStep === 1} onClick={() => setCurrentStep(prev => prev - 1)}
                      className="rounded-xl border-slate-200 text-slate-500 h-10 px-4 font-bold"
                    >
                      Back
                    </Button>
                    <Button
                      size="small" variant="contained" disabled={currentStep === totalSteps} onClick={() => setCurrentStep(prev => prev + 1)}
                      className="rounded-xl bg-slate-800 text-white h-10 px-6 font-bold"
                    >
                      Next Section
                    </Button>
                  </div>
                </div>

                <>
                  <Stepper
                    activeStep={currentStep - 1}
                    alternativeLabel
                    className="mb-6"
                    sx={{
                      '& .MuiStepLabel-label': { fontSize: 10, fontWeight: 900, textTransform: 'uppercase', tracking: '0.1em', mt: 1 },
                      '& .MuiStepIcon-root': { width: 32, height: 32, cursor: 'pointer', '&.Mui-active': { color: '#6366f1' }, '&.Mui-completed': { color: '#10b981' } }
                    }}
                  >
                    {steps.map((label, idx) => (
                      <Step key={label} onClick={() => setCurrentStep(idx + 1)} className="cursor-pointer group">
                        <StepLabel sx={{ '& .MuiStepLabel-label': { transition: 'color 0.2s', '&:hover': { color: '#6366f1' } } }}>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>

                  {/* Step Content Rendering (The Grey Box Workspace) */}
                  <div className="min-h-[300px] flex flex-col justify-between">
                    <div className="max-w-4xl mx-auto w-full border border-slate-200 p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-[2rem] shadow-inner overflow-x-auto ring-1 ring-slate-100 mb-4 mt-1">
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        {currentStep === 1 && renderUPSSection(formData, setFormDataPatch, disabled, isDesigning)}
                        {currentStep === 2 && (
                          <div className="space-y-4">
                            {renderPECSSection(formData, setFormDataPatch, disabled, isDesigning)}
                            {renderPDUSection(formData, setFormDataPatch, disabled, isDesigning)}
                          </div>
                        )}
                        {currentStep === 3 && renderBMSSection(formData, setFormDataPatch, disabled, isDesigning)}
                        {currentStep === 4 && (
                          <div className="space-y-4">
                            {renderHSSDSection(formData, setFormDataPatch, disabled, isDesigning)}
                            {renderLeakSection(formData, setFormDataPatch, disabled, isDesigning)}
                            {renderEMSSection(formData, setFormDataPatch, disabled, isDesigning)}
                          </div>
                        )}
                        {currentStep === 5 && (
                          <div className="space-y-4">
                            {renderUPSSBSection(formData, setFormDataPatch, disabled, isDesigning)}
                            {renderACSSection(formData, setFormDataPatch, disabled, isDesigning)}
                          </div>
                        )}
                        {currentStep === 6 && renderGensetSection(formData, setFormDataPatch, disabled, isDesigning)}
                        {currentStep === 7 && renderFireAlarmSection(formData, setFormDataPatch, disabled, isDesigning)}
                        {currentStep === 8 && renderFCUSection(formData, setFormDataPatch, disabled, isDesigning)}
                        {currentStep === 9 && renderFansSection(formData, setFormDataPatch, disabled, isDesigning)}
                        {currentStep === 10 && renderFooterSection(meta, setMeta, disabled, isDesigning)}
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                      <Button
                        disabled={currentStep === 1}
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        startIcon={<FuseSvgIcon size={20}>heroicons-outline:arrow-left</FuseSvgIcon>}
                        className="rounded-2xl px-6 py-2.5 font-black text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                      >
                        Back
                      </Button>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center">
                          <Typography className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none mb-1">Step</Typography>
                          <Typography className="text-sm font-black text-slate-400">
                            <span className="text-indigo-600">{currentStep}</span> <span className="text-slate-200 mx-1">/</span> {totalSteps}
                          </Typography>
                        </div>

                        {currentStep < totalSteps ? (
                          <Button
                            variant="contained"
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            endIcon={<FuseSvgIcon size={20}>heroicons-outline:arrow-right</FuseSvgIcon>}
                            className="rounded-2xl px-12 py-4 bg-indigo-600 hover:bg-indigo-700 font-black shadow-xl shadow-indigo-100 transition-all hover:-translate-y-0.5"
                          >
                            Next Section
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            onClick={handleSave}
                            className="rounded-2xl px-12 py-4 bg-emerald-600 hover:bg-emerald-700 font-black shadow-xl shadow-emerald-100 transition-all hover:-translate-y-0.5"
                          >
                            Complete & Submit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              </Paper>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global print style: hide body, portal overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body { background: white !important; }
          /* display:none removes layout space (no blank pages) */
          body > *:not(#print-checklist-container) { display: none !important; }
          @page { margin: 10mm; size: A4 landscape; }
        }
      `}} />

      {/* Print Portal - appended to body for reliable isolation */}
      {mounted && createPortal(
        <div id="print-checklist-container" style={{ position: 'fixed', top: -99999, left: -99999, pointerEvents: 'none' }}>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              #print-checklist-container {
                visibility: visible !important;
                position: static !important;
                display: block !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                pointer-events: auto !important;
              }
              #print-checklist-container * {
                visibility: visible !important;
              }
              table { page-break-inside: auto !important; }
              tr { page-break-inside: avoid !important; page-break-after: auto !important; }
            }
          `}} />
          <div className="w-full">
            {renderFullLayout(disabled)}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DailyChecklistPage;
