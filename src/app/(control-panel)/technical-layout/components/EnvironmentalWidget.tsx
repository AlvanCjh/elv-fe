import React from 'react';
import { Tooltip } from '@mui/material';

interface EnvironmentalWidgetProps {
    id: number;
    x_pos: number;
    y_pos: number;
    temperature: string;
    humidity: string;
    colorTheme: 'blue' | 'yellow' | 'orange' | string;
    status?: 'ok' | 'warning' | 'critical' | string;
    isEditing?: boolean;
    onClick?: () => void;
    onDragEnd?: (newX: number, newY: number) => void;
}

export const EnvironmentalWidget: React.FC<EnvironmentalWidgetProps> = ({
    x_pos,
    y_pos,
    temperature,
    humidity,
    colorTheme,
    status = 'ok',
    isEditing = false,
    onClick,
    onDragEnd
}) => {
    const widgetRef = React.useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = React.useState(false);
    const [localPos, setLocalPos] = React.useState({ x: x_pos, y: y_pos });
    const isDragMove = React.useRef(false); 

    React.useEffect(() => {
        if (!dragging) {
            setLocalPos({ x: x_pos, y: y_pos });
        }
    }, [x_pos, y_pos, dragging]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isEditing || e.button !== 0) return;
        e.stopPropagation();
        
        const parent = widgetRef.current?.parentElement;
        if (!parent) return;

        let hasMoved = false;
        
        const handlePointerMove = (moveEvent: PointerEvent) => {
            hasMoved = true;
            isDragMove.current = true;
            const parentRect = parent.getBoundingClientRect();
            
            let pctX = ((moveEvent.clientX - parentRect.left) / parentRect.width) * 100;
            let pctY = ((moveEvent.clientY - parentRect.top) / parentRect.height) * 100;
            
            pctX = Math.max(0, Math.min(100, pctX));
            pctY = Math.max(0, Math.min(100, pctY));
            
            setLocalPos({ x: pctX, y: pctY });
        };

        const handlePointerUp = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            setDragging(false);
            
            if (hasMoved && onDragEnd) {
                setLocalPos(prev => {
                    onDragEnd(prev.x, prev.y);
                    return prev;
                });
            }
            
            setTimeout(() => {
                isDragMove.current = false;
            }, 50);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        setDragging(true);
    };

    const getStatusIndicator = () => {
        if (status === 'critical') return <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 z-30"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white shadow-sm"></span></span>;
        if (status === 'warning') return <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 z-30"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" style={{animationDuration: '2s'}}></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-white shadow-sm"></span></span>;
        return null;
    };

    // Render exact matches based on the requested images
    const renderContent = () => {
        if (colorTheme === 'blue') {
            return (
                <div className="flex flex-col gap-[1px]">
                    {/* Top Box (Temp) */}
                    <div className="flex items-stretch border border-[#9fa2a5] bg-[#595a5c] rounded-[1px] h-[25px] overflow-hidden min-w-[105px] shadow-[1px_1px_3px_rgba(0,0,0,0.3)]">
                        {/* Thermometer Icon area */}
                        <div className="flex items-center justify-center w-[25px] bg-gradient-to-b from-[#ffffff] to-[#d4d6d9] border-r border-[#4c4e50]">
                            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] drop-shadow-md">
                                <rect x="9.5" y="4" width="5" height="12" rx="2.5" fill="#e5e7eb" stroke="#a3a3a3" strokeWidth="0.5"/>
                                <circle cx="12" cy="18" r="4.5" fill="#007bff" />
                                <rect x="10.5" y="6" width="3" height="9" fill="#ff0000" />
                            </svg>
                        </div>
                        {/* Text area */}
                        <div className="flex-1 flex items-center justify-center px-1 border-t border-t-[#6e7173] border-b border-b-[#47484a] relative shadow-[inset_0px_1px_0px_rgba(255,255,255,0.05)]">
                            <span className="text-white text-[15px] tracking-wide font-sans font-bold leading-none" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.6)' }}>
                                {temperature} °C
                            </span>
                        </div>
                        {/* Chart Icon area */}
                        <div className="flex items-center justify-center w-[26px] bg-gradient-to-b from-[#8abcf1] to-[#125ba1] border-l border-[#8dbce7] relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-[1px] bg-[#a9d0f5]"></div>
                             <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] drop-shadow-sm">
                                <polyline points="2,14 6,7 10,18 14,8 18,13 22,9" fill="none" stroke="#1c1c1c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="miter" />
                            </svg>
                        </div>
                    </div>

                    {/* Bottom Box (Humidity) */}
                    <div className="flex items-stretch border border-[#9fa2a5] bg-[#595a5c] rounded-[1px] h-[25px] overflow-hidden min-w-[105px] shadow-[1px_1px_3px_rgba(0,0,0,0.3)]">
                        {/* Waves Icon area */}
                        <div className="flex items-center justify-center w-[25px] bg-gradient-to-b from-[#8abcf1] to-[#125ba1] border-r border-[#8dbce7] relative">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#a9d0f5]"></div>
                            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] opacity-90 drop-shadow-sm">
                                <path d="M7 20c0-2.5 2-4 2-6s-2-3-2-6" fill="none" stroke="#e0f2fe" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M12 20c0-2.5 2-4 2-6s-2-3-2-6" fill="none" stroke="#e0f2fe" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M17 20c0-2.5 2-4 2-6s-2-3-2-6" fill="none" stroke="#e0f2fe" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        {/* Text area */}
                        <div className="flex-1 flex items-center justify-center px-1 border-t border-t-[#6e7173] border-b border-b-[#47484a] relative shadow-[inset_0px_1px_0px_rgba(255,255,255,0.05)]">
                            <span className="text-white text-[15px] tracking-wide font-sans font-bold leading-none" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.6)' }}>
                                {humidity} %...
                            </span>
                        </div>
                        {/* Chart Icon area */}
                        <div className="flex items-center justify-center w-[26px] bg-gradient-to-b from-[#8abcf1] to-[#125ba1] border-l border-[#8dbce7] relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-[1px] bg-[#a9d0f5]"></div>
                             <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] drop-shadow-sm">
                                <polyline points="2,14 6,7 10,18 14,8 18,13 22,9" fill="none" stroke="#1c1c1c" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="miter" />
                            </svg>
                        </div>
                    </div>
                </div>
            );
        }

        // Yellow / Orange variant matching exactly Image 2 pattern
        const borderColor = colorTheme === 'yellow' ? 'border-[#fbbf24]' : 'border-[#f97316]';
        
        return (
            <div className="flex flex-col gap-[2px]">
                <div className={`flex items-center justify-between border-[2px] ${borderColor} bg-[#595a5c] rounded-[3px] h-[25px] px-2 min-w-[85px] shadow-[1px_1px_4px_rgba(0,0,0,0.3)]`}>
                    <span className="text-white text-[15px] tracking-wide font-sans font-bold leading-none w-full text-center mt-0.5" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}>
                        {temperature} °C
                    </span>
                </div>
                <div className={`flex items-center justify-between border-[2px] ${borderColor} bg-[#595a5c] rounded-[3px] h-[25px] px-2 min-w-[85px] shadow-[1px_1px_4px_rgba(0,0,0,0.3)]`}>
                    <span className="text-white text-[15px] tracking-wide font-sans font-bold leading-none w-full text-center mt-0.5" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}>
                        {humidity} %...
                    </span>
                </div>
            </div>
        );
    };

    return (
        <Tooltip title={isEditing && !dragging ? "Drag to move, click to edit" : ""} placement="top" arrow>
            <div 
                ref={widgetRef}
                className={`absolute z-20 ${isEditing ? (dragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-105') : ''} ${!dragging ? 'transition-transform duration-200' : ''}`}
                style={{
                    left: `${localPos.x}%`,
                    top: `${localPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                }}
                onPointerDown={handlePointerDown}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isDragMove.current && onClick) onClick();
                }}
            >
                {getStatusIndicator()}
                {renderContent()}
            </div>
        </Tooltip>
    );
};
