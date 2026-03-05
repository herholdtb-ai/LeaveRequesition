# Senior Consultant Implementation Plan: HS Grabouw Leave Application System

This revised implementation plan addresses the critical gaps with specific focus on calendar-day logic, domain-restricted security, and secure token-based communication via SendGrid.

---

## 1. Updated Issues Tracker (`9_Updated_Issues.md`)

```markdown
# Project Issues & Implementation Roadmap (V3 - Secure Domain & Tokens)

## Phase 1: Security & Domain Validation (Highest Priority)
- [x] **Issue #101: Secure Token Generation.** Implement a dedicated `VerificationTokens` collection to replace raw ID-based URL parameters.
- [x] **Issue #102: Domain Restriction.** Enforce `@hsgrabouw.co.za` validation across registration and supervisor selection.
- [x] **Issue #103: SendGrid Integration.** Transition all automated emails to SendGrid with dynamic token-link injection.

## Phase 2: Logic & Data Integrity
- [x] **Issue #201: Calendar Day Logic.** (Revised) Use simple calendar day subtraction for leave duration, ensuring the +1 inclusive day calculation.
- [x] **Issue #202: Database Normalization.** Standardize `LeaveApplications` field names: `supervisorDecision`, `principalDecision`, `supervisorRemarks`, `principalRemarks`.

## Phase 3: UI/UX Enhancements
- [x] **Issue #301: Dynamic Routing UI.** Replace manual supervisor email entry with a vetted dropdown of approved staff.
- [x] **Issue #302: Real-time Duration Feedback.** Update the leave form to show calendar days immediately upon date selection.
