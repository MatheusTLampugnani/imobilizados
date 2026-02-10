import React, { useState } from 'react';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const ReportModal = ({ show, onClose } ) => {
  const [centroCusto, setCentroCusto] = useState('');
  const [isGenerating, setIsGenerating] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (format) => {
    if (!centroCusto) {
      setError('Por favor, insira um centro de custo.');
      return;
    }
    setIsGenerating(format);
    setError('');

    try {
      const endpoint = `${API_URL}/report/${format}?centro_custo=${centroCusto}`;
      const fileName = `Relatorio_CC_${centroCusto}.${format}`;

      const response = await axios.get(endpoint, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onClose();

    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Nenhum item encontrado para o centro de custo ${centroCusto}.`);
      } else {
        setError('Erro ao gerar o relatório. Tente novamente.');
      }
    } finally {
      setIsGenerating(null);
    }
  };

  const handleClose = () => {
    setCentroCusto('');
    setError('');
    setIsGenerating(null);
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Gerar Relatório de Imobilizados</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Digite o Centro de Custo para gerar o relatório.</p>
        <Form.Control
          type="text"
          value={centroCusto}
          onChange={(e) => setCentroCusto(e.target.value)}
          placeholder="Ex: 1005ADMI03"
          autoFocus
        />
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button 
          variant="success" 
          onClick={() => handleGenerate('csv')} 
          disabled={isGenerating !== null}
        >
          {isGenerating === 'csv' 
            ? <Spinner as="span" animation="border" size="sm" /> 
            : 'Gerar CSV'}
        </Button>
        <Button 
          variant="danger" 
          onClick={() => handleGenerate('pdf')} 
          disabled={isGenerating !== null}
        >
          {isGenerating === 'pdf' 
            ? <Spinner as="span" animation="border" size="sm" /> 
            : 'Gerar PDF'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportModal;