import React from 'react';
import { Row, Col, Form, Button, InputGroup, Accordion } from 'react-bootstrap';
import { SortDown, SortUp, X, Filter } from 'react-bootstrap-icons';

const FilterControls = ({
  filters,
  onFilterChange,
  onResetFilters,
  sortConfig,
  onSortChange,
  itemsCount,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleSortFieldChange = (e) => {
    onSortChange({ ...sortConfig, field: e.target.value });
  };

  const toggleSortOrder = () => {
    onSortChange({ ...sortConfig, order: sortConfig.order === 'asc' ? 'desc' : 'asc' });
  };

  return (
    <Accordion className="mb-4 border-0 shadow-sm mt-3">
      <Accordion.Item eventKey="0" className="border-0">
        <Accordion.Header>
          <Filter className="me-2 text-primary" /> <span className="fw-bold text-secondary text-uppercase small">Filtros Adicionais e Ordenação</span>
        </Accordion.Header>
        <Accordion.Body className="p-3 bg-white border-top">
          <Row className="g-3 align-items-end">
            <Col xl={2} lg={3} md={4} xs={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1">Nº DE SÉRIE</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  name="serie"
                  value={filters.serie || ''}
                  onChange={handleInputChange}
                  placeholder="Filtrar por série..."
                />
              </Form.Group>
            </Col>

            <Col xl={2} lg={3} md={4} xs={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1">SUBNÚMERO</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  name="subn"
                  value={filters.subn || ''}
                  onChange={handleInputChange}
                  placeholder="Filtrar..."
                />
              </Form.Group>
            </Col>

            <Col xl={2} lg={3} md={4} xs={6}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1">CENTRO DE CUSTO</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  name="centroCusto"
                  value={filters.centroCusto || ''}
                  onChange={handleInputChange}
                  placeholder="Filtrar..."
                />
              </Form.Group>
            </Col>        

            <Col xl={2} lg={3} md={4} xs={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1">LOCAL</Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  name="local"
                  value={filters.local || ''}
                  onChange={handleInputChange}
                  placeholder="Filtrar..."
                />
              </Form.Group>
            </Col>

            <Col xl={3} lg={4} md={6} xs={12}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1">ORDENAR POR</Form.Label>
                <InputGroup size="sm">
                  <Form.Select
                    name="sortField"
                    value={sortConfig.field}
                    onChange={handleSortFieldChange}
                  >
                    <option value="Descrição">Descrição</option>
                    <option value="Série">Nº de Série</option>
                    <option value="CentroCusto">Centro de Custo</option>
                    <option value="Local">Local</option>
                    <option value="Subnº">Subnº</option>
                    <option value="Inventário">Inventário</option>
                  </Form.Select>
                  <Button variant="outline-secondary" onClick={toggleSortOrder}>
                    {sortConfig.order === 'asc' ? <SortUp /> : <SortDown />}
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>

            <Col xl={12} className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <div className="text-muted small">
                <strong>{itemsCount}</strong> {itemsCount === 1 ? 'item encontrado' : 'itens encontrados'}
              </div>
              <Button variant="light" size="sm" onClick={onResetFilters} className="border px-4 shadow-sm">
                <X size={18} className="me-1" /> Limpar Filtros
              </Button>
            </Col>
          </Row>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};

export default FilterControls;