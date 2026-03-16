async function aanvraagKey() {
    console.log("Key process gestart");
    const client_id = document.getElementById("client_id").value;
    const naam = document.getElementById("naam").value;

    const response = await fetch("/api/client-apps", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ client_id, name: naam})
    });

    const data = await response.json();
    document.getElementById("resultaat").textContent = "Jouw API key: " + data.apiKey;
    const lijst = document.getElementById("naam-client");
    const item = document.createElement("li");
    item.textContent = "Aangevraagd voor: " + naam;
    lijst.appendChild(item);

    setTimeout(() => {
        document.getElementById("resultaat").textContent = "";
    }, 5000);
}

async function haalNaam() {
    const response = await fetch("/api/client-apps", {
        headers: { Accept: "application/json" }
    });

    const data = await response.json();
    const lijst = document.getElementById("naam-client");

    data.forEach(app => {
        const item = document.createElement("li");
        item.textContent = app.name;
        item.textContent += app.is_active ? " (actief)" : " (inactief)";
        lijst.appendChild(item);
    });
}

haalNaam();