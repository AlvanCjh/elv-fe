import { api } from '@/utils/api';

export type InventoryType = 'material' | 'tool';

export interface BaseItem {
    id?: number;
    description?: string;
    brand?: string;
    unit_of_measure: string;
    quantity_in_stock: number;
    location?: string;
    created_at?: string;
    status?: string;
}

export interface Material extends BaseItem {
    material_name: string;
}

export interface Tool extends BaseItem {
    tool_name: string;
    type?: string;
}

export type InventoryItem = Material | Tool;

export type StockOperation = {
    id: number; // item id
    type: InventoryType;
    quantity: number;
    date: string;
    user_id?: string;
    remarks?: string;
};

// ... History Types ...

export interface StockInRecordType {
    id: number;
    item_id: number;
    item_type: string;
    in_qty: number;
    date_in: string;
    remarks?: string;
    created_at: string;
    item: InventoryItem;
}

export interface UsageRecordType {
    id: number;
    item_id: number;
    item_type: string;
    user_id?: string;
    out_qty: number;
    date_out: string;
    remarks?: string;
    expected_return_date?: string;
    return_date?: string;
    return_qty?: number;
    status?: string;
    created_at: string;
    item: InventoryItem;
    user?: any;
}

export interface InventoryHistory {
    stock_in: StockInRecordType[];
    stock_out: UsageRecordType[];
}

export async function getInventory(type: InventoryType = 'material'): Promise<InventoryItem[]> {
    return api.get('inventory', { searchParams: { type } }).json();
}

export async function addMaterial(data: InventoryItem, type: InventoryType = 'material'): Promise<InventoryItem> {
    return api.post('inventory', { searchParams: { type }, json: data }).json();
}

export async function updateMaterial(id: number, data: InventoryItem, type: InventoryType = 'material'): Promise<InventoryItem> {
    return api.put(`inventory/${id}`, { searchParams: { type }, json: data }).json();
}

export async function deleteMaterial(id: number, type: InventoryType = 'material'): Promise<void> {
    return api.delete(`inventory/${id}`, { searchParams: { type } }).json();
}

export async function stockIn(data: StockOperation): Promise<void> {
    return api.post('inventory/stock-in', { json: data }).json();
}

export async function stockOut(data: StockOperation): Promise<void> {
    return api.post('inventory/stock-out', { json: data }).json();
}

export async function getInventoryHistory(): Promise<InventoryHistory> {
    return api.get('inventory/history').json();
}

export async function returnTool(data: { usage_record_id: number; quantity: number; remarks?: string }): Promise<void> {
    return api.post('inventory/return-tool', { json: data }).json();
}