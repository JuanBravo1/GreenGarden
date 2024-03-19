const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const mqtt = require("mqtt");


// Modulos utilizados

const app = express();
const port = 8080;
// Configuracion del puerto

// Configurar middleware para analizar el cuerpo de las solicitudes HTTP
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configurar CORS para permitir solicitudes desde cualquier origen
app.use(cors());

// URL de conexión a tu base de datos MongoDB Atlas
//"mongodb+srv://notjm:tqsjTGz5oWJlOdm2@eco-nido.dbwpny9.mongodb.net/?retryWrites=true&w=majority&appName=Eco-Nido"
// mongodb+srv://notjm:tqsjTGz5oWJlOdm2@eco-nido.dbwpny9.mongodb.net/?retryWrites=true&w=majority&appName=Eco-Nido
const mongoUrl = "mongodb+srv://greengarden:2MOdsHQX6cM8LDIO@greengarden.fjgd6uv.mongodb.net/?retryWrites=true&w=majority&appName=GreenGarden";

// Cliente MQTT
const mqttClient = mqtt.connect('mqtt://broker.emqx.io');


// Ruta para recibir datos desde la ESP32
app.post('/insertDevice', async (req, res) => {
  const data = req.body;

  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("GreenGarden");
    const deviceCollection = db.collection("device");
    const deviceHistoryCollection = db.collection("device_history");

    const { mac } = data;
    const existsDevice = await deviceCollection.findOne({ mac: mac });

    // Comprobación de dispositivo
    if (!existsDevice) {
      // Insertar los datos en la colección si no existe
      await deviceCollection.insertOne(data);
    } else {
      // Actualizar datos si ya existe el dispositivo
      await deviceCollection.updateOne({ mac: mac }, { $set: data });
    }

    // Historial de dispositivo
    await deviceHistoryCollection.insertOne(data);

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder a la ESP32 con un mensaje de confirmación
    res.send("Datos recibidos y guardados en la base de datos");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos," + error);
  }
});

app.post('/device/sensor', async (req, res) => {
  const data = req.body;
  try {
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexion exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y las colecciones
    const db = client.db("GreenGarden");
    const deviceCollection = db.collection("device");

    // Primero se comprueba si no existe el usuario
    const { mac } = data;
    const exists = await deviceCollection.findOne({ mac: mac });

    if (!exists) {
      res.status(404).send("No se encontro el dispositivo:" + mac);
    } else {
      res.json(exists);
    }

    client.close();
  } catch (error) {
    console.error("Error al conectar MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos:" + error);
  }
});

