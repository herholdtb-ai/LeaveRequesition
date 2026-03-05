# Wix/Velo Leave Application Complete Implementation Checklist

This checklist is your step-by-step guide to installing the code and setting up the UI in your Wix Editor.

---

## 🛠 Step 1: Editor & Database Setup
- [ ] **Turn on Dev Mode**: Open your Wix Editor, go to the top menu, click **Dev Mode**, and select **Turn on Dev Mode**.
- [ ] **Create `UserRegistry` Collection**: Go to CMS -> Create Collection. Name it **UserRegistry**. Add fields: `title` (Text), `email` (Text), `supervisorEmail` (Text), `status` (Text).
- [ ] **Create `LeaveApplications` Collection**: Create a collection named **LeaveApplications**. Add fields: `applicantEmail` (Text), `startingDate` (Date and Time), `endDate` (Date and Time), `totalDays` (Number), `actingSupervisorEmail` (Text), `reason` (Text), `contingencyData` (Object), `applicationStatus` (Text), `decision` (Text), `remarks` (Text).

---

## ⚙️ Step 2: Backend Code Installation
- [ ] **Data Hooks**: In your Velo sidebar on the left, under `Backend`, hover over the `backend` folder and click the `+` to add a new file. Name it **exactly** `data.js`. Paste the contents of `data.js` into this file.
- [ ] **Registration Module**: Under the same `backend` folder, add a new Web Module (a `.jsw` file). Name it **exactly** `registration.jsw`. Paste the contents of `registration.jsw` into this file.

---

## 📝 Step 3: Educator Registration Page
- [ ] Create a new blank page named **Educator Registration**.
- [ ] Add the following input fields, and in the properties panel (right side), change their **ID** to exactly match:
  - Staff Name Input: `#inpStaffName`
  - Email Input: `#inpStaffEmail`
  - Supervisor Email Input: `#inpSupervisorEmail`
  - Password Input: `#inpPassword`
- [ ] Add a Submit Button and change its ID to `#btnRegister`.
- [ ] Add two Text elements for messages. Change their IDs and set them to "Hidden on load" in the properties panel:
  - Error Text: `#txtErrorMsg` (Make it red)
  - Success Text: `#txtSuccessMsg` (Make it green)
- [ ] Paste the code from `2_Registration_Page.js` into the Page Code panel at the bottom.

---

## 📝 Step 4: Leave Request Page
- [ ] Create a new blank page named **Apply for Leave**.
- [ ] Make sure this page has its permissions set to **Members Only**.
- [ ] Add the following elements and change their IDs in the properties panel:
  - Name Input (Read-only): `#inpApplicantName`
  - Email Input (Read-only): `#inpApplicantEmail`
  - Acting Supervisor Input: `#inpDirectSupervisor`
  - Start DatePicker: `#dateStart`
  - End DatePicker: `#dateEnd`
  - Total Days Input (Read-only): `#inpTotalDays`
  - Reason TextBox: `#inpReason`
  - Contingency TextBoxes (Add 7 of them): `#inpPeriod1`, `#inpPeriod2`, `#inpPeriod3`, `#inpPeriod4`, `#inpPeriod5`, `#inpPeriod6`, `#inpPeriod7`
  - Truthfulness Checkbox: `#checkboxTruthfulness`
  - Message Text (Hidden on load): `#txtMessage`
  - Submit Button: `#btnSubmit`
- [ ] Paste the code from `3_Leave_Request_Page.js` into the Page Code panel.

---

## 📝 Step 5: Department Head (Supervisor) Dashboard
- [ ] Create a new private page named **DH Dashboard**.
- [ ] Add a Repeater element and change its ID to `#repeaterRequests`.
- [ ] **Inside the Repeater**, add the following elements and change their IDs:
  - Text for Educator Email: `#textEducator`
  - Text for Dates: `#textDates`
  - Text for Reason: `#textReason`
  - Button to Approve: `#btnApprove`
  - Button to Reject: `#btnReject`
- [ ] Paste the code from `4_DH_Dashboard.js` into the Page Code panel.
- [ ] *Note: Update line 11 in that code to match the DH's actual department or filtering logic if desired.*

---

## 📝 Step 6: Principal Dashboard
- [ ] Create a new private page named **Principal Dashboard**.
- [ ] Add a Repeater for Registrations and change its ID to `#repeaterRegistrations`.
  - Inside it, add texts: `#textRegName`, `#textRegEmail`.
  - Add an Approve button: `#btnApproveReg` and a Reject button: `#btnRejectReg`.
- [ ] Add a Repeater for Leave Requests and change its ID to `#repeaterLeaveRequests`.
  - Inside it, add texts: `#textLeaveEducator`, `#textLeaveDates`, `#textLeaveReason`.
  - Add buttons: `#btnApproveLeave`, `#btnRejectLeave`.
- [ ] Paste the code from `5_Principal_Dashboard.js` into the Page Code panel.

---

## 📝 Step 7: My History Page
- [ ] Create a new page named **My Leave History**.
- [ ] Add an Email Input: `#inputEmail`.
- [ ] Add a Button: `#btnLoadHistory`.
- [ ] Add a Repeater: `#repeaterHistory`.
  - Inside it, add texts: `#textDates`, `#textReason`, `#textStatus`.
- [ ] Paste the code from `7_My_History_Page.js` into the Page Code panel.

---

## ⚡ Step 8: Wix Automations (Email Triggers)
- [ ] Go to your Wix Dashboard -> **Automations**.
- [ ] Create the automations based on the data changes in your collections, as documented closely in `6_Backend_Workflow.md`. You will use standard trigger conditions on the `LeaveApplications` and `UserRegistry` status fields to send emails natively through Wix Automations.
