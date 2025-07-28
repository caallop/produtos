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
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

// Rota principal (teste)
app.get("/", (req, res) => {
  res.json("Olá, este é o backend!");
});

// Rota para BUSCAR todos os produtos
app.get("/produtos", (req, res) => {
  const q = "SELECT * FROM produto";
  db.query(q, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json(data);
  });
});

// Rota para CRIAR um produto
app.post("/produtos", (req, res) => {
  const q = "INSERT INTO produto (`nome`, `qtde`, `valor`) VALUES (?)";
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

// Rota para ATUALIZAR (UPDATE) um produto
app.put("/produtos/:id", (req, res) => {
  const q = "UPDATE produto SET `nome` = ?, `qtde` = ?, `valor` = ? WHERE `id` = ?";
  const productId = req.params.id;

  const values = [
    req.body.nome,
    req.body.qtde,
    req.body.valor,
  ];

  db.query(q, [...values, productId], (err) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Produto atualizado com sucesso.");
  });
});


// Rota para DELETAR um produto
app.delete("/produtos/:id", (req, res) => {
  const q = "DELETE FROM produto WHERE `id` = ?";
  const productId = req.params.id;

  db.query(q, [productId], (err) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Produto deletado com sucesso.");
  });
});

// Inicia o servidor na porta padrão ou na porta definida pela variável de ambiente
const port = process.env.PORT || 8800;// Inicia o servidor na porta 8800, ou a que esta definida na variavel de ambiente
app.listen(port, () => {
  console.log(`Backend conectado e rodando na porta ${port}!`);
});
