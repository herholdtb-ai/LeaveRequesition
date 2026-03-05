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
 * Utility to send email via SendGrid
 */
async function sendEmail(to, subject, body) {
    try {
        const apiKey = await getSecret("SENDGRID_API_KEY");
        sgMail.setApiKey(apiKey);
        const msg = {
            to: Array.isArray(to) ? to : [to],
            from: SENDER_EMAIL,
            subject: subject,
            text: body,
        };
        await sgMail.send(msg);
    } catch (error) {
        console.error("Email Error:", error);
    }
}

/**
 * Builds the cumulative email body (The Exemplar)
 */
function buildEmailBody(item, statusLabel) {
    return `
Application Status: ${statusLabel}
--------------------------------------------------
APPLICANT DETAILS
Applicant: ${item.applicantEmail}
Submitted: ${formatTime(item.submissionTimestamp)}
Reason: ${item.reason}

LEAVE DATES
Start: ${item.startingDate}
End: ${item.endDate}
Total Days: ${item.totalDays}

SUBSTITUTION / CONTINGENCY
Period 1: ${item.contingencyData?.period1 || "N/A"}
Period 2: ${item.contingencyData?.period2 || "N/A"}
Period 3: ${item.contingencyData?.period3 || "N/A"}
Period 4: ${item.contingencyData?.period4 || "N/A"}
Period 5: ${item.contingencyData?.period5 || "N/A"}
Period 6: ${item.contingencyData?.period6 || "N/A"}
Period 7: ${item.contingencyData?.period7 || "N/A"}

SUPERVISOR REVIEW
Supervisor (Master): ${item.master_supervisor}
Decision: ${item.supervisorDecision || "Pending"}
Timestamp: ${formatTime(item.supervisorDecisionTimestamp)}
Remarks: ${item.supervisorRemarks || "None"}

PRINCIPAL REVIEW
Decision: ${item.principalDecision || "Pending"}
Timestamp: ${formatTime(item.principalDecisionTimestamp)}
Remarks: ${item.principalRemarks || "None"}
--------------------------------------------------
    `;
}

// --- DATABASE HOOKS ---

export async function LeaveApplications_beforeInsert(item, context) {
    item.submissionTimestamp = new Date();

    // Logic for master_supervisor: Use Acting if provided, otherwise Original
    if (item.actingSupervisorEmail && item.actingSupervisorEmail.trim() !== "") {
        item.master_supervisor = item.actingSupervisorEmail;
    } else {
        item.master_supervisor = item.originalSupervisorEmail;
    }

    // Bypass Logic based on master_supervisor
    if (item.master_supervisor === PRINCIPAL_EMAIL) {
        item.applicationStatus = "Pending: Principal";
    } else {
        item.applicationStatus = "Pending Supervisor";
    }
    
    return item;
}

export async function LeaveApplications_afterInsert(item, context) {
    // 1. Notify Applicant
    const applicantBody = buildEmailBody(item, "Submitted - Awaiting Review");
    await sendEmail(item.applicantEmail, `Leave Application Submitted: ${item.applicantEmail}`, applicantBody);

    // 2. Route Review Email
    if (item.applicationStatus === "Pending Supervisor") {
        // Send to the Master Supervisor
        const supervisorBody = buildEmailBody(item, "Action Required: Supervisor Review") + 
            `\nPlease review here: https://www.hsgrabouw.co.za/supervisor-review?appId=${item._id}`;
        await sendEmail(item.master_supervisor, `Action Required: Leave Review for ${item.applicantEmail}`, supervisorBody);
    } else {
        // Bypass to Principal
        const principalBody = buildEmailBody(item, "Action Required: Principal Review (Supervisor Bypassed)") +
            `\nPlease review here: https://www.hsgrabouw.co.za/principal-review?appId=${item._id}`;
        await sendEmail(PRINCIPAL_EMAIL, `Action Required: Principal Review for ${item.applicantEmail}`, principalBody);
    }
    return item;
}

export async function LeaveApplications_beforeUpdate(item, context) {
    const originalItem = context.currentItem || await wixData.get("LeaveApplications", item._id);

    if (originalItem && originalItem.supervisorDecision !== item.supervisorDecision && item.supervisorDecision) {
        item.supervisorDecisionTimestamp = new Date();
    }
    if (originalItem && originalItem.principalDecision !== item.principalDecision && item.principalDecision) {
        item.principalDecisionTimestamp = new Date();
    }

    if (item.applicationStatus === "Complete" && item.principalDecision === "Approved") {
        if (originalItem && originalItem.applicationStatus !== "Complete") {
            const extraText = "Onthou: Jy moet nogsteeds 'n verlofvorm voltooi en indien by die kantoor! Heg ook aan by jou verlofvorm bewys van jou afwesigheid (bv. siekbrief) indien nodig. Heg ook 'n uitdruk van hierdie skrywe aan by jou verlofvorm.";
            item.principalRemarks = item.principalRemarks ? `${item.principalRemarks}\n\n${extraText}` : extraText;
        }
    }
    return item;
}

export async function LeaveApplications_afterUpdate(item, context) {
    const originalItem = context.currentItem;

    if (originalItem.applicationStatus === "Pending Supervisor" && item.applicationStatus === "Pending: Principal") {
        const applicantBody = buildEmailBody(item, "Supervisor Review Complete - Sent to Principal");
        await sendEmail(item.applicantEmail, "Leave Application Update: Supervisor Reviewed", applicantBody);

        const principalBody = buildEmailBody(item, "Action Required: Principal Final Review") +
            `\nReview Link: https://www.hsgrabouw.co.za/principal-review?appId=${item._id}`;
        await sendEmail(PRINCIPAL_EMAIL, `Action Required: Final Leave Review for ${item.applicantEmail}`, principalBody);
    }

    if (originalItem.applicationStatus !== "Complete" && item.applicationStatus === "Complete") {
        const finalBody = buildEmailBody(item, "Application Process Finalized");
        const recipients = [item.applicantEmail, item.master_supervisor, "admin@hsgrabouw.co.za"];
        await sendEmail(recipients, `Leave Application FINALIZED: ${item.applicantEmail}`, finalBody);
    }
    return item;
}
