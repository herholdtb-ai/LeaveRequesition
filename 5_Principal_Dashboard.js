import wixData from 'wix-data';

/**
 * PAGE: Principal Dashboard
 * This dashboard allows the Principal (bezuidenhouth@hsgrabouw.co.za) 
 * to finalize leave requests that have been reviewed by supervisors.
 */

$w.onReady(function () {
    loadPrincipalQueue();
});

async function loadPrincipalQueue() {
    try {
        // Query for requests specifically waiting for the Principal
        const results = await wixData.query("LeaveApplications")
            .eq("applicationStatus", "Pending: Principal")
            .find();

        if (results.items.length > 0) {
            $w('#repeaterPrincipal').data = results.items;
            $w('#repeaterPrincipal').onItemReady(($item, itemData) => {
                // Displaying core data
                $item('#txtApplicant').text = itemData.applicantEmail;
                $item('#txtSupervisor').text = `Supervisor: ${itemData.master_supervisor}`;
                $item('#txtDateRange').text = `${itemData.startingDate.toLocaleDateString()} - ${itemData.endDate.toLocaleDateString()}`;
                
                // Show Supervisor's Remarks for context
                $item('#txtSupRemarks').text = itemData.supervisorRemarks || "No remarks provided.";

                // Final Approval
                $item('#btnFinalApprove').onClick(async () => {
                    $item('#btnFinalApprove').disable();
                    await finalizeRequest(itemData._id, "Approved", $item('#inpPrincipalRemarks').value);
                });

                // Final Rejection
                $item('#btnFinalReject').onClick(async () => {
                    $item('#btnFinalReject').disable();
                    await finalizeRequest(itemData._id, "Rejected", $item('#inpPrincipalRemarks').value);
                });
            });
        } else {
            $w('#repeaterPrincipal').hide();
            $w('#txtEmptyMessage').show();
        }
    } catch (error) {
        console.error("Principal load error:", error);
    }
}

/**
 * Finalizes the record.
 * This update triggers the data.js 'afterUpdate' hook to send the FINAL email.
 */
async function finalizeRequest(id, decision, remarks) {
    try {
        const item = await wixData.get("LeaveApplications", id);
        
        item.principalDecision = decision;
        item.principalRemarks = remarks || "";
        item.applicationStatus = "Complete"; // This is the trigger for the final email

        await wixData.update("LeaveApplications", item);
        
        // Refresh the repeater
        loadPrincipalQueue();
    } catch (err) {
        console.error("Finalize failed:", err);
    }
}
