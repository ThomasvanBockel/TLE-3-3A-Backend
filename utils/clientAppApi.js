const API_BASE_URL = "http://127.0.0.1:8000/api/";

function getHeaders() {
    const token = localStorage.getItem("clientToken");

    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

export async function getClientApps() {
    const response = await fetch(`${API_BASE_URL}client-apps`, {
        method: "GET",
        headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Fetch failed");
    return data;
}

export async function createClientApp(name) {
    const response = await fetch(`${API_BASE_URL}client-apps`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({name})
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Create failed");
    return data;
}

export async function toggleClientApp(id) {
    const response = await fetch(`${API_BASE_URL}client-apps/${id}`, {
        method: "PATCH",
        headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Toggle failed");
    return data;
}

export async function deleteClientApp(id) {
    const response = await fetch(`${API_BASE_URL}client-apps/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Delete failed");
    return data;
}