const { animate, createTimer } = require("animejs");
const { ipcRenderer } = require("electron");
var CryptoJS = require("crypto-js");

var server;
var port;
var baseUrl;

// 登录请求发送锁，防止重复提交
var loginRequestSendMutex = false;
// 注册验证码发送锁，防止重复发送
var registerCodeSendMutex = false;
// 注册请求发送锁，防止重复提交
var registerRequestSendMutex = false;

init();
pageFadeSwitch('', 'login-rightContent');


// 函数定义 ====================================================================
async function init() {
    // 加载properties
    let properties = await ipcRenderer.invoke('getProperties');
    server = properties.remote.server;
    port = properties.remote.port;
    baseUrl = server + ':' + port;

    // 加载上次的username到输入框
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
    // debug====================================================================
    loginSuccess()
    // =========================================================================

    if (loginRequestSendMutex)
        return;


    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username) {
        notice('请输入用户名', 3000);
        return;
    }

    if (!password) {
        notice('请输入密码', 3000);
        return;
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

    xhr.open('POST', baseUrl + '/api/user/login', true);
    // 设置请求超时时间
    xhr.timeout = 5000;
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = () => {
        if (xhr.status == 200) {
            let response = JSON.parse(xhr.responseText);
            if (response.success) {
                // 登录成功
                ipcRenderer.invoke('saveDataToRuntimeDB', 'token', response.data.token);
                notice('登录成功~', 1000);
                setTimeout(() => {
                    loginSuccess();
                }, 1400);
            } else {
                // 服务器接收请求，但出现其他错误
                notice(response.message, 3000);
            }
            return;
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
    if (registerCodeSendMutex) {
        return;
    }

    let email = document.getElementById('register-email').value;
    let sendBtn = document.getElementById('register-sendCode');
    if (!email) {
        notice('请输入邮箱', 3000);
        return;
    }

    const request = {
        email: email
    }

    // 发送请求
    const xhr = new XMLHttpRequest();
    xhr.open(baseUrl + '/api/user/register/verification')
    xhr.timeout = 5000
    xhr.setRequestHeader('content-type', 'application/json');

    xhr.onload = () => {
        if (xhr.status == 200) {
            let response = JSON.parse(xhr.responseText);
            if (response.success) {
                // 请求成功
                notice('验证码已发送', 3000);
                // 此时函数已被禁用
                let count = 60;
                sendBtn.innerHTML = count + 's';
                createTimer({
                    duration: 1000,
                    loop: 60,
                    onLoop: () => {
                        count = count - 1;
                        sendBtn.innerHTML = count + 's';
                    },
                    onComplete: () => {
                        // 重新启用函数
                        registerCodeSendMutex = false;
                        // 恢复按钮内容
                        sendBtn.innerHTML = '󰒊';
                    }
                });
            } else {
                registerCodeSendMutex = false;
                notice(response.message, 3000);
            }
        } else {
            notice('请求失败，status code: ' + xhr.status, 3000);
        }
    }

    xhr.onerror = () => {
        notice('请求失败', 3000);

    }

    xhr.ontimeout = () => {
        notice('请求超时', 3000);
    }

    xhr.onloadend = () => {
        if (xhr.status == 200 && JSON.parse(xhr.responseText).success) {
            return;
        }
        registerCodeSendMutex = false;
    }

    // 禁用此函数
    registerCodeSendMutex = true;
    // 发送请求
    xhr.send(JSON.stringify(request));
}

function register() {
    if (registerRequestSendMutex)
        return;

    const email = document.getElementById('register-email').value;
    const code = document.getElementById('register-code').value;
    const password = document.getElementById('register-password').value;

    if (!email) {
        notice('请输入邮箱', 3000);
        return;
    }

    if (!code) {
        notice('请输入验证码', 3000);
        return;
    }

    if (!password) {
        notice('请输入密码', 3000);
        return;
    }

    const encryptPassword = CryptoJS.SHA256(password).toString();

    const request = {
        email: email,
        verification: code,
        password: encryptPassword
    }

    // 初始化请求器
    const xhr = new XMLHttpRequest();

    xhr.open('POST', baseUrl + '/api/user/register', true);
    // 设置请求超时时间
    xhr.timeout = 5000;
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = () => {
        if (xhr.status == 200) {
            let response = JSON.parse(xhr.responseText);
            if (response.success) {
                // 注册成功
                ipcRenderer.invoke('saveDataToRuntimeDB', 'token', response.data.token);
                notice('登录成功~', 1000);
                setTimeout(() => {
                    loginSuccess();
                }, 1400);
            } else {
                // 服务器接收请求，但出现其他错误
                notice(response.message, 3000);
            }
            return;
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


// 登陆成功，启动主窗口
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