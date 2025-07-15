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
      setError('Erro ao carregar o estado.');
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
      setError('Erro ao salvar o estado.');
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
      sessionStorage.removeItem('appState'); // Limpa estado anterior
      setInventario([]);
      return true;
    } catch (error) {
      console.error("Validação do Centro de Custo falhou:", error);
      return false;
    }
  };

  const handleCodeSearch = async (codeToSearch) => {
    if (isLoading) return;
    if (!codeToSearch || codeToSearch.trim() === '') {
      setError('Por favor, digite um código.');
      setResultado(null);
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_URL}/imobilizado?codigo=${codeToSearch}`);
      const dados = response.data;
      if (!dados || !dados.itens) {
        throw new Error("A resposta do servidor não continha os dados esperados.");
      }
      setResultado({
        codigo_imobilizado: dados.codigo_imobilizado,
        itens: dados.itens
      });
      if (inventarioAtivo && dados.itens.length > 0) {
        const codigoFormatado = formatarCodigo(codeToSearch);
        const itemEscaneado = dados.itens.find(item =>
          formatarCodigo(item.Inventário) === codigoFormatado ||
          formatarCodigo(item.Série) === codigoFormatado ||
          formatarCodigo(dados.codigo_imobilizado) === codigoFormatado
        );
        const itemParaAdicionar = itemEscaneado || dados.itens[0];
        if (itemParaAdicionar && !inventario.some(invItem => invItem.id === itemParaAdicionar.id)) {
          setInventario(prevInventario => [itemParaAdicionar, ...prevInventario]);
        }
      }
      return true;
    } catch (err) {
      setResultado(null);
      if (err.response?.status === 404) {
        if (inventarioAtivo) {
          setItemCodeToAdd(codeToSearch);
          setShowAddItemModal(true);
        } else {
          setError(`Imobilizado ${codeToSearch} não encontrado.`);
        }
      } else {
        const errorMessage = err.response?.data?.message || 'Erro ao conectar ao servidor.';
        setError(errorMessage);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAddItem = (description) => {
    if (!description.trim()) {
      setError('Por favor, insira uma descrição.');
      return;
    }
    const newItem = {
      id: Date.now(),
      Inventário: itemCodeToAdd,
      Descrição: description,
      notFound: true,
      CentroCusto: inventarioCentroCusto,
    };
    setInventario((prevInventario) => [newItem, ...prevInventario]);
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
  };

  return (
    <div className="app-wrapper">
      <Container>
        <Header />
        <InputArea
          codigo={codigo}
          setCodigo={setCodigo}
          onConsultar={() => handleCodeSearch(codigo)}
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
            onAddItem={handleCodeSearch}
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