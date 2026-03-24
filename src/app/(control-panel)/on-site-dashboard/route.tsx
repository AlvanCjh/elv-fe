import { lazy } from 'react';

const OnSiteDashboardApp = lazy(() => import('./OnSiteDashboardApp'));

const onSiteDashboardAppRoutes = [
    {
        path: 'on-site-dashboard',
        element: <OnSiteDashboardApp />
    }
];

export default onSiteDashboardAppRoutes;
