import { lazy } from 'react';

const UsersPage = lazy(() => import('./UsersPage'));

const usersRoutes = [
    {
        path: 'management/users',
        element: <UsersPage />,
        auth: ['supervisor']
    }
];

export default usersRoutes;
