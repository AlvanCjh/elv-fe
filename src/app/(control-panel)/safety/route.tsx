import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const SafetyDashboard = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'safety',
    element: <SafetyDashboard />
};

export default route;
