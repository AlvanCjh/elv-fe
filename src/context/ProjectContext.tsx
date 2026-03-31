import React, { createContext, useContext, useState, useEffect } from 'react';
import { setGlobalHeaders, removeGlobalHeaders } from '../utils/api';

export interface Project {
    id: number;
    name: string;
    description: string | null;
    location?: string;
    latitude?: number;
    longitude?: number;
    buildings?: {
        id: number;
        name: string;
        latitude: string;
        longitude: string;
        total_floor: number;
    }[];
}

export type ViewMode = 'construction' | 'ssdc';

interface ProjectContextType {
    activeProjectId: number | null;
    activeProject: Project | null;
    viewMode: ViewMode;
    setActiveProject: (project: Project | null) => void;
    setActiveProjectId: (id: number | null) => void;
    setViewMode: (mode: ViewMode) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeProjectId, setActiveProjectIdState] = useState<number | null>(null);
    const [activeProject, setActiveProjectState] = useState<Project | null>(null);
    const [viewMode, setViewModeState] = useState<ViewMode>('construction');

    // Initialize from localStorage on mount
    useEffect(() => {
        const storedId = localStorage.getItem('activeProjectId');
        const storedProject = localStorage.getItem('activeProject');
        const storedMode = localStorage.getItem('navbarViewMode') as ViewMode;
        
        if (storedId) {
            const id = parseInt(storedId, 10);
            setActiveProjectIdState(id);
            setGlobalHeaders({ 'X-Project-Id': id.toString() });
        }

        if (storedProject) {
            try {
                setActiveProjectState(JSON.parse(storedProject));
            } catch (e) {
                console.error("Failed to parse stored project", e);
            }
        }

        if (storedMode === 'construction' || storedMode === 'ssdc') {
            setViewModeState(storedMode);
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
            // If ID is null, also clear project
            setActiveProjectState(null);
            localStorage.removeItem('activeProject');
        }
    };

    const setActiveProject = (project: Project | null) => {
        setActiveProjectState(project);
        if (project) {
            localStorage.setItem('activeProject', JSON.stringify(project));
            setActiveProjectId(project.id);
        } else {
            localStorage.removeItem('activeProject');
            setActiveProjectId(null);
        }
    };

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode);
        localStorage.setItem('navbarViewMode', mode);
    };

    return (
        <ProjectContext.Provider value={{ 
            activeProjectId, 
            activeProject, 
            viewMode, 
            setActiveProject, 
            setActiveProjectId,
            setViewMode
        }}>
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
