// backend/index.js
import express from "express";
import sql from "mssql"; // Importe o driver mssql
import cors from "cors";

const app = express();

// Middleware para o Express entender JSON
app.use(express.json());

// Configuração do CORS (ajuste a origem para o seu frontend)
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Use variável de ambiente para a URL do frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Configurações do banco de dados SQL Server (usando variáveis de ambiente)
const dbConfigSQL = {
    user: process.env.DB_USER_SQL,         // Nome de usuário do administrador do SQL Server
    password: process.env.DB_PASSWORD_SQL, // Senha do administrador do SQL Server
    server: process.env.DB_HOST_SQL,       // Ex: 'produtossqlserver-srv.database.windows.net'
    database: process.env.DB_NAME_SQL,     // Ex: 'crud_produtos_db'
    options: {
        encrypt: true, // Para Azure SQL Database, é essencial
        trustServerCertificate: false // Para produção, use true se o certificado for auto-assinado (não é o caso do Azure)
    },
    port: parseInt(process.env.DB_PORT_SQL || '1433') // Porta padrão para SQL Server
};

// Variável para o pool de conexão
let sqlPool;

// Função para conectar ao banco de dados e criar o pool
async function connectToSQLDatabase() {
    try {
        sqlPool = new sql.ConnectionPool(dbConfigSQL);
        await sqlPool.connect();
        console.log('Conectado ao Azure SQL Database!');
    } catch (error) {
        console.error('Erro ao conectar ao Azure SQL Database:', error);
        // Em um app real, você pode querer tentar novamente ou lidar com o erro de forma mais robusta
        process.exit(1); // Sai do processo se a conexão falhar
    }
}

// Chame a função de conexão quando o aplicativo iniciar
connectToSQLDatabase();

// Rota principal (teste)
app.get("/", (req, res) => {
    res.json("Olá, este é o backend!");
});

// Rota para BUSCAR todos os produtos
app.get("/produtos", async (req, res) => {
    try {
        if (!sqlPool || !sqlPool.connected) {
            return res.status(500).json({ message: 'Banco de dados não conectado.' });
        }
        const request = sqlPool.request();
        const q = "SELECT id, nome, qtde, valor FROM produtos"; // Query SQL Server
        const result = await request.query(q);
        return res.status(200).json(result.recordset); // Dados estão em .recordset
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        return res.status(500).json(err);
    }
});

// Rota para CRIAR um produto
app.post("/produtos", async (req, res) => {
    const { nome, qtde, valor } = req.body;
    try {
        if (!sqlPool || !sqlPool.connected) {
            return res.status(500).json({ message: 'Banco de dados não conectado.' });
        }
        const request = sqlPool.request();
        const q = "INSERT INTO produtos (nome, qtde, valor) VALUES (@nome, @qtde, @valor); SELECT SCOPE_IDENTITY() AS id;";

        // Use .input() para evitar SQL Injection e garantir tipos corretos
        request.input('nome', sql.VarChar(255), nome);
        request.input('qtde', sql.Int, qtde);
        request.input('valor', sql.Decimal(10, 2), valor);

        const result = await request.query(q);
        // SCOPE_IDENTITY() retorna o ID do item inserido no SQL Server
        return res.status(201).json({ id: result.recordset[0].id, nome, qtde, valor, message: "Produto criado com sucesso." });
    } catch (err) {
        console.error('Erro ao criar produto:', err);
        return res.status(500).json(err);
    }
});

// Rota para ATUALIZAR (UPDATE) um produto
app.put("/produtos/:id", async (req, res) => {
    const productId = req.params.id;
    const { nome, qtde, valor } = req.body;
    try {
        if (!sqlPool || !sqlPool.connected) {
            return res.status(500).json({ message: 'Banco de dados não conectado.' });
        }
        const request = sqlPool.request();
        const q = "UPDATE produtos SET nome = @nome, qtde = @qtde, valor = @valor WHERE id = @id";

        request.input('nome', sql.VarChar(255), nome);
        request.input('qtde', sql.Int, qtde);
        request.input('valor', sql.Decimal(10, 2), valor);
        request.input('id', sql.Int, productId); // Passe o ID como parâmetro também

        await request.query(q);
        return res.status(200).json("Produto atualizado com sucesso.");
    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        return res.status(500).json(err);
    }
});

// Rota para DELETAR um produto
app.delete("/produtos/:id", async (req, res) => {
    const productId = req.params.id;
    try {
        if (!sqlPool || !sqlPool.connected) {
            return res.status(500).json({ message: 'Banco de dados não conectado.' });
        }
        const request = sqlPool.request();
        const q = "DELETE FROM produtos WHERE id = @id";

        request.input('id', sql.Int, productId); // Passe o ID como parâmetro

        await request.query(q);
        return res.status(200).json("Produto deletado com sucesso.");
    } catch (err) {
        console.error('Erro ao deletar produto:', err);
        return res.status(500).json(err);
    }
});

// Inicia o servidor na porta (usando process.env.PORT para Azure App Service)
const PORT = process.env.PORT || 3000; // A porta 8800 é para desenvolvimento local, Azure usa a variável PORT
app.listen(PORT, () => {
    console.log(`Backend conectado e rodando na porta ${PORT}!`);
});

// Lidar com o fechamento do pool em caso de encerramento do aplicativo
process.on('SIGTERM', async () => {
  console.log('Sinal SIGTERM recebido. Fechando pool de conexão SQL...');
  if (sqlPool && sqlPool.connected) {
    await sqlPool.close();
  }
  process.exit(0);
});
