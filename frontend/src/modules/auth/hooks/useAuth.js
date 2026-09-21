import { useState, useEffect } from 'react';
import api from '../../../lib/api';

/**
 * Hook de autenticação.
 * Gerencia login, logout e persistência do usuário no sessionStorage.
 */
export function useAuth() {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const saved = sessionStorage.getItem('appState');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.currentUser || null;
            }
        } catch (e) {
            console.error('Erro ao ler estado de autenticação:', e);
        }
        return null;
    });

    useEffect(() => {
        try {
            const saved = JSON.parse(sessionStorage.getItem('appState') || '{}');
            sessionStorage.setItem('appState', JSON.stringify({ ...saved, currentUser }));
        } catch (e) {
            console.error('Erro ao persistir usuário:', e);
        }
    }, [currentUser]);

    /**
     * Autentica o usuário pelo crachá ou recebe o objeto de usuário já autenticado.
     * @param {string|object} crachaOrUser
     */
    async function handleLogin(crachaOrUser) {
        if (typeof crachaOrUser === 'object' && crachaOrUser !== null) {
            setCurrentUser(crachaOrUser);
            return crachaOrUser;
        }

        const response = await api.post('/login', { cracha: String(crachaOrUser).trim() });
        const user = response.data.user;
        setCurrentUser(user);
        return user;
    }

    function handleLogout() {
        setCurrentUser(null);
        sessionStorage.clear();
        window.location.reload();
    }

    return { currentUser, handleLogin, handleLogout };
}
