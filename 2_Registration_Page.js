import { getSecret } from 'wix-secrets-backend';
import sgMail from '@sendgrid/mail';
import wixData from 'wix-data';

const SENDER_EMAIL = "info@hsgrabouw.co.za";
const BASE_URL = "https://www.hsgrabouw.co.za";

/**
 * Sends a SendGrid email
 */
async function sendEmail(to, subject, body) {
    const apiKey = await getSecret("SENDGRID_API_KEY");
    sgMail.setApiKey(apiKey);
    const msg = { to, from: SENDER_EMAIL, subject, text: body };
    return sgMail.send(msg);
}

/**
 * STEP 1: Initial Registration
 * Called from the frontend Registration Page.
 */
export async function registerStaff(staffData) {
    const item = {
        ...staffData,
        status: "Unverified", // Initial state
        registrationTimestamp: new Date()
    };

    const inserted = await wixData.insert("UserRegistry", item);
    
    // Send Verification Email to User
    const verifyLink = `${BASE_URL}/verify-email?id=${inserted._id}`;
    const body = `Welcome to HS Grabouw,\n\nPlease verify your email address by clicking here: ${verifyLink}`;
    
    await sendEmail(inserted.email, "Verify your HS Grabouw Account", body);
    return { success: true };
}

/**
 * STEP 2: Email Verification Logic
 * Called from a hidden 'Verify' page when the user clicks their link.
 */
export async function verifyUserEmail(userId) {
    const user = await wixData.get("UserRegistry", userId);
    
    if (user && user.status === "Unverified") {
        user.status = "Pending"; // Mark as Pending after email is verified
        await wixData.update("UserRegistry", user);

        // Send Confirmation Request to Supervisor
        const confirmLink = `${BASE_URL}/confirm-staff?id=${user._id}`;
        const supBody = `Hello,\n\n${user.title} has registered on the Leave System and listed you as their supervisor.\n\nPlease confirm that this staff member reports to you by clicking here: ${confirmLink}`;
        
        await sendEmail(user.supervisorEmail, `Confirm Reporting Line: ${user.title}`, supBody);
        return { success: true };
    }
    return { success: false };
}

/**
 * STEP 3: Supervisor Confirmation Logic
 * Called from a hidden 'Confirm Staff' page for the supervisor.
 */
export async function supervisorConfirmStaff(userId) {
    const user = await wixData.get("UserRegistry", userId);
    
    if (user && user.status === "Pending") {
        user.status = "Confirmed Supervisor"; // DH has vouched for them
        await wixData.update("UserRegistry", user);
        
        // Notify Principal that a user is ready for final approval
        const prinBody = `A new staff member, ${user.title}, has verified their email and been confirmed by their supervisor (${user.supervisorEmail}).\n\nPlease finalize approval in your dashboard.`;
        await sendEmail("bezuidenhouth@hsgrabouw.co.za", "Action Required: Final User Approval", prinBody);
        
        return { success: true };
    }
    return { success: false };
}
