import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const ListingObjectApp = lazy(() => import('./ListingObjectApp'));

const route: FuseRouteItemType = {
    path: 'listing-object',
    element: <ListingObjectApp />
};

export default route;
