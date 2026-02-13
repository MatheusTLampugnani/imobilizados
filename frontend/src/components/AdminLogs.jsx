import React, { useState, useEffect } from 'react';
import { Card, Spinner, Button, Form, InputGroup, Row, Col, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { ArrowLeft, ShieldLock, Search, FileEarmarkPdf, FiletypeCsv, Funnel, CheckCircle, XCircle } from 'react-bootstrap-icons';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { API_URL } from '../apiConfig';

const AdminLogs = ({ onBack }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
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
        const usuarioMatch = !filters.usuario || 
            String(log.usuario || '').toLowerCase().includes(filters.usuario.toLowerCase());

        const tipoMatch = !filters.tipoAcao || 
            String(log.tipo_alteracao || '').toLowerCase().includes(filters.tipoAcao.toLowerCase());

        const detalhesMatch = !filters.detalhes || 
            String(log.detalhes || '').toLowerCase().includes(filters.detalhes.toLowerCase());

        const codigoMatch = !filters.imobilizado || 
            String(log.codigo_imobilizado || '').toLowerCase().includes(filters.imobilizado.toLowerCase());

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

  const toggleVerification = async (row) => {
      const novoStatus = !row.verificado;
      const updatedLogs = logs.map(l => l.id === row.id ? { ...l, verificado: novoStatus } : l);
      setLogs(updatedLogs);

      try {
          await axios.put(`${API_URL}/logs/${row.id}/verify`, { verificado: novoStatus });
      } catch (error) {
          console.error("Erro ao salvar verificação", error);
          alert("Erro ao salvar status. Recarregando...");
          fetchLogs();
      }
  };

  const handleExportCSV = () => {
      const headers = ["Data", "Usuario", "Acao", "Detalhes", "Item", "Verificado"];
      const csvContent = [
          headers.join(","),
          ...filteredLogs.map(row => [
              new Date(row.created_at).toLocaleString('pt-BR').replace(',', ''),
              row.usuario,
              row.tipo_alteracao,
              `"${row.detalhes?.replace(/"/g, '""')}"`,
              row.codigo_imobilizado,
              row.verificado ? "SIM" : "NAO"
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

      const tableColumn = ["Data", "Usuário", "Ação", "Detalhes", "Item", "Status"];
      const tableRows = filteredLogs.map(row => [
          new Date(row.created_at).toLocaleDateString('pt-BR'),
          row.usuario,
          row.tipo_alteracao,
          row.detalhes,
          row.codigo_imobilizado || '-',
          row.verificado ? "Verificado" : "Pendente"
      ]);

      doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 30,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [52, 58, 64] },
          columnStyles: { 
              3: { cellWidth: 80 }
          }
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
      width: '90px',
      center: true,
      cell: row => (
        <OverlayTrigger overlay={<Tooltip>{row.verificado ? "Verificado" : "Pendente"}</Tooltip>}>
            <Form.Check 
                type="switch"
                checked={!!row.verificado} // Garante booleano
                onChange={() => toggleVerification(row)}
                className="custom-switch"
                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
            />
        </OverlayTrigger>
      )
    },
    {
      name: 'Data',
      selector: row => new Date(row.created_at).toLocaleString('pt-BR'),
      sortable: true,
      width: '150px',
      style: { fontWeight: 'bold', fontSize: '0.8rem', color: '#555' }
    },
    {
      name: 'Usuário',
      selector: row => row.usuario,
      sortable: true,
      width: '100px',
      center: true,
      cell: row => <span className="badge bg-light text-dark border shadow-sm text-wrap">{row.usuario}</span>
    },
    {
      name: 'Ação Realizada',
      selector: row => row.tipo_alteracao,
      sortable: true,
      width: '180px',
      cell: row => (
        <div style={{ ...getActionStyle(row.tipo_alteracao), padding: '6px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem', width: '100%', textAlign: 'center', whiteSpace: 'normal', lineHeight: '1.2' }}>
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
    }
  ];

  const customStyles = {
    headCells: {
      style: { backgroundColor: '#343a40', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' },
    },
    rows: {
      style: { fontSize: '0.85rem', minHeight: '60px' },
    },
    cells: {
        style: { paddingLeft: '8px', paddingRight: '8px' }
    }
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
        
        <div className="d-flex gap-2">
            <Button 
                variant={showFilters ? "primary" : "outline-primary"} 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="d-flex align-items-center gap-2 shadow-sm"
            >
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
                          <Form.Label className="small fw-bold">Data Início</Form.Label>
                          <Form.Control type="date" size="sm" name="dataInicio" value={filters.dataInicio} onChange={handleFilterChange} />
                      </Col>
                      <Col md={2}>
                          <Form.Label className="small fw-bold">Data Fim</Form.Label>
                          <Form.Control type="date" size="sm" name="dataFim" value={filters.dataFim} onChange={handleFilterChange} />
                      </Col>
                      <Col md={2}>
                          <Form.Label className="small fw-bold">Tipo Ação</Form.Label>
                          <Form.Select size="sm" name="tipoAcao" value={filters.tipoAcao} onChange={handleFilterChange}>
                              <option value="">Todas</option>
                              <option value="Inventário">Inventário</option>
                              <option value="Série">Nº Série</option>
                              <option value="Centro de Custo">Centro de Custo</option>
                              <option value="Local">Local</option>
                          </Form.Select>
                      </Col>
                      <Col md={2}>
                          <Form.Label className="small fw-bold">Status</Form.Label>
                          <Form.Select size="sm" name="statusVerificacao" value={filters.statusVerificacao} onChange={handleFilterChange}>
                              <option value="">Todos</option>
                              <option value="true">Verificados</option>
                              <option value="false">Pendentes</option>
                          </Form.Select>
                      </Col>
                      <Col md={2}>
                          <Form.Label className="small fw-bold">Usuário</Form.Label>
                          <Form.Control type="text" size="sm" placeholder="Crachá/Nome" name="usuario" value={filters.usuario} onChange={handleFilterChange} />
                      </Col>
                      <Col md={2}>
                          <Form.Label className="small fw-bold">Imobilizado</Form.Label>
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
              paginationComponentOptions={{ rowsPerPageText: 'Linhas:', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' }}
              highlightOnHover
              striped
              responsive
              dense
              customStyles={customStyles}
              noDataComponent={<div className="p-5 text-center text-muted">Nenhum registro encontrado com os filtros atuais.</div>}
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminLogs;