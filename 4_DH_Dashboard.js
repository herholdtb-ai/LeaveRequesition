// PAGE: DH Dashboard
// INSTRUCTIONS:
// 1. Create a private page for Department Heads.
// 2. Add a Repeater (#repeaterRequests) to show pending requests.
// 3. Inside the repeater, add text elements: #textEducator, #textDates, #textReason.
// 4. Add an "Approve" button (#btnApprove) and "Reject" button (#btnReject) inside the repeater.

import wixData from 'wix-data';

// You would hardcode the DH's department here for simplicity, or pull it if they log in via Wix Members.
const myDepartment = "Maths"; // CHANGE THIS based on the DH's department for this specific page

$w.onReady(function () {
    loadPendingRequests();

    $w('#repeaterRequests').onItemReady(($item, itemData, index) => {
        $item('#textEducator').text = itemData.educatorEmail;
        $item('#textDates').text = `${itemData.startDate.toLocaleDateString()} to ${itemData.endDate.toLocaleDateString()}`;
        $item('#textReason').text = itemData.reason;

        $item('#btnApprove').onClick(async () => {
            // In a real app, you'd pull remarks from a text input inside the repeater.
            await updateRequestStatus(itemData._id, "Pending: Principal", "Supported", "Approved by DH");
        });

        $item('#btnReject').onClick(async () => {
            await updateRequestStatus(itemData._id, "Rejected", "Not Supported", "Rejected by DH");
        });
    });
});

async function loadPendingRequests() {
    try {
        const results = await wixData.query("LeaveRequests")
            .eq("department", myDepartment)
            .eq("applicationStatus", "Pending Supervisor") // Uses Phase 3 field 'applicationStatus' instead of 'status'
            .find();

        $w('#repeaterRequests').data = results.items;

        if (results.items.length === 0) {
            $w('#repeaterRequests').collapse();
            // Show a "No requests pending" text if desired
        } else {
            $w('#repeaterRequests').expand();
        }
    } catch (error) {
        console.error("Error loading requests:", error);
    }
}

async function updateRequestStatus(requestId, newStatus, decision, remarks) {
    try {
        let requestItem = await wixData.get("LeaveApplications", requestId);
        requestItem.applicationStatus = newStatus;
        requestItem.supervisorDecision = decision;
        requestItem.supervisorRemarks = remarks;
        await wixData.update("LeaveApplications", requestItem);
        // Reload list to remove the item from the dashboard
        loadPendingRequests();
    } catch (error) {
        console.error("Error updating status:", error);
    }
}
