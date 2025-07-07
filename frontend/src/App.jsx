import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card } from 'react-bootstrap';
import Header from './components/Header';
import InputArea from './components/InputArea';
import Inventory from './components/Inventory';
import ResultsDisplay from './components/ResultsDisplay';
import ReportModal from './components/ReportModal';
import DivergenceReport from './components/DivergenceReport'; // Importar o novo componente
import { API_URL } from './apiConfig'; 

function App() {
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inventarioAtivo, setInventarioAtivo] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [inventarioCentroCusto, setInventarioCentroCusto] = useState(''); // Novo estado para o CC do inventário
  const [expectedItems, setExpectedItems] = useState([]); // Novo estado para os itens esperados
  const [showDivergenceReport, setShowDivergenceReport] = useState(false); // Novo estado para controlar o relatório de divergências
  
  useEffect(() => {
    try {
      const inventarioSalvo = localStorage.getItem('inventario');
      if (inventarioSalvo) {
        setInventario(JSON.parse(inventarioSalvo));
      }
    } catch (e) {
      console.error("Erro ao carregar inventário do localStorage:", e);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('inventario', JSON.stringify(inventario));
    } catch (e) {
        console.error("Erro ao salvar inventário no localStorage:", e);
    }
  }, [inventario]);

  const formatarCodigo = (valor) => {
    if (!valor) return "";
    return String(valor).trim().replace(/\.0$/, '').replace(/^0+/, '');
  }

  // Nova função para buscar itens esperados
  const fetchExpectedItems = async (cc) => {
    if (!cc) return;
    try {
      const response = await axios.get(`${API_URL}/imobilizado?codigo=${cc}`);
      // A API retorna um objeto com 'itens' dentro, então pegamos apenas a lista de itens
      setExpectedItems(response.data.itens || []);
    } catch (error) {
      console.error("Erro ao buscar itens esperados:", error);
      setExpectedItems([]);
      // Opcional: exibir um erro para o usuário
    }
  };

  const handleCodeSearch = async (codeToSearch) => {
    if (isLoading) {
      return; 
    }

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
      
      if (inventarioAtivo) {
        if (dados.itens && dados.itens.length > 0) {
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
      }
    } catch (err) {
      setResultado(null);
      const errorMessage = err.response?.status === 404 
        ? `Imobilizado ${codeToSearch} não encontrado.` 
        : (err.response?.data?.message || 'Erro ao conectar ao servidor. Verifique sua conexão.');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const refreshData = () => {
    if (codigo) {
        handleCodeSearch(codigo);
    }
  };

  return (
    <Container>
      <Header />
      <main>
        <Card>
          <Card.Body>
            <InputArea 
              codigo={codigo}
              setCodigo={setCodigo}
              onConsultar={() => handleCodeSearch(codigo)}
              isLoading={isLoading}
            />
          </Card.Body>
        </Card>

        <ResultsDisplay 
            isLoading={isLoading} 
            error={error} 
            resultado={resultado}
            onRefresh={refreshData} 
        />

        <div className="d-grid gap-2 mt-4 d-sm-flex justify-content-sm-center">
            <Button variant="danger" size="lg" onClick={() => {
              const cc = prompt("Por favor, digite o Centro de Custo para iniciar o inventário:");
              if (cc) {
                setInventarioCentroCusto(cc);
                setInventarioAtivo(true);
                fetchExpectedItems(cc); // Buscar itens esperados ao iniciar o inventário
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
            inventarioCentroCusto={inventarioCentroCusto} // Nova prop
            expectedItems={expectedItems} // Nova prop
            onFinishInventory={() => setShowDivergenceReport(true)} // Nova prop para finalizar e mostrar relatório
          />
        )}
      </main>

      {showReportModal && <ReportModal show={showReportModal} onClose={() => setShowReportModal(false)} />}
      
      {/* Novo componente para o relatório de divergências */}
      {showDivergenceReport && (
        <DivergenceReport
          show={showDivergenceReport}
          onClose={() => setShowDivergenceReport(false)}
          collectedItems={inventario}
          expectedItems={expectedItems}
          inventoryCc={inventarioCentroCusto}
        />
      )}

      <footer className="text-center text-muted mt-5 border-top pt-3">
        <p>&copy; {new Date().getFullYear()} - Sistema de Consulta de Imobilizados | Desenvolvido para Videplast</p>
      </footer>
    </Container>
  );
}

export default App;