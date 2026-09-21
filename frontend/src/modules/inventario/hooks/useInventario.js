import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';

/**
 * Hook de gerenciamento do modo inventário.
 * Gerencia itens coletados, itens esperados, adição, remoção e finalização.
 */
export function useInventario(currentUser) {
    const [inventarioAtivo, setInventarioAtivo] = useState(false);
    const [inventario, setInventario] = useState([]);
    const [inventarioCentroCusto, setInventarioCentroCusto] = useState('');
    const [inventarioUsuario, setInventarioUsuario] = useState('');
    const [inventarioLocal, setInventarioLocal] = useState('');
    const [expectedItems, setExpectedItems] = useState([]);
    const [showDivergenceReport, setShowDivergenceReport] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [itemCodeToAdd, setItemCodeToAdd] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Restaura inventário do sessionStorage
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem('appState');
            if (saved) {
                const parsed = JSON.parse(saved);
                setInventario(parsed.inventario || []);
                setInventarioCentroCusto(parsed.inventarioCentroCusto || '');
                setInventarioUsuario(parsed.inventarioUsuario || '');
                setInventarioLocal(parsed.inventarioLocal || '');
            }
        } catch (e) {
            console.error('Erro ao restaurar inventário:', e);
        }
    }, []);

    // Persiste inventário no sessionStorage
    useEffect(() => {
        try {
            const current = JSON.parse(sessionStorage.getItem('appState') || '{}');
            sessionStorage.setItem('appState', JSON.stringify({
                ...current,
                inventario,
                inventarioCentroCusto,
                inventarioUsuario,
                inventarioLocal,
            }));
        } catch (e) {
            console.error('Erro ao salvar inventário:', e);
        }
    }, [inventario, inventarioCentroCusto, inventarioUsuario, inventarioLocal]);

    const fetchExpectedItems = useCallback(async (cc) => {
        if (!cc) return;
        try {
            const response = await api.get(`/imobilizado?codigo=${cc}`);
            setExpectedItems(response.data.itens || []);
        } catch {
            setExpectedItems([]);
        }
    }, []);

    async function handleStartInventory(cc, _ignoredUser, localFisico) {
        try {
            await api.get(`/centro-custo/validate/${cc}`);
            setInventarioCentroCusto(cc);
            setInventarioUsuario(currentUser.cracha);
            setInventarioLocal(localFisico);
            setInventarioAtivo(true);
            fetchExpectedItems(cc);
            setInventario([]);
            return true;
        } catch {
            return false;
        }
    }

    async function handleAddItemToInventory(codeToAdd) {
        try {
            const response = await api.get(`/inventory-item?codigo=${codeToAdd}`);
            const dados = response.data;

            if (dados?.itens?.length > 0) {
                const itemParaAdicionar = dados.itens[0];
                if (!inventario.some(invItem => invItem.id === itemParaAdicionar.id)) {
                    setInventario(prev => [itemParaAdicionar, ...prev]);
                }
                return 'ok';
            }
            return 'error';
        } catch (error) {
            if (error.response?.status === 404) {
                setItemCodeToAdd(codeToAdd);
                setShowAddItemModal(true);
                return '404';
            }
            return 'error';
        }
    }

    function handleConfirmAddItem(description, inventoryCode, serialNumber, itemLocal, savedData) {
        if (savedData) {
            const newItem = {
                id: savedData.id,
                'Subnº': 0,
                'Data': new Date().toISOString().split('T')[0],
                'Descrição': description,
                'Inventário': inventoryCode,
                'Série': serialNumber,
                'CentroCusto': inventarioCentroCusto,
                'CentroCustoNome': 'Novo (Salvo)',
                'codigo_imobilizado': savedData.codigo_imobilizado || 'NOVO',
                'Local': itemLocal || inventarioLocal,
                notFound: true,
                pendingSave: false,
            };
            setInventario(prev => [newItem, ...prev]);
        } else {
            const tempId = `temp_${Date.now()}`;
            const itemParaLista = {
                id: tempId,
                'Subnº': 0,
                'Data': new Date().toISOString().split('T')[0],
                'Descrição': description,
                'Inventário': inventoryCode,
                'Série': serialNumber,
                'CentroCusto': inventarioCentroCusto,
                'CentroCustoNome': 'Novo (Aguardando)',
                'codigo_imobilizado': 'PENDENTE',
                'Local': itemLocal || inventarioLocal,
                notFound: true,
                pendingSave: true,
                rawNewData: {
                    descricao: description,
                    codigo_inventario: inventoryCode,
                    numero_serie: serialNumber,
                    centro_custo: inventarioCentroCusto,
                    user: currentUser.cracha,
                    local: itemLocal || inventarioLocal,
                },
            };
            setInventario(prev => [itemParaLista, ...prev]);
        }
        setShowAddItemModal(false);
    }

    function handleRemoveItem(itemId) {
        if (window.confirm('Tem certeza que deseja remover este item da contagem?')) {
            setInventario(prev => prev.filter(item => item.id !== itemId));
        }
    }

    async function handleFinalizeInventory(onSuccess, onError) {
        setIsLoading(true);
        const itemsToSave = inventario.filter(item => item.pendingSave && item.rawNewData);

        if (itemsToSave.length > 0) {
            try {
                await Promise.all(itemsToSave.map(item => api.post('/imobilizado', item.rawNewData)));
                onSuccess?.(`${itemsToSave.length} novos itens cadastrados com sucesso!`);
            } catch {
                onError?.('Houve um erro ao salvar alguns itens novos.');
            }
        } else {
            onSuccess?.('Inventário finalizado com sucesso!');
        }

        setIsLoading(false);
        setTimeout(() => setShowDivergenceReport(true), 2000);
    }

    function handleFinishAndReset() {
        setShowDivergenceReport(false);
        setInventarioAtivo(false);
        setInventario([]);
        setExpectedItems([]);
        setInventarioCentroCusto('');
        setInventarioLocal('');
        const current = JSON.parse(sessionStorage.getItem('appState') || '{}');
        sessionStorage.setItem('appState', JSON.stringify({
            ...current,
            inventario: [],
            inventarioCentroCusto: '',
            inventarioLocal: '',
        }));
    }

    return {
        inventarioAtivo, setInventarioAtivo,
        inventario, setInventario,
        inventarioCentroCusto,
        inventarioUsuario,
        inventarioLocal,
        expectedItems,
        showDivergenceReport, setShowDivergenceReport,
        showAddItemModal, setShowAddItemModal,
        itemCodeToAdd,
        isLoading,
        handleStartInventory,
        handleAddItemToInventory,
        handleConfirmAddItem,
        handleRemoveItem,
        handleFinalizeInventory,
        handleFinishAndReset,
    };
}
