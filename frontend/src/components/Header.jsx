import React from 'react';
import videplastLogo from '../assets/videplast-brand.png';

const Header = () => {
  return (
    <header className="app-header text-center">
      <img src={videplastLogo} alt="Logo Videplast" className="logo" />
      <h1 className="h2 fw-bold text-dark mt-3">Consulta de Imobilizados</h1>
      <p className="lead text-secondary">
        Busque por código do imobilizado, nº de inventário, nº de série ou descrição.
      </p>
    </header>
  );
};

export default Header;