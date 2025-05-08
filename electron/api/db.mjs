import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('db');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
}
//Config DB
const configDb = await JSONFilePreset(path.join(dbPath, 'config.json'), {});

export async function getConfig() {
  await configDb.read();
  return configDb.data;
}

export async function setConfig(config) {
  await configDb.read();
  await configDb.update((data) => {
    Object.keys(config).forEach((key) => {
      data[key] = config[key];
    });
  });
  return config;
}

export async function getConfigValue(key) {
  await configDb.read();
  return configDb.data[key];
}

export async function setConfigValue(key, value) {
  await configDb.read();
  await configDb.update((data) => {
    data[key] = value;
  });
  return value;
}

export async function deleteConfigValue(key) {
  await configDb.read();
  await configDb.update((data) => {
    delete data[key];
  });
  return key;
}

//Workspaces DB
const workspacesDb = await JSONFilePreset(path.join(dbPath, 'workspaces.json'), []);
const chatsDb = await JSONFilePreset(path.join(dbPath, 'chats.json'), []);

// Workspaces
export async function newWorkspace(type, name, description, documents, relayId) {
  const id = uuidv4();
  const date = new Date();
  const workspace = {
    id,
    type,
    name,
    description,
    relayId,
    documents,
    chatIds: [],
    lastTimestamp: 0,
    createdAt: date,
    updatedAt: date,
  };
  await workspacesDb.read();
  await workspacesDb.update((data) => data.push(workspace));
  return workspace;
}

export async function getAllWorkspaces() {
  await workspacesDb.read();
  return workspacesDb.data;
}

export async function getWorkspaces(page, limit) {
  page -= 1;
  if (page < 0) page = 0;
  await workspacesDb.read();
  return workspacesDb.data.slice(page * limit, (page + 1) * limit);
}

export async function getWorkspace(workspaceId) {
  await workspacesDb.read();
  return workspacesDb.data.find((w) => w.id === workspaceId);
}

export async function deleteWorkspace(workspaceId) {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) throw new Error('Workspace no encontrado');

  // Delete chats
  await chatsDb.read();
  chatsDb.data = chatsDb.data.filter((c) => c.workspaceId !== workspaceId);
  await chatsDb.write();

  await workspacesDb.read();
  workspacesDb.data = workspacesDb.data.filter((w) => w.id !== workspaceId);
  await workspacesDb.write();
  return workspace.id;
}

export async function editWorkspace(workspaceId, name, description, documents, relayId) {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) throw new Error('Workspace no encontrado');

  workspace.name = name;
  workspace.description = description;
  workspace.documents = documents;
  workspace.relayId = relayId;
  workspace.updatedAt = new Date();

  await workspacesDb.read();
  await workspacesDb.update((data) => {
    const workspaceIndex = data.findIndex((w) => w.id === workspaceId);
    data[workspaceIndex] = workspace;
  });
  return workspace;
}

export async function updateWorkspace(workspaceId) {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) throw new Error('Workspace no encontrado');

  const date = new Date();
  workspace.lastTimestamp = date;
  workspace.updatedAt = date;

  await workspacesDb.read();
  await workspacesDb.update((data) => {
    const workspaceIndex = data.findIndex((w) => w.id === workspaceId);
    data[workspaceIndex] = workspace;
  });
  return workspace;
}

// Chats
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
  // Update chat
  await chatsDb.read();
  await chatsDb.update((data) => data.push(chat));
  // Update workspace
  await workspacesDb.read();
  await workspacesDb.update((data) => {
    const workspaceIndex = data.findIndex((w) => w.id === workspaceId);
    data[workspaceIndex].chatIds.push(id);
  });
  return chat;
}

export async function getChats(workspaceId) {
  await chatsDb.read();
  const chats = chatsDb.data.filter((c) => c.workspaceId === workspaceId);
  chats.forEach((c) => delete c.messages);
  return chats;
}

export async function getChat(chatId) {
  await chatsDb.read();
  return chatsDb.data.find((c) => c.id === chatId);
}

export async function getChatMessages(chatId) {
  await chatsDb.read();
  const chat = chatsDb.data.find((c) => c.id === chatId);
  if (!chat) throw new Error('Chat no encontrado');
  return chat.messages || [];
}

export async function deleteChat(chatId) {
  const chat = await getChat(chatId);
  if (!chat) throw new Error('Chat no encontrado');

  // Update workspace
  await workspacesDb.read();
  workspacesDb.data = workspacesDb.data.map((w) => {
    w.chatIds = w.chatIds.filter((cId) => cId !== chatId);
    return w;
  });
  await workspacesDb.write();

  // Delete chat
  await chatsDb.read();
  chatsDb.data = chatsDb.data.filter((c) => c.id !== chatId);
  await chatsDb.write();
  return chatId;
}

export async function addChatMessage(chatId, message, type) {
  const chat = await getChat(chatId);
  if (!chat) throw new Error('Chat no encontrado');

  const messageId = uuidv4();
  const date = new Date();
  const newMessage = { id: messageId, message, type, createdAt: date, updatedAt: date };

  await chatsDb.read();
  await chatsDb.update((data) => {
    const chatIndex = data.findIndex((c) => c.id === chatId);
    data[chatIndex].messages.push(newMessage);
  });
  return newMessage;
}

export async function deleteChatMessage(chatId, messageId) {
  const chat = await getChat(chatId);
  if (!chat) throw new Error('Chat no encontrado');

  await chatsDb.read();
  await chatsDb.update((data) => {
    const chatIndex = data.findIndex((c) => c.id === chatId);
    data[chatIndex].messages = data[chatIndex].messages.filter((m) => m.id !== messageId);
  });
  return messageId;
}

export async function editChatMessage(chatId, messageId, message, type) {
  const chat = await getChat(chatId);
  if (!chat) throw new Error('Chat no encontrado');

  const msg = chat.messages.find((m) => m.id === messageId);
  if (!msg) throw new Error('Mensaje no encontrado');

  msg.message = message;
  msg.type = type;
  msg.updatedAt = new Date();

  await chatsDb.read();
  await chatsDb.update((data) => {
    const chatIndex = data.findIndex((c) => c.id === chatId);
    const msgIndex = data[chatIndex].messages.findIndex((m) => m.id === messageId);
    data[chatIndex].messages[msgIndex] = msg;
  });
  return msg;
}

export async function replaceChatMessages(chatId, newMessages) {
  const chat = await getChat(chatId);
  if (!chat) throw new Error('Chat no encontrado');

  await chatsDb.read();
  await chatsDb.update((data) => {
    const chatIndex = data.findIndex((c) => c.id === chatId);
    data[chatIndex].messages = newMessages;
  });
}
