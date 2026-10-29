import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { QrCode } from 'react-bootstrap-icons';
import { locationsData, montarLocal } from '../utils/locais';

// Endereço oficial do sistema: o QR code sempre aponta para ele (abre no Wi-Fi da empresa e no 4G)
const ENDERECO_OFICIAL = 'https://imobilizados.tailbba2c4.ts.net/';
// BAIXA não é lugar: não ganha etiqueta
const SETORES_SEM_ETIQUETA = ['BAIXA'];

const linkDoLocal = (local) => `${ENDERECO_OFICIAL}?local=${encodeURIComponent(local)}`;

const setores = Object.keys(locationsData).filter(s => !SETORES_SEM_ETIQUETA.includes(s));

// O pdfmake só é carregado quando alguém gera as etiquetas (não pesa na abertura do sistema).
// Serve para as duas formas de registrar as fontes (addVirtualFileSystem nas versões novas, vfs nas antigas).
async function carregarPdfMake() {
  const [modulo, modFontes] = await Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')]);
  const pdfMake = modulo.default || modulo;
  const fontes = modFontes.default || modFontes;
  const vfs = fontes?.pdfMake?.vfs || fontes?.vfs || fontes;
  if (typeof pdfMake.addVirtualFileSystem === 'function') pdfMake.addVirtualFileSystem(vfs);
  else pdfMake.vfs = vfs;
  return pdfMake;
}

function etiqueta(setor, ambiente) {
  const codigo = montarLocal(setor, ambiente); // é o que fica gravado no campo local dos itens
  return {
    stack: [
      { text: 'VIDEPLAST • IMOBILIZADOS RIO VERDE', fontSize: 8, color: '#888888', alignment: 'center', margin: [0, 0, 0, 6] },
      { text: setor, fontSize: 14, bold: true, alignment: 'center' },
      { text: ambiente, fontSize: 19, bold: true, color: '#dc3545', alignment: 'center', margin: [0, 2, 0, 8] },
      { qr: linkDoLocal(codigo), fit: 135, eccLevel: 'M', alignment: 'center' },
      { text: `Local no sistema: ${codigo}`, fontSize: 9, bold: true, alignment: 'center', margin: [0, 6, 0, 0] },
      { text: 'Aponte a câmera do celular para ver os itens deste local', fontSize: 8, alignment: 'center', margin: [0, 4, 0, 0] },
    ],
    margin: [6, 16, 6, 10],
  };
}

const linhaTracejada = () => ({ dash: { length: 4 } });

const EtiquetasLocaisModal = ({ show, onClose }) => {
  const [setor, setSetor] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');

  const locais = (setor ? [setor] : setores).flatMap(s => locationsData[s].map(a => [s, a]));

  const gerarPdf = async () => {
    setGerando(true);
    setErro('');
    try {
      const pdfMake = await carregarPdfMake();
      const celulas = locais.map(([s, a]) => etiqueta(s, a));
      if (celulas.length % 2) celulas.push({ text: '' });
      const linhas = [];
      for (let i = 0; i < celulas.length; i += 2) linhas.push([celulas[i], celulas[i + 1]]);
      // 2 x 3 etiquetas por folha A4, com linha tracejada para recortar
      const documento = {
        pageSize: 'A4',
        pageMargins: [24, 24, 24, 24],
        content: [{
          table: { widths: ['*', '*'], heights: 255, dontBreakRows: true, body: linhas },
          layout: {
            hLineWidth: () => 0.5, vLineWidth: () => 0.5,
            hLineColor: () => '#bbbbbb', vLineColor: () => '#bbbbbb',
            hLineStyle: linhaTracejada, vLineStyle: linhaTracejada,
          },
        }],
      };
      const nome = (setor || 'todos-os-locais').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await pdfMake.createPdf(documento).download(`etiquetas-qr-${nome}.pdf`);
    } catch (e) {
      console.error('Erro ao gerar etiquetas:', e);
      setErro('Não foi possível gerar o PDF das etiquetas.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2"><QrCode /> Etiquetas QR dos locais</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="small text-muted">
          Cada etiqueta tem o QR code de um local. Colada na parede da sala, quem apontar a câmera do celular
          vê os itens que pertencem àquele local.
        </p>
        <Form.Group>
          <Form.Label className="small fw-bold">Setor</Form.Label>
          <Form.Select value={setor} onChange={e => setSetor(e.target.value)} disabled={gerando}>
            <option value="">Todos os setores</option>
            {setores.map(s => <option key={s} value={s}>{s}</option>)}
          </Form.Select>
          <Form.Text>{locais.length} {locais.length === 1 ? 'etiqueta' : 'etiquetas'} ({Math.ceil(locais.length / 6)} {Math.ceil(locais.length / 6) === 1 ? 'folha' : 'folhas'} A4, 6 por folha)</Form.Text>
        </Form.Group>
        {erro && <Alert variant="danger" className="mt-3 mb-0 small">{erro}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={gerando}>Fechar</Button>
        <Button variant="danger" onClick={gerarPdf} disabled={gerando || !locais.length}>
          {gerando ? <><Spinner size="sm" animation="border" className="me-2" />Gerando...</> : 'Gerar PDF'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EtiquetasLocaisModal;