// Ruta para recibir datos de mi ecoWeb (Registro de usuarios)
app.post('/user', async (req, res) => {
  const data = req.body;
  let client; // Declarar la variable client fuera del bloque try para que pueda cerrarse en el bloque finally

  try {
    // Conectar a la base de datos MongoDBAtlas
    client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y las colecciones
    const db = client.db("GreenGarden");
    const userCollection = db.collection("users");

    // Comprobar si no existe el usuario
    const { username } = data;
    const exists = await userCollection.findOne({ username: username });

    if (!exists) {
      await userCollection.insertOne(data);
      res.send("Datos registrados satisfactoriamente");
    } else {
      res.send("Los datos enviados ya existen");
    }

    console.log("Datos recibidos del usuario");

  } catch (error) {
    console.error("Error al conectar MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos:" + error);
  } 
});
app.post('/user/login', async (req, res) => {
  const data = req.body;
  try {
    // Validacion de datos
    const { username, password } = data;
    if (!username || !password) {
      return res.status(400).send('Falta información de autenticación');
    }

    // Conectar a la base de datos MongoDBAtlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexion exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y las colecciones
    const db = client.db("GreenGarden");
    const userCollection = db.collection("users");

    const exists = await userCollection.findOne({ username: username, password: password });
    if (!exists) {
      res.status(401).json({ status: false });
    } else {
      const { permisos, dispositivo } = exists;
      res.status(200).json(exists);
      console.log(exists);
    }
    client.close();

  } catch (error) {
    console.error("Error al conectar MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
})

app.post('/admin/login', async (req, res) => {
  const data = req.body;
  try {
    // Validacion de datos
    const { username, password } = data;
    if (!username || !password) {
      return res.status(400).send('Falta información de autenticación');
    }

    // Conectar a la base de datos MongoDBAtlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexion exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y las colecciones
    const db = client.db("GreenGarden");
    const userCollection = db.collection("admin");

    const exists = await userCollection.findOne({ username: username, password: password });
    if (!exists) {
      res.status(401).json({ status: false });
    } else {
      const { permisos, dispositivo } = exists;
      res.status(200).json(exists);
      console.log(exists);
    }
    client.close();

  } catch (error) {
    console.error("Error al conectar MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
})

//peticion para obtener productos
app.get('/products', async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    const db = client.db("GreenGarden");
    const productsCollection = db.collection("productos");

    const products = await productsCollection.find({}).toArray();
    res.json(products);

    client.close();
  } catch (error) {
    console.error("Error al conectar MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.get('/devices', async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    const db = client.db("GreenGarden");
    const devicesCollection = db.collection("device");

    const devices = await devicesCollection.find({}).toArray();
    res.json(devices);

    client.close();
  } catch (error) {
    console.error("Error al conectar MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

// Asumiendo que esta ruta maneja la edición del perfil
app.post('/user/edit', async (req, res) => {
  const userData = req.body;
  // Extraer el _id del objeto userData
  const { _id, ...userDataWithoutId } = userData;
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("GreenGarden");
    const userCollection = db.collection("users");

    // Convertir el _id a ObjectId
    const userId = new ObjectId(_id);

    // Actualizar el perfil del usuario en la base de datos usando el _id
    await userCollection.updateOne({ _id: userId }, { $set: userDataWithoutId });

    // Cerrar la conexión
    client.close();
    console.log("Perfil de usuario actualizado");

    // Responder con un mensaje de éxito
    res.send("Perfil actualizado exitosamente");
  } catch (error) {
    console.error("Error al actualizar el perfil del usuario:", error);
    res.status(500).send("Error al actualizar el perfil del usuario");
  }
});

// Ruta para obtener un usuario por su ID
app.get('/user/:username', async (req, res) => {
  const userName = req.params.username;
   

  try {
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    const db = client.db("GreenGarden");
    const userCollection = db.collection("users");

    const user = await userCollection.findOne({ username: userName });

    if (!user) {
      res.status(404).send("Usuario no encontrado");
    } else {
      res.json(user);
    }

    client.close();
  } catch (error) {
    console.error("Error al conectar MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.get('/usuarios', async (req, res) => {
  console.log("entrepareverusaurios");
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("GreenGarden");
    const collection = db.collection("users");

    // Realizar la consulta a la colección de usuarios
    const usuarios = await collection.find({}).toArray();

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");

    // Responder con los resultados de la consulta
    res.json(usuarios);
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.delete('/delete/:id', async (req, res) => {
  const userId = req.params.id; // Obtener el ID del usuario a eliminar desde los parámetros de la solicitud
  console.log(userId);
  try {
    // Conectar a la base de datos MongoDB Atlas
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Conexión exitosa a MongoDB Atlas");

    // Obtener una referencia a la base de datos y la colección
    const db = client.db("GreenGarden");
    const collection = db.collection("users");

    // Realizar la eliminación del usuario en la colección
    const result = await collection.deleteOne({ _id: new ObjectId(userId) });  // Suponiendo que el ID del usuario sea único

    // Verificar si se eliminó el usuario correctamente
    if (result.deletedCount === 1) {
      console.log("Usuario eliminado correctamente.");
      res.status(200).send("Usuario eliminado correctamente.");
    } else {
      console.log("El usuario no pudo ser encontrado o eliminado.");
      res.status(404).send("El usuario no pudo ser encontrado o eliminado.");
    }

    // Cerrar la conexión
    client.close();
    console.log("Conexión cerrada");
  } catch (error) {
    console.error("Error al conectar a MongoDB Atlas:", error);
    res.status(500).send("Error al conectar a la base de datos");
  }
});

app.put('/editar/:id', async (req, res) => {
 const userId = req.params.id; // Obtener el ID del usuario a editar desde los parámetros de la solicitud
 const userData = req.body; // Obtener los datos del usuario a editar desde el cuerpo de la solicitud
 const { _id, ...userDataWithoutId } = userData; // Elimina el campo _id del objeto userData

try {
  // Conectar a la base de datos MongoDB Atlas
  const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Conexión exitosa a MongoDB Atlas");

  // Obtener una referencia a la base de datos y la colección
  const db = client.db("GreenGarden");
  const collection = db.collection("users");

  // Realizar la actualización del usuario en la colección
  const result = await collection.updateOne({ _id: new ObjectId(userId) }, { $set: userDataWithoutId });

  // Verificar si se actualizó el usuario correctamente
  if (result.modifiedCount === 1) {
    console.log("Usuario actualizado correctamente.");
    res.status(200).send("Usuario actualizado correctamente.");
  } else {
    console.log("El usuario no pudo ser encontrado o actualizado.");
    res.status(404).send("El usuario no pudo ser encontrado o actualizado.");
  }

  // Cerrar la conexión
  client.close();
  console.log("Conexión cerrada");
} catch (error) {
  console.error("Error al conectar a MongoDB Atlas:", error);
  res.status(500).send("Error al conectar a la base de datos");
}

});



// Manejo MQTT peticiones
const listen = (state) => {
  mqttClient.publish('CATHY', state);
  console.log(`Mensaje "${state}" enviado al topic "CATHY" satisfactoriamente`);
};

// Manejo MQTT POST
app.post('/mqtt', (req, res) => {
  console.log('Body:', req.body);

  const { state } = req.body;
  if (!state || !['OPEN', 'CLOSE', 'ON', 'OFF'].includes(state)) {
    return res.status(400).send('Parámetros inválidos');
  }
  
  mqttClient.publish('CATHY', state);
  console.log(`Mensaje "${state}" enviado al topic "CATHY" satisfactoriamente`);
  res.status(200).send(state);
});


// Manejar errores 404 para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).send("Ruta no encontrada");
});

// Manejar errores 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Error del servidor');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor Node.js escuchando en http://localhost:${port}`);
});
