import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { Html5QrcodeScanner } from 'html5-qrcode';

const ScannerModal = ({ show, onClose, onScanSuccess }) => {
  useEffect(() => {
    if (show) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
        },
        false
      );

      scanner.render(
        (textoDecodificado) => {
          scanner.clear();
          onScanSuccess(textoDecodificado);
        },
        (erroMeno) => {
        }
      );

      return () => {
        scanner.clear().catch(error => console.error("Erro ao limpar scanner", error));
      };
    }
  }, [show, onScanSuccess]);

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton className="bg-danger text-white">
        <Modal.Title>Ler QR Code do Setor</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex flex-column align-items-center">
        <div id="qr-reader" style={{ width: '100%', maxWidth: '400px' }}></div>
        <p className="mt-3 text-muted text-center small">
          Aponte a câmera do celular para o QR Code fixado no setor.<br/>
          A leitura e a pesquisa serão feitas automaticamente.
        </p>
      </Modal.Body>
    </Modal>
  );
};

export default ScannerModal;