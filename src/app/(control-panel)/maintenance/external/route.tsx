import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const ExternalMaintenance = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'maintenance/external',
    element: <ExternalMaintenance />,
    auth: authRoles.facilitator
};

export default route;
