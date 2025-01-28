import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import path from "path";

let mongoServer;
let client;
let db;

// Función para iniciar MongoDB automáticamente
export async function startMongoServer() {
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath: path.resolve("db"), // Carpeta donde se guardará la base de datos
        storageEngine: "wiredTiger", // Motor de almacenamiento persistente
      },
    });

    const uri = mongoServer.getUri();

    client = new MongoClient(uri);
    await client.connect();
    db = client.db("chatDB");

    console.log("MongoDB iniciado en:", uri);
  } catch (error) {
    console.error("Error al iniciar MongoDB:", error);
    throw error;
  }
}

// Función para crear un nuevo chat
export async function newChat(type) {
  const id = uuidv4();
  const chat = { id, type, messages: [], date: new Date() };

  const chatsCollection = db.collection("chats");
  await chatsCollection.insertOne(chat);

  return id;
}

// Función para añadir un mensaje a un chat existente
export async function updateChat(id, message) {
  const chatsCollection = db.collection("chats");

  const result = await chatsCollection.updateOne(
    { id },
    {
      $push: { messages: { message, date: new Date() } },
    }
  );

  if (result.matchedCount === 0) {
    throw new Error("Chat no encontrado");
  }
}

// Función para obtener un chat
export async function getChat(id) {
  const chatsCollection = db.collection("chats");
  return await chatsCollection.findOne({ id });
}

// Función para eliminar un chat
export async function deleteChat(id) {
  const chatsCollection = db.collection("chats");
  await chatsCollection.deleteOne({ id });
}

// Cierra MongoDB al terminar
export async function stopMongoServer() {
  await client.close();
  await mongoServer.stop();
  console.log("MongoDB detenido");
}
