import { lazy } from 'react';

const ProfilePage = lazy(() => import('./ProfilePage'));

const profileRoutes = [
    {
        path: 'profile',
        element: <ProfilePage />
    }
];

export default profileRoutes;
