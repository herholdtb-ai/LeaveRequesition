# Backend Workflow: Automated Leave System

This document explains the automated event-driven architecture of the LeaveRequest system.

## 1. Submission Flow (beforeInsert)
When an educator clicks "Submit":
1. The system captures the `originalSupervisorEmail` and `actingSupervisorEmail`.
2. **Logic Check**: If `acting` is present, it becomes the `master_supervisor`; otherwise, the `original` is used.
3. **Bypass Check**: If `master_supervisor` is the Principal, status is set to `Pending: Principal`. Otherwise, `Pending Supervisor`.

## 2. Notification Flow (afterInsert)
1. **Applicant**: Receives a "Submission Received" email with a full copy of their request.
2. **Reviewer**: If not bypassed, the `master_supervisor` receives a "Review Required" email with a link to their dashboard. If bypassed, the Principal receives this email.

## 3. Review Flow (afterUpdate)
1. **DH Approval**: When the DH updates the record, the system detects the status change from `Pending Supervisor` to `Pending: Principal`.
2. **Transition Email**: The system automatically emails the Applicant (Update) and the Principal (Review Request) with the cumulative data.
3. **Principal Approval**: When the Principal updates status to `Complete`, the system appends the mandatory office instructions and sends the final "Full History" email to Applicant, DH, and Admin.
