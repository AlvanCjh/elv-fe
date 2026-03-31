import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const InspectionReport = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'inspection-report',
    element: <InspectionReport />,
    auth: authRoles.facilitator
};

export default route;
