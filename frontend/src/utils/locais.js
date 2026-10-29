export const locationsData = {
  "EXTRUSÃO": [
    "SALA ADM EXT",
    "SALA TRE EXT",
    "AREA PROD EXT"
  ],
  "ACABAMENTO": [
    "SALA ADM ACA",
    "SALA TRE ACA",
    "AREA PROD ACA",
    "AREA PROD REF"
  ],
  "IMPRESSÃO": [
    "SALA ADM IMP",
    "SALA TRE IMP",
    "AREA PROD IMP",
    "SALA DE RESIDUOS"
  ],
  "SALA DE TINTAS": [
    "SALA ADM TINTAS",
    "AREA PROD TINTAS"
  ],
  "ADM": [
    "SALA REU 01",
    "SALA REU 02",
    "SALA REU 03",
    "SALA TREINAMENTO",
    "SALA GERENCIA JOSUE",
    "BARREIRA DE PRODUÇÃO"
  ],
  "PCP": [
    "SALA SUP PCP",
    "SALA PCP"
  ],
  "RH": [
    "ADM RH",
    "SALA ENTREVISTA",
    "SALA DE CONVENCIA",
    "REFEITORIO",
    "AREA REFEITORIO",
    "AREA COZINHA",
    "VESTIARIO FEMININO",
    "VESTIARIO MASCULINO", "VESTIARIOS"
  ],
  "MANUTENÇÃO": [
    "SALA TRE 04",
    "PCM",
    "GERAL",
    "GERADOR",
    "COORDENAÇÃO",
    "COMPRESSOR DE AR",
    "SISTEMA DE ÁGUA"
  ],
  "ALMOXARIFADO": [
    "SALA ADM",
    "SALA ESTOQUE",
    "SALA ESTOQUE 2"
  ],
  "TI": [
    "SALA SERVIDOR",
    "SALA ADM",
    "GERAL"
  ],
  "EXPEDIÇÃO": [
    "SALA ADM",
    "AREA PROD EXP"
  ],
  "APARAS": [
    "AREA PRODUTIVA"
  ],
  "MATERIA PRIMA": [
    "SALA ADM",
    "TUBETES"
  ],
  "CONTROLE DE QUALIDADE": [
    "SALA ADM",
    "SALA LABORATORIO",
    "SALA ARQUIVO",
    "AREA PROD AUDITI"
  ],
  "SERVIÇOS GERAIS": [
    "SERVIÇOS GERAIS"
  ],
  "PESQUISA E DESENVOLVIMENTO": [
    "SALA ADM"
  ],
  "ARTES": [
    "SALA ADM"
  ],
  "GUARITA": [
    "GERAL"
  ],
  "FATURAMENTO": [
    "FATURAMENTO ADM",
    "SALA ARQUIVO"
  ],
  "ALPHA CLICHERIA": [
    "GERAL"
  ],
  "CLICHERIA": [
    "SALA CLI ADM",
    "AREA PROD COLG"
  ],
  "BAIXA": [
    "BAIXA IMOB",
    "NAO ENCONTRADO"
  ],
  "MAQUINAS": [
    "IMP MÁQ 109",
    "IMP MÁQ 111",
    "IMP MÁQ 115",
    "IMP MÁQ 116",
    "IMP MÁQ 117",
    "IMP MÁQ 402",
    "ESTRUTURA/INSTALAÇÕES",
    "SALA DE PEÇAS",
    "EXT MAQ 15",
    "EXT MAQ 14",
    "EXT MAQ 12",
    "EXT MAQ 06",
    "EXT MAQ 05",
    "EXT MAQ 04",
    "EXT MAQ 02",
    "MISTURA",
    "CORTE MÁQ 201",
    "CORTE MÁQ 203",
    "CORTE MÁQ 204",
    "CORTE MÁQ 206",
    "CORTE MÁQ 207",
    "CORTE MÁQ 208",
    "CORTE MÁQ 209",
    "CORTE MÁQ 210",
    "CORTE MÁQ 211",
    "CORTE MÁQ 212",
    "CORTE MÁQ 213",
    "CORTE MÁQ 214",
    "CORTE MÁQ 215",
    "CORTE MÁQ 216",
    "CORTE MÁQ 217",
    "CORTE MÁQ 218",
    "CORTE MÁQ 219",
    "CORTE MÁQ 221",
    "CORTE MÁQ 222",
    "CORTE MÁQ 223",
    "CORTE MÁQ 225",
    "CORTE MÁQ 228",
    "CORTE MÁQ 229",
    "CORTE MÁQ 230",
    "CORTE MÁQ 231",
    "CORTE MÁQ 232",
    "CORTE MÁQ 233",
    "CORTE MÁQ 234",
    "CORTE MÁQ 235",
    "CORTE MÁQ 237",
    "CORTE MÁQ 239",
    "CORTE MÁQ 240",
    "CORTE MÁQ 241",
    "CORTE MÁQ 242",
    "CORTE MÁQ 243",
    "REF MÁQ 309",
    "REF MÁQ 311",
    "REF MÁQ 312",
    "REF MÁQ 314",
    "REF MÁQ 315"
  ]
};

