import wixData from 'wix-data';

/**
 * PAGE: DH Dashboard (Department Head Review)
 * This dashboard displays leave requests where the current user is the 'master_supervisor'.
 */

$w.onReady(function () {
    loadPendingRequests();
});

async function loadPendingRequests() {
    try {
        // Find requests where status is 'Pending Supervisor'
        // The data.js logic handles the 'master_supervisor' calculation automatically
        const results = await wixData.query("LeaveApplications")
            .eq("applicationStatus", "Pending Supervisor")
            .find();

        if (results.items.length > 0) {
            $w('#repeaterRequests').data = results.items;
            $w('#repeaterRequests').onItemReady(($item, itemData) => {
                // Populate UI Elements
                $item('#textEducator').text = itemData.applicantEmail;
                $item('#textDates').text = `${itemData.startingDate.toLocaleDateString()} to ${itemData.endDate.toLocaleDateString()}`;
                $item('#textReason').text = itemData.reason;

                // Approve Button Logic
                $item('#btnApprove').onClick(async () => {
                    $item('#btnApprove').disable();
                    await updateRequestStatus(itemData._id, "Supported", "Pending: Principal", $item('#inpRemarks').value);
                });

                // Reject Button Logic
                $item('#btnReject').onClick(async () => {
                    $item('#btnReject').disable();
                    await updateRequestStatus(itemData._id, "Not Supported", "Complete", $item('#inpRemarks').value);
                });
            });
        } else {
            $w('#repeaterRequests').hide();
            $w('#txtNoRequests').show(); // Show a 'No pending reviews' message
        }
    } catch (error) {
        console.error("Failed to load requests:", error);
    }
}

/**
 * Updates the database. 
 * Note: Changing status here triggers the automated emails in data.js
 */
async function updateRequestStatus(id, decision, nextStatus, remarks) {
    try {
        const toUpdate = await wixData.get("LeaveApplications", id);
        
        toUpdate.supervisorDecision = decision;
        toUpdate.applicationStatus = nextStatus;
        toUpdate.supervisorRemarks = remarks || "No remarks";

        await wixData.update("LeaveApplications", toUpdate);
        
        // Refresh the list to remove the processed item
        loadPendingRequests();
    } catch (err) {
        console.error("Update failed:", err);
    }
}
