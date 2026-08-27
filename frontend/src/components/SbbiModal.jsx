import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { FileEarmarkPdfFill } from 'react-bootstrap-icons';
import { gerarPdfBaixa } from '../utils/sbbiPdfGenerator';

/**
 * @param {boolean} show - Controla a exibição do modal.
 * @param {function} onClose - Função para fechar o modal.
 * @param {Object} item - O ativo/imobilizado que será baixado.
 */
const SbbiModal = ({ show, onClose, item }) => {
  const [motivo, setMotivo] = useState('Obsoleto');
  const [observacoes, setObservacoes] = useState('');

  const handleGeneratePdf = () => {
    if (!item) return;

    gerarPdfBaixa(item, motivo, observacoes);

    onClose();
  };

  const handleClose = () => {
    setMotivo('Obsoleto');
    setObservacoes('');
    onClose();
  };

  if (!item) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton className="bg-danger text-white border-0 shadow-sm">
        <Modal.Title className="d-flex align-items-center gap-2">
          <FileEarmarkPdfFill size={22} /> Solicitação de Baixa (SBBI)
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="bg-light p-4">
        <div className="bg-white p-3 rounded shadow-sm mb-4 border-start border-danger border-4">
          <h6 className="text-secondary small fw-bold text-uppercase mb-2">Item Selecionado</h6>
          <Row className="g-2">
            <Col sm={4}>
              <span className="text-muted d-block small">Plaqueta / Patrimônio:</span>
              <strong className="text-dark">{item.codigo_imobilizado || item.codigo_inventario || item.Inventário || item.id}</strong>
            </Col>
            <Col sm={2}>
              <span className="text-muted d-block small">Subnº:</span>
              <strong className="text-dark">{item['Subnº'] || item.sub_numero || '0'}</strong>
            </Col>
            <Col sm={6}>
              <span className="text-muted d-block small">Descrição:</span>
              <strong className="text-dark">{item.descricao || item.Descrição || 'Sem descrição'}</strong>
            </Col>
            <Col sm={4} className="mt-2">
              <span className="text-muted d-block small">Centro de Custo:</span>
              <strong className="text-dark">{item.centro_custo || item.CentroCusto || 'N/A'}</strong>
            </Col>
            <Col sm={8} className="mt-2">
              <span className="text-muted d-block small">Localização:</span>
              <strong className="text-dark">{item.local || item.Local || 'N/A'}</strong>
            </Col>
          </Row>
        </div>

        <Form>
          {/* Motivo da Baixa */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold text-secondary mb-2 small text-uppercase">1. Selecione o Motivo da Baixa</Form.Label>
            <div className="bg-white p-3 rounded shadow-sm border">
              <Row>
                {['Obsoleto', 'Quebra', 'Venda', 'Doação', 'Sinistro'].map((opt) => (
                  <Col xs={6} sm={4} md={2.4} key={opt} className="mb-2 mb-md-0">
                    <Form.Check
                      type="radio"
                      id={`motivo-${opt}`}
                      label={opt}
                      name="motivoBaixa"
                      value={opt}
                      checked={motivo === opt}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="fw-semibold text-dark"
                    />
                  </Col>
                ))}
              </Row>
            </div>
          </Form.Group>

          {/* Observações */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold text-secondary mb-2 small text-uppercase">2. Observações e Detalhes da Solicitação</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite aqui justificativas, estado atual do item ou qualquer detalhe relevante para a baixa..."
              className="shadow-sm border"
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer className="bg-light border-top border-2">
        <Button variant="secondary" onClick={handleClose} className="px-4">
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={handleGeneratePdf}
          className="d-flex align-items-center gap-2 px-4 shadow-sm"
        >
          <FileEarmarkPdfFill /> Gerar SBBI (PDF)
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SbbiModal;
