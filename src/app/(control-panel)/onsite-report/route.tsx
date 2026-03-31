import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const OnsiteReportDashboard = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'onsite-report',
    element: <OnsiteReportDashboard />
};

export default route;
