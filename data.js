import wixData from 'wix-data';
import sgMail from '@sendgrid/mail';
import { getSecret } from 'wix-secrets-backend';

const SENDER_EMAIL = "info@hsgrabouw.co.za";
const PRINCIPAL_EMAIL = "bezuidenhouth@hsgrabouw.co.za";

/**
 * Utility to format dates for emails
 */
const formatTime = (dateObj) => dateObj ? dateObj.toLocaleString() : "N/A";

/**
 * BEFORE INSERT: Set initial status and timestamps
 */
export async function LeaveApplications_beforeInsert(item, context) {
    item.submissionTimestamp = new Date();
    
    if (item.actingSupervisorEmail === PRINCIPAL_EMAIL) {
        item.applicationStatus = "Pending: Principal";
    } else {
        item.applicationStatus = "Pending Supervisor";
    }
    return item;
}

/**
 * AFTER INSERT: Send initial notifications to Applicant and Supervisor
 */
export async function LeaveApplications_afterInsert(item, context) {
    const applicantEmail = item.applicantEmail;
    const supervisorEmail = item.actingSupervisorEmail;
    
    // 1. Send confirmation to Applicant
    await sendStatusEmail(applicantEmail, "Submitted", item);

    // 2. Send request to Supervisor (unless Principal is the supervisor)
    if (supervisorEmail !== PRINCIPAL_EMAIL) {
        await sendReviewEmail(supervisorEmail, "Supervisor", item);
    } else {
        // If bypassing supervisor, send directly to Principal
        await sendReviewEmail(PRINCIPAL_EMAIL, "Principal", item);
    }

    return item;
}

/**
 * BEFORE UPDATE: Track decision timestamps and append auto-remarks
 */
export async function LeaveApplications_beforeUpdate(item, context) {
    const originalItem = context.currentItem || await wixData.get("LeaveApplications", item._id);

    if (originalItem && originalItem.supervisorDecision !== item.supervisorDecision && item.supervisorDecision) {
        item.supervisorDecisionTimestamp = new Date();
    }

    if (originalItem && originalItem.principalDecision !== item.principalDecision && item.principalDecision) {
        item.principalDecisionTimestamp = new Date();
    }

    if (item.applicationStatus === "Complete" && item.principalDecision === "Approved") {
        const extraText = "Onthou: Jy moet nogsteeds 'n verlofvorm voltooi en indien by die kantoor! Heg ook aan by jou verlofvorm bewys van jou afwesigheid (bv. siekbrief) indien nodig. Heg ook 'n uitdruk van hierdie skrywe aan by jou verlofvorm.";
        item.principalRemarks = item.principalRemarks ? `${item.principalRemarks}\n\n${extraText}` : extraText;
    }

    return item;
}

/**
 * AFTER UPDATE: Handle workflow transitions and notifications
 */
export async function LeaveApplications_afterUpdate(item, context) {
    const originalItem = context.currentItem;
    const applicantEmail = item.applicantEmail;

    // A. Supervisor has just submitted their review
    if (originalItem.applicationStatus === "Pending Supervisor" && item.applicationStatus === "Pending: Principal") {
        await sendStatusEmail(applicantEmail, "Reviewed by Supervisor", item);
        await sendReviewEmail(PRINCIPAL_EMAIL, "Principal", item);
    }

    // B. Principal has just submitted final review (Application Complete)
    if (originalItem.applicationStatus !== "Complete" && item.applicationStatus === "Complete") {
        const adminEmail = "admin@hsgrabouw.co.za";
        const supervisorEmail = item.actingSupervisorEmail;
        
        // Final email to all parties
        await sendStatusEmail([applicantEmail, supervisorEmail, adminEmail], "Complete", item);
    }

    return item;
}

/**
 * Core Function: Sends Status Updates to the Applicant
 */
async function sendStatusEmail(recipients, status, item) {
    const body = `
        Current Status: ${status}
        Applicant: ${item.applicantEmail}
        Submitted At: ${formatTime(item.submissionTimestamp)}
        
        Start: ${item.startingDate}
        End: ${item.endDate}
        Total Days: ${item.totalDays}
        Reason: ${item.reason}

        --- Substitution/Contingency Data ---
        P1: ${item.contingencyData?.p1 || "N/A"} | P2: ${item.contingencyData?.p2 || "N/A"}
        P3: ${item.contingencyData?.p3 || "N/A"} | P4: ${item.contingencyData?.p4 || "N/A"}
        P5: ${item.contingencyData?.p5 || "N/A"} | P6: ${item.contingencyData?.p6 || "N/A"}
        P7: ${item.contingencyData?.p7 || "N/A"}

        Supervisor Decision: ${item.supervisorDecision || "Pending"}
        Supervisor Remarks: ${item.supervisorRemarks || "None"}

        Principal Decision: ${item.principalDecision || "Pending"}
        Principal Remarks: ${item.principalRemarks || "None"}
    `;

    await triggerSendGrid(recipients, `Leave Update: ${status} - ${item.applicantEmail}`, body);
}

/**
 * Core Function: Sends Review Requests with Links to Supervisors/Principal
 */
async function sendReviewEmail(recipient, role, item) {
    const page = role === "Principal" ? "principal-review" : "supervisor-review";
    const reviewLink = `https://www.hsgrabouw.co.za/${page}?appId=${item._id}`;
    
    const body = `
        Hello ${role},
        
        You have a new leave request to review for ${item.applicantEmail}.
        Please click the link below to complete your fields and submit:
        ${reviewLink}

        --- Application Details ---
        Dates: ${item.startingDate} to ${item.endDate} (${item.totalDays} days)
        Reason: ${item.reason}
        ${item.supervisorDecision ? `Supervisor Decision: ${item.supervisorDecision}` : ""}
    `;

    await triggerSendGrid(recipient, `${role} Review Required: ${item.applicantEmail}`, body);
}

/**
 * Interface with SendGrid API
 */
async function triggerSendGrid(to, subject, text) {
    try {
        const apiKey = await getSecret("SENDGRID_API_KEY");
        sgMail.setApiKey(apiKey);
        
        const msg = {
            to: Array.isArray(to) ? to : [to],
            from: SENDER_EMAIL,
            subject: subject,
            text: text,
        };
        
        await sgMail.send(msg);
    } catch (error) {
        console.error("SendGrid Error:", error);
    }
}
