import { lazy } from 'react';

const SchedulingApp = lazy(() => import('./SchedulingApp'));

const schedulingRoutes = [
    {
        path: 'scheduling',
        element: <SchedulingApp />
    }
];

export default schedulingRoutes;
