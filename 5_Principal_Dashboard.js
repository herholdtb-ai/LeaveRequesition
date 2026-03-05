// PAGE: Principal Dashboard
// INSTRUCTIONS:
// 1. Create a private page for the Principal.
// 2. Add two Repeaters:
//    - Registration Repeater (#repeaterRegistrations) to approve new educators.
//    - Leave Request Repeater (#repeaterLeaveRequests) to finally approve leave requests.
// 3. In the Registration Repeater, add texts for Name & Email, and an Approve button (#btnApproveReg).
// 4. In the Leave Request Repeater, add texts for Educator, Dates, Reason, and an Approve button (#btnApproveLeave) and Reject button (#btnRejectLeave).

import wixData from 'wix-data';
import { notifyStaffApproved, notifyStaffDeclined } from 'backend/registration.jsw';
import { authentication } from 'wix-members-frontend';

$w.onReady(function () {
    loadPendingRegistrations();
    loadPendingLeaves();

    // Setup Registration Repeater
    $w('#repeaterRegistrations').onItemReady(($item, itemData, index) => {
        $item('#textRegName').text = itemData.title;
        $item('#textRegEmail').text = itemData.email;

        $item('#btnApproveReg').onClick(async () => {
            try {
                itemData.status = "Approved";
                await wixData.update("UserRegistry", itemData);
                await notifyStaffApproved(itemData.email);
                loadPendingRegistrations(); // Refresh list
            } catch (error) {
                console.error("Error approving registration:", error);
            }
        });

        $item('#btnRejectReg').onClick(async () => {
            try {
                itemData.status = "Declined";
                await wixData.update("UserRegistry", itemData);
                await notifyStaffDeclined(itemData.email);
                loadPendingRegistrations(); // Refresh list
            } catch (error) {
                console.error("Error declining registration:", error);
            }
        });
    });

    // Setup Leave Request Repeater
    $w('#repeaterLeaveRequests').onItemReady(($item, itemData, index) => {
        $item('#textLeaveEducator').text = itemData.educatorEmail;
        $item('#textLeaveDates').text = `${itemData.startDate.toLocaleDateString()} to ${itemData.endDate.toLocaleDateString()}`;
        $item('#textLeaveReason').text = itemData.reason;

        $item('#btnApproveLeave').onClick(async () => {
            await updateRequestStatus(itemData._id, "Complete", "Approved");
        });

        $item('#btnRejectLeave').onClick(async () => {
            await updateRequestStatus(itemData._id, "Complete", "Rejected");
        });
    });
});

async function loadPendingRegistrations() {
    try {
        const results = await wixData.query("UserRegistry")
            .eq("status", "Pending Principal")
            .find();

        $w('#repeaterRegistrations').data = results.items;
        if (results.items.length === 0) $w('#repeaterRegistrations').collapse();
        else $w('#repeaterRegistrations').expand();
    } catch (error) { console.error(error); }
}

async function loadPendingLeaves() {
    try {
        const results = await wixData.query("LeaveApplications")
            .eq("applicationStatus", "Pending: Principal")
            .find();

        $w('#repeaterLeaveRequests').data = results.items;
        if (results.items.length === 0) $w('#repeaterLeaveRequests').collapse();
        else $w('#repeaterLeaveRequests').expand();
    } catch (error) { console.error(error); }
}

async function updateRequestStatus(requestId, newStatus, decision) {
    try {
        let requestItem = await wixData.get("LeaveApplications", requestId);
        requestItem.applicationStatus = newStatus;
        requestItem.principalDecision = decision; // Record the principal's specific decision
        // requestItem.principalRemarks = "Optional remarks from principal input";
        await wixData.update("LeaveApplications", requestItem);
        loadPendingLeaves(); // Refresh list
    } catch (error) {
        console.error("Error updating status:", error);
    }
}
