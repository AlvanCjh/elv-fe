import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const PendingHistoryApp = lazy(() => import('./PendingHistoryApp'));

const route: FuseRouteItemType = {
    path: 'pending-history',
    element: <PendingHistoryApp />
};

export default route;
