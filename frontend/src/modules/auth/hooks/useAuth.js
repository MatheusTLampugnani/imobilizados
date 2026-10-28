import { useState, useEffect } from 'react';
import api from '../../../lib/api';

// Portal de Acesso no mesmo endereço (Nginx): informa quem está logado e encerra a sessão de todos os sistemas
const PORTAL_EU = '/acesso/api/eu';
const PORTAL_SAIR = '/acesso/api/sair';

/**
 * Hook de autenticação.
 * Entra automaticamente com o crachá logado no Portal; se não houver, usa a tela de crachá.
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
    const [verificandoPortal, setVerificandoPortal] = useState(true);

    // Login único: usa o crachá de quem entrou no Portal (inclusive troca a pessoa, se o Portal mudou de usuário)
    useEffect(() => {
        let cancelado = false;
        (async () => {
            try {
                const resposta = await fetch(PORTAL_EU, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
                if (!resposta.ok) return;
                const eu = await resposta.json();
                const crachaPortal = String(eu?.usuario || '').trim();
                if (!crachaPortal || String(currentUser?.cracha || '') === crachaPortal) return;
                const { data } = await api.post('/login', { cracha: crachaPortal });
                if (!cancelado && data?.user) setCurrentUser(data.user);
            } catch {
                // Sem Portal (ex.: desenvolvimento) ou login do Portal que não é crachá: segue com a tela de crachá
            } finally {
                if (!cancelado) setVerificandoPortal(false);
            }
        })();
        return () => { cancelado = true; };
        // Só ao abrir o sistema
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // Sair encerra também o login do Portal; senão o login único entraria de novo na mesma hora
    async function handleLogout() {
        setCurrentUser(null);
        sessionStorage.clear();
        try {
            const resposta = await fetch(PORTAL_SAIR, { method: 'POST', credentials: 'same-origin', headers: { 'X-Portal': '1' } });
            if (resposta.ok) {
                window.location.href = `/acesso/entrar?volta=${encodeURIComponent(window.location.pathname)}`;
                return;
            }
        } catch {
            // Sem Portal: apenas volta para a tela de crachá
        }
        window.location.reload();
    }

    return { currentUser, verificandoPortal, handleLogin, handleLogout };
}
