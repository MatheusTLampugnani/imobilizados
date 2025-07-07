import React, { useEffect, useState } from 'react';
import { Modal, Button, ListGroup, Badge, Alert } from 'react-bootstrap';

const DivergenceReport = ({ show, onClose, collectedItems, expectedItems, inventoryCc }) => {
  const [missingItems, setMissingItems] = useState([]);
  const [wrongCcItems, setWrongCcItems] = useState([]);

  useEffect(() => {
    if (show) {
      const formatCode = (item) => String(item.Inventário || item.Série || item.codigo_imobilizado || '').trim().replace(/\.0$/, '').replace(/^0+/, '');

      // Conjunto de IDs dos itens coletados para busca rápida
      const collectedIds = new Set(collectedItems.map(item => formatCode(item)));

      // 1. Itens Faltantes: Estão nos esperados, mas não foram coletados
      const missing = expectedItems.filter(expectedItem => {
        const expectedCode = formatCode(expectedItem);
        return !collectedIds.has(expectedCode);
      });
      setMissingItems(missing);

      // 2. Itens em CC Errado: Foram coletados, mas o Centro de Custo é diferente do inventário atual
      const wrongCc = collectedItems.filter(collectedItem => {
        // Normaliza o centro de custo para comparação
        const collectedCc = String(collectedItem.CentroCusto || '').trim().replace(/\.0$/, '').replace(/^0+/, '');
        const currentInventoryCc = String(inventoryCc || '').trim().replace(/\.0$/, '').replace(/^0+/, '');
        
        // Verifica se o item coletado está na lista de itens esperados para o CC atual
        // E se o centro de custo do item coletado é diferente do centro de custo do inventário
        const isExpectedForCurrentCc = expectedItems.some(expectedItem => 
            formatCode(expectedItem) === formatCode(collectedItem) && 
            String(expectedItem.CentroCusto || '').trim().replace(/\.0$/, '').replace(/^0+/, '') === currentInventoryCc
        );

        return !isExpectedForCurrentCc && collectedCc !== currentInventoryCc;
      });
      setWrongCcItems(wrongCc);
    }
  }, [show, collectedItems, expectedItems, inventoryCc]);

  return (
    <Modal show={show} onHide={onClose} centered size="xl" backdrop="static">
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>📊 Relatório de Divergências do Inventário</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {missingItems.length === 0 && wrongCcItems.length === 0 && (
          <Alert variant="success" className="text-center">
            🎉 Nenhuma divergência encontrada! Inventário perfeito para o Centro de Custo {inventoryCc}.
          </Alert>
        )}

        {missingItems.length > 0 && (
          <div className="mb-4">
            <h5>❌ Itens Faltantes ({missingItems.length})</h5>
            <p className="text-muted">Estes itens deveriam estar no Centro de Custo {inventoryCc}, mas não foram coletados:</p>
            <ListGroup>
              {missingItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} variant="danger">
                  <div className="fw-bold">Plaqueta: {item.Inventário || 'N/A'} (Subnº: {item['Subnº']})</div>
                  <div>Descrição: {item.Descrição || 'Sem descrição'}</div>
                  <div>Centro de Custo Esperado: {item.CentroCusto || 'N/A'}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}

        {wrongCcItems.length > 0 && (
          <div>
            <h5>⚠️ Itens em Outro Centro de Custo ({wrongCcItems.length})</h5>
            <p className="text-muted">Estes itens foram coletados, mas pertencem a um Centro de Custo diferente de {inventoryCc}:</p>
            <ListGroup>
              {wrongCcItems.map((item, index) => (
                <ListGroup.Item key={item.id || index} variant="warning">
                  <div className="fw-bold">Plaqueta: {item.Inventário || 'N/A'} (Subnº: {item['Subnº']})</div>
                  <div>Descrição: {item.Descrição || 'Sem descrição'}</div>
                  <div>Centro de Custo Coletado: {item.CentroCusto || 'N/A'}</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Fechar Relatório</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DivergenceReport;
