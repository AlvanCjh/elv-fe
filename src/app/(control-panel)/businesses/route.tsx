import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const TendersPage             = lazy(() => import('./TendersPage'));
const MasterListPage          = lazy(() => import('./MasterListPage'));
const TenderCostingPage       = lazy(() => import('./TenderCostingPage'));
const ProjectMasterListPage   = lazy(() => import('./ProjectMasterListPage'));
const TenderDashboardPage     = lazy(() => import('./TenderDashboardPage'));
const LicenseTrackingPage     = lazy(() => import('./LicenseTrackingPage'));
const SetupConfigPage         = lazy(() => import('./SetupConfigPage'));
const QuotationPage           = lazy(() => import('./QuotationPage'));
const QuotationListPage       = lazy(() => import('./QuotationListPage'));
const IctUsersPage            = lazy(() => import('../../(ict)/users/page'));

const routes: FuseRouteItemType[] = [
    {
        path: 'businesses',
        element: <TenderDashboardPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin']
    },
    {
        path: 'businesses/dashboard',
        element: <TenderDashboardPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin']
    },
    {
        path: 'businesses/tenders',
        element: <TendersPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin']
    },
    {
        path: 'businesses/master-list',
        element: <MasterListPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin']
    },
    {
        path: 'businesses/project-master-list',
        element: <ProjectMasterListPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin']
    },
    {
        path: 'businesses/tenders/:id/costing',
        element: <TenderCostingPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin']
    },
    {
        path: 'businesses/license-tracking',
        element: <LicenseTrackingPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin']
    },
    {
        path: 'businesses/users',
        element: <IctUsersPage />,
        auth: ['supervisor']
    },
    {
        path: 'businesses/setup-config',
        element: <SetupConfigPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin']
    },
    {
        path: 'businesses/quotations',
        element: <QuotationListPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin']
    },
    {
        path: 'businesses/tenders/:id/quotation',
        element: <QuotationPage />,
        auth: ['businesses', 'superadmin', 'admin', 'supervisor', 'business_admin', 'business_higher_admin']
    }
];

export default routes;
