import React, { useState } from 'react';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

const ReportModal = ({ show, onClose } ) => {
  const [centroCusto, setCentroCusto] = useState('');
  const [isGenerating, setIsGenerating] = useState(null); // Pode ser 'pdf', 'csv' ou null
  const [error, setError] = useState('');

  // Função genérica para gerar o relatório
  const handleGenerate = async (format) => {
    if (!centroCusto) {
      setError('Por favor, insira um centro de custo.');
      return;
    }
    setIsGenerating(format); // Define qual formato está sendo gerado (ex: 'pdf')
    setError('');

    try {
      // A URL e o nome do arquivo mudam com base no formato
      const endpoint = `${API_URL}/report/${format}?centro_custo=${centroCusto}`;
      const fileName = `Relatorio_CC_${centroCusto}.${format}`;

      const response = await axios.get(endpoint, {
        responseType: 'blob', // Essencial para o download de arquivos
      });

      // Lógica para criar e acionar o link de download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Limpeza
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onClose(); // Fecha o modal após o sucesso

    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Nenhum item encontrado para o centro de custo ${centroCusto}.`);
      } else {
        setError('Erro ao gerar o relatório. Tente novamente.');
      }
    } finally {
      setIsGenerating(null); // Reseta o estado de geração
    }
  };

  // Limpa o estado quando o modal é fechado
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
          placeholder="Ex: 100005002"
          autoFocus
        />
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        
        {/* Botão para gerar CSV */}
        <Button 
          variant="success" 
          onClick={() => handleGenerate('csv')} 
          disabled={isGenerating !== null}
        >
          {isGenerating === 'csv' 
            ? <Spinner as="span" animation="border" size="sm" /> 
            : 'Gerar CSV'}
        </Button>

        {/* Botão para gerar PDF */}
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
