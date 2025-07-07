import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button } from 'react-bootstrap';
import Header from './components/Header';
import InputArea from './components/InputArea';
import Inventory from './components/Inventory';
import ResultsDisplay from './components/ResultsDisplay';
import ReportModal from './components/ReportModal';
import DivergenceReport from './components/DivergenceReport';
import { API_URL } from './apiConfig'; 
import './App.css';

function App() {
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
  
  useEffect(() => {
    try {
      const inventarioSalvo = localStorage.getItem('inventario');
      if (inventarioSalvo) setInventario(JSON.parse(inventarioSalvo));
    } catch (e) { console.error("Erro ao carregar inventário:", e); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('inventario', JSON.stringify(inventario));
    } catch (e) { console.error("Erro ao salvar inventário:", e); }
  }, [inventario]);

  const formatarCodigo = (valor) => {
    if (!valor) return "";
    return String(valor).trim().replace(/\.0$/, '').replace(/^0+/, '');
  }

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
    } catch (err) {
      setResultado(null);
      const errorMessage = err.response?.status === 404 
        ? `Imobilizado ${codeToSearch} não encontrado.` 
        : (err.response?.data?.message || 'Erro ao conectar ao servidor.');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
      <Container className="app-container">
        <Header/>
        <div className="main-content-area">
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
        </div>
        <div className="main-actions-container">
            <Button variant="danger" size="lg" onClick={() => {
              const cc = prompt("Por favor, digite o Centro de Custo para iniciar o inventário:");
              if (cc) {
                setInventarioCentroCusto(cc);
                setInventarioAtivo(true);
                fetchExpectedItems(cc);
              }
            }}>
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

      <footer className="app-footer">
        <p className="mb-0">&copy; {new Date().getFullYear()} - Sistema de Consulta de Imobilizados | Desenvolvido para Videplast</p>
      </footer>
    </div>
  );
}

export default App;
