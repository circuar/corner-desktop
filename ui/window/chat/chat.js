const { ipcRenderer } = require('electron');

/*
 * 渲染进程不维护用户信息的引用，查询使用数据库接口
 */




// DOM元素======================================================================
// 全局加载界面
var windowLoadingUI = document.getElementById('windowLoadingBox');
// 聊天窗口加载界面
// TODO: html
var chatLoadingUI = document.getElementById('')

// 置顶会话div
var pinnedSessionListDiv = document.getElementById('main-chatListPinned');
// 置顶会话标题
var pinnedSessionGroupLabel = document.getElementById('pinnedLabel');


// 普通会话div
var commonSessionListDiv = document.getElementById('main-chatListChat');
// 普通会话标题
var commonSessionGroupLabel = document.getElementById('commonLabel');


// 静音会话div
var muteSessionListDiv = document.getElementById('main-chatListMute');
// 置顶会话标题
var muteSessionGroupLabel = document.getElementById('muteLabel');

// 会话组元素Map================================================================
// 置顶会话元素Map
var pinnedSessionElemMap = new Map();
// 普通会话元素Map
var commonSessionElemMap = new Map();
// 置顶会话元素Map
var muteSessionElemMap = new Map();

// Connection元素Map============================================================
// 群组连接元素Map
var groupConnectionElemMap = new Map();
// 用户连接元素Map
var userConnectionElemMao = new Map();



// 配置=========================================================================
// 应用properties
var properties;
// 服务器地址
var server;
// 端口号
var port;
// 请求地址
var baseUrl;
// 用户token
var token;

// 变量=========================================================================
// 用户额外的实时信息，例如在线状态，额外文本等
var extraRealtimeUserInfo = new Map();

// 本地会话缓存映射
var sessionIndexArray;


// 脚本执行入口 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// 显示加载界面
windowLoadingUI.style.display = 'block';

// 推迟加载，避免复杂任务导致窗口未完全显示就卡死
setTimeout(() => {
    init().then(() => {
        console.log('OK');
        windowLoadingUI.style.display = 'none';

    });
}, 1000);
// 脚本执行入口 END >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


// function define =============================================================
async function init() {

    // 获取properties对象
    properties = await ipcRenderer.invoke('getProperties');

    server = properties.remote.server;
    port = properties.remote.port;
    baseUrl = server + ':' + port;

    // 获取token
    token = await ipcRenderer.invoke('getDataFromRuntimeDB', 'token');

    // 读取本地会话缓存到渲染进程
    sessionIndexArray = await readSessionIndexCache();

    await renderSessionList();

}

// 获取sessionIndex的缓存数组
async function readSessionIndexCache() {
    return await ipcRenderer.invoke('getSessionIndexArray');
}

// 传输sessionArray到主进程，主进程调用set()直接覆盖缓存数组
async function saveSessionIndexCache(sessionArray) {
    ipcRenderer.invoke('setSessionIndexArray', sessionArray);
}

