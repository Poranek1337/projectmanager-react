import './util-polyfill.cjs';

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        titleBarStyle: 'hiddenInset',
        transparent: true,
        vibrancy: 'under-window',
        backgroundColor: '#00000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        },
    });

    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173/manager');
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
            .catch(err => {
                console.error('Failed to load index.html:', err);
            });
    }

    ipcMain.on('window-minimize', () => {
        mainWindow?.minimize();
    });

    ipcMain.on('window-maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow?.unmaximize();
        } else {
            mainWindow?.maximize();
        }
    });

    ipcMain.on('window-close', () => {
        mainWindow?.close();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
