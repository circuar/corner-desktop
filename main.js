const { app, BrowserWindow, ipcMain } = require('electron/main');
const path = require('node:path');


// ***窗口创建 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


// 创建登录窗口

function createLoginWindow() {
    const windowProperties = {
        width: 600,
        height: 350,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            // preload: path.join(__dirname, 'preload.js')
        },
        transparent: true,
        resizable: false,
    }

    const window = new BrowserWindow(windowProperties);

    window.loadFile('ui/window/login/login.html');
}

// 创建主窗口

function createMainWindow() {
    const windowProperties = {
        width: 1150,
        height: 750,
        frame: false,
        webPreferences: {
            nodeIntegration: false
            // preload: path.join(__dirname, 'preload.js')
        },
        transparent: true,
        resizable: false,
    }

    const window = new BrowserWindow(windowProperties);

    window.loadFile('ui/window/chat/chat.html');
}

















app.whenReady().then(() => {


});





// 启动逻辑 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// 应用启动时加载登录窗口
app.whenReady().then(() => {
    createLoginWindow();

    // 创建窗口关闭ipc，重写关闭窗口逻辑
    ipcMain.handle('closeWindow', () => {
        BrowserWindow.getFocusedWindow().close();
    })
});