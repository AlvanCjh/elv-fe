import { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import api from '@/utils/api';

export type MasterListItem = {
    id: string;
    label: string;
    color?: string;
    textColor?: string;
    email?: string;
    contact1?: string;
    contact2?: string;
    contact3?: string;
    itemsSupplied?: string;
    picName?: string;
    picPhone?: string;
    picEmail?: string;
};

export type MasterListCategory = 'status' | 'type' | 'agencyTypes' | 'company' | 'customer' | 'supplier' | 'quotationVersion' | 'deliveryOrder';

export type MasterListData = Record<MasterListCategory, MasterListItem[]>;

const EMPTY: MasterListData = { status: [], type: [], agencyTypes: [], company: [], customer: [], supplier: [], quotationVersion: [], deliveryOrder: [] };

// Map frontend camelCase keys → DB snake_case and back
function toFrontend(raw: any): MasterListItem {
    return {
        id:        String(raw.id),
        label:     raw.label,
        color:     raw.color     ?? undefined,
        textColor: raw.text_color ?? undefined,
        email:     raw.email     ?? undefined,
        contact1:  raw.contact1  ?? undefined,
        contact2:  raw.contact2  ?? undefined,
        contact3:  raw.contact3  ?? undefined,
        itemsSupplied: raw.items_supplied ?? undefined,
        picName:   raw.pic_name  ?? undefined,
        picPhone:  raw.pic_phone ?? undefined,
        picEmail:  raw.pic_email ?? undefined,
    };
}

function toPayload(item: Omit<MasterListItem, 'id'>) {
    return {
        label:      item.label,
        color:      item.color     || null,
        text_color: item.textColor || null,
        email:      item.email     || null,
        contact1:   item.contact1  || null,
        contact2:   item.contact2  || null,
        contact3:   item.contact3  || null,
        items_supplied: item.itemsSupplied || null,
        pic_name:   item.picName   || null,
        pic_phone:  item.picPhone  || null,
        pic_email:  item.picEmail  || null,
    };
}

type MasterListContextType = {
    data: MasterListData;
    loading: boolean;
    addItem:    (category: MasterListCategory, item: Omit<MasterListItem, 'id'>) => Promise<void>;
    updateItem: (category: MasterListCategory, id: string, patch: Partial<MasterListItem>) => Promise<void>;
    deleteItem: (category: MasterListCategory, id: string) => Promise<void>;
    resetCategory: (category: MasterListCategory) => Promise<void>;
};

const MasterListContext = createContext<MasterListContextType | null>(null);

export function MasterListProvider({ children }: { children: ReactNode }) {
    const [data, setData]       = useState<MasterListData>(EMPTY);
    const [loading, setLoading] = useState(true);

    // Load all categories from API on mount
    useEffect(() => {
        api.get('master-list')
            .json<Record<string, any[]>>()
            .then(raw => {
                const mapped: MasterListData = {
                    status:      (raw.status      ?? []).map(toFrontend),
                    type:        (raw.type        ?? []).map(toFrontend),
                    agencyTypes: (raw.agencyTypes ?? []).map(toFrontend),
                    company:     (raw.company     ?? []).map(toFrontend),
                    customer:    (raw.customer    ?? []).map(toFrontend),
                    supplier:    (raw.supplier    ?? []).map(toFrontend),
                    quotationVersion: (raw.quotationVersion ?? []).map(toFrontend),
                    deliveryOrder: (raw.deliveryOrder ?? []).map(toFrontend),
                };
                setData(mapped);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const addItem = useCallback(async (category: MasterListCategory, item: Omit<MasterListItem, 'id'>) => {
        const newItem = await api.post('master-list', { json: { category, ...toPayload(item) } }).json<any>();
        setData(prev => ({ ...prev, [category]: [...prev[category], toFrontend(newItem)] }));
    }, []);

    const updateItem = useCallback(async (category: MasterListCategory, id: string, patch: Partial<MasterListItem>) => {
        const updated = await api.put(`master-list/${id}`, { json: toPayload(patch as any) }).json<any>();
        setData(prev => ({
            ...prev,
            [category]: prev[category].map(i => i.id === id ? toFrontend(updated) : i),
        }));
    }, []);

    const deleteItem = useCallback(async (category: MasterListCategory, id: string) => {
        await api.delete(`master-list/${id}`).json();
        setData(prev => ({ ...prev, [category]: prev[category].filter(i => i.id !== id) }));
    }, []);

    const resetCategory = useCallback(async (category: MasterListCategory) => {
        await api.post('master-list/seed', { json: { category } }).json();
        const raw = await api.get('master-list').json<Record<string, any[]>>();
        setData(prev => ({
            ...prev,
            [category]: (raw[category] ?? []).map(toFrontend),
        }));
    }, []);

    const value = useMemo(() => ({
        data, loading, addItem, updateItem, deleteItem, resetCategory
    }), [data, loading, addItem, updateItem, deleteItem, resetCategory]);

    return <MasterListContext.Provider value={value}>{children}</MasterListContext.Provider>;
}

export function useMasterList() {
    const ctx = useContext(MasterListContext);
    if (!ctx) throw new Error('useMasterList must be used within MasterListProvider');
    return ctx;
}
