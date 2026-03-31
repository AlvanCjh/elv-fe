import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const SsdcPasswords = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'ssdc-passwords',
    element: <SsdcPasswords />,
    auth: authRoles.facilitator
};

export default route;
