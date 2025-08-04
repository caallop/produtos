import React, { useState, useEffect } from "react";
import axios from "axios";

// URL da nossa API (backend)
// Certifique-se de que esta URL está correta e que o CORS está configurado no backend
const API_URL = "https://produto-api.proudmushroom-e446e8ba.canadacentral.azurecontainerapps.io/";
//const API_URL = "http://localhost:1234";

// Componente de Modal Simples para Alertas e Confirmações
const Modal = ({ message, onConfirm, onCancel, type = 'alert' }) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
        <p className="text-lg font-semibold mb-4">{message}</p>
        <div className="flex justify-center space-x-4">
          {type === 'alert' && (
            <button
              onClick={onConfirm}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              OK
            </button>
          )}
          {type === 'confirm' && (
            <>
              <button
                onClick={onConfirm}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Sim
              </button>
              <button
                onClick={onCancel}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


function App() {
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState("");
  const [qtde, setQtde] = useState("");
  const [valor, setValor] = useState("");
  const [editando, setEditando] = useState(null); // Estado para controlar a edição

  // Estados para o Modal
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("alert");
  const [modalAction, setModalAction] = useState(null); // Callback para ação de confirmação

  // Função para exibir o modal de alerta
  const showAlert = (message) => {
    setModalMessage(message);
    setModalType('alert');
    setModalAction(() => () => setModalMessage("")); // Limpa a mensagem ao confirmar
  };

  // Função para exibir o modal de confirmação
  const showConfirm = (message, onConfirmCallback) => {
    setModalMessage(message);
    setModalType('confirm');
    setModalAction(() => {
      return () => {
        onConfirmCallback();
        setModalMessage("");
      };
    });
  };

  // Função para fechar o modal
  const closeModal = () => {
    setModalMessage("");
    setModalAction(null);
  };


  // Função para buscar os produtos da API
  const fetchProdutos = async () => {
    try {
      const res = await axios.get(`${API_URL}/produtos`);
      // Ordena os produtos por ID para manter a consistência
      setProdutos(res.data.sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      showAlert("Ocorreu um erro ao buscar os produtos. Verifique a conexão com o backend.");
    }
  };

  // useEffect para buscar os produtos quando o componente é montado
  useEffect(() => {
    fetchProdutos();
  }, []);

  // Função para limpar o formulário e o estado de edição
  const limparFormulario = () => {
    setNome("");
    setQtde("");
    setValor("");
    setEditando(null); // Limpa o modo de edição
  };

  // Função para lidar com o envio do formulário (CRIAR ou ATUALIZAR)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome || !qtde || !valor) {
      showAlert("Por favor, preencha todos os campos.");
      return;
    }

    const produtoData = {
      nome,
      qtde: parseInt(qtde),
      valor: parseFloat(valor),
    };

    try {
      // Se estiver editando, chama o método PUT (UPDATE)
      if (editando) {
        await axios.put(`${API_URL}/produtos/${editando.id}`, produtoData);
        showAlert("Produto atualizado com sucesso!");
      } else {
        // Se não, chama o método POST (CREATE)
        await axios.post(`${API_URL}/produtos`, produtoData);
        showAlert("Produto cadastrado com sucesso!");
      }
      
      limparFormulario();
      fetchProdutos(); // Atualiza a lista após a operação
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      showAlert("Ocorreu um erro ao salvar o produto.");
    }
  };
  
  // Função para carregar os dados do produto no formulário para edição
  const handleEdit = (produto) => {
    setEditando(produto); // Define o produto que está sendo editado
    setNome(produto.nome);
    setQtde(produto.qtde);
    setValor(produto.valor);
  };

  // Função para deletar um produto
  const handleDelete = async (id) => {
    showConfirm("Tem certeza que deseja deletar este produto?", async () => {
      try {
        await axios.delete(`${API_URL}/produtos/${id}`);
        showAlert("Produto deletado com sucesso!");
        fetchProdutos(); // Atualiza a lista
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
        showAlert("Ocorreu um erro ao deletar o produto.");
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        {editando ? "Editando Produto" : "Cadastro de Produtos"}
      </h1>

      {/* Formulário de Cadastro / Edição */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome do Produto</label>
          <input
            type="text"
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ex: Teclado Mecânico"
          />
        </div>
        <div>
          <label htmlFor="qtde" className="block text-sm font-medium text-gray-700">Quantidade</label>
          <input
            type="number"
            id="qtde"
            value={qtde}
            onChange={(e) => setQtde(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0"
          />
        </div>
        <div>
          <label htmlFor="valor" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            id="valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0.00"
          />
        </div>
        <div className="flex space-x-2">
          <button type="submit" className={`w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${editando ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`}>
            {editando ? "Salvar" : "Cadastrar"}
          </button>
          {editando && (
            <button type="button" onClick={limparFormulario} className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabela de Produtos */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Qtde</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {produtos.map((produto) => (
              <tr key={produto.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{produto.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{produto.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{produto.qtde}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.valor)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-4">
                  {/* BOTÃO DE EDITAR */}
                  <button onClick={() => handleEdit(produto)} className="text-indigo-600 hover:text-indigo-900">
                    Editar
                  </button>
                  {/* BOTÃO DE DELETAR */}
                  <button onClick={() => handleDelete(produto.id)} className="text-red-600 hover:text-red-900">
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Renderiza o Modal */}
      <Modal
        message={modalMessage}
        onConfirm={modalAction}
        onCancel={closeModal}
        type={modalType}
      />
    </div>
  );
}

export default App;
