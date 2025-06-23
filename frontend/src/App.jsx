import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button } from 'react-bootstrap';
import Header from './components/Header';
import InputArea from './components/InputArea';
import QrScanner from './components/QrScanner';
import Inventory from './components/Inventory';
import ResultsDisplay from './components/ResultsDisplay';

const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [codigo, setCodigo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isQrReaderOpen, setQrReaderOpen] = useState(false);

  const [inventarioAtivo, setInventarioAtivo] = useState(false);
  const [inventario, setInventario] = useState([]);

  useEffect(() => {
    try {
      const inventarioSalvo = localStorage.getItem('inventario');
      if (inventarioSalvo) {
        setInventario(JSON.parse(inventarioSalvo));
      }
    } catch (e) {
      console.error("Erro ao carregar inventário do localStorage:", e);
      setInventario([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('inventario', JSON.stringify(inventario));
    } catch(e) {
      console.error("Erro ao salvar inventário no localStorage:", e);
    }
  }, [inventario]);

  const handleCodeSearch = async (codeToSearch) => {
    if (!codeToSearch || codeToSearch.trim() === '') {
      setError('Por favor, digite um código ou escaneie um QR Code');
      setResultado(null);
      return;
    }

    setIsLoading(true);
    setError('');
    setResultado(null);

    try {
      const response = await axios.get(`${API_URL}/imobilizado?codigo=${codeToSearch}`);
      const dados = { ...response.data };
      setResultado(dados);
      
      if (inventarioAtivo && !inventario.some(item => item.codigo === dados.codigo)) {
        setInventario(prevInventario => [dados, ...prevInventario]);
      }

    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError(`Imobilizado ${codeToSearch} não encontrado.`);
      } else {
        setError('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQrScan = (scannedCode) => {
    setCodigo(scannedCode);
    setQrReaderOpen(false);
    handleCodeSearch(scannedCode);
  };

  return (
    <Container className="py-3">
      <Header />
      
      <main>
        <InputArea 
          codigo={codigo}
          setCodigo={setCodigo}
          onConsultar={() => handleCodeSearch(codigo)}
          onQrClick={() => setQrReaderOpen(true)}
          isLoading={isLoading}
        />

        <ResultsDisplay
          isLoading={isLoading}
          error={error}
          resultado={resultado}
        />

        <div className="d-grid gap-2 mt-4">
          {!inventarioAtivo && (
            <Button variant="outline-primary" size="lg" onClick={() => setInventarioAtivo(true)}>
              📋 Iniciar Inventário
            </Button>
          )}
        </div>

        {inventarioAtivo && (
          <Inventory
            inventario={inventario}
            setInventario={setInventario}
            onClose={() => setInventarioAtivo(false)}
            onAddItem={handleCodeSearch}
            isLoading={isLoading}
          />
        )}
      </main>

      {isQrReaderOpen && (
        <QrScanner
          onScan={handleQrScan}
          onClose={() => setQrReaderOpen(false)}
        />
      )}
      
      <footer className="text-center text-muted mt-5 border-top pt-3">
        <p>&copy; {new Date().getFullYear()} - Sistema de Consulta de Imobilizados | Desenvolvido para Videplast</p>
      </footer>
    </Container>
  );
}

export default App;