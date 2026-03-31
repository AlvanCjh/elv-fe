import React, { useState } from 'react';
import Button from '@mui/material/Button';

export const uuid = () => Math.random().toString(36).substr(2, 9);
export const cell = (v: string, cs = 1, rs = 1, bg = '', c = '#000000', b = false, align: 'left' | 'center' | 'right' = 'center') => {
    return { id: uuid(), v, cs, rs, bg: bg || '#ffffff', c, b, align };
}

const HD = '#e5e7eb'; // header bg
const WH = '#ffffff';

export const INITIAL_GRID = [
    [cell('DAILY CHECKLIST FOR ALL EQUIPMENT', 16, 1, '#d1d5db', '#000', true, 'center')],
    [
        cell('1. UPS SYSTEM (APM-120KVA)', 9, 1, HD, '#000', true),
        cell('7. 1250A TPN UPS SWITCH BOARD', 3, 1, HD, '#000', true),
        cell('10. FIRE ALARM PANEL STATUS', 4, 1, HD, '#000', true)
    ],
    [
        cell('DESCRIPTIONS', 1, 2, HD, '#000', true),
        cell('UPS # P1 (s/n : 101200726177010001)', 4, 1, HD, '#000', true),
        cell('UPS # P2 (s/n : 101200726177010002)', 4, 1, HD, '#000', true),
        cell('Main ACB Status', 1, 1, HD, '#000', true, 'left'),
        cell('ON', 1, 1, WH, '#000', true),
        cell('OFF', 1, 1, WH, '#000', true),
        cell('Fire Panel # 1 (Security Room)', 4, 1, HD, '#000', true)
    ],
    [
        cell('R-Y (L1)',1,1,WH,'#ef4444',true), cell('Y-B (L2)',1,1,WH,'#eab308',true), cell('B-R (L3)',1,1,WH,'#3b82f6',true), cell('Frequency',1,1,HD,'#000',true),
        cell('R-Y (L1)',1,1,WH,'#ef4444',true), cell('Y-B (L2)',1,1,WH,'#eab308',true), cell('B-R (L3)',1,1,WH,'#3b82f6',true), cell('Frequency',1,1,HD,'#000',true),
        cell('Genset ACB Status', 1, 1, HD, '#000', true, 'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true),
        cell('Bell ISO',2,1,HD,'#000',true,'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true)
    ],
    [
        cell('Rectifier Input Voltage (Vac)', 1, 1, HD, '#000', true),
        cell('',1,1,WH), cell('',1,1,WH), cell('',1,1,WH), cell('',1,1,WH),
        cell('',1,1,WH), cell('',1,1,WH), cell('',1,1,WH), cell('',1,1,WH),
        cell('Essential AVR ACB\nStatus', 1, 1, HD, '#000', true, 'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true),
        cell('Buzzer ISO',2,1,HD,'#000',true,'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true)
    ],
    [
        cell('Inverter Output Voltage (Vac)', 1, 1, HD, '#000', true),
        cell('R-N (U1)',1,1,WH,'#ef4444',true), cell('Y-N (U2)',1,1,WH,'#eab308',true), cell('B-N (U3)',1,1,WH,'#3b82f6',true), cell('Frequency',1,1,HD,'#000',true),
        cell('R-N (U1)',1,1,WH,'#ef4444',true), cell('Y-N (U2)',1,1,WH,'#eab308',true), cell('B-N (U3)',1,1,WH,'#3b82f6',true), cell('Frequency',1,1,HD,'#000',true),
        cell('Voltage Measurement:', 1, 4, HD, '#000', true, 'right'), cell('R-Y',1,1,WH,'#ef4444',true), cell('',1,1,WH),
        cell('FAP ISO',2,1,HD,'#000',true,'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true)
    ],
    [
        cell('Output Current (Amp)', 1, 1, HD, '#000', true),
        cell('',1,1,WH), cell('',1,1,WH), cell('',1,1,WH), cell('',1,1,WH),
        cell('',1,1,WH), cell('',1,1,WH), cell('',1,1,WH), cell('',1,1,WH),
        cell('Y-B',1,1,WH,'#eab308',true), cell('',1,1,WH),
        cell('Battery Voltage',2,1,HD,'#000',true,'left'), cell('Vdc',2,1,WH,'#000',true,'right')
    ],
    [
        cell('Load %', 1, 1, HD, '#000', true),
        cell('',4,1,WH), cell('',4,1,WH),
        cell('B-R',1,1,WH,'#3b82f6',true), cell('',1,1,WH),
        cell('Input (Amp)',2,1,HD,'#000',true,'left'), cell('Amp',2,1,WH,'#000',true,'right')
    ],
    [
        cell('DC Bus Volatge (Vdc)', 1, 1, HD, '#000', true),
        cell('Vdc',4,1,WH,'#000',true,'right'), cell('Vdc',4,1,WH,'#000',true,'right'),
        cell('R-N',1,1,WH,'#ef4444',true), cell('',1,1,WH),
        cell('Fire Panel # 2 (Genset)',4,1,HD,'#000',true,'center')
    ],
    [
        cell('NOTE :', 9, 1, HD, '#000', true, 'left'),
        cell('Current Measurement:', 1, 4, HD, '#000', true, 'right'), cell('Y-N',1,1,WH,'#eab308',true), cell('',1,1,WH),
        cell('Bell ISO',2,1,HD,'#000',true,'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true)
    ],
    [
        cell('NOTE :', 9, 1, HD, '#000', true, 'left'),
        cell('B-N',1,1,WH,'#3b82f6',true), cell('',1,1,WH),
        cell('Buzzer ISO',2,1,HD,'#000',true,'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true)
    ],
    [
        cell('2. PECS SYSTEM DB-AIRE / DBAD2SQ Vision 2020i', 9, 1, HD, '#000', true),
        cell('R',1,1,WH,'#ef4444',true), cell('',1,1,WH),
        cell('FAP ISO',2,1,HD,'#000',true,'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true)
    ],
    [
        cell('PECS No.', 1, 2, HD, '#000', true),
        cell('On-Panel Display (Of Return air)', 4, 1, HD, '#000', true),
        cell('Operation Status', 2, 1, HD, '#000', true),
        cell('MSG\nAlarm', 2, 2, HD, '#000', true),
        cell('Y',1,1,WH,'#eab308',true), cell('',1,1,WH),
        cell('Battery Voltage',2,1,HD,'#000',true,'left'), cell('',2,1,WH)
    ],
    [
        cell('Temperature', 2, 1, HD, '#000', true), cell('Humidity', 2, 1, HD, '#000', true),
        cell('Mode', 1, 1, HD, '#000', true), cell('% Cooling', 1, 1, HD, '#000', true),
        cell('Load Percentage %', 1, 4, HD, '#000', true, 'right'),
        cell('B',1,1,WH,'#3b82f6',true), cell('',1,1,WH),
        cell('Input (Amp)',2,1,HD,'#000',true,'left'), cell('',2,1,WH)
    ],
    [
        cell('PEC # 1', 1, 1, HD, '#000', true),
        cell('°C',2,1,HD,'#000',true,'right'), cell('% RH',2,1,HD,'#000',true,'right'),
        cell('STANDBY',1,1,WH,'#000',true), cell('',1,1,WH), cell('OFF',2,1,WH,'#000',true),
        cell('N',1,1,WH,'#000',true), cell('',1,1,WH),
        cell('Fire Panel # 3 (Lobby)',4,1,HD,'#000',true)
    ],
    [
        cell('PEC # 2', 1, 1, HD, '#000', true),
        cell('°C',2,1,HD,'#000',true,'right'), cell('% RH',2,1,HD,'#000',true,'right'),
        cell('ON DUTY',1,1,WH,'#000',true), cell('',1,1,WH), cell('ON',2,1,WH,'#000',true),
        cell('R',1,1,WH,'#ef4444',true), cell('',1,1,WH),
        cell('Bell ISO',2,1,HD,'#000',true,'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true)
    ],
    [
        cell('BMS Sensor', 1, 2, HD, '#000', true),
        cell('BMS Reading', 4, 1, HD, '#000', true),
        cell('4. HSSD STATUS', 4, 1, HD, '#000', true),
        cell('Y',1,1,WH,'#eab308',true), cell('',1,1,WH),
        cell('Buzzer ISO',2,1,HD,'#000',true,'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true)
    ],
    [
        cell('Temperature',2,1,HD,'#000',true), cell('Humidity',2,1,HD,'#000',true),
        cell('Main Controller',4,1,HD,'#000',true),
        cell('B',1,1,WH,'#3b82f6',true), cell('',1,1,WH),
        cell('FAP ISO',2,1,HD,'#000',true,'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true)
    ],
    [
        cell('3. PDU SYSTEM GE -160A / 54 WAYS', 9, 1, HD, '#000', true),
        cell('8. 600A TPN AIRCOND SWITCH BOARD', 3, 1, HD, '#000', true),
        cell('Battery Voltage',2,1,HD,'#000',true,'left'), cell('',2,1,WH)
    ],
    [
        cell('PDU (GE-160A / 54 WAYS )', 1, 2, HD, '#000', true),
        cell('3 PHASE VOLTAGE', 3, 1, HD, '#000', true), cell('1 PHASE VOLTAGE', 3, 1, HD, '#000', true),
        cell('5. LEAK DETECTION\nSTATUS', 2, 2, HD, '#000', true),
        cell('Main Breaker Status :', 1, 1, HD, '#000', true, 'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true),
        cell('Input (Amp)',2,1,HD,'#000',true,'left'), cell('',2,1,WH)
    ],
    [
        cell('R-Y',1,1,WH,'#ef4444',true), cell('Y-B',1,1,WH,'#eab308',true), cell('B-R',1,1,WH,'#3b82f6',true),
        cell('R-N',1,1,WH,'#ef4444',true), cell('Y-N',1,1,WH,'#eab308',true), cell('B-N',1,1,WH,'#3b82f6',true),
        cell('Voltage Measurement:\n415 ± 10%', 1, 4, HD, '#000', true, 'right'), cell('R-Y',1,1,WH,'#ef4444',true), cell('415',1,1,WH,'#000',true),
        cell('11. FCU UNIT STATUS', 4, 1, HD, '#000', true)
    ],
    [
        cell('PDU # 3A',1,1,HD,'#000',true,'left'), cell('',6,1,WH),
        cell('Main Controller',2,1,HD,'#000',true),
        cell('Y-B',1,1,WH,'#eab308',true), cell('415',1,1,WH,'#000',true),
        cell('FCU # 1A', 2, 1, HD, '#000', true, 'left'), cell('ON',1,1,WH,'#000',true), cell('OFF',1,1,WH,'#000',true)
    ],
    [
        cell('TOTAL CURRENT',1,1,HD,'#000',true,'left'), cell('',3,1,WH), cell('Neutral',1,1,HD,'#000',true), cell('',2,1,WH),
        cell('',2,1,WH),
        cell('B-R',1,1,WH,'#3b82f6',true), cell('414',1,1,WH,'#000',true),
        cell('OFF',4,1,WH,'#000',true)
    ],
    [
        cell('Attended by :', 9, 1, HD, '#000', true, 'left'), cell('Verified by :', 7, 1, HD, '#000', true, 'left')
    ],
    [
        cell('Name : \nDesignation :\nDate/Time :', 9, 1, WH, '#000', true, 'left'), cell('Name : \nDesignation :\nDate/Time :', 7, 1, WH, '#000', true, 'left')
    ]
];

export const GridEditor = ({ data, onChange, readOnly }: { data: any, onChange: (v: any) => void, readOnly: boolean }) => {
    const [selectedCell, setSelectedCell] = useState<{ r: number, c: number } | null>(null);

    const updateCell = (r: number, c: number, patch: any) => {
        const newGrid = [...data];
        newGrid[r] = [...newGrid[r]];
        newGrid[r][c] = { ...newGrid[r][c], ...patch };
        onChange(newGrid);
    };

    const addRow = (index: number) => {
        const newRow = Array(16).fill(null).map(() => cell('', 1, 1, WH, '#000000', false, 'left'));
        const newGrid = [...data];
        newGrid.splice(index + 1, 0, newRow);
        onChange(newGrid);
    };

    const removeRow = (index: number) => {
        if (data.length <= 1) return;
        const newGrid = [...data];
        newGrid.splice(index, 1);
        onChange(newGrid);
    };

    return (
        <div className="overflow-auto w-full max-w-full">
            {!readOnly && (
                <div className="sticky top-0 bg-white border border-slate-300 p-3 mb-4 rounded-xl flex space-x-4 z-10 print:hidden items-center shadow-lg">
                     <span className="font-extrabold mr-4 text-xs text-slate-800 uppercase tracking-widest whitespace-nowrap hidden md:block">Table Tools</span>
                     <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                         <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-500 mb-0.5">Text</span>
                            <input type="color" className="w-6 h-6 rounded cursor-pointer border-none" 
                                value={selectedCell ? (data[selectedCell.r][selectedCell.c].c || '#000000') : '#000000'} 
                                onChange={(e) => selectedCell && updateCell(selectedCell.r, selectedCell.c, { c: e.target.value })} 
                                title="Text Color" 
                            />
                         </div>
                         <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-500 mb-0.5">Fill</span>
                            <input type="color" className="w-6 h-6 rounded cursor-pointer border-none" 
                                value={selectedCell ? (data[selectedCell.r][selectedCell.c].bg || '#ffffff') : '#ffffff'} 
                                onChange={(e) => selectedCell && updateCell(selectedCell.r, selectedCell.c, { bg: e.target.value })} 
                                title="Background Color" 
                            />
                         </div>
                     </div>
                     <div className="h-8 w-px bg-slate-200 mx-2"></div>
                     <div className="flex items-center space-x-1">
                        <Button 
                            variant={selectedCell && data[selectedCell.r][selectedCell.c].b ? 'contained' : 'outlined'} 
                            size="small" 
                            onClick={() => selectedCell && updateCell(selectedCell.r, selectedCell.c, { b: !data[selectedCell.r][selectedCell.c].b })}
                            className="min-w-[40px] px-2 font-bold"
                        >B</Button>
                        <Button variant="outlined" size="small" onClick={() => selectedCell && updateCell(selectedCell.r, selectedCell.c, { align: 'left' })} className="min-w-[40px] px-2">L</Button>
                        <Button variant="outlined" size="small" onClick={() => selectedCell && updateCell(selectedCell.r, selectedCell.c, { align: 'center' })} className="min-w-[40px] px-2">C</Button>
                        <Button variant="outlined" size="small" onClick={() => selectedCell && updateCell(selectedCell.r, selectedCell.c, { align: 'right' })} className="min-w-[40px] px-2">R</Button>
                     </div>
                     <div className="h-8 w-px bg-slate-200 mx-2"></div>
                     <div className="flex items-center space-x-2">
                        <Button variant="contained" color="secondary" size="small" onClick={() => addRow(selectedCell ? selectedCell.r : data.length - 1)}>+ Add Row Below</Button>
                        <Button variant="outlined" color="error" size="small" onClick={() => selectedCell && removeRow(selectedCell.r)}>- Remove Row</Button>
                     </div>
                     <div className="flex-1"></div>
                     {selectedCell && (
                        <div className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded hidden lg:block">Cell: Row {selectedCell.r + 1}, Col {selectedCell.c + 1}</div>
                     )}
                </div>
            )}
            
            <div className="relative inline-block min-w-full">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                        header, nav, aside, [role="navigation"], .navbar, .sidebar { display: none !important; }
                        body * { visibility: hidden !important; }
                        #print-daily-checklist-grid-container, #print-daily-checklist-grid-container * { visibility: visible !important; }
                        #print-daily-checklist-grid-container { 
                            position: fixed !important; left: 0 !important; top: 0 !important; width: 100vw !important; height: auto !important; max-width: 100vw !important;
                            display: block !important; margin: 0 !important; padding: 5mm !important; box-sizing: border-box !important;
                            background: white !important; z-index: 9999999 !important;
                        }
                        @page { margin: 0; size: A4 landscape; }
                        .page-break-before { page-break-before: always; }
                    }
                `}} />
                <div id="print-daily-checklist-grid-container" className="bg-white p-4">
                    <table className="w-full border-collapse font-sans text-[10px] leading-tight print:w-full print:table-fixed select-none">
                        <tbody>
                            {data.map((row: any, rIndex: number) => (
                                <tr key={rIndex}>
                                    {row.map((c: any, cIndex: number) => {
                                        const isSelected = selectedCell?.r === rIndex && selectedCell?.c === cIndex;
                                        return (
                                            <td 
                                                key={c.id} 
                                                colSpan={c.cs || 1} 
                                                rowSpan={c.rs || 1} 
                                                onClick={() => setSelectedCell({ r: rIndex, c: cIndex })}
                                                className={`border border-slate-800 p-1 align-middle transition-all duration-100 min-w-[20px] ${isSelected && !readOnly ? 'ring-[3px] ring-indigo-500 ring-inset z-10 relative bg-indigo-50/20' : ''}`}
                                                style={{ backgroundColor: isSelected && !readOnly ? undefined : c.bg, color: c.c, fontWeight: c.b ? '900' : 'normal', textAlign: c.align }}
                                            >
                                                <div 
                                                    contentEditable={!readOnly} 
                                                    suppressContentEditableWarning 
                                                    className={`outline-none break-words whitespace-pre-wrap ${isSelected ? 'cursor-text' : 'cursor-pointer'}`}
                                                    onBlur={e => updateCell(rIndex, cIndex, { v: e.target.innerText })}
                                                    onFocus={() => setSelectedCell({ r: rIndex, c: cIndex })}
                                                >
                                                    {c.v}
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
