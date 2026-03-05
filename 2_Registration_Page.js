import wixData from 'wix-data';
import wixUsers from 'wix-users';

/**
 * PAGE: Staff Registration
 * Captures initial staff details and the DEFAULT supervisor.
 */

$w.onReady(function () {
    $w('#btnRegister').onClick(async () => {
        $w('#btnRegister').disable();
        $w('#txtMsg').text = "Processing registration...";

        const email = $w('#inpEmail').value;
        const password = $w('#inpPassword').value;

        try {
            // 1. Create the Wix Member
            const registrationResult = await wixUsers.register(email, password);
            
            // 2. Create the UserRegistry record
            const registryData = {
                "title": $w('#inpFullName').value,
                "email": email,
                "supervisorEmail": $w('#inpDefaultSupervisor').value, // This becomes 'originalSupervisorEmail' later
                "status": "Pending Confirmation"
            };

            await wixData.insert("UserRegistry", registryData);
            
            $w('#txtMsg').text = "Registration successful! Your supervisor and the principal must now approve your account.";
        } catch (err) {
            console.error(err);
            $w('#txtMsg').text = "Registration failed. Email might already be in use.";
            $w('#btnRegister').enable();
        }
    });
});
