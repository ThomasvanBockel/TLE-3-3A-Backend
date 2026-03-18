const API_BASE_URL = "http://127.0.0.1:8000/api/";

export async function clientRegister(payload) {
    const response = await fetch(`${API_BASE_URL}client-users/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Register failed");
    return data;
}

export async function clientLogin(payload) {
    const response = await fetch(`${API_BASE_URL}client-users/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Login failed");
    return data;
}