import React, { createContext, useContext, useState, useEffect } from 'react';
import { setGlobalHeaders, removeGlobalHeaders } from '../utils/api';

interface ProjectContextType {
    activeProjectId: number | null;
    setActiveProjectId: (id: number | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeProjectId, setActiveProjectIdState] = useState<number | null>(null);

    // Initialize from localStorage on mount
    useEffect(() => {
        const storedId = localStorage.getItem('activeProjectId');
        if (storedId) {
            const id = parseInt(storedId, 10);
            setActiveProjectIdState(id);
            setGlobalHeaders({ 'X-Project-Id': id.toString() });
        }
    }, []);

    const setActiveProjectId = (id: number | null) => {
        setActiveProjectIdState(id);
        if (id !== null) {
            localStorage.setItem('activeProjectId', id.toString());
            setGlobalHeaders({ 'X-Project-Id': id.toString() });
        } else {
            localStorage.removeItem('activeProjectId');
            removeGlobalHeaders(['X-Project-Id']);
        }
    };

    return (
        <ProjectContext.Provider value={{ activeProjectId, setActiveProjectId }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
