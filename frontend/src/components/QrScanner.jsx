import React, { useEffect, useState } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScanner = ({ onScan, onClose }) => {
  const [scanResult, setScanResult] = useState(null);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    // ID único para o container do scanner, para evitar conflitos
    const scannerContainerId = "qr-reader";

    const scanner = new Html5QrcodeScanner(
      scannerContainerId,
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 10, // Frames por segundo para a verificação
      },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText, decodedResult) => {
      // Para evitar múltiplos scans, verificamos se já temos um resultado
      if (!scanResult) {
        setScanResult(decodedText);
        onScan(decodedText.trim());
        // A linha onClose() pode ser descomentada para fechar o modal automaticamente
        // onClose();
      }
    };

    const onScanFailure = (error) => {
      // Podemos ignorar a maioria dos erros, pois a biblioteca tenta ler continuamente.
      // No entanto, é útil capturar erros de permissão da câmera.
      if (error.toLowerCase().includes('permission denied') || error.toLowerCase().includes('notallowederror')) {
        setCameraError('Acesso à câmera negado. Por favor, verifique as permissões do seu navegador.');
        // Para o scanner se não houver permissão
        scanner.clear().catch(err => console.error("Falha ao limpar o scanner após erro de permissão.", err));
      }
    };

    // Inicia o scanner
    scanner.render(onScanSuccess, onScanFailure);

    // Função de limpeza para ser executada quando o componente for desmontado
    return () => {
      // Garante que o scanner e a câmera sejam desligados ao fechar o modal
      scanner.clear().catch(error => {
        console.error("Falha ao limpar o scanner html5-qrcode.", error);
      });
    };
  }, [onScan, scanResult]); // Dependências do useEffect

  return (
    <Modal show={true} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        {/* Título mais genérico para incluir códigos de barras */}
        <Modal.Title>Ler Código de Barras ou QR Code</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {/* O container onde o scanner de vídeo será renderizado */}
        <div id="qr-reader" style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>
        
        {cameraError && (
          <Alert variant="danger" className="mt-3">{cameraError}</Alert>
        )}

        {scanResult ? (
          <Alert variant="success" className="mt-3">
            Código lido com sucesso: {scanResult}
          </Alert>
        ) : (
          <p className="mt-3">Aponte a câmera para o código.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QrScanner;