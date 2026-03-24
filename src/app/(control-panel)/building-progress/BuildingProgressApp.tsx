import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { Typography, Breadcrumbs, Link } from '@mui/material';
import BuildingMap from './components/BuildingMap';
import BuildingView from './components/BuildingView';
import FloorView from './components/FloorView';
import { useFloorDetails } from './buildingApi';

function BuildingProgressApp() {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Derived state from URL or fallback
    const view = (searchParams.get('view') as 'map' | 'building' | 'floor') || 'map';
    const selectedBuilding = searchParams.get('building');
    const selectedFloor = searchParams.get('floor');

    // These are for deep-linking into specific zones/systems when coming from Dashboard/BOQ
    const [initialZoneId, setInitialZoneId] = useState<number | undefined>(undefined);
    const [initialSystemType, setInitialSystemType] = useState<string | undefined>(undefined);

    const { data: floorData } = useFloorDetails(selectedFloor || '');

    useEffect(() => {
        if (location.state) {
            const { buildingId, floorId, zoneId, systemType } = location.state as any;
            if (buildingId && floorId) {
                const buildingStr = buildingId.toString();
                const floorStr = floorId.toString();

                // Only update if current params are different to avoid loops
                if (searchParams.get('building') !== buildingStr || searchParams.get('floor') !== floorStr || searchParams.get('view') !== 'floor') {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('view', 'floor');
                    newParams.set('building', buildingStr);
                    newParams.set('floor', floorStr);
                    setSearchParams(newParams);
                }

                if (zoneId) setInitialZoneId(zoneId);
                if (systemType) setInitialSystemType(systemType);
            }
        }
    }, [location.state, searchParams, setSearchParams]);

    const handleSelectBuilding = (buildingId: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('view', 'building');
        newParams.set('building', buildingId);
        newParams.delete('floor');
        setSearchParams(newParams);
    };

    const handleSelectFloor = (floorId: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('view', 'floor');
        newParams.set('floor', floorId);
        setSearchParams(newParams);
    };

    const handleBackToMap = () => {
        const newParams = new URLSearchParams();
        newParams.set('view', 'map');
        setSearchParams(newParams);
    };

    const handleBackToBuilding = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('view', 'building');
        newParams.delete('floor');
        setSearchParams(newParams);
    };

    return (
        <div className="flex flex-col w-full h-[calc(100vh-80px)] bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <div className="flex flex-col px-8 py-6 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 shrink-0">
                <Typography variant="h4" className="font-extrabold tracking-tight mb-2 text-gray-900 dark:text-gray-100">
                    Project Progress
                </Typography>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link
                        underline="hover"
                        color={view === 'map' ? 'text.primary' : 'inherit'}
                        onClick={handleBackToMap}
                        className={view !== 'map' ? "cursor-pointer" : ""}
                    >
                        Map Overview
                    </Link>
                    {selectedBuilding && (
                        <Link
                            underline="hover"
                            color={view === 'building' ? 'text.primary' : 'inherit'}
                            onClick={handleBackToBuilding}
                            className={view !== 'building' ? "cursor-pointer" : ""}
                        >
                            Building {selectedBuilding}
                        </Link>
                    )}
                    {selectedFloor && (
                        <Typography color="text.primary">
                            {floorData ? `Floor ${floorData.floor_number}` : `Level ${selectedFloor}`}
                        </Typography>
                    )}
                </Breadcrumbs>
            </div>

            <div className="p-8 w-full h-full overflow-auto">
                {view === 'map' && <BuildingMap onSelectBuilding={handleSelectBuilding} />}
                {view === 'building' && <BuildingView buildingId={selectedBuilding!} onSelectFloor={handleSelectFloor} />}
                {view === 'floor' && <FloorView buildingId={selectedBuilding!} floorId={selectedFloor!} initialZoneId={initialZoneId} initialSystemType={initialSystemType} />}
            </div>
        </div>
    );
}

export default BuildingProgressApp;
