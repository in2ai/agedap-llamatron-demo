import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('db');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
}

//Online chats DB
const onlineChatsDb = await JSONFilePreset(path.join(dbPath, 'onlineChats.json'), []);

export async function getOnlineChats() {
  await onlineChatsDb.read();
  return onlineChatsDb.data;
}

export async function getOnlineChat(id) {
  await onlineChatsDb.read();
  const chat = onlineChatsDb.data.find((c) => c.id === id);
  if (!chat) throw new Error('Chat no encontrado');
  return chat;
}

export async function onlineChatExists(relay, authors) {
  await onlineChatsDb.read();
  const chat = onlineChatsDb.data.find(
    (c) =>
      c.relay === relay &&
      c.authors.length === authors.length &&
      c.authors.every((a) => authors.includes(a))
  );
  return chat;
}

export async function newOnlineChat(relay, authors) {
  const id = uuidv4();
  const date = new Date();
  const onlineChat = {
    id,
    authors,
    relay,
    createdAt: date,
    updatedAt: date,
  };
  await onlineChatsDb.read();
  await onlineChatsDb.update((data) => data.push(onlineChat));
  return onlineChat;
}

export async function deleteOnlineChat(id) {
  await onlineChatsDb.read();
  const chatIndex = onlineChatsDb.data.findIndex((c) => c.id === id);
  if (chatIndex === -1) throw new Error('Chat no encontrado');

  const deletedChat = onlineChatsDb.data[chatIndex];
  onlineChatsDb.data.splice(chatIndex, 1);
  await onlineChatsDb.write();

  return deletedChat;
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

// Chats
const chatsDb = await JSONFilePreset(path.join(dbPath, 'chats.json'), []);
export async function newChat(
  name,
  description,
  type = null,
  plugin = null,
  documents = null,
  authors = null,
  relay = null
) {
  const id = uuidv4();
  const date = new Date();
  const chat = {
    id,
    name,
    description,
    type,
    plugin,
    documents,
    authors,
    relay,
    messages: [],
    createdAt: date,
    updatedAt: date,
    lastTimestamp: 0,
  };
  // Update chat
  await chatsDb.read();
  await chatsDb.update((data) => data.push(chat));
  return chat;
}

export async function updateChatLastTimestamp(
  chatId,
  newUnreadMessages = null,
  unreadMessages = null
) {
  const chat = await getChat(chatId);
  if (!chat) throw new Error('Chat no encontrado');

  const timestamp = new Date().getTime();
  chat.lastTimestamp = timestamp;
  chat.updatedAt = new Date();
  await chatsDb.read();
  await chatsDb.update((data) => {
    const chatIndex = data.findIndex((c) => c.id === chatId);
    if (chatIndex === -1) throw new Error('Chat no encontrado');
    data[chatIndex].lastTimestamp = timestamp;
    if (typeof newUnreadMessages === 'number') {
      let totalUnreadMessages = data[chatIndex].unreadMessages || 0;
      data[chatIndex].unreadMessages = totalUnreadMessages + newUnreadMessages;
    }
    if (typeof unreadMessages === 'number') {
      data[chatIndex].unreadMessages = unreadMessages;
    }

    data[chatIndex].updatedAt = chat.updatedAt;
  });
  return chat;
}

export async function getChats() {
  await chatsDb.read();
  const chats = chatsDb.data;
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

export async function deleteChatMessages(chatId) {
  const chat = await getChat(chatId);
  if (!chat) throw new Error('Chat no encontrado');

  await chatsDb.read();
  await chatsDb.update((data) => {
    const chatIndex = data.findIndex((c) => c.id === chatId);
    data[chatIndex].messages = [];
  });
  return chatId;
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
