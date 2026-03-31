import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const ServiceReport = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'service-report',
    element: <ServiceReport />,
    auth: authRoles.facilitator
};

export default route;
