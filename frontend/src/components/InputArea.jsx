import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import InputArea from './components/InputArea';
import { API_URL } from './apiConfig';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [codigo, setCodigo] = useState('');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConsultar = async () => {
    if (!codigo.trim()) {
      setError("Por favor, digite um código para consultar.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`${API_URL}/imobilizado?codigo=${codigo}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ativo não encontrado ou erro na API');
      }
      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center text-center mb-4">
        <Col md={8}>
          <h1>Consulta de Ativos</h1>
          <p className="lead">s
            Digite o código do ativo, inventário ou número de série para buscar.
          </p>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md={8}>
          <InputArea 
            codigo={codigo}
            setCodigo={setCodigo}
            onConsultar={handleConsultar}
            isLoading={isLoading}
          />
          {error && <p className="text-danger mt-3">{error}</p>}
        </Col>
      </Row>
    </Container>
  );
}

export default App;