import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const IncidenceReport = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'incidence-report',
    element: <IncidenceReport />,
    auth: authRoles.facilitator
};

export default route;
