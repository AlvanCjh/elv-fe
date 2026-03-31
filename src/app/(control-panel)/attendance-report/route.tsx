import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const AttendanceReport = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'attendance-report',
    element: <AttendanceReport />,
    auth: authRoles.facilitator
};

export default route;
