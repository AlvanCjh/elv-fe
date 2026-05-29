'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/utils/api';
import { format } from 'date-fns';
import { Typography } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

interface Assignment {
    id: number;
    quantity: number;
    assigned_at: string;
    status?: 'active' | 'returned';
    inventory: {
        brand: string;
        model: string;
        category: string;
        image_url: string | null;
        serial_number?: string;
    };
}

const CATEGORY_ICON: Record<string, string> = {
    'Laptop':       'heroicons-outline:computer-desktop',
    'Mobile Phone': 'heroicons-outline:device-phone-mobile',
    'Monitor':      'heroicons-outline:tv',
    'Workstation':  'heroicons-outline:server',
    'Tablet':       'heroicons-outline:device-tablet',
};

const CATEGORY_COLOR: Record<string, { bg: string; text: string; icon: string }> = {
    'Laptop':       { bg: '#eff6ff', text: '#1d4ed8', icon: '#3b82f6' },
    'Mobile Phone': { bg: '#fdf4ff', text: '#7e22ce', icon: '#a855f7' },
    'Monitor':      { bg: '#fff7ed', text: '#c2410c', icon: '#f97316' },
    'Workstation':  { bg: '#f0fdf4', text: '#15803d', icon: '#22c55e' },
    'Tablet':       { bg: '#f0f9ff', text: '#0369a1', icon: '#0ea5e9' },
};

function getCategory(cat: string) {
    return CATEGORY_COLOR[cat] ?? { bg: '#f8fafc', text: '#475569', icon: '#94a3b8' };
}

function getCategoryIcon(cat: string) {
    return CATEGORY_ICON[cat] ?? 'heroicons-outline:device-tablet';
}

export default function MyItemsPage() {
    const { data: myItems = [], isLoading } = useQuery({
        queryKey: ['inventory-my-items'],
        queryFn: () => api.get('inventory-my-items').json() as Promise<Assignment[]>,
    });

    const activeItems = myItems.filter(i => i.status !== 'returned');
    const totalUnits = myItems.reduce((s, i) => s + i.quantity, 0);

    return (
        <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>

            {/* ── Header ── */}
            <div style={{ marginBottom: 24 }}>
                <Typography
                    variant="h5"
                    sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a', lineHeight: 1.2 }}
                >
                    My Assigned Items
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, fontWeight: 500 }}>
                    Personal hardware in your custody
                </Typography>
            </div>

            {/* ── Summary strip ── */}
            {!isLoading && myItems.length > 0 && (
                <div style={{
                    display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
                }}>
                    {[
                        { label: 'Total Devices', value: myItems.length, icon: 'heroicons-outline:cpu-chip', color: '#2563eb', bg: '#eff6ff' },
                        { label: 'Total Units', value: totalUnits, icon: 'heroicons-outline:cube', color: '#7c3aed', bg: '#f5f3ff' },
                        { label: 'Active', value: activeItems.length, icon: 'heroicons-outline:check-badge', color: '#059669', bg: '#ecfdf5' },
                    ].map(stat => (
                        <div key={stat.label} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 18px',
                            borderRadius: 12,
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            minWidth: 150,
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: stat.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <FuseSvgIcon size={18} style={{ color: stat.color }}>{stat.icon}</FuseSvgIcon>
                            </div>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>{stat.value}</div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── States ── */}
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
                </div>
            ) : myItems.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '64px 24px', gap: 16,
                    border: '2px dashed #e2e8f0', borderRadius: 16, background: '#f8fafc',
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <FuseSvgIcon size={36} style={{ color: '#cbd5e1' }}>heroicons-outline:archive-box-x-mark</FuseSvgIcon>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#475569', marginBottom: 6 }}>No items assigned to you</div>
                        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                            Contact your supervisor to have hardware assigned to your account.
                        </div>
                    </div>
                </div>
            ) : (
                /* ── Item list ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {myItems.map((item, idx) => {
                        const cat = getCategory(item.inventory.category);
                        const icon = getCategoryIcon(item.inventory.category);
                        const isActive = item.status !== 'returned';

                        return (
                            <div
                                key={item.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: '14px 18px',
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 14,
                                    transition: 'box-shadow 0.15s, border-color 0.15s',
                                    cursor: 'default',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = '#c7d2fe';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                                    (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0';
                                }}
                            >
                                {/* Index / thumbnail */}
                                <div style={{
                                    width: 56, height: 56, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                                    background: cat.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: `1px solid ${cat.icon}22`,
                                }}>
                                    {item.inventory.image_url ? (
                                        <img
                                            src={item.inventory.image_url}
                                            alt={`${item.inventory.brand} ${item.inventory.model}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }}
                                        />
                                    ) : (
                                        <FuseSvgIcon size={26} style={{ color: cat.icon }}>{icon}</FuseSvgIcon>
                                    )}
                                </div>

                                {/* Main info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: 800, fontSize: 14, color: '#1e293b',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {item.inventory.brand} {item.inventory.model}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                            letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 6,
                                            background: cat.bg, color: cat.text,
                                        }}>
                                            {item.inventory.category}
                                        </span>
                                        {item.inventory.serial_number && (
                                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', fontWeight: 600 }}>
                                                SN: {item.inventory.serial_number}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Qty */}
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    padding: '6px 16px',
                                    background: '#f8fafc',
                                    borderRadius: 10, border: '1px solid #e2e8f0',
                                    minWidth: 60, flexShrink: 0,
                                }}>
                                    <span style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>
                                        {item.quantity}
                                    </span>
                                    <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                                        Unit{item.quantity !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Date */}
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                    flexShrink: 0, minWidth: 90,
                                }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Assigned On
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 2 }}>
                                        {format(new Date(item.assigned_at), 'dd MMM yyyy')}
                                    </span>
                                </div>

                                {/* Status */}
                                <div style={{ flexShrink: 0 }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                                        letterSpacing: '0.05em', padding: '4px 12px', borderRadius: 20,
                                        background: isActive ? '#dcfce7' : '#f1f5f9',
                                        color: isActive ? '#16a34a' : '#94a3b8',
                                    }}>
                                        <span style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: isActive ? '#22c55e' : '#cbd5e1',
                                            display: 'inline-block',
                                        }} />
                                        {isActive ? 'Active' : 'Returned'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
