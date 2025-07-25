// backend/index.js
import express from "express";
import sql from "mssql"; // Importa o driver mssql
import cors from "cors";

const app = express();

// Middleware para o Express entender JSON
app.use(express.json());

// Configuração do CORS (ajuste a origem para o seu frontend)
const corsOptions = {
    // Usa variável de ambiente para a URL do frontend.
    // Certifique-se de definir FRONTEND_URL no seu ambiente de hospedagem (ex: Azure Static Web Apps).
    // Exemplo: 'https://seufilename.azurestaticapps.net'
    origin: process.env.FRONTEND_URL || 'https://white-bush-03ce0270f.2.azurestaticapps.net',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// --- Configuração do Banco de Dados SQL Server ---
// A string de conexão completa deve ser definida como uma variável de ambiente.
// Exemplo de variável de ambiente no Azure: SQL_CONNECTION_STRING
// Valor: Server=tcp:produtos-srv.database.windows.net,1433;Initial Catalog=produtos-db;Persist Security Info=False;User ID=sqladmin;Password=SUA_SENHA_AQUI;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
const connectionString = process.env.SQL_CONNECTION_STRING;

// Verifica se a string de conexão está definida
if (!connectionString) {
    console.error('Erro: A variável de ambiente SQL_CONNECTION_STRING não está definida.');
    console.error('Por favor, defina a string de conexão completa do seu Azure SQL Database.');
    process.exit(1); // Sai do processo se a string de conexão não estiver configurada
}

// Variável para o pool de conexão global
let sqlPool;

// Função para conectar ao banco de dados e criar o pool de conexão
async function connectToSQLDatabase() {
    try {
        // Cria um novo pool de conexão usando a string de conexão
        sqlPool = new sql.ConnectionPool(connectionString);
        await sqlPool.connect();
        console.log('Conectado ao Azure SQL Database com sucesso!');

        // Opcional: Criar a tabela 'produtos' se ela não existir
        // Este é um exemplo simples. Em produção, use ferramentas de migração de banco de dados.
        const createTableQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='produtos' and xtype='U')
            CREATE TABLE produtos (
                id INT IDENTITY(1,1) PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                qtde INT NOT NULL,
                valor DECIMAL(10, 2) NOT NULL
            );
        `;
        await sqlPool.request().query(createTableQuery);
        console.log('Tabela "produtos" verificada/criada.');

    } catch (error) {
        console.error('Erro ao conectar ou inicializar o Azure SQL Database:', error);
        // Em um aplicativo real, você pode querer tentar novamente ou lidar com o erro de forma mais robusta
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
        // Verifica se o pool de conexão está conectado
        if (!sqlPool || !sqlPool.connected) {
            return res.status(500).json({ message: 'Banco de dados não conectado ou pool indisponível.' });
        }
        const request = sqlPool.request();
        const q = "SELECT id, nome, qtde, valor FROM produtos"; // Query SQL Server
        const result = await request.query(q);
        return res.status(200).json(result.recordset); // Dados estão em .recordset para mssql
    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        return res.status(500).json({ message: 'Erro ao buscar produtos', error: err.message });
    }
});

// Rota para CRIAR um produto
app.post("/produtos", async (req, res) => {
    const { nome, qtde, valor } = req.body;
    // Validação básica de entrada
    if (!nome || qtde === undefined || valor === undefined) {
        return res.status(400).json({ message: 'Nome, quantidade e valor são obrigatórios.' });
    }

    try {
        if (!sqlPool || !sqlPool.connected) {
            return res.status(500).json({ message: 'Banco de dados não conectado ou pool indisponível.' });
        }
        const request = sqlPool.request();
        // Query SQL Server para inserção e retorno do ID gerado
        const q = "INSERT INTO produtos (nome, qtde, valor) VALUES (@nome, @qtde, @valor); SELECT SCOPE_IDENTITY() AS id;";

        // Usa .input() para evitar SQL Injection e garantir tipos corretos
        request.input('nome', sql.VarChar(255), nome);
        request.input('qtde', sql.Int, qtde);
        request.input('valor', sql.Decimal(10, 2), valor);

        const result = await request.query(q);
        // SCOPE_IDENTITY() retorna o ID do item inserido no SQL Server
        const newProductId = result.recordset[0].id;
        return res.status(201).json({ id: newProductId, nome, qtde, valor, message: "Produto criado com sucesso." });
    } catch (err) {
        console.error('Erro ao criar produto:', err);
        return res.status(500).json({ message: 'Erro ao criar produto', error: err.message });
    }
});

// Rota para ATUALIZAR (UPDATE) um produto
app.put("/produtos/:id", async (req, res) => {
    const productId = req.params.id;
    const { nome, qtde, valor } = req.body;
    // Validação básica de entrada
    if (!nome || qtde === undefined || valor === undefined) {
        return res.status(400).json({ message: 'Nome, quantidade e valor são obrigatórios para atualização.' });
    }

    try {
        if (!sqlPool || !sqlPool.connected) {
            return res.status(500).json({ message: 'Banco de dados não conectado ou pool indisponível.' });
        }
        const request = sqlPool.request();
        const q = "UPDATE produtos SET nome = @nome, qtde = @qtde, valor = @valor WHERE id = @id";

        request.input('nome', sql.VarChar(255), nome);
        request.input('qtde', sql.Int, qtde);
        request.input('valor', sql.Decimal(10, 2), valor);
        request.input('id', sql.Int, productId); // Passe o ID como parâmetro também

        const result = await request.query(q);
        // Verifica se alguma linha foi afetada para saber se o produto foi encontrado e atualizado
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        return res.status(200).json("Produto atualizado com sucesso.");
    } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        return res.status(500).json({ message: 'Erro ao atualizar produto', error: err.message });
    }
});

// Rota para DELETAR um produto
app.delete("/produtos/:id", async (req, res) => {
    const productId = req.params.id;
    try {
        if (!sqlPool || !sqlPool.connected) {
            return res.status(500).json({ message: 'Banco de dados não conectado ou pool indisponível.' });
        }
        const request = sqlPool.request();
        const q = "DELETE FROM produtos WHERE id = @id";

        request.input('id', sql.Int, productId); // Passe o ID como parâmetro

        const result = await request.query(q);
        // Verifica se alguma linha foi afetada para saber se o produto foi encontrado e deletado
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        return res.status(200).json("Produto deletado com sucesso.");
    } catch (err) {
        console.error('Erro ao deletar produto:', err);
        return res.status(500).json({ message: 'Erro ao deletar produto', error: err.message });
    }
});

// Inicia o servidor na porta (usando process.env.PORT para Azure App Service)
const PORT = process.env.PORT || 3000; // A porta 3000 é um bom padrão para desenvolvimento local. Azure usa a variável PORT.
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

process.on('SIGINT', async () => {
    console.log('Sinal SIGINT recebido. Fechando pool de conexão SQL...');
    if (sqlPool && sqlPool.connected) {
        await sqlPool.close();
    }
    process.exit(0);
});
