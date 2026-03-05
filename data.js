import { ForbiddenError } from 'wix-errors';

/**
 * DATABASE HOOKS (data.js)
 * * This file centralizes security and logic for the HS Grabouw Leave Application System.
 * It enforces the @hsgrabouw.co.za domain restriction and inclusive calendar day calculations.
 */

const SCHOOL_DOMAIN = "@hsgrabouw.co.za";

/**
 * Hook for the LeaveApplications collection.
 * Triggers before a leave request is saved to the database.
 */
export function LeaveApplications_beforeInsert(item, context) {
    // 1. Security: Domain Lockdown
    // Reject any submission if the applicant's email does not belong to the school domain.
    if (!item.applicantEmail || !item.applicantEmail.toLowerCase().endsWith(SCHOOL_DOMAIN)) {
        throw new ForbiddenError(`Slegs amptelike ${SCHOOL_DOMAIN} e-posadresse word toegelaat.`);
    }

    // 2. Logic: Inclusive Calendar Day Calculation
    // Calculates duration based on start and end dates (Inclusive).
    // Formula: (End Date - Start Date) + 1 day.
    if (item.startingDate && item.endDate) {
        const start = new Date(item.startingDate);
        const end = new Date(item.endDate);

        // Calculate the difference in milliseconds
        const diffInMs = Math.abs(end - start);
        
        // Convert milliseconds to days and add 1 to include both the start and end days
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + 1; 
        
        item.totalDays = diffInDays;
    }

    // 3. Logic: Resolved Master Supervisor Routing
    // Prioritizes 'actingSupervisorEmail' if provided in the form, 
    // otherwise falls back to the user's 'originalSupervisorEmail'.
    item.master_supervisor = item.actingSupervisorEmail || item.originalSupervisorEmail;

    // 4. Audit: Set initial submission state
    item.submissionTimestamp = new Date();
    
    // Default starting status for a new request
    if (!item.applicationStatus) {
        item.applicationStatus = "Pending: Supervisor";
    }

    return item;
}

/**
 * Hook for the UserRegistry collection.
 * Triggers before a staff member's registration is saved.
 */
export function UserRegistry_beforeInsert(item, context) {
    // 1. Security: Domain Lockdown for Registration
    // Ensures only staff with the official domain can register for the system.
    if (!item.email || !item.email.toLowerCase().endsWith(SCHOOL_DOMAIN)) {
        throw new ForbiddenError("Registrasie is beperk tot HS Grabouw personeel (@hsgrabouw.co.za).");
    }

    // 2. Data Integrity: Default Flags
    // Set verification flags to false by default; these are updated via secure tokens.
    item.emailVerified = false;
    item.supervisorConfirmed = false;
    item.status = "Unverified";
    item.registrationTimestamp = new Date();

    return item;
}

/**
 * Hook for LeaveApplications before updates.
 * Useful for automated timestamping of supervisor/principal decisions.
 */
export function LeaveApplications_beforeUpdate(item, context) {
    // Auto-timestamp supervisor decision
    if (item.supervisorDecision && !item.supervisorDecisionTimestamp) {
        item.supervisorDecisionTimestamp = new Date();
    }

    // Auto-timestamp principal decision
    if (item.principalDecision && !item.principalDecisionTimestamp) {
        item.principalDecisionTimestamp = new Date();
    }

    return item;
}
