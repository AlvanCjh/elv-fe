import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const InternalMaintenance = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'maintenance/internal',
    element: <InternalMaintenance />,
    auth: authRoles.facilitator
};

export default route;
