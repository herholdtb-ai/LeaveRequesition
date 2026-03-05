import wixData from 'wix-data';
// import sgMail from '@sendgrid/mail'; // Make sure to install @sendgrid/mail in Wix NPM Packages

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
        // Trigger an email to the Supervisor with a link to a "Review Page"
        const reviewLink = `https://www.hsgrabouw.co.za/supervisor-review?appId=${applicationId}`;
        console.log(`[Phase 3] Notifying Supervisor (${supervisorEmail}) to review application. Link: ${reviewLink}`);
        // wixCrmBackend.emails.sendEmail({...});
    } else if (item.applicationStatus === "Pending: Principal") {
        // Notify Principal immediately if bypassed
        const reviewLink = `https://www.hsgrabouw.co.za/principal-review?appId=${applicationId}`;
        console.log(`[Phase 3] Supervisor bypassed. Notifying Principal (bezuidenhouth@hsgrabouw.co.za) to review application. Link: ${reviewLink}`);
        // wixCrmBackend.emails.sendEmail({...});
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

    // Only run this logic if the update came in as an approval
    // Specifically looking for the Principal's Approval
    if (item.applicationStatus === "Complete" && item.principalDecision === "Approved") {

        // We need to check the OLD item from DB to see if `Complete` is a NEW status, 
        // preventing us from appending text multiple times to remarks if updated again.
        if (originalItem && originalItem.applicationStatus !== "Complete") {
            // Phase 3: Principal's Approval Remark Appending
            const extraText = "Onthou: Jy moet nogsteeds 'n verlofvorm voltooi en indien by die kantoor! Heg ook aan by jou verlofvorm bewys van jou afwesigheid (bv. siekbrief) indien nodig. Heg ook 'n uitdruk van hierdie skrywe aan by jou verlofvorm.";

            // Append it to remarks smoothly
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
    // Check if the status literally changed to "Complete"
    const originalItem = context.currentItem; // old db state

    if (originalItem && originalItem.applicationStatus !== "Complete" && item.applicationStatus === "Complete") {
        // Phase 3: Final Export
        const adminEmail = "admin@hsgrabouw.co.za";
        const supervisorEmail = item.actingSupervisorEmail;
        const applicantEmail = item.applicantEmail;

        // Format dates safely if they exist
        const formatTime = (dateObj) => dateObj ? dateObj.toLocaleString() : "N/A";

        const emailContent = {
            subject: `Leave Application Complete - ${applicantEmail}`,
            body: `
                Applicant: ${applicantEmail}
                Submitted At: ${formatTime(item.submissionTimestamp)}
                
                Start: ${item.startingDate}
                End: ${item.endDate}
                Total Days: ${item.totalDays}
                Reason: ${item.reason}
                
                Supervisor Decision: ${item.supervisorDecision || "N/A"} (${formatTime(item.supervisorDecisionTimestamp)})
                Supervisor Remarks: ${item.supervisorRemarks || "None"}
                
                Principal Decision: ${item.principalDecision || "N/A"} (${formatTime(item.principalDecisionTimestamp)})
                Principal Remarks: ${item.principalRemarks || "None"}
            `
        };

        // Notify all 3 relevant parties
        console.log(`[Phase 3 Final Export] Emailing: ${adminEmail}, ${supervisorEmail}, ${applicantEmail}`);
        console.log("Email Payload: ", emailContent);

        // --- SENDGRID IMPLEMENTATION ---
        // Sending raw text to arbitrary emails is best done via SendGrid in Velo.
        // 1. Install "@sendgrid/mail" in the Wix NPM packages panel.
        // 2. Uncomment the import at the top of this file and the code below.
        // 3. Add your SendGrid API key securely in the Wix Secrets Manager.

        /*
        import { getSecret } from 'wix-secrets-backend';
        
        try {
            const apiKey = await getSecret("SENDGRID_API_KEY");
            sgMail.setApiKey(apiKey);
            
            const msg = {
                to: [applicantEmail, supervisorEmail, adminEmail],
                from: 'admin@hsgrabouw.co.za', // Must be a verified sender in SendGrid
                subject: emailContent.subject,
                text: emailContent.body,
            };
            
            await sgMail.send(msg);
            console.log("Detailed history email sent successfully via SendGrid!");
        } catch (error) {
            console.error("Failed to send SendGrid email:", error);
        }
        */
    }

    return item;
}
