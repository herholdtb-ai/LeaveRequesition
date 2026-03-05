// PAGE: Leave Request Form
// INSTRUCTIONS:
// 1. Add inputs: #inpApplicantName, #inpApplicantEmail, #inpDirectSupervisor.
// 2. Add date pickers: #dateStart, #dateEnd.
// 3. Add text inputs: #inpTotalDays, #inpReason, #inpPeriod1 to #inpPeriod7.
// 4. Add a checkbox: #checkboxTruthfulness.
// 5. Add a submit button (#btnSubmit) and a message text (#txtMessage).

import wixData from 'wix-data';
import wixUsers from 'wix-users';

$w.onReady(async function () {
    // 1. Get Logged-in User
    let currentUser = wixUsers.currentUser;

    if (currentUser.loggedIn) {
        try {
            // Get user email from wix-users
            let userEmail = await currentUser.getEmail();

            // 2. Query UserRegistry
            const registryQuery = await wixData.query("UserRegistry")
                .eq("email", userEmail)
                .find();

            if (registryQuery.items.length > 0) {
                const userRecord = registryQuery.items[0];

                // Check if they are fully approved
                if (userRecord.status !== "Approved") {
                    $w('#txtMessage').text = `Your account status is: ${userRecord.status}. You cannot submit leave yet.`;
                    $w('#txtMessage').expand();
                    $w('#btnSubmit').disable();
                } else {
                    // 3. Dynamic Prefill
                    $w('#inpApplicantName').value = userRecord.title;
                    $w('#inpApplicantEmail').value = userRecord.email;
                    // Pre-fill supervisor but allow override for "Acting" supervisor
                    $w('#inpDirectSupervisor').value = userRecord.supervisorEmail;
                    $w('#txtMessage').collapse();
                }
            } else {
                $w('#txtMessage').text = "We could not find your profile in the registry.";
                $w('#txtMessage').expand();
                $w('#btnSubmit').disable();
            }
        } catch (error) {
            console.error("Error loading profile:", error);
            $w('#txtMessage').text = "Error loading your profile data.";
            $w('#txtMessage').expand();
        }
    } else {
        $w('#txtMessage').text = "Please log in to apply for leave.";
        $w('#txtMessage').expand();
        $w('#btnSubmit').disable();
    }

    // 4. Date Calculation Logic
    // Trigger recalculation when dates change
    $w('#dateStart').onChange(calculateDays);
    $w('#dateEnd').onChange(calculateDays);

    function calculateDays() {
        const start = $w('#dateStart').value;
        const end = $w('#dateEnd').value;

        if (start && end) {
            // Calculate difference in time (milliseconds)
            const differenceInTime = end.getTime() - start.getTime();
            // Calculate difference in days (+1 to include both start and end days if applicable)
            const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24)) + 1;

            if (differenceInDays > 0) {
                $w('#inpTotalDays').value = differenceInDays.toString();
            } else {
                $w('#inpTotalDays').value = "0";
                $w('#txtMessage').text = "End date must be after start date.";
                $w('#txtMessage').expand();
            }
        }
    }

    // 5. Submission Logic
    $w('#btnSubmit').onClick(async () => {
        // Validation
        const isTruthful = $w('#checkboxTruthfulness').checked;
        if (!isTruthful) {
            $w('#txtMessage').text = "You must declare the information is true before submitting.";
            $w('#txtMessage').expand();
            return;
        }

        const name = $w('#inpApplicantName').value;
        const email = $w('#inpApplicantEmail').value;
        const supervisor = $w('#inpDirectSupervisor').value; // Potentially an Acting Supervisor
        const start = $w('#dateStart').value;
        const end = $w('#dateEnd').value;
        const totalDays = Number($w('#inpTotalDays').value);
        const reason = $w('#inpReason').value;

        if (!start || !end || totalDays <= 0 || !reason) {
            $w('#txtMessage').text = "Please fill in all required fields properly.";
            $w('#txtMessage').expand();
            return;
        }

        $w('#btnSubmit').disable();
        $w('#txtMessage').text = "Submitting application...";
        $w('#txtMessage').expand();

        try {
            // We use contingencyData as a JSON object for Periods 1-7
            // Assuming there are input fields `#inpPeriod1` through `#inpPeriod7` on the form
            const contingencyData = {
                period1: $w('#inpPeriod1').value || "",
                period2: $w('#inpPeriod2').value || "",
                period3: $w('#inpPeriod3').value || "",
                period4: $w('#inpPeriod4').value || "",
                period5: $w('#inpPeriod5').value || "",
                period6: $w('#inpPeriod6').value || "",
                period7: $w('#inpPeriod7').value || ""
            };

            const applicationObj = {
                "applicantEmail": email, // Could also use registry reference ID here
                "startingDate": start,
                "endDate": end,
                "totalDays": totalDays,
                "actingSupervisorEmail": supervisor, // Editable field value
                "reason": reason,
                "contingencyData": contingencyData,
                // Status defaults to Pending Supervisor. 
                // Any bypass for Bezuidenhout is handled via Data Hooks on the backend.
                "applicationStatus": "Pending Supervisor"
            };

            await wixData.insert("LeaveApplications", applicationObj);

            $w('#txtMessage').text = "Leave application submitted successfully!";

            // Clear the form
            $w('#inpReason').value = "";
            $w('#checkboxTruthfulness').checked = false;
            // Clear contingency fields...
            for (let i = 1; i <= 7; i++) {
                $w(`#inpPeriod${i}`).value = "";
            }

        } catch (error) {
            console.error("Submission Error:", error);
            $w('#txtMessage').text = "Failed to submit application. Please try again.";
            $w('#btnSubmit').enable();
        }
    });
});
