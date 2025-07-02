// backend/index.js
import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();

// Middleware para o Express entender JSON
app.use(express.json());
// Middleware para habilitar o CORS
app.use(cors());

// Configuração da conexão com o MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Usuário padrão do XAMPP/MySQL
  password: "",   // Senha padrão do XAMPP é vazia
  database: "crud_produtos",
});

// Rota principal (teste)
app.get("/", (req, res) => {
  res.json("Olá, este é o backend!");
});

// Rota para BUSCAR todos os produtos
app.get("/produtos", (req, res) => {
  const q = "SELECT * FROM produtos";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
});

// Rota para CRIAR um produto
app.post("/produtos", (req, res) => {
  const q = "INSERT INTO produtos (`nome`, `qtde`, `valor`) VALUES (?)";
  const values = [
    req.body.nome,
    req.body.qtde,
    req.body.valor,
  ];

  db.query(q, [values], (err) => {
    if (err) return res.status(500).json(err);
    return res.status(201).json("Produto criado com sucesso.");
  });
});

// Rota para DELETAR um produto
app.delete("/produtos/:id", (req, res) => {
  const q = "DELETE FROM produtos WHERE `id` = ?";
  const productId = req.params.id;

  db.query(q, [productId], (err) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Produto deletado com sucesso.");
  });
});

// Inicia o servidor na porta 8800
app.listen(8800, () => {
  console.log("Backend conectado e rodando na porta 8800!");
});