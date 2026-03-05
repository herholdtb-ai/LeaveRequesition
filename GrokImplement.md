import wixData from 'wix-data';

$w.onReady(function () {
    setupSupervisorDropdown();

    $w("#startingDate").onChange(calculateCalendarDays);
    $w("#endDate").onChange(calculateCalendarDays);

    const today = new Date();
    $w("#startingDate").minDate = today;
    $w("#endDate").minDate = today;
});

async function setupSupervisorDropdown() {
    try {
        const results = await wixData.query("UserRegistry")
            .eq("status", "Approved")
            .endsWith("email", "@hsgrabouw.co.za")
            .ascending("title")
            .find();

        if (results.items.length > 0) {
            const options = results.items.map(user => ({
                label: user.title,
                value: user.email
            }));
            $w("#dropdownSupervisor").options = options;
            $w("#dropdownSupervisor").placeholder = "Kies waarnemende toesighouer (opsioneel)";
        } else {
            $w("#dropdownSupervisor").placeholder = "Geen goedgekeurde toesighouers nie";
        }
    } catch (err) {
        console.error("Supervisor dropdown error:", err);
    }
}

function calculateCalendarDays() {
    const start = $w("#startingDate").value;
    const end   = $w("#endDate").value;

    if (start && end) {
        if (end < start) {
            $w("#txtTotalDays").text = "Ongeldige datumreeks";
            $w("#txtTotalDays").style.color = "red";
            return;
        }

        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        $w("#txtTotalDays").text = `${diffDays} kalenderdag(e)`;
        $w("#txtTotalDays").style.color = "black";
    } else {
        $w("#txtTotalDays").text = "Kies datums om totaal te sien";
    }
}

export function btnSubmit_click(event) {
    const start = $w("#startingDate").value;
    const end   = $w("#endDate").value;

    if (!start || !end || end < start) {
        event.preventDefault();
        return;
    }

    // Set acting supervisor from dropdown
    $w("#datasetLeave").setFieldValue("actingSupervisorEmail", $w("#dropdownSupervisor").value);
}
