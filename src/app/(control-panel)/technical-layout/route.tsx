import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const TechnicalLayout = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'technical-layout',
    element: <TechnicalLayout />,
    auth: authRoles.facilitator
};

export default route;
