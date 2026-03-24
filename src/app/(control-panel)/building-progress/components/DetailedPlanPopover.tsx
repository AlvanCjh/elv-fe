import React, { useState, useEffect } from "react";
import { useProject } from '../../../../context/ProjectContext';
import {
  Popover,
  Box,
  Typography,
  Chip,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import VideocamIcon from "@mui/icons-material/Videocam";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { addObjectPort, establishObjectPortLink } from "../buildingApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DetailedPlanPopoverProps {
  anchorPosition: { top: number; left: number } | null;
  onClose: () => void;
  selectedObjectData: any;
  isEditing: boolean;
  editFormData: any;
  setEditFormData: (data: any) => void;
  onSaveEdit: () => void;
  isSaving: boolean;
  onCancelEdit: () => void;
  isSupervisor: boolean;
  onEditClick: () => void;
  onMoveClick?: () => void;
  onDeleteClick: () => void;
  allObjects?: any[];
  allObjectsForLinking?: any[]; // All objects across all zones for cross-zone target selection
  onObjectSelect?: (object: any) => void;
  onNavigateToObject?: (object: any) => void; // Navigate to the object's zone and open its popover
}

export const DetailedPlanPopover: React.FC<DetailedPlanPopoverProps> = ({
  anchorPosition,
  onClose,
  selectedObjectData,
  isEditing,
  editFormData,
  setEditFormData,
  onSaveEdit,
  isSaving,
  onCancelEdit,
  isSupervisor,
  onEditClick,
  onMoveClick,
  onDeleteClick,
  allObjects = [],
  allObjectsForLinking = [],
  onObjectSelect,
  onNavigateToObject,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [showAddPort, setShowAddPort] = useState(false);
  const [newPortName, setNewPortName] = useState("");
  const [establishingLinkPortId, setEstablishingLinkPortId] = useState<
    number | null
  >(null);
  const [newPortCable, setNewPortCable] = useState("");
  const [selectedRiserId, setSelectedRiserId] = useState<number | "">("");
  const [newRiserPortName, setNewRiserPortName] = useState("");
  const [portSearchQuery, setPortSearchQuery] = useState("");
  const queryClient = useQueryClient();
    const { activeProjectId } = useProject();

  const addPortMutation = useMutation({
    mutationFn: (data: { port_name: string }) =>
      addObjectPort(selectedObjectData?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objects", selectedObjectData?.zone_id, "all", activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ["boq-summary"] });
      setShowAddPort(false);
      setNewPortName("");
    },
    onError: (error: any) => {
      console.error("Error adding port:", error);
      if (error.response) {
        error.response
          .json()
          .then((errData: any) =>
            console.error("Backend validation errors:", errData),
          );
      }
    },
  });

  const establishLinkMutation = useMutation({
    mutationFn: (data: {
      portId: number;
      cable_id: string;
      connected_to_object_id: number;
      connected_port_name: string;
    }) =>
      establishObjectPortLink(selectedObjectData?.id, data.portId, {
        cable_id: data.cable_id,
        connected_to_object_id: data.connected_to_object_id,
        connected_port_name: data.connected_port_name,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objects", selectedObjectData?.zone_id, "all", activeProjectId] });
      queryClient.invalidateQueries({ queryKey: ["boq-summary"] });
      setEstablishingLinkPortId(null);
      setNewPortCable("");
      setSelectedRiserId("");
      setNewRiserPortName("");
    },
    onError: (error: any) => {
      console.error("Error establishing link:", error);
      if (error.response) {
        error.response
          .json()
          .then((errData: any) => {
            console.error("Backend validation errors:", errData);
            alert(
              "Linking failed: " +
                JSON.stringify(errData.errors || errData.message),
            );
          })
          .catch(() => {});
      } else {
        alert("Linking failed: " + error.message);
      }
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Reset state when opening a new object
  useEffect(() => {
    if (selectedObjectData) {
      setTabIndex(0);
      setShowAddPort(false);
      setNewPortName("");
      setEstablishingLinkPortId(null);
      setNewPortCable("");
      setSelectedRiserId("");
      setNewRiserPortName("");
    }
  }, [selectedObjectData]);

  // For the Target Object dropdown, use the full cross-zone pool so users can
  // select Risers or objects on other zones/floors
  const availableTargetObjects = (
    allObjectsForLinking.length > 0 ? allObjectsForLinking : allObjects
  ).filter((o: any) => {
    return o.id !== selectedObjectData?.id; // Prevent linking to itself
  });

  const selectedTargetObject = (
    allObjectsForLinking.length > 0 ? allObjectsForLinking : allObjects
  ).find((o: any) => o.id === selectedRiserId);
  const availableTargetPorts = selectedTargetObject?.ports || [];

  const handleSavePort = () => {
    if (!newPortName.trim()) return;
    addPortMutation.mutate({
      port_name: newPortName,
    });
  };

  const handleEstablishLink = (portId: number) => {
    console.log("--- Establishing Link ---");
    console.log("Port ID:", portId);
    console.log("Cable ID:", newPortCable);
    console.log("Selected Target Object ID:", selectedRiserId);
    console.log("New Target Port Name:", newRiserPortName);

    if (!newPortCable.trim() || !selectedRiserId || !newRiserPortName.trim()) {
      console.error("Validation Failed: Missing required fields for linking");
      return;
    }

    console.log("Validation passed, muting payload...");
    establishLinkMutation.mutate({
      portId,
      cable_id: newPortCable,
      connected_to_object_id: Number(selectedRiserId),
      connected_port_name: newRiserPortName,
    });
  };

  return (
    <Popover
      open={Boolean(anchorPosition)}
      anchorReference="anchorPosition"
      anchorPosition={
        anchorPosition
          ? { top: anchorPosition.top, left: anchorPosition.left }
          : undefined
      }
      onClose={onClose}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      PaperProps={{
        className:
          "rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden",
      }}
      sx={{ zIndex: 1400 }}
    >
      {selectedObjectData && (
        <Box className="p-5 min-w-[280px] bg-white dark:bg-gray-800">
          <div className="flex justify-between items-start mb-3 border-b dark:border-gray-700 pb-3">
            <Typography
              variant="h6"
              className="font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight"
            >
              {selectedObjectData.item_alias_id ||
                `PLAN ${selectedObjectData.annotation_type?.toUpperCase() || ""}`}
            </Typography>
            {selectedObjectData.latest_status &&
              (() => {
                const status = selectedObjectData.latest_status.current_status;
                let statusColorClass =
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
                if (status === "Completed")
                  statusColorClass =
                    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
                else if (status === "Pending")
                  statusColorClass =
                    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
                else if (status === "Fix2")
                  statusColorClass =
                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";

                return (
                  <Chip
                    size="small"
                    label={status}
                    className={`${statusColorClass} font-bold ml-4`}
                  />
                );
              })()}
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-3 mt-4">
              <TextField
                size="small"
                label="Item Alias ID"
                value={editFormData.item_alias_id}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    item_alias_id: e.target.value,
                  })
                }
                required
              />
              <TextField
                size="small"
                label="Cabling Type"
                value={editFormData.cabling_type}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    cabling_type: e.target.value,
                  })
                }
              />
              <TextField
                size="small"
                label="Gridline Coords"
                value={editFormData.gridline_coords}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    gridline_coords: e.target.value,
                  })
                }
              />
              <Box sx={{ mt: 1, px: 1 }}>
                <Typography
                  variant="caption"
                  className="dark:text-gray-400"
                  color="textSecondary"
                >
                  Rotation ({editFormData.rotation}°)
                </Typography>
                <Slider
                  size="small"
                  value={editFormData.rotation}
                  onChange={(_, newValue) =>
                    setEditFormData({
                      ...editFormData,
                      rotation: newValue as number,
                    })
                  }
                  min={0}
                  max={359}
                  step={15}
                />
              </Box>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  label="Status"
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value })
                  }
                >
                  <MenuItem value="Fix1">Fix1 (Point Installation)</MenuItem>
                  <MenuItem value="Fix2">Fix2 (Equipment)</MenuItem>
                  <MenuItem value="Pending">Pending (Environment)</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Remarks / Reason"
                multiline
                rows={2}
                value={editFormData.remarks}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, remarks: e.target.value })
                }
              />
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  fullWidth
                  color={
                    editFormData.status === "Pending" &&
                    !editFormData.status_image
                      ? "error"
                      : "primary"
                  }
                >
                  {editFormData.status_image
                    ? editFormData.status_image.name
                    : "Upload New Image"}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status_image: e.target.files ? e.target.files[0] : null,
                      })
                    }
                  />
                </Button>
                {editFormData.status === "Pending" &&
                  !editFormData.status_image && (
                    <Typography
                      color="error"
                      variant="caption"
                      className="mt-1 block"
                    >
                      Image is required when status is changed to Pending.
                    </Typography>
                  )}
              </Box>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onSaveEdit}
                  disabled={
                    isSaving ||
                    (editFormData.status === "Pending" &&
                      !editFormData.status_image)
                  }
                  fullWidth
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={onCancelEdit}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-4 mt-1 relative w-full h-10 shadow-inner">
                {/* Sliding Background Indicator */}
                <div
                  className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white dark:bg-gray-700 rounded-md shadow transition-transform duration-300 ease-out"
                  style={{
                    transform:
                      tabIndex === 0 ? "translateX(0)" : "translateX(100%)",
                  }}
                />

                <button
                  className={`flex-1 relative z-10 text-xs font-bold rounded-md transition-colors duration-300 ${tabIndex === 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                  onClick={() => handleTabChange(null as any, 0)}
                >
                  Object Details
                </button>
                <button
                  className={`flex-1 relative z-10 text-xs font-bold rounded-md transition-colors duration-300 ${tabIndex === 1 ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                  onClick={() => handleTabChange(null as any, 1)}
                >
                  Port Status
                </button>
              </div>

              {tabIndex === 0 && (
                <div className="animate-fade-in pb-2">
                  {selectedObjectData.item_name && (
                    <div className="mb-2 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
                        Item Name
                      </span>
                      <span className="text-gray-800 dark:text-gray-200 text-sm font-medium">
                        {selectedObjectData.item_name}
                      </span>
                    </div>
                  )}

                  {selectedObjectData.cabling_type && (
                    <div className="mb-2 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
                        Cabling Details
                      </span>
                      <span className="text-gray-800 dark:text-gray-200 text-sm font-medium break-words">
                        {selectedObjectData.cabling_type}
                      </span>
                    </div>
                  )}

                  {selectedObjectData.gridline_coords && (
                    <div className="mb-2 flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
                        Gridline Pos
                      </span>
                      <span className="text-gray-800 dark:text-gray-200 text-sm font-medium bg-gray-50 dark:bg-gray-700 py-1 px-2 rounded mt-0.5 inline-block w-fit">
                        {selectedObjectData.gridline_coords}
                      </span>
                    </div>
                  )}

                  {selectedObjectData.system_type && (
                    <div className="mb-2 flex flex-col mt-4">
                      <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
                        System Segment
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {selectedObjectData.system_type.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {selectedObjectData.latest_status?.image_url && (
                    <div className="mb-2 mt-4 flex flex-col items-center">
                      <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1 w-full">
                        Status Image
                      </span>
                      <img
                        src={selectedObjectData.latest_status.image_url}
                        alt="Status"
                        className="w-full max-h-48 object-cover rounded border border-gray-200 dark:border-gray-700 shadow-sm"
                      />
                    </div>
                  )}

                  {selectedObjectData.latest_status?.remarks && (
                    <div className="mb-2 flex flex-col mt-4">
                      <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">
                        Remarks
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm whitespace-pre-wrap">
                        {selectedObjectData.latest_status.remarks}
                      </span>
                    </div>
                  )}

                  {selectedObjectData.system_type && (
                    <div className="mt-4 flex flex-col gap-2 w-full">
                      {isSupervisor ? (
                        <>
                          <div className="flex gap-2">
                            <Button
                              variant="outlined"
                              size="small"
                              fullWidth
                              onClick={onEditClick}
                              className="dark:text-gray-100 dark:border-gray-600"
                            >
                              Edit Details
                            </Button>
                            {onMoveClick && (
                             <Button
                               variant="outlined"
                               color="secondary"
                               size="small"
                               fullWidth
                               onClick={onMoveClick}
                               className="dark:text-gray-100 dark:border-gray-600"
                             >
                               Move
                             </Button>
                            )}
                          </div>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            fullWidth
                            onClick={onDeleteClick}
                          >
                            Delete Object
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700 w-full justify-center">
                          <LockIcon
                            sx={{ fontSize: 13 }}
                            className="text-amber-500"
                          />
                          <Typography
                            variant="caption"
                            className="text-amber-600 dark:text-amber-400"
                          >
                            View only — contact supervisor to edit
                          </Typography>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tabIndex === 1 && (
                <div className="animate-fade-in flex flex-col gap-3 py-2 pb-2">
                  <TextField
                    size="small"
                    placeholder="Search port number..."
                    value={portSearchQuery}
                    onChange={(e) => setPortSearchQuery(e.target.value)}
                    fullWidth
                    className="mb-1"
                    InputProps={{
                      sx: {
                        fontSize: "0.75rem",
                        backgroundColor: "rgba(0,0,0,0.02)",
                        borderRadius: "8px",
                      },
                    }}
                  />
                  <Box
                    sx={{
                      maxHeight: "450px",
                      overflowY: "auto",
                      pr: 0.5,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                    className="custom-scrollbar"
                  >
                    {selectedObjectData.ports &&
                    selectedObjectData.ports.length > 0 ? (
                      selectedObjectData.ports
                        .filter((p: any) =>
                          p.port_name
                            .toLowerCase()
                            .includes(portSearchQuery.toLowerCase()),
                        )
                        .map((port: any) => (
                          <div
                            key={port.id}
                            className="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                          >
                        <div className="flex items-start gap-3 w-full">
                          <div
                            className={`p-2 rounded-lg mt-0.5 ${port.port_name.includes("CCTV") ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" : "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"}`}
                          >
                            {port.port_name.includes("CCTV") ? (
                              <VideocamIcon fontSize="small" />
                            ) : (
                              <SettingsInputComponentIcon fontSize="small" />
                            )}
                          </div>
                          <div className="flex flex-col flex-1">
                            <div className="flex justify-between items-center w-full">
                              <Typography
                                variant="caption"
                                className="text-gray-400 font-bold uppercase tracking-wider"
                              >
                                {port.port_name}
                              </Typography>
                              <Typography
                                variant="caption"
                                className={`${port.cable_id ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-500"} flex items-center gap-1 font-medium`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${port.cable_id ? "bg-green-500" : "bg-amber-500"}`}
                                ></span>{" "}
                                {port.cable_id
                                  ? port.status || "Online"
                                  : "No Link"}
                              </Typography>
                            </div>
                            {port.cable_id ? (
                              <Typography
                                component="div"
                                variant="body2"
                                className="text-gray-800 dark:text-gray-200 mt-1 font-mono text-xs flex items-center flex-wrap gap-1"
                              >
                                <span>{port.cable_id}</span>
                                <span className="text-gray-400">connected</span>
                                {port.connected_to_object && (
                                  <div className="flex items-center justify-between w-full mt-1">
                                    <span className="text-gray-700 dark:text-gray-300 bg-gray-200/50 dark:bg-gray-700/50 px-2 py-0.5 rounded text-[11px] font-semibold border border-gray-200 dark:border-gray-600">
                                      →{" "}
                                      {port.connected_to_object.item_alias_id ||
                                        port.connected_to_object.item_name}{" "}
                                      {port.connected_port_name
                                        ? `(${port.connected_port_name})`
                                        : ""}
                                    </span>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      className="ml-auto dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700"
                                      onClick={() => {
                                        if (port.connected_to_object) {
                                          // Look up the full object with zone data from the cross-zone pool
                                          const fullTargetObject =
                                            (allObjectsForLinking.length > 0
                                              ? allObjectsForLinking
                                              : allObjects
                                            ).find(
                                              (o: any) =>
                                                o.id ===
                                                port.connected_to_object.id,
                                            ) || port.connected_to_object;

                                          if (onNavigateToObject) {
                                            // Navigate to the correct zone and open the popover there
                                            onNavigateToObject(
                                              fullTargetObject,
                                            );
                                          } else if (onObjectSelect) {
                                            onObjectSelect(fullTargetObject);
                                          }
                                        }
                                      }}
                                    >
                                      View Object
                                    </Button>
                                  </div>
                                )}
                              </Typography>
                            ) : (
                              <Button
                                variant="text"
                                size="small"
                                className="mt-1 justify-start p-0 text-xs text-blue-600 dark:text-blue-400 font-semibold"
                                onClick={() => {
                                  setEstablishingLinkPortId(port.id);
                                  setNewPortCable("");
                                  setSelectedRiserId("");
                                  setNewRiserPortName("");
                                }}
                              >
                                Establish Link
                              </Button>
                            )}
                          </div>
                        </div>

                        {establishingLinkPortId === port.id && (
                          <div className="mt-2 p-3 border border-dashed border-primary-main/50 rounded-lg bg-white dark:bg-gray-800 flex flex-col gap-3 animate-fade-in w-full">
                            <Typography
                              variant="caption"
                              className="font-bold text-primary-main"
                            >
                              ESTABLISH LINK
                            </Typography>
                            <TextField
                              size="small"
                              label="Cable ID"
                              value={newPortCable}
                              onChange={(e) => setNewPortCable(e.target.value)}
                              placeholder="e.g. CAT5-L5-1"
                              fullWidth
                            />
                            <FormControl size="small" fullWidth>
                              <InputLabel id="target-object-label">
                                Target Object
                              </InputLabel>
                              <Select
                                labelId="target-object-label"
                                value={selectedRiserId}
                                label="Target Object"
                                onChange={(e) => {
                                  setSelectedRiserId(
                                    e.target.value as number | "",
                                  );
                                  setNewRiserPortName(""); // Reset target port selection
                                }}
                              >
                                <MenuItem value="">
                                  <em>None</em>
                                </MenuItem>
                                {availableTargetObjects.map((o: any) => {
                                  const isCurrentZone = allObjects.some(
                                    (ao: any) => ao.id === o.id,
                                  );
                                  const zoneName =
                                    o.zone?.name || o.zone_name || null;
                                  const label =
                                    o.item_alias_id ||
                                    o.item_name ||
                                    `Object #${o.id}`;
                                  const coords = o.gridline_coords
                                    ? `(${o.gridline_coords})`
                                    : "";
                                  const zoneTag =
                                    !isCurrentZone && zoneName
                                      ? ` — ${zoneName}`
                                      : "";
                                  return (
                                    <MenuItem key={o.id} value={o.id}>
                                      <span>
                                        {label} {coords}
                                        {!isCurrentZone && (
                                          <span
                                            style={{
                                              fontSize: "0.75rem",
                                              color: "#8b5cf6",
                                              marginLeft: 4,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {zoneTag || " — Other Zone"}
                                          </span>
                                        )}
                                      </span>
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>

                            {selectedRiserId && (
                              <FormControl size="small" fullWidth>
                                <InputLabel id="target-port-label">
                                  Target Port Name
                                </InputLabel>
                                <Select
                                  labelId="target-port-label"
                                  value={newRiserPortName}
                                  label="Target Port Name"
                                  onChange={(e) =>
                                    setNewRiserPortName(
                                      e.target.value as string,
                                    )
                                  }
                                >
                                  <MenuItem value="">
                                    <em>None</em>
                                  </MenuItem>
                                  {availableTargetPorts.length > 0 ? (
                                    availableTargetPorts.map((p: any) => (
                                      <MenuItem
                                        key={p.id}
                                        value={p.port_name}
                                        disabled={!!p.cable_id} // Disable if already linked
                                      >
                                        {p.port_name}{" "}
                                        {p.cable_id ? "(In Use)" : ""}
                                      </MenuItem>
                                    ))
                                  ) : (
                                    <MenuItem value="" disabled>
                                      <em>No ports available on target</em>
                                    </MenuItem>
                                  )}
                                </Select>
                              </FormControl>
                            )}

                            <div className="flex gap-2">
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                fullWidth
                                onClick={() => handleEstablishLink(port.id)}
                                disabled={
                                  !newPortCable.trim() ||
                                  !selectedRiserId ||
                                  !newRiserPortName.trim() ||
                                  establishLinkMutation.isPending
                                }
                                startIcon={
                                  establishLinkMutation.isPending ? (
                                    <CircularProgress
                                      size={14}
                                      color="inherit"
                                    />
                                  ) : (
                                    <SettingsInputComponentIcon fontSize="small" />
                                  )
                                }
                              >
                                Link
                              </Button>
                              <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                fullWidth
                                onClick={() => setEstablishingLinkPortId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                    ) : (
                      <Typography
                        variant="body2"
                        className="text-gray-500 italic text-center py-4"
                      >
                        {portSearchQuery
                          ? "No ports matching search."
                          : "No ports configured yet."}
                      </Typography>
                    )}
                  </Box>

                  {showAddPort ? (
                    <div className="mt-2 p-3 border border-dashed border-primary-main/50 rounded-lg bg-primary-main/5 flex flex-col gap-3 animate-fade-in">
                      <Typography
                        variant="caption"
                        className="font-bold text-primary-main"
                      >
                        NEW PORT
                      </Typography>
                      <TextField
                        size="small"
                        label="Object Port Name"
                        value={newPortName}
                        onChange={(e) => setNewPortName(e.target.value)}
                        placeholder="e.g. CCTV-PORT-1"
                        fullWidth
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          fullWidth
                          onClick={handleSavePort}
                          disabled={
                            !newPortName.trim() || addPortMutation.isPending
                          }
                          startIcon={
                            addPortMutation.isPending ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <AddIcon fontSize="small" />
                            )
                          }
                        >
                          Create
                        </Button>
                        <Button
                          variant="outlined"
                          color="inherit"
                          size="small"
                          fullWidth
                          onClick={() => {
                            setShowAddPort(false);
                            setNewPortName("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outlined"
                      className="mt-2 border-dashed dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                      startIcon={<AddIcon />}
                      fullWidth
                      onClick={() => setShowAddPort(true)}
                      disabled={!isSupervisor}
                    >
                      Add Port
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </Box>
      )}
    </Popover>
  );
};
