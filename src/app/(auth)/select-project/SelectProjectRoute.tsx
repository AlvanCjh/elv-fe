import SelectProjectPage from './page';

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

/**
 * The select project route.
 */
const selectProjectRoute = {
    path: 'select-project',
    element: <SelectProjectPage />,
    settings: noLayoutConfig
};

export default selectProjectRoute;
