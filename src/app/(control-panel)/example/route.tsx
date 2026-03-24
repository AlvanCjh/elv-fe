import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import { Navigate } from 'react-router';

const ExampleView = lazy(() => import('./components/views/ExampleView').then(module => ({ default: module.default })));

/**
 * The Example page route.
 */
const route: FuseRouteItemType = {
	path: 'inventory',
	children: [
		{
			path: 'material',
			element: <ExampleView type="material" />
		},
		{
			path: 'tool',
			element: <ExampleView type="tool" />
		},
		{
			path: '',
			element: <Navigate to="material" />
		}
	]
};

export default route;
