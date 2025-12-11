import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { app, BrowserWindow, Menu, Tray } from 'electron';
import { handleRunNodeCode } from './api/nodeFunctions.mjs';

let mainWindow;
let tray;

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

  //mainWindow.webContents.openDevTools();

  tray = new Tray('public/icon.png');
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir', click: () => mainWindow.show() },
    {
      label: 'Salir',
      click: () => {
        mainWindow.destroy();
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  tray.setToolTip('Llamatron');
  tray.on('click', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    event.preventDefault(); // Evita el cierre de la app
    mainWindow.hide(); // Oculta la ventana en lugar de cerrarla
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', (event) => {
  event.preventDefault(); // Evita que la app se cierre completamente
});

handleRunNodeCode(); // Llama a las funciones del backend
