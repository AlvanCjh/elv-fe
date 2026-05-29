import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const PduChecklist = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'pdu-checklist',
    element: <PduChecklist />,
    auth: authRoles.facilitator
};

export default route;
