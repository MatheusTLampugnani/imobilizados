import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Modal, Button, Spinner, Alert, Form, Row, Col, InputGroup, Card, Pagination, Accordion } from 'react-bootstrap';
import { Calendar, Building, Search, FileEarmarkSpreadsheet, PencilSquare, Trash, ListCheck, CardText, GeoAlt, Hash, ExclamationTriangle, FileEarmarkPdf, ChevronDown, ChevronUp, ChatLeftText } from 'react-bootstrap-icons';
import { API_URL } from '../apiConfig';
import { locationsData } from '../utils/locais';
import SbbiModal from './SbbiModal';

const RegisteredItemsList = ({ show, onClose, baixasOnly }) => {
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
  const [showSbbiModal, setShowSbbiModal] = useState(false);
  const [sbbiItem, setSbbiItem] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? String(dateVal) : parsed.toLocaleDateString('pt-BR');
  };

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
      if (baixasOnly) params.append('baixas_only', 'true');

      const response = await axios.get(`${API_URL}/imobilizados-cadastrados?${params.toString()}`);
      setItems(response.data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar a lista. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) fetchData();
  }, [show, baixasOnly]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.centroCusto) params.append('centro_custo', filters.centroCusto);
      if (filters.termo) params.append('termo', filters.termo);
      if (baixasOnly) params.append('baixas_only', 'true');

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
      local: row.local,
      observacao: row.observacao || row.obs || ''
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
      const msg = err.response?.data?.message || "Erro ao salvar alterações.";
      alert(msg);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const columns = [
    {
      name: 'Data',
      selector: row => {
        const dateVal = row.created_at || row.data_incorporacao;
        if (!dateVal) return 'N/A';
        const parsed = new Date(dateVal);
        return isNaN(parsed.getTime()) ? String(dateVal) : parsed.toLocaleDateString('pt-BR');
      },
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
      width: '150px',
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
            onClick={() => {
              setSbbiItem(row);
              setShowSbbiModal(true);
            }}
            title="Solicitar Baixa (SBBI)"
            style={{ backgroundColor: '#ffe8cc', color: '#d9480f' }}
          >
            <FileEarmarkPdf />
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

  const displayedItems = items;
  const totalPages = Math.ceil(displayedItems.length / itemsPerPage);
  const currentItems = displayedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <Modal show={show} onHide={onClose} size="xl" centered backdrop="static">
        <Modal.Header closeButton className="bg-danger text-white border-0 shadow-sm">
          <Modal.Title className="d-flex align-items-center gap-2">
            <ListCheck size={24} /> {baixasOnly ? 'Itens com Baixa de Imobilizado' : 'Itens Cadastrados'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-light">
          <Accordion className="mb-3 border-0 shadow-sm">
            <Accordion.Item eventKey="0" className="border-0">
              <Accordion.Header>
                <Search className="me-2 text-primary" /> <span className="fw-bold text-secondary text-uppercase small">Filtros de Pesquisa</span>
              </Accordion.Header>
              <Accordion.Body className="p-3 bg-white">
                <Row className="g-3">
                  <Col xl={3} md={6} sm={12}>
                    <Form.Label className="small fw-bold text-muted mb-1">DATA INICIAL</Form.Label>
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-light text-muted border-end-0"><Calendar /></InputGroup.Text>
                      <Form.Control className="border-start-0" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                    </InputGroup>
                  </Col>
                  <Col xl={3} md={6} sm={12}>
                    <Form.Label className="small fw-bold text-muted mb-1">DATA FINAL</Form.Label>
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-light text-muted border-end-0"><Calendar /></InputGroup.Text>
                      <Form.Control className="border-start-0" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                    </InputGroup>
                  </Col>
                  <Col xl={2} md={4} sm={12}>
                    <Form.Label className="small fw-bold text-muted mb-1">CENTRO DE CUSTO</Form.Label>
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-light text-muted border-end-0"><Building /></InputGroup.Text>
                      <Form.Control
                        className="border-start-0"
                        type="text"
                        placeholder="Ex: TI01"
                        name="centroCusto"
                        value={filters.centroCusto}
                        onChange={handleFilterChange}
                      />
                    </InputGroup>
                  </Col>
                  <Col xl={4} md={8} sm={12}>
                    <Form.Label className="small fw-bold text-muted mb-1">BUSCA RÁPIDA</Form.Label>
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-light text-muted border-end-0"><Search /></InputGroup.Text>
                      <Form.Control
                        className="border-start-0"
                        type="text"
                        placeholder="Nome, Série, Crachá, Local..."
                        name="termo"
                        value={filters.termo}
                        onChange={handleFilterChange}
                      />
                    </InputGroup>
                  </Col>
                  <Col md={12} className="d-flex flex-column flex-md-row justify-content-md-end gap-2 mt-3 pt-2 border-top">
                    <Button variant="light" size="sm" onClick={() => setFilters({ startDate: '', endDate: '', centroCusto: '', termo: '' })} className="order-3 order-md-1">
                      Limpar Filtros
                    </Button>
                    <Button variant="primary" size="sm" onClick={fetchData} className="px-4 order-1 order-md-2 shadow-sm">
                      <Search className="me-1" /> Pesquisar
                    </Button>
                    <Button variant="success" size="sm" onClick={handleExport} className="px-4 order-2 order-md-3 shadow-sm">
                      <FileEarmarkSpreadsheet className="me-1" /> Exportar Excel
                    </Button>
                  </Col>
                </Row>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0 overflow-hidden rounded">
              {error && <Alert variant="danger" className="m-3">{error}</Alert>}

              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" variant="danger" />
                  <p className="mt-2 text-muted small">Carregando...</p>
                </div>
              ) : (
                <div className="custom-list-container bg-white pb-3 pt-1 px-1">
                  {/* Header */}
                  <div className="d-none d-md-flex text-white p-3 rounded-top mb-2 shadow-sm align-items-center" style={{ backgroundColor: '#212529', fontWeight: 'bold' }}>
                    <div className="flex-grow-1 text-center" style={{ flexBasis: '40%' }}>Descrição</div>
                    <div className="flex-grow-1 text-center" style={{ flexBasis: '20%' }}>Inventário</div>
                    <div className="flex-grow-1 text-center" style={{ flexBasis: '20%' }}>Centro de Custo</div>
                    <div className="flex-grow-1 text-center" style={{ flexBasis: '20%' }}>Local</div>
                    <div className="flex-grow-1 text-center" style={{ flexBasis: '20%' }}>Ações</div>
                  </div>

                  {/* Items */}
                  {currentItems.length === 0 ? (
                    <div className="p-5 text-center text-muted">Nenhum registro encontrado.</div>
                  ) : (
                    currentItems.map((item, index) => {
                      const isExpanded = expandedItems[item.id];
                      const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
                      return (
                        <div key={item.id} className="mb-2 shadow-sm mx-2 border rounded">
                          <div
                            className="p-3"
                            style={{ backgroundColor: bgColor, cursor: 'pointer' }}
                            onClick={() => toggleExpand(item.id)}
                          >
                            <Row className="align-items-center m-0">
                              <Col xs={12} md={4} className="d-flex align-items-center mb-3 mb-md-0 px-0">
                                <span className="me-2 text-primary fs-5">
                                  {isExpanded ? <ChevronUp /> : <ChevronDown />}
                                </span>
                                <span className="text-truncate fw-bold text-dark" style={{ fontSize: '0.95rem' }} title={item.descricao}>
                                  {item.descricao}
                                </span>
                              </Col>

                              <Col xs={6} md={2} className="text-md-center px-0 mb-3 mb-md-0">
                                <div className="d-md-none text-muted small fw-bold mb-1" style={{ fontSize: '0.7rem' }}>INVENTÁRIO</div>
                                <span className="fw-bold text-secondary" style={{ fontSize: '0.9rem' }}>{item.codigo_inventario}</span>
                              </Col>

                              <Col xs={6} md={2} className="text-md-center px-0 mb-3 mb-md-0">
                                <div className="d-md-none text-muted small fw-bold mb-1" style={{ fontSize: '0.7rem' }}>CENTRO DE CUSTO</div>
                                <span className="fw-bold text-secondary" style={{ fontSize: '0.9rem' }}>{item.centro_custo}</span>
                              </Col>

                              <Col xs={6} md={2} className="text-md-center px-0 mb-3 mb-md-0">
                                <div className="d-md-none text-muted small fw-bold mb-1" style={{ fontSize: '0.7rem' }}>LOCAL</div>
                                <span className="badge rounded-pill shadow-sm" style={{ backgroundColor: '#e4737d', border: '1px solid #d9534f', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                                  {item.local}
                                </span>
                              </Col>

                              <Col xs={12} md={2} className="d-flex justify-content-center justify-content-md-end px-0 mt-2 mt-md-0">
                                <div className="d-flex gap-2 w-100 justify-content-center justify-content-md-end" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="light"
                                    size="sm"
                                    className="border shadow-sm flex-grow-1 flex-md-grow-0"
                                    onClick={() => handleEditClick(item)}
                                    title="Editar"
                                    style={{ color: '#004085' }}
                                  >
                                    <PencilSquare />
                                  </Button>
                                  <Button
                                    variant="light"
                                    size="sm"
                                    className="border shadow-sm flex-grow-1 flex-md-grow-0"
                                    onClick={() => {
                                      setSbbiItem(item);
                                      setShowSbbiModal(true);
                                    }}
                                    title="Solicitar Baixa (SBBI)"
                                    style={{ color: '#d9480f' }}
                                  >
                                    <FileEarmarkPdf />
                                  </Button>
                                  <Button
                                    variant="light"
                                    size="sm"
                                    className="border shadow-sm flex-grow-1 flex-md-grow-0"
                                    onClick={() => confirmDelete(item)}
                                    title="Excluir"
                                    style={{ color: '#c62828' }}
                                  >
                                    <Trash />
                                  </Button>
                                </div>
                              </Col>
                            </Row>
                          </div>

                          {isExpanded && (
                            <div className="p-3 bg-light" style={{ borderLeft: '4px solid #dc3545', borderRight: '1px solid #dee2e6', borderBottom: '1px solid #dee2e6' }}>
                              <Row>
                                <Col md={3} sm={6} className="mb-3">
                                  <div className="text-muted small fw-bold mb-1 text-uppercase">Material & Descrição</div>
                                  <div className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>{item.descricao || '-'}</div>
                                </Col>

                                <Col md={3} sm={6} className="mb-3">
                                  <div className="text-muted small fw-bold mb-1 text-uppercase">Codigo Inventário</div>
                                  <div className="text-dark fw-bold">{item.codigo_inventario || '-'}</div>
                                </Col>

                                <Col md={3} sm={6} className="mb-3">
                                  <div className="text-muted small fw-bold mb-1 text-uppercase">Série</div>
                                  <div className="text-dark fw-bold">{item.numero_serie || '-'}</div>
                                </Col>

                                <Col md={3} sm={6} className="mb-3">
                                  <div className="text-muted small fw-bold mb-1 text-uppercase">
                                    {baixasOnly ? 'Data Incorporação' : 'Data Cadastro'}
                                  </div>
                                  <div className="text-dark fw-bold">
                                    {formatDate(baixasOnly ? item.data_incorporacao : item.created_at)}
                                  </div>
                                </Col>

                                <Col md={3} sm={6} className="mb-3">
                                  <div className="text-muted small fw-bold mb-1 text-uppercase">Local</div>
                                  <div className="text-dark fw-bold">{item.local || '-'}</div>
                                </Col>

                                <Col md={3} sm={6} className="mb-3">
                                  <div className="text-muted small fw-bold mb-1 text-uppercase">Centro Custo</div>
                                  <div className="text-dark fw-bold">{item.centro_custo || '-'}</div>
                                </Col>

                                <Col md={3} sm={6} className="mb-3">
                                  <div className="text-muted small fw-bold mb-1 text-uppercase">Responsável</div>
                                  <div className="text-dark fw-bold">{item.cracha || item.usuario_atualizacao || item.usuario || item.responsavel || '-'}</div>
                                </Col>

                                <Col md={3} sm={6} className="mb-3">
                                  <div className="text-muted small fw-bold mb-1 text-uppercase">Observações</div>
                                  <div className="text-dark fw-bold" style={{ wordBreak: 'break-word' }}>{item.observacao || item.obs || '-'}</div>
                                </Col>
                              </Row>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3 border-top pt-3">
                      <Pagination size="sm" className="mb-0">
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />

                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1;
                          if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                            return (
                              <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
                                {page}
                              </Pagination.Item>
                            );
                          } else if (page === currentPage - 3 || page === currentPage + 3) {
                            return <Pagination.Ellipsis key={page} disabled />;
                          }
                          return null;
                        })}

                        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </div>
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
            <PencilSquare className="me-2" /> Editar Item
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
                  onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                />
              </InputGroup>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-secondary">Nº DE SÉRIE</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light"><Hash /></InputGroup.Text>
                    <Form.Control type="text" value={editForm.numero_serie || ''} onChange={(e) => setEditForm({ ...editForm, numero_serie: e.target.value })} />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-secondary">CENTRO DE CUSTO</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light"><Building /></InputGroup.Text>
                    <Form.Control type="text" value={editForm.centro_custo || ''} onChange={(e) => setEditForm({ ...editForm, centro_custo: e.target.value })} />
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

            <Form.Group className="mb-2 mt-3">
              <Form.Label className="small fw-bold text-secondary">OBSERVAÇÕES</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light"><ChatLeftText /></InputGroup.Text>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Observações adicionais sobre o item..."
                  value={editForm.observacao || ''}
                  onChange={(e) => setEditForm({ ...editForm, observacao: e.target.value })}
                />
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

      <SbbiModal
        show={showSbbiModal}
        onClose={() => {
          setShowSbbiModal(false);
          setSbbiItem(null);
        }}
        item={sbbiItem}
      />
    </>
  );
};

export default RegisteredItemsList;