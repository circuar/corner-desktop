const { ipcRenderer } = require('electron');

// 全局加载界面
var windowLoadingUI = document.getElementById('windowLoadingBox');
// 聊天窗口加载界面
var chatLoadingUI = document.getElementById('')

// 置顶会话div
var pinnedSessionListDiv = document.getElementById('main-chatListPinned');
// 置顶会话标题
var pinnedSessionGroupLabel = document.getElementById('pinnedLabel');
// 置顶会话元素Map
var pinnedSessionElemMap = new Map();

// 普通会话div
var commonSessionListDiv = document.getElementById('main-chatListChat');
// 普通会话标题
var commonSessionGroupLabel = document.getElementById('commonLabel');
// 普通会话元素Map
var commonSessionElemMap = new Map();

// 静音会话div
var muteSessionListDiv = document.getElementById('main-chatListMute');
// 置顶会话标题
var muteSessionGroupLabel = document.getElementById('muteLabel');
// 置顶会话元素Map
var muteSessionElemMap = new Map();


// 本地缓存会话索引数组，由init()调用ipc赋值，对应本地缓存
var sessionIndexArray;
// 服务器地址
var server;
// 端口号
var port;
// 请求地址
var baseUrl;
// 应用properties
var properties;

// 用户token
var token;


// 显示加载界面
windowLoadingUI.style.display = 'block';

// 推迟加载，避免复杂任务导致窗口未完全显示就卡死
setTimeout(() => {
    init().then(() => {
        windowLoadingUI.style.display = 'none';

    });
}, 1000);




async function init() {
    // 显示加载界面
    sessionIndexArray = await ipcRenderer.invoke('getSessionIndexArray');

    // 获取properties对象
    properties = await ipcRenderer.invoke('getProperties');

    server = properties.remote.server;
    port = properties.remote.port;
    baseUrl = server + ':' + port;

    // 获取token
    token = await ipcRenderer.invoke('getDataFromRuntimeDB', 'token');

    // 刷新本地会话缓存
    refreshSessionIndexCache();


}

function closeCurrentWindow() {
    ipcRenderer.invoke('closeCurrentWindow');
}


function saveSessionIndexArray() {
    ipcRenderer.invoke('setSessionIndexArray', sessionIndexArray);
}



// 注意单一职责，此处只渲染数据，不做内容存储及其他校验
function renderSessionListItem(sessionItem, focus) {
    let focusDisplay = focus ? '' : 'style="display: none;"';
    let imgSrc = sessionItem.imgPath ? sessionItem.imgPath : '../../resources/img/userhead.jpg';
    let flagDiv = sessionItem.userFlag ? '<span class="userFlag">' + sessionItem.userFlag + '</span>' : '';
    let extraText = sessionItem.extraText ? '< span class="extraText" >' + sessionItem.extraText + '</span>' : '';
    let countBubble = sessionItem.count && count > 0 ? '<div class="count">' + count + '</div>' : '';

    let elemStr = `
        <div class="chatItem">
            <div class="identifier" ${focusDisplay}></div>
            <div class="chatListUserImgFallback">
                <img src="${imgSrc}" />
            </div>

            <div class="chatItemText">
                <div class="topGroup">
                    ${flagDiv}
                    <span class="userShowName">${item.sessionName}</span>
                    ${extraText}
                </div>
                <div class="messageText">
                    ${item.messageText}
                </div>
            </div>
            <div class="chatItemWidget">
                <div class="time">${item.time}</div>
                ${countBubble}
            </div>
        </div>
    `
    var item;
    if (group == 0) {
        // 末尾插入，获取dom对象
        item = pinnedSessionListDiv.insertAdjacentHTML('beforeend', elemStr);
        pinnedSessionListDiv.insertBefore(item, pinnedSessionGroupLabel.nextSibling)

    } else if (group == 1) {
        item = commonSessionListDiv.insertAdjacentHTML('beforeend', elemStr);
        commonSessionListDiv.insertBefore(item, commonSessionGroupLabel.nextSibling)

    } else if (group == 2) {
        item = muteSessionListDiv.insertAdjacentHTML('beforeend', elemStr);
        muteSessionListDiv.insertBefore(item, muteSessionGroupLabel.nextSibling)
    }

    return item;
}

// 同步额外的实时信息到本地缓存
function refreshSessionIndexCache() {

}


// 加载本地缓存的sessionList到页面
function loadSessionList() {
    
}


function loadFriendList() {

}

function loadSessionList() {

}

function refreshFriendList() {

}

function ShowChatWindowLoadingUI() {

}

function HideChatWindowLoadingUI() {

}


function showChatWindow() {

}

function hideChatWindow() {

}