import { verifyUserEmail } from 'backend/registration.jsw';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    const userId = wixLocation.query.id;

    if (userId) {
        try {import wixLocation from 'wix-location';
import { validateAndUseToken } from 'backend/security.jsw';
import wixData from 'wix-data';

$w.onReady(async function () {
    const token = wixLocation.query.token;

    if (token) {
        const validation = await validateAndUseToken(token, "Registration");
        if (validation.valid) {
            // Update User status in Registry
            const userResults = await wixData.query("UserRegistry").eq("email", validation.email).find();
            if (userResults.items.length > 0) {
                let user = userResults.items[0];
                user.status = "Pending";
                user.emailVerified = true;
                await wixData.update("UserRegistry", user);
                $w("#txtStatus").text = "Email Verified! Awaiting Supervisor confirmation.";
            }
        } else {
            $w("#txtStatus").text = "Invalid or expired link.";
        }
    }
});
        } catch (err) {
            $w('#txtStatus').text = "An error occurred during verification.";
            console.error(err);
        }
    } else {
        $w('#txtStatus').text = "Invalid verification link.";
    }
});
