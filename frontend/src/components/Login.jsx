import React, { useState } from 'react';
import { Card, Form, Button, Spinner, Alert, Container } from 'react-bootstrap';
import api from '../lib/api';
import logoVideplast from '../assets/videplast-brand.png'; 

const LoginScreen = ({ onLoginSuccess }) => {
  const [cracha, setCracha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cracha.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', { cracha: cracha.trim() });
      if (response.data?.user) {
        onLoginSuccess(response.data.user);
      } else {
        throw new Error('Usuário não retornado pelo servidor.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erro de conexão ou crachá inválido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Card style={{ width: '100%', maxWidth: '420px' }} className="login-card fade-in-up">
          <Card.Body className="p-5">
            
            <div className="text-center mb-4 login-header">
              <img 
                src={logoVideplast} 
                alt="Videplast" 
                style={{ maxWidth: '160px', height: 'auto', marginBottom: '20px' }} 
              />
              <h4 className="fw-bold" style={{ color: '#333' }}>Acesso Restrito</h4>
              <p className="text-muted small mb-0">Controle de Imobilizados</p>
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-secondary" style={{ fontSize: '0.9rem' }}>
                  Número do Crachá
                </Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Ex: 12345" 
                  value={cracha}
                  onChange={(e) => setCracha(e.target.value)}
                  autoFocus
                  size="lg"
                  className="custom-input bg-light border-0"
                  style={{ fontSize: '1.1rem', padding: '12px' }}
                />
              </Form.Group>

              {error && (
                <Alert variant="danger" className="text-center py-2" style={{ fontSize: '0.9rem' }}>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </Alert>
              )}

              <Button 
                variant="danger" 
                type="submit" 
                className="w-100 btn-lg btn-login mt-2" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-2" />
                    Verificando...
                  </>
                ) : (
                  'ACESSAR SISTEMA'
                )}
              </Button>
            </Form>
          </Card.Body>
          
          <Card.Footer className="text-center py-3 bg-white border-0">
            <small className="text-muted">
              &copy; {new Date().getFullYear()} TI Infraestrutura - Videplast
            </small>
          </Card.Footer>
        </Card>
      </Container>
    </div>
  );
};

export default LoginScreen;