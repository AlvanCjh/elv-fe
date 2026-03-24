import { FC, useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useBuildings } from '../buildingApi';

// Fix Leaflet's default icon path issues with Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface BuildingMapProps {
    onSelectBuilding: (id: string) => void;
}

const BuildingMap: FC<BuildingMapProps> = ({ onSelectBuilding }) => {
    const { data: buildings, isLoading, isError } = useBuildings();

    // Default center (Kota Kinabalu area based on provided coords roughly, or just first building)
    const defaultCenter: [number, number] = [5.9894, 116.0761];
    const defaultZoom = 15;

    if (isLoading) {
        return (
            <Box className="w-full h-full flex items-center justify-center">
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box className="w-full h-full flex items-center justify-center text-red-500">
                <Typography>Error loading buildings.</Typography>
            </Box>
        );
    }

    // Determine initial center: if buildings exist, center on the first one
    const center: [number, number] = buildings && buildings.length > 0
        ? [Number(buildings[0].latitude), Number(buildings[0].longitude)]
        : defaultCenter;

    return (
        <Box className="w-full h-full flex flex-col relative rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
            <div className="absolute top-4 left-14 z-[1000] bg-white dark:bg-gray-800 px-4 py-2 rounded shadow-md">
                <Typography variant="h6" className="font-bold text-gray-800 dark:text-gray-100">Select a Building</Typography>
                <Typography variant="caption" className="text-gray-500 dark:text-gray-400">Click on a marker to proceed</Typography>
            </div>

            <MapContainer
                center={center}
                zoom={defaultZoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {buildings?.map((building) => (
                    <Marker
                        key={building.id}
                        position={[Number(building.latitude), Number(building.longitude)]}
                        eventHandlers={{
                            click: () => {
                                // Optional: auto-select on click or show popup first
                            },
                        }}
                    >
                        <Popup>
                            <div className="flex flex-col gap-2 min-w-[200px]">
                                <Typography variant="subtitle1" className="font-bold">{building.name}</Typography>
                                <Typography variant="body2" className="text-gray-600">
                                    Total Floors: {building.total_floor}
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    onClick={() => onSelectBuilding(building.id.toString())}
                                    fullWidth
                                >
                                    View Details
                                </Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </Box>
    );
};

export default BuildingMap;
