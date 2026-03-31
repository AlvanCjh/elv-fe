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
      } catch (e) {}
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
    } catch (e) {}
  };

  return (
    <div
      contentEditable={editable}
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={`${className} ${bigger ? 'text-[15px] font-black' : ''} ${
        editable 
          ? 'border-b-2 border-dashed border-amber-400 bg-amber-50/50 cursor-text px-1 rounded transition-all duration-200' 
          : 'transition-all duration-200'
      } print:border-none print:bg-transparent print:p-0 print:font-bold`}
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
      id: "UPS #P1", sn: "101200726177010001", type: "PH-PH",
      r_in: { l1: "", l2: "", l3: "", f: "" },
      inv_out: { l1: "", l2: "", l3: "", f: "" },
      cur: { l1: "", l2: "", l3: "" },
      load: { l1: "", l2: "", l3: "" },
      dc: "",
    },
    {
      id: "UPS #P2", sn: "101200726177010002", type: "PH-N",
      r_in: { l1: "", l2: "", l3: "", f: "" },
      inv_out: { l1: "", l2: "", l3: "", f: "" },
      cur: { l1: "", l2: "", l3: "" },
      load: { l1: "", l2: "", l3: "" },
      dc: "",
    },
  ],
  pecs_system: [
    { id: "PEC #1", temp: "", hum: "", status: "STANDBY", cool: "", alarm: "OFF" },
    { id: "PEC #2", temp: "", hum: "", status: "ON DUTY", cool: "", alarm: "ON"  },
  ],
  bms_readings: [
    { num: 1,  id: "Telco Room",   temp: "", hum: "" },
    { num: 2,  id: "Staging Room", temp: "", hum: "" },
    { num: 3,  id: "MNE Room",     temp: "", hum: "" },
    { num: 4,  id: "Zone 1",       temp: "", hum: "" },
    { num: 5,  id: "",              temp: "", hum: "" },
    { num: 6,  id: "Zone 2",       temp: "", hum: "" },
    { num: 7,  id: "",              temp: "", hum: "" },
    { num: 8,  id: "MNE UPS",      temp: "", hum: "" },
    { num: 9,  id: "",              temp: "", hum: "" },
    { num: 10, id: "Zone 3",       temp: "", hum: "" },
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
      { id: "det1", fire: false, fault: false, ok: true  },
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
  ups_sb: {
    main_acb: "ON", genset_acb: "OFF", avr_acb: "ON",
    main_v: "", main_a: "",
    genset_v: "", genset_a: "",
    avr_v: "", avr_a: "",
    v_ry: "", v_yb: ""
  },
  ac_sb: {
    main_breaker: "ON",
    voltage: ""
  },
  genset: {
    acb1: "ON", acb2: "OFF",
    v1: "", v2: "",
    a1: "", a2: ""
  },
  fire_alarm: {
    panels: [
      { id: "Fire Panel #1 (Security Room)", bell: "ON", buzzer: "ON", fap: "ON", batt_v: "", amp: "" },
      { id: "Fire Panel #2 (Genset)",        bell: "ON", buzzer: "ON", fap: "ON", batt_v: "", amp: "" },
      { id: "Fire Panel #3 (Lobby)",         bell: "ON", buzzer: "ON", fap: "ON", batt_v: "", amp: "" },
    ]
  },
  fcu_status: [
    { id: "FCU #1A", status: "ON",  comp: "ON",  remark: "" },
    { id: "FCU #1B", status: "OFF", comp: "OFF", remark: "" },
    { id: "FCU #2A", status: "ON",  comp: "ON",  remark: "" },
    { id: "FCU #2B", status: "ON",  comp: "ON",  remark: "" },
  ],
  transformer_fan: { f1: true, f2: true, f3: true, f4: true },
  mne_aircon: { ac1: "ON", ac2: "ON" },
  avr_fan: { f1: true, f2: true, f3: true, f4: true, f5: true, f6: true, f7: true, f8: true },
});

export const CellIn = ({ value, onChange, disabled, type = "text", className = "" }: any) => (
  <div className={`w-full h-full min-h-[14px] flex items-center justify-center ${className}`}>
    <input 
      type={type}
      className="w-full h-full text-center outline-none bg-transparent screen-only border-none p-0 text-[10px]" 
      value={value} 
      onChange={onChange}
      disabled={disabled}
    />
    <span className="print-only text-slate-950 font-bold text-[10px] w-full text-center">
      {value || ""}
    </span>
  </div>
);

const OnOff = ({ value, onChange, disabled }: any) => (
  <div className="flex items-center justify-center gap-1">
    <button
      disabled={disabled}
      onClick={() => !disabled && onChange(value === "ON" ? "OFF" : "ON")}
      className={`print:hidden px-1.5 py-0.5 text-[8px] font-black rounded border transition-all ${
        value === "ON"
          ? "bg-emerald-50 border-emerald-400 text-emerald-800"
          : "bg-red-50 border-red-400 text-red-700"
      }`}
    >{value}</button>
    <div className="hidden print:flex items-center gap-1 text-[9px] font-black uppercase">
       <div className={`w-3 h-3 border border-black flex items-center justify-center ${value === 'ON' ? 'bg-black text-white' : ''}`}>
         {value === 'ON' ? 'v' : ' '}
       </div>
       <span>ON</span>
       <div className={`w-3 h-3 border border-black flex items-center justify-center ${value === 'OFF' ? 'bg-black text-white' : ''}`}>
         {value === 'OFF' ? 'v' : ' '}
       </div>
       <span>OFF</span>
    </div>
  </div>
);

const renderUPSSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const th = "text-[9px] font-black border border-slate-900 text-center bg-slate-100 p-0.5 uppercase";
  const td = "text-[9px] border border-slate-900 p-0";
  const tdl = "text-[10px] font-bold border border-slate-900 p-1 uppercase text-slate-700 leading-tight";
  const unitCount = fd.ups_system?.length || 0;

  return (
    <>
      <div className="text-[11px] font-black text-center bg-slate-200 border-b border-slate-900 p-1 uppercase text-slate-800">
        <EText id="hdr_1" fallback={hdr} className="outline-none w-full block" editable={editable} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr>
              <th className={`${th} w-20 text-[8px]`} rowSpan={2}><EText id="ups_th_desc" fallback="DESCRIPTIONS" editable={editable} /></th>
              {fd.ups_system?.map((u: any, i: number) => (
                <th key={i} className={th} colSpan={4}>
                   <div className="flex flex-col items-center gap-0">
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
               {fd.ups_system?.map((u: any, i: number) => (
                 <Fragment key={i}>
                   <th className={`${th} text-rose-600`}>{u.type === 'PH-N' ? 'R-N' : 'R-Y'}</th>
                   <th className={`${th} text-amber-500`}>{u.type === 'PH-N' ? 'Y-N' : 'Y-B'}</th>
                   <th className={`${th} text-sky-600`}>{u.type === 'PH-N' ? 'B-N' : 'B-R'}</th>
                   <th className={`${th} text-slate-800`}>Freq</th>
                 </Fragment>
               ))}
             </tr>
           </thead>
           <tbody>
             {[
               { label: 'Rectifier Input Voltage (Vac)', key: 'r_in', fields: ['l1','l2','l3','f'], id: 'ups_r1' },
               { label: 'Inverter Output Voltage (Vac)', key: 'inv_out', fields: ['l1','l2','l3','f'], id: 'ups_r2' },
               { label: 'Output Current (Amp)', key: 'cur', fields: ['l1','l2','l3',null], id: 'ups_r3' },
               { label: 'Load %', key: 'load', fields: ['l1','l2','l3',null], id: 'ups_r4' },
             ].map(row => (
              <tr key={row.id}>
                <td className={tdl}><EText id={row.id} fallback={row.label} editable={editable} /></td>
                {fd.ups_system?.map((u: any, ui: number) => (
                  row.fields.map((f: any, fi: number) => (
                    <td key={`${ui}-${fi}`} className={td}>
                      {f ? <CellIn disabled={disabled} value={u[row.key]?.[f] ?? ''} onChange={(e: any) => { 
                        const nd = [...fd.ups_system]; 
                        nd[ui] = { ...nd[ui], [row.key]: { ...nd[ui][row.key], [f]: e.target.value } }; 
                        set({ ups_system: nd }); 
                      }} /> : <div className="bg-slate-50/10 h-4" />}
                    </td>
                  ))
                ))}
              </tr>
            ))}
            <tr>
              <td className={tdl}><EText id="ups_r5" fallback="DC Voltage / Current" editable={editable} /></td>
              {fd.ups_system?.map((u: any, ui: number) => (
                <td key={ui} colSpan={4} className={td}>
                  <CellIn disabled={disabled} value={u.dc ?? ''} onChange={(e: any) => { const nd = [...fd.ups_system]; nd[ui].dc = e.target.value; set({ ups_system: nd }); }} />
                </td>
              ))}
            </tr>
            {editable && (
              <tr className="print:hidden">
                <td colSpan={1 + (unitCount * 4)} className="p-1 border border-slate-900 bg-slate-50">
                   <Button 
                    size="small" fullWidth startIcon={<FuseSvgIcon size={12}>heroicons-outline:plus</FuseSvgIcon>}
                    className="font-black text-[9px] text-indigo-600 border border-dashed border-indigo-200"
                    onClick={() => {
                      const nd = [...fd.ups_system, { id: `UPS Unit #${fd.ups_system.length + 1}`, sn: "", r_in: { ry: "", yb: "", br: "", freq: "" }, inv_out: { ry: "", yb: "", br: "", freq: "" }, cur: { r: "", y: "", b: "" }, load: { r: "", y: "", b: "" }, dc: "" }];
                      set({ ups_system: nd });
                    }}
                  >Add UPS Unit</Button>
                </td>
              </tr>
            )}
            <tr><td colSpan={1 + (unitCount * 4)} className="border border-slate-900 p-1"><EText id="ups_note1" fallback="NOTE:" bigger editable={editable} /></td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

const renderPECSSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const th = "text-[9px] font-black border border-slate-900 text-center bg-slate-100 p-0.5 uppercase";
  const td = "text-[9px] border border-slate-900 p-0";
  const tdl = "text-[10px] font-bold border border-slate-900 p-1 uppercase text-slate-700 leading-tight";
  return (
    <>
      <div className="text-[11px] font-black text-center bg-slate-200 border-y border-slate-900 p-1 uppercase text-slate-800">
        <EText id="hdr_2" fallback={hdr} className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className={`${th} w-12`} rowSpan={2}><EText id="pecs_th1" fallback="PECS No." editable={editable} /></th>
            <th className={th} colSpan={2}><EText id="pecs_th2" fallback="Display (Return air)" editable={editable} /></th>
            <th className={th} colSpan={2}><EText id="pecs_th3" fallback="Operation Status" editable={editable} /></th>
            <th className={th} rowSpan={2}><EText id="pecs_th4" fallback="MSG" editable={editable} /></th>
          </tr>
          <tr>
            <th className={th}>Temp</th>
            <th className={th}>Hum</th>
            <th className={th}>Mode</th>
            <th className={th}>Cool</th>
          </tr>
        </thead>
        <tbody>
          {fd.pecs_system?.map((p: any, idx: number) => (
            <tr key={idx}>
              <td className={tdl}>
                <div className="flex items-center gap-1">
                  {editable && (
                    <IconButton size="small" className="p-0 text-rose-500 print:hidden" onClick={() => {
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
              <td className="border border-slate-900 text-center p-0 font-bold">
                 <OnOff value={p.status ?? 'OFF'} disabled={disabled} onChange={(v: string) => { const nd = [...fd.pecs_system]; nd[idx].status = v; set({ pecs_system: nd }); }} />
              </td>
              <td className={td}><CellIn disabled={disabled} value={p.cool ?? ''} onChange={(e: any) => { const nd = [...fd.pecs_system]; nd[idx].cool = e.target.value; set({ pecs_system: nd }); }} /></td>
              <td className="border border-slate-900 text-center p-0.5">
                <Chip size="small" label={p.alarm ?? 'OFF'} color={(p.alarm ?? 'OFF') === 'OFF' ? 'success' : 'error'} sx={{ height: 16, fontSize: 9, fontWeight: 900 }} onClick={() => { if (!disabled) { const nd = [...fd.pecs_system]; nd[idx].alarm = nd[idx].alarm === 'OFF' ? 'ON' : 'OFF'; set({ pecs_system: nd }); } }} />
              </td>
            </tr>
          ))}
          {editable && (
            <tr className="print:hidden">
              <td colSpan={6} className="p-1 border border-slate-900 bg-slate-50">
                <Button 
                  size="small" fullWidth startIcon={<FuseSvgIcon size={12}>heroicons-outline:plus</FuseSvgIcon>}
                  className="font-black text-[9px] text-indigo-600 border border-dashed border-indigo-200"
                  onClick={() => {
                    const nd = [...fd.pecs_system, { id: `PEC #${fd.pecs_system.length + 1}`, temp: "", hum: "", status: "OFF", cool: "", alarm: "OFF" }];
                    set({ pecs_system: nd });
                  }}
                >Add PEC Unit</Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

const renderPDUSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const th = "text-[8px] font-black border border-slate-900 text-center bg-slate-100 p-0.5";
  const td = "text-[8.5px] border border-slate-900 p-0 h-4";
  const tdl = "text-[9px] font-bold border border-slate-900 p-0.5 uppercase text-slate-600 leading-none";

  return (
    <>
      <div className="text-[11px] font-black text-center bg-slate-200 border-y border-slate-900 p-1 uppercase text-slate-800">
        <EText id="hdr_3" fallback={hdr} className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className={`${th} w-[18%]`} rowSpan={2}><EText id="pdu_th1" fallback="PDU NO." editable={editable} /></th>
            <th className={th} colSpan={3}>3 PHASE V</th>
            <th className={th} colSpan={3}>1 PHASE V</th>
            <th className={th} rowSpan={2}>TOT</th>
          </tr>
          <tr>
            {['R-Y','Y-B','B-R','R-N','Y-N','B-N'].map((h, i) => <th key={h} className={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {fd.pdu_system?.map((p: any, idx: number) => (
            p.isTotal ? (
              <tr key={idx}>
                <td colSpan={7} className="border border-slate-900 p-0.5 text-right text-[8px] font-black italic bg-slate-50 uppercase tracking-widest leading-none">
                  <div className="flex justify-between items-center px-1">
                    {editable && (
                      <IconButton size="small" className="p-0 text-rose-300 print:hidden" onClick={() => {
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
              <tr key={idx}>
                <td className={tdl}>
                  <div className="flex items-center gap-1">
                    {editable && (
                      <IconButton size="small" className="p-0 text-rose-500 print:hidden" onClick={() => {
                        const filtered = fd.pdu_system.filter((_: any, i: number) => i !== idx);
                        let pduCount = 0;
                        const finalND = filtered.map((p: any) => {
                           if (p.isTotal) return p;
                           pduCount++;
                           return { ...p, id: `PDU #${['A','B','C','D','E','F'][pduCount-1] || pduCount}` };
                        });
                        set({ pdu_system: finalND });
                      }}>
                        <FuseSvgIcon size={12}>heroicons-outline:trash</FuseSvgIcon>
                      </IconButton>
                    )}
                    <EText id={`pdu_row_${idx}`} fallback={p.id} editable={editable} onChange={(val) => { const nd = [...fd.pdu_system]; nd[idx].id = val; set({ pdu_system: nd }); }} />
                  </div>
                </td>
                {['ry','yb','br'].map(f => <td key={f} className={td}><CellIn disabled={disabled} value={p.p3?.[f] ?? ''} onChange={(e: any) => { const nd = [...fd.pdu_system]; nd[idx].p3 = { ...nd[idx].p3, [f]: e.target.value }; set({ pdu_system: nd }); }} /></td>)}
                {['rn','yn','bn'].map(f => <td key={f} className={td}><CellIn disabled={disabled} value={p.p1?.[f] ?? ''} onChange={(e: any) => { const nd = [...fd.pdu_system]; nd[idx].p1 = { ...nd[idx].p1, [f]: e.target.value }; set({ pdu_system: nd }); }} /></td>)}
                <td className="border border-slate-900 bg-slate-50" />
              </tr>
            )
          ))}
          {editable && (
            <tr className="print:hidden">
              <td colSpan={8} className="p-1 border border-slate-900 bg-slate-50 space-x-2 flex">
                <Button size="small" variant="outlined" startIcon={<FuseSvgIcon size={10}>heroicons-outline:plus</FuseSvgIcon>} className="font-black text-[9px] text-indigo-600 flex-1 py-0" onClick={() => { const nd = [...fd.pdu_system, { id: `PDU #${fd.pdu_system.filter((x:any)=>!x.isTotal).length + 1}`, p3: { ry: "", yb: "", br: "" }, p1: { rn: "", yn: "", bn: "" } }]; set({ pdu_system: nd }); }}>Add PDU</Button>
                 <Button size="small" variant="outlined" startIcon={<FuseSvgIcon size={10}>heroicons-outline:calculator</FuseSvgIcon>} className="font-black text-[9px] text-emerald-600 flex-1 py-0" onClick={() => { const nd = [...fd.pdu_system, { id: "TOTAL CURRENT", neutral: "", total: "", isTotal: true }]; set({ pdu_system: nd }); }}>Add Total</Button>
              </td>
            </tr>
          )}
          <tr><td colSpan={8} className="border border-slate-900 p-0.5 text-[8px] font-black text-center uppercase tracking-widest"><EText id="pdu_status" fallback="STATUS NORMAL" editable={editable} /></td></tr>
        </tbody>
      </table>
    </>
  );
};

const renderBMSSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const th = "text-[9px] font-black border border-slate-900 text-center bg-slate-100 p-0.5 uppercase";
  const td = "text-[9px] border border-slate-900 p-0";
  const tdl = "text-[9px] font-bold border border-slate-900 p-0.5 uppercase";
  return (
    <>
      <div className="text-[10px] font-black text-center bg-slate-200 border-b border-slate-900 p-0.5 uppercase text-slate-800">
        <EText id="hdr_4" fallback={hdr} className="outline-none w-full block uppercase" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[8px]">
        <thead>
          <tr>
            <th className={`${th} w-6`} />
            <th className={th}><EText id="bms_th1" fallback="BMS Sensor" editable={editable} /></th>
            <th className={th}>Temp (°C)</th>
            <th className={th}>Hum (% RH)</th>
          </tr>
        </thead>
        <tbody>
          {fd.bms_readings?.map((r: any, idx: number) => (
            <tr key={idx}>
              <td className="border border-slate-900 text-center text-[8px] font-black leading-none">{r.num || idx + 1}</td>
              <td className={tdl}>
                <div className="flex items-center gap-0.5">
                  {editable && (
                    <IconButton size="small" className="p-0 text-rose-500 print:hidden" onClick={() => {
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
            <tr className="print:hidden">
              <td colSpan={4} className="p-0.5 border border-slate-900 bg-slate-50">
                <Button 
                  size="small" fullWidth startIcon={<FuseSvgIcon size={10}>heroicons-outline:plus</FuseSvgIcon>}
                  className="font-black text-[8px] text-indigo-600 border border-dashed border-indigo-200 py-0"
                  onClick={() => {
                    const nextNum = fd.bms_readings.length + 1;
                    const nd = [...fd.bms_readings, { num: nextNum, id: `New Zone #${nextNum}`, temp: "", hum: "" }];
                    set({ bms_readings: nd });
                  }}
                >Add Sensor</Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

const renderHSSDSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const th = "text-[9px] font-black border border-slate-900 text-center bg-slate-100 p-0.5 uppercase";
  const tdl = "text-[10px] font-bold border border-slate-900 p-1 uppercase text-slate-700 leading-tight";
  return (
    <>
      <div className="text-[11px] font-black text-center bg-slate-200 border-y border-slate-900 p-1 uppercase text-slate-800">
        <EText id="hdr_5" fallback={hdr} className="outline-none w-full block" editable={editable} />
      </div>
      <div className="border-b border-slate-900 p-1 flex justify-between items-center bg-slate-50">
        <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Main Controller</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase text-slate-500">Operation Status :</span>
          <Chip size="small" label={fd.hssd_status?.operation ?? 'NORMAL'} color={(fd.hssd_status?.operation ?? 'NORMAL') === 'NORMAL' ? 'success' : 'error'} sx={{ height: 18, fontSize: 9, fontWeight: 900 }} />
        </div>
      </div>
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className={th}>DETECTORS</th>
            <th className={th}>Fire</th>
            <th className={th}>Fault</th>
            <th className={th}>OK</th>
          </tr>
        </thead>
        <tbody>
          {fd.hssd_status?.detectors?.map((d: any, idx: number) => (
            <tr key={d.id}>
              <td className={tdl}>
                 <div className="flex items-center gap-0.5">
                  {editable && (
                    <IconButton size="small" className="p-0 text-rose-500 print:hidden" onClick={() => {
                      const nd = { ...fd.hssd_status, detectors: fd.hssd_status.detectors.filter((_: any, i: number) => i !== idx) };
                      set({ hssd_status: nd });
                    }}>
                      <FuseSvgIcon size={12}>heroicons-outline:trash</FuseSvgIcon>
                    </IconButton>
                  )}
                  <EText id={`hssd_det_${idx}`} fallback={d.id} editable={editable} />
                </div>
              </td>
              {(['fire','fault','ok'] as const).map(fld => (
                <td key={fld} className="border border-slate-900 text-center p-0">
                  <div className="print:block hidden">
                     <div className={`w-3 h-3 mx-auto border border-black flex items-center justify-center ${d[fld] ? 'bg-black text-white' : ''}`}>
                       {d[fld] ? 'v' : ' '}
                     </div>
                  </div>
                  <Checkbox size="small" className="print:hidden p-0" checked={!!d[fld]} disabled={disabled} onChange={() => { const nd = { ...fd.hssd_status, detectors: fd.hssd_status.detectors.map((x: any, i: number) => i === idx ? { ...x, [fld]: !x[fld] } : x) }; set({ hssd_status: nd }); }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const renderLeakSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  return (
    <>
      <div className="text-[11px] font-black text-center bg-slate-200 border-y border-slate-900 p-1 uppercase text-slate-800">
        <EText id="hdr_6" fallback={hdr} className="outline-none w-full block" editable={editable} />
      </div>
      <div className="p-1 flex justify-between items-center bg-slate-50/10">
        <span className="text-[10px] font-black uppercase text-slate-600">Main Controller :</span>
        <CellIn disabled={disabled} value={fd.leak_detection?.controller ?? ''} onChange={(e: any) => set({ leak_detection: { ...fd.leak_detection, controller: e.target.value } })} />
      </div>
    </>
  );
};

const renderEMSSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const tdl = "text-[10px] font-bold border border-slate-900 p-1 uppercase text-slate-700 leading-tight";
  return (
    <>
      <div className="text-[11px] font-black text-center bg-slate-200 border-y border-slate-900 p-1 uppercase text-slate-800">
        <EText id="hdr_7" fallback={hdr} className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[9px]">
        <tbody>
          {(Array.isArray(fd.ems_control?.items) ? fd.ems_control.items : []).map((item: any, idx: number) => (
            <tr key={item.id}>
              <td className={tdl}>
                <div className="flex items-center gap-0.5">
                  {editable && (
                    <IconButton size="small" className="p-0 text-rose-500 print:hidden" onClick={() => {
                      const nd = { ...fd.ems_control, items: (Array.isArray(fd.ems_control?.items) ? fd.ems_control.items : [])
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
                      const nd = { ...fd.ems_control, items: (Array.isArray(fd.ems_control?.items) ? fd.ems_control.items : []).map((x:any, i:number)=>i===idx ? {...x, id: val} : x) };
                      set({ ems_control: nd });
                    }} 
                  />
                </div>
              </td>
              <td className="border border-slate-900 text-center p-0.5">
                 <OnOff value={item.status} disabled={disabled} onChange={(v: string) => { 
                   const nd = { ...fd.ems_control, items: (Array.isArray(fd.ems_control?.items) ? fd.ems_control.items : []).map((x: any, i: number) => i === idx ? { ...x, status: v } : x) }; 
                   set({ ems_control: nd }); 
                 }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};
const renderUPSSBSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const th = "text-[9px] font-black border border-slate-900 text-center bg-slate-100 p-0.5 uppercase";
  const td = "text-[9px] border border-slate-900 p-0";
  const tdl = "text-[10px] font-bold border border-slate-900 p-1 uppercase text-slate-700 leading-tight";
  return (
    <>
      <div className="text-[11px] font-black text-center bg-slate-200 border-b border-slate-900 p-1 uppercase text-slate-800">
        <EText id="hdr_8" fallback={hdr} className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className={th} rowSpan={2}>ITEM</th>
            <th className={th} colSpan={2}>STATUS</th>
            <th className={th} colSpan={2}>MEASUREMENT</th>
          </tr>
          <tr>
            <th className={th}>ON</th>
            <th className={th}>OFF</th>
            <th className={th}>R-Y</th>
            <th className={th}>Amp</th>
          </tr>
        </thead>
        <tbody>
          {[
            { lbl: 'Main ACB Status', k1: 'main_acb', k2: 'main_v', k3: 'main_a', id: 'upssb_r1' },
            { lbl: 'Genset ACB Status', k1: 'genset_acb', k2: 'genset_v', k3: 'genset_a', id: 'upssb_r2' },
            { lbl: 'Essential AVR ACB', k1: 'avr_acb', k2: 'avr_v', k3: 'avr_a', id: 'upssb_r3' }
          ].map(row => (
            <tr key={row.k1}>
              <td className={tdl}><EText id={row.id} fallback={row.lbl} editable={editable} /></td>
              <td className="border border-slate-900 text-center p-0" colSpan={2}>
                 <OnOff value={fd.ups_sb?.[row.k1]} disabled={disabled} onChange={(v: string) => set({ ups_sb: { ...fd.ups_sb, [row.k1]: v } })} />
              </td>
              <td className={td}><CellIn disabled={disabled} value={fd.ups_sb?.[row.k2] ?? ''} onChange={(e: any) => set({ ups_sb: { ...fd.ups_sb, [row.k2]: e.target.value } })} /></td>
              <td className={td}><CellIn disabled={disabled} value={fd.ups_sb?.[row.k3] ?? ''} onChange={(e: any) => set({ ups_sb: { ...fd.ups_sb, [row.k3]: e.target.value } })} /></td>
            </tr>
          ))}
          <tr>
            <td className={tdl}><EText id="upssb_note" fallback="Grid Measure:" editable={editable} /></td>
            <td className={td} colSpan={2}><CellIn disabled={disabled} value={fd.ups_sb?.v_ry ?? ''} placeholder="R-Y" onChange={(e: any) => set({ ups_sb: { ...fd.ups_sb, v_ry: e.target.value } })} /></td>
            <td className={td} colSpan={2}><CellIn disabled={disabled} value={fd.ups_sb?.v_yb ?? ''} placeholder="Y-B" onChange={(e: any) => set({ ups_sb: { ...fd.ups_sb, v_yb: e.target.value } })} /></td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

const renderACSSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const th = "text-[9px] font-black border border-slate-900 text-center bg-slate-100 p-0.5 uppercase";
  const td = "text-[9px] border border-slate-900 p-0";
  const tdl = "text-[10px] font-bold border border-slate-900 p-1 uppercase text-slate-700 leading-tight";
  return (
    <>
      <div className="text-[11px] font-black text-center bg-slate-200 border-y border-slate-900 p-1 uppercase text-slate-800">
        <EText id="hdr_9" fallback={hdr} className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[9px]">
        <tbody>
          <tr>
            <td className={tdl}><EText id="acs_r1" fallback="Main Breaker Status" editable={editable} /></td>
            <td className="border border-slate-900 text-center p-0">
               <OnOff value={fd.ac_sb?.main_breaker} disabled={disabled} onChange={(v: string) => set({ ac_sb: { ...fd.ac_sb, main_breaker: v } })} />
            </td>
            <th className={th}>Voltage (415 ± 10%)</th>
            <td className={td}><CellIn disabled={disabled} value={fd.ac_sb?.voltage ?? ''} onChange={(e: any) => set({ ac_sb: { ...fd.ac_sb, voltage: e.target.value } })} /></td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

const renderGensetSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const th = "text-[9px] font-black border border-slate-900 text-center bg-slate-100 p-0.5 uppercase";
  const td = "text-[9px] border border-slate-900 p-0";
  const tdl = "text-[10px] font-bold border border-slate-900 p-1 uppercase text-slate-700 leading-tight";
  return (
    <>
      <div className="text-[10px] font-black text-center bg-slate-200 border-y border-slate-900 p-0.5 uppercase text-slate-800">
        <EText id="hdr_9_v2" fallback={hdr} editable={editable} />
      </div>
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className={th}>Descriptions</th>
            <th className={th}>GEN #1</th>
            <th className={th}>GEN #2</th>
          </tr>
        </thead>
        <tbody>
          {[
            { lbl: 'ACB Status', k1: 'acb1', k2: 'acb2', id: 'gen_r1' },
            { lbl: 'Batt Voltage', k1: 'v1', k2: 'v2', id: 'gen_r2' },
            { lbl: 'Input (Amp)', k1: 'a1', k2: 'a2', id: 'gen_r3' }
          ].map(row => (
            <tr key={row.k1}>
              <td className={tdl}><EText id={row.id} fallback={row.lbl} editable={editable} /></td>
              <td className="border border-slate-900 text-center p-0">
                {row.k1.startsWith('acb') 
                  ? <OnOff value={fd.genset?.[row.k1]} disabled={disabled} onChange={(v: string) => set({ genset: { ...fd.genset, [row.k1]: v } })} />
                  : <CellIn disabled={disabled} value={fd.genset?.[row.k1] ?? ''} onChange={(e: any) => set({ genset: { ...fd.genset, [row.k1]: e.target.value } })} />
                }
              </td>
              <td className="border border-slate-900 text-center p-0">
                {row.k2.startsWith('acb')
                  ? <OnOff value={fd.genset?.[row.k2]} disabled={disabled} onChange={(v: string) => set({ genset: { ...fd.genset, [row.k2]: v } })} />
                  : <CellIn disabled={disabled} value={fd.genset?.[row.k2] ?? ''} onChange={(e: any) => set({ genset: { ...fd.genset, [row.k2]: e.target.value } })} />
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const renderFireAlarmSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const th = "text-[9px] font-black border border-slate-900 text-center bg-slate-100 p-0.5 uppercase";
  const tdl = "text-[10px] font-bold border border-slate-900 p-1 uppercase text-slate-700 leading-tight";
  const panels = Array.isArray(fd.fire_alarm?.panels) && fd.fire_alarm.panels.length > 0 ? fd.fire_alarm.panels : DEFAULT_SECTIONS().fire_alarm.panels;

  return (
    <>
      <div className="text-[11px] font-black text-center bg-slate-200 border-b border-slate-900 p-1 uppercase text-slate-800">
        <EText id="hdr_11" fallback={hdr} className="outline-none w-full block" editable={editable} />
      </div>
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className={th}>Panel Location</th>
            <th className={th}>Bell ISO</th>
            <th className={th}>Buzz ISO</th>
            <th className={th}>FAP ISO</th>
          </tr>
        </thead>
        <tbody>
          {panels.map((p: any, idx: number) => (
            <tr key={idx}>
              <td className={tdl}><EText id={`fap_loc_${idx}`} fallback={p.id} editable={editable} /></td>
              {(['bell','buzzer','fap'] as const).map(fld => (
                <td key={fld} className="border border-slate-900 text-center p-0">
                  <OnOff value={p[fld]} disabled={disabled} onChange={(v: string) => { 
                    const nd = { ...fd.fire_alarm, panels: panels.map((x: any, i: number) => i === idx ? { ...x, [fld]: v } : x) }; 
                    set({ fire_alarm: nd }); 
                  }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const renderFCUSection = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  const fcuList = Array.isArray(fd.fcu_status) && fd.fcu_status.length > 0 ? fd.fcu_status : DEFAULT_SECTIONS().fcu_status;
  
  return (
    <>
      <div className="text-[11px] font-black text-center bg-slate-200 border-y border-slate-900 p-1 uppercase text-slate-800">
        <EText id="hdr_12" fallback={hdr} className="outline-none w-full block" editable={editable} />
      </div>
      <div className="flex flex-col gap-0 border border-slate-900 border-t-0 divide-y divide-slate-400 bg-slate-50/50">
        {fcuList.map((f: any, idx: number) => (
          <div key={idx} className="flex flex-col p-1.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase text-slate-700">{f.id}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-bold text-slate-500">UNIT:</span>
                  <OnOff value={f.status} disabled={disabled} onChange={(v: string) => { 
                      const nd = [...fcuList];
                      nd[idx] = { ...nd[idx], status: v };
                      set({ fcu_status: nd }); 
                  }} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[8px] font-bold text-slate-500">COMP:</span>
                  <OnOff value={f.comp || "OFF"} disabled={disabled} onChange={(v: string) => { 
                      const nd = [...fcuList];
                      nd[idx] = { ...nd[idx], comp: v };
                      set({ fcu_status: nd }); 
                  }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase min-w-[50px]">Remark:</span>
              <input 
                className="flex-1 bg-transparent border-b border-slate-200 text-[10px] focus:outline-none py-0.5 print:hidden"
                value={f.remark || ""}
                disabled={disabled}
                placeholder="N/A"
                onChange={(e) => {
                  const nd = [...fcuList];
                  nd[idx] = { ...nd[idx], remark: e.target.value };
                  set({ fcu_status: nd });
                }}
              />
              <span className="hidden print:block flex-1 text-[9px] border-b border-black font-bold">
                {f.remark || ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const renderTransFanTable = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  return (
    <>
      <div className="text-[10px] font-black text-center bg-slate-200 border-y border-slate-900 p-0.5 uppercase text-slate-800">
        <EText id="hdr_13_v3" fallback={hdr} editable={editable} />
      </div>
      <div className="flex justify-around p-1 border border-slate-900 border-t-0 bg-slate-50/50">
        {(['f1','f2','f3','f4'] as const).map((f, i) => (
          <div key={f} className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-black text-slate-500 uppercase"><EText id={`fan_trans_${i}`} fallback={`F#${i+1}`} editable={editable} /></span>
            <div className="print:block hidden">
               <div className={`w-3 h-3 border border-black flex items-center justify-center ${fd.transformer_fan?.[f] ? 'bg-black text-white' : ''}`}>
                 {fd.transformer_fan?.[f] ? 'v' : ''}
               </div>
            </div>
            <Checkbox size="small" className="print:hidden p-0" checked={!!fd.transformer_fan?.[f]} disabled={disabled} onChange={() => set({ transformer_fan: { ...fd.transformer_fan, [f]: !fd.transformer_fan?.[f] } })} />
          </div>
        ))}
      </div>
    </>
  );
};

const renderACStatusTable = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  return (
    <>
      <div className="text-[10px] font-black text-center bg-slate-200 border-y border-slate-900 p-0.5 uppercase text-slate-800">
        <EText id="hdr_14_v3" fallback={hdr} editable={editable} />
      </div>
      <table className="w-full border-collapse text-[10px]">
        <tbody>
          {[
            { lbl: 'A/C #1', key: 'ac1', id: 'ac_lbl1' },
            { lbl: 'A/C #2', key: 'ac2', id: 'ac_lbl2' }
          ].map(row => (
            <tr key={row.key}>
              <td className="text-[10px] font-bold border border-slate-900 px-1 uppercase">{row.lbl}</td>
              <td className="border border-slate-900 text-center"><OnOff value={fd.mne_aircon?.[row.key]} disabled={disabled} onChange={(v: string) => set({ mne_aircon: { ...fd.mne_aircon, [row.key]: v } })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

const renderAVRFanTable = (fd: any, set: any, disabled: boolean, editable: boolean, hdr: string) => {
  return (
    <>
      <div className="text-[10px] font-black text-center bg-slate-200 border-y border-slate-900 p-0.5 uppercase text-slate-800">
        <EText id="hdr_15_v3" fallback={hdr} editable={editable} />
      </div>
      <div className="flex justify-around p-1 border border-slate-900 border-t-0 bg-slate-50/50 flex-wrap gap-1">
        {(['f1','f2','f3','f4','f5','f6','f7','f8'] as const).map((f, i) => (
          <div key={f} className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-black text-slate-500 uppercase"><EText id={`fan_avr_${i}`} fallback={`F#${i+1}`} editable={editable} /></span>
            <div className="print:block hidden">
               <div className={`w-2.5 h-2.5 border border-black flex items-center justify-center ${fd.avr_fan?.[f] ? 'bg-black text-white' : ''}`}>
                 {fd.avr_fan?.[f] ? 'v' : ''}
               </div>
            </div>
            <Checkbox size="small" className="print:hidden p-0" checked={!!fd.avr_fan?.[f]} disabled={disabled} onChange={() => set({ avr_fan: { ...fd.avr_fan, [f]: !fd.avr_fan?.[f] } })} />
          </div>
        ))}
      </div>
    </>
  );
};

const renderFooterSection = (meta: any, setMeta: any, disabled: boolean, editable: boolean) => {
  return (
    <div className="mt-1 border-t-2 border-slate-900 pt-1">
      <div className="flex divide-x divide-slate-400 border border-slate-900 bg-slate-50/20">
        {/* Attended By */}
        <div className="flex-1 p-2">
          <div className="text-[10px] font-black uppercase text-slate-800 mb-1 border-b border-slate-300 pb-0.5 tracking-wider">Attended by :</div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold min-w-[70px] uppercase">Name :</span>
              <input className="flex-1 bg-transparent border-none text-[10px] border-b border-slate-300 font-bold uppercase focus:outline-none screen-only" value={meta.attendee} disabled={disabled} onChange={(e) => setMeta((m: any) => ({ ...m, attendee: e.target.value }))} />
              <span className="print-only flex-1 border-b border-black text-[10px] font-bold">{meta.attendee || ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold min-w-[70px] uppercase">Designation :</span>
              <input className="flex-1 bg-transparent border-none text-[10px] border-b border-slate-300 font-bold uppercase focus:outline-none screen-only" value={meta.attendeeDesignation} disabled={disabled} onChange={(e) => setMeta((m: any) => ({ ...m, attendeeDesignation: e.target.value }))} />
              <span className="print-only flex-1 border-b border-black text-[10px] font-bold">{meta.attendeeDesignation || ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold min-w-[70px] uppercase">Date/Time :</span>
              <input className="flex-1 bg-transparent border-none text-[10px] border-b border-slate-300 font-bold focus:outline-none screen-only" value={meta.date} disabled={disabled} onChange={(e) => setMeta((m: any) => ({ ...m, date: e.target.value }))} />
              <span className="print-only flex-1 border-b border-black text-[10px] font-bold">{meta.date || ""}</span>
            </div>
            <div className="flex items-start gap-1.5 pt-1">
              <span className="text-[9px] font-bold min-w-[70px] uppercase">Signature :</span>
              <div className="flex-1 h-12 border border-dashed border-slate-400 rounded bg-white/50 flex items-center justify-center text-[9px] text-slate-400 italic font-black uppercase opacity-60">
                 (Sign/Stamp Here)
              </div>
            </div>
          </div>
        </div>

        {/* Verified By */}
        <div className="flex-1 p-2">
          <div className="text-[10px] font-black uppercase text-slate-800 mb-1 border-b border-slate-300 pb-0.5 tracking-wider">Verified by :</div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold min-w-[70px] uppercase">Name :</span>
              <input className="flex-1 bg-transparent border-none text-[10px] border-b border-slate-300 font-bold uppercase focus:outline-none screen-only" value={meta.verifier} disabled={disabled} onChange={(e) => setMeta((m: any) => ({ ...m, verifier: e.target.value }))} />
              <span className="print-only flex-1 border-b border-black text-[10px] font-bold">{meta.verifier || ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold min-w-[70px] uppercase">Designation :</span>
              <input className="flex-1 bg-transparent border-none text-[10px] border-b border-slate-300 font-bold uppercase focus:outline-none screen-only" value={meta.verifierDesignation} disabled={disabled} onChange={(e) => setMeta((m: any) => ({ ...m, verifierDesignation: e.target.value }))} />
              <span className="print-only flex-1 border-b border-black text-[10px] font-bold">{meta.verifierDesignation || ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold min-w-[70px] uppercase">Date/Time :</span>
              <input className="flex-1 bg-transparent border-none text-[10px] border-b border-slate-300 font-bold focus:outline-none screen-only" value={meta.date} disabled={disabled} onChange={(e) => setMeta((m: any) => ({ ...m, date: e.target.value }))} />
              <span className="print-only flex-1 border-b border-black text-[10px] font-bold">{meta.date || ""}</span>
            </div>
            <div className="flex items-start gap-1.5 pt-1">
              <span className="text-[9px] font-bold min-w-[70px] uppercase">Signature :</span>
              <div className="flex-1 h-12 border border-dashed border-slate-400 rounded bg-white/50 flex items-center justify-center text-[9px] text-slate-400 italic font-black uppercase opacity-60">
                 (Sign/Stamp Here)
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global Remarks */}
      <div className="border-2 border-t-0 border-slate-900 p-2 bg-slate-50/10">
        <div className="text-[9px] font-black uppercase text-slate-500 mb-1 tracking-widest leading-none">Remarks / Observations:</div>
        <div className="text-[11px] font-black border-none min-h-[40px] italic text-slate-800">
           {meta.remarks || "No additional observations reported."}
        </div>
      </div>
    </div>
  );
};

const DailyChecklistPage: FC = () => {
  const theme = useTheme();
  const { activeProjectId } = useProject();
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
      } catch(e) {}
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
  const [isPrinting, setIsPrinting] = useState(false);
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

  const handlePrint = () => {
    setIsPrinting(true);
    // Wait for state to propagate
    setTimeout(() => {
      window.print();
      // Reset state and redirect
      setIsPrinting(false);
      setView("history");
      setSelectedHistory(null);
      setIsEditing(false);
      setIsDesigning(false);
    }, 1000);
  };





  useEffect(() => {
    if (!selectedHistory || isEditing) {
      setMeta(prev => ({
        ...prev,
        shift: company === "sabahnet" ? "MORNING SHIFT" : "NIGHT SHIFT"
      }));
    }
  }, [company, selectedHistory, isEditing]);

  const { data: history = [], isLoading } = useDailyChecklists(
    activeProjectId,
    // No company filter - show ALL records so submitted entries are always visible
  );
  const addMutation = useAddDailyChecklist();
  const updateMutation = useUpdateDailyChecklist();
  const deleteMutation = useDeleteDailyChecklist();

  const handleSave = async () => {
    if (!activeProjectId) return;

    if (isDesigning) {
      localStorage.setItem('elv_checklist_tmpl', JSON.stringify(formData));
      enqueueSnackbar('Master Checklist Template Updated Successfully!', { variant: 'success' });
      setIsDesigning(false);
      setView('history');
      return;
    }

    const payload = {
      project_id: activeProjectId,
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
        } catch {}
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
    setFormData(Array.isArray(record.sections_data) ? DEFAULT_SECTIONS() : (record.sections_data || DEFAULT_SECTIONS()));
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

    const documentHeader = (pageNum: number) => (
      <div className="flex flex-col border-b border-slate-900 pb-1 mb-1">
        <div className="flex items-start justify-between w-full">
          {/* Logo & Project */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-900 flex items-center justify-center p-1 rounded-sm">
                <FuseSvgIcon size={24} className="text-white">heroicons-outline:bolt</FuseSvgIcon>
              </div>
              <div className="flex flex-col">
                <Typography className="text-[18px] font-black leading-none text-slate-900 tracking-tighter">KINETIC</Typography>
                <Typography className="text-[14px] font-black leading-none text-slate-600 tracking-tighter">MOTION</Typography>
              </div>
            </div>
            <div className="mt-1">
              <Typography className="text-[10px] font-black text-slate-900 uppercase">PROJECT TITLE : SSDC</Typography>
            </div>
          </div>

          {/* Center Title */}
          <div className="flex flex-col items-center justify-center flex-1">
            <Typography className="text-[16px] font-black uppercase text-slate-900 bg-slate-200 px-8 py-1.5 border border-slate-900 w-full text-center">
              DAILY CHECKLIST FOR ALL EQUIPMENT
            </Typography>
            <Typography className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-[0.2em]">PROJECT: SSDC | PAGE {pageNum} OF 2</Typography>
          </div>

          {/* Company & Doc Info */}
          <div className="text-[8px] font-bold text-right flex flex-col justify-between h-full">
            <div>
              <Typography className="text-[10px] font-black text-slate-900">Kinetic Motion Sdn Bhd.</Typography>
              <p className="text-slate-500 max-w-[200px]">Lot 24-27, Likas Square Commercial Centre, Kota Kinabalu</p>
              <p className="text-slate-400">Tel: 088-266015 Fax: 088-266015</p>
              <p className="text-indigo-400">Email: support@kineticmotion.com.my</p>
            </div>
            <div className="flex justify-end gap-2 mt-1">
               <span className="uppercase text-slate-400">DOC NO:</span> <span className="text-slate-900">{meta.docNo}</span>
               <span className="uppercase text-slate-400 ml-2">REV:</span> <span className="text-slate-900 text-center border-l border-slate-300 pl-2">{meta.revNo}</span>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <Box className="bg-transparent print:space-y-0">
        
        {/* CONSOLIDATED GRID PAGE */}
        <div 
          className="bg-white p-6 shadow-xl rounded-[2.5rem] border border-slate-200 print:border-none print:shadow-none print:p-0 print:rounded-none"
          style={{ minHeight: '90vh' }}
        >
          {documentHeader(1)}

          <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-0 border border-slate-900 border-collapse overflow-hidden">
            {/* COLUMN 1 */}
            <div className="flex flex-col border-r border-slate-900 divide-y divide-slate-400">
              <div className="p-0">{renderUPSSection(fd, set, disabled, isDesigning, "1. UPS SYSTEM (APM-120KVA)")}</div>
              <div className="p-0">{renderPECSSection(fd, set, disabled, isDesigning, "2. PECS SYSTEM DB-AIRE / DBAD26Q Vision 2020I")}</div>
              <div className="p-0 flex-1">{renderBMSSection(fd, set, disabled, isDesigning, "3. BMS READING")}</div>
            </div>

            {/* COLUMN 2 */}
            <div className="flex flex-col border-r border-slate-900 divide-y divide-slate-400">
               <div className="p-0">{renderPDUSection(fd, set, disabled, isDesigning, "4. PDU SYSTEM GE-160A / 54 WAYS")}</div>
               <div className="p-0">{renderUPSSBSection(fd, set, disabled, isDesigning, "5. 1250A TPN UPS SWITCH BOARD")}</div>
               <div className="p-0">{renderACSSection(fd, set, disabled, isDesigning, "6. 600A TPN AIRCOND SWITCH BOARD")}</div>
               <div className="p-0 flex-1">{renderGensetSection(fd, set, disabled, isDesigning, "7. GENSET STATUS")}</div>
            </div>

            {/* COLUMN 3 */}
            <div className="flex flex-col divide-y divide-slate-400">
               <div className="p-0">{renderHSSDSection(fd, set, disabled, isDesigning, "8. HSSD STATUS")}</div>
               <div className="p-0">{renderLeakSection(fd, set, disabled, isDesigning, "9. LEAK DETECTION STATUS")}</div>
               <div className="p-0">{renderEMSSection(fd, set, disabled, isDesigning, "10. EMS CONTROL PANEL STATUS")}</div>
               <div className="p-0">{renderFireAlarmSection(fd, set, disabled, isDesigning, "11. FIRE ALARM PANEL STATUS")}</div>
               <div className="p-0">{renderFCUSection(fd, set, disabled, isDesigning, "12. FCU UNIT STATUS")}</div>
               <div className="p-0">{renderTransFanTable(fd, set, disabled, isDesigning, "13. MAE TRANSFORMER FAN STATUS")}</div>
               <div className="p-0">{renderACStatusTable(fd, set, disabled, isDesigning, "14. MAE AIRCON STATUS")}</div>
               <div className="p-0 flex-1">{renderAVRFanTable(fd, set, disabled, isDesigning, "15. AVR FAN STATUS")}</div>
            </div>
          </div>

          {/* FOOTER SECTION */}
          <div className="mt-1">
             {renderFooterSection(meta, setMeta, disabled, isDesigning)}
          </div>
        </div>
      </Box>
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
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0a0f1e] relative overflow-hidden">
      {/* Subtle bg grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-500 to-sky-500" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 relative z-10">

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
                    className={`relative px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                      company === opt.id
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
                  onClick={handlePrint}
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
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    stat.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
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
                          <div className={`h-1 w-full ${ isNormal ? (isKM ? 'bg-gradient-to-r from-sky-400 to-indigo-500' : 'bg-gradient-to-r from-rose-400 to-pink-500') : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />

                            <div className="p-6">
                              {/* Header row */}
                              <div className="flex justify-between items-start mb-5">
                                <div>
                                  <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border ${
                                    isKM ? 'bg-sky-50 border-sky-100 text-sky-600 dark:bg-sky-900/20 dark:border-sky-900 dark:text-sky-400' : 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900 dark:text-rose-400'
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
                                    onClick={(e) => { e.stopPropagation(); handleViewHistory(record); setTimeout(handlePrint, 500); }} 
                                    className="text-slate-400 hover:text-indigo-600 bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                                  >
                                    <FuseSvgIcon size={16}>heroicons-outline:printer</FuseSvgIcon>
                                  </IconButton>
                                  <div className={`px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${
                                    isNormal ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
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
                                onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this audit record?')) deleteMutation.mutate(record.id); }}
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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    company === 'sabahnet' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'
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
                    onClick={handlePrint}
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
                    <div className="flex flex-col mb-4 pb-4 border-b border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Current Section</span>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">{steps[currentStep-1]}</h2>
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
                        {currentStep === 1 && renderUPSSection(formData, setFormDataPatch, disabled, isDesigning, "1. UPS System")}
                        {currentStep === 2 && (
                          <div className="space-y-4">
                            {renderPECSSection(formData, setFormDataPatch, disabled, isDesigning, "2. PECS System")}
                            {renderPDUSection(formData, setFormDataPatch, disabled, isDesigning, "4. PDU System")}
                          </div>
                        )}
                        {currentStep === 3 && renderBMSSection(formData, setFormDataPatch, disabled, isDesigning, "3. BMS Readings")}
                        {currentStep === 4 && (
                          <div className="space-y-4">
                            {renderHSSDSection(formData, setFormDataPatch, disabled, isDesigning, "8. HSSD Status")}
                            {renderLeakSection(formData, setFormDataPatch, disabled, isDesigning, "9. Leak Detection")}
                            {renderEMSSection(formData, setFormDataPatch, disabled, isDesigning, "10. EMS Control")}
                          </div>
                        )}
                        {currentStep === 5 && (
                          <div className="space-y-4">
                            {renderUPSSBSection(formData, setFormDataPatch, disabled, isDesigning, "5. UPS Switchboard")}
                            {renderACSSection(formData, setFormDataPatch, disabled, isDesigning, "6. AC Switchboard")}
                          </div>
                        )}
                        {currentStep === 6 && renderGensetSection(formData, setFormDataPatch, disabled, isDesigning, "7. Genset Status")}
                        {currentStep === 7 && renderFireAlarmSection(formData, setFormDataPatch, disabled, isDesigning, "11. Fire Alarm Panel")}
                        {currentStep === 8 && renderFCUSection(formData, setFormDataPatch, disabled, isDesigning, "12. FCU Unit Status")}
                        {currentStep === 9 && (
                          <div className="space-y-4">
                            {renderTransFanTable(formData, setFormDataPatch, disabled, isDesigning, "13. Transformer Fan")}
                            {renderACStatusTable(formData, setFormDataPatch, disabled, isDesigning, "14. AC Status")}
                            {renderAVRFanTable(formData, setFormDataPatch, disabled, isDesigning, "15. AVR Fan Status")}
                          </div>
                        )}
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

      {/* Hidden Full Layout for Printing Only - Portal to Body for maximum compatibility */}
      {isPrinting && typeof document !== 'undefined' && createPortal(
        <div id="ssdc-checklist-print-layout">
          <style>
            {`
            @media print {
              @page { 
                size: portrait !important; 
                margin: 5mm !important; 
              }
              
              /* Reset body for print */
              body { 
                background: white !important; 
                color: black !important;
                margin: 0 !important; 
                padding: 0 !important; 
                width: 100% !important; 
                height: auto !important; 
                overflow: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Force hide everything except our target */
              body > *:not(#ssdc-checklist-print-layout) {
                display: none !important;
              }
              
              #ssdc-checklist-print-layout { 
                display: block !important;
                visibility: visible !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                color: black !important;
              }
              
              #ssdc-checklist-print-layout *, 
              #ssdc-checklist-print-layout *:after,
              #ssdc-checklist-print-layout *:before {
                visibility: visible !important;
                color: black !important;
                border-color: black !important;
                background-color: transparent !important;
                box-shadow: none !important;
                opacity: 1 !important;
              }

              /* Specifically preserve background for headers */
              .bg-slate-200, .bg-slate-100, .bg-slate-50 {
                background-color: #f1f5f9 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .flex-1 { flex: none !important; }
              [style*="min-height"] { min-height: 0 !important; }
              [style*="minHeight"] { min-height: 0 !important; }

              table { border-collapse: collapse !important; width: 100% !important; page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              td, th { border: 1px solid black !important; color: black !important; }

              .print-only { display: block !important; visibility: visible !important; }
              .screen-only { display: none !important; }
            }
            
            @media screen {
              .print-only { display: none !important; }
              .screen-only { display: block !important; }
            }
            `}
          </style>
          <div className="print:p-0">
             {renderFullLayout(disabled)}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DailyChecklistPage;
