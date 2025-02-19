import { ipcMain } from 'electron';
import { dialog } from 'electron';
import { app, loadModel, modelPath } from './langchain.mjs';
import { HumanMessage } from '@langchain/core/messages';
import {
  deleteChat,
  deleteWorkspace,
  getChat,
  getChats,
  getWorkspace,
  getWorkspaces,
  newChat,
  newWorkspace,
  replaceChatMessages,
} from './db.mjs';
const controllers = new Map();

export function handleRunNodeCode() {
  ipcMain.on('runNodeCode', async (event, data) => {
    const { func } = data;

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
        const { type, name, description } = data;
        await startMongoServer();
        const workspace = await newWorkspace(type, name, description);
        await stopMongoServer();
        event.sender.send('onNodeCodeResponse', {
          func: 'newWorkspace',
          workspace,
        });
        break;
      }
      case 'getWorkspaces': {
        const { page, limit } = data;
        await startMongoServer();
        const workspaces = await getWorkspaces(page, limit);
        await stopMongoServer();
        event.sender.send('onNodeCodeResponse', {
          func: 'getWorkspaces',
          workspaces,
        });
        break;
      }
      case 'getWorkspace': {
        const { workspaceId } = data;
        await startMongoServer();
        const workspace = await getWorkspace(workspaceId);
        await stopMongoServer();
        event.sender.send('onNodeCodeResponse', {
          func: 'getWorkspace',
          workspace,
        });
        break;
      }
      case 'deleteWorkspace': {
        const { workspaceId } = data;
        await startMongoServer();
        await deleteWorkspace(workspaceId);
        await stopMongoServer();
        event.sender.send('onNodeCodeResponse', {
          func: 'deleteWorkspace',
          workspaceId,
        });
        break;
      }

      //Chats
      case 'newChat': {
        const { workspaceId, name, description } = data;
        await startMongoServer();
        const chat = await newChat(workspaceId, name, description);
        await stopMongoServer();
        event.sender.send('onNodeCodeResponse', {
          func: 'newChat',
          chat,
        });
        break;
      }
      case 'getChats': {
        const { workspaceId } = data;
        await startMongoServer();
        const chats = await getChats(workspaceId);
        await stopMongoServer();
        event.sender.send('onNodeCodeResponse', {
          func: 'getChats',
          chats,
        });
        break;
      }
      case 'getChat': {
        const { chatId } = data;
        await startMongoServer();
        const chat = await getChat(chatId);
        await stopMongoServer();
        event.sender.send('onNodeCodeResponse', {
          func: 'getChat',
          chat,
        });
        break;
      }
      case 'deleteChat': {
        const { chatId } = data;
        await startMongoServer();
        await deleteChat(chatId);
        await stopMongoServer();
        event.sender.send('onNodeCodeResponse', {
          func: 'deleteChat',
          chatId,
        });
        break;
      }

      //Chat IA
      case 'loadChat': {
        const { chatId } = data;
        await startMongoServer();
        const chat = await getChat(chatId);
        await stopMongoServer();

        const loadedMessages = chat.messages.map((msg) => {
          return {
            role: msg.type === 'user' ? 'user' : 'assistant',
            message: msg.content,
          };
        });

        const config = { configurable: { thread_id: chatId } };
        const input = { loadedMessages };
        const response = await app.invoke(input, config);

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

        event.sender.send('onNodeCodeResponse', {
          func: 'loadChat',
          messages,
        });
        break;
      }
      case 'sendMessage': {
        const { chatId, message } = data;
        const input = {
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
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

        try {
          await startMongoServer();
          await replaceChatMessages(chatId, messages);
          await stopMongoServer();
        } catch (error) {
          console.log('Error al guardar mensajes en la base de datos: ', error);
        }

        event.sender.send('onNodeCodeResponse', {
          func: 'sendMessage',
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
