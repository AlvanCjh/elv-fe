import { useState, useMemo } from 'react';
import { Typography, Tabs, Tab, Box, Button } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useWeather } from 'src/hooks/useWeather';
import WeatherWidget from './components/WeatherWidget';
import InspectionReportsWidget from './components/InspectionReportsWidget';
import MaintenanceReportsWidget from './components/MaintenanceReportsWidget';
import BentoTile from './components/BentoTile';

type DashboardModule = 'overview' | 'inspections' | 'maintenance' | 'fire' | 'weather';

function OnSiteDashboardApp() {
    const [currentTab, setCurrentTab] = useState(0);
    const [activeModule, setActiveModule] = useState<DashboardModule>('overview');
    const { data: realWeather, forecast, warnings, loading: weatherLoading } = useWeather();

    // Dummy Mock Data (Reduced)
    const mockData = useMemo(() => {
        return {
            today: {
                weather: { condition: 'Sunny' as const, temperature: 28, humidity: 65, windSpeed: 12 },
                tasks: [
                    { id: 't1', title: 'Replace Server Room Filters', description: 'Routine bi-weekly filter swap on AC unit 4', system: 'HVAC', time: '08:00 AM', status: 'Completed' as const },
                    { id: 't2', title: 'Calibrate Lobby Cameras', description: 'Adjusting PTZ tracking sensitivity in north sector', system: 'CCTV', time: '11:15 AM', status: 'In Progress' as const },
                    { id: 't3', title: 'Test Backup Generator', description: 'Monthly cold start test simulation', system: 'Electrical', time: '03:00 PM', status: 'Scheduled' as const },
                ]
            },
            tomorrow: {
                weather: { condition: 'Cloudy' as const, temperature: 24, humidity: 72, windSpeed: 18 },
                tasks: [
                    { id: 't4', title: 'Update Access Control Firmware', description: 'Applying v2.4 patch to main gate readers', system: 'Security', time: '05:00 AM', status: 'Scheduled' as const },
                ]
            },
            nextWeek: {
                weather: { condition: 'Rainy' as const, temperature: 22, humidity: 85, windSpeed: 25 },
                tasks: [
                    { id: 't5', title: 'Fiber Optic Backbone Rerouting', description: 'Migrating core switches to new rack layout', system: 'Network', time: '11:00 PM', status: 'Scheduled' as const },
                    { id: 't6', title: 'Annual Fire Suppression Test', description: 'Full system wet test', system: 'Life Safety', time: '08:00 AM', status: 'Scheduled' as const },
                ]
            }
        };
    }, []);

    const renderModuleContent = () => {
        const todayWeather = realWeather || mockData.today.weather;

        switch (activeModule) {
            case 'inspections':
                return (
                    <div className="w-full max-w-7xl mx-auto min-h-[600px] animate-fade-in-up">
                        <InspectionReportsWidget />
                    </div>
                );
            case 'maintenance':
                return (
                    <div className="w-full max-w-7xl mx-auto min-h-[600px] animate-fade-in-up">
                        <MaintenanceReportsWidget />
                    </div>
                );
            case 'weather':
                return (
                    <div className="w-full max-w-3xl mx-auto h-auto min-h-[720px] animate-fade-in-up">
                        <WeatherWidget
                            dateLabel="Suria Sabah"
                            {...todayWeather}
                            loading={weatherLoading}
                            forecast={forecast}
                            warnings={warnings}
                        />
                    </div>
                );
            case 'fire':
                return (
                    <div className="w-full max-w-4xl mx-auto h-[400px] flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl animate-fade-in-up">
                        <Typography color="text.secondary" variant="h6">This module is under construction.</Typography>
                    </div>
                );
            case 'overview':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-7xl mx-auto animate-fade-in-up">
                        <BentoTile
                            id="inspections"
                            title="Inspection Report"
                            description="Need approval to complete (each floor)"
                            icon="heroicons-outline:clipboard-document-check"
                            iconColor="text-amber-500"
                            iconBgColor="bg-amber-100 dark:bg-amber-900/30"
                            statusText="Live Data"
                            statusColorClass="text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/40"
                            onClick={() => setActiveModule('inspections')}
                        />
                        <BentoTile
                            id="maintenance"
                            title="Maintenance Report"
                            description="Equipment & systems maintenance log"
                            icon="heroicons-outline:wrench-screwdriver"
                            iconColor="text-green-500"
                            iconBgColor="bg-green-100 dark:bg-green-900/30"
                            statusText="Up to Date"
                            statusColorClass="text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/40"
                            onClick={() => setActiveModule('maintenance')}
                        />
                        <BentoTile
                            id="fire"
                            title="Fire Risk Assessment"
                            description="Routine fire safety & risk analysis"
                            icon="heroicons-outline:fire"
                            iconColor="text-red-500"
                            iconBgColor="bg-red-100 dark:bg-red-900/30"
                            statusText="Valid"
                            statusColorClass="text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/40"
                            onClick={() => setActiveModule('fire')}
                        />

                        <BentoTile
                            id="weather"
                            title="Weather Report"
                            description="Site weather conditions & forecasts"
                            icon="heroicons-outline:cloud"
                            iconColor="text-sky-500"
                            iconBgColor="bg-sky-100 dark:bg-sky-900/30"
                            statusText={todayWeather.condition === 'Sunny' ? `Clear / ${todayWeather.temperature}°C` : `${todayWeather.condition} / ${todayWeather.temperature}°C`}
                            statusColorClass="text-sky-700 bg-sky-100 dark:text-sky-400 dark:bg-sky-900/40"
                            onClick={() => setActiveModule('weather')}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col w-full min-h-full bg-[#f8fafc] dark:bg-gray-900">
            {/* Header Section */}
            <div className="flex items-center justify-between px-6 py-6 bg-transparent">
                <div>
                    <Typography variant="h4" className="font-black tracking-tight text-indigo-900 dark:text-indigo-100 mb-1 flex items-center gap-3">
                        {activeModule !== 'overview' && (
                            <Button
                                variant="text"
                                color="inherit"
                                onClick={() => setActiveModule('overview')}
                                className="min-w-0 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                            >
                                <FuseSvgIcon size={24}>heroicons-outline:arrow-left</FuseSvgIcon>
                            </Button>
                        )}
                        Onsite Report
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 dark:text-gray-400 font-medium ml-[52px]">
                        Centralized dashboard for all critical site documentation and status reports
                    </Typography>
                </div>

                {/* Optional Top Right Actions */}

            </div>

            {/* Main Content Area */}
            <div className="p-4 sm:p-6 w-full flex-1 overflow-x-hidden overflow-y-auto">
                {renderModuleContent()}
            </div>
        </div>
    );
}

export default OnSiteDashboardApp;
