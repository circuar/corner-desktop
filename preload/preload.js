const { contextBridge, ipcRenderer } = require('electron')

// contextBridge.exposeInMainWorld('closeWindow', () => ipcRenderer.send('close-window'));


contextBridge.exposeInMainWorld("electronApi", {
    closeCurrentWindow: () => ipcRenderer.invoke("closeWindow")
})

