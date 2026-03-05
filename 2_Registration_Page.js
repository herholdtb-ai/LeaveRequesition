// PAGE: Educator Registration
// INSTRUCTIONS:
// 1. Create a page with input fields for: Staff Name (#inpStaffName), Email (#inpStaffEmail), 
//    Supervisor Email (#inpSupervisorEmail), Password (#inpPassword).
// 2. Add a submit button (#btnRegister) and messages: error (#txtErrorMsg), success (#txtSuccessMsg).
// 3. Paste this code into the Page Code panel at the bottom.

import { registerStaffMember } from 'backend/registration.jsw';
import wixLocation from 'wix-location';

$w.onReady(function () {
    // When the submit button is clicked on the registry form
    $w('#btnRegister').onClick(async () => {
        const staffName = $w('#inpStaffName').value;
        const staffEmail = $w('#inpStaffEmail').value;
        const supervisorEmail = $w('#inpSupervisorEmail').value;
        const password = $w('#inpPassword').value;

        // Basic validation
        if (!staffName || !staffEmail || !supervisorEmail || !password) {
            $w('#txtErrorMsg').text = "Please fill in all required fields.";
            $w('#txtErrorMsg').expand();
            return;
        }

        $w('#btnRegister').disable();
        $w('#txtErrorMsg').collapse();
        $w('#txtSuccessMsg').text = "Submitting registration request...";
        $w('#txtSuccessMsg').expand();

        try {
            const result = await registerStaffMember(staffName, staffEmail, supervisorEmail, password);

            if (result.success) {
                $w('#txtSuccessMsg').text = "Registration submitted successfully! You will receive an email once your supervisor & principal have approved.";
            } else {
                $w('#txtErrorMsg').text = "An error occurred: " + result.error;
                $w('#txtErrorMsg').expand();
                $w('#txtSuccessMsg').collapse();
                $w('#btnRegister').enable();
            }
        } catch (error) {
            $w('#txtErrorMsg').text = "Something went wrong. Please try again later.";
            $w('#txtErrorMsg').expand();
            $w('#txtSuccessMsg').collapse();
            $w('#btnRegister').enable();
            console.error(error);
        }
    });
});
