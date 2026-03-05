import wixData from 'wix-data';
import wixUsers from 'wix-users';

/**
 * PAGE: Apply for Leave
 * This script handles the Educator's leave application form.
 * It maps 'Acting' vs 'Original' Supervisors for the backend data hook.
 */

$w.onReady(async function () {
    let currentUser = wixUsers.currentUser;

    if (currentUser.loggedIn) {
        try {
            let userEmail = await currentUser.getEmail();
            
            // Query the UserRegistry to get the staff member's default supervisor
            const registryQuery = await wixData.query("UserRegistry")
                .eq("email", userEmail)
                .find();

            if (registryQuery.items.length > 0) {
                const userRecord = registryQuery.items[0];

                if (userRecord.status === "Approved") {
                    $w('#inpApplicantName').value = userRecord.title;
                    $w('#inpApplicantEmail').value = userRecord.email;
                    
                    // PRE-FILL ORIGINAL SUPERVISOR
                    // This is hidden or read-only on your page
                    $w('#inpOriginalSupervisor').value = userRecord.supervisorEmail;
                } else {
                    $w('#btnSubmit').disable();
                    $w('#txtMessage').text = "Account not yet approved by Principal.";
                }
            }
        } catch (err) {
            console.error("User Registry Load Error:", err);
        }
    }

    // Days Calculation
    $w('#dateStart').onChange(calculateDays);
    $w('#dateEnd').onChange(calculateDays);

    function calculateDays() {
        const start = $w('#dateStart').value;
        const end = $w('#dateEnd').value;
        if (start && end) {
            const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
            $w('#inpTotalDays').value = diff > 0 ? diff.toString() : "0";
        }
    }

    // SUBMIT ACTION
    $w('#btnSubmit').onClick(async () => {
        if (!$w('#checkboxTruthfulness').checked) {
            $w('#txtMessage').text = "Please confirm the declaration.";
            return;
        }

        $w('#btnSubmit').disable();
        $w('#txtMessage').text = "Submitting to " + ($w('#inpActingSupervisor').value || $w('#inpOriginalSupervisor').value) + "...";

        const applicationObj = {
            "applicantEmail": $w('#inpApplicantEmail').value,
            "startingDate": $w('#dateStart').value,
            "endDate": $w('#dateEnd').value,
            "totalDays": Number($w('#inpTotalDays').value),
            
            // MAPPING FOR MASTER_SUPERVISOR LOGIC
            "originalSupervisorEmail": $w('#inpOriginalSupervisor').value,
            "actingSupervisorEmail": $w('#inpActingSupervisor').value, 
            
            "reason": $w('#inpReason').value,
            "contingencyData": {
                period1: $w('#inpPeriod1').value || "",
                period2: $w('#inpPeriod2').value || "",
                period3: $w('#inpPeriod3').value || "",
                period4: $w('#inpPeriod4').value || "",
                period5: $w('#inpPeriod5').value || "",
                period6: $w('#inpPeriod6').value || "",
                period7: $w('#inpPeriod7').value || ""
            },
            "applicationStatus": "Pending Supervisor" 
        };

        try {
            // This insert triggers the 'beforeInsert' hook in data.js
            await wixData.insert("LeaveApplications", applicationObj);
            $w('#txtMessage').text = "Success! Initial confirmation email sent from info@hsgrabouw.co.za.";
        } catch (error) {
            $w('#txtMessage').text = "Error saving to database.";
            $w('#btnSubmit').enable();
        }
    });
});
