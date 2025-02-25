import { ipcMain } from 'electron';
import { dialog } from 'electron';
import { app, loadModel, modelPath } from './langchain.mjs';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  deleteChat,
  deleteWorkspace,
  getChat,
  getChatMessages,
  getChats,
  getWorkspace,
  getWorkspaces,
  newChat,
  newWorkspace,
  replaceChatMessages,
} from './db.mjs';
import { RELAY_LIST } from './relays.mjs';
const controllers = new Map();

export function handleRunNodeCode() {
  ipcMain.on('runNodeCode', async (event, data) => {
    const { func } = data;

    // TODO group related funciontions in external modules
    // and here just call the functions
    switch (func) {
      //App
      case 'test': {
        event.sender.send('onNodeCodeResponse', {
          func: 'test',
          message: 'Función test ejecutada',
        });
        break;
      }
      case 'state': {
        const state = {
          modelPath: modelPath,
        };
        event.sender.send('onNodeCodeResponse', {
          func: 'state',
          ...state,
        });
        break;
      }

      //Selección de archivos
      // TODO: separate in two:
      // - select file (already exists)
      // - load model
      case 'selectModel': {
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
          await loadModel(modelPath);
          event.sender.send('onNodeCodeResponse', {
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

        event.sender.send('onNodeCodeResponse', {
          func: 'selectFile',
          filePaths,
        });
        break;
      }

      //Relays
      case 'getRelays': {
        event.sender.send('onNodeCodeResponse', {
          func: 'getRelays',
          relays: RELAY_LIST,
        });
        break;
      }

      //Workspaces
      case 'newWorkspace': {
        const { type, name, description, documents, relayId } = data;
        const workspace = await newWorkspace(type, name, description, documents, relayId);
        event.sender.send('onNodeCodeResponse', {
          func: 'newWorkspace',
          workspace,
        });
        break;
      }
      case 'getWorkspaces': {
        const { page, limit } = data;
        const workspaces = await getWorkspaces(page, limit);
        event.sender.send('onNodeCodeResponse', {
          func: 'getWorkspaces',
          workspaces,
        });
        break;
      }
      case 'getWorkspace': {
        const { workspaceId } = data;
        const workspace = await getWorkspace(workspaceId);
        event.sender.send('onNodeCodeResponse', {
          func: 'getWorkspace',
          workspace,
        });
        break;
      }
      case 'deleteWorkspace': {
        const { workspaceId } = data;
        await deleteWorkspace(workspaceId);
        event.sender.send('onNodeCodeResponse', {
          func: 'deleteWorkspace',
          workspaceId,
        });
        break;
      }

      //Chats
      case 'newChat': {
        const { workspaceId, name, description } = data;
        const chat = await newChat(workspaceId, name, description);
        event.sender.send('onNodeCodeResponse', {
          func: 'newChat',
          chat,
        });
        break;
      }
      case 'getChats': {
        const { workspaceId } = data;
        const chats = await getChats(workspaceId);
        event.sender.send('onNodeCodeResponse', {
          func: 'getChats',
          chats,
        });
        break;
      }
      case 'getChat': {
        const { chatId } = data;
        const chat = await getChat(chatId);
        event.sender.send('onNodeCodeResponse', {
          func: 'getChat',
          chat,
        });
        break;
      }
      case 'deleteChat': {
        const { chatId } = data;
        await deleteChat(chatId);
        event.sender.send('onNodeCodeResponse', {
          func: 'deleteChat',
          chatId,
        });
        break;
      }

      //Chat IA
      case 'loadChat': {
        const { chatId } = data;
        const chat = await getChat(chatId);
        const loadedMessages = chat.messages || [];

        event.sender.send('onNodeCodeResponse', {
          func: 'loadChat',
          chatId,
          messages: loadedMessages,
        });
        break;
      }

      case 'sendMessage': {
        const { chatId, message } = data;
        const chatMessages = await getChatMessages(chatId);
        const chatHistory = [];
        chatMessages.forEach((msg) => {
          if (msg.type === 'user') {
            chatHistory.push(new HumanMessage(msg.message));
          } else if (msg.type === 'model') {
            chatHistory.push(new AIMessage(msg.message));
          } else {
            chatHistory.push(new SystemMessage(msg.message));
          }
        });

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
        console.log('Response:', response);

        let messages = [];
        response.messages.forEach((msg) => {
          if (msg instanceof HumanMessage) {
            messages.push({
              type: 'user',
              message: msg.content,
            });
          } else {
            messages.push({
              type: 'model',
              message: msg.content,
            });
          }
        });

        await replaceChatMessages(chatId, messages);

        event.sender.send('onNodeCodeResponse', {
          func: 'sendMessage',
          chatId,
          messages,
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

          event.sender.send('onNodeCodeResponse', {
            func: 'stopGeneratingResponse',
            chatId,
          });
        } catch (error) {
          event.sender.send(
            'onNodeCodeResponse',
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
