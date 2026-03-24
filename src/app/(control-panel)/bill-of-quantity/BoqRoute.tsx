import { lazy } from 'react';

const BoqApp = lazy(() => import('./BoqApp'));

const BoqRoute = {
    settings: {
        layout: {
            config: {}
        }
    },
    path: '/bill-of-quantity',
    element: <BoqApp />
};

export default BoqRoute;
