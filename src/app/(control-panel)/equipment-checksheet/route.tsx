import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const EquipmentChecksheet = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'equipment-checksheet',
    element: <EquipmentChecksheet />,
    auth: authRoles.facilitator
};

export default route;
