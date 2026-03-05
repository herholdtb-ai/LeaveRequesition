# Senior Consultant Analysis: Wix + Velo Leave Application System  
*(Calendar Days Calculation – Client Preference Confirmed)*

**Prepared for:** Herholdt  
**Date:** March 2026  
**Project:** Leave Application System for school staff (Wix + Velo)  
**Repository:** https://github.com/herholdtb-ai/LeaveRequesition

This report reflects the explicit preference to calculate leave duration using **calendar days** (inclusive count from start date to end date, including weekends and public holidays). All previous recommendations for working-day logic have been removed.

## 1. Supported Processes – Current & Potential Future

### Current Capabilities (based on repository documentation)
- Staff registration with email verification and hierarchical vetting (supervisor → principal)
- Leave request submission with dates, reason, contingency plans, optional acting supervisor override
- Dynamic approval routing (DH/supervisor first unless bypassed, then principal)
- Automated email notifications at each stage (submission, review, decision)
- Role-based dashboards for DHs and principals to review pending requests
- Personal leave history view for applicants
- Basic audit trail (timestamps, decisions, remarks)

### Potential Future Capabilities
- Leave type selection (annual, sick, maternity, study, etc.)
- Leave balance tracking & automatic deduction on approval
- Attachment upload (e.g. medical certificates)
- Overlapping leave detection & conflict warnings
- Reporting dashboard (leave trends, departmental summaries)
- Appeal / revision workflow for rejected applications
- Calendar export / integration (school Google Calendar, Outlook)
- Mobile-optimized approval flow
- Admin tools (bulk status updates, export CSV)

## 2. Core Workflows – Step-by-Step

### A. Staff Registration & Vetting
1. New user completes registration form (name, email, supervisor email, password)
2. Record inserted into `UserRegistry` → status = "Pending Confirmation"
3. Verification email sent with secure link/token
4. User clicks link → status = "Confirmed Supervisor"
5. Supervisor receives email with vouch request → confirms via link/dashboard → status = "Pending Principal"
6. Principal reviews and approves/rejects → status = "Approved" / "Declined"
7. Approved users gain access to member-only functionality

### B. Leave Request Submission
1. Logged-in staff member opens "Apply for Leave" page
2. Name and email auto-filled from session
3. User selects **start date** and **end date** using date pickers
4. System calculates **totalDays** (calendar days, inclusive):  
   `totalDays = Math.floor((end - start) / 86400000) + 1`
5. User enters: reason, contingency plans (period 1–7), optional acting supervisor email
6. User checks declaration checkbox and submits
7. Before insert hook:
   - Validates end ≥ start
   - Sets `master_supervisor` = acting email (if provided) else original supervisor
   - Sets initial status ("Pending Supervisor" or "Pending: Principal" if acting override used)
8. Record saved to `LeaveApplications`
9. Emails sent: confirmation to applicant + review request to reviewer(s)

### C. Department Head (DH / Supervisor) Review
1. DH logs in → opens "DH Dashboard"
2. Repeater displays only requests where `master_supervisor` = current user's email and status = "Pending Supervisor"
3. DH views full request details (including calendar totalDays)
4. DH selects: "Supported" / "Not Supported" + adds remarks
5. Submits decision
6. After update hook:
   - Updates `supervisorDecision`, timestamp, remarks
   - If supported → status = "Pending: Principal"
   - If not supported → status = "Not Supported by DH" (final unless appeal added later)
7. Emails: update to applicant + notification to principal (if advanced)

### D. Principal Review & Final Decision
1. Principal opens "Principal Dashboard"
2. Repeater shows requests where status = "Pending: Principal" (or bypassed directly)
3. Principal reviews full history (dates, totalDays calendar, DH remarks if present)
4. Selects: "Approved" / "Rejected" + adds remarks
5. Submits
6. After update hook:
   - Sets `principalDecision`, timestamp, final status = "Complete" / "Rejected"
7. Final emails sent to applicant, DH (if involved), and optional admin copy

### E. Applicant History View
1. User opens "My Leave History"
2. System queries `LeaveApplications` by `applicantEmail` = current user
3. Repeater displays: request dates, totalDays (calendar), reason summary, current status, key decisions/remarks

## 3. Critical Gap Analysis & Risks

### Major Gaps & Limitations
- No leave type field → cannot differentiate rules/behaviour (sick vs annual vs special)
- No leave balance enforcement or visibility
- No attachment support
- No overlap/conflict detection between multiple requests
- No rejection appeal or edit/resubmit flow
- No reporting or admin overview
- No timeout/escalation for stalled requests

### Security & Validation Concerns
- Supervisor/acting supervisor emails entered manually → high risk of typos → broken routing
- No enforced email domain restriction (@hsgrabouw.co.za) in core code
- Potential weak role enforcement (relying only on page permissions, not backend checks)
- Sensitive data (medical reasons) stored in plain text

### Technical & UX Issues
- Calendar days calculation is simple but correct per requirement
- No real-time total days preview on form (user sees result only after submit)
- No validation preventing end date before start date on frontend
- Email dependency (Wix Automations + SendGrid) – single point of failure if keys expire
- No fallback notifications (e.g. in-app alerts)

### Documentation Inconsistencies
- Field name variations between files (e.g. `decision` vs `supervisorDecision`)
- Status value inconsistencies across markdown files
- `Consult_Implement.md` claims many items complete, but several critical gaps remain evident

## 4. Actionable Recommendations – Prioritized

### Priority 1 – Security & Data Integrity (Must Do First)
- Enforce `@hsgrabouw.co.za` domain validation on registration and supervisor fields
- Replace free-text supervisor/acting supervisor with dropdown populated from approved `UserRegistry` records
- Add frontend + backend validation: endDate ≥ startDate
- Use Wix Secrets Manager for SendGrid API key

### Priority 2 – Core UX & Reliability Improvements
- Add real-time **calendar days** preview on form:
  ```javascript
  $w.onReady(function () {
    $w('#startDate').onChange(updateDays);
    $w('#endDate').onChange(updateDays);

    function updateDays() {
      let start = $w('#startDate').value;
      let end   = $w('#endDate').value;
      if (start && end) {
        let diff = new Date(end) - new Date(start);
        let days = Math.floor(diff / 86400000) + 1;
        $w('#totalDaysDisplay').text = `Total calendar days: ${days}`;
      }
    }
  });