// Código gravado no campo "local": até 15 caracteres e sem acento (o campo do SAP tem 15 caracteres).
// A tela continua mostrando Setor e Ambiente. O código é o próprio ambiente sem acento, menos nestes:
const CODIGOS_ESPECIAIS = {
  'IMPRESSÃO - SALA DE RESIDUOS': 'SALA RESIDUOS',
  'ADM - SALA GERENCIA JOSUE': 'GERENCIA JOSUE',
  'ADM - BARREIRA DE PRODUÇÃO': 'BARREIRA PROD',
  'RH - SALA DE CONVENCIA': 'SALA CONVIVENC',
  'RH - VESTIARIO FEMININO': 'VESTIARIO FEM',
  'RH - VESTIARIO MASCULINO': 'VESTIARIO MASC',
  'MANUTENÇÃO - PCM': 'MANUT PCM',
  'MANUTENÇÃO - GERAL': 'MANUTENCAO',
  'MANUTENÇÃO - GERADOR': 'MANUT GERADOR',
  'MANUTENÇÃO - COORDENAÇÃO': 'MANUT COORDENA',
  'MANUTENÇÃO - COMPRESSOR DE AR': 'COMPRESSOR AR',
  'ALMOXARIFADO - SALA ADM': 'ALMOX ADM',
  'ALMOXARIFADO - SALA ESTOQUE': 'ALMOX ESTOQUE',
  'ALMOXARIFADO - SALA ESTOQUE 2': 'ALMOX ESTOQUE 2',
  'TI - SALA SERVIDOR': 'TI SERVIDOR',
  'TI - SALA ADM': 'TI ADM',
  'TI - GERAL': 'TI GERAL',
  'EXPEDIÇÃO - SALA ADM': 'EXPEDICAO ADM',
  'APARAS - AREA PRODUTIVA': 'CENTRAL APARAS',
  'MATERIA PRIMA - SALA ADM': 'MAT PRIMA ADM',
  'MATERIA PRIMA - TUBETES': 'MAT PRIMA TUBET',
  'CONTROLE DE QUALIDADE - SALA ADM': 'QUALIDADE ADM',
  'CONTROLE DE QUALIDADE - SALA LABORATORIO': 'LABORATORIO',
  'CONTROLE DE QUALIDADE - SALA ARQUIVO': 'CQ SALA ARQUIVO',
  'CONTROLE DE QUALIDADE - AREA PROD AUDITI': 'CQ AUDITORIA',
  'PESQUISA E DESENVOLVIMENTO - SALA ADM': 'P&D ADM',
  'ARTES - SALA ADM': 'ARTES ADM',
  'GUARITA - GERAL': 'GUARITA',
  'FATURAMENTO - SALA ARQUIVO': 'FAT ARQUIVO',
  'ALPHA CLICHERIA - GERAL': 'ALPHA CLICHERIA',
  'CLICHERIA - SALA CLI ADM': 'CLICHERIA ADM',
  'CLICHERIA - AREA PROD COLG': 'CLICHERIA PROD',
};

export const TAMANHO_MAXIMO_LOCAL = 15;
const semAcento = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Código a gravar para um setor + ambiente da tela (ex.: CLICHERIA + AREA PROD COLG -> CLICHERIA PROD). */
export function montarLocal(setor, ambiente) {
  if (!setor || !ambiente) return '';
  return CODIGOS_ESPECIAIS[`${setor} - ${ambiente}`] || semAcento(ambiente).slice(0, TAMANHO_MAXIMO_LOCAL);
}

// Do código (ou do formato antigo "SETOR - AMBIENTE") de volta para setor e ambiente
const PARA_SETOR_AMBIENTE = {};
for (const [setor, ambientes] of Object.entries(locationsData)) {
  for (const ambiente of ambientes) {
    PARA_SETOR_AMBIENTE[montarLocal(setor, ambiente)] = { setor, ambiente };
    PARA_SETOR_AMBIENTE[`${setor} - ${ambiente}`] = { setor, ambiente };
  }
}

/** Setor e ambiente de um local gravado; se não for uma opção da tela, tenta achar só o setor. */
export function separarLocal(local) {
  const texto = String(local || '').trim();
  if (PARA_SETOR_AMBIENTE[texto]) return PARA_SETOR_AMBIENTE[texto];
  return { setor: Object.keys(locationsData).find(s => texto.includes(s)) || '', ambiente: '' };
}

/** Nome completo para mostrar (ex.: CLICHERIA PROD -> CLICHERIA - AREA PROD COLG). */
export function nomeDoLocal(local) {
  const { setor, ambiente } = separarLocal(local);
  return ambiente ? `${setor} - ${ambiente}` : String(local || '');
}