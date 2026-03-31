'use client';
import { MaintenanceListView } from '../MaintenanceListView';

export default function InternalMaintenancePage() {
    return (
        <MaintenanceListView 
            type="internal"
            title="Internal Maintenance" 
            icon="heroicons-outline:cog-8-tooth" 
            color="from-cyan-500 to-blue-600"
            description="Track and monitor routine infrastructure maintenance performed by the internal on-site team."
        />
    );
}
