import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Button } from 'react-bootstrap';

import Header from './components/Header';
import InputArea from './components/InputArea';
// O QrScanner não é mais importado aqui
import Inventory from './components/Inventory';
import ResultsDisplay from './components/ResultsDisplay';

const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [resultado, setResultado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inventarioAtivo, setInventarioAtivo] = useState(false);
  const [inventario, setInventario] = useState([]);

  // Efeitos para carregar e salvar o inventário (sem alterações)
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

  const handleCodeSubmit = async (code) => {
    if (!code) {
      setError('Por favor, forneça um código para consultar.');
      return;
    }

    setIsLoading(true);
    setError('');
    // Limpa apenas o resultado da consulta principal, não o inventário
    if (!inventarioAtivo) {
        setResultado(null);
    }

    try {
      const response = await axios.get(`${API_URL}/imobilizado/${code}`);
      const dados = { codigo: code, ...response.data };
      
      if (inventarioAtivo) {
        // Evita adicionar itens duplicados no inventário
        if (!inventario.some(item => item.codigo === code)) {
          setInventario(prevInventario => [dados, ...prevInventario]);
        }
      } else {
        setResultado(dados);
      }

    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError(`Imobilizado com código "${code}" não encontrado.`);
      } else {
        setError('Erro ao conectar com o servidor.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-3">
      <Header />
      <main>
        {/* O InputArea agora não tem mais a prop onQrClick */}
        <InputArea 
          onCodeSubmit={handleCodeSubmit}
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
          // Passa a função de adicionar e o estado de loading para o inventário
          <Inventory
            inventario={inventario}
            setInventario={setInventario}
            onClose={() => setInventarioAtivo(false)}
            onAddItem={handleCodeSubmit}
            isLoading={isLoading}
          />
        )}
      </main>
      
      {/* O modal antigo de QR code foi totalmente removido daqui */}
      
      <footer className="text-center text-muted mt-5 border-top pt-3">
        <p>&copy; {new Date().getFullYear()} - Sistema de Consulta de Imobilizados | Desenvolvido para Videplast</p>
      </footer>
    </Container>
  );
}

export default App;
