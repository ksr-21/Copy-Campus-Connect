import { api } from '../api';

/**
 * Logs in to the MongoDB backend directly.
 * Stores the resulting token in localStorage and dispatches a storage event.
 */
export const backendLogin = async (email: string, password?: string): Promise<any> => {
    if (!email || !password) throw new Error("Email and password are required");
    const data = await api.post('/auth/login', { email, password });
    const userData = { ...data, id: data._id };
    localStorage.setItem('user', JSON.stringify(userData));
    window.dispatchEvent(new Event('storage'));
    return userData;
};

/**
 * Registers a new user in the MongoDB backend directly.
 * Stores the resulting token in localStorage and dispatches a storage event.
 */
export const backendRegister = async (registrationData: any): Promise<any> => {
    const data = await api.post('/auth/register', registrationData);
    const userData = { ...data, id: data._id };
    localStorage.setItem('user', JSON.stringify(userData));
    window.dispatchEvent(new Event('storage'));
    return userData;
};

export const logout = async (onNavigate: (path: string) => void) => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    onNavigate('#/');
};
