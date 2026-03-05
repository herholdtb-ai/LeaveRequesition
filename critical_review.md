# Senior Consultant Analysis: HS Grabouw Leave Application System

This report provides a critical evaluation of the web-based Leave Application System designed for Wix + Velo. It covers supported processes, sequential workflows, gap analysis, and expert recommendations for implementation.

---

## 1. System Processes: Current & Potential Capabilities

### Current Supported Processes
* **Staff Hierarchical Registration:** A three-tier onboarding process ensuring every staff member is linked to a specific Department Head (DH) and vetted by the Principal before system access is granted.
* **Contingency-Based Leave Application:** Captures granular substitution plans (Periods 1–7) alongside standard leave data, ensuring educational continuity.
* **Dynamic Routing Logic:** Automatically determines the "Master Supervisor" by prioritizing an "Acting Supervisor" override over the "Original Supervisor".
* **Bypass Approval Workflow:** Automatically routes requests directly to the Principal if the applicant's supervisor is the Principal themselves.
* **Multi-Stage Digital Review:** Supports a "Supported/Not Supported" tier for DHs and an "Approved/Rejected" tier for the Principal.
* **Automated Audit Trail & History:** Maintains a complete log of decisions, remarks, and timestamps for every request, accessible by both staff and administrators.

### Potential Future Capabilities
* **Digital Evidence Management:** Integration of a file upload pipeline for medical certificates (required for sick leave) or official WCED documentation.
* **Leave Balance Tracking:** Implementing a "Leave Bank" to automatically deduct days from a user's annual/sick leave allocation upon approval.
* **Calendar Integration:** Syncing approved leave with a school-wide Google or Outlook calendar to visualize staff absences.
* **Batch Exporting:** CSV/Excel export functionality for school administrative staff to process payroll and departmental records.

---

## 2. Sequential Step-by-Step Workflows

### A. Staff Registration & Vetting Workflow
1.  **Submission:** Staff member enters name, email, and supervisor email.
2.  **Email Verification:** System sends a link to the staff member to verify the email address.
3.  **DH Vouching (Tier 1):** The nominated supervisor receives an email to "vouch" for the staff member's identity and reporting line.
4.  **Principal Authorization (Tier 2):** After DH confirmation, the Principal receives a final authorization request.
5.  **Activation:** Once approved, the `UserRegistry` status updates to "Approved," enabling the staff member to log in and apply for leave.

### B. Leave Application & Approval Workflow
1.  **Application:** Staff fills in dates, reason, and period-specific substitution plans.
2.  **Routing (Data Hook):** The `beforeInsert` hook in `data.js` calculates the `master_supervisor` based on acting/original supervisor fields.
3.  **Initial Notification:** Applicant receives a copy of the request; the Reviewer receives a notification to check their dashboard.
4.  **Tier 1 Review (DH):** The DH views the request in the `DH Dashboard`. If "Supported," the status moves to "Pending: Principal".
5.  **Tier 2 Review (Principal):** The Principal reviews "Supported" items. Final approval triggers a "Complete" status.
6.  **Finalization:** A cumulative email with all remarks and office instructions is sent to the Applicant, DH, and Admin.

---

## 3. Critical Gap Analysis

| Category | Finding | Risk / Conflict |
| :--- | :--- | :--- |
| **Logic** | **Calendar Calculation:** `calculateDays()` uses a simple subtraction of dates. | **High:** Does not account for weekends or school holidays, leading to incorrect leave counts. |
| **Security** | **Unprotected Dashboard Access:** Dashboard code does not explicitly verify the user's role (DH vs. Staff) beyond page-level permissions. | **Medium:** Potential for unauthorized viewing of sensitive leave reasons if page permissions are misconfigured. |
| **Security** | **Link-Based Verification:** Registration confirmation relies on simple URL parameters. | **High:** If an email is intercepted, unauthorized users can "vouch" or "verify" accounts without authentication. |
| **Workflow** | **Supervisor Email Errors:** `actingSupervisorEmail` is a manual text input. | **Medium:** A typo in the email address will break the automated routing and notification flow. |
| **Data Integrity** | **Field Naming Inconsistency:** `8_Implementation_Checklist.md` uses `decision` and `remarks`, but `1_Database_Setup.md` and `data.js` use `supervisorDecision`, `principalDecision`, etc. | **Medium:** Implementation will fail if developers follow the checklist instead of the technical database schema. |
| **Workflow** | **Status Inconsistency:** `registration.jsw` uses "Unverified" and "Pending", while `Master_Checklist` uses "Pending Confirmation". | **Low:** Causes confusion during the vetting process and potential UI display bugs. |

---

## 4. Expert Recommendations

### Technical Enhancements (Wix/Velo)
* **Working Days Logic:** Replace the subtraction in `calculateDays()` with a loop that checks each date against a `Holidays` collection and excludes Saturdays/Sundays.
* **Role-Based Access Control (RBAC):** Use `wix-users` or `wix-members` in the `onReady` function of dashboards to verify the logged-in user's email matches the expected DH or Principal email before querying data.
* **Secure Tokens:** Instead of passing the Database ID directly in email links, generate a unique, short-lived `token` field in the database for verification.

### Database & Design Improvements
* **Schema Standardization:** Immediately update `8_Implementation_Checklist.md` to match the field keys in `1_Database_Setup.md` (e.g., using `supervisorDecision` instead of `decision`).
* **Supervisor Selection:** Replace the `actingSupervisorEmail` text box with a **Dropdown** populated via a query to the `UserRegistry` (where `status === 'Approved'`). This eliminates typos and routing failures.
* **Status Mapping:** Standardize on a single set of status strings across `registration.jsw`, `data.js`, and all frontend pages to ensure predictable behavior.

### User Experience (UX) Improvements
* **Digital Submission Requirements:** Add a "File Upload" button to the Leave Request page, mandatory if "Sick Leave" is selected and duration is >2 days.
* **Status Visuals:** In the "My History" repeater, use a "Status Icon" or colored box (e.g., Green for Complete, Yellow for Pending) to provide immediate visual feedback to the user.
* **Office Instructions:** Ensure the Principal's "Office Instructions" are displayed as a modal or prominent alert on the final "Complete" email to ensure staff follow through with physical signatures if required.
