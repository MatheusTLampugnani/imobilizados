import json
from flask import Flask, jsonify, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 

dados_imobilizados = {}

def carregar_dados():
    """Carrega os dados do arquivo JSON para a memória."""
    global dados_imobilizados
    try:
        with open('dados_imobilizados.json', 'r', encoding='utf-8') as f:
            dados = json.load(f)
            if isinstance(dados, list):
                for item in dados:
                    codigo = item.get('codigo') or item.get('Codigo') or item.get('CODIGO')
                    if codigo:
                        codigo_str = str(codigo)
                        if codigo_str not in dados_imobilizados:
                            dados_imobilizados[codigo_str] = {"itens": []}
                        dados_imobilizados[codigo_str]["itens"].append(item)
            elif isinstance(dados, dict):
                 dados_imobilizados = dados
            
            print("Dados carregados com sucesso.")

    except FileNotFoundError:
        print("Erro: O arquivo 'dados_imobilizados.json' não foi encontrado.")
    except json.JSONDecodeError:
        print("Erro: O arquivo JSON está mal formatado.")
    except Exception as e:
        print(f"Ocorreu um erro inesperado ao carregar os dados: {e}")

@app.route('/api/imobilizado/<string:codigo>', methods=['GET'])
def get_imobilizado(codigo):
    """Retorna os dados de um imobilizado específico."""
    imobilizado = dados_imobilizados.get(codigo)
    if not imobilizado:
        abort(404, description=f"Imobilizado com código {codigo} não encontrado.")
    return jsonify(imobilizado)

@app.route('/api/imobilizados', methods=['GET'])
def get_todos_imobilizados():
    """Retorna todos os dados de imobilizados."""
    return jsonify(dados_imobilizados)

@app.errorhandler(404)
def not_found(error):
    return jsonify({"erro": str(error)}), 404

with app.app_context():
    carregar_dados()

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)