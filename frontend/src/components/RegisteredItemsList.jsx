import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Modal, Button, Spinner, Alert, Form, Row, Col, InputGroup, Card } from 'react-bootstrap';
import { Calendar, Building, Search, FileEarmarkSpreadsheet, PencilSquare, Trash, ListCheck, CardText, GeoAlt, Hash, ExclamationTriangle } from 'react-bootstrap-icons';
import { API_URL } from '../apiConfig';
import { locationsData } from '../utils/locais';

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
  const [editSector, setEditSector] = useState('');
  const [editSubLocal, setEditSubLocal] = useState('');
  const [editSubLocalOptions, setEditSubLocalOptions] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#f8f9fa',
        color: '#495057',
        fontWeight: 'bold',
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        borderBottom: '2px solid #dee2e6',
      },
    },
    rows: {
      style: {
        fontSize: '0.85rem',
        minHeight: '70px',
        paddingTop: '10px',
        paddingBottom: '10px'
      },
    },
    cells: {
        style: {
            paddingLeft: '8px',
            paddingRight: '8px',
            lineHeight: '1.4',
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

  const confirmDelete = (row) => {
    setItemToDelete(row);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/imobilizados-cadastrados/${itemToDelete.id}`);
      setItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      console.error(err); 
      alert("Erro ao excluir o item.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (row) => {
    setEditingItem(row);

    let currentSector = '';
    let currentSub = '';

    if (row.local && row.local.includes(' - ')) {
        const parts = row.local.split(' - ');
        currentSector = parts[0];
        currentSub = parts.slice(1).join(' - '); 
    } else if (row.local) {
        currentSector = Object.keys(locationsData).find(key => row.local.includes(key)) || '';
    }

    setEditSector(currentSector);
    setEditSubLocal(currentSub);
    setEditSubLocalOptions(currentSector ? locationsData[currentSector] : []);

    setEditForm({
      descricao: row.descricao,
      numero_serie: row.numero_serie,
      centro_custo: row.centro_custo,
      local: row.local
    });
    setShowEditModal(true);
  };

  const handleEditSectorChange = (e) => {
    const sector = e.target.value;
    setEditSector(sector);

    if (sector && locationsData[sector]) {
        setEditSubLocalOptions(locationsData[sector]);
        setEditSubLocal('');
        setEditForm(prev => ({ ...prev, local: `${sector} - ` }));
    } else {
        setEditSubLocalOptions([]);
        setEditSubLocal('');
        setEditForm(prev => ({ ...prev, local: '' }));
    }
  };

  const handleEditSubLocalChange = (e) => {
    const sub = e.target.value;
    setEditSubLocal(sub);
    setEditForm(prev => ({ ...prev, local: `${editSector} - ${sub}` }));
  };

  const handleSaveEdit = async () => {
    try {
      if (editSector && !editSubLocal) {
         alert("Por favor, selecione o ambiente específico (sub-local).");
         return;
      }

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
    { 
        name: 'Data', 
        selector: row => new Date(row.created_at).toLocaleDateString('pt-BR'), 
        sortable: true, 
        width: '100px' 
    },
    { 
        name: 'Descrição', 
        selector: row => row.descricao, 
        sortable: true, 
        wrap: true, 
        grow: 2 
    },
    { 
        name: 'Inventário', 
        selector: row => row.codigo_inventario, 
        sortable: true, 
        wrap: true,
        width: '120px' 
    },
    { 
        name: 'Série', 
        selector: row => row.numero_serie, 
        sortable: true, 
        wrap: true,
        width: '120px' 
    },
    { 
        name: 'C. Custo', 
        selector: row => row.centro_custo, 
        sortable: true, 
        wrap: true,
        width: '140px',
        center: true 
    },
    { 
        name: 'Local', 
        selector: row => row.local, 
        sortable: true, 
        wrap: true, 
        width: '150px' 
    },
    { 
        name: 'Resp.', 
        selector: row => row.cracha, 
        sortable: true, 
        width: '100px', 
        center: true 
    },
    {
      name: 'Ações',
      button: true, 
      width: '120px',
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button 
            size="sm" 
            className="px-2 border-0 shadow-sm" 
            onClick={() => handleEditClick(row)} 
            title="Editar"
            style={{ backgroundColor: '#e7f5ff', color: '#004085' }}
          >
            <PencilSquare />
          </Button>
          
          <Button 
            size="sm" 
            className="px-2 border-0 shadow-sm" 
            onClick={() => confirmDelete(row)} 
            title="Excluir"
            style={{ backgroundColor: '#ffebee', color: '#c62828' }}
          >
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
                  
                  <Form.Select 
                    value={editSector} 
                    onChange={handleEditSectorChange}
                    className="fw-bold"
                  >
                    <option value="">Selecione o Setor...</option>
                    {Object.keys(locationsData).map((sector) => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </Form.Select>

                  <Form.Select 
                    value={editSubLocal} 
                    onChange={handleEditSubLocalChange}
                    disabled={!editSector}
                  >
                     <option value="">Selecione o Ambiente...</option>
                     {editSubLocalOptions.map((sub, idx) => (
                       <option key={idx} value={sub}>{sub}</option>
                     ))}
                  </Form.Select>
               </InputGroup>
             </Form.Group>
           </Form>
        </Modal.Body>
        <Modal.Footer className="bg-light border-top-0">
          <Button variant="outline-secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveEdit} className="px-4 shadow-sm">Salvar</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header className="bg-danger text-white border-0">
            <Modal.Title className="h5 d-flex align-items-center">
                <ExclamationTriangle className="me-2" /> Confirmar Exclusão
            </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
            <p className="mb-1 text-secondary">Você está prestes a excluir o item:</p>
            <h5 className="mb-3 text-dark fw-bold">{itemToDelete?.descricao}</h5>
            <p className="text-muted small">Essa ação é permanente e não poderá ser desfeita.</p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center pb-4">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="px-4">
                Cancelar
            </Button>
            <Button variant="danger" onClick={executeDelete} disabled={isDeleting} className="px-4">
                {isDeleting ? <Spinner as="span" animation="border" size="sm" /> : 'Sim, Excluir'}
            </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RegisteredItemsList;