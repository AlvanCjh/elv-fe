import { api } from '../../../../utils/api';

const API_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : 'http://127.0.0.1:8000/api';

export interface CsvItem {
    id?: number;
    boq_csv_upload_id?: number;
    item_id: string;
    alias_prefix?: string;
    legend_dbn_name?: string;
    floor_number?: string;
    status: 'unassigned' | 'assigned';
    created_at?: string;
    updated_at?: string;
}

export interface BoqCsvUpload {
    id: number;
    user_id: number;
    filename: string;
    created_at: string;
    updated_at: string;
    items?: CsvItem[];
}

export const fetchCsvUploads = async (): Promise<BoqCsvUpload[]> => {
    return api.get('boq-csv').json<BoqCsvUpload[]>();
};

export const createCsvUpload = async (data: { filename: string, items: Partial<CsvItem>[] }): Promise<BoqCsvUpload> => {
    return api.post('boq-csv', { json: data }).json<BoqCsvUpload>();
};

export const updateCsvItemStatus = async (itemId: number, status: 'unassigned' | 'assigned'): Promise<CsvItem> => {
    return api.put(`boq-csv-items/${itemId}`, { json: { status } }).json<CsvItem>();
};
