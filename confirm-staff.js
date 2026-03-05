import { supervisorConfirmStaff } from 'backend/registration.jsw';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    const userId = wixLocation.query.id;

    if (userId) {
        try {
            const result = await supervisorConfirmStaff(userId);
            if (result.success) {
                $w('#txtStatus').text = "Thank you! You have successfully confirmed this staff member reports to you. The Principal has been notified for final approval.";
            } else {
                $w('#txtStatus').text = "Confirmation failed. The link may have expired or the user is already confirmed.";
            }
        } catch (err) {
            $w('#txtStatus').text = "An error occurred while confirming the staff member.";
            console.error(err);
        }
    } else {
        $w('#txtStatus').text = "Invalid confirmation link.";
    }
});
