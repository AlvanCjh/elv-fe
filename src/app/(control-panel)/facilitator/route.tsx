import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const FacilitatorDashboard = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'facilitator',
    element: <FacilitatorDashboard />,
    auth: authRoles.facilitator
};

export default route;
