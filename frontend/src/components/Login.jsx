import React, { useState } from 'react';
import { Card, Form, Button, Spinner, Alert, Container, Modal } from 'react-bootstrap';
import { ExclamationTriangleFill, BoxArrowUpRight, BookmarkStar } from 'react-bootstrap-icons';
import api from '../lib/api';
import logoVideplast from '../assets/videplast-brand.png';

// Endereço oficial do sistema (servidor da Videplast). O aviso de mudança aparece só para quem ainda abre
// pelo endereço antigo; no endereço oficial ele não aparece.
const ENDERECO_OFICIAL = 'https://imobilizados.tailbba2c4.ts.net/';
// No servidor da Videplast o sistema fica em /imobilizados/, pelo endereço oficial ou pelo IP da rede
// (ex.: http://192.168.1.106/imobilizados/, que funciona mesmo quando o endereço da internet cai).
const noEnderecoAntigo = window.location.origin !== new URL(ENDERECO_OFICIAL).origin
  && !window.location.pathname.startsWith('/imobilizados/');

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
      {/* Aviso de mudança de endereço: só no endereço antigo (estático e não fechável) */}
      <Modal
        show={noEnderecoAntigo}
        backdrop="static"
        keyboard={false}
        centered
        className="modal-migration"
      >
        <div className="modal-migration-topbar"></div>
        <Modal.Body className="p-4 p-md-5 text-center">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <img
              src={logoVideplast}
              alt="Videplast"
              style={{ maxWidth: '145px', height: 'auto' }}
            />
            <span className="migration-badge">
              COMUNICADO OFICIAL
            </span>
          </div>

          <div className="migration-icon-wrapper mb-3">
            <ExclamationTriangleFill size={34} />
          </div>

          <h3 className="fw-bold text-dark mb-2" style={{ letterSpacing: '-0.4px', fontSize: '1.45rem' }}>
            Mudamos o endereço do sistema!
          </h3>

          <p className="text-secondary mb-4" style={{ fontSize: '0.94rem', lineHeight: '1.55' }}>
            O sistema de <strong>Controle de Imobilizados</strong> foi transferido para uma nova infraestrutura oficial. Acesse pelo novo link para continuar com total estabilidade:
          </p>

          <div className="migration-url-box p-3 mb-4 text-start">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted fw-semibold" style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Novo Link Oficial
              </span>
            </div>
            <div className="mt-2">
              <span className="migration-url-text text-danger">
                {ENDERECO_OFICIAL}
              </span>
            </div>
          </div>

          <Button
            as="a"
            href={ENDERECO_OFICIAL}
            className="w-100 py-3 btn-lg d-flex align-items-center justify-content-center gap-2 shadow text-white btn-migration-cta"
            style={{
              fontSize: '1rem',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <span>ACESSAR NOVO SISTEMA AGORA</span>
            <BoxArrowUpRight size={18} />
          </Button>
        </Modal.Body>
      </Modal>

      <Container className="d-flex justify-content-center align-items-center py-4" style={{ minHeight: '100vh' }}>
        <Card style={{ width: '100%', maxWidth: '440px' }} className="login-card fade-in-up">
          <Card.Body className="p-4 p-sm-5">

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
                  <ExclamationTriangleFill className="me-2" />
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