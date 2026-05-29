import React, { createContext, useContext, useState, useEffect } from 'react';
import { setGlobalHeaders, removeGlobalHeaders } from '../utils/api';

export interface Project {
    id: number;
    name: string;
    description: string | null;
    start_date?: string;
    end_date?: string;
    actual_start_date?: string;
    actual_end_date?: string;
    edit_reason?: string;
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
export type SystemMode = 'elv' | 'ict' | 'business' | 'inventory';

interface ProjectContextType {
    activeProjectId: number | null;
    activeProject: Project | null;
    viewMode: ViewMode;
    activeSystem: SystemMode;
    setActiveProject: (project: Project | null) => void;
    setActiveProjectId: (id: number | null) => void;
    setViewMode: (mode: ViewMode) => void;
    setActiveSystem: (system: SystemMode) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeProjectId, setActiveProjectIdState] = useState<number | null>(null);
    const [activeProject, setActiveProjectState] = useState<Project | null>(null);
    const [viewMode, setViewModeState] = useState<ViewMode>('construction');
    const [activeSystem, setActiveSystemState] = useState<SystemMode>('elv');

    // Synchronize activeSystem with URL
    useEffect(() => {
        const pathname = window.location.pathname;
        if (pathname.includes('/ict')) {
            setActiveSystemState('ict');
        } else if (pathname.includes('/business')) {
            setActiveSystemState('business');
        } else if (pathname.includes('/documentation') || pathname === '/assets' || pathname.startsWith('/assets/')) {
            // Only set to 'inventory' if it's the standalone system
            setActiveSystemState('inventory');
        } else if (pathname === '/inventory' || (pathname.startsWith('/inventory') && !pathname.includes('material') && !pathname.includes('tool'))) {
            // Only set to 'inventory' if it's the standalone system, not ELV inventory
            setActiveSystemState('inventory');
        } else if (pathname.includes('/elv') || pathname.includes('building') || pathname.includes('scheduling') || pathname.includes('on-site')) {
            setActiveSystemState('elv');
        }
        // Note: We don't default to 'elv' here to avoid flickering if the system is already set via localStorage
    }, []);

    // Initialize from localStorage on mount
    useEffect(() => {
        const storedId = localStorage.getItem('activeProjectId');
        const storedProject = localStorage.getItem('activeProject');
        const storedMode = localStorage.getItem('navbarViewMode') as ViewMode;
        const storedSystem = localStorage.getItem('activeSystem') as SystemMode;
        
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

        if (['elv', 'ict', 'business', 'inventory'].includes(storedSystem)) {
            setActiveSystemState(storedSystem);
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

    const setActiveSystem = (system: SystemMode) => {
        setActiveSystemState(system);
        localStorage.setItem('activeSystem', system);
    };

    return (
        <ProjectContext.Provider value={{ 
            activeProjectId, 
            activeProject, 
            viewMode, 
            activeSystem,
            setActiveProject, 
            setActiveProjectId,
            setViewMode,
            setActiveSystem
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
