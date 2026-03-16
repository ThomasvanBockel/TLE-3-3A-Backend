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
    lijst.innerHTML = "";

    data.forEach(app => {
        const item = document.createElement("li");
        const appId = app.id;


        item.textContent = `${app.name} ${app.is_active ? "Actief" : "Inactief"} `;

        const btn = document.createElement("button");
        btn.textContent = app.is_active ? "Deactiveren" : "Activeren";
        btn.onclick = () => toggleStatus(appId);

        item.appendChild(btn);
        lijst.appendChild(item);
    });
}

async function toggleStatus(id) {
    const response = await fetch(`/api/client-apps/${id}`, {
        method: "PATCH",
        headers: { Accept: "application/json" }
    });

    if (response.ok) {
        haalNaam();
    } else {
        const errorData = await response.json();
        console.error("Fout bij updaten:", errorData.message);
    }
}

haalNaam();