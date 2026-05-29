import React, { useState, useEffect, useCallback, useMemo } from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Badge from "@mui/material/Badge";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProject } from "@/context/ProjectContext";
import { useNavigate } from "react-router";
import api from "@/utils/api";
import DomainIcon from "@mui/icons-material/Domain";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DialogContentText from "@mui/material/DialogContentText";
import useUser from "@auth/useUser";
import { motion, AnimatePresence } from "motion/react";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Workaround for Leaflet's default icon path issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom SVG Icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px;">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="${color}" stroke="white" stroke-width="1.5"/>
          <circle cx="12" cy="9" r="3" fill="white"/>
        </svg>
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${color}; opacity: 0.3; filter: blur(8px); border-radius: 50%; z-index: -1;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const projectIcon = createCustomIcon('#22c55e'); // Green
const newProjectIcon = createCustomIcon('#f97316'); // Orange

// Helper component to capture map clicks
interface LocationMarkerProps {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: { lat: number; lng: number }) => void;
  onOpenForm: () => void;
}
function LocationMarker({ position, setPosition, onOpenForm }: LocationMarkerProps) {
  useMapEvents({
    click(e: any) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={newProjectIcon}>
      <Popup className="map-popup">
        <Box className="p-2 flex flex-col gap-2 min-w-[200px]">
          <Typography className="font-bold text-white">New Project Here?</Typography>
          <Typography variant="caption" className="text-slate-400 font-mono">
            {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
          </Typography>
          <Button 
            variant="contained" 
            size="small" 
            fullWidth 
            onClick={onOpenForm}
            sx={{ 
              background: 'linear-gradient(to right, #f97316, #ea580c)',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Create Project
          </Button>
        </Box>
      </Popup>
    </Marker>
  );
}

interface ProjectMarkerProps {
  project: Project;
  onSelect: (id: number) => void;
}
function ProjectMarker({ project, onSelect }: ProjectMarkerProps) {
  const building = project.buildings?.[0]; // Default to first building for pin
  if (!building?.latitude || !building?.longitude) return null;

  const position: [number, number] = [parseFloat(building.latitude), parseFloat(building.longitude)];

  return (
    <Marker position={position} icon={projectIcon}>
      <Popup className="project-popup">
        <Box className="p-2 flex flex-col gap-1 min-w-[150px]">
          <Typography className="font-black text-white uppercase tracking-tighter text-lg">{project.name}</Typography>
          <Typography variant="caption" className="text-slate-400 line-clamp-2 mb-2">{project.description || 'Secure Workspace'}</Typography>
          <Button 
            variant="contained" 
            size="small" 
            fullWidth 
            onClick={() => onSelect(project.id)}
            sx={{ 
              background: 'linear-gradient(to right, #22c55e, #16a34a)',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Enter Workspace
          </Button>
        </Box>
      </Popup>
    </Marker>
  );
}

// Map Controls Helper
function ZoomControls() {
  const map = useMapEvents({});
  return (
    <div className="absolute bottom-10 right-10 z-[1000] flex flex-col gap-2 pointer-events-auto">
      <Paper className="bg-slate-900/80 backdrop-blur-md border border-white/10 overflow-hidden rounded-xl shadow-2xl">
        <IconButton 
          className="text-white hover:bg-white/10 p-3 rounded-none border-b border-white/5"
          onClick={() => map.zoomIn()}
        >
          <AddIcon />
        </IconButton>
        <IconButton 
          className="text-white hover:bg-white/10 p-3 rounded-none"
          onClick={() => map.zoomOut()}
        >
          <div className="w-6 h-[2.5px] bg-white opacity-80 rounded-full"></div>
        </IconButton>
      </Paper>
    </div>
  );
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  type: 'ssdc' | 'construction';
  buildings?: {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
    total_floor: number;
  }[];
}

const fetchProjects = async (): Promise<Project[]> => {
  return await api.get("projects").json();
};

interface BuildingPayload {
  name: string;
  total_floor: number;
  latitude: string;
  longitude: string;
}

const createProject = async (data: { name: string; description?: string; type?: string; building?: BuildingPayload }) => {
  return await api.post("projects", { json: data }).json();
};

const updateProject = async (data: { id: number; name: string; description?: string }) => {
  return await api.put(`projects/${data.id}`, { json: { name: data.name, description: data.description } }).json();
};

const deleteProject = async (id: number) => {
  return await api.delete(`projects/${id}`).json();
};

export default function SelectProjectPage() {
  const { setActiveProjectId, setActiveProject } = useProject();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectType, setNewProjectType] = useState<'construction' | 'ssdc'>('construction');
  const [newBuildingName, setNewBuildingName] = useState("");
  const [newBuildingFloors, setNewBuildingFloors] = useState<number>(1);
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const projectsWithLocation = useMemo(() => {
    return projects?.filter(p => p.buildings?.some(b => b.latitude && b.longitude)) || [];
  }, [projects]);

  const projectsWithoutLocation = useMemo(() => {
    return projects?.filter(p => !p.buildings?.some(b => b.latitude && b.longitude)) || [];
  }, [projects]);

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      setNewProjectType('construction');
      setNewBuildingName("");
      setNewBuildingFloors(1);
      setPinLocation(null);
    },
  });

  // Edit/Delete state remains the same but will be triggered differently
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<number | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDesc, setEditProjectDesc] = useState("");

  const updateMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsEditOpen(false);
    },
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const [deleteProjectName, setDeleteProjectName] = useState("");

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsDeleteOpen(false);
    },
  });

  // Check if user has supervisor/admin level access
  const isSupervisor = Array.isArray(user?.role)
    ? user?.role.some(r => ['supervisor', 'superadmin', 'admin'].includes(r?.toString()?.toLowerCase()))
    : ['supervisor', 'superadmin', 'admin'].includes(user?.role?.toString()?.toLowerCase());

  const isELV = Array.isArray(user?.role)
    ? user?.role.some(r => ['elv'].includes(r?.toString()?.toLowerCase()))
    : ['elv'].includes(user?.role?.toString()?.toLowerCase());

  const isFacilitator = Array.isArray(user?.role)
    ? user?.role.some(r => ['facilitator'].includes(r?.toString()?.toLowerCase()))
    : ['facilitator'].includes(user?.role?.toString()?.toLowerCase());

  const isMember = Array.isArray(user?.role)
    ? user?.role.some(r => ['member'].includes(r?.toString()?.toLowerCase()))
    : ['member'].includes(user?.role?.toString()?.toLowerCase());

  // Only supervisors and ELV roles can toggle — facilitators are locked to SSDC, members locked to construction
  const showViewModeToggle = isSupervisor || isELV;

  const { viewMode, setViewMode } = useProject();

  // Lock view mode based on role (run once on mount / when role resolves)
  useEffect(() => {
    if (isFacilitator && !isSupervisor && !isELV) {
      setViewMode('ssdc');
    } else if (isMember && !isSupervisor && !isFacilitator && !isELV) {
      setViewMode('construction');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFacilitator, isMember, isSupervisor, isELV]);

  const handleSetViewMode = (mode: any) => {
      setViewMode(mode);
  };

  // Filter projects by role:  
  //  • ELV/Supervisor → see all projects (toggle to switch view)
  //  • Facilitator (not elv/supervisor) → ssdc projects only
  //  • Member (not elv/supervisor/facilitator) → construction projects only
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (isSupervisor || isELV) {
      // Supervisors/ELV see projects filtered by their chosen viewMode
      return projects.filter(p => p.type === viewMode);
    }
    if (isFacilitator) return projects.filter(p => p.type === 'ssdc');
    if (isMember) return projects.filter(p => p.type === 'construction');
    return projects;
  }, [projects, isSupervisor, isELV, isFacilitator, isMember, viewMode]);

  const handleEnterWorkspace = (id: number) => {
    const project = projects?.find(p => p.id === id);
    if (project) {
        setActiveProject(project);
    } else {
        setActiveProjectId(id);
    }
    
    // Navigate based on view mode selection
    if (viewMode === 'ssdc') {
      navigate("/facilitator");
    } else {
      navigate("/on-site-dashboard");
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    let buildingPayload = undefined;
    // Always create a building if a pin is set, falling back to project name if building name is empty
    if (pinLocation) {
      buildingPayload = {
        name: newBuildingName.trim() || `${newProjectName.trim()} Main Building`,
        total_floor: newBuildingFloors,
        latitude: pinLocation.lat.toString(),
        longitude: pinLocation.lng.toString(),
      };
    }

    createMutation.mutate({
      name: newProjectName,
      description: newProjectDesc,
      type: newProjectType,
      building: buildingPayload,
    });
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#0f172a]"
      >
        <CircularProgress color="primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0f172a] text-white overflow-hidden relative font-['Inter']">
      {/* Top Header Layer */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-6 pointer-events-none">
        <div className="flex justify-between items-start max-w-[1400px] mx-auto">
          <div className="pointer-events-auto bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-2xl">
            <Typography variant="h4" className="font-black tracking-tighter uppercase mb-4">
              Select Workspace
            </Typography>

            {/* View Mode Toggle — Supervisors only */}
            {showViewModeToggle && (
                <div className="mb-4">
                  <ToggleButtonGroup
                    color="primary"
                    value={viewMode}
                    exclusive
                    onChange={(e, mode) => mode !== null && handleSetViewMode(mode)}
                    aria-label="View Mode"
                    size="small"
                    sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '4px',
                      '.MuiToggleButton-root': {
                        border: 'none',
                        color: '#94a3b8',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        padding: '6px 16px',
                        borderRadius: '6px !important',
                        lineHeight: 1.2,
                        '&.Mui-selected': {
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                          pointerEvents: 'none'
                        }
                      }
                    }}
                  >
                    <ToggleButton value="construction">Construction</ToggleButton>
                    <ToggleButton value="ssdc">SSDC Operations</ToggleButton>
                  </ToggleButtonGroup>
                </div>
            )}

            {/* Role-locked badge for non-supervisor users */}
            {!showViewModeToggle && (
              <div className="mb-4">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${
                  isFacilitator
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    isFacilitator ? 'bg-amber-400' : 'bg-blue-400'
                  }`} />
                  {isFacilitator ? 'SSDC Operations View' : 'Construction View'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-widest">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              </Typography>
              <div className="w-1 h-1 rounded-full bg-slate-600"></div>
              <Typography variant="caption" className="text-blue-400 font-bold uppercase tracking-widest">
                tap a pin to resume
              </Typography>
              {isSupervisor && <>
                <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                <Typography variant="caption" className="text-orange-400 font-bold uppercase tracking-widest">
                  tap map to create new
                </Typography>
              </>}
            </div>
          </div>

          <div className="pointer-events-auto flex flex-col gap-2">
            <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                <Typography className="text-[10px] font-black uppercase tracking-widest text-white">Project Pin</Typography>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                <Typography className="text-[10px] font-black uppercase tracking-widest text-white">New Selection</Typography>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={[5.9804, 116.0735]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className="dark-map"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {/* Existing Project Pins — filtered by role */}
          {filteredProjects.filter(p => p.buildings?.some(b => b.latitude && b.longitude)).map(project => (
            <ProjectMarker 
              key={project.id} 
              project={project} 
              onSelect={handleEnterWorkspace} 
            />
          ))}

          {/* New Project Pin — Supervisor only */}
          {isSupervisor && <LocationMarker 
            position={pinLocation} 
            setPosition={setPinLocation} 
            onOpenForm={() => setIsCreateOpen(true)}
          />}

          <ZoomControls />
        </MapContainer>
      </div>

      {/* Right Sidebar - No Location Set */}
      <div className="absolute top-24 right-6 bottom-32 w-80 z-[1000] flex flex-col pointer-events-none">
        <div className="pointer-events-auto flex flex-col h-full">
          <Paper className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <Typography variant="button" className="text-[11px] font-black tracking-[0.2em] text-blue-400">
                No Location Set
              </Typography>
              <Badge badgeContent={projectsWithoutLocation.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }} />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {filteredProjects.filter(p => !p.buildings?.some(b => b.latitude && b.longitude)).map(project => (
                <div 
                  key={project.id}
                  onClick={() => handleEnterWorkspace(project.id)}
                  className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-blue-600/20 hover:border-blue-500/30 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full group-hover:animate-pulse ${
                        project.type === 'ssdc' ? 'bg-amber-400' : 'bg-blue-500'
                      }`}></div>
                      <Typography className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">
                        {project.name}
                      </Typography>
                      {project.type === 'ssdc' && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">SSDC</span>
                      )}
                    </div>
                    <ChevronRightIcon className="text-slate-600 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" fontSize="small" />
                  </div>
                </div>
              ))}

              {filteredProjects.filter(p => !p.buildings?.some(b => b.latitude && b.longitude)).length === 0 && (
                <div className="text-center py-12">
                  <Typography variant="caption" className="text-slate-500 italic">
                    All projects have map locations
                  </Typography>
                </div>
              )}
            </div>

            {isSupervisor && (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => setIsCreateOpen(true)}
                className="mt-6 border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20 capitalize font-bold rounded-xl py-3"
              >
                Manual Create
              </Button>
            )}

          </Paper>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { 
          background: #0f172a !important; 
        }
        .dark-map .leaflet-tile-pane {
          filter: grayscale(1) invert(1) opacity(0.5);
        }
        .map-popup .leaflet-popup-content-wrapper,
        .project-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.9) !important;
          backdrop-filter: blur(8px);
          color: white !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0;
        }
        .map-popup .leaflet-popup-content,
        .project-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        .map-popup .leaflet-popup-tip,
        .project-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}} />

      {/* Create Project Dialog */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#1e293b',
            color: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <DialogTitle className="font-bold border-b border-slate-700/50">Create New Project Workspace</DialogTitle>
        <DialogContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {/* Left Column: Project Details */}
            <div className="flex flex-col gap-5">
              <Typography variant="subtitle1" fontWeight="bold">Project Details</Typography>
              <TextField
                label="Project Name *"
                fullWidth
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
                }}
              />
              <TextField
                label="Project Description (Optional)"
                fullWidth
                multiline
                rows={3}
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  },
                  '& .MuiInputLabel-root': { color: '#94a3b8' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
                }}
              />

              {/* Project Type Selector */}
              <div>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', mb: 1 }}>
                  Project Type *
                </Typography>
                <div className="grid grid-cols-2 gap-3">
                  {([['construction', 'Construction Site', 'For on-site teams & members'], ['ssdc', 'SSDC Operations', 'For facilitators & supervisors']] as const).map(([val, label, desc]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNewProjectType(val)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        newProjectType === val
                          ? val === 'ssdc'
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <Typography variant="caption" className={`font-black block uppercase tracking-wider ${
                        newProjectType === val ? (val === 'ssdc' ? 'text-amber-300' : 'text-blue-300') : 'text-slate-300'
                      }`}>{label}</Typography>
                      <Typography variant="caption" className="text-slate-500 text-[10px]">{desc}</Typography>
                      {newProjectType === val && (
                        <span className={`mt-1 inline-block w-2 h-2 rounded-full ${
                          val === 'ssdc' ? 'bg-amber-400' : 'bg-blue-400'
                        }`} />
                      )}
                    </button>
                  ))}
                </div>
                <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mt: 1, fontSize: '0.7rem' }}>
                  ⚠ Project type cannot be changed after creation.
                </Typography>
              </div>

              <div className="h-[1px] bg-slate-700/50 my-2"></div>

              <Typography variant="subtitle1" fontWeight="bold">Initial Building (Optional)</Typography>
              <Typography variant="body2" color="#94a3b8" sx={{ mb: 1 }}>
                Drop a pin on the map to bind a physical building to this project.
              </Typography>
              <div className="flex gap-4">
                <TextField
                  label="Building Name"
                  fullWidth
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
                  }}
                />
                <TextField
                  label="Floors"
                  type="number"
                  value={newBuildingFloors}
                  onChange={(e) => setNewBuildingFloors(parseInt(e.target.value) || 1)}
                  InputProps={{ inputProps: { min: 1 } }}
                  sx={{
                    width: '120px',
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                    },
                    '& .MuiInputLabel-root': { color: '#94a3b8' },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
                  }}
                />
              </div>
            </div>

            {/* Right Column: Map */}
            <div className="flex flex-col h-[400px] border border-slate-600 rounded-xl overflow-hidden relative">
              <MapContainer
                center={[5.9804, 116.0735]} // Defaulting to an approximate Kota Kinabalu, Sabah coordinate
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker 
                  position={pinLocation} 
                  setPosition={setPinLocation} 
                  onOpenForm={() => setIsCreateOpen(true)}
                />
              </MapContainer>

              {!pinLocation && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] pointer-events-none bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700 shadow-xl backdrop-blur-sm">
                  <Typography variant="body2" className="text-white font-medium">Click on map to place pin</Typography>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-6 pt-2 border-t border-slate-700/50">
          <Button onClick={() => setIsCreateOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!newProjectName.trim() || createMutation.isPending}
            sx={{
              borderRadius: '8px',
              background: 'linear-gradient(to right, #3b82f6, #6366f1)',
              '&:disabled': {
                background: '#475569',
                color: '#94a3b8'
              }
            }}
          >
            {createMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#1e293b',
            color: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <DialogTitle className="font-bold border-b border-slate-700/50">Edit Project</DialogTitle>
        <DialogContent className="pt-6">
          <div className="flex flex-col gap-5 mt-4">
            <TextField
              label="Project Name"
              fullWidth
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              autoFocus
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
              }}
            />
            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              value={editProjectDesc}
              onChange={(e) => setEditProjectDesc(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                },
                '& .MuiInputLabel-root': { color: '#94a3b8' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
              }}
            />
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-6 pt-2 border-t border-slate-700/50">
          <Button onClick={() => setIsEditOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (editProjectId && editProjectName.trim()) {
                updateMutation.mutate({
                  id: editProjectId,
                  name: editProjectName,
                  description: editProjectDesc,
                });
              }
            }}
            variant="contained"
            disabled={!editProjectName.trim() || updateMutation.isPending}
            sx={{
              borderRadius: '8px',
              background: 'linear-gradient(to right, #3b82f6, #6366f1)',
              '&:disabled': {
                background: '#475569',
                color: '#94a3b8'
              }
            }}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: '#1e293b',
            color: 'white',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }
        }}
      >
        <DialogTitle className="font-bold border-b border-slate-700/50 text-red-400">
          Delete Project
        </DialogTitle>
        <DialogContent className="pt-6">
          <DialogContentText sx={{ color: '#cbd5e1', mt: 2 }}>
            Are you sure you want to delete the project <strong>"{deleteProjectName}"</strong>?
          </DialogContentText>
          <DialogContentText sx={{ color: '#ef4444', mt: 2, fontWeight: 'bold' }}>
            WARNING: This action is permanent and will delete all associated buildings, floor plans, inventory, and objects within this project.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="px-6 pb-6 pt-2 border-t border-slate-700/50">
          <Button onClick={() => setIsDeleteOpen(false)} sx={{ color: '#94a3b8' }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (deleteProjectId) {
                deleteMutation.mutate(deleteProjectId);
              }
            }}
            variant="contained"
            disabled={deleteMutation.isPending}
            sx={{
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              '&:hover': { backgroundColor: '#dc2626' },
              '&:disabled': {
                backgroundColor: '#7f1d1d',
                color: '#fca5a5'
              }
            }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
