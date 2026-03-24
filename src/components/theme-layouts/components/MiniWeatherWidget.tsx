'use client';
import { Tooltip, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useWeather } from 'src/hooks/useWeather';

function MiniWeatherWidget() {
    const { data, loading, error } = useWeather();

    if (loading) {
        return (
            <Tooltip title="Loading weather...">
                <IconButton className="px-3 rounded-full flex gap-1.5 opacity-50">
                    <FuseSvgIcon size={20} className="animate-spin">heroicons-outline:arrow-path</FuseSvgIcon>
                </IconButton>
            </Tooltip>
        );
    }

    if (error || !data) {
        return null;
    }

    const getWeatherConfig = (condition: string) => {
        switch (condition) {
            case 'Sunny': return { icon: 'heroicons-outline:sun', color: 'text-amber-500' };
            case 'Cloudy': return { icon: 'heroicons-outline:cloud', color: 'text-gray-500' };
            case 'Rainy': return { icon: 'heroicons-outline:cloud-arrow-down', color: 'text-blue-500' };
            case 'Stormy': return { icon: 'heroicons-outline:bolt', color: 'text-purple-600' };
            default: return { icon: 'heroicons-outline:sun', color: 'text-amber-500' };
        }
    };

    const config = getWeatherConfig(data.condition);

    return (
        <Tooltip title={`Suria Sabah: ${data.condition}, ${data.humidity}% Humidity, ${data.windSpeed} km/h Wind`}>
            <IconButton className="px-3 rounded-full flex gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <FuseSvgIcon size={20} className={config.color}>
                    {config.icon}
                </FuseSvgIcon>
                <Typography variant="body2" className="font-semibold text-gray-700 dark:text-gray-200">
                    {data.temperature}°C
                </Typography>
            </IconButton>
        </Tooltip>
    );
}

export default MiniWeatherWidget;
