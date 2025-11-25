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
    const str = String(valor).trim();
    
    if (/^\d+$/.test(str)) {
        return String(parseInt(str, 10));
    }
    return str;
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
      .ilike('centro_custo', cc); 

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
        const searchByText = async (field, value) => {
            const { data, error } = await supabase.from('imobilizados').select('*').ilike(field, value);
            if (error) throw error;
            return data || [];
        };

        const searchByNumber = async (field, value) => {
            const { data, error } = await supabase.from('imobilizados').select('*').eq(field, value);
            if (error) throw error;
            return data || [];
        };

        const searchByDescription = async (value) => {
            const { data, error } = await supabase.from('imobilizados').select('*').ilike('descricao', `%${value}%`);
            if (error) throw error;
            return data || [];
        };
        
        const searchPromises = [];
        
        searchPromises.push(searchByText('codigo_inventario', codigoFormatado));
        searchPromises.push(searchByText('numero_serie', codigoFormatado));
        searchPromises.push(searchByText('centro_custo', codigoFormatado));

        const isNumeric = /^\d+$/.test(codigoFormatado);
        if (isNumeric) {
            const numericValue = parseInt(codigoFormatado, 10);
            searchPromises.push(searchByNumber('codigo_imobilizado', numericValue));
        }

        searchPromises.push(searchByDescription(codigoFormatado));
        
        const results = await Promise.all(searchPromises);
        const allResults = results.flat();
        
        const uniqueIds = new Set();
        const itensEncontrados = allResults.filter(item => {
            if (uniqueIds.has(item.id)) return false;
            uniqueIds.add(item.id);
            return true;
        });

        if (itensEncontrados.length > 0) {
            const centroCustoCodes = [...new Set(itensEncontrados.map(item => item.centro_custo).filter(Boolean))];
            let centroCustoMap = {};

            if (centroCustoCodes.length > 0) {
                const { data: centrosCustoData, error: ccError } = await supabase
                    .from('centro_de_custo')
                    .select('centro_custo, setores')
                    .in('centro_custo', centroCustoCodes);

                if (ccError) {
                    console.error('Erro ao buscar nomes dos centros de custo:', ccError);
                } else {
                    centrosCustoData.forEach(cc => {
                        centroCustoMap[cc.centro_custo] = cc.setores;
                    });
                }
            }
            
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
                    "CentroCustoNome": centroCustoMap[item.centro_custo] || '',
                    "codigo_imobilizado": item.codigo_imobilizado
                }))
            };
            return res.status(200).json(responseData);
        } else {
            return res.status(404).json({ message: `Nenhum item encontrado para o termo: ${codigo}` });
        }
    } catch (dbError) {
        console.error('--- ERRO NA CONSULTA AO SUPABASE ---', dbError);
        return res.status(500).json({ message: `Erro no banco de dados: ${dbError.message}` });
    }
});

app.get('/api/inventory-item', async (req, res) => {
    const { codigo } = req.query;
    const codigoFormatado = formatarValor(codigo);

    if (!codigoFormatado) {
        return res.status(400).json({ message: "Nenhum código foi fornecido." });
    }

    try {
        const searchByText = async (field, value) => {
            const { data, error } = await supabase.from('imobilizados').select('*').ilike(field, value);
            if (error) throw error;
            return data || [];
        };
        const searchByNumber = async (field, value) => {
            const { data, error } = await supabase.from('imobilizados').select('*').eq(field, value);
            if (error) throw error;
            return data || [];
        };

        const searchPromises = [];
        searchPromises.push(searchByText('codigo_inventario', codigoFormatado));
        searchPromises.push(searchByText('numero_serie', codigoFormatado));

        const isNumeric = /^\d+$/.test(codigoFormatado);
        if (isNumeric) {
            const numericValue = parseInt(codigoFormatado, 10);
            searchPromises.push(searchByNumber('codigo_imobilizado', numericValue));
        }

        const results = await Promise.all(searchPromises);
        const itemEncontrado = results.flat()[0]; 

        if (itemEncontrado) {
            let nomeSetor = '';
            if (itemEncontrado.centro_custo) {
                 const { data: ccData } = await supabase
                    .from('centro_de_custo')
                    .select('setores')
                    .eq('centro_custo', itemEncontrado.centro_custo)
                    .single();
                 if (ccData) nomeSetor = ccData.setores;
            }

            const responseData = {
                id: itemEncontrado.id,
                "Subnº": itemEncontrado.sub_numero,
                "Data": itemEncontrado.data_incorporacao,
                "Descrição": itemEncontrado.descricao,
                "Inventário": itemEncontrado.codigo_inventario,
                "Inventário_Antigo": itemEncontrado.codigo_inventario_antigo,
                "Série": itemEncontrado.numero_serie,
                "CentroCusto": itemEncontrado.centro_custo,
                "CentroCustoNome": nomeSetor,
                "codigo_imobilizado": itemEncontrado.codigo_imobilizado
            };
            return res.status(200).json({ itens: [responseData] });
        } else {
            return res.status(404).json({ message: `Nenhum item encontrado para o código: ${codigo}` });
        }
    } catch (dbError) {
        console.error('--- ERRO NA CONSULTA DE INVENTÁRIO ---', dbError);
        return res.status(500).json({ message: `Erro no banco de dados: ${dbError.message}` });
    }
});

app.post('/api/imobilizado', async (req, res) => {
    const { descricao, codigo_inventario, centro_custo, user, numero_serie, local } = req.body;

    if (!descricao || !codigo_inventario || !centro_custo || !user) {
        return res.status(400).json({ message: 'Campos obrigatórios faltando.' });
    }

    try {
        const invCodeClean = formatarValor(codigo_inventario);

        const { data, error } = await supabase
            .from('imobilizados_cadastrados')
            .insert([
                {
                    descricao: descricao,
                    codigo_inventario: invCodeClean,
                    numero_serie: numero_serie || null,
                    centro_custo: centro_custo,
                    local: local || null,
                    cracha: user 
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Erro detalhado do Supabase:", error); 
            throw error;
        }

        return res.status(201).json(data);

    } catch (error) {
        console.error("ERRO AO CADASTRAR ITEM NOVO: ", error);
        return res.status(500).json({ message: `Erro no servidor: ${error.message}` });
    }
});

app.put('/api/imobilizado/update-inventory', async (req, res) => {
    try {
        const { itemId, newInventoryCode, user } = req.body;
        const newCode = formatarValor(newInventoryCode);

        if (!itemId || !newCode) {
            return res.status(400).json({ message: 'Dados inválidos fornecidos.' });
        }

        const { data: currentItem, error: fetchError } = await supabase.from('imobilizados').select('codigo_inventario').eq('id', itemId).single();
        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase.from('imobilizados').update({
            codigo_inventario: newCode,
            codigo_inventario_antigo: currentItem.codigo_inventario,
            usuario_atualizacao: user || 'Sistema'
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

app.get(/(.*)/, (req, res) => {
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