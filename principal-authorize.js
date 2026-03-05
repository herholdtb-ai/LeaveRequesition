import wixLocation from 'wix-location';
import { validateAndUseToken } from 'backend/security.jsw';
import { principalAuthorizeStaff } from 'backend/registration.jsw';

/**
 * Principal Authorization Page
 * Validates the Principal's secure token to move a staff member 
 * from 'Confirmed Supervisor' to 'Approved'.
 */

$w.onReady(async function () {
    const token = wixLocation.query.token;

    if (!token) {
        $w("#txtStatus").text = "Geen sekuriteits-token gevind nie.";
        $w("#txtStatus").style.color = "red";
        return;
    }

    $w("#txtStatus").text = "Verifieer tans magtiging...";

    try {
        // 1. Validate the token specifically for "Approval" type
        const validation = await validateAndUseToken(token, "Approval");

        if (validation.valid) {
            // 2. Call the backend to update the UserRegistry status
            const result = await principalAuthorizeStaff(validation.email);

            if (result.success) {
                $w("#txtStatus").text = "Personeellid suksesvol gemagtig! 'n Welkom-e-pos is gestuur.";
                $w("#txtStatus").style.color = "green";
            } else {
                throw new Error(result.error);
            }
        } else {
            $w("#txtStatus").text = "Hierdie skakel is ongeldig of het reeds verval (48 uur verstreke).";
            $w("#txtStatus").style.color = "red";
        }
    } catch (err) {
        console.error("Authorization Page Error:", err);
        $w("#txtStatus").text = "Fout tydens magtiging. Kontak asseblief die stelseladministrateur.";
        $w("#txtStatus").style.color = "red";
    }
});
