// PAGE: My History (Educator Dashboard)
// INSTRUCTIONS:
// 1. Create a regular page (NOT a dynamic page) for Educators.
// 2. Add an input field for their email to verify identity: #inputEmail
// 3. Add a button to load their history: #btnLoadHistory
// 4. Add a Repeater to display their history: #repeaterHistory
// 5. Inside the repeater, add text elements: #textDates, #textReason, #textStatus

import wixData from 'wix-data';

$w.onReady(function () {
    // Hide the repeater initially until they search
    $w('#repeaterHistory').collapse();

    $w('#btnLoadHistory').onClick(async () => {
        const email = $w('#inputEmail').value;

        if (!email) {
            // Optional: Show an error message if email is empty
            return;
        }

        try {
            // Query the LeaveApplications database for ONLY this educator's requests
            const results = await wixData.query("LeaveApplications")
                .eq("applicantEmail", email)
                .descending("_createdDate") // Show newest requests first
                .find();

            // Populate the repeater with the results
            $w('#repeaterHistory').data = results.items;

            if (results.items.length > 0) {
                $w('#repeaterHistory').expand();
            } else {
                // Optional: Show a "No past requests found" message
                $w('#repeaterHistory').collapse();
            }

        } catch (error) {
            console.error("Error loading history:", error);
        }
    });

    // Map the database fields to the visual text elements inside the repeater
    $w('#repeaterHistory').onItemReady(($item, itemData, index) => {
        $item('#textDates').text = `${itemData.startingDate.toLocaleDateString()} to ${itemData.endDate.toLocaleDateString()}`;
        $item('#textReason').text = itemData.reason;

        // Display the current overall stage
        let statusString = `Stage: ${itemData.applicationStatus}\n`;

        // Append explicit decisions if they exist
        if (itemData.supervisorDecision) statusString += `DH: ${itemData.supervisorDecision}\n`;
        if (itemData.principalDecision) statusString += `Principal: ${itemData.principalDecision}`;

        $item('#textStatus').text = statusString.trim();

        // Optional: Change text color based on final outcome
        if (itemData.principalDecision === "Approved") {
            // $item('#textStatus').html = `<span style="color:green">${statusString.trim()}</span>`;
        } else if (itemData.principalDecision === "Rejected" || itemData.supervisorDecision === "Not Supported") {
            // $item('#textStatus').html = `<span style="color:red">${statusString.trim()}</span>`;
        }
    });
});
