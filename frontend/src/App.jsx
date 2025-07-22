import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button } from 'react-bootstrap';
import Header from './components/Header';
import InputArea from './components/InputArea';
import Inventory from './components/Inventory';
import ResultsDisplay from './components/ResultsDisplay';
import ReportModal from './components/ReportModal';
import DivergenceReport from './components/DivergenceReport';
import CcInputModal from './components/CcInputModal';
import AddNotFoundItemModal from './components/AddNotFoundItemModal';
import { API_URL } from './apiConfig'; 
import './App.css';

function App() {
  const [showCcInputModal, setShowCcInputModal] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inventarioAtivo, setInventarioAtivo] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [inventarioCentroCusto, setInventarioCentroCusto] = useState('');
  const [expectedItems, setExpectedItems] = useState([]);
  const [showDivergenceReport, setShowDivergenceReport] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemCodeToAdd, setItemCodeToAdd] = useState('');

  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem('appState');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setInventario(parsedData.inventario || []);
        setInventarioCentroCusto(parsedData.inventarioCentroCusto || '');
      }
    } catch (e) {
      console.error("Erro ao carregar estado:", e);
    }
  }, []);

  useEffect(() => {
    try {
      const appState = {
        inventario,
        inventarioCentroCusto,
      };
      sessionStorage.setItem('appState', JSON.stringify(appState));
    } catch (e) {
      console.error("Erro ao salvar estado:", e);
    }
  }, [inventario, inventarioCentroCusto]);

  const formatarCodigo = (valor) => {
    if (!valor) return "";
    return String(valor).trim().replace(/\.0$/, '').replace(/^0+/, '');
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

  const handleStartInventory = async (cc) => {
    try {
      await axios.get(`${API_URL}/centro-custo/validate/${cc}`);
      setInventarioCentroCusto(cc);
      setInventarioAtivo(true);
      fetchExpectedItems(cc);
      setInventario([]);
      sessionStorage.removeItem('appState');
      return true;
    } catch (error) {
      console.error("Validação do Centro de Custo falhou:", error);
      return false;
    }
  };

  const handleCodeSearch = async () => {
    if (isLoading) return;
    if (!codigo || codigo.trim() === '') {
      setError('Por favor, digite um código.');
      setResultado(null);
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_URL}/imobilizado?codigo=${codigo}`);
      setResultado(response.data);
    } catch (err) {
      setResultado(null);
      const errorMessage = err.response?.status === 404 
        ? `Imobilizado ${codigo} não encontrado.` 
        : (err.response?.data?.message || 'Erro ao conectar ao servidor.');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItemToInventory = async (codeToAdd) => {
    try {
      const response = await axios.get(`${API_URL}/imobilizado?codigo=${codeToAdd}`);
      const dados = response.data;
      
      if (dados && dados.itens && dados.itens.length > 0) {
        const itemParaAdicionar = dados.itens[0];
        if (!inventario.some(invItem => invItem.id === itemParaAdicionar.id)) {
          setInventario(prevInventario => [itemParaAdicionar, ...prevInventario]);
        }
        return true;
      }
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        setItemCodeToAdd(codeToAdd);
        setShowAddItemModal(true);
      } else {
        console.error("Erro ao adicionar item ao inventário:", error);
        setError('Erro de comunicação com o servidor.');
      }
      return false;
    }
  };

  const handleConfirmAddItem = (description) => {
    const newItem = {
      id: `not-found-${itemCodeToAdd}-${Date.now()}`,
      Inventário: itemCodeToAdd,
      ['Subnº']: 'N/A',
      Descrição: description,
      CentroCusto: inventarioCentroCusto,
      notFound: true,
    };

    if (!inventario.some(item => item.Inventário === itemCodeToAdd && item.notFound)) {
      setInventario(prevInventario => [newItem, ...prevInventario]);
    }
    setShowAddItemModal(false);
  };

  const refreshData = () => {
    if (codigo) handleCodeSearch(codigo);
  };

  const handleFinishAndReset = () => {
    setShowDivergenceReport(false);
    setInventarioAtivo(false);
    setInventario([]);
    setExpectedItems([]);
    setInventarioCentroCusto('');
    setResultado(null);
    sessionStorage.removeItem('appState');
  };

  return (
    <div className="app-wrapper">
      <Container>
        <Header />
        <InputArea
          codigo={codigo}
          setCodigo={setCodigo}
          onConsultar={handleCodeSearch}
          isLoading={isLoading}
        />
        <ResultsDisplay
          isLoading={isLoading}
          error={error}
          resultado={resultado}
          onRefresh={refreshData}
        />
        <div className="main-actions-container">
          <Button variant="danger" size="lg" onClick={() => setShowCcInputModal(true)}>
            Iniciar Inventário
          </Button>
          <Button variant="outline-danger" size="lg" onClick={() => setShowReportModal(true)}>
            Gerar Relatórios
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
            onFinishInventory={() => setShowDivergenceReport(true)}
          />
        )}
      </Container>

      <CcInputModal
        show={showCcInputModal}
        onClose={() => setShowCcInputModal(false)}
        onConfirm={handleStartInventory}
      />

      {showReportModal && <ReportModal show={showReportModal} onClose={() => setShowReportModal(false)} />}

      {showDivergenceReport && (
        <DivergenceReport
          show={showDivergenceReport}
          onClose={() => setShowDivergenceReport(false)}
          onFinishAndReset={handleFinishAndReset}
          collectedItems={inventario}
          expectedItems={expectedItems}
          inventoryCc={inventarioCentroCusto}
        />
      )}

      <AddNotFoundItemModal
        show={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onConfirm={handleConfirmAddItem}
        itemCode={itemCodeToAdd}
      />

      <footer className="app-footer">
        <p className="mb-0">© {new Date().getFullYear()} - Sistema de Consulta de Imobilizados | Desenvolvido para Videplast</p>
      </footer>
    </div>
  );
}

export default App;