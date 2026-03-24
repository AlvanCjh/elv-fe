import { lazy } from 'react';

const WiringTopologyApp = lazy(() => import('./WiringTopologyApp'));

const wiringTopologyRoutes = [
    {
        path: 'wiring-topology',
        element: <WiringTopologyApp />
    }
];

export default wiringTopologyRoutes;
