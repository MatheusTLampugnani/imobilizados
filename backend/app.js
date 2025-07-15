require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { handlePdfReportRequest } = require('./utils/geradorPDF.js');
const { handleCsvReportRequest } = require('./utils/geradorCSV.js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY não foram definidas.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Conexão com o Supabase configurada.');

function formatarValor(valor) {
    if (valor === null || valor === undefined || valor === '') return "";
    return String(valor).trim().replace(/\.0$/, '').replace(/^0+/, '');
}
app.get('/api/centro-custo/validate/:cc', async (req, res) => {
  const { cc } = req.params;

  if (!cc) {
    return res.status(400).json({ isValid: false, message: 'Centro de Custo não fornecido.' });
  }

  try {
    const { data, error, count } = await supabase
      .from('imobilizados')
      .select('centro_custo', { count: 'exact', head: true })
      .eq('centro_custo', cc);

    if (error) {
      throw error;
    }

    if (count > 0) {
      res.status(200).json({ isValid: true });
    } else {
      res.status(404).json({ isValid: false, message: 'Centro de Custo não encontrado.' });
    }
  } catch (dbError) {
    console.error('Erro ao validar Centro de Custo:', dbError);
    res.status(500).json({ isValid: false, message: 'Erro interno do servidor.' });
  }
});

app.get('/api', (req, res) => {
    res.status(200).send('Servidor do Imobilizados-API está no ar!');
});

app.get('/api/imobilizado', async (req, res) => {
    console.log(`[LOG DE TESTE] Rota /api/imobilizado foi chamada com o código: ${req.query.codigo}`);
    const { codigo } = req.query;
    const codigoFormatado = formatarValor(codigo);

    if (!codigoFormatado) {
        return res.status(400).json({ message: "Nenhum código foi fornecido." });
    }

    try {
        const searchByField = async (field, value) => {
            const { data, error } = await supabase.from('imobilizados').select('*').eq(field, value);
            if (error) throw error;
            return data;
        };

        let itensEncontrados = await searchByField('codigo_inventario', codigoFormatado);
        if (!itensEncontrados || itensEncontrados.length === 0) {
            itensEncontrados = await searchByField('numero_serie', codigoFormatado);
        }
        if (!itensEncontrados || itensEncontrados.length === 0) {
            itensEncontrados = await searchByField('codigo_imobilizado', codigoFormatado);
        }
        if (!itensEncontrados || itensEncontrados.length === 0) {
            itensEncontrados = await searchByField('centro_custo', codigoFormatado);
        }

        if (itensEncontrados && itensEncontrados.length > 0) {
            const imobilizadoPrincipalCodigo = itensEncontrados[0].codigo_imobilizado;
            const responseData = {
                codigo_imobilizado: imobilizadoPrincipalCodigo,
                itens: itensEncontrados.map(item => ({
                    id: item.id, 
                    "Subnº": item.sub_numero, 
                    "Data": item.data_incorporacao,
                    "Descrição": item.descricao, 
                    "Inventário": item.codigo_inventario,
                    "Inventário_Antigo": item.codigo_inventario_antigo, 
                    "Série": item.numero_serie,
                    "CentroCusto": item.centro_custo,
                    "codigo_imobilizado": item.codigo_imobilizado
                }))
            };
            return res.status(200).json(responseData);
        } else {
            return res.status(404).json({ message: 'Imobilizado, Inventário ou Nº de Série não encontrado' });
        }
    } catch (dbError) {
        console.error('--- ERRO NA CONSULTA AO SUPABASE ---', dbError);
        return res.status(500).json({ message: `Erro no banco de dados: ${dbError.message}` });
    }
});

app.put('/api/imobilizado/update-inventory', async (req, res) => {
    try {
        const { itemId, newInventoryCode } = req.body;
        const newCodeNumeric = parseInt(newInventoryCode, 10);

        if (!itemId || isNaN(newCodeNumeric)) {
            return res.status(400).json({ message: 'Dados inválidos fornecidos.' });
        }

        const { data: currentItem, error: fetchError } = await supabase.from('imobilizados').select('codigo_inventario').eq('id', itemId).single();
        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase.from('imobilizados').update({
            codigo_inventario: newCodeNumeric,
            codigo_inventario_antigo: currentItem.codigo_inventario
        }).eq('id', itemId);
        if (updateError) throw updateError;

        return res.status(200).json({ message: 'Inventário atualizado com sucesso!' });
    } catch(error) {
        console.error("ERRO AO ATUALIZAR INVENTÁRIO: ", error);
        return res.status(500).json({ message: `Erro no servidor: ${error.message}`});
    }
});

app.get('/api/report/pdf', handlePdfReportRequest);
app.get('/api/report/csv', handleCsvReportRequest);

const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.static(frontendDistPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
        if (err) {
            res.status(500).send(err);
        }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});