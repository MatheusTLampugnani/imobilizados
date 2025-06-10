import pandas as pd
import json
import os
import re

def formatar_valor(valor, tipo='string'):
    if pd.isna(valor):
        return ""
    
    valor_str = str(valor).strip()
    
    if tipo == 'inteiro':
        return re.sub(r'\.0$', '', valor_str)
        
    return valor_str

diretorio_atual = os.path.dirname(os.path.abspath(__file__))

nome_arquivo_dados = "Relação imobilizados Rio Verde - 27_03_2025 (1).XLSX - Sheet1.csv"
caminho_arquivo_dados = os.path.join(diretorio_atual, nome_arquivo_dados)

nome_arquivo_saida = "dados_imobilizados_processados.json"
caminho_arquivo_saida = os.path.join(diretorio_atual, nome_arquivo_saida)

if not os.path.exists(caminho_arquivo_dados):
    print(f"❌ ERRO: Arquivo de dados não encontrado!")
    print(f"Por favor, verifique se o arquivo '{nome_arquivo_dados}' está na mesma pasta que este script.")
    input("\nPressione Enter para sair...")
    exit()

print(f"ℹ️  Arquivo de dados encontrado: {nome_arquivo_dados}")

try:
    df = pd.read_csv(caminho_arquivo_dados, encoding='utf-8', sep=',')

    colunas_obrigatorias = [
        'Imobilizado', 'Subnº', 'Incorporação em', 
        'Denominação do imobilizado', 'Nº inventário', 
        'Nº de série', 'Centro custo'
    ]
    
    colunas_faltantes = [col for col in colunas_obrigatorias if col not in df.columns]
    if colunas_faltantes:
        print(f"❌ ERRO: Colunas obrigatórias não encontradas no arquivo: {', '.join(colunas_faltantes)}")
        input("\nPressione Enter para sair...")
        exit()

    dados_finais = {}
    linhas_ignoradas = 0
    codigos_invalidos = set()

    for _, row in df.iterrows():
        codigo_imobilizado = formatar_valor(row['Imobilizado'], 'inteiro')
        
        if not codigo_imobilizado or pd.isna(row['Denominação do imobilizado']) or pd.isna(row['Centro custo']):
            if not codigo_imobilizado:
                codigos_invalidos.add(str(row['Imobilizado']))
            linhas_ignoradas += 1
            continue

        try:
            data_formatada = pd.to_datetime(row['Incorporação em']).strftime('%d/%m/%Y')
        except (ValueError, TypeError):
            data_formatada = "Data inválida"

        item = {
            "Subnº": formatar_valor(row['Subnº'], 'inteiro'),
            "Data": data_formatada,
            "Descrição": formatar_valor(row['Denominação do imobilizado']),
            "Inventário": formatar_valor(row['Nº inventário'], 'inteiro'),
            "Série": formatar_valor(row['Nº de série']),
            "Centro Custo": formatar_valor(row['Centro custo'], 'inteiro'),
            "Link": f"https://videplast.com.br/consulta-imobilizado?id={codigo_imobilizado}",
            "QRCODE": ""
        }

        if codigo_imobilizado not in dados_finais:
            dados_finais[codigo_imobilizado] = {"itens": []}
        
        dados_finais[codigo_imobilizado]["itens"].append(item)

    with open(caminho_arquivo_saida, 'w', encoding='utf-8') as f:
        json.dump(dados_finais, f, ensure_ascii=False, indent=4)

    total_codigos = len(dados_finais)
    total_itens = sum(len(v["itens"]) for v in dados_finais.values())
    
    print("\n" + "="*40)
    print("✅ Processamento Concluído com Sucesso!")
    print("="*40)
    print(f"👉 Total de códigos de imobilizado únicos: {total_codigos}")
    print(f"👉 Total de itens (sub-ativos) processados: {total_itens}")
    print(f"👉 Total de linhas ignoradas (dados inválidos): {linhas_ignoradas}")
    
    if codigos_invalidos:
        print(f"⚠️  Amostra de códigos inválidos ignorados: {', '.join(list(codigos_invalidos)[:5])}...")

    print("-"*40)
    print(f"\n🚀 Arquivo JSON gerado com sucesso em:")
    print(caminho_arquivo_saida)
    print("="*40)

except Exception as e:
    print("\n❌ Ocorreu um erro inesperado durante o processamento.")
    print(f"   Tipo do erro: {type(e).__name__}")
    print(f"   Detalhes: {e}")

finally:
    input("\nPressione Enter para sair...")
