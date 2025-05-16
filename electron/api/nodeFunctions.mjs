import { ipcMain } from 'electron';
import { dialog } from 'electron';
import { app, changePromptTemplate, loadModel, configuration } from './langchain.mjs';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  addChatMessage,
  deleteChat,
  deleteConfigValue,
  deleteWorkspace,
  getChat,
  getChatMessages,
  getChats,
  getConfig,
  getConfigValue,
  getOnlineChat,
  getOnlineChats,
  getWorkspace,
  getWorkspaces,
  newChat,
  newOnlineChat,
  newWorkspace,
  onlineChatExists,
  setConfig,
  setConfigValue,
} from './db.mjs';
import { RELAY_LIST } from './relays.mjs';
import { startChatService, stopChatService } from './service/index.mjs';
import { generateSecretKey, getPublicKey } from 'nostr-tools';
const controllers = new Map();

export function handleRunNodeCode() {
  ipcMain.on('runNodeCode', async (event, data) => {
    const { func } = data;

    // TODO group related funciontions in external modules
    // and here just call the functions
    switch (func) {
      //App
      case 'test': {
        event.sender.send('onNodeCodeResponse_test', {
          func: 'test',
          message: 'Función test ejecutada',
        });
        break;
      }
      case 'state': {
        let state = { modelPath: null, configuration: null };
        if (configuration) {
          state = {
            modelPath: configuration.modelPath,
            configuration: configuration,
          };
        }
        event.sender.send('onNodeCodeResponse_state', {
          func: 'state',
          ...state,
        });
        break;
      }

      //Online chats
      case 'getOnlineChats': {
        const onlineChats = await getOnlineChats();
        event.sender.send('onNodeCodeResponse_getOnlineChats', {
          func: 'getOnlineChats',
          onlineChats,
        });
        break;
      }
      case 'getOnlineChat': {
        const { onlineChatId } = data;
        const onlineChat = await getOnlineChat(onlineChatId);
        event.sender.send('onNodeCodeResponse_getOnlineChat', {
          func: 'getOnlineChat',
          onlineChat,
        });
        break;
      }
      case 'newOnlineChat': {
        const { relay, authors } = data;
        let onlineChat = await onlineChatExists(relay, authors);
        if (!onlineChat) onlineChat = await newOnlineChat(relay, authors);
        event.sender.send('onNodeCodeResponse_newOnlineChat', {
          func: 'newOnlineChat',
          onlineChat,
        });
        break;
      }

      //Config
      case 'getConfig': {
        const config = await getConfig();
        if (config.secretKey) {
          console.log('Secret key: ', config.secretKey);
          const sk = new Uint8Array(Buffer.from(config.secretKey, 'base64'));
          const publicKey = getPublicKey(sk);
          console.log('Public key: ', publicKey);
          config.publicKey = publicKey;
        }
        event.sender.send('onNodeCodeResponse_getConfig', {
          func: 'getConfig',
          config,
        });
        break;
      }
      case 'setConfig': {
        const config = await setConfig(data);
        event.sender.send('onNodeCodeResponse_setConfig', {
          func: 'setConfig',
          config: config,
        });
        break;
      }
      case 'getConfigValue': {
        const { key } = data;
        const value = await getConfigValue(key);
        event.sender.send('onNodeCodeResponse_getConfigValue', {
          func: 'getConfigValue',
          value,
        });
        break;
      }
      case 'setConfigValue': {
        const { key, value } = data;
        const config = await setConfigValue(key, value);
        event.sender.send('onNodeCodeResponse_setConfigValue', {
          func: 'setConfigValue',
          config: config,
        });
        break;
      }
      case 'deleteConfigValue': {
        const { key } = data;
        const deletedKey = await deleteConfigValue(key);
        event.sender.send('onNodeCodeResponse_deleteConfigValue', {
          func: 'deleteConfigValue',
          key: deletedKey,
        });
        break;
      }
      case 'genSecretKey': {
        const sk = generateSecretKey();
        const secretKey = Buffer.from(sk).toString('base64');
        const pk = getPublicKey(sk);

        setConfigValue('secretKey', secretKey);
        event.sender.send('onNodeCodeResponse_genSecretKey', {
          func: 'genSecretKey',
          secretKey: secretKey,
          publicKey: pk,
        });
        break;
      }

      //Selección de archivos
      // TODO: separate in two:
      // - select file (already exists)
      // - load model
      case 'selectModel': {
        const { config } = data;
        let configuration = undefined;
        if (config) {
          configuration = JSON.parse(config, (key, value) => (value === null ? undefined : value));
        }
        const dialogResult = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{ name: 'Modelo', extensions: ['gguf'] }],
        });
        const { filePaths } = dialogResult;

        if (filePaths.length > 0) {
          const modelPath = filePaths[0];
          let modelName = modelPath;
          modelName = modelName.split('\\').pop() || '';
          modelName = modelName.split('/').pop() || '';

          configuration.modelPath = modelPath;
          await loadModel(configuration);
          event.sender.send('onNodeCodeResponse_selectModel', {
            func: 'selectModel',
            modelName,
            modelPath,
          });
        }
        break;
      }
      case 'selectFile': {
        const { name, extensions } = data;
        const dialogResult = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{ name, extensions }],
        });
        const { filePaths } = dialogResult;

        event.sender.send('onNodeCodeResponse_selectFile', {
          func: 'selectFile',
          filePaths,
        });
        break;
      }

      //Relays
      case 'getRelays': {
        event.sender.send('onNodeCodeResponse_getRelays', {
          func: 'getRelays',
          relays: RELAY_LIST,
        });
        break;
      }

      //Workspaces
      case 'newWorkspace': {
        const { type, name, description, documents, relayId } = data;
        const workspace = await newWorkspace(type, name, description, documents, relayId);
        event.sender.send('onNodeCodeResponse_newWorkspace', {
          func: 'newWorkspace',
          workspace,
        });
        break;
      }
      case 'getWorkspaces': {
        const { page, limit } = data;
        const workspaces = await getWorkspaces(page, limit);
        event.sender.send('onNodeCodeResponse_getWorkspaces', {
          func: 'getWorkspaces',
          workspaces,
        });
        break;
      }
      case 'getWorkspace': {
        const { workspaceId } = data;
        const workspace = await getWorkspace(workspaceId);
        event.sender.send('onNodeCodeResponse_getWorkspace', {
          func: 'getWorkspace',
          workspace,
        });
        break;
      }
      case 'deleteWorkspace': {
        const { workspaceId } = data;
        await deleteWorkspace(workspaceId);
        event.sender.send('onNodeCodeResponse_deleteWorkspace', {
          func: 'deleteWorkspace',
          workspaceId,
        });
        break;
      }

      //Chats
      case 'newChat': {
        const { workspaceId, name, description } = data;
        const chat = await newChat(workspaceId, name, description);
        event.sender.send('onNodeCodeResponse_newChat', {
          func: 'newChat',
          chat,
        });
        break;
      }
      case 'getChats': {
        const { workspaceId } = data;
        const chats = await getChats(workspaceId);
        event.sender.send('onNodeCodeResponse_getChats', {
          func: 'getChats',
          chats,
        });
        break;
      }
      case 'getChat': {
        const { chatId } = data;
        const chat = await getChat(chatId);
        event.sender.send('onNodeCodeResponse_getChat', {
          func: 'getChat',
          chat,
        });
        break;
      }
      case 'deleteChat': {
        const { chatId } = data;
        await deleteChat(chatId);
        event.sender.send('onNodeCodeResponse_deleteChat', {
          func: 'deleteChat',
          chatId,
        });
        break;
      }

      //Chat IA
      case 'loadChat': {
        const { chatId } = data;
        const chat = await getChat(chatId);
        const workspace = await getWorkspace(chat.workspaceId);
        switch (workspace.type) {
          case 'workOffers': {
            changePromptTemplate(
              'Eres un asistente de ofertas de trabajo. El usuario te va mandar los datos de su curriculum y las ofertas de trabajo disponibles que ya se han filtrado por su perfil y deberían ser de su interés.'
            );
            break;
          }
          default: {
            changePromptTemplate('Eres un asistente amable. Responde siempre de manera concisa.');
            break;
          }
        }

        const loadedMessages = chat.messages || [];

        event.sender.send('onNodeCodeResponse_loadChat', {
          func: 'loadChat',
          chatId,
          messages: loadedMessages,
        });

        startChatService(event, chat);
        break;
      }

      case 'unloadChat': {
        const { chatId } = data;
        stopChatService();
        event.sender.send('onNodeCodeResponse_unloadChat', {
          func: 'unloadChat',
          chatId,
        });
        break;
      }

      case 'sendMessage': {
        const { chatId, message } = data;
        let chatMessages = await getChatMessages(chatId);
        const chatHistory = [];
        chatMessages.forEach((msg) => {
          if (msg.type === 'user' || msg.type === 'external') {
            chatHistory.push(new HumanMessage(msg.message));
          } else if (msg.type === 'model') {
            chatHistory.push(new AIMessage(msg.message));
          } else {
            chatHistory.push(new SystemMessage(msg.message));
          }
        });

        await addChatMessage(chatId, message, 'user');
        const input = {
          messages: [...chatHistory, new HumanMessage(message)],
        };

        const controller = new AbortController();
        controllers.set(chatId, controller);
        let newMessage = '';
        const config = {
          configurable: { thread_id: chatId },
          signal: controller.signal,
          callbacks: [
            {
              handleCustomEvent(eventName, data, runId) {
                if (eventName === 'onTextChunk' && controller.signal.aborted === false) {
                  newMessage += data;
                  event.sender.send('onPartialMessageResponse', {
                    func: 'onPartialMessageResponse',
                    chatId: chatId,
                    content: newMessage,
                  });
                }
              },
            },
          ],
        };

        const response = await app.invoke(input, config);
        const responseMessage = response.messages[response.messages.length - 1].content;

        await addChatMessage(chatId, responseMessage, 'model');

        event.sender.send('onNodeCodeResponse_sendMessage', {
          func: 'sendMessage',
          chatId,
          content: responseMessage,
        });
        break;
      }
      case 'stopGeneratingResponse': {
        try {
          const { chatId } = data;
          const controller = controllers.get(chatId);
          if (!controller) {
            throw new Error('No se encontró el controlador');
          }
          console.log('Controller: ', controller);
          controller.abort();

          event.sender.send('onNodeCodeResponse_stopGeneratingResponse', {
            func: 'stopGeneratingResponse',
            chatId,
          });
        } catch (error) {
          event.sender.send(
            'onNodeCodeResponse_stopGeneratingResponse',
            `Error al detener generación de respuesta: ${error.message}`
          );
        }
        break;
      }
      default: {
        event.sender.send('onNodeCodeResponse', 'Función no encontrada');
      }
    }
  });
}
