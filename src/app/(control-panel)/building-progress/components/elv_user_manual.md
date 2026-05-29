# ELV (Extra Low Voltage) Management System - User Manual

This manual provides a step-by-step guide on how to use the ELV platform for managing inventories, floor plan annotations, and Bill of Quantities (BOQ) status tracking.

---

## 1. Inventory & Stock Management
The Inventory module allows you to track all materials, equipment, and tools assigned to your project.

### Searching and Sorting
1. Navigate to the **Inventory** tab in the Control Panel.
2. Use the **Search Bar** at the top to find items by name, brand, or location.
3. Click on the **Table Headers** (Name, Brand, Stock, or Location) to sort the list.

### Stock In (Delivery / Add Inventory)
Use this module when a new shipment of materials or tools arrives.
1. Go to the **Stock In** view.
2. Select the item from the **Autocomplete** search field (it will show current stock and brand).
3. Enter the **Quantity** received.
4. Select the **Delivery Date**.
5. Add **Remarks** (e.g., PO Number or Supplier name).
6. Click **Confirm Stock In**.

### Stock Out (Usage / Take Inventory)
Use this module when a technician takes materials or tools for site works.
1. Go to the **Stock Out** view.
2. Select the item. The system will display the **Available Stock** in the helper text.
3. Enter the **Quantity** to be removed. 
   - *Note: The system will block the transaction if the quantity exceeds available stock.*
4. The **Taken By** field is automatically populated with the current logged-in user.
5. In the **Remarks** field, specify the **Location of Use** (e.g., Block A, Floor 5, Zone 2).
6. Click **Confirm Stock Out**.

### Return Tools (Borrowed Tools Management)
This module is specifically for **Tools** that must be returned to the store after use.
1. Navigate to the **Return Tool** view.
2. You will see a list of **Active Borrows** showing:
   - Tool Name and Brand.
   - Who borrowed it and when.
   - The original quantity taken and any partial returns already made.
3. To return a tool, click the **Return** button on the specific record.
4. In the dialog:
   - Enter the **Quantity to Return** (you can return items partially).
   - Add **Remarks / Condition** (e.g., "Returned in good condition" or "Broken handle").
5. Click **Confirm Return**. The stock will be automatically added back to the inventory.

### Transaction History
To track the movement of any item:
1. Navigate to **Inventory History**.
2. This view provides a chronological log of all Stock In, Stock Out, and **Return** events, including usernames, dates, and remarks.

> [!TIP]
> **[SCREENSHOT: Active Borrows Table]**
> *Capture the Borrowed Tools Management screen showing the list of active borrows.*

> [!TIP]
> **[SCREENSHOT: Stock Out Form]**
> *Capture the Stock Out screen showing an item selected with its available quantity.*

> [!TIP]
> **[SCREENSHOT: Inventory Dashboard]**
> *Capture the full inventory table showing the search bar and sort labels.*

---

## 2. Building Progress & BOQ Mapping
This module is used to map physical equipment to your project's digital floor plans.

### Accessing the Detailed Plan
1. Select a **Building** and **Floor** from the main dashboard.
2. Choose your **System Segment** (e.g., BSS, PA, or TELCO).
3. Click "View Detailed Plan" to open the mapping workspace.

> [!TIP]
> **[SCREENSHOT: Detailed Plan Workspace]**
> *Capture the floor plan with the right sidebar open showing "CSV Object Pool".*

### Assigning BOQ Items to the Map
There are two ways to assign an item from your BOQ CSV to the floor plan:

#### Method A: Drag and Drop
1. Locate the item in the **CSV Object Pool** (e.g., `R4-L5-1`).
2. Drag the item from the sidebar and drop it onto its precise location on the floor plan.
3. The status in the sidebar will automatically change to **Emerald Green (Assigned)**.

#### Method B: Manual ID Entry
1. Select the relevant **Legend Icon** from the top bar (e.g., a Speaker or Camera icon).
2. Click on the map to place the icon.
3. In the form that appears, type the **Item Alias ID** (matching the CSV Item ID).
4. Upon saving, the system will automatically link the object to the BOQ item and update its status.

> [!TIP]
> **[SCREENSHOT: BOQ Item Assignment]**
> *Capture an icon being placed with the "Item Alias ID" field filled in.*

---

## 3. Object Status & Progression
Tracking the physical installation progress of every object.

### Updating Installation Status
1. Click on any placed object on the map to open the **Object Details Popover**.
2. Click "Edit Details" or use the quick status dropdown.
3. **Status Levels**:
   - **Fix 1**: Point installation / Wiring.
   - **Fix 2**: Physical equipment mounting.
   - **Finish**: Work completed by the field team.
   - **Approved**: Verified and closed by the supervisor.
   - **Pending**: Blocked by environmental factors (requires a photo upload).

### Cable Adding & Port Linking
To establish a connection between two devices (Source and Target):
1. Click the **Source Object** on the map and navigate to the **Port Status** tab in the popover.
2. Locate the relevant port (e.g., "CCTV Port 1") and click **Establish Link**.
3. **Configure the Connection**:
   - **Cable ID**: Enter the unique identification for this run (e.g., `CAT6-L5-001`).
   - **Target Object**: Select the destination device from the searchable dropdown list.
   - **Target Port**: Select which port on the destination device this cable connects to.
4. Click **Confirm Link**. The two objects are now digitally connected.

### Cable Runs (Wiring Topology) Tab
To view the global wiring backbone and signal flow of the entire floor:
1. Navigate to the bottom of the floor dashboard (below the map).
2. Select the **Cable Runs** tab.
3. **Key Metrics**:
   - **Total Runs**: Total number of unique cables registered.
   - **Active Links**: Cables marked as 'Online'.
   - **Devices Linked**: Unique hardware connected via cabling.
4. **Visual Flow**: The topology displays a side-by-side view showing the **Source Device** (Blue) and the **Target Device** (Green), with the Cable ID and Port names explicitly labeled.

> [!IMPORTANT]
> **[SCREENSHOT: Object Port Status Tab]**
> *Capture the Port Status tab showing an "Establish Link" form being filled out.*

> [!TIP]
> **[SCREENSHOT: Cable Topology View]**
> *Capture the list of cable runs showing Source -> Target signal flows.*

> [!IMPORTANT]
> **[SCREENSHOT: Object Detail Popover]**
> *Capture the popover showing the "Fix 1", "Fix 2" status buttons and the "Move" tool.*

---

## 4. Analytics Overview (Global BOQ)
The Analytics dashboard provides a high-level view of the entire project's progress across all floors and systems.

### KPI Widgets
- **Total Objects**: Cumulative count of all objects mapped from the master BOQ.
- **Completed**: Number of objects verified and approved by supervisors.
*   **Work Finished**: Number of objects marked as finished by the field team but awaiting final approval.
- **Pending/Working**: Objects currently in progress or blocked by issues.

### Completion Charts
- **Progress Pie Chart**: A breakdown of "Completed" vs. "Finished" vs. "Pending" tasks, showing the overall percentage of works done.
- **Systems Bar Chart**: A comparative view of progress across different systems (BSS, PA, TELCO). You can filter this view using the **All Systems** dropdown.

### Itemized BOQ List
At the bottom of the dashboard is the detailed object list.
1. **Expanding Rows**: Click the **Arrow Icon** or the row itself to expand a specific item.
2. **Assigned Object IDs**: Once expanded, the system displays a list of all identified IDs (e.g., `R4-L5-1`, `R4-L5-2`) that have been mapped to this BOQ entry.
3. **Filtering**: Use the system filter to narrow down the list to a specific segment of the project.

### Uploading a Master BOQ
Supervisors can update the global item list by clicking **Upload Master BOQ**.
- **Format**: Requires a `.csv` file. 
- **Ranges Support**: The system automatically expands ranges in the CSV (e.g., `SPEAKER 1 to 10` becomes 10 individual items).

> [!TIP]
> **[SCREENSHOT: Analytics KPI & Charts]**
> *Capture the top half of the Analytics dashboard showing the 4 KPI cards and the progress charts.*

> [!TIP]
> **[SCREENSHOT: Expanded BOQ Item Row]**
> *Capture the Itemized BOQ table with one row expanded to show the "Assigned Object IDs" chips.*

---

## 5. System Objects Directory
The System Objects Directory provides a searchable, filterable list of every physical object ever mapped in the project across all buildings and floors.

### Key Features:
- **Global Search & Filter**: Effortlessly narrow down thousands of objects by **System Type** (BSS, PA, TELCO), **Floor Level**, or **Current Installation Status**.
- **Detailed Object Data**: The table provides a comprehensive overview including the Alias ID, Item Name, Type, Cabling Type, and precise location (Building, Floor, Zone).
- **One-Click Navigation**: Clicking on any row in the table will automatically navigate you to the **Building Progress** map for that specific floor, allowing you to see the object in its spatial context.

### KPI Widgets & Analytics
- **Live Counters**: Real-time tracking of Total Objects, Completed, Finished, and Pending status across the entire project.
- **Status Distribution**: A pie chart visualizing the progress percentage of your installations.
- **System Volume**: A bar chart comparing the number of devices across different systems, helping you balance resources.

> [!TIP]
> **[SCREENSHOT: System Objects Directory]**
> *Capture the full directory page showing the KPI cards, charts, and the filtered data table.*

---

## 6. Wiring Topology & Rack Management
This specialized module is used for organizing equipment inside Risers, Server Rooms, and Cabinets.

### Managing Cabinet Layouts:
1. Navigate to the **Wiring Topology** page in the sidebar.
2. Select your **Building**, **Floor**, and specific **Riser / Server Cabinet**.
3. **Equipment Sidebar**: Drag and drop new equipment (Switches, Patch Panels, Power Units) directly into the virtual rack.
4. **Interactive Rack**: 
   - Reorder items by dragging them up or down.
   - The system automatically calculates U-positioning and depth.
   - Supervisors can delete equipment using the **Trash Icon**.

### Point-to-Point Cable Inventory:
At the bottom of the rack view, the **Cable Run Inventory** table lists every active port connection within that specific cabinet. 
- Track **Cable IDs**, **Source/Destination Ports**, and **Connection Status** (Online, Offline, or Problem).
- Click the **Edit Icon** to modify connection details or update cable identifiers.

> [!TIP]
> **[SCREENSHOT: Rack Cabinet Layout]**
> *Capture the Wiring Topology page with a Riser cabinet layout showing icons in the rack.*

---

## 7. Onsite Reporting Dashboard
The Onsite Report dashboard provides a centralized "Bento-style" overview of critical field data, safety assessments, and environmental conditions.

### Available Modules:
- **Inspection Reports**: Track and manage mandatory site inspections. Each report is categorized by floor and system type, requiring supervisor approval for final closure.
- **Maintenance Logs**: A comprehensive journal of all hardware and system maintenance tasks (e.g., server filter replacements, camera calibration), ensuring a clear audit trail of equipment upkeep.
- **Overall Risk Assessment**: A module dedicated to documenting site safety audits and occupational hazard evaluations to maintain a safe working environment for all technicians.
- **Drawing Diagrams**: A centralized repository for uploading and managing project drawing designs. This module allows technical teams to access high-resolution floor plans and site layouts.
- **Schematic Diagrams**: A dedicated module for viewing logical system schematic architectures. It provides a technical overview of how different ELV systems are interconnected.
- **Weather Monitoring**: Real-time integration of site-specific weather conditions (Temperature, Humidity, Wind Speed) and multi-day forecasts to help plan outdoor or height-critical works.

> [!TIP]
> **[SCREENSHOT: Onsite Dashboard Overview]**
> *Capture the main "Onsite Report" landing page showing the six interactive bento-tiles.*

---

## 8. Scheduling & Attendance Reports
The Scheduling module provides a powerful calendar-based interface for managing both project tasks (Report Schedule) and personnel availability (Attendance Report).

### 8.1 Report Scheduling (Task Management)
Track and organize all recurring and one-off project reports or site tasks.
- **Interactive Calendar**: View tasks by Month, Week, or Day. Drag and drop any task to reschedule it instantly.
- **Task Status Mapping**:
  - **Blue**: Scheduled / Upcoming tasks.
  - **Amber**: In-Progress tasks.
  - **Emerald**: Completed and closed tasks.
- **Actions**: Click any task to view the **Task Overview** sidebar, which displays its description, the assigned user/team, and allows you to mark the work as **Completed**.

### 8.2 Attendance & Personnel Tracking
A dedicated view for managing the onsite workforce and their shift rotations.
- **Shift Status**: Personnel are categorized using a color-coded legend (e.g., Morning Shift, Night Shift, Rest Day, Annual Leave, MC).
- **Managing Shifts**:
  1. Toggle to the **Attendance Report** tab within the Scheduling module.
  2. Click **Add Personnel Shift** to assign a staff member to a specific date and status.
  3. Use the **Monthly Calendar** to see an overview of staff density for any given day.
- **Shift Summary**: Each day on the calendar displays a "Shifts Count" chip; clicking it reveals the full list of personnel on-site for that date.

> [!TIP]
> **[SCREENSHOT: Scheduling Task Management]**
> *Capture the Scheduling page with the "Report Schedule" tab active and a task selected in the sidebar.*

> [!TIP]
> **[SCREENSHOT: Personnel Attendance View]**
> *Capture the Attendance calendar showing grouped staff shifts with their respective color codes.*

---

## 9. Project Timeline
The Project Timeline module provides a high-level visual representation of the project's schedule, allowing managers to compare planned milestones against actual site progress.

