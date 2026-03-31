import { FuseRouteItemType } from '@fuse/utils/FuseUtils';
import authRoles from '@auth/authRoles';
import RoleSelectPageView from './components/views/RoleSelectPageView';
import MemberSignInPageView from './components/views/MemberSignInPageView';
import SupervisorSignInPageView from './components/views/SupervisorSignInPageView';
import FacilitatorSignInPageView from './components/views/FacilitatorSignInPageView';
import SignUpPageView from './components/views/SignUpPageView';
import SignOutPageView from './components/views/SignOutPageView';

const noLayoutConfig = {
    layout: {
        config: {
            navbar: { display: false },
            toolbar: { display: false },
            footer: { display: false },
            leftSidePanel: { display: false },
            rightSidePanel: { display: false }
        }
    }
};

const route: FuseRouteItemType = {
    children: [
        // Role selection landing page
        {
            path: 'sign-in',
            element: <RoleSelectPageView />,
            settings: noLayoutConfig,
            auth: authRoles.onlyGuest
        },
        // Member login
        {
            path: 'sign-in/member',
            element: <MemberSignInPageView />,
            settings: noLayoutConfig,
            auth: authRoles.onlyGuest
        },
        // Supervisor login
        {
            path: 'sign-in/supervisor',
            element: <SupervisorSignInPageView />,
            settings: noLayoutConfig,
            auth: authRoles.onlyGuest
        },
        // Facilitator login
        {
            path: 'sign-in/facilitator',
            element: <FacilitatorSignInPageView />,
            settings: noLayoutConfig,
            auth: authRoles.onlyGuest
        },
        {
            path: 'sign-up',
            element: <SignUpPageView />,
            settings: noLayoutConfig,
            auth: authRoles.onlyGuest
        },
        {
            path: 'sign-out',
            element: <SignOutPageView />,
            settings: noLayoutConfig,
            auth: null
        }
    ]
};

export default route;
