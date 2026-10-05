import { useState, useEffect } from 'react';
import api from '../../../lib/api';

/**
 * Hook de busca de imobilizados.
 * Gerencia busca, filtros, ordenação e resultado.
 */
export function useImobilizados(currentUser) {
    const [codigo, setCodigo] = useState('');
    const [resultado, setResultado] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({ serie: '', subn: '', centroCusto: '', local: '' });
    const [filteredItems, setFilteredItems] = useState([]);
    const [sortConfig, setSortConfig] = useState({ field: 'Descrição', order: 'asc' });
    const [modoSemLocal, setModoSemLocal] = useState(false);

    useEffect(() => {
        if (!resultado) return;

        const lowercasedFilters = {
            serie: (filters.serie || '').toLowerCase(),
            subn: (filters.subn || '').toLowerCase(),
            centroCusto: (filters.centroCusto || '').toLowerCase(),
            local: (filters.local || '').toLowerCase(),
        };

        const removeAcentos = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        let items = resultado.itens.filter(item => {
            const serieMatch = !lowercasedFilters.serie || String(item.Série || '').toLowerCase().includes(lowercasedFilters.serie);
            const subnMatch = !lowercasedFilters.subn || String(item['Subnº'] || '').toLowerCase().includes(lowercasedFilters.subn);
            const centroCustoMatch = !lowercasedFilters.centroCusto || String(item.CentroCusto || '').toLowerCase().includes(lowercasedFilters.centroCusto);
            const filtroLocalLimpo = removeAcentos(lowercasedFilters.local);
            const valorLocalLimpo = removeAcentos(String(item.Local || item.local || 'Não informado').toLowerCase());
            const localMatch = !filtroLocalLimpo || valorLocalLimpo.includes(filtroLocalLimpo);
            return serieMatch && subnMatch && centroCustoMatch && localMatch;
        });

        items.sort((a, b) => {
            const valA = a[sortConfig.field] || '';
            const valB = b[sortConfig.field] || '';
            if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredItems(items);
    }, [filters, resultado, sortConfig]);

    async function handleCodeSearch(codigoDireto) {
        if (isLoading) return;
        const termoBusca = (typeof codigoDireto === 'string' && codigoDireto.trim() !== '') ? codigoDireto : codigo;

        if (!termoBusca || termoBusca.trim() === '') {
            setError('Por favor, digite um código.');
            setResultado(null);
            return;
        }

        setIsLoading(true);
        setError('');
        setModoSemLocal(false);
        handleResetFilters();

        try {
            const unidade = currentUser?.unidade || '';
            const isAdmin = currentUser?.isAdmin || false;
            const response = await api.get(`/imobilizado?codigo=${termoBusca}&unidadeUsuario=${unidade}&isAdmin=${isAdmin}`);
            setResultado(response.data);
        } catch (err) {
            setResultado(null);
            const errorMessage = err.response?.status === 404
                ? 'Nenhum item encontrado.'
                : (err.response?.data?.message || 'Erro ao conectar ao servidor.');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleBuscarSemLocal() {
        if (isLoading) return;

        setIsLoading(true);
        setError('');
        setCodigo('');
        setModoSemLocal(true);
        handleResetFilters();

        try {
            const unidade = currentUser?.unidade || '';
            const isAdmin = currentUser?.isAdmin || false;
            const response = await api.get(`/imobilizado/sem-local?unidadeUsuario=${unidade}&isAdmin=${isAdmin}`);
            setResultado(response.data);
            if (!response.data?.itens?.length) setError('Nenhum material com local em branco ou não informado.');
        } catch (err) {
            setResultado(null);
            setError(err.response?.data?.message || 'Erro ao conectar ao servidor.');
        } finally {
            setIsLoading(false);
        }
    }

    function handleFilterChange(newFilters) { setFilters(newFilters); }

    function handleResetFilters() {
        setFilters({ serie: '', subn: '', centroCusto: '', local: '' });
        setSortConfig({ field: 'Descrição', order: 'asc' });
    }

    function handleSortChange(newSortConfig) { setSortConfig(newSortConfig); }

    function handleClearSearch() {
        setCodigo('');
        setResultado(null);
        setError('');
        setModoSemLocal(false);
    }

    function refreshData() {
        if (modoSemLocal) handleBuscarSemLocal();
        else if (codigo) handleCodeSearch(codigo);
    }

    return {
        codigo, setCodigo,
        resultado,
        isLoading,
        error,
        filters, filteredItems, sortConfig,
        modoSemLocal,
        handleCodeSearch,
        handleBuscarSemLocal,
        handleFilterChange,
        handleResetFilters,
        handleSortChange,
        handleClearSearch,
        refreshData,
    };
}
