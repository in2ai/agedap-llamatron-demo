import { ipcMain } from 'electron';
import { dialog } from 'electron';
import { app, loadModel, modelPath } from './langchain.mjs';
import { HumanMessage } from '@langchain/core/messages';
import { replaceMessages } from './db.mjs';
const controllers = new Map();

export function handleRunNodeCode() {
  ipcMain.on('run-node-code', async (event, data) => {
    const { func } = data;

    switch (func) {
      case 'test': {
        event.sender.send('node-code-response', {
          func: 'test',
          message: 'Función test ejecutada',
        });
        break;
      }
      case 'state': {
        const state = {
          modelPath: modelPath,
        };
        event.sender.send('node-code-response', {
          func: 'state',
          ...state,
        });
        break;
      }
      case 'select_model': {
        const dialogResult = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{ name: 'Model', extensions: ['gguf'] }],
        });
        const { filePaths } = dialogResult;

        if (filePaths.length > 0) {
          const modelPath = filePaths[0];
          let modelName = modelPath;
          modelName = modelName.split('\\').pop() || '';
          modelName = modelName.split('/').pop() || '';
          await loadModel(modelPath);
          event.sender.send('node-code-response', {
            func: 'select_model',
            modelName,
            modelPath,
          });
        }
        break;
      }
      case 'select_file': {
        const { name, extensions } = data;
        const dialogResult = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{ name, extensions }],
        });
        const { filePaths } = dialogResult;

        event.sender.send('node-code-response', {
          func: 'select_file',
          filePaths,
        });
        break;
      }
      case 'get_relays': {
        event.sender.send('node-code-response', {
          func: 'get_relays',
          relays: RELAY_LIST,
        });
        break;
      }
      case 'get_workspaces': {
        const { page, limit } = data;
        await startMongoServer();
        const workspaces = await getWorkspaces(page, limit);
        await stopMongoServer();
        event.sender.send('node-code-response', {
          func: 'get_workspaces',
          workspaces,
        });
        break;
      }
      case 'get_workspace': {
        const { id } = data;
        await startMongoServer();
        const workspace = await getWorkspace(id);
        await stopMongoServer();
        event.sender.send('node-code-response', {
          func: 'get_workspace',
          workspace,
        });
        break;
      }
      case 'delete_workspace': {
        const { id } = data;
        await startMongoServer();
        await deleteWorkspace(id);
        await stopMongoServer();
        event.sender.send('node-code-response', {
          func: 'delete_workspace',
          id,
        });
        break;
      }
      case 'send_message': {
        const { message, id } = data;
        const input = {
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        };

        const controller = new AbortController();
        controllers.set(id, controller);
        let newMessage = '';
        const config = {
          configurable: { thread_id: id },
          signal: controller.signal,
          callbacks: [
            {
              handleCustomEvent(eventName, data, runId) {
                if (eventName === 'onTextChunk' && controller.signal.aborted === false) {
                  newMessage += data;
                  event.sender.send('partial-response', {
                    func: 'partial-response',
                    chat_id: id,
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
        await replaceMessages(id, messages);

        event.sender.send('node-code-response', {
          func: 'send_message',
          messages,
        });
        break;
      }
      case 'stop_generating_response': {
        try {
          const { chat_id } = data;
          const controller = controllers.get(chat_id);
          if (!controller) {
            throw new Error('No se encontró el controlador');
          }
          console.log('Controller: ', controller);
          controller.abort();

          event.sender.send('node-code-response', {
            func: 'stop_generating_response',
            chat_id,
          });
        } catch (error) {
          event.sender.send(
            'node-code-response',
            `Error al detener generación de respuesta: ${error.message}`
          );
        }
        break;
      }
      default: {
        event.sender.send('node-code-response', 'Función no encontrada');
      }
    }
  });
}
