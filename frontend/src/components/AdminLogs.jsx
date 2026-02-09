import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Button, Badge, Form, InputGroup } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { ArrowLeft, ShieldLock, Search } from 'react-bootstrap-icons';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const AdminLogs = ({ onBack }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/logs`);
      setLogs(response.data);
      setFilteredLogs(response.data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar logs do sistema.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const result = logs.filter(log => {
        const termo = search.toLowerCase();
        return (
            log.usuario?.toLowerCase().includes(termo) ||
            log.tipo_alteracao?.toLowerCase().includes(termo) ||
            log.detalhes?.toLowerCase().includes(termo) ||
            (log.codigo_imobilizado && log.codigo_imobilizado.toString().includes(termo))
        );
    });
    setFilteredLogs(result);
  }, [search, logs]);

  const columns = [
    {
      name: 'Data',
      selector: row => new Date(row.created_at).toLocaleString('pt-BR'),
      sortable: true,
      width: '160px',
      style: { fontWeight: 'bold', fontSize: '0.8rem' }
    },
    {
      name: 'Usuário',
      selector: row => row.usuario,
      sortable: true,
      width: '100px',
      center: true,
      cell: row => <Badge bg="secondary">{row.usuario}</Badge>
    },
    {
      name: 'Ação',
      selector: row => row.tipo_alteracao,
      sortable: true,
      width: '180px',
      cell: row => (
        <Badge bg={row.tipo_alteracao.includes('Inventário') ? 'primary' : 'warning'} text="dark">
            {row.tipo_alteracao}
        </Badge>
      )
    },
    {
      name: 'Detalhes',
      selector: row => row.detalhes,
      wrap: true,
      grow: 2
    },
    {
      name: 'Item (Cód)',
      selector: row => row.codigo_imobilizado || '-',
      width: '100px',
      center: true
    }
  ];

  const customStyles = {
    headCells: {
      style: { backgroundColor: '#343a40', color: '#fff', fontWeight: 'bold' },
    },
    rows: {
      style: { fontSize: '0.85rem', minHeight: '50px' },
    },
  };

  return (
    <div className="mt-3 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
            <Button variant="outline-dark" onClick={onBack} className="me-3">
                <ArrowLeft /> Voltar
            </Button>
            <h4 className="m-0 text-dark d-flex align-items-center">
                <ShieldLock className="me-2 text-danger" /> Auditoria Geral do Sistema
            </h4>
        </div>
        <div style={{ width: '300px' }}>
            <InputGroup>
                <InputGroup.Text><Search /></InputGroup.Text>
                <Form.Control 
                    placeholder="Filtrar logs..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </InputGroup>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? (
             <div className="text-center p-5">
                <Spinner animation="border" variant="danger" />
             </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredLogs}
              pagination
              paginationComponentOptions={{ rowsPerPageText: 'Linhas:', rangeSeparatorText: 'de' }}
              highlightOnHover
              striped
              dense
              customStyles={customStyles}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminLogs;