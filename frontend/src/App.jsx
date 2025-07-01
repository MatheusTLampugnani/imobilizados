import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card } from 'react-bootstrap';
import Header from './components/Header';
import InputArea from './components/InputArea';
import Inventory from './components/Inventory';
import ResultsDisplay from './components/ResultsDisplay';
import ReportModal from './components/ReportModal';

const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inventarioAtivo, setInventarioAtivo] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    try {
      const inventarioSalvo = localStorage.getItem('inventario');
      if (inventarioSalvo) {
        setInventario(JSON.parse(inventarioSalvo));
      }
    } catch (e) {
      console.error("Erro ao carregar inventário:", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('inventario', JSON.stringify(inventario));
  }, [inventario]);

  const formatarCodigo = (valor) => {
    if (!valor) return "";
    return String(valor).trim().replace(/\.0$/, '').replace(/^0+/, '');
  }

  const handleCodeSearch = async (codeToSearch) => {
    if (!codeToSearch || codeToSearch.trim() === '') {
      setError('Por favor, digite um código.');
      setResultado(null);
      return false;
    }
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_URL}/imobilizado?codigo=${codeToSearch}`);
      const dados = response.data;
      
      setResultado({
        codigo_imobilizado: dados.codigo_imobilizado,
        itens: dados.itens
      });
      
      if (inventarioAtivo) {
        const codigoFormatado = formatarCodigo(codeToSearch);
        const itemEscaneado = dados.itens.find(item => 
            formatarCodigo(item.Inventário) === codigoFormatado || 
            formatarCodigo(item.Série) === codigoFormatado ||
            formatarCodigo(dados.codigo_imobilizado) === codigoFormatado
        );
        const itemParaAdicionar = itemEscaneado || dados.itens[0];

        if (!inventario.some(invItem => invItem.id === itemParaAdicionar.id)) {
            setInventario(prevInventario => [itemParaAdicionar, ...prevInventario]);
        }
      }
      return true;
    } catch (err) {
      setError(err.response?.status === 404 ? `Imobilizado ${codeToSearch} não encontrado.` : 'Erro ao conectar ao servidor.');
      return false;
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
    <Container className="app-container">
      <Header />
      <main>
        <Card className="border-0 mb-4">
          <Card.Body className="p-4">
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
            <Button variant="danger" size="lg" onClick={() => setInventarioAtivo(true)}>
              📋 Iniciar Inventário
            </Button>
            <Button variant="outline-danger" size="lg" onClick={() => setShowReportModal(true)}>
              📄 Gerar Relatório PDF
            </Button>
        </div>

        {inventarioAtivo && (
          <Inventory
            inventario={inventario}
            setInventario={setInventario}
            onClose={() => setInventarioAtivo(false)}
            onAddItem={handleCodeSearch}
          />
        )}
      </main>

      {showReportModal && <ReportModal show={showReportModal} onClose={() => setShowReportModal(false)} />}
      
      <footer className="text-center text-muted mt-5 border-top pt-3">
        <p>&copy; {new Date().getFullYear()} - Sistema de Consulta de Imobilizados | Desenvolvido para Videplast</p>
      </footer>
    </Container>
  );
}

export default App;