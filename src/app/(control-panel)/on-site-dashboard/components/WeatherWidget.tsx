import { useState } from 'react';
import { Paper, Typography, Tabs, Tab, Collapse } from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { CategorizedForecast, WeatherWarning } from 'src/hooks/useWeather';

interface WeatherProps {
    dateLabel: string;
    condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
    temperature: number;
    humidity: number;
    windSpeed: number;
    loading?: boolean;
    forecast?: CategorizedForecast | null;
    warnings?: WeatherWarning[];
}

function WeatherWidget({ dateLabel, condition, temperature, humidity, windSpeed, loading, forecast, warnings = [] }: WeatherProps) {
    const [tabIndex, setTabIndex] = useState(0);
    const [expandedWarning, setExpandedWarning] = useState<number | null>(null);

    const getWarningStyle = (severity: string) => {
        switch (severity) {
            case 'severe': return { bg: 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700', icon: 'heroicons-outline:exclamation-triangle', iconColor: 'text-red-600 dark:text-red-400', label: 'bg-red-600', textColor: 'text-red-800 dark:text-red-200' };
            case 'warning': return { bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700', icon: 'heroicons-outline:exclamation-circle', iconColor: 'text-amber-600 dark:text-amber-400', label: 'bg-amber-500', textColor: 'text-amber-800 dark:text-amber-200' };
            default: return { bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700', icon: 'heroicons-outline:information-circle', iconColor: 'text-blue-600 dark:text-blue-400', label: 'bg-blue-500', textColor: 'text-blue-800 dark:text-blue-200' };
        }
    };

    const getWeatherConfig = (cond: string) => {
        switch (cond) {
            case 'Sunny': return { icon: 'heroicons-outline:sun', color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20', accent: 'bg-amber-100 dark:bg-amber-800' };
            case 'Cloudy': return { icon: 'heroicons-outline:cloud', color: 'text-slate-500', bg: 'bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-900', accent: 'bg-slate-200 dark:bg-slate-700' };
            case 'Rainy': return { icon: 'heroicons-outline:cloud-arrow-down', color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/20', accent: 'bg-blue-100 dark:bg-blue-800' };
            case 'Stormy': return { icon: 'heroicons-outline:bolt', color: 'text-purple-600', bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/20', accent: 'bg-purple-100 dark:bg-purple-800' };
            default: return { icon: 'heroicons-outline:sun', color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20', accent: 'bg-amber-100 dark:bg-amber-800' };
        }
    };

    const config = getWeatherConfig(condition);

    return (
        <Paper className={`p-8 sm:p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl border border-white/40 dark:border-white/5 backdrop-blur-md ${config.bg} transition-all duration-500 flex flex-col justify-between h-full group relative overflow-hidden`}>

            {/* Subtle atmospheric decorative circle */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full ${config.accent} opacity-30 blur-3xl`} />

            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <Typography variant="overline" className="font-bold tracking-[0.2em] text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase">
                        {dateLabel} Weather
                        {loading && <FuseSvgIcon size={16} className="animate-spin text-gray-400">heroicons-outline:arrow-path</FuseSvgIcon>}
                    </Typography>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-3xl ${config.accent} bg-opacity-50 dark:bg-opacity-30 backdrop-blur-sm shadow-inner flex items-center justify-center shrink-0`}>
                            <FuseSvgIcon size={64} className={`${config.color}`}>{config.icon}</FuseSvgIcon>
                        </div>
                        <div className="flex flex-col">
                            <Typography variant="h1" className="font-black text-gray-800 dark:text-gray-100 tracking-tighter leading-none" style={{ fontSize: '4.5rem' }}>
                                {temperature}°
                            </Typography>
                            <Typography variant="h6" className="text-gray-600 dark:text-gray-300 font-semibold tracking-wide ml-1 mt-1 uppercase">
                                {condition}
                            </Typography>
                        </div>
                    </div>

                    <div className="hidden sm:block w-px h-16 bg-gray-300 dark:bg-gray-600 rounded-full" />

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-sm w-fit shadow-sm border border-white/50 dark:border-white/5">
                            <FuseSvgIcon size={16} className="text-red-500">heroicons-outline:map-pin</FuseSvgIcon>
                            <Typography variant="caption" className="font-bold text-gray-700 dark:text-gray-300">
                                Agate, Tower
                            </Typography>
                        </div>
                        <Typography variant="caption" className="font-medium text-gray-500 dark:text-gray-400 font-mono pl-2">
                            5°59'22.0"N 116°04'33.8"E
                        </Typography>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex items-center gap-8 mt-auto pt-8">
                <div className="flex flex-col gap-1">
                    <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-wider">Humidity</Typography>
                    <div className="flex items-center gap-2">
                        <FuseSvgIcon size={20} className="text-blue-500">heroicons-outline:water</FuseSvgIcon>
                        <Typography variant="body1" className="text-gray-700 dark:text-gray-200 font-bold">
                            {humidity}%
                        </Typography>
                    </div>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
                <div className="flex flex-col gap-1">
                    <Typography variant="caption" className="text-gray-400 font-bold uppercase tracking-wider">Wind</Typography>
                    <div className="flex items-center gap-2">
                        <FuseSvgIcon size={20} className="text-gray-500">heroicons-outline:paper-airplane</FuseSvgIcon>
                        <Typography variant="body1" className="text-gray-700 dark:text-gray-200 font-bold">
                            {windSpeed} <span className="text-sm font-medium opacity-70">km/h</span>
                        </Typography>
                    </div>
                </div>
            </div>

            {/* Weather Timeline / Daily Summary */}
            {warnings.length > 0 && (
                <div className="relative z-10 mt-6 flex flex-col gap-2">
                    <Typography variant="caption" className="font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5">
                        <FuseSvgIcon size={14} className="text-red-500">heroicons-outline:bell-alert</FuseSvgIcon>
                        Active Warnings — Sabah Region
                    </Typography>
                    {warnings.map((w, idx) => {
                        const style = getWarningStyle(w.severity);
                        const isExpanded = expandedWarning === idx;
                        return (
                            <div key={idx} className={`border rounded-2xl overflow-hidden ${style.bg} transition-all duration-300`}>
                                <button
                                    onClick={() => setExpandedWarning(isExpanded ? null : idx)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left group"
                                >
                                    <FuseSvgIcon size={18} className={`shrink-0 ${style.iconColor}`}>{style.icon}</FuseSvgIcon>
                                    <span className={`flex-1 text-sm font-bold truncate ${style.textColor}`}>{w.heading}</span>
                                    <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full shrink-0 ${style.label} uppercase tracking-wide`}>{w.severity}</span>
                                    <FuseSvgIcon size={16} className={`shrink-0 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>heroicons-outline:chevron-down</FuseSvgIcon>
                                </button>
                                <Collapse in={isExpanded}>
                                    <div className="px-4 pb-4 flex flex-col gap-1.5">
                                        <Typography variant="caption" className={`leading-relaxed ${style.textColor}`}>
                                            {w.description}
                                        </Typography>
                                        {w.validFrom && (
                                            <Typography variant="caption" className="text-gray-400 font-mono mt-1">
                                                Valid: {new Date(w.validFrom).toLocaleString()} → {w.validTo ? new Date(w.validTo).toLocaleString() : 'Ongoing'}
                                            </Typography>
                                        )}
                                    </div>
                                </Collapse>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Weather Timeline / Daily Summary */}
            {forecast && (
                <div className="relative z-10 mt-8 pt-6 border-t border-gray-300/40 dark:border-gray-600/40 flex flex-col min-h-0">
                    <Tabs
                        value={tabIndex}
                        onChange={(e, val) => setTabIndex(val)}
                        textColor="primary"
                        indicatorColor="primary"
                        variant="fullWidth"
                        className="min-h-0 mb-6 bg-white/30 dark:bg-black/20 rounded-xl p-1 shadow-inner backdrop-blur-sm"
                        sx={{
                            minHeight: 44,
                            '& .MuiTabs-indicator': { height: '100%', borderRadius: 3, zIndex: 0, opacity: 0.15 },
                            '& .MuiTab-root': {
                                minHeight: 40, py: 0, fontWeight: 700, fontSize: '0.8rem', zIndex: 1, textTransform: 'none', borderRadius: 2,
                                '&.Mui-selected': { color: 'primary.main' }
                            }
                        }}
                    >
                        <Tab label="Today" />
                        <Tab label="Tomorrow" />
                        <Tab label="Next 5 Days" />
                    </Tabs>

                    <div className="flex-1 overflow-y-auto pr-1 pb-2">
                        {/* TODAY TIMELINE */}
                        {tabIndex === 0 && forecast.today.length > 0 && (
                            <div className="flex justify-between gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                                {forecast.today.map((item, idx) => {
                                    const itemConfig = getWeatherConfig(item.condition);
                                    return (
                                        <div key={idx} className="flex flex-col items-center min-w-[70px] bg-white/40 dark:bg-black/20 p-3 rounded-2xl shadow-sm border border-white/50 dark:border-white/5 backdrop-blur-sm transition-transform hover:-translate-y-1">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 font-bold mb-2 shrink-0">
                                                {item.time}
                                            </Typography>
                                            <FuseSvgIcon size={28} className={`${itemConfig.color} mb-2 shrink-0`}>
                                                {itemConfig.icon}
                                            </FuseSvgIcon>
                                            <Typography variant="body1" className="font-extrabold text-gray-800 dark:text-gray-200 shrink-0">
                                                {item.temperature}°
                                            </Typography>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* TOMORROW TIMELINE */}
                        {tabIndex === 1 && forecast.tomorrow.length > 0 && (
                            <div className="flex justify-between gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                                {forecast.tomorrow.map((item, idx) => {
                                    const itemConfig = getWeatherConfig(item.condition);
                                    return (
                                        <div key={idx} className="flex flex-col items-center min-w-[70px] bg-white/40 dark:bg-black/20 p-3 rounded-2xl shadow-sm border border-white/50 dark:border-white/5 backdrop-blur-sm transition-transform hover:-translate-y-1">
                                            <Typography variant="caption" className="text-gray-500 dark:text-gray-400 font-bold mb-2 shrink-0">
                                                {item.time}
                                            </Typography>
                                            <FuseSvgIcon size={28} className={`${itemConfig.color} mb-2 shrink-0`}>
                                                {itemConfig.icon}
                                            </FuseSvgIcon>
                                            <Typography variant="body1" className="font-extrabold text-gray-800 dark:text-gray-200 shrink-0">
                                                {item.temperature}°
                                            </Typography>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* NEXT 5 DAYS */}
                        {tabIndex === 2 && forecast.next5Days.length > 0 && (
                            <div className="flex flex-col gap-3 px-2">
                                {forecast.next5Days.map((day, idx) => {
                                    const itemConfig = getWeatherConfig(day.condition);
                                    return (
                                        <div key={idx} className="flex items-center justify-between bg-white/40 dark:bg-black/20 p-3 rounded-xl shadow-sm border border-white/50 dark:border-white/5 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-black/40 transition-colors">
                                            <Typography variant="body2" className="font-bold text-gray-700 dark:text-gray-300 w-28">
                                                {day.date}
                                            </Typography>
                                            <div className="flex items-center gap-3">
                                                <FuseSvgIcon size={24} className={`${itemConfig.color}`}>
                                                    {itemConfig.icon}
                                                </FuseSvgIcon>
                                                <Typography variant="caption" className="text-gray-600 dark:text-gray-400 font-medium w-20 text-left">
                                                    {day.condition}
                                                </Typography>
                                            </div>
                                            <div className="flex items-center gap-4 w-24 justify-end">
                                                <Typography variant="body1" className="font-black text-gray-800 dark:text-gray-100">
                                                    {day.maxTemp}°
                                                </Typography>
                                                <Typography variant="body2" className="font-bold text-gray-400 dark:text-gray-500">
                                                    {day.minTemp}°
                                                </Typography>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Paper>
    );
}

export default WeatherWidget;
