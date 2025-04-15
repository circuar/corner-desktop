const { ipcRender } = require('electron');

function closeLoginWindow() {
    
}







function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    if (null == username || "" == username) {
        notice("请输入用户名", 3000);
        return
    }

    if (null == password || "" == password) {
        notice("请输入密码", 3000);
        return
    }
}


function notice(message, duration) {
    const notification = document.createElement("div");
    notification.classList.add("login-notification");
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



function pageSwitch(from, to) {
    
}



function pageRegister() {
    document.getElementById("login-username")
}
