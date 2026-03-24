import { useState, useEffect } from 'react';

export type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';

export interface WeatherData {
    condition: WeatherCondition;
    temperature: number;
    humidity: number;
    windSpeed: number;
}

export interface ForecastData {
    time: string;
    condition: WeatherCondition;
    temperature: number;
    dateObj?: Date;
}

export interface DailyForecast {
    date: string;
    condition: WeatherCondition;
    maxTemp: number;
    minTemp: number;
}

export interface CategorizedForecast {
    today: ForecastData[];
    tomorrow: ForecastData[];
    next5Days: DailyForecast[];
}

export type WarningSeverity = 'advisory' | 'warning' | 'severe';

export interface WeatherWarning {
    title: string;
    heading: string;
    description: string;
    severity: WarningSeverity;
    validFrom: string | null;
    validTo: string | null;
}

const API_URL = 'https://api.data.gov.my/weather/forecast/';
const WARNING_URL = 'https://api.data.gov.my/weather/warning/';

// Keywords used to determine if a warning is relevant to Sabah / Kota Kinabalu
const SABAH_KEYWORDS = ['sabah', 'kota kinabalu', 'kk', 'eastern sabah', 'sabah timur'];

const mapMalayCondition = (forecast: string): WeatherCondition => {
    const lLower = forecast.toLowerCase();
    if (lLower.includes('tiada hujan') || lLower.includes('cerah')) return 'Sunny';
    if (lLower.includes('hujan')) return 'Rainy';
    if (lLower.includes('ribut petir')) return 'Stormy';
    if (lLower.includes('mendung') || lLower.includes('berawan')) return 'Cloudy';
    // Fallback based on typical Malaysian weather
    return 'Cloudy';
};

