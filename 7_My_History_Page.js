import wixData from 'wix-data';
import wixUsers from 'wix-users';

/**
 * PAGE: My Leave History
 * Displays all past and current leave requests for the logged-in staff member.
 */

$w.onReady(async function () {
    let user = wixUsers.currentUser;
    if (user.loggedIn) {
        let email = await user.getEmail();
        loadHistory(email);
    }
});

async function loadHistory(email) {
    try {
        // Query for all requests by this applicant, sorted by most recent
        const results = await wixData.query("LeaveApplications")
            .eq("applicantEmail", email)
            .descending("submissionTimestamp")
            .find();

        if (results.items.length > 0) {
            $w('#repeaterHistory').data = results.items;
            $w('#repeaterHistory').onItemReady(($item, itemData) => {
                // 1. Status and Dates
                $item('#txtStatus').text = `Status: ${itemData.applicationStatus}`;
                $item('#txtDateRange').text = `${itemData.startingDate.toLocaleDateString()} to ${itemData.endDate.toLocaleDateString()}`;
                
                // 2. Supervisor Info (Shows either Original or Acting)
                $item('#txtMasterSupervisor').text = `Reviewed by: ${itemData.master_supervisor || "Pending"}`;
                
                // 3. Contingency Summary
                // We concatenate the period data for a quick view
                const p = itemData.contingencyData;
                $item('#txtContingency').text = `P1: ${p?.period1 || "-"} | P2: ${p?.period2 || "-"} | P3: ${p?.period3 || "-"} | P4: ${p?.period4 || "-"}`;

                // 4. Decision Trail
                // Show Supervisor feedback
                $item('#txtSupDecision').text = `Supervisor: ${itemData.supervisorDecision || "Pending"}`;
                $item('#txtSupRemarks').text = itemData.supervisorRemarks || "";

                // Show Principal feedback
                $item('#txtPrinDecision').text = `Principal: ${itemData.principalDecision || "Pending"}`;
                $item('#txtPrinRemarks').text = itemData.principalRemarks || "";
                
                // 5. Visual Feedback (Optional: Change color based on status)
                if (itemData.applicationStatus === "Complete") {
                    $item('#statusBox').style.backgroundColor = "#D4EDDA"; // Light Green
                } else if (itemData.applicationStatus.includes("Pending")) {
                    $item('#statusBox').style.backgroundColor = "#FFF3CD"; // Light Yellow
                }
            });
        } else {
            $w('#repeaterHistory').hide();
            $w('#txtNoHistory').show();
        }
    } catch (err) {
        console.error("History load error:", err);
    }
}
