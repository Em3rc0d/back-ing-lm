require('dotenv').config(); // Cargar las variables de entorno desde el archivo .env

const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
//functional
// Utilizar la URI de conexión de las variables de entorno
const uri = process.env.MONGODB_URI;

// Crear el cliente de MongoDB
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para manejar JSON
app.use(express.json());

let contacts;

// Conectar al cliente de MongoDB y mantener la conexión abierta
async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db('contactLM');
    contacts = database.collection('contacts');
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error);
  }
}

// Endpoint para obtener todos los contactos
app.get('/api/contacts', async (req, res) => {
  try {
    const cursor = contacts.find();
    const contactsList = await cursor.toArray();
    res.json(contactsList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los contactos' });
  }
});

// Endpoint para obtener un contacto por su ID
app.get('/api/test', (req, res) => {
  res.send('funcional');
})

// Endpoint de prueba
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Endpoint para manejar el envío del formulario
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Validación de los datos de entrada
  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Correo electrónico no válido' });
  }
  if (typeof phone !== 'string' || phone.trim().length === 0) {
    return res.status(400).json({ error: 'Teléfono no válido' });
  }

  try {
    const contact = { name, email, phone, message };
    const result = await contacts.insertOne(contact);

    res.status(201).json({
      message: 'Contacto guardado exitosamente',
      contactId: result.insertedId,
    });
  } catch (error) {
    console.error('Error al guardar el contacto:', error); // Para seguimiento, registra el error detallado
    res.status(500).json({ error: 'Error al guardar el contacto' });
  }
});


// Iniciar el servidor y conectar a la base de datos
app.listen(PORT, async () => {
  await connectToDatabase();
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Cerrar el cliente de MongoDB al apagar el servidor
process.on('SIGINT', async () => {
  await client.close();
  console.log('Desconectado de MongoDB');
  process.exit(0);
});