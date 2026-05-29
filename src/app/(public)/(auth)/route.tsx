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
        // Unified login page
        {
            path: 'sign-in',
            element: <MemberSignInPageView />, // We will repurpose this as the unified login or create a new one
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
