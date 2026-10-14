import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/api';

// O inventário em andamento fica no localStorage, separado por crachá: sobrevive a F5,
// a fechar a janela, a sair do sistema e a fechar o navegador, até ser finalizado ou descartado.
const chaveInventario = (cracha) => `imobilizados.inventario.${cracha}`;

function lerInventarioSalvo(cracha) {
    try {
        const salvo = localStorage.getItem(chaveInventario(cracha));
        if (salvo) return JSON.parse(salvo);

        // Migra a contagem que versões anteriores guardavam só no sessionStorage da aba.
        const antigo = JSON.parse(sessionStorage.getItem('appState') || '{}');
        if (antigo.inventarioCentroCusto && antigo.inventario?.length > 0) {
            return {
                centroCusto: antigo.inventarioCentroCusto,
                local: antigo.inventarioLocal || '',
                usuario: antigo.inventarioUsuario || cracha,
                itens: antigo.inventario,
                iniciadoEm: null,
            };
        }
    } catch (e) {
        console.error('Erro ao restaurar inventário:', e);
    }
    return null;
}

/**
 * Hook de gerenciamento do modo inventário.
 * Gerencia itens coletados, itens esperados, adição, remoção e finalização.
 */
export function useInventario(currentUser) {
    const cracha = currentUser?.cracha ? String(currentUser.cracha) : '';
    const [inventarioAtivo, setInventarioAtivo] = useState(false);
    const [inventario, setInventario] = useState([]);
    const [inventarioCentroCusto, setInventarioCentroCusto] = useState('');
    const [inventarioUsuario, setInventarioUsuario] = useState('');
    const [inventarioLocal, setInventarioLocal] = useState('');
    const [inventarioIniciadoEm, setInventarioIniciadoEm] = useState(null);
    const [carregadoPara, setCarregadoPara] = useState(null);
    const [expectedItems, setExpectedItems] = useState([]);
    const [showDivergenceReport, setShowDivergenceReport] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [itemCodeToAdd, setItemCodeToAdd] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Restaura o inventário em andamento do crachá logado
    useEffect(() => {
        if (!cracha) return;
        const salvo = lerInventarioSalvo(cracha);
        setInventario(salvo?.itens || []);
        setInventarioCentroCusto(salvo?.centroCusto || '');
        setInventarioUsuario(salvo?.usuario || '');
        setInventarioLocal(salvo?.local || '');
        setInventarioIniciadoEm(salvo?.iniciadoEm || null);
        setCarregadoPara(cracha);
    }, [cracha]);

    // Persiste a cada leitura (só depois de restaurar, para não sobrescrever o que estava salvo)
    useEffect(() => {
        if (!cracha || carregadoPara !== cracha) return;
        try {
            if (inventarioCentroCusto) {
                localStorage.setItem(chaveInventario(cracha), JSON.stringify({
                    centroCusto: inventarioCentroCusto,
                    local: inventarioLocal,
                    usuario: inventarioUsuario,
                    itens: inventario,
                    iniciadoEm: inventarioIniciadoEm,
                }));
            } else {
                localStorage.removeItem(chaveInventario(cracha));
            }
            const antigo = JSON.parse(sessionStorage.getItem('appState') || '{}');
            if ('inventario' in antigo) {
                delete antigo.inventario;
                delete antigo.inventarioCentroCusto;
                delete antigo.inventarioUsuario;
                delete antigo.inventarioLocal;
                sessionStorage.setItem('appState', JSON.stringify(antigo));
            }
        } catch (e) {
            console.error('Erro ao salvar inventário:', e);
        }
    }, [cracha, carregadoPara, inventario, inventarioCentroCusto, inventarioUsuario, inventarioLocal, inventarioIniciadoEm]);

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
            setInventarioIniciadoEm(new Date().toISOString());
            setInventarioAtivo(true);
            fetchExpectedItems(cc);
            setInventario([]);
            return true;
        } catch {
            return false;
        }
    }

    // Reabre um inventário restaurado (após F5, fechar a janela ou sair do sistema)
    function handleResumeInventory() {
        setInventarioAtivo(true);
        fetchExpectedItems(inventarioCentroCusto);
    }

    function limparInventario() {
        setInventarioAtivo(false);
        setInventario([]);
        setExpectedItems([]);
        setInventarioCentroCusto('');
        setInventarioUsuario('');
        setInventarioLocal('');
        setInventarioIniciadoEm(null);
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
            const resultados = await Promise.allSettled(itemsToSave.map(item => api.post('/imobilizado', item.rawNewData)));
            // Marca os que foram gravados, para não cadastrá-los de novo se o inventário for retomado
            const salvos = new Set(itemsToSave.filter((_, i) => resultados[i].status === 'fulfilled').map(item => item.id));
            if (salvos.size > 0) {
                setInventario(prev => prev.map(item => (
                    salvos.has(item.id) ? { ...item, pendingSave: false, CentroCustoNome: 'Novo (Salvo)' } : item
                )));
            }
            const falhas = itemsToSave.length - salvos.size;
            if (falhas === 0) {
                onSuccess?.(`${itemsToSave.length} novos itens cadastrados com sucesso!`);
            } else {
                onError?.(`${falhas} de ${itemsToSave.length} itens novos não foram salvos. Eles continuam na contagem como pendentes.`);
            }
        } else {
            onSuccess?.('Inventário finalizado com sucesso!');
        }

        setIsLoading(false);
        setTimeout(() => setShowDivergenceReport(true), 2000);
    }

    function handleFinishAndReset() {
        setShowDivergenceReport(false);
        limparInventario();
    }

    // Existe contagem guardada que não está aberta na tela
    const inventarioPendente = !inventarioAtivo && !showDivergenceReport
        && Boolean(inventarioCentroCusto) && inventario.length > 0;

    return {
        inventarioAtivo, setInventarioAtivo,
        inventario, setInventario,
        inventarioCentroCusto,
        inventarioUsuario,
        inventarioLocal,
        inventarioIniciadoEm,
        inventarioPendente,
        expectedItems,
        showDivergenceReport, setShowDivergenceReport,
        showAddItemModal, setShowAddItemModal,
        itemCodeToAdd,
        isLoading,
        handleStartInventory,
        handleResumeInventory,
        handleDiscardInventory: limparInventario,
        handleAddItemToInventory,
        handleConfirmAddItem,
        handleRemoveItem,
        handleFinalizeInventory,
        handleFinishAndReset,
    };
}
