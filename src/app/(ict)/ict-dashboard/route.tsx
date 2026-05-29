import { lazy } from 'react';

const IctDashboardApp = lazy(() => import('./IctDashboardApp'));
const CreateBackupPage = lazy(() => import('./create/page'));
const MasterformConfigPage = lazy(() => import('../form-config/page'));
const IctUsersPage = lazy(() => import('../users/page'));

const ictDashboardRoutes = [
    {
        path: 'ict-dashboard',
        element: <IctDashboardApp />,
        auth: ['supervisor', 'ict']
    },
    {
        path: 'ict-dashboard/create',
        element: <CreateBackupPage />,
        auth: ['supervisor', 'ict']
    },
    {
        path: 'ict-dashboard/config',
        element: <MasterformConfigPage />,
        auth: ['supervisor', 'ict']
    },
    {
        // ICT user management — sits under ict-dashboard so nav stays in ICT mode
        path: 'ict-dashboard/users',
        element: <IctUsersPage />,
        auth: ['supervisor']
    },
    {
        // ELV user management — MUST NOT include 'ict-dashboard' in path
        // so the Navigation component keeps showing ELV nav items
        path: 'management/elv-users',
        element: <IctUsersPage />,
        auth: ['supervisor']
    }
];

export default ictDashboardRoutes;

