import { verifyUserEmail } from 'backend/registration.jsw';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    const userId = wixLocation.query.id;

    if (userId) {
        try {
            const result = await verifyUserEmail(userId);
            if (result.success) {
                $w('#txtStatus').text = "Email verified! We've sent a confirmation request to your supervisor. You will be notified once they vouch for your reporting line.";
            } else {
                $w('#txtStatus').text = "Verification failed or already completed. Please contact info@hsgrabouw.co.za.";
            }
        } catch (err) {
            $w('#txtStatus').text = "An error occurred during verification.";
            console.error(err);
        }
    } else {
        $w('#txtStatus').text = "Invalid verification link.";
    }
});
