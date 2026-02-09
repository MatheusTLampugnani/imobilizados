import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Button, Form, InputGroup } from 'react-bootstrap';
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
        if (!search) return true;
        const termo = search.toLowerCase();
        
        const usuario = String(log.usuario || '').toLowerCase();
        const tipo = String(log.tipo_alteracao || '').toLowerCase();
        const detalhes = String(log.detalhes || '').toLowerCase();
        const codigo = String(log.codigo_imobilizado || '').toLowerCase();

        return (
            usuario.includes(termo) ||
            tipo.includes(termo) ||
            detalhes.includes(termo) ||
            codigo.includes(termo)
        );
    });
    setFilteredLogs(result);
  }, [search, logs]);

  const getActionStyle = (actionType) => {
      const type = String(actionType || '').toLowerCase();

      if (type.includes('inventário')) {
          return { backgroundColor: '#e7f5ff', color: '#004085', border: '1px solid #b8daff' };
      } 
      else if (type.includes('série')) {
          return { backgroundColor: '#e0f2f1', color: '#004d40', border: '1px solid #b2dfdb' };
      } 
      else if (type.includes('centro de custo')) {
          return { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' };
      }
      else if (type.includes('local')) {
          return { backgroundColor: '#f3e5f5', color: '#4a148c', border: '1px solid #e1bee7' };
      }
      return { backgroundColor: '#f8f9fa', color: '#383d41', border: '1px solid #d6d8db' };
  };

  const columns = [
    {
      name: 'Data',
      selector: row => new Date(row.created_at).toLocaleString('pt-BR'),
      sortable: true,
      width: '160px',
      style: { fontWeight: 'bold', fontSize: '0.8rem', color: '#555' }
    },
    {
      name: 'Usuário',
      selector: row => row.usuario,
      sortable: true,
      width: '110px',
      center: true,
      cell: row => (
          <span className="badge bg-light text-dark border shadow-sm">
              {row.usuario}
          </span>
      )
    },
    {
      name: 'Ação Realizada',
      selector: row => row.tipo_alteracao,
      sortable: true,
      width: '230px',
      cell: row => (
        <div 
            style={{ 
                ...getActionStyle(row.tipo_alteracao),
                padding: '5px 10px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.75rem',
                width: '100%',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}
        >
            {row.tipo_alteracao}
        </div>
      )
    },
    {
      name: 'Detalhes da Mudança',
      selector: row => row.detalhes,
      wrap: true,
      grow: 2,
      style: { fontSize: '0.85rem', lineHeight: '1.4' }
    },
    {
      name: 'Item (Cód)',
      selector: row => row.codigo_imobilizado || '-',
      width: '100px',
      center: true,
      style: { fontWeight: 'bold' }
    }
  ];

  const customStyles = {
    headCells: {
      style: { backgroundColor: '#343a40', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' },
    },
    rows: {
      style: { fontSize: '0.85rem', minHeight: '60px' },
    },
  };

  return (
    <div className="mt-3 fade-in">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
        <div className="d-flex align-items-center">
            <Button variant="outline-dark" onClick={onBack} className="me-3 shadow-sm border-0 bg-white">
                <ArrowLeft /> Voltar
            </Button>
            <h4 className="m-0 text-dark d-flex align-items-center">
                <ShieldLock className="me-2 text-primary" /> Auditoria do Sistema
            </h4>
        </div>
        <div style={{ width: '100%', maxWidth: '350px' }}>
            <InputGroup className="shadow-sm">
                <InputGroup.Text className="bg-white border-end-0"><Search className="text-muted"/></InputGroup.Text>
                <Form.Control 
                    placeholder="Filtrar por usuário, ação ou item..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="border-start-0"
                />
            </InputGroup>
        </div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0 rounded overflow-hidden">
          {loading ? (
             <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Carregando histórico...</p>
             </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredLogs}
              pagination
              paginationComponentOptions={{ rowsPerPageText: 'Registros por pág:', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' }}
              highlightOnHover
              striped
              dense
              customStyles={customStyles}
              noDataComponent={<div className="p-5 text-center text-muted">Nenhum registro de alteração encontrado.</div>}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminLogs;