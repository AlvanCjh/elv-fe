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

### Cable Topology (Signal Flow)
To view the global wiring backbone of the floor:
1. Open the **Cable Topology** view from the floor dashboard.
2. **Key Metrics**:
   - **Total Runs**: Total number of unique cables registered.
   - **Active Links**: Cables marked as 'Online'.
   - **Devices Linked**: Unique hardware connected via cabling.
3. **Visual Flow**: The topology displays a side-by-side view showing the **Source Device** (Blue) and the **Target Device** (Green), with the Cable ID and Port names explicitly labeled.

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

## 5. Troubleshooting & FAQ

**Q: My object is on the map but the sidebar still says "Unassigned".**
*A: Ensure the "Item Alias ID" exactly matches the ID in the CSV (e.g., `R4-L5-1`). Check that you have selected the correct floor in the sidebar filter.*

**Q: I deleted an object, where did it go in the BOQ?**
*A: The system automatically marks the BOQ item as "Unassigned" again so you can re-map it later.*

---
*Manual Generated on 2026-04-01*
