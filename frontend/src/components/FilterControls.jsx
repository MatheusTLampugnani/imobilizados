import React from 'react';
import { Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { SortDown, SortUp, X } from 'react-bootstrap-icons';

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
    <div className="my-4 p-3 border rounded bg-light shadow-sm">
      <Row className="g-3 align-items-end">
        <Col xl={2} lg={3} md={4} xs={12}>
          <Form.Group>
            <Form.Label>Nº de Série</Form.Label>
            <Form.Control
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
            <Form.Label>Subnúmero</Form.Label>
            <Form.Control
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
            <Form.Label>Centro de Custo</Form.Label>
            <Form.Control
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
            <Form.Label>Local</Form.Label>
            <Form.Control
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
            <Form.Label>Ordenar por</Form.Label>
            <InputGroup>
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

        <Col xl="auto" lg={2} md={2} xs={12} className="d-flex align-items-end mt-3 mt-md-0">
          <Button variant="outline-secondary" onClick={onResetFilters} className="w-100">
            <X size={20} /> Limpar
          </Button>
        </Col>
      </Row>

      <div className="text-end mt-3 text-muted">
        <strong>{itemsCount}</strong> {itemsCount === 1 ? 'item encontrado' : 'itens encontrados'}
      </div>
    </div>
  );
};

export default FilterControls;