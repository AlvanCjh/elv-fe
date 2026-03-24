import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const BuildingProgressApp = lazy(() => import('./BuildingProgressApp'));

const route: FuseRouteItemType = {
    path: 'building-progress',
    element: <BuildingProgressApp />
};

export default route;