export function useWeather() {
    const [data, setData] = useState<WeatherData | null>(null);
    const [forecast, setForecast] = useState<CategorizedForecast | null>(null);
    const [warnings, setWarnings] = useState<WeatherWarning[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchWeather = async () => {
            try {
                const [response, warningResponse] = await Promise.all([
                    fetch(API_URL),
                    fetch(WARNING_URL)
                ]);
                if (!response.ok) {
                    throw new Error('Failed to fetch weather data from data.gov.my');
                }

                const jsonArray = await response.json();

                // Process warnings — filter for those relevant to Sabah / Kota Kinabalu or national advisories
                if (warningResponse.ok && isMounted) {
                    const warningJson: any[] = await warningResponse.json();
                    const relevantWarnings: WeatherWarning[] = warningJson
                        .filter((w: any) => {
                            const text = (w.text_en || w.text_bm || '').toLowerCase();
                            const heading = (w.heading_en || w.heading_bm || '').toLowerCase();
                            const isSabahRelevant = SABAH_KEYWORDS.some(kw => text.includes(kw) || heading.includes(kw));
                            const isNationalAdvisory = w.valid_from === null; // cyclone advisories are national
                            return isSabahRelevant || isNationalAdvisory;
                        })
                        .filter((w: any) => {
                            // Skip "No Advisory" type entries (not a real warning)
                            const title = (w.warning_issue?.title_en || '').toLowerCase();
                            return !title.includes('no advisory') && !title.includes('tiada nasihat');
                        })
                        .map((w: any): WeatherWarning => {
                            const title = w.warning_issue?.title_en || w.heading_en || '';
                            const heading = w.heading_en || w.heading_bm || '';
                            const titleLower = title.toLowerCase();
                            let severity: WarningSeverity = 'advisory';
                            if (titleLower.includes('second category') || titleLower.includes('thunderstorm') || titleLower.includes('heavy rain')) {
                                severity = 'severe';
                            } else if (titleLower.includes('first category') || titleLower.includes('strong wind') || titleLower.includes('warning')) {
                                severity = 'warning';
                            }
                            return {
                                title,
                                heading,
                                description: w.text_en || w.text_bm || '',
                                severity,
                                validFrom: w.valid_from,
                                validTo: w.valid_to,
                            };
                        });
                    setWarnings(relevantWarnings);
                }

                // Filter the global array strictly for "Kota Kinabalu"
                const kotaKinabaluForecasts = jsonArray.filter((item: any) =>
                    item.location?.location_name === "Kota Kinabalu"
                );

                if (kotaKinabaluForecasts.length === 0) {
                    throw new Error('Location not found in weather payload');
                }

                if (isMounted) {
                    // Sort descending by date to find "today" and the future
                    kotaKinabaluForecasts.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

                    const now = new Date();
                    // We need to find the element that matches today's date String like 'YYYY-MM-DD'
                    const todayStr = now.toISOString().split('T')[0];
                    let todayData = kotaKinabaluForecasts.find((f: any) => f.date === todayStr);

                    // Fallback to the very first block if 'today' is literally missing on the server edge cases
                    if (!todayData) todayData = kotaKinabaluForecasts[0];

                    // Determine current string block based on time of day (Morning/Afternoon/Night)
                    const hour = now.getHours();
                    let currentConditionStr = todayData.summary_forecast; // Defult to overall daily
                    if (hour < 12) {
                        currentConditionStr = todayData.morning_forecast;
                    } else if (hour < 18) {
                        currentConditionStr = todayData.afternoon_forecast;
                    } else {
                        currentConditionStr = todayData.night_forecast;
                    }

                    // data.gov.my doesn't strictly provide current minute-by-minute temps or wind speed
                    // We interpolate "current" temp by averaging min and max, adding a slight curve if it's afternoon
                    let currentTemp = Math.round((todayData.min_temp + todayData.max_temp) / 2);
                    if (hour >= 12 && hour <= 16) currentTemp = todayData.max_temp;

                    setData({
                        condition: mapMalayCondition(currentConditionStr),
                        temperature: currentTemp,
                        humidity: 75, // Static sensible mockup for Sabah if unavailable in API
                        windSpeed: 12, // Static mockup
                    });

                    // Build the Timeline / Daily structures mapping
                    const tomorrow = new Date(now);
                    tomorrow.setDate(now.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().split('T')[0];
                    const tomorrowData = kotaKinabaluForecasts.find((f: any) => f.date === tomorrowStr) || todayData;

                    // Generate smooth hourly timeline by interpolating temperature with a sine curve
                    // Temperature peaks at ~14:00 and is lowest at ~06:00
                    const compileHourlyTimeline = (dayData: any, dayDate: Date): ForecastData[] => {
                        const minT = dayData.min_temp as number;
                        const maxT = dayData.max_temp as number;
                        const results: ForecastData[] = [];
                        for (let h = 0; h < 24; h++) {
                            // Smooth temperature curve peaking at 14:00, cooling at ~06:00
                            // temp(h) = avg + amp * cos((h - 14) * π / 12)
                            const avg = (minT + maxT) / 2;
                            const amp = (maxT - minT) / 2;
                            const tempAtHour = Math.round(avg + amp * Math.cos(((h - 14) * Math.PI) / 12));

                            let condition: WeatherCondition;
                            if (h >= 6 && h < 12) {
                                condition = mapMalayCondition(dayData.morning_forecast);
                            } else if (h >= 12 && h < 19) {
                                condition = mapMalayCondition(dayData.afternoon_forecast);
                            } else {
                                condition = mapMalayCondition(dayData.night_forecast);
                            }

                            results.push({
                                time: `${String(h).padStart(2, '0')}:00`,
                                condition,
                                temperature: tempAtHour,
                                dateObj: dayDate
                            });
                        }
                        return results;
                    };

                    // For today, only show from current hour onwards
                    const todayTimeline = compileHourlyTimeline(todayData, now).filter(t => parseInt(t.time.split(':')[0]) >= hour);
                    const tomorrowTimeline = compileHourlyTimeline(tomorrowData, tomorrow);

                    // 3. Next 5 Days Summary
                    const next5Days: DailyForecast[] = kotaKinabaluForecasts.slice(1, 6).map((day: any) => {
                        const d = new Date(day.date);
                        const formattedDate = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                        return {
                            date: formattedDate,
                            condition: mapMalayCondition(day.summary_forecast),
                            minTemp: day.min_temp,
                            maxTemp: day.max_temp
                        };
                    });

                    setForecast({
                        today: todayTimeline,
                        tomorrow: tomorrowTimeline,
                        next5Days: next5Days
                    });

                    setLoading(false);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Unknown error'));
                    setLoading(false);
                }
            }
        };

        fetchWeather();

        // Refresh every hour
        const intervalId = setInterval(fetchWeather, 60 * 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return { data, forecast, warnings, loading, error };
}


