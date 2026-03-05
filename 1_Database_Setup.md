# Wix Database Schema Setup

Before writing code for the leave application system, perform the following setup in the Wix CMS (Content Management System).

## 1. Enable Velo Dev Mode
1. Open up your Wix Editor.
2. At the very top, click **Dev Mode** and then **Turn on Dev Mode**.

---

## 2. Create Collection A: `UserRegistry`
This collection holds all authorized staff members and their reporting lines.

1. Create a new collection named **UserRegistry** (Collection ID: `UserRegistry`).
2. Add the following fields:
   - `title` (Primary, Text): Staff Name
   - `email` (Text): Username / Primary Key for identification
   - `supervisorEmail` (Text): The direct supervisor's email address
   - `status` (Text): Current approval status
     - *Valid Options*: "Pending Confirmation", "Confirmed Supervisor", "Pending Principal", "Approved", "Declined"

---

## 3. Create Collection B: `LeaveApplications`
This collection holds the actual leave request data submitted by staff.

1. Create another new collection named **LeaveApplications** (Collection ID: `LeaveApplications`).
2. Add the following fields:
   - `applicantEmail` (Reference): Reference to `UserRegistry` (or a simple Text field containing the email)
   - `startingDate` (Date and Time): The starting date for the leave.
   - `endDate` (Date and Time): The ending date for the leave.
   - `totalDays` (Number): The calculated total days of leave requested.
   - `actingSupervisorEmail` (Text): An editable field for the acting supervisor during the leave period.
   - `reason` (Text): The reason for the leave application.
   - `contingencyData` (Object / JSON): To store periods 1-7 contingency arrangements (e.g., classes impacted, substitution).
   - `applicationStatus` (Text): The status of the application.
     - *Valid Options*: "Pending Supervisor", "Pending: Principal", "Complete"
   - `supervisorDecision` (Text): The supervisor's recommendation.
     - *Valid Options*: "Supported", "Not Supported"
   - `supervisorRemarks` (Text): Additional remarks from the supervisor.
   - `principalDecision` (Text): The principal's final decision.
     - *Valid Options*: "Approved", "Rejected"
   - `principalRemarks` (Text): Additional remarks from the principal.
   - `submissionTimestamp` (Date and Time): Auto-populated date/time when application was first submitted.
   - `supervisorDecisionTimestamp` (Date and Time): Auto-populated date/time when supervisor made their decision.
   - `principalDecisionTimestamp` (Date and Time): Auto-populated date/time when principal made their decision.
