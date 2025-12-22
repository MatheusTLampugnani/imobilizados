import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { API_URL } from '../apiConfig';

const RegisteredItemsList = ({ show, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const columns = [
    { name: 'Data', selector: row => new Date(row.created_at).toLocaleDateString('pt-BR'), sortable: true, width: '120px' },
    { name: 'Descrição', selector: row => row.descricao, sortable: true, wrap: true },
    { name: 'Inventário', selector: row => row.codigo_inventario, sortable: true, width: '150px' },
    { name: 'C. Custo', selector: row => row.centro_custo, sortable: true, width: '120px' },
    { name: 'Responsável', selector: row => row.cracha, sortable: true, width: '150px' }
  ];

  useEffect(() => {
    if (show) fetchData();
  }, [show]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/imobilizados-cadastrados`);
      setItems(response.data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar a lista. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>Itens Cadastrados no Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
          <div className="text-center p-5"><Spinner animation="border" variant="danger" /></div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            pagination
            paginationComponentOptions={{ rowsPerPageText: 'Linhas:', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' }}
            highlightOnHover
            striped
            responsive
            noDataComponent="Nenhum registro encontrado."
          />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Fechar</Button>
        <Button variant="outline-primary" onClick={fetchData}>Atualizar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegisteredItemsList;