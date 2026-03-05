import wixData from 'wix-data';
import sgMail from '@sendgrid/mail'; //
import { getSecret } from 'wix-secrets-backend'; //

// --- BEFORE INSERT HOOK ---
// Applies conditional routing BEFORE the record is saved to the database.
export async function LeaveApplications_beforeInsert(item, context) {
    // Auto-generate the submission timestamp
    item.submissionTimestamp = new Date();

    // Phase 3: Bypass Rule
    const principalEmail = "bezuidenhouth@hsgrabouw.co.za";

    // If DirectSupervisor (which could be the overridden "actingSupervisorEmail") 
    // is the Principal, skip the Supervisor status entirely.
    if (item.actingSupervisorEmail === principalEmail) {
        item.applicationStatus = "Pending: Principal";
    } else {
        item.applicationStatus = "Pending Supervisor";
    }

    return item;
}

// --- AFTER INSERT HOOK ---
// Triggers after record is safely saved.
export async function LeaveApplications_afterInsert(item, context) {
    const applicationId = item._id;
    const supervisorEmail = item.actingSupervisorEmail;

    // Phase 3: Notification
    if (item.applicationStatus === "Pending Supervisor") {
        const reviewLink = `https://www.hsgrabouw.co.za/supervisor-review?appId=${applicationId}`;
        console.log(`[Phase 3] Notifying Supervisor (${supervisorEmail}) to review application. Link: ${reviewLink}`);
    } else if (item.applicationStatus === "Pending: Principal") {
        const reviewLink = `https://www.hsgrabouw.co.za/principal-review?appId=${applicationId}`;
        console.log(`[Phase 3] Supervisor bypassed. Notifying Principal (bezuidenhouth@hsgrabouw.co.za) to review application. Link: ${reviewLink}`);
    }

    return item;
}

// --- BEFORE UPDATE HOOK ---
// Used when an existing record is edited (e.g. from the Review Page).
export async function LeaveApplications_beforeUpdate(item, context) {
    const originalItem = context.currentItem || await wixData.get("LeaveApplications", item._id);

    // Track when Supervisor makes a decision
    if (originalItem && originalItem.supervisorDecision !== item.supervisorDecision && item.supervisorDecision) {
        item.supervisorDecisionTimestamp = new Date();
    }

    // Track when Principal makes a decision
    if (originalItem && originalItem.principalDecision !== item.principalDecision && item.principalDecision) {
        item.principalDecisionTimestamp = new Date();
    }

    // Principal's Approval Remark Appending
    if (item.applicationStatus === "Complete" && item.principalDecision === "Approved") {
        if (originalItem && originalItem.applicationStatus !== "Complete") {
            const extraText = "Onthou: Jy moet nogsteeds 'n verlofvorm voltooi en indien by die kantoor! Heg ook aan by jou verlofvorm bewys van jou afwesigheid (bv. siekbrief) indien nodig. Heg ook 'n uitdruk van hierdie skrywe aan by jou verlofvorm.";

            if (item.principalRemarks) {
                item.principalRemarks += "\n\n" + extraText;
            } else {
                item.principalRemarks = extraText;
            }
        }
    }

    return item;
}

// --- AFTER UPDATE HOOK ---
export async function LeaveApplications_afterUpdate(item, context) {
    const originalItem = context.currentItem;

    if (originalItem && originalItem.applicationStatus !== "Complete" && item.applicationStatus === "Complete") {
        const adminEmail = "admin@hsgrabouw.co.za";
        const supervisorEmail = item.actingSupervisorEmail;
        const applicantEmail = item.applicantEmail;

        const formatTime = (dateObj) => dateObj ? dateObj.toLocaleString() : "N/A";

        // Updated email body to include Substitution/Contingency Data
        const emailContent = {
            subject: `Leave Application Complete - ${applicantEmail}`,
            body: `
                Applicant: ${applicantEmail}
                Submitted At: ${formatTime(item.submissionTimestamp)}
                
                Start: ${item.startingDate}
                End: ${item.endDate}
                Total Days: ${item.totalDays}
                Reason: ${item.reason}

                --- Substitution/Contingency Data ---
                Period 1: ${item.contingencyData?.p1 || "No arrangement"}
                Period 2: ${item.contingencyData?.p2 || "No arrangement"}
                Period 3: ${item.contingencyData?.p3 || "No arrangement"}
                Period 4: ${item.contingencyData?.p4 || "No arrangement"}
                Period 5: ${item.contingencyData?.p5 || "No arrangement"}
                Period 6: ${item.contingencyData?.p6 || "No arrangement"}
                Period 7: ${item.contingencyData?.p7 || "No arrangement"}
                
                Supervisor Decision: ${item.supervisorDecision || "N/A"} (${formatTime(item.supervisorDecisionTimestamp)})
                Supervisor Remarks: ${item.supervisorRemarks || "None"}
                
                Principal Decision: ${item.principalDecision || "N/A"} (${formatTime(item.principalDecisionTimestamp)})
                Principal Remarks: ${item.principalRemarks || "None"}
            `
        };

        // --- ACTIVE SENDGRID IMPLEMENTATION ---
        try {
            const apiKey = await getSecret("SENDGRID_API_KEY");
            sgMail.setApiKey(apiKey);
            
            const msg = {
                to: [applicantEmail, supervisorEmail, adminEmail],
                from: 'admin@hsgrabouw.co.za',
                subject: emailContent.subject,
                text: emailContent.body,
            };
            
            await sgMail.send(msg);
            console.log("Detailed history email sent successfully via SendGrid!");
        } catch (error) {
            console.error("Failed to send SendGrid email:", error);
        }
    }

    return item;
}
