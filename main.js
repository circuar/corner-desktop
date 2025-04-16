import { app, BrowserWindow, ipcMain } from 'electron/main';
import path from 'path';
import Store from 'electron-store';
import fs from 'fs';
import { fileURLToPath } from 'url';

// 获取当前模块的文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ***窗口创建 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// 创建登录窗口

function createLoginWindow() {
    console.log('login window load');
    const windowProperties = {
        width: 600,
        height: 350,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        transparent: true,
        resizable: false,
    }
    if (loginWindow) {
        console.log('Login window launched, it will be destroyed.');
        loginWindow.close();
    }

    loginWindow = new BrowserWindow(windowProperties);

    loginWindow.loadFile('ui/window/login/login.html');
}

// 创建主窗口

function createMainWindow() {
    const windowProperties = {
        width: 1150,
        height: 750,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        transparent: true,
        resizable: false,
    }

    if (mainWindow) {
        console.log('Main window launched, it will be destroyed.');
        mainWindow.close();
    }

    mainWindow = new BrowserWindow(windowProperties);

    mainWindow.loadFile('ui/window/chat/chat.html');
}


// 启动逻辑 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// 窗口管理
var loginWindow;
var mainWindow;


// 初始化app配置
var properties = JSON.parse(fs.readFileSync(path.join(__dirname, 'properties.json'), { encoding: 'utf-8' }));
// 初始化内存键值存储
const runtimeKVDataBase = new Map();
// 初始化配置文件存储器
const configStore = new Store();
// 应用启动时加载登录窗口
app.whenReady().then(() => {

    // ipc 处理 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // 创建窗口关闭ipc
    ipcMain.handle('closeCurrentWindow', event => {
        const closeWindow = BrowserWindow.getFocusedWindow();
        if (closeWindow)
            closeWindow.close();
    });
    // 内存Map存取
    ipcMain.handle('saveDataToRuntimeDB', async (event, key, value) => runtimeKVDataBase.set(key, value));

    ipcMain.handle('getDataFromRuntimeDB', async (event, key) => runtimeKVDataBase.get(key));

    // 用户配置文件存取
    ipcMain.handle('setConfig', async (event, key, value) => configStore.set(key, value));
    ipcMain.handle('getConfig', async (event, key) => configStore.get(key));
    ipcMain.handle('deleteConfig', async (event, key) => configStore.delete(key));

    // properties传输
    ipcMain.handle('getProperties', async event => properties);
    ipcMain.handle('loginWindowProcess', async event => {
        loginWindow.close();
        createMainWindow();
    });

    createLoginWindow();
});