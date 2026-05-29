import DocumentationPage from './page';
// Force TS server to re-evaluate module
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

const documentationReferenceRoute = {
    path: 'documentation',
    element: <DocumentationPage />,
};

export default documentationReferenceRoute;
