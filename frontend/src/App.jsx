import React, { useState } from 'react';
import { Row, Col, Container, Button, Alert } from 'react-bootstrap';
import { ShieldLock, BoxArrowRight, PersonCircle, ClipboardCheck } from 'react-bootstrap-icons';

// Hooks de domínio
import { useAuth } from './modules/auth/hooks/useAuth';
import { useImobilizados } from './modules/imobilizados/hooks/useImobilizados';
import { useInventario } from './modules/inventario/hooks/useInventario';

// Componentes UI globais
import Header from './components/Header';
import StatusModal from './components/StatusModal';

// Componentes por domínio
import LoginScreen from './components/Login';
import InputArea from './components/InputArea';
import FilterControls from './components/FilterControls';
import ResultsDisplay from './components/ResultsDisplay';
import ReportModal from './components/ReportModal';
import CcInputModal from './components/CcInputModal';
import Inventory from './components/Inventory';
import DivergenceReport from './components/DivergenceReport';
import AddNotFoundItemModal from './components/AddNotFoundItemModal';
import RegisteredItemsList from './components/RegisteredItemsList';
import AdminLogs from './components/AdminLogs';

import './App.css';

function App() {
    const { currentUser, handleLogin, handleLogout } = useAuth();

    const {
        codigo, setCodigo,
        resultado,
        isLoading: isSearchLoading,
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
    } = useImobilizados(currentUser);

    const {
        inventarioAtivo, setInventarioAtivo,
        inventario, setInventario,
        inventarioCentroCusto,
        inventarioLocal,
        inventarioIniciadoEm,
        inventarioPendente,
        expectedItems,
        showDivergenceReport,
        showAddItemModal, setShowAddItemModal,
        itemCodeToAdd,
        isLoading: isInventarioLoading,
        handleStartInventory,
        handleResumeInventory,
        handleDiscardInventory,
        handleAddItemToInventory,
        handleConfirmAddItem,
        handleRemoveItem,
        handleFinalizeInventory,
        handleFinishAndReset,
    } = useInventario(currentUser);

    const [view, setView] = useState('home');
    const [showReportModal, setShowReportModal] = useState(false);
    const [showRegisteredList, setShowRegisteredList] = useState(false);
    const [viewBaixasOnly, setViewBaixasOnly] = useState(false);
    const [statusModal, setStatusModal] = useState({ show: false, type: 'success', message: '' });

    if (!currentUser) {
        return <LoginScreen onLoginSuccess={handleLogin} />;
    }

    const showStatus = (type, message) => setStatusModal({ show: true, type, message });
    const handleCloseStatus = () => setStatusModal(prev => ({ ...prev, show: false }));

    const confirmarDescarte = () => {
        if (window.confirm(`Descartar o inventário do Centro de Custo ${inventarioCentroCusto}? Os ${inventario.length} itens lidos serão apagados deste aparelho e não poderão ser recuperados.`)) {
            handleDiscardInventory();
        }
    };

    return (
        <div className="app-wrapper">
            <div className="position-absolute top-0 end-0 p-3 d-flex align-items-center gap-3" style={{ zIndex: 1000 }}>
                <div className="d-flex align-items-center text-secondary bg-white px-3 py-1 rounded shadow-sm border d-none d-md-flex">
                    <PersonCircle className="me-2" />
                    <span className="small">Olá, <strong>{currentUser.nome}</strong></span>
                </div>
                {view === 'home' && (
                    <Button variant="dark" size="sm" onClick={() => setView('admin_logs')} className="d-flex align-items-center gap-2 shadow-sm" title="Acessar Auditoria e Logs">
                        <ShieldLock size={14} />
                        <span className="d-none d-md-inline">Alterações</span>
                    </Button>
                )}
                <Button variant="outline-danger" size="sm" onClick={handleLogout} className="d-flex align-items-center gap-2" title="Sair do Sistema">
                    <BoxArrowRight size={16} />
                    <span className="d-none d-md-inline">Sair</span>
                </Button>
            </div>

            <Container>
                <Header />

                {view === 'home' && (
                    <>
                        {inventarioPendente && (
                            <Alert variant="warning" className="d-flex flex-column flex-md-row align-items-md-center gap-2 shadow-sm">
                                <div className="me-md-auto d-flex align-items-center gap-2">
                                    <ClipboardCheck size={20} className="flex-shrink-0" />
                                    <span>
                                        <strong>Inventário em andamento</strong> — Centro de Custo {inventarioCentroCusto}:{' '}
                                        {inventario.length} {inventario.length === 1 ? 'item lido' : 'itens lidos'}
                                        {inventarioIniciadoEm && ` (iniciado em ${new Date(inventarioIniciadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })})`}.
                                    </span>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button variant="danger" size="sm" onClick={handleResumeInventory}>Continuar inventário</Button>
                                    <Button variant="outline-secondary" size="sm" onClick={confirmarDescarte}>Descartar</Button>
                                </div>
                            </Alert>
                        )}

                        <InputArea codigo={codigo} setCodigo={setCodigo} onConsultar={handleCodeSearch} onLimpar={handleClearSearch} isLoading={isSearchLoading} />

                        {resultado?.itens?.length > 0 && (
                            <FilterControls filters={filters} onFilterChange={handleFilterChange} onResetFilters={handleResetFilters} sortConfig={sortConfig} onSortChange={handleSortChange} itemsCount={filteredItems.length} />
                        )}

                        <ResultsDisplay isLoading={isSearchLoading} error={error} resultado={resultado ? { ...resultado, itens: filteredItems } : null} onRefresh={refreshData} currentUser={currentUser} titulo={modoSemLocal ? `MATERIAIS SEM LOCAL (${filteredItems.length})` : undefined} />

                        <Row className="g-2 my-3">
                            <Col xs={6} md>
                                <Button variant="danger" size="md" className="w-100 h-100 d-flex align-items-center justify-content-center text-center py-2" onClick={() => setShowReportModal(true)}>
                                    Gerar Relatórios
                                </Button>
                            </Col>
                            <Col xs={6} md>
                                <Button variant="outline-danger" size="md" className="w-100 h-100 d-flex align-items-center justify-content-center text-center py-2" onClick={() => { if (inventarioPendente) handleResumeInventory(); else setView('iniciar_inventario'); }}>
                                    {inventarioPendente ? 'Continuar Inventário' : 'Iniciar Inventário'}
                                </Button>
                            </Col>
                            <Col xs={6} md>
                                <Button variant="secondary" size="md" className="w-100 h-100 d-flex align-items-center justify-content-center text-center py-2" onClick={() => { setViewBaixasOnly(false); setShowRegisteredList(true); }}>
                                    Ver Cadastrados
                                </Button>
                            </Col>
                            <Col xs={6} md>
                                <Button variant="warning" size="md" className="w-100 h-100 d-flex align-items-center justify-content-center text-center py-2 text-dark fw-bold" onClick={() => { setViewBaixasOnly(true); setShowRegisteredList(true); }}>
                                    Ver Baixas
                                </Button>
                            </Col>
                            <Col xs={12} md>
                                <Button variant="outline-secondary" size="md" className="w-100 h-100 d-flex align-items-center justify-content-center text-center py-2" onClick={handleBuscarSemLocal} disabled={isSearchLoading} title="Listar materiais com o campo Local em branco ou não informado">
                                    Sem Local
                                </Button>
                            </Col>
                        </Row>

                        {inventarioAtivo && (
                            <Inventory
                                inventario={inventario}
                                setInventario={setInventario}
                                onClose={() => setInventarioAtivo(false)}
                                onAddItem={handleAddItemToInventory}
                                inventarioCentroCusto={inventarioCentroCusto}
                                expectedItems={expectedItems}
                                onFinishInventory={() => handleFinalizeInventory(
                                    (msg) => showStatus('success', msg),
                                    (msg) => showStatus('error', msg)
                                )}
                                onRemoveItem={handleRemoveItem}
                            />
                        )}
                    </>
                )}

                {view === 'admin_logs' && (
                    <AdminLogs onBack={() => setView('home')} currentUser={currentUser} />
                )}
            </Container>

            {/* Modais globais */}
            <CcInputModal show={view === 'iniciar_inventario'} onClose={() => setView('home')} onConfirm={async (cc, user, local) => { const ok = await handleStartInventory(cc, user, local); if (ok) setView('home'); }} />

            {showReportModal && <ReportModal show={showReportModal} onClose={() => setShowReportModal(false)} />}

            {showDivergenceReport && (
                <DivergenceReport show={showDivergenceReport} onClose={() => {}} onFinishAndReset={handleFinishAndReset} collectedItems={inventario} expectedItems={expectedItems} inventoryCc={inventarioCentroCusto} centroCusto={inventarioCentroCusto} user={currentUser?.cracha} />
            )}

            <AddNotFoundItemModal show={showAddItemModal} onClose={() => setShowAddItemModal(false)} onConfirm={handleConfirmAddItem} itemCode={itemCodeToAdd} defaultLocal={inventarioLocal} centroCusto={inventarioCentroCusto} user={currentUser?.cracha} />

            <RegisteredItemsList show={showRegisteredList} onClose={() => setShowRegisteredList(false)} baixasOnly={viewBaixasOnly} />

            <StatusModal show={statusModal.show} type={statusModal.type} message={statusModal.message} onClose={handleCloseStatus} />

            <footer className="app-footer">
                <p className="mb-0">© {new Date().getFullYear()} - Sistema de Consulta de Imobilizados | Desenvolvido para Videplast</p>
            </footer>
        </div>
    );
}

export default App;