import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const DrawingRevisionsApp = lazy(() => import('./DrawingRevisionsApp'));

const route: FuseRouteItemType = {
    path: 'drawing-revisions',
    element: <DrawingRevisionsApp />
};

export default route;
