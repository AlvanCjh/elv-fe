import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';

const DailyChecklist = lazy(() => import('./page'));

const route: FuseRouteItemType = {
    path: 'daily-checklist',
    element: <DailyChecklist />,
    auth: authRoles.facilitator
};

export default route;