// 加载本地缓存的sessionList到页面
async function renderSessionList() {
    const group = [pinnedSessionElemMap, commonSessionElemMap, muteSessionElemMap];

    for (const sessionMetaData of sessionIndexArray) {


        // sessionMetaData:
        // this.sessionIdRef = sessionIdRef;
        // this.sessionRefType = sessionRefType;
        // this.sessionGroup = sessionGroup;
        // this.name = name;



        let sessionIdRef = sessionMetaData.sessionIdRef;
        let sessionRefType = sessionMetaData.sessionRefType;
        let sessionGroup = sessionMetaData.sessionGroup;
        let name = sessionMetaData.name;



        let imgPath;
        let messageInfo;

        let message;
        let time;
        let count;


        if (sessionRefType == 0) {
            imgPath = (await ipcRenderer.invoke('sql', 'SELECT img_path FROM connection_user_index WHERE uid = ?;')).get(sessionIdRef);
            messageInfo = (await ipcRenderer.invoke('sql', `SELECT message_type, message_content, timestamp
                                                                FROM message_data
                                                                WHERE affiliated_type = 0
                                                                AND from_uid = ?
                                                                AND timestamp = (
                                                                    SELECT MAX(timestamp)
                                                                    FROM message_data
                                                                    WHERE affiliated_type = 0
                                                                    AND from_uid = ?
                                                                );
                                                            `)).get(sessionIdRef);
            count = (await ipcRenderer.invoke('sql', `SELECT COUNT(1)
                                                      FROM message_data
                                                      WHERE affiliated_type = 0
                                                      AND from_uid = ?
                                                      AND unread = 1;
                                                      `)).get(sessionIdRef);
        } else {
            imgPath = (await ipcRenderer.invoke('sql', 'SELECT img_path FROM connection_group_index WHERE gid = ?;')).get(sessionIdRef);
            messageInfo = (await ipcRenderer.invoke('sql', `SELECT message_type, message_content, timestamp
                                                                FROM message_data
                                                                WHERE affiliated_type = 1
                                                                AND from_gid = ?
                                                                AND timestamp = (
                                                                    SELECT MAX(timestamp)
                                                                    FROM message_data
                                                                    WHERE affiliated_type = 1
                                                                    AND from_gid = ?
                                                                );
                                                            `)).get(sessionIdRef);
            count = (await ipcRenderer.invoke('sql', `SELECT COUNT(1)
                                                      FROM message_data
                                                      WHERE affiliated_type = 1
                                                      AND from_gid = ?
                                                      AND unread = 1;
                                                      `)).get(sessionIdRef);
        }

        if (messageInfo.message_type == 0) {
            message = '󱧎 ' + messageInfo.message_content;
        } else if (messageInfo.message_type == 1) {
            message = '[图片]';
        } else if (messageInfo.message_type == 2) {
            message = '[语音]';
        } else {
            message = '[文件]';
        }

        time = convertTimestampToTagTime(messageInfo.timestamp * 1000);

        let uiNode = new UISessionListNode(sessionIdRef, sessionRefType, sessionGroup, false, imgPath, null, name, null, message, time, count)
        group[sessionMetaData.sessionGroup].set(sessionMetaData.sessionIdRef, uiNode);
    }

}


// 仅做ui处理，不处理逻辑
class UISessionListNode {
    constructor(sessionIdRef, sessionRefType, group, focus, imgPath, flag, name, extraText, message, time, count) {

        this.sessionIdRef = sessionIdRef;      // 会话保留的群组或用户的ID
        this.sessionRefType = sessionRefType;
        this.elemRef = null;
        this.group = group;
        this.focus = focus;
        this.imgPath = imgPath;
        this.flag = flag;
        this.name = name;
        this.extraText = extraText;
        this.message = message;
        this.time = time;
        this.count = count;

        this.render();
    }

    render() {
        if (this.elemRef) {
            this.elemRef.remove();
        }

        let focusDisplayControl = this.focus ? '' : 'style="display: none;"';
        let imgSrc = this.imgPath ? this.imgPath : '';
        let flagDisplayControl = this.flag ? '' : 'style="display: none;"';
        let extraTextDisplayControl = this.extraText ? '' : 'style="display: none;"';
        let countBubbleDisplayControl = this.count && this.count > 0 ? '' : 'style="display: none;"';

        // 创建UI节点
        this.elemRef = document.createElement('div');
        // 设置类名
        this.elemRef.className = 'chatItem';
        this.elemRef.innerHTML =
            `
            <div class="identifier" ${focusDisplayControl}></div>
            <div class="chatListUserImgFallback">
                <img src="${imgSrc}">
                </div>

            <div class="chatItemText">
                <div class="topGroup">
                    <span class="userFlag" ${flagDisplayControl} >${this.flag}</span>
                    <span class="userShowName">${this.name}</span>
                    <span class="extraText" ${extraTextDisplayControl}>${this.extraText}</span>
                </div>
                <div class="messageText">
                    ${this.message}
                </div>
            </div>
            <div class="chatItemWidget">
                <div class="time">${this.time}</div>
                <div class="count" ${countBubbleDisplayControl}>${this.count}</div>
            </div>
        `;

        if (this.group == 0) {
            this.elemRef = pinnedSessionGroupLabel.insertAdjacentElement('afterend', this.elemRef);
        } else if (this.group == 1) {
            this.elemRef = commonSessionGroupLabel.insertAdjacentElement('afterend', this.elemRef);
        } else if (this.group == 2) {
            this.elemRef = muteSessionGroupLabel.insertAdjacentElement('afterend', this.elemRef);
        }
    }

