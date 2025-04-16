# corner-desktop
 A client for a chat network, based on electron


## api

### 用户登录
url: http:domain:8080/api/user/login

method: POST

request body:

``` json
{
    "username": "0000000001",
    "password": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
}
```

response:

``` json
{
    "status": "200",
    "success": true,
    "message": "请求成功"
}
```

### 用户注册验证码
url: http:domain:8080/api/user/register/verification

method: POST

request body:

``` json
{
    "email": "email@email.com"
}
```

response:

``` json
{
    "status": "200",
    "success": true,
    "message": "发送成功"
}
```

### 用户注册
url: http:domain:8080/api/user/register

method: POST

request body:

``` json
{
    "email": "email@email.com",
    "verification": "4592",
    "password": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
}
```

response:

``` json
{
    "status": "200",
    "success": true,
    "message": "注册成功",
    "data": {
        "uid":"0000000001"
    }
}
```