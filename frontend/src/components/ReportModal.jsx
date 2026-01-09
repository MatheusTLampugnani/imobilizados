import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { supabase } from '../apiConfig';
import { generatePDF } from '../utils/generatePDF';
import { generateCSV } from '../utils/generateCSV';

const ReportModal = ({ show, onClose }) => {
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [selectedCC, setSelectedCC] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      fetchCCs();
    }
  }, [show]);

  const fetchCCs = async () => {
    try {
      const { data, error } = await supabase
        .from('centro_de_custo')
        .select('centro_custo, setores')
        .order('centro_custo');
      
      if (error) throw error;
      setCentrosCusto(data || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar lista de setores.');
    }
  };

  const handleGenerate = async (type) => {
    if (!selectedCC) return;
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('imobilizados')
        .select('*')
        .eq('centro_custo', selectedCC)
        .order('descricao');

      if (error) throw error;

      if (!data || data.length === 0) {
        setError('Nenhum item encontrado neste setor.');
        setLoading(false);
        return;
      }

      const ccInfo = centrosCusto.find(c => c.centro_custo === selectedCC);
      const nomeSetor = ccInfo ? ccInfo.setores : '';

      if (type === 'pdf') {
        await generatePDF(data, selectedCC, nomeSetor);
      } else {
        const mapCC = { [selectedCC]: nomeSetor };
        generateCSV(data, mapCC);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro ao gerar relatório: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Gerar Relatórios</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="warning">{error}</Alert>}

        <Form.Group>
          <Form.Label>Selecione o Centro de Custo</Form.Label>
          <Form.Select 
            value={selectedCC} 
            onChange={e => setSelectedCC(e.target.value)}
          >
            <option value="">Selecione...</option>
            {centrosCusto.map(cc => (
              <option key={cc.centro_custo} value={cc.centro_custo}>
                {cc.centro_custo} - {cc.setores}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Fechar</Button>
        <Button variant="success" onClick={() => handleGenerate('csv')} disabled={loading || !selectedCC}>Baixar CSV</Button>
        <Button variant="danger" onClick={() => handleGenerate('pdf')} disabled={loading || !selectedCC}>Baixar PDF</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportModal;