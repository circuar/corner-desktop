import { app, BrowserWindow, ipcMain } from 'electron/main';
import path from 'path';
import Store from 'electron-store';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

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
// 初始化会话索引缓存
const sessionIndexCache = new Store({ name: 'sessionIndexCache' });
// 创建数据库
const db = new Database('data.sqlite', { verbose: console.log });


// 初始化保存的用户表
db.prepare(`CREATE TABLE IF NOT EXISTS connection_user_index (
        id INTEGER PRIMARY KEY AUTOINCREMENT,   -- 主键
        uid VARCHAR(10) UNIQUE NOT NULL,        -- UID
        username VARCHAR(20) NOT NULL,          -- 用户名
        display_name VARCHAR(20) DEFAULT NULL,  -- 备注名
        img_path VARCHAR(256),                  -- 头像本地缓存路径
        last_online_timestamp INTEGER NOT NULL  -- 上次在线时间戳
    );`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS connection_group_index (
        id INTEGER PRIMARY KEY AUTOINCREMENT,   -- 主键
        gid VARCHAR(20) UNIQUE NOT NULL,        -- GID
        group_name VARCHAR(20) NOT NULL,        -- 群组名
        display_name VARCHAR(20) DEFAULT NULL,  -- 备注名
        img_path VARCHAR(256)                   -- 图片缓存路径
    );`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS message_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,       -- 主键
        mid INTEGER UNIQUE NOT NULL,                -- 消息ID
        affiliated_type INTEGER NOT NULL,           -- 所属类型, 0: user, 1: group
        from_gid VARCHAR(20) DEFAULT NULL,          -- 如果消息来自于群组, 则保存群组的GID
        from_uid VARCHAR(10) NOT NULL,              -- 创建消息的UID
        unread INTEGER DEFAULT 1,                   -- 是否未读, 0: read, 1: unread
        message_type INTEGER NOT NULL DEFAULT 0,    -- 消息类型, 0: text, 1: img, 2: sound, 3: file
        message_content VARCHAR(512),               -- 消息内容, 如果是文件则使用路径
        timestamp INTEGER NOT NULL                  -- 消息服务器接收时间
    );`).run();


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

    ipcMain.handle('getConfigObject', async event => configStore);

    // 会话索引数组
    ipcMain.handle('getSessionIndexArray', async event => sessionIndexCache.get('sessionIndexArray', new Array(0)));
    ipcMain.handle('setSessionIndexArray', async (event, sessionArray) => sessionIndexCache.set('sessionIndexArray', sessionArray));

    // properties传输
    ipcMain.handle('getProperties', async event => properties);
    ipcMain.handle('loginWindowProcess', async event => {
        loginWindow.close();
        createMainWindow();
    });

    // database操作
    ipcMain.handle('sql', (event, sql) => db.prepare(sql));

    createLoginWindow();
});