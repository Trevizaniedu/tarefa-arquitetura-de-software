const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Conexão via IP direto com Tenant Identifier no usuário para o Supabase
const pool = new Pool({
  host: '52.45.94.125',
  port: 5432,
  user: 'postgres.tygktqyfujqkxczwqwxs', // Inclui o tenant ID para o Supabase reconhecer o projeto
  password: 'trevizani321',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
});

// Teste de conexão ao iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar no banco Supabase:', err.message);
  } else {
    console.log('Conexão com o Supabase realizada com sucesso!');
    release();
  }
});

// ==================== ROTAS DE CATEGORIAS ====================

// 1. Criar Categoria (POST)
app.post('/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro no POST /categories:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. Listar Categorias com Produtos (GET)
app.get('/categories', async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.name, 
             COALESCE(json_agg(p.*) FILTER (WHERE p.id IS NOT NULL), '[]') AS products
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.id ASC;
    `;
    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro no GET /categories:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Atualizar Categoria (PUT)
app.put('/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'O novo nome da categoria é obrigatório.' });
  }

  try {
    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro no PUT /categories:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. Deletar Categoria (DELETE)
app.delete('/categories/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    return res.json({ message: 'Categoria removida com sucesso.', category: result.rows[0] });
  } catch (error) {
    console.error('Erro no DELETE /categories:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== ROTAS DE PRODUTOS ====================

// 1. Criar Produto (POST)
app.post('/products', async (req, res) => {
  const { name, price, quantity, category_id } = req.body;

  if (!name || price == null || quantity == null || !category_id) {
    return res.status(400).json({ error: 'Todos os campos (name, price, quantity, category_id) são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO products (name, price, quantity, category_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, quantity, category_id]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro no POST /products:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 2. Listar Produtos com Categoria (GET)
app.get('/products', async (req, res) => {
  try {
    const query = `
      SELECT p.*, c.name AS category_name 
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.id ASC;
    `;
    const result = await pool.query(query);
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro no GET /products:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Atualizar Produto (PUT)
app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, quantity, category_id } = req.body;

  if (!name || price == null || quantity == null || !category_id) {
    return res.status(400).json({ error: 'Todos os campos (name, price, quantity, category_id) são obrigatórios.' });
  }

  try {
    const result = await pool.query(
      `UPDATE products 
       SET name = $1, price = $2, quantity = $3, category_id = $4 
       WHERE id = $5 
       RETURNING *`,
      [name, price, quantity, category_id, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro no PUT /products:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 4. Deletar Produto (DELETE)
app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    return res.json({ message: 'Produto removido com sucesso.', product: result.rows[0] });
  } catch (error) {
    console.error('Erro no DELETE /products:', error);
    return res.status(500).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});