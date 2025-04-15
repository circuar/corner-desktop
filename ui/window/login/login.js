const { animate } = require("animejs");
const { ipcRenderer } = require("electron");
var CryptoJS = require("crypto-js");
const { SourceTextModule } = require("vm");


var server;
var port;
var baseUrl;

// 加载上次的username到输入框


// 登录请求发送锁，防止重复提交
var loginRequestSendMutex = false;
var registerCodeSendMutex = false;

init();
pageFadeSwitch('', 'login-rightContent');


// 函数定义 ====================================================================
async function init() {
    // 加载properties
    let properties = await ipcRenderer.invoke('getProperties');
    server = properties.remote.server;
    port = properties.remote.port;
    baseUrl = server + ':' + port;

    let lastUsername = await ipcRenderer.invoke('getConfig', 'lastLoginUsernameInput');
    if (lastUsername) {
        console.log("loaded last username box input text:" + lastUsername);
        document.getElementById('login-username').value = lastUsername;
    }
}

function closeCurrentWindow() {
    ipcRenderer.invoke('closeCurrentWindow');
}


function login() {


    if (loginRequestSendMutex)
        return;


    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (null == username || '' == username) {
        notice('请输入用户名', 3000);
        return
    }

    if (null == password || '' == password) {
        notice('请输入密码', 3000);
        return
    }

    // 缓存用户名
    ipcRenderer.invoke('setConfig', 'lastLoginUsernameInput', username)

    const encryptPassword = CryptoJS.SHA256(password).toString();

    const request = {
        username: username,
        password: encryptPassword
    }

    // 初始化请求器
    const xhr = new XMLHttpRequest();

    xhr.open('POST', server + ':' + port + '/api/user/login', true);
    // 设置请求超时时间
    xhr.timeout = 5000;
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.status && response.success) {
                ipcRenderer.invoke('saveDataToRuntimeDB', 'token', response.data.token);
                notice('登录成功~', 1000);
                setTimeout(() => {
                    loginSuccess();
                }, 1400);
                return;
            } else {
                notice(response.message, 3000);
            }
        }
        notice('请求失败，status code: ' + xhr.status, 3000);
    };

    xhr.onerror = (e) => {
        notice('请求失败', 3000);
    }


    xhr.ontimeout = (e) => {
        notice('请求超时', 3000);
    }



    // 设置请求后函数解锁
    xhr.onloadend = () => {
        loginRequestSendMutex = false;
    };
    // 禁用此函数
    loginRequestSendMutex = true;
    // 发送请求
    xhr.send(JSON.stringify(request));

}

function registerSendCode() {
    let email = document.getElementById('register-email').value;
    if (!email) {
        notice('请输入邮箱', 3000);
        return;
    }
    // 发送请求
    const xhr = new XMLHttpRequest();
    xhr.open(baseUrl + '/api/user/register/verification')
    xhr.setTimeout(5000);
    xhr.setRequestHeader('content-type', 'application/json');

    xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // 服务器已接收请求
            let
        }
    }

}




function notice(message, duration) {
    const notification = document.createElement('div');
    notification.classList.add('login-notification');
    notification.innerHTML = message;

    notification.addEventListener('click', () => {
        notificationClose(notification);
    });

    document.body.appendChild(notification);

    setTimeout(() => { notificationClose(notification) }, duration);
}


function notificationClose(notification) {
    notification.style.animation = 'slideOut 0.4s forwards';
    setTimeout(() => {
        notification.remove();
    }, 400);
}


function loginSuccess() {
    ipcRenderer.invoke('loginWindowProcess');
}

function pageFadeSwitch(from, to, duration) {
    let fromDiv = document.getElementById(from);
    let toDiv = document.getElementById(to);
    // 设置初始状态

    if (toDiv) {
        toDiv.style.opacity = 0;
    }

    setTimeout(() => {
        if (fromDiv) {
            fromDiv.style.visibility = 'hidden';
        }
        if (toDiv) {
            toDiv.style.visibility = 'visible';

            animate(toDiv, {
                opacity: 1,
                duration: duration
            })

        }

    }, duration);

    if (fromDiv) {
        animate(fromDiv, {
            opacity: 0,
            duration: duration
        })
    }

}