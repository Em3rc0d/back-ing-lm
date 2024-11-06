require('dotenv').config(); // Cargar variables de entorno
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors'); // Importar CORS
const app = express();

app.use(express.json());

const allowedOrigins = ['https://luis-merino.vercel.app', 'http://localhost:4200'];

// Configuración de CORS para permitir solicitudes desde los dominios especificados
app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await client.connect();
    cachedDb = client.db('contactLM');
    return cachedDb;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    throw new Error('Database connection error');
  }
}

// Ruta para obtener los contactos
app.get('/api/contacts', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const contacts = db.collection('contacts');
    const contactsList = await contacts.find().toArray();
    res.json(contactsList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los contactos' });
  }
});

// Ruta para guardar un nuevo contacto
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const db = await connectToDatabase();
    const contacts = db.collection('contacts');
    const result = await contacts.insertOne({ name, email, phone, message });
    res.status(201).json({ message: 'Contacto guardado exitosamente', contactId: result.insertedId });
  } catch (error) {
    console.error('Error al guardar el contacto:', error);
    res.status(500).json({ error: 'Error al guardar el contacto' });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
