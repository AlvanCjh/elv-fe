import SelectWorkspacePage from './page';

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
 * The select workspace route.
 */
const selectWorkspaceRoute = {
    path: 'select-workspace',
    element: <SelectWorkspacePage />,
    settings: noLayoutConfig
};

export default selectWorkspaceRoute;
