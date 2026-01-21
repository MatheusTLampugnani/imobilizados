import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Modal, Button, Spinner, Alert, Form, Row, Col, InputGroup, Card } from 'react-bootstrap';
import { Calendar, Building, Search, FileEarmarkSpreadsheet, PencilSquare, Trash, ListCheck, UpcScan, GeoAlt, Hash, CardText 
} from 'react-bootstrap-icons';
import { API_URL } from '../apiConfig';

const RegisteredItemsList = ({ show, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    centroCusto: '',
    termo: ''
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#f8f9fa',
        color: '#495057',
        fontWeight: 'bold',
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        borderBottom: '2px solid #dee2e6',
      },
    },
    rows: {
      style: {
        fontSize: '0.85rem',
        minHeight: '45px', 
      },
    },
    pagination: {
        style: {
            fontSize: '0.8rem',
            minHeight: '40px',
        }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.centroCusto) params.append('centro_custo', filters.centroCusto);
      if (filters.termo) params.append('termo', filters.termo);

      const response = await axios.get(`${API_URL}/imobilizados-cadastrados?${params.toString()}`);
      setItems(response.data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar a lista. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) fetchData();
  }, [show]); 

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.centroCusto) params.append('centro_custo', filters.centroCusto);
      if (filters.termo) params.append('termo', filters.termo);

      const response = await axios.get(`${API_URL}/report/excel?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Relatorio_Inventario_${new Date().toLocaleDateString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err); 
      alert("Erro ao baixar o relatório em Excel.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este item permanentemente?")) {
      try {
        await axios.delete(`${API_URL}/imobilizados-cadastrados/${id}`);
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error(err); 
        alert("Erro ao excluir o item.");
      }
    }
  };

  const handleEditClick = (row) => {
    setEditingItem(row);
    setEditForm({
      descricao: row.descricao,
      numero_serie: row.numero_serie,
      centro_custo: row.centro_custo,
      local: row.local
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await axios.put(`${API_URL}/imobilizados-cadastrados/${editingItem.id}`, editForm);
      const updatedList = items.map(item => 
        item.id === editingItem.id ? { ...item, ...response.data[0] } : item 
      );
      setItems(updatedList);
      setShowEditModal(false);
      fetchData(); 
    } catch (err) {
      console.error(err); 
      alert("Erro ao salvar alterações.");
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const columns = [
    { name: 'Data', selector: row => new Date(row.created_at).toLocaleDateString('pt-BR'), sortable: true, width: '100px' },
    { name: 'Descrição', selector: row => row.descricao, sortable: true, wrap: true, grow: 2 },
    { name: 'Inventário', selector: row => row.codigo_inventario, sortable: true, width: '110px' },
    { name: 'Série', selector: row => row.numero_serie, sortable: true, width: '110px' },
    { name: 'C. Custo', selector: row => row.centro_custo, sortable: true, width: '90px', center: true },
    { name: 'Local', selector: row => row.local, sortable: true, width: '120px' },
    { name: 'Resp.', selector: row => row.cracha, sortable: true, width: '90px', center: true },
    {
      name: 'Ações',
      button: true, 
      width: '100px',
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" className="p-1 px-2" onClick={() => handleEditClick(row)} title="Editar">
            <PencilSquare size={14} />
          </Button>
          <Button variant="outline-danger" size="sm" className="p-1 px-2" onClick={() => handleDelete(row.id)} title="Excluir">
            <Trash size={14} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <Modal show={show} onHide={onClose} size="xl" centered backdrop="static">
        <Modal.Header closeButton className="bg-danger text-white border-0 shadow-sm">
          <Modal.Title className="d-flex align-items-center gap-2">
            <ListCheck size={24} /> Itens Cadastrados (Novos)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light">
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Body className="p-3">
              <Row className="g-2">
                <Col md={12} className="mb-1">
                    <h6 className="text-muted small fw-bold text-uppercase mb-2">Filtros de Pesquisa</h6>
                </Col>
                <Col md={3} sm={6}>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-light border-end-0 text-muted"><Calendar /></InputGroup.Text>
                    <Form.Control 
                        type="date" 
                        name="startDate" 
                        value={filters.startDate} 
                        onChange={handleFilterChange} 
                        className="border-start-0"
                        title="Data Inicial"
                    />
                  </InputGroup>
                </Col>
                <Col md={3} sm={6}>
                   <InputGroup size="sm">
                    <InputGroup.Text className="bg-light border-end-0 text-muted"><Calendar /></InputGroup.Text>
                    <Form.Control 
                        type="date" 
                        name="endDate" 
                        value={filters.endDate} 
                        onChange={handleFilterChange} 
                        className="border-start-0"
                        title="Data Final"
                    />
                  </InputGroup>
                </Col>
                <Col md={2} sm={6}>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-light border-end-0 text-muted"><Building /></InputGroup.Text>
                    <Form.Control 
                        type="text" 
                        placeholder="CC (Ex: TI01)" 
                        name="centroCusto" 
                        value={filters.centroCusto} 
                        onChange={handleFilterChange} 
                        className="border-start-0"
                    />
                  </InputGroup>
                </Col>
                <Col md={4} sm={6}>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-light border-end-0 text-muted"><Search /></InputGroup.Text>
                    <Form.Control 
                        type="text" 
                        placeholder="Buscar geral..." 
                        name="termo" 
                        value={filters.termo} 
                        onChange={handleFilterChange} 
                        className="border-start-0"
                    />
                  </InputGroup>
                </Col>

                <Col md={12} className="d-flex justify-content-end gap-2 mt-2">
                    <Button variant="secondary" size="sm" onClick={() => setFilters({ startDate: '', endDate: '', centroCusto: '', termo: '' })}>
                        Limpar
                    </Button>
                    <Button variant="primary" size="sm" onClick={fetchData} className="px-3">
                        <Search className="me-1" /> Filtrar Resultados
                    </Button>
                    <Button variant="success" size="sm" onClick={handleExport} title="Baixar Excel" className="px-3">
                        <FileEarmarkSpreadsheet className="me-1" /> Exportar Excel
                    </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
             <Card.Body className="p-0 overflow-hidden rounded">
                {error && <Alert variant="danger" className="m-3">{error}</Alert>}
                
                {loading ? (
                    <div className="text-center p-5">
                        <Spinner animation="border" variant="danger" />
                        <p className="mt-2 text-muted small">Carregando registros...</p>
                    </div>
                ) : (
                    <DataTable
                    columns={columns}
                    data={items}
                    pagination
                    paginationComponentOptions={{ rowsPerPageText: 'Linhas:', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' }}
                    highlightOnHover
                    striped
                    responsive
                    dense
                    customStyles={customStyles}
                    noDataComponent={<div className="p-4 text-muted">Nenhum registro encontrado.</div>}
                    />
                )}
             </Card.Body>
          </Card>

        </Modal.Body>
        <Modal.Footer className="bg-white">
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white border-0">
          <Modal.Title className="h5"><PencilSquare className="me-2"/>Editar Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
           <Form>
             <Form.Group className="mb-3">
               <Form.Label className="small fw-bold text-muted">DESCRIÇÃO</Form.Label>
               <InputGroup>
                  <InputGroup.Text className="bg-light"><CardText /></InputGroup.Text>
                  <Form.Control type="text" value={editForm.descricao || ''} onChange={(e) => setEditForm({...editForm, descricao: e.target.value})} />
               </InputGroup>
             </Form.Group>

             <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Nº SÉRIE</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light"><Hash /></InputGroup.Text>
                            <Form.Control type="text" value={editForm.numero_serie || ''} onChange={(e) => setEditForm({...editForm, numero_serie: e.target.value})} />
                        </InputGroup>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">CENTRO DE CUSTO</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light"><Building /></InputGroup.Text>
                            <Form.Control type="text" value={editForm.centro_custo || ''} onChange={(e) => setEditForm({...editForm, centro_custo: e.target.value})} />
                        </InputGroup>
                    </Form.Group>
                </Col>
             </Row>

             <Form.Group className="mb-3">
               <Form.Label className="small fw-bold text-muted">LOCALIZAÇÃO</Form.Label>
               <InputGroup>
                  <InputGroup.Text className="bg-light"><GeoAlt /></InputGroup.Text>
                  <Form.Control type="text" value={editForm.local || ''} onChange={(e) => setEditForm({...editForm, local: e.target.value})} />
               </InputGroup>
             </Form.Group>
           </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowEditModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveEdit}>Salvar Alterações</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RegisteredItemsList;