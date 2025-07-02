// frontend/src/App.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

// URL da nossa API (backend)
const API_URL = "http://localhost:8800";

function App() {
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState("");
  const [qtde, setQtde] = useState("");
  const [valor, setValor] = useState("");

  // Função para buscar os produtos da API
  const fetchProdutos = async () => {
    try {
      const res = await axios.get(`${API_URL}/produtos`);
      setProdutos(res.data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  // useEffect para buscar os produtos quando o componente é montado
  useEffect(() => {
    fetchProdutos();
  }, []);

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome || !qtde || !valor) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const novoProduto = {
      nome,
      qtde: parseInt(qtde),
      valor: parseFloat(valor),
    };

    try {
      await axios.post(`${API_URL}/produtos`, novoProduto);
      alert("Produto cadastrado com sucesso!");
      // Limpa os campos e atualiza a lista de produtos
      setNome("");
      setQtde("");
      setValor("");
      fetchProdutos();
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);
      alert("Ocorreu um erro ao cadastrar o produto.");
    }
  };
  
  // Função para deletar um produto
  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja deletar este produto?")) {
      try {
        await axios.delete(`${API_URL}/produtos/${id}`);
        alert("Produto deletado com sucesso!");
        // Atualiza a lista de produtos
        fetchProdutos();
      } catch (error) {
        console.error("Erro ao deletar produto:", error);
        alert("Ocorreu um erro ao deletar o produto.");
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Cadastro de Produtos
      </h1>

      {/* Formulário de Cadastro */}
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
        <button type="submit" className="md:col-start-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Cadastrar
        </button>
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
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <button onClick={() => handleDelete(produto.id)} className="text-red-600 hover:text-red-900">
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;