import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { app, BrowserWindow } from 'electron';
import { handleRunNodeCode } from './api/nodeFunctions.mjs';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/agedap-llamatron/browser/index.html'));

  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

handleRunNodeCode(); // Llama a las funciones del backend
