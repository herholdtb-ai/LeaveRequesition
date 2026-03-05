# Email Notifications: Wix Automations vs Velo

There are two ways to send emails when leave applications are approved or rejected. You can use standard Wix Automations (no code) or the backend Velo Data hooks already set up in this system.

## Option 1: Standard Wix Automations (No Code - Includes Dynamic Data)
Wix Automations allows you to insert dynamic variables from the database directly into the email body without writing any code.

1. Go to your Wix Dashboard -> **Automations** -> **+ New Automation**.
2. **Trigger:** Select **Wix Data** -> **Item Updated**. Select the `LeaveApplications` Collection.
3. Click **Add Condition** -> `applicationStatus` -> **Equals** -> `"Complete"`.
4. **Action:** Select **Send an Email**.
5. **To:** Choose the dynamic field `applicantEmail`.
6. **Customize Email:** In the email editor, click the **"Add Dynamic Value"** button (usually represented by a `[ ]` or `{ }` icon).
   - You can pull in *any* database field into the email text! 
   - Example: *"Dear Applicant, your leave starting on **[startingDate]** for **[reason]** has been **[decision]**."*

## Option 2: Velo Data Hooks (Advanced - Already in `data.js`)
If you look at the `data.js` file included in this setup, there is an `afterUpdate` hook specifically designed to capture the entire history of the application and compile it into a single data object.

In `data.js`, look for:
```javascript
const emailContent = {
    subject: `Leave Application Complete - ${applicantEmail}`,
    body: `
        Applicant: ${applicantEmail}
        Start: ${item.startingDate}
        End: ${item.endDate}
        Total Days: ${item.totalDays}
        Reason: ${item.reason}
        Decision: ${item.decision}
        Remarks: ${item.remarks || "None"}
    `
};
```
This data hook automatically packages all the submitted fields into `emailContent.body`. To activate this, you simply need to connect Wix CRM or SendGrid where it says `// Use wixCrmBackend or Sendgrid here` in `data.js` (Lines 96-97). This gives you the most programmatic control over forming a comprehensive, standard form response.
