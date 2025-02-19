import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

let mongoServer;
let client;
let db;

//MongoDb
export async function startMongoServer() {
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbPath: path.resolve('db'),
        storageEngine: 'wiredTiger',
      },
    });

    const uri = mongoServer.getUri();

    client = new MongoClient(uri);
    await client.connect();
    db = client.db('agedap');

    console.log('MongoDB iniciado en:', uri);
  } catch (error) {
    console.error('Error al iniciar MongoDB:', error);
    throw error;
  }
}

export async function stopMongoServer() {
  await client.close();
  await mongoServer.stop();
  console.log('MongoDB detenido');
}

//Workspaces
export async function newWorkspace(type, name, description) {
  const id = uuidv4();
  const date = new Date();
  const workspace = {
    id,
    type: type,
    name: name,
    description: description,
    relayId: null,
    documents: [],
    createdAt: date,
    updatedAt: date,
  };

  const collection = db.collection('workspace');
  await collection.insertOne(workspace);
  return workspace;
}

export async function getAllWorkspaces() {
  const collection = db.collection('workspace');
  return await collection.find().toArray();
}

export async function getWorkspaces(page, limit) {
  const collection = db.collection('workspace');
  return await collection
    .find()
    .skip(page * limit)
    .limit(limit)
    .toArray();
}

export async function getWorkspace(workspaceId) {
  const collection = db.collection('workspace');
  return await collection.findOne({ id: workspaceId });
}

export async function deleteWorkspace(workspaceId) {
  const collection = db.collection('workspace');
  const chatCollection = db.collection('chat');
  await chatCollection.deleteMany({ workspaceId: workspaceId });
  await collection.deleteOne({ id: workspaceId });
}

//Chats
export async function newChat(workspaceId, name, description) {
  const id = uuidv4();
  const date = new Date();
  const chat = {
    id,
    workspaceId,
    name,
    description,
    messages: [],
    createdAt: date,
    updatedAt: date,
  };

  const collection = db.collection('chat');
  await collection.insertOne(chat);
  return chat;
}

export async function getAllChats() {
  const collection = db.collection('chat');
  return await collection.find().toArray();
}

export async function getChats(workspaceId) {
  const collection = db.collection('chat');
  return await collection.find({ workspaceId: workspaceId }).toArray();
}

export async function getChat(chatId) {
  const collection = db.collection('chat');
  return await collection.findOne({ id: chatId });
}

export async function deleteChat(chatId) {
  const collection = db.collection('chat');
  await collection.deleteOne({ id: chatId });
}

export async function addChatMessage(chatId, message, type) {
  const collection = db.collection('chat');

  const date = new Date();
  const messageId = uuidv4();
  const newMessage = {
    id: messageId,
    message: message,
    type: type,
    createAt: date,
    updatedAt: date,
  };

  const result = await collection.updateOne({ id: chatId }, { $push: { messages: newMessage } });
  if (result.matchedCount === 0) throw new Error('Chat no encontrado');
  return newMessage;
}

export async function deleteChatMessage(chatId, messageId) {
  const collection = db.collection('chat');

  const result = await collection.updateOne(
    { id: chatId },
    { $pull: { messages: { id: messageId } } }
  );
  if (result.matchedCount === 0) throw new Error('Chat no encontrado');
}

export async function editChatMessage(chatId, messageId, message, type) {
  const collection = db.collection('chat');

  const date = new Date();
  const result = await collection.updateOne(
    { id: chatId, 'messages.id': messageId },
    {
      $set: {
        'messages.$.message': message,
        'messages.$.type': type,
        'messages.$.updatedAt': date,
      },
    }
  );
  if (result.matchedCount === 0) throw new Error('Mensaje no encontrado');
}

export async function replaceChatMessages(chatId, newMessages) {
  const collection = db.collection('chat');
  const date = new Date();
  const validMessages = newMessages.map((msg) => ({
    id: msg.id || uuidv4(),
    message: msg.message,
    type: msg.type,
    createdAt: msg.createdAt || date,
    updatedAt: msg.updatedAt || date,
  }));

  const result = await collection.updateOne({ id: chatId }, { $set: { messages: validMessages } });
  if (result.matchedCount === 0) throw new Error('Chat no encontrado');
  return validMessages;
}
