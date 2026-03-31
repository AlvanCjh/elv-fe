'use client';
import { MaintenanceListView } from '../MaintenanceListView';

export default function ExternalMaintenancePage() {
    return (
        <MaintenanceListView 
            type="external"
            title="External Maintenance" 
            icon="heroicons-outline:wrench-screwdriver" 
            color="from-rose-500 to-pink-600"
            description="Manage and schedule maintenance work involving external contractors and vendors."
        />
    );
}
