import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import path from "path";

let mongoServer;
let client;
let db;

export async function startMongoServer() {
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath: path.resolve("db"),
        storageEngine: "wiredTiger",
      },
    });

    const uri = mongoServer.getUri();

    client = new MongoClient(uri);
    await client.connect();
    db = client.db("agedap");

    console.log("MongoDB iniciado en:", uri);
  } catch (error) {
    console.error("Error al iniciar MongoDB:", error);
    throw error;
  }
}

export async function newWorkspace(type, name, description) {
  const id = uuidv4();
  const workspace = {
    id,
    type: type,
    name: name,
    description: description,
    relayId: null,
    documents: [],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const collection = db.collection("workspace");
  await collection.insertOne(workspace);

  return workspace;
}

export async function getWorkspaces(page, limit) {
  const collection = db.collection("workspace");
  return await collection.find().skip(page * limit).limit(limit).toArray();
}

export async function getWorkspace(id) {
  const collection = db.collection("workspace");
  return await collection.findOne({ id: id });
}

export async function deleteWorkspace(id) {
  const collection = db.collection("workspace");
  await collection.deleteOne({ id: id });
}

export async function addMessageToWorkspace(id, message, type) {
  const collection = db.collection("workspace");

  const messageId = uuidv4();
  const newMessage = {
    id: messageId,
    message: message,
    type: type,
    createAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.updateOne(
    { id: id },
    { $push: { messages: newMessage } }
  );

  if (result.matchedCount === 0) {
    throw new Error("Workspace no encontrado");
  }

  return newMessage;
}

export async function replaceMessages(id, newMessages) {
  const collection = db.collection("workspace");

  const validMessages = newMessages.map((msg) => ({
    id: msg.id,
    message: msg.message,
    type: msg.type,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt
  }));

  const result = await collection.updateOne(
    { id: id },
    {
      $set: { messages: validMessages },
    }
  );

  if (result.matchedCount === 0) {
    throw new Error("Workspace no encontrado");
  }

  return validMessages;
}

export async function stopMongoServer() {
  await client.close();
  await mongoServer.stop();
  console.log("MongoDB detenido");
}
