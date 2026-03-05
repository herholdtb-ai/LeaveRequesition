import { ForbiddenError } from 'wix-errors';

const DOMAIN = "@hsgrabouw.co.za";

export function LeaveApplications_beforeInsert(item, context) {
    // 1. Domain Lockdown
    if (!item.applicantEmail.toLowerCase().endsWith(DOMAIN)) {
        throw new ForbiddenError("Only @hsgrabouw.co.za accounts are permitted.");
    }

    // 2. Inclusive Calendar Day Calculation
    if (item.startingDate && item.endDate) {
        const start = new Date(item.startingDate);
        const end = new Date(item.endDate);
        const diffInMs = Math.abs(end - start);
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + 1; 
        item.totalDays = diffInDays;
    }

    // 3. Automated Routing
    item.master_supervisor = item.actingSupervisorEmail || item.originalSupervisorEmail;

    return item;
}

export function UserRegistry_beforeInsert(item, context) {
    if (!item.email.toLowerCase().endsWith(DOMAIN)) {
        throw new ForbiddenError("Registration restricted to HS Grabouw domain.");
    }
    return item;
}