### 9.1 Milestone Management
- **Defining Milestones**: Create key project checkpoints (e.g., "Fiber Backbone Installation", "Server Room Setup") with expected start and completion dates.
- **Visual Nodes**: Milestones are displayed as interactive nodes on a horizontal axis. Clicking a milestone allows you to drill down into its specific sub-tasks.
- **Search & Navigation**: Use the "Milestone Viewer" search bar to instantly locate and center the timeline on a specific task.

### 9.2 Expected vs. Actual Tracking
The timeline is split into two synchronized views:
1. **Expected Timeline (Blue)**: The original project schedule. This serves as the baseline for all works.
2. **Actual Progress Timeline (Emerald)**: Real-time data showing when tasks actually started and finished on-site.
   - *Note: Tasks only appear on the Actual timeline once an 'Actual Start Date' has been logged.*

### 9.3 Sub-Timelines (Phase Management)
For complex phases, you can create **Sub-Timelines**.
- Navigate into any milestone to view its internal task breakdown.
- Sub-tasks are bounded by the dates of their parent milestone, ensuring the overall schedule remains consistent.

### 9.4 Change History & Audit Trail
To maintain accountability, the system tracks every modification to the timeline.
- **Mandatory Reasons**: If a milestone's date is changed, the system requires a "Reason for change" to be documented.
- **Timeline History Table**: At the bottom of the page, a detailed log shows who made the change, what the previous dates were, and the justification provided.

> [!TIP]
> **[SCREENSHOT: Project Timeline Viewer]**
> *Capture the dual timeline view (Expected vs. Actual) showing milestones and the connecting signal lines.*

---

## 10. Team & User Management
The User Management module is a supervisor-only tool for managing project team accounts, roles, and platform access.

### 10.1 Access & Permissions
- **Supervisors Only**: Access to this module is restricted to users with the Supervisor role. 
- **Role Hierarchy**:
  - **Supervisor**: Full administrative access to user management, master BOQ uploads, and project-wide settings.
  - **Facilitator**: High-level access for project oversight across multiple system segments.
  - **Member**: Standard access for mapping objects and updating installation statuses.

### 10.2 Managing Team Members
1. **Creating Accounts**:
   - Click **Add New User** in the top right corner.
   - Provide the staff member's Full Name, Email, and a **Temporary Password**.
   - Assign their project role from the dropdown menu.
2. **Account Status**:
   - **Active (Emerald)**: User has full access to their assigned modules.
   - **Blocked (Red)**: Access has been revoked. Toggle the **Block** switch in the table to instantly disable or re-enable an account.
3. **Engagement Tracking**:
   - View the **Last Active** timestamp to monitor when technicians or project managers last synced their work to the platform.

> [!IMPORTANT]
> **[SCREENSHOT: User Management Table]**
> *Capture the User Management page showing the team list with avatars, roles, and status switches.*

---

## 11. Messaging & Communication
The Messaging Model is a real-time communication tool designed to facilitate seamless collaboration between engineers and project managers directly within the platform.

### 11.1 Accessing the Chat
The chat interface is accessible via a persistent floating widget at the bottom-right corner of the screen.
- Click the **Indigo Chat Icon** to expand the messaging window.
- Click the **'X'** in the header or the bubble icon again to minimize the chat.

### 11.2 Communication Channels
The system supports two primary communication modes:
1. **Global Channel**: A project-wide broadcast area for general technical discussions and announcements. Messages sent here are visible to all registered project users.
2. **Private Messaging**: One-on-one communication with specific team members.

### 11.3 Contact List & Online Status
To communicate with a specific team member:
1. Toggle to the **Engineers** tab in the chat widget.
2. View the list of all project users and their live status:
   - **Green Badge/LIVE**: The user is currently active on the platform.
   - **Grey/Offline**: The user is currently disconnected.
3. Click on any name to initiate or continue a private conversation.

### 11.4 Message Features
- **Project Context**: Use the chat for quick site updates and technical queries that require immediate attention.
- **Relatvie Timestamps**: Monitor the flow of information with live timestamps (e.g., "5 minutes ago").
- **Auto-Refresh**: New messages appear instantly without requiring a page reload.

> [!TIP]
> **[SCREENSHOT: Chat Widget Interface]**
> *Capture the chat widget showing the Global channel and the Engineers contact list.*

---

## 12. Troubleshooting & FAQ

**Q: My object is on the map but the sidebar still says "Unassigned".**
*A: Ensure the "Item Alias ID" exactly matches the ID in the CSV (e.g., `R4-L5-1`). Check that you have selected the correct floor in the sidebar filter.*

**Q: I deleted an object, where did it go in the BOQ?**
*A: The system automatically marks the BOQ item as "Unassigned" again so you can re-map it later.*

---
*Manual Generated on 2026-05-08*

