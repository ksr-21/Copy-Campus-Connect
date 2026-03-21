import { auth } from '../firebase';
import { api } from '../api';

/**
 * Synchronizes the current Firebase user with the MongoDB backend.
 * Attempts to login, and if the user doesn't exist, performs an auto-migration (registration).
 * Stores the resulting token in localStorage and dispatches a storage event.
 */
export const syncBackendToken = async (email: string, password?: string, profileData?: any): Promise<void> => {
    if (!email || !password) return;

    try {
        // 1. Attempt Backend Login
        const data = await api.post('/auth/login', { email, password });
        const userData = { ...data, id: data._id };
        localStorage.setItem('user', JSON.stringify(userData));

        // If login successful but we have profile data, update it
        if (profileData) {
            const updatedUser = await api.put('/auth/profile', profileData, userData.token);
            localStorage.setItem('user', JSON.stringify({ ...userData, ...updatedUser, id: updatedUser._id }));
        }
    } catch (loginErr: any) {
        // Fallback: Attempt registration if login fails
        try {
            const registerData = await api.post('/auth/register', {
                email,
                password,
                name: email.split('@')[0], // Fallback name
                ...profileData
            });
            const userData = { ...registerData, id: registerData._id };
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (regErr) {
            console.error("Auto-migration/Registration failed", regErr);
        }
    } finally {
        // Notify App.tsx of the new token in localStorage
        window.dispatchEvent(new Event('storage'));
    }
};

export const logout = async (onNavigate: (path: string) => void) => {
    try {
        if (auth) {
            await auth.signOut();
        }
    } catch (error) {
        console.error("Firebase signOut failed", error);
    } finally {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        onNavigate('#/');
    }
};
