import { auth } from '../firebase';

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
