
const API_URL = '/api';

const getStoredToken = () => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            return user.token;
        }
    } catch (e) {
        console.error("Error parsing stored user for token fallback", e);
    }
    return null;
};

export const api = {
    async post(endpoint: string, body: any, token?: string) {
        const authToken = token || getStoredToken();
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    },

    async get(endpoint: string, token?: string) {
        const authToken = token || getStoredToken();
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
            },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    },

    async put(endpoint: string, body: any, token?: string) {
        const authToken = token || getStoredToken();
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
            },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    },

    async delete(endpoint: string, token?: string) {
        const authToken = token || getStoredToken();
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
            },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    }
};
