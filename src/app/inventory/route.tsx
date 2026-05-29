import { lazy } from 'react';
import { FuseRouteItemType } from '@fuse/utils/FuseUtils';

const InventoryAssetsPage     = lazy(() => import('./assets/page'));
const InventoryAssignPage     = lazy(() => import('./assign/page'));
const InventoryStockInPage    = lazy(() => import('./stock-in/page'));
const InventoryMyItemsPage    = lazy(() => import('./my-items/page'));
const InventoryInspectionsPage = lazy(() => import('./inspections/page'));

const allRoles = ['supervisor', 'member', 'facilitator', 'elv', 'ict', 'business'];

const routes: FuseRouteItemType[] = [
    {
        path: 'inventory/assets',
        element: <InventoryAssetsPage />,
        auth: allRoles
    },
    {
        path: 'inventory/assign',
        element: <InventoryAssignPage />,
        auth: allRoles
    },
    {
        path: 'inventory/stock-in',
        element: <InventoryStockInPage />,
        auth: allRoles
    },
    {
        path: 'inventory/my-items',
        element: <InventoryMyItemsPage />,
        auth: allRoles
    },
    {
        path: 'inventory/inspections',
        element: <InventoryInspectionsPage />,
        auth: allRoles
    },
];

export default routes;