    // 组移动
    resetGroup(groupIndex) {
        if (groupIndex == this.group)
            return;

        let groups = [pinnedSessionElemMap, commonSessionElemMap, muteSessionElemMap];
        let groupListLabels = [pinnedSessionGroupLabel, commonSessionGroupLabel, muteSessionGroupLabel];

        //原组移除
        groups[this.group].delete(this.sessionIdRef);
        //加入新组
        groups[groupIndex].set(this.sessionIdRef, this);
        // 更新属性
        this.group = groupIndex;
        // ui更新
        groupListLabels[groupIndex].insertAdjacentElement('afterend', this.elemRef);
    }
    // 焦点设置
    setFocus() {
        // 显示焦点指示器
        if (!this.focus) {
            this.elemRef.getElementsByClassName('identifier')[0].style.display = '';
            this.focus = true;
        }
    }
    // 取消焦点
    cancelFocus() {
        if (this.focus) {
            this.elemRef.getElementsByClassName('identifier')[0].style.display = 'none';
            this.focus = false;
        }
    }
    // 设置图片
    setImagePath(path) {
        this.imgPath = path;
        this.elemRef.querySelectorAll('.chatListUserImgFallback')[0].querySelectorAll('img')[0].src = path;
    }
    // 设置name
    setName(name) {
        this.name = name;
        // 更新UI
        this.elemRef.querySelectorAll('.chatItemText')[0].querySelectorAll('.topGroup')[0].querySelectorAll('')
    }

}


class SessionIndex {
    constructor(sessionIdRef, sessionRefType, sessionGroup, name) {
        this.sessionIdRef = sessionIdRef;
        this.sessionRefType = sessionRefType;
        this.sessionGroup = sessionGroup;
        this.name = name;
    }
}


function convertTimestampToTagTime(timestamp) {
    let time = new Date(timestamp);
    let current = new Date();

    if (current.getTime() - timestamp > 24 * 60 * 60 * 1000 && current.getTime() - timestamp <= 2 * 24 * 60 * 60 * 1000) {
        return '昨天';
    } else if (current.getTime() - timestamp > 2 * 24 * 60 * 60 * 1000 && current.getTime() - timestamp <= 3 * 24 * 60 * 60 * 1000) {
        return '前天';
    } else if (current.getTime() - timestamp > 3 * 24 * 60 * 60 * 1000 && current.getTime() - timestamp <= 365 * 24 * 60 * 60 * 1000) {
        let monthNum = current.getMonth();
        let monthStr = '' + monthNum;
        if (monthNum < 10)
            monthStr = '0' + monthNum;

        let dayNum = current.getDay();
        let dayStr = '' + dayNum;
        if (dayNum < 10)
            dayStr = '0' + dayNum;

        return monthStr + '-' + dayStr;
    } else if (current.getTime() - timestamp >= 0 && current.getTime() - timestamp <= 24 * 60 * 60 * 1000) {
        let tail;
        let hoursNum = current.getHours();
        let hoursStr = '' + hoursNum;

        if (hoursNum > 12) {
            hoursNum = hoursNum - 12;
            tail = 'PM';
        } else {
            tail = 'AM';
        }

        if (hoursNum < 10) {
            hoursStr = '0' + hoursNum;
        }

        let secNum = current.getSeconds();
        let secStr = '' + secNum;
        if (dayNum < 10)
            dayStr = '0' + secNum;

        return hoursStr + ':' + secStr + ' ' + tail;
    } else {
        return '很久'
    }
}

async function downloadUserList(callback) {
    let uid = await ipcRenderer.invoke('getDataFromRuntimeDB', 'uid');

    let xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + '/api/user/' + uid + '/userlist');
    xhr.setRequestHeader('content-type', 'application/json');
    let req = {
        token: token
    }

    xhr.onload = async () => {
        if (this.status == 200) {
            resp = JSON.parse(xhr.responseText);

            // 清空旧数据
            (await ipcRenderer.invoke('sql', 'DELETE FROM connections_user_index;')).run();
            // 重置主键
            (await ipcRenderer.invoke('sql', 'DELETE FROM sqlite_sequence WHERE name = connections_user_index;')).run();

            for (let user of resp) {
                (await ipcRenderer.invoke('sql', 'INSERT INTO connections_user_index VALUES (null, ?, ?, ?, ?, ?)')).run();
            }
        }
        callback();

    }

    xhr.send(req);

}













function closeCurrentWindow() {
    ipcRenderer.invoke('closeCurrentWindow');
}



function ShowChatWindowLoadingUI() {

}

function HideChatWindowLoadingUI() {

}
