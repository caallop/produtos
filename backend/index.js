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
  host: "sql.freedb.tech",
  user: "freedb_produto",
  password: "4??yk@ZCTj$QJ%T",
  database: "freedb_produto",
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

// Rota para ATUALIZAR (UPDATE) um produto
app.put("/produtos/:id", (req, res) => {
  const q = "UPDATE produtos SET `nome` = ?, `qtde` = ?, `valor` = ? WHERE `id` = ?";
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
  const q = "DELETE FROM produtos WHERE `id` = ?";
  const productId = req.params.id;

  db.query(q, [productId], (err) => {
    if (err) return res.status(500).json(err);
    return res.status(200).json("Produto deletado com sucesso.");
  });
});

const port = process.env.PORT || 8800;// Inicia o servidor na porta 8800
app.listen(port, () => {
  console.log("Backend conectado e rodando na porta 8800!");
});
