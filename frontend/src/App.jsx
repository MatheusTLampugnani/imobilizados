import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button } from 'react-bootstrap';
import { ShieldLock, BoxArrowRight, PersonCircle } from 'react-bootstrap-icons';
import Header from './components/Header';
import InputArea from './components/InputArea';
import Inventory from './components/Inventory';
import ResultsDisplay from './components/ResultsDisplay';
import ReportModal from './components/ReportModal';
import DivergenceReport from './components/DivergenceReport';
import CcInputModal from './components/CcInputModal';
import AddNotFoundItemModal from './components/AddNotFoundItemModal';
import FilterControls from './components/FilterControls';
import StatusModal from './components/StatusModal';
import LoginScreen from './components/Login';
import RegisteredItemsList from './components/RegisteredItemsList';
import AdminLogs from './components/AdminLogs';
import { API_URL } from './apiConfig';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCcInputModal, setShowCcInputModal] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inventarioAtivo, setInventarioAtivo] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [inventarioCentroCusto, setInventarioCentroCusto] = useState('');
  const [inventarioUsuario, setInventarioUsuario] = useState('');
  const [inventarioLocal, setInventarioLocal] = useState('');
  const [expectedItems, setExpectedItems] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDivergenceReport, setShowDivergenceReport] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemCodeToAdd, setItemCodeToAdd] = useState('');
  const [showRegisteredList, setShowRegisteredList] = useState(false);
  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', message: '' });
  const [filters, setFilters] = useState({ serie: '', subn: '', centroCusto: '' , local: ''});
  const [filteredItems, setFilteredItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({ field: 'Descrição', order: 'asc' });
  const [view, setView] = useState('home');
  const [viewBaixasOnly, setViewBaixasOnly] = useState(false);

  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem('appState');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.currentUser) setCurrentUser(parsedData.currentUser);
        setInventario(parsedData.inventario || []);
        setInventarioCentroCusto(parsedData.inventarioCentroCusto || '');
        setInventarioUsuario(parsedData.inventarioUsuario || '');
        setInventarioLocal(parsedData.inventarioLocal || '');
      }
    } catch (e) {
      console.error("Erro ao carregar estado:", e);
    }
  }, []);

  useEffect(() => {
    try {
      const appState = {
        currentUser,
        inventario,
        inventarioCentroCusto,
        inventarioUsuario,
        inventarioLocal,
      };
      sessionStorage.setItem('appState', JSON.stringify(appState));
    } catch (e) {
      console.error("Erro ao salvar estado:", e);
    }
  }, [inventario, inventarioCentroCusto, inventarioUsuario, inventarioLocal, currentUser]);
  
useEffect(() => {
    if (!resultado) return;

    const lowercasedFilters = {
      serie: (filters.serie || '').toLowerCase(),
      subn: (filters.subn || '').toLowerCase(),
      centroCusto: (filters.centroCusto || '').toLowerCase(),
      local: (filters.local || '').toLowerCase(),
    };

    let items = resultado.itens.filter(item => {
      const serieMatch = !lowercasedFilters.serie || String(item.Série || '').toLowerCase().includes(lowercasedFilters.serie);
      const subnMatch = !lowercasedFilters.subn || String(item['Subnº'] || '').toLowerCase().includes(lowercasedFilters.subn);
      const centroCustoMatch = !lowercasedFilters.centroCusto || String(item.CentroCusto || '').toLowerCase().includes(lowercasedFilters.centroCusto);
      const removeAcentos = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const filtroLocalLimpo = removeAcentos(lowercasedFilters.local);
      const valorLocalBanco = String(item.Local || item.local || 'Não informado').toLowerCase();
      const valorLocalLimpo = removeAcentos(valorLocalBanco);
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

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.clear();
    window.location.reload(); 
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLogin} />;
  }

  const showStatus = (type, message) => {
    setStatusModal({ show: true, type, message });
  };

  const handleCloseStatus = () => {
    setStatusModal({ ...statusModal, show: false });
  };

  const fetchExpectedItems = async (cc) => {
    if (!cc) return;
    try {
      const response = await axios.get(`${API_URL}/imobilizado?codigo=${cc}`);
      setExpectedItems(response.data.itens || []);
    } catch (error) {
      console.error("Erro ao buscar itens esperados:", error);
      setExpectedItems([]);
    }
  };

  const handleStartInventory = async (cc, _ignoredUser, localFisico) => {
    try {
      await axios.get(`${API_URL}/centro-custo/validate/${cc}`);
      
      setInventarioCentroCusto(cc);
      setInventarioUsuario(currentUser.cracha);
      setInventarioLocal(localFisico);
      setInventarioAtivo(true);
      
      fetchExpectedItems(cc);
      setInventario([]); 
      return true;
    } catch (error) {
      console.error("Validação do Centro de Custo falhou:", error);
      return false;
    }
  };

  const handleAddItemToInventory = async (codeToAdd) => {
    try {
      const response = await axios.get(`${API_URL}/inventory-item?codigo=${codeToAdd}`);
      const dados = response.data;
      
      if (dados && dados.itens && dados.itens.length > 0) {
        const itemParaAdicionar = dados.itens[0];
        if (!inventario.some(invItem => invItem.id === itemParaAdicionar.id)) {
          setInventario(prevInventario => [itemParaAdicionar, ...prevInventario]);
        }
        return 'ok'; 
      }
      return 'error';
    } catch (error) {
      if (error.response?.status === 404) {
        setItemCodeToAdd(codeToAdd);
        setShowAddItemModal(true);
        return '404'; 
      } else {
        console.error("Erro ao adicionar item:", error);
        showStatus('error', 'Erro de comunicação com o servidor.');
        return 'error';
      }
    }
  };

  const handleConfirmAddItem = (description, inventoryCode, serialNumber, itemLocal, savedData) => {
    if (savedData) {
        const newItem = {
            id: savedData.id,
            "Subnº": 0,
            "Data": new Date().toISOString().split('T')[0],
            "Descrição": description,
            "Inventário": inventoryCode,
            "Série": serialNumber,
            "CentroCusto": inventarioCentroCusto,
            "CentroCustoNome": "Novo (Salvo)",
            "codigo_imobilizado": savedData.codigo_imobilizado || "NOVO",
            "Local": itemLocal || inventarioLocal,
            notFound: true,
            pendingSave: false,
        };
        setInventario(prev => [newItem, ...prev]);
    } else {
        const tempId = `temp_${Date.now()}`;
        const itemParaLista = {
          id: tempId,
          "Subnº": 0,
          "Data": new Date().toISOString().split('T')[0],
          "Descrição": description,
          "Inventário": inventoryCode,
          "Série": serialNumber,
          "CentroCusto": inventarioCentroCusto,
          "CentroCustoNome": "Novo (Aguardando)",
          "codigo_imobilizado": "PENDENTE",
          "Local": itemLocal || inventarioLocal,
          notFound: true,
          pendingSave: true,
          rawNewData: {
            descricao: description,
            codigo_inventario: inventoryCode,
            numero_serie: serialNumber,
            centro_custo: inventarioCentroCusto,
            user: currentUser.cracha,
            local: itemLocal || inventarioLocal
          }
        };
        setInventario(prev => [itemParaLista, ...prev]);
    }
    
    setShowAddItemModal(false);
  };

  const handleRemoveItem = (itemId) => {
    if (window.confirm('Tem certeza que deseja remover este item da contagem?')) {
      setInventario(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleFinalizeInventory = async () => {
    setIsLoading(true);
    
    const itemsToSave = inventario.filter(item => item.pendingSave && item.rawNewData);

    if (itemsToSave.length > 0) {
      try {
        await Promise.all(itemsToSave.map(item => {
          return axios.post(`${API_URL}/imobilizado`, item.rawNewData);
        }));
        
        showStatus('success', `${itemsToSave.length} novos itens cadastrados com sucesso!`);
        
      } catch (error) {
        console.error("Erro ao salvar itens novos:", error);
        showStatus('error', "Houve um erro ao salvar alguns itens novos.");
      }
    } else {
        showStatus('success', "Inventário finalizado com sucesso!");
    }

    setIsLoading(false);
    setTimeout(() => {
        setShowDivergenceReport(true);
    }, 2000);
  };

  const handleCodeSearch = async (codigoDireto) => {
    if (isLoading) return;
    const termoBusca = (typeof codigoDireto === 'string' && codigoDireto.trim() !== '') ? codigoDireto : codigo;

    if (!termoBusca || termoBusca.trim() === '') {
      setError('Por favor, digite um código.');
      setResultado(null);
      return;
    }

    setIsLoading(true);
    setError('');
    handleResetFilters(); 

    try {
      const response = await axios.get(`${API_URL}/imobilizado?codigo=${termoBusca}`);
      setResultado(response.data);
    } catch (err) {
      setResultado(null);
      const errorMessage = err.response?.status === 404 
        ? `Nenhum item encontrado para o termo: ${termoBusca}`
        : (err.response?.data?.message || 'Erro ao conectar ao servidor.');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => setFilters(newFilters);
  
  const handleResetFilters = () => {
    setFilters({ serie: '', subn: '', centroCusto: '',  local: '' });
    setSortConfig({ field: 'Descrição', order: 'asc' });
  };
  
  const handleSortChange = (newSortConfig) => setSortConfig(newSortConfig);

  const refreshData = () => {
    if (codigo) handleCodeSearch(codigo);
  };

  const handleClearSearch = () => {
    setCodigo('');
    setResultado(null);
    setError('');
  };

  const handleFinishAndReset = () => {
    setShowDivergenceReport(false);
    setInventarioAtivo(false);
    setInventario([]);
    setExpectedItems([]);
    setInventarioCentroCusto('');
    setInventarioLocal('');
    setResultado(null);
    const appState = { currentUser, inventario: [], inventarioCentroCusto: '', inventarioLocal: '' };
    sessionStorage.setItem('appState', JSON.stringify(appState));
  };

  return (
    <div className="app-wrapper">
      <div 
        className="position-absolute top-0 end-0 p-3 d-flex align-items-center gap-3" 
        style={{ zIndex: 1000 }}
      >
        <div className="d-flex align-items-center text-secondary bg-white px-3 py-1 rounded shadow-sm border d-none d-md-flex">
            <PersonCircle className="me-2" />
            <span className="small">Olá, <strong>{currentUser.nome}</strong></span>
        </div>
        {view === 'home' && (
            <Button 
                variant="dark" 
                size="sm"
                onClick={() => setView('admin_logs')}
                className="d-flex align-items-center gap-2 shadow-sm"
                title="Acessar Auditoria e Logs"
            >
                <ShieldLock size={14} /> 
                <span className="d-none d-md-inline">Alterações</span>
            </Button>
        )}
        <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={handleLogout}
            className="d-flex align-items-center gap-2"
            title="Sair do Sistema"
        >
            <BoxArrowRight size={16} />
            <span className="d-none d-md-inline">Sair</span>
        </Button>
      </div>
      <Container>
        <Header />
        {view === 'home' && (
            <>
                <InputArea
                  codigo={codigo}
                  setCodigo={setCodigo}
                  onConsultar={handleCodeSearch}
                  onLimpar={handleClearSearch}
                  isLoading={isLoading}
                />

                {resultado && resultado.itens.length > 0 && (
                  <FilterControls
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    sortConfig={sortConfig}
                    onSortChange={handleSortChange}
                    itemsCount={filteredItems.length}
                  />
                )}

                <ResultsDisplay
                  isLoading={isLoading}
                  error={error}
                  resultado={resultado ? { ...resultado, itens: filteredItems } : null}
                  onRefresh={refreshData}
                  currentUser={currentUser}
                />
                
                <div className="main-actions-container">
                  <Button variant="danger" size="lg" onClick={() => setShowCcInputModal(true)}>
                    Iniciar Inventário
                  </Button>
                  <Button variant="outline-danger" size="lg" onClick={() => setShowReportModal(true)}>
                    Gerar Relatórios
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="mt-2 mt-md-0 ms-md-2" 
                    onClick={() => {
                      setViewBaixasOnly(false);
                      setShowRegisteredList(true);
                    }}
                  >
                    Ver Cadastrados
                  </Button>
                  <Button 
                    variant="warning" 
                    size="lg" 
                    className="mt-2 mt-md-0 ms-md-2" 
                    onClick={() => {
                      setViewBaixasOnly(true);
                      setShowRegisteredList(true);
                    }}
                  >
                    Ver Baixas
                  </Button>
                </div>

                {inventarioAtivo && (
                  <Inventory
                    inventario={inventario}
                    setInventario={setInventario}
                    onClose={() => setInventarioAtivo(false)}
                    onAddItem={handleAddItemToInventory}
                    inventarioCentroCusto={inventarioCentroCusto}
                    expectedItems={expectedItems}
                    onFinishInventory={handleFinalizeInventory}
                    onRemoveItem={handleRemoveItem}
                  />
                )}
            </>
        )}
        
        {view === 'admin_logs' && (
            <AdminLogs 
                onBack={() => setView('home')} 
                currentUser={currentUser}
            />
        )}
      </Container>

      <CcInputModal
        show={showCcInputModal}
        onClose={() => setShowCcInputModal(false)}
        onConfirm={handleStartInventory}
      />

      {showReportModal && 
        <ReportModal 
          show={showReportModal} 
          onClose={() => setShowReportModal(false)} 
        />
      }

      {showDivergenceReport && (
        <DivergenceReport
          show={showDivergenceReport}
          onClose={() => setShowDivergenceReport(false)}
          onFinishAndReset={handleFinishAndReset}
          collectedItems={inventario}
          expectedItems={expectedItems}
          inventoryCc={inventarioCentroCusto}
          centroCusto={inventarioCentroCusto} 
          user={currentUser?.cracha}
        />
      )}

      <AddNotFoundItemModal
        show={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onConfirm={handleConfirmAddItem}
        itemCode={itemCodeToAdd}
        defaultLocal={inventarioLocal}
        centroCusto={inventarioCentroCusto} 
        user={currentUser?.cracha}
      />

      <RegisteredItemsList 
        show={showRegisteredList} 
        onClose={() => setShowRegisteredList(false)} 
        baixasOnly={viewBaixasOnly}
      />

      <StatusModal 
        show={statusModal.show} 
        type={statusModal.type} 
        message={statusModal.message} 
        onClose={handleCloseStatus} 
      />

      <footer className="app-footer">
        <p className="mb-0">© {new Date().getFullYear()} - Sistema de Consulta de Imobilizados | Desenvolvido para Videplast</p>
      </footer>
    </div>
  );
}

export default App;