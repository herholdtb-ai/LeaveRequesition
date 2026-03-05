# Database Setup Guide: LeaveRequest System

This document outlines the required collections and field structures for the Wix CMS to ensure the LeaveRequest system functions correctly with the automated backend hooks.

---

## 1. UserRegistry Collection
**Collection ID:** `UserRegistry`  
**Purpose:** Stores authorized staff members and their hierarchy.

| Field Name | Field Key | Field Type | Description |
| :--- | :--- | :--- | :--- |
| Staff Name | `title` | Text | Primary field (Display name) |
| Email | `email` | Text | Unique identifier / Wix Login Email |
| Supervisor Email | `supervisorEmail` | Text | The default supervisor for this user |
| Status | `status` | Text | Options: "Pending Confirmation", "Confirmed Supervisor", "Pending Principal", "Approved", "Declined" |

---

## 2. LeaveApplications Collection
**Collection ID:** `LeaveApplications`  
**Purpose:** Stores all leave requests and the full audit trail of decisions.

### Applicant & Routing Fields
| Field Name | Field Key | Field Type | Description |
| :--- | :--- | :--- | :--- |
| Applicant Email | `applicantEmail` | Text | Email of the staff member applying |
| Original Supervisor | `originalSupervisorEmail` | Text | Pre-filled default supervisor email |
| Acting Supervisor | `actingSupervisorEmail` | Text | Manual override email if an acting supervisor is used |
| Master Supervisor | `master_supervisor` | Text | **System Field:** Populated by hook (Acting > Original) |

### Leave Details
| Field Name | Field Key | Field Type | Description |
| :--- | :--- | :--- | :--- |
| Starting Date | `startingDate` | Date and Time | First day of leave |
| End Date | `endDate` | Date and Time | Last day of leave |
| Total Days | `totalDays` | Number | Calculated duration |
| Reason | `reason` | Text | Staff member's reason for leave |
| Contingency Data | `contingencyData` | Object | Stores period 1-7 substitution plans |

### Workflow & Decision Fields
| Field Name | Field Key | Field Type | Description |
| :--- | :--- | :--- | :--- |
| Application Status | `applicationStatus` | Text | "Pending Supervisor", "Pending: Principal", "Complete" |
| Supervisor Decision | `supervisorDecision` | Text | "Supported" or "Not Supported" |
| Supervisor Remarks | `supervisorRemarks` | Text | Feedback from supervisor |
| Principal Decision | `principalDecision` | Text | "Approved" or "Rejected" |
| Principal Remarks | `principalRemarks` | Text | Feedback from Principal |

### Automated Timestamps
| Field Name | Field Key | Field Type | Description |
| :--- | :--- | :--- | :--- |
| Submission Time | `submissionTimestamp` | Date and Time | Recorded at initial submission |
| Supervisor Time | `supervisorDecisionTimestamp` | Date and Time | Recorded at supervisor review |
| Principal Time | `principalDecisionTimestamp` | Date and Time | Recorded at principal review |

---

## 💡 Implementation Notes
1. **Field Keys:** When creating these in Wix, ensure the **Field Key** matches the table above exactly, as the code in `data.js` and `3_Leave_Request_Page.js` is case-sensitive.
2. **Permissions:** - `UserRegistry`: Read (Site Member Author), Write (Admin).
   - `LeaveApplications`: Read (Site Member Author), Write (Site Member).
3. **Master Supervisor Logic:** Do not manually edit the `master_supervisor` field; the `beforeInsert` hook in `data.js` handles the fallback logic (Acting Email > Original Email) automatically.
