import wixData from 'wix-data';
import wixUsers from 'wix-users';

/**
 * PAGE: Apply for Leave
 * This script handles the Educator's leave application form.
 * It pre-fills user details and handles the logic for Original vs Acting Supervisors.
 */

$w.onReady(async function () {
    let currentUser = wixUsers.currentUser;

    // 1. Initial Load: Pre-fill Applicant Information
    if (currentUser.loggedIn) {
        try {
            let userEmail = await currentUser.getEmail();
            
            // Query the UserRegistry to get the staff member's details
            const registryQuery = await wixData.query("UserRegistry")
                .eq("email", userEmail)
                .find();

            if (registryQuery.items.length > 0) {
                const userRecord = registryQuery.items[0];

                // Check if account is approved before allowing submission
                if (userRecord.status === "Approved") {
                    $w('#inpApplicantName').value = userRecord.title;
                    $w('#inpApplicantEmail').value = userRecord.email;
                    
                    // Pre-fill the Original Supervisor field from Registry
                    // The staff member can then optionally fill the Acting Supervisor field
                    $w('#inpOriginalSupervisor').value = userRecord.supervisorEmail;
                } else {
                    $w('#btnSubmit').disable();
                    $w('#txtMessage').text = "Account status is currently: " + userRecord.status + ". You cannot submit requests yet.";
                    $w('#txtMessage').show();
                }
            } else {
                $w('#txtMessage').text = "Error: Staff profile not found in Registry.";
                $w('#txtMessage').show();
            }
        } catch (err) {
            console.error("Error loading user data:", err);
        }
    }

    // 2. Calculation Logic for Total Days
    $w('#dateStart').onChange(calculateDays);
    $w('#dateEnd').onChange(calculateDays);

    function calculateDays() {
        const start = $w('#dateStart').value;
        const end = $w('#dateEnd').value;
        
        if (start && end) {
            // Calculate inclusive days
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
            
            $w('#inpTotalDays').value = diffDays > 0 ? diffDays.toString() : "0";
        }
    }

    // 3. Submission Logic
    $w('#btnSubmit').onClick(async () => {
        // Validation: Truthfulness Checkbox
        if (!$w('#checkboxTruthfulness').checked) {
            $w('#txtMessage').text = "Please confirm the declaration of truthfulness.";
            $w('#txtMessage').show();
            return;
        }

        // Validation: Basic Fields
        if (!$w('#dateStart').value || !$w('#dateEnd').value || !$w('#inpReason').value) {
            $w('#txtMessage').text = "Please complete all required fields.";
            $w('#txtMessage').show();
            return;
        }

        $w('#btnSubmit').disable();
        $w('#txtMessage').text = "Submitting application...";
        $w('#txtMessage').show();

        /**
         * Mapping to Database ID: LeaveApplications
         * originalSupervisorEmail: The staff member's usual DH.
         * actingSupervisorEmail: The manual override (if any) entered on the page.
         */
        const applicationObj = {
            "applicantEmail": $w('#inpApplicantEmail').value,
            "startingDate": $w('#dateStart').value,
            "endDate": $w('#dateEnd').value,
            "totalDays": Number($w('#inpTotalDays').value),
            "originalSupervisorEmail": $w('#inpOriginalSupervisor').value,
            "actingSupervisorEmail": $w('#inpActingSupervisor').value, // NEW: Maps to the acting supervisor input
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
            "applicationStatus": "Pending Supervisor" // Backend hook will handle bypass if master_supervisor is Principal
        };

        try {
            await wixData.insert("LeaveApplications", applicationObj);
            $w('#txtMessage').text = "Application submitted successfully! Check your email for confirmation.";
            
            // Optional: Reset specific fields
            $w('#inpReason').value = "";
            $w('#inpActingSupervisor').value = "";
        } catch (error) {
            console.error("Submission failed:", error);
            $w('#txtMessage').text = "Submission failed. Please try again or contact the administrator.";
            $w('#btnSubmit').enable();
        }
    });
});
