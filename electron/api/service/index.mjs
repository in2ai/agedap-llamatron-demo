import { finalizeEvent, getPublicKey } from 'nostr-tools';
import { workOffersService } from './workOffers/service.mjs';
import { Relay } from 'nostr-tools/relay';
import {
  addChatMessage,
  deleteChatMessages,
  getChats,
  getConfig,
  updateChatLastTimestamp,
} from '../db.mjs';
import { Notification } from 'electron';

let chatController = {
  started: false,
  chat: null,
  workspace: null,
  event: null,
  interval: null,
  relay: null,
  sub: null,
  sk: null,
  pk: null,
};
let mainEvent = null;

const subscribeToOnlineChat = (chat) => {
  return new Promise(async (resolve, reject) => {
    try {
      const isCurrentChat = chatController.chat && chatController.chat.id === chat.id;

      if (isCurrentChat) {
        if (chatController.sub) chatController.sub.close();
        if (chatController.relay) chatController.relay.close();
      }

      let timestamp = 0;
      let totalMessages = 0;
      let lastMessage = null;

      const relay = await Relay.connect(chat.relay);

      if (isCurrentChat) {
        chatController.relay = relay;
      } else {
        if (chat.lastTimestamp) {
          timestamp = new Date(chat.lastTimestamp).getTime() / 1000;
          timestamp = Math.floor(timestamp);
          if (timestamp.toString().length > 10) {
            timestamp = parseInt(timestamp.toString().slice(0, 10));
          }
        }
      }

      const sub = relay.subscribe(
        [
          {
            kinds: [1],
            '#t': [chat.id],
            since: timestamp + 1,
          },
        ],
        {
          onevent: async (event) => {
            const { content, pubkey, created_at } = event;
            let type = pubkey === chatController.pk ? 'user' : 'external';
            lastMessage = {
              pubkey,
              message: content,
              type,
              createdAt: created_at * 1000,
            };

            console.log('Event:', lastMessage);
            totalMessages += 1;

            if (isCurrentChat) sendMessage(lastMessage);
          },
          oneose: async () => {
            console.log('Event:', 'oneose');
            if (!isCurrentChat) {
              sendDesktopNotification(chat, totalMessages, lastMessage);
              await updateChatLastTimestamp(chat.id, totalMessages);
              sub.close();
            }
            resolve(); // Promesa resuelta cuando se recibe el 'oneose'
          },
        }
      );

      if (isCurrentChat) chatController.sub = sub;
    } catch (error) {
      reject(error); // Rechaza la promesa si hay errores
    }
  });
};

export async function startChatService(event, chat) {
  if (chatController.started) return;

  const config = await getConfig();
  let pk = '';
  let sk = '';
  if (config.secretKey) {
    console.log('Secret key: ', config.secretKey);
    sk = new Uint8Array(Buffer.from(config.secretKey, 'base64'));
    pk = getPublicKey(sk);
  }

  chatController = {
    started: true,
    chat: chat,
    event: event,
    interval: null,
    sk: config.secretKey,
    pk,
  };

  if (chat && chat.type && chat.type === 'plugin' && chat.plugin) {
    switch (chat.plugin) {
      case 'workOffers': {
        const timer = await workOffersService(chatController);
        chatController.interval = timer;
        break;
      }
    }
  }
  if (chat && chat.type === 'online') {
    await deleteChatMessages(chat.id);
    subscribeToOnlineChat(chat);
  }
}

export async function stopChatService() {
  if (chatController.interval) clearInterval(chatController.interval);
  if (chatController.sub) {
    console.log('Closing subscription...');
    chatController.sub.close();
  }
  if (chatController.relay) {
    console.log('Closing relay connection...');
    chatController.relay.close();
  }

  chatController = {
    started: false,
    chat: null,
    workspace: null,
    event: null,
    interval: null,
  };
}

export async function onNewUserMessage(event, message) {
  const { chat } = chatController;
  if (!chat) {
    console.error('Chat not found or does not match the current chat.');
    return;
  }

  if (chat.type === 'online') {
    newOnlineMessage(message);
    return false;
  }
}

async function sendMessage(message) {
  //console.log('Sending message:', message.message);
  const { chat, event } = chatController;
  chatController.chat.messages.push(message);
  event.sender.send('onNewExternalMessage', {
    func: 'onNewExternalMessage',
    chatId: chat.id,
    content: message.message,
    type: message.type,
  });
}

async function newOnlineMessage(message) {
  await insertRecordIfNotExists();
  const eventTemplate = {
    kind: 1,
    tags: [['t', chatController.chat.id]],
    content: message,
    created_at: Math.floor(Date.now() / 1000),
  };
  console.log('Event:', eventTemplate);
  const sk = new Uint8Array(Buffer.from(chatController.sk, 'base64'));
  const signedEvent = finalizeEvent(eventTemplate, sk);
  //const relay = await Relay.connect(this.onlineChat.relay);
  await chatController.relay.publish(signedEvent);
  //relay.close();
}

async function insertRecordIfNotExists() {
  if (chatController.chat.messages.length === 0) {
    console.log('No messages found, inserting record...');
    const eventTemplate = {
      kind: 3,
      tags: [
        ['p', chatController.chat.authors[0]],
        ['p', chatController.chat.authors[1]],
        ['t', chatController.chat.id],
      ],
      content: '',
      created_at: Math.floor(Date.now() / 1000),
    };
    console.log('Event record:', eventTemplate);
    const sk = new Uint8Array(Buffer.from(chatController.sk, 'base64'));
    const signedEvent = finalizeEvent(eventTemplate, sk);
    await chatController.relay.publish(signedEvent);
    console.log('Event published record:', signedEvent);
  }
}

export async function startBackgroundChatUpdate(event, onUpdated = null) {
  console.log('Starting background chat update...');
  mainEvent = event;
  setInterval(backgroundChatUpdate, 10000, onUpdated);
}

async function backgroundChatUpdate(onUpdated) {
  console.log('Background chat update...');
  const currentChatId = chatController.chat ? chatController.chat.id : null;
  const chats = await getChats();
  for (const chat of chats) {
    if (chat.id === currentChatId) break;
    if (chat.type === 'online') {
      console.log('Updating online chat:', chat.id);
      //chatController.chat = chat;
      await subscribeToOnlineChat(chat);
    } else if (chat.type === 'plugin' && chat.plugin === 'workOffers') {
      //console.log('Updating work offers chat:', chat.id);
      //workOffersService(chatController);
    }
  }

  if (onUpdated) {
    onUpdated();
  }
}

async function sendDesktopNotification(chat, totalMessages, lastMessage) {
  let NOTIFICATION_TITLE = 'Nuevo mensaje recibido en ' + chat.name;
  let NOTIFICATION_BODY = '';
  if (totalMessages > 1) {
    NOTIFICATION_BODY = `Tienes ${totalMessages} mensajes nuevos.`;
  } else if (totalMessages === 1) {
    NOTIFICATION_BODY = `${lastMessage.message}`;
  }

  if (totalMessages > 0) {
    const notification = new Notification({
      title: NOTIFICATION_TITLE,
      body: NOTIFICATION_BODY,
    });
    notification.show();
    notification.on('click', () => {
      console.log('Notification clicked');
      mainEvent.sender.send('onNotificationClicked', {
        func: 'onNotificationClicked',
        type: 'chat',
        chatId: chat.id,
      });
    });
  }
}
