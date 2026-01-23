import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Modal, Button, Spinner, Alert, Form, Row, Col, InputGroup, Card } from 'react-bootstrap';
import { Calendar, Building, Search, FileEarmarkSpreadsheet, PencilSquare, Trash, ListCheck, CardText, GeoAlt, Hash } from 'react-bootstrap-icons';
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
        minHeight: '50px', 
      },
    },
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
      setError('Erro ao carregar a lista. Tente novamente.');
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
          <Button variant="outline-primary" size="sm" className="px-2" onClick={() => handleEditClick(row)} title="Editar">
            <PencilSquare />
          </Button>
          <Button variant="outline-danger" size="sm" className="px-2" onClick={() => handleDelete(row.id)} title="Excluir">
            <Trash />
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
              <h6 className="text-secondary small fw-bold text-uppercase mb-3">
                <Search className="me-1" /> Filtros de Pesquisa
              </h6>
              <Row className="g-3">
                <Col md={3} sm={6}>
                  <Form.Label className="small fw-bold text-muted mb-1">DATA INICIAL</Form.Label>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-white"><Calendar /></InputGroup.Text>
                    <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                  </InputGroup>
                </Col>
                <Col md={3} sm={6}>
                  <Form.Label className="small fw-bold text-muted mb-1">DATA FINAL</Form.Label>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-white"><Calendar /></InputGroup.Text>
                    <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                  </InputGroup>
                </Col>
                <Col md={2} sm={6}>
                  <Form.Label className="small fw-bold text-muted mb-1">CENTRO DE CUSTO</Form.Label>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-white"><Building /></InputGroup.Text>
                    <Form.Control 
                        type="text" 
                        placeholder="Ex: TI01" 
                        name="centroCusto" 
                        value={filters.centroCusto} 
                        onChange={handleFilterChange} 
                    />
                  </InputGroup>
                </Col>
                <Col md={4} sm={6}>
                  <Form.Label className="small fw-bold text-muted mb-1">BUSCA RÁPIDA</Form.Label>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-white"><Search /></InputGroup.Text>
                    <Form.Control 
                        type="text" 
                        placeholder="Nome, Série, Crachá, Local..." 
                        name="termo" 
                        value={filters.termo} 
                        onChange={handleFilterChange} 
                    />
                  </InputGroup>
                </Col>
                <Col md={12} className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
                    <Button variant="light" size="sm" onClick={() => setFilters({ startDate: '', endDate: '', centroCusto: '', termo: '' })}>
                        Limpar Filtros
                    </Button>
                    <Button variant="primary" size="sm" onClick={fetchData} className="px-4">
                        <Search className="me-1" /> Pesquisar
                    </Button>
                    <Button variant="success" size="sm" onClick={handleExport} className="px-4">
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
                        <p className="mt-2 text-muted small">Carregando...</p>
                    </div>
                ) : (
                    <DataTable
                      columns={columns}
                      data={items}
                      pagination
                      paginationComponentOptions={{ rowsPerPageText: 'Registros:', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' }}
                      highlightOnHover
                      striped
                      responsive
                      dense
                      customStyles={customStyles}
                      noDataComponent={<div className="p-5 text-center text-muted">Nenhum registro encontrado.</div>}
                    />
                )}
             </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer className="bg-white">
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="bg-primary text-white border-0 shadow-sm">
          <Modal.Title className="h6 mb-0 d-flex align-items-center">
            <PencilSquare className="me-2"/> Editar Item
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
           <Form>
             <Form.Group className="mb-3">
               <Form.Label className="small fw-bold text-secondary">DESCRIÇÃO DO ITEM</Form.Label>
               <InputGroup>
                  <InputGroup.Text className="bg-light"><CardText /></InputGroup.Text>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    value={editForm.descricao || ''} 
                    onChange={(e) => setEditForm({...editForm, descricao: e.target.value})} 
                  />
               </InputGroup>
             </Form.Group>

             <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-secondary">Nº DE SÉRIE</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light"><Hash /></InputGroup.Text>
                            <Form.Control type="text" value={editForm.numero_serie || ''} onChange={(e) => setEditForm({...editForm, numero_serie: e.target.value})} />
                        </InputGroup>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-secondary">CENTRO DE CUSTO</Form.Label>
                        <InputGroup>
                            <InputGroup.Text className="bg-light"><Building /></InputGroup.Text>
                            <Form.Control type="text" value={editForm.centro_custo || ''} onChange={(e) => setEditForm({...editForm, centro_custo: e.target.value})} />
                        </InputGroup>
                    </Form.Group>
                </Col>
             </Row>

             <Form.Group className="mb-2">
               <Form.Label className="small fw-bold text-secondary">LOCALIZAÇÃO</Form.Label>
               <InputGroup>
                  <InputGroup.Text className="bg-light"><GeoAlt /></InputGroup.Text>
                  <Form.Control type="text" value={editForm.local || ''} onChange={(e) => setEditForm({...editForm, local: e.target.value})} />
               </InputGroup>
             </Form.Group>
           </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light border-top-0">
          <Button variant="outline-secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveEdit} className="px-4 shadow-sm">Salvar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RegisteredItemsList;