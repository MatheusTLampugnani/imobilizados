import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Modal, Button, Spinner, Alert, Form, Row, Col } from 'react-bootstrap';
import { FaTrash, FaEdit, FaFileExcel, FaSearch } from 'react-icons/fa'; // Ícones
import { API_URL } from '../apiConfig';

const RegisteredItemsList = ({ show, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para Filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    centroCusto: '',
    nome: ''
  });

  // Estados para Edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  // --- 1. BUSCAR DADOS (Com Filtros) ---
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Cria a query string com os filtros
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.centroCusto) params.append('centro_custo', filters.centroCusto);
      if (filters.nome) params.append('nome', filters.nome);

      const response = await axios.get(`${API_URL}/imobilizados-cadastrados?${params.toString()}`);
      setItems(response.data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar a lista. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]); 

  // --- 2. EXPORTAR EXCEL ---
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.centroCusto) params.append('centro_custo', filters.centroCusto);

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
      console.error(err); // <--- AJUSTE AQUI
      alert("Erro ao baixar o relatório em Excel.");
    }
  };

  // --- 3. EXCLUIR ITEM ---
  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este item permanentemente?")) {
      try {
        await axios.delete(`${API_URL}/imobilizados-cadastrados/${id}`);
        // Remove da lista localmente para não precisar recarregar tudo
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error(err); // <--- AJUSTE AQUI
        alert("Erro ao excluir o item.");
      }
    }
  };

  // --- 4. PREPARAR EDIÇÃO ---
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

  // --- 5. SALVAR EDIÇÃO ---
  const handleSaveEdit = async () => {
    try {
      const response = await axios.put(`${API_URL}/imobilizados-cadastrados/${editingItem.id}`, editForm);
      
      // Atualiza o item na lista local
      const updatedList = items.map(item => 
        item.id === editingItem.id ? { ...item, ...response.data[0] } : item 
      );
      setItems(updatedList);
      setShowEditModal(false);
      fetchData(); 
    } catch (err) {
      console.error(err); // <--- AJUSTE AQUI
      alert("Erro ao salvar alterações.");
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Definição das Colunas
  const columns = [
    { name: 'Data', selector: row => new Date(row.created_at).toLocaleDateString('pt-BR'), sortable: true, width: '100px' },
    { name: 'Descrição', selector: row => row.descricao, sortable: true, wrap: true },
    { name: 'Inventário', selector: row => row.codigo_inventario, sortable: true, width: '120px' },
    { name: 'Série', selector: row => row.numero_serie, sortable: true, width: '120px' },
    { name: 'C. Custo', selector: row => row.centro_custo, sortable: true, width: '100px' },
    { name: 'Local', selector: row => row.local, sortable: true, width: '100px' },
    { name: 'Resp.', selector: row => row.cracha, sortable: true, width: '100px' },
    {
      name: 'Ações',
      button: true, 
      width: '120px',
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(row)} title="Editar">
            <FaEdit />
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(row.id)} title="Excluir">
            <FaTrash />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <Modal show={show} onHide={onClose} size="xl" centered>
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Itens Cadastrados no Inventário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          
          {/* BARRA DE FILTROS */}
          <Form className="mb-3 p-3 bg-light border rounded">
            <Row className="g-2 align-items-end">
              <Col md={2}>
                <Form.Label className="small mb-1">Início</Form.Label>
                <Form.Control size="sm" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
              </Col>
              <Col md={2}>
                <Form.Label className="small mb-1">Fim</Form.Label>
                <Form.Control size="sm" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
              </Col>
              <Col md={2}>
                <Form.Label className="small mb-1">C. Custo</Form.Label>
                <Form.Control size="sm" type="text" placeholder="Ex: TI01" name="centroCusto" value={filters.centroCusto} onChange={handleFilterChange} />
              </Col>
              <Col md={3}>
                <Form.Label className="small mb-1">Descrição</Form.Label>
                <Form.Control size="sm" type="text" placeholder="Nome do item..." name="nome" value={filters.nome} onChange={handleFilterChange} />
              </Col>
              <Col md={3} className="d-flex gap-2">
                <Button variant="primary" size="sm" className="w-100" onClick={fetchData}>
                  <FaSearch /> Filtrar
                </Button>
                <Button variant="success" size="sm" onClick={handleExport} title="Baixar Excel">
                  <FaFileExcel /> Excel
                </Button>
              </Col>
            </Row>
          </Form>

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
              dense 
              noDataComponent="Nenhum registro encontrado com os filtros atuais."
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Fechar</Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL DE EDIÇÃO */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
           <Form>
             <Form.Group className="mb-3">
               <Form.Label>Descrição</Form.Label>
               <Form.Control 
                 type="text" 
                 value={editForm.descricao || ''} 
                 onChange={(e) => setEditForm({...editForm, descricao: e.target.value})} 
               />
             </Form.Group>
             <Form.Group className="mb-3">
               <Form.Label>Número de Série</Form.Label>
               <Form.Control 
                 type="text" 
                 value={editForm.numero_serie || ''} 
                 onChange={(e) => setEditForm({...editForm, numero_serie: e.target.value})} 
               />
             </Form.Group>
             <Row>
               <Col>
                 <Form.Group className="mb-3">
                   <Form.Label>Centro de Custo</Form.Label>
                   <Form.Control 
                     type="text" 
                     value={editForm.centro_custo || ''} 
                     onChange={(e) => setEditForm({...editForm, centro_custo: e.target.value})} 
                   />
                 </Form.Group>
               </Col>
               <Col>
                 <Form.Group className="mb-3">
                   <Form.Label>Local</Form.Label>
                   <Form.Control 
                     type="text" 
                     value={editForm.local || ''} 
                     onChange={(e) => setEditForm({...editForm, local: e.target.value})} 
                   />
                 </Form.Group>
               </Col>
             </Row>
           </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveEdit}>Salvar</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RegisteredItemsList;