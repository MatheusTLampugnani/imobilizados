import React, { useState } from 'react';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const ReportModal = ({ show, onClose }) => {
  const [centroCusto, setCentroCusto] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!centroCusto) {
      setError('Por favor, insira um centro de custo.');
      return;
    }
    setIsGenerating(true);
    setError('');

    try {
      const response = await axios.get(`${API_URL}/report/pdf?centro_custo=${centroCusto}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Relatorio_CC_${centroCusto}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onClose();

    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Nenhum item encontrado para o centro de custo ${centroCusto}.`);
      } else {
        setError('Erro ao gerar o relatório. Tente novamente.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Gerar Relatório de Imobilizados</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Digite o Centro de Custo para gerar o relatório em PDF.</p>
        <Form.Control
          type="text"
          value={centroCusto}
          onChange={(e) => setCentroCusto(e.target.value)}
          placeholder="Ex: 100005002"
          autoFocus
        />
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? <Spinner as="span" animation="border" size="sm" /> : 'Gerar PDF'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportModal;