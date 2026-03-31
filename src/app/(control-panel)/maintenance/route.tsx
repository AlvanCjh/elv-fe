import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';
import { Navigate } from 'react-router';

const ExternalMaint = lazy(() => import('./external/page'));
const InternalMaint = lazy(() => import('./internal/page'));

const route: FuseRouteItemType = {
    path: 'maintenance',
    auth: authRoles.facilitator,
    children: [
        {
            path: 'external',
            element: <ExternalMaint />
        },
        {
            path: 'internal',
            element: <InternalMaint />
        },
        {
            path: '',
            element: <Navigate to="external" />
        }
    ]
};

export default route;
