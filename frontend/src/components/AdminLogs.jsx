import React, { useState, useEffect } from 'react';
import { Card, Spinner, Button, Form, InputGroup, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { ArrowLeft, ShieldLock, Search, FileEarmarkPdf, FiletypeCsv, Funnel, CheckCircle, XCircle } from 'react-bootstrap-icons';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { API_URL } from '../apiConfig';

const AdminLogs = ({ onBack, currentUser }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const isAdmin = currentUser?.isAdmin === true;
  const [selectedRows, setSelectedRows] = useState([]);
  const [toggleCleared, setToggleCleared] = useState(false); 

  const [filters, setFilters] = useState({
    usuario: '',
    tipoAcao: '',
    detalhes: '',
    imobilizado: '',
    dataInicio: '',
    dataFim: '',
    statusVerificacao: '' 
  });

  const [showFilters, setShowFilters] = useState(false);

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
        const usuarioMatch = !filters.usuario || String(log.usuario || '').toLowerCase().includes(filters.usuario.toLowerCase());
        const tipoMatch = !filters.tipoAcao || String(log.tipo_alteracao || '').toLowerCase().includes(filters.tipoAcao.toLowerCase());
        const detalhesMatch = !filters.detalhes || String(log.detalhes || '').toLowerCase().includes(filters.detalhes.toLowerCase());
        const codigoMatch = !filters.imobilizado || String(log.codigo_imobilizado || '').toLowerCase().includes(filters.imobilizado.toLowerCase());

        let dataMatch = true;
        if (filters.dataInicio || filters.dataFim) {
            const logDate = new Date(log.created_at).setHours(0,0,0,0);
            const start = filters.dataInicio ? new Date(filters.dataInicio).setHours(0,0,0,0) : null;
            const end = filters.dataFim ? new Date(filters.dataFim).setHours(0,0,0,0) : null;

            if (start && logDate < start) dataMatch = false;
            if (end && logDate > end) dataMatch = false;
        }

        let statusMatch = true;
        if (filters.statusVerificacao !== '') {
            const isVerified = log.verificado === true; 
            const filterValue = filters.statusVerificacao === 'true';
            statusMatch = isVerified === filterValue;
        }

        return usuarioMatch && tipoMatch && detalhesMatch && codigoMatch && dataMatch && statusMatch;
    });
    setFilteredLogs(result);
  }, [filters, logs]);

  const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
      setFilters({
        usuario: '', tipoAcao: '', detalhes: '', imobilizado: '',
        dataInicio: '', dataFim: '', statusVerificacao: ''
      });
  };

  const handleBulkUpdate = async (status) => {
      if (!isAdmin || selectedRows.length === 0) return;
      if (!window.confirm(`Deseja marcar ${selectedRows.length} itens como ${status ? 'VERIFICADOS' : 'PENDENTES'}?`)) {
          return;
      }

      const idsToUpdate = selectedRows.map(r => r.id);
      const updatedLogs = logs.map(l => idsToUpdate.includes(l.id) ? { ...l, verificado: status } : l);
      setLogs(updatedLogs);

      try {
          await axios.put(`${API_URL}/logs/verify-batch`, { ids: idsToUpdate, verificado: status });
          setToggleCleared(!toggleCleared);
          setSelectedRows([]);
      } catch (error) {
          console.error("Erro em lote", error);
          alert("Erro ao atualizar em massa. Tente novamente.");
          fetchLogs();
      }
  };

  const handleRowSelected = ({ selectedRows }) => { setSelectedRows(selectedRows); };

  const handleExportCSV = () => {
      const headers = ["Data", "Usuario", "Acao", "Detalhes", "Item", "Subnº", "Status"];
      const csvContent = [
          headers.join(","),
          ...filteredLogs.map(row => [
              new Date(row.created_at).toLocaleString('pt-BR').replace(',', ''),
              row.usuario,
              row.tipo_alteracao,
              `"${row.detalhes?.replace(/"/g, '""')}"`,
              row.codigo_imobilizado,
              row.sub_numero || '0',
              row.verificado ? "VERIFICADO" : "PENDENTE"
          ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Auditoria_Logs_${new Date().toLocaleDateString()}.csv`);
      document.body.appendChild(link);
      link.click();
  };

  const handleExportPDF = () => {
      const doc = new jsPDF('l', 'mm', 'a4'); 
      doc.text("Relatório de Auditoria de Imobilizados", 14, 15);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);
      
      const tableColumn = ["Data", "Usuário", "Ação", "Detalhes", "Item", "Sub", "Status"];
      const tableRows = filteredLogs.map(row => [
          new Date(row.created_at).toLocaleDateString('pt-BR'),
          row.usuario,
          row.tipo_alteracao,
          row.detalhes,
          row.codigo_imobilizado || '-',
          row.sub_numero || '0',
          row.verificado ? "Verificado" : "Pendente"
      ]);
      doc.autoTable({
          head: [tableColumn], body: tableRows, startY: 30,
          styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [52, 58, 64] },
          columnStyles: { 3: { cellWidth: 80 } }
      });
      doc.save(`Auditoria_Logs_${new Date().toLocaleDateString()}.pdf`);
  };

  const getActionStyle = (actionType) => {
      const type = String(actionType || '').toLowerCase();
      if (type.includes('inventário')) return { backgroundColor: '#e7f5ff', color: '#004085', border: '1px solid #b8daff' }; 
      if (type.includes('série')) return { backgroundColor: '#e0f2f1', color: '#004d40', border: '1px solid #b2dfdb' }; 
      if (type.includes('centro de custo')) return { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' }; 
      if (type.includes('local')) return { backgroundColor: '#f3e5f5', color: '#4a148c', border: '1px solid #e1bee7' }; 
      return { backgroundColor: '#f8f9fa', color: '#383d41', border: '1px solid #d6d8db' };
  };

  const columns = [
    {
      name: 'Status',
      width: '70px',
      center: true,
      cell: row => (
        <OverlayTrigger overlay={<Tooltip>{row.verificado ? "Verificado" : "Pendente"}</Tooltip>}>
            <div style={{ display: 'inline-block' }}>
                <Form.Check 
                    type="switch"
                    checked={!!row.verificado}
                    disabled={true}
                    style={{ transform: 'scale(1.2)', opacity: 1, cursor: 'help' }}
                />
            </div>
        </OverlayTrigger>
      )
    },
    {
      name: 'Data',
      selector: row => new Date(row.created_at).toLocaleString('pt-BR'),
      sortable: true,
      width: '140px',
      style: { fontWeight: 'bold', fontSize: '0.8rem', color: '#555' }
    },
    {
      name: 'Usuário',
      selector: row => row.usuario,
      sortable: true,
      width: '90px',
      center: true,
      cell: row => <span className="badge bg-light text-dark border shadow-sm text-wrap">{row.usuario}</span>
    },
    {
      name: 'Ação Realizada',
      selector: row => row.tipo_alteracao,
      sortable: true,
      width: '210px', 
      cell: row => (
        <div style={{ ...getActionStyle(row.tipo_alteracao), padding: '6px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem', width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {row.tipo_alteracao}
        </div>
      )
    },
    {
      name: 'Detalhes da Mudança',
      selector: row => row.detalhes,
      wrap: true,
      grow: 3,
      style: { fontSize: '0.85rem', lineHeight: '1.5', padding: '10px 0' }
    },
    {
      name: 'Item',
      selector: row => row.codigo_imobilizado || '-',
      width: '90px',
      center: true,
      style: { fontWeight: 'bold' }
    },
    {
      name: 'Subnº',
      selector: row => row.sub_numero || '0',
      width: '70px',
      center: true,
      style: { fontSize: '0.85rem', color: '#555', fontWeight: 'bold' }
    }
  ];

  const customStyles = {
    headCells: { style: { backgroundColor: '#343a40', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' } },
    rows: { style: { fontSize: '0.85rem', minHeight: '60px' } },
    cells: { style: { paddingLeft: '8px', paddingRight: '8px' } }
  };

  return (
    <div className="mt-3 fade-in position-relative">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-3">
        <div className="d-flex align-items-center">
            <Button variant="outline-dark" onClick={onBack} className="me-3 shadow-sm border-0 bg-white">
                <ArrowLeft /> Voltar
            </Button>
            <h4 className="m-0 text-dark d-flex align-items-center">
                <ShieldLock className="me-2 text-primary" /> Auditoria do Sistema
            </h4>
        </div>
        
        <div className="d-flex gap-2">
            <Button variant={showFilters ? "primary" : "outline-primary"} size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Funnel /> Filtros
            </Button>
            <Button variant="outline-success" size="sm" onClick={handleExportCSV} className="d-flex align-items-center gap-2 shadow-sm">
                <FiletypeCsv /> CSV
            </Button>
            <Button variant="outline-danger" size="sm" onClick={handleExportPDF} className="d-flex align-items-center gap-2 shadow-sm">
                <FileEarmarkPdf /> PDF
            </Button>
        </div>
      </div>

      {showFilters && (
          <Card className="mb-3 border-0 shadow-sm bg-light">
              <Card.Body>
                  <Row className="g-3">
                      <Col md={2}>
                          <Form.Control type="date" size="sm" name="dataInicio" value={filters.dataInicio} onChange={handleFilterChange} />
                      </Col>
                      <Col md={2}>
                          <Form.Control type="date" size="sm" name="dataFim" value={filters.dataFim} onChange={handleFilterChange} />
                      </Col>
                      <Col md={2}>
                          <Form.Select size="sm" name="tipoAcao" value={filters.tipoAcao} onChange={handleFilterChange}>
                              <option value="">Todas</option>
                              <option value="Inventário">Inventário</option>
                              <option value="Série">Nº Série</option>
                              <option value="Centro de Custo">Centro de Custo</option>
                              <option value="Local">Local</option>
                          </Form.Select>
                      </Col>
                      <Col md={2}>
                          <Form.Select size="sm" name="statusVerificacao" value={filters.statusVerificacao} onChange={handleFilterChange}>
                              <option value="">Status: Todos</option>
                              <option value="true">Verificados</option>
                              <option value="false">Pendentes</option>
                          </Form.Select>
                      </Col>
                      <Col md={2}>
                          <Form.Control type="text" size="sm" placeholder="Usuário" name="usuario" value={filters.usuario} onChange={handleFilterChange} />
                      </Col>
                      <Col md={2}>
                          <Form.Control type="text" size="sm" placeholder="Código" name="imobilizado" value={filters.imobilizado} onChange={handleFilterChange} />
                      </Col>
                      <Col md={12}>
                          <Form.Control type="text" size="sm" placeholder="Buscar nos detalhes..." name="detalhes" value={filters.detalhes} onChange={handleFilterChange} />
                      </Col>
                      <Col md={12} className="text-end">
                          <Button variant="link" size="sm" className="text-decoration-none text-muted" onClick={clearFilters}>Limpar Filtros</Button>
                      </Col>
                  </Row>
              </Card.Body>
          </Card>
      )}

      <Card className="shadow-sm border-0 mb-5">
        <Card.Body className="p-0 rounded overflow-hidden">
          {loading ? (
             <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
             </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredLogs}
              pagination
              selectableRows={isAdmin} 
              onSelectedRowsChange={handleRowSelected}
              clearSelectedRows={toggleCleared}
              selectableRowsHighlight
              highlightOnHover
              striped
              dense
              customStyles={customStyles}
              noDataComponent={<div className="p-5 text-center text-muted">Nenhum registro encontrado.</div>}
            />
          )}
        </Card.Body>
      </Card>

      {isAdmin && selectedRows.length > 0 && (
          <div 
            className="fixed-bottom p-3 d-flex justify-content-center align-items-center gap-3 shadow-lg"
            style={{ 
                backgroundColor: 'rgba(52, 58, 64, 0.95)', 
                backdropFilter: 'blur(5px)',
                borderTop: '1px solid #495057',
                zIndex: 1050,
                width: '100%'
            }}
          >
              <span className="text-white fw-bold me-3">
                  {selectedRows.length} itens selecionados
              </span>
              
              <Button variant="success" size="sm" className="px-4 fw-bold rounded-pill shadow" onClick={() => handleBulkUpdate(true)}>
                  <CheckCircle className="me-2" /> Validar Todos
              </Button>

              <Button variant="danger" size="sm" className="px-4 fw-bold rounded-pill shadow" onClick={() => handleBulkUpdate(false)}>
                  <XCircle className="me-2" /> Invalidar Todos
              </Button>
          </div>
      )}
    </div>
  );
};

export default AdminLogs;