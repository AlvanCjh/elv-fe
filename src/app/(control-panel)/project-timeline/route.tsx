import { lazy } from 'react';

const ProjectTimelineApp = lazy(() => import('./ProjectTimelineApp'));

const projectTimelineRoutes = [
    {
        path: 'project-timeline',
        children: [
            {
                path: '',
                element: <ProjectTimelineApp />
            },
            {
                path: ':taskId',
                element: <ProjectTimelineApp />
            }
        ]
    }
];

export default projectTimelineRoutes;
