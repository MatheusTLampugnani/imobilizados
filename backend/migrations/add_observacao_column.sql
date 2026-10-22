-- Migração: Adição do campo 'observacao' para itens cadastrados
-- Executar no SQL Editor do Supabase (https://supabase.com/dashboard/project/ppatzcfifgbznbserfsh/sql)

-- 1. Adiciona a coluna na tabela de imobilizados cadastrados manualmente
ALTER TABLE imobilizados_cadastrados 
ADD COLUMN IF NOT EXISTS observacao TEXT;

-- 2. Adiciona a coluna na tabela oficial de imobilizados (usado também em baixas)
ALTER TABLE imobilizados 
ADD COLUMN IF NOT EXISTS observacao TEXT;
