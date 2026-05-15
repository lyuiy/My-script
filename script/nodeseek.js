/*
NodeSeek Surge 签到脚本
支持：
1. 获取 Token
2. 定时签到
3. SignMode=fixed 固定 5 鸡腿
4. SignMode=random 随机鸡腿
*/

const SCRIPT_NAME = "NodeSeek";
const STORE_KEY = "nodeseek_data";
const BASE_URL = "https://www.nodeseek.com";

const $ = new Env(SCRIPT_NAME);

let notifyMsg = [];
let title = "";

// 主入口
!(async () => {
    try {
        if (typeof $request !== "undefined") {
            await getCookie();
        } else {
            await main();
        }
    } catch (e) {
        $.log(`[ERROR] ${e.message || e}`);
        $.msg(SCRIPT_NAME, "运行失败", e.message || String(e));
    } finally {
        $.done();
    }
})();


// ==============================
// 主签到逻辑
// ==============================

async function main() {
    const users = getUsers();

    if (!users.length) {
        throw new Error("未找到账号，请先打开 NodeSeek 触发获取 Token");
    }

    const signMode = getSignMode();
    const isRandom = signMode === "random";

    $.log(`[INFO] 检测到 ${users.length} 个账号`);
    $.log(`[INFO] 当前签到模式：${isRandom ? "随机领取鸡腿" : "固定领取 5 个鸡腿"}`);

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const index = i + 1;

        notifyMsg = [];
        title = "";

        try {
            $.log(`\n========== 账号 ${index} ==========`);

            const name = user.userName || `账号${index}`;
            $.log(`[${name}] 开始签到`);

            const signResult = await signin(user, isRandom);

            if (signResult) {
                title = signResult;
                DoubleLog(`「${name}」${signResult}`);
            }

            const userInfo = await getUserInfo(user);

            if (userInfo) {
                DoubleLog(`「${userInfo.member_name || name}」当前共 ${userInfo.coin} 个鸡腿🍗`);
            }

            if (notifyMsg.length) {
                $.msg(SCRIPT_NAME, title || "签到完成", notifyMsg.join("\n"));
            }

        } catch (e) {
            const name = user.userName || `账号${index}`;
            const msg = `「${name}」签到失败：${e.message || e}`;
            $.log(`[ERROR] ${msg}`);
            $.msg(SCRIPT_NAME, "签到失败", msg);
        }
    }
}


// ==============================
// 获取 Token
// ==============================

async function getCookie() {
    if ($request.method === "OPTIONS") {
        return;
    }

    const headers = lowerCaseHeaders($request.headers || {});
    const cookie = headers.cookie;

    if (!cookie) {
        throw new Error("获取 Cookie 失败");
    }

    let body = {};

    try {
        body = JSON.parse($response.body || "{}");
    } catch (e) {
        throw new Error("响应体解析失败");
    }

    const detail = body.detail || {};
    const memberId = detail.member_id;
    const memberName = detail.member_name;

    if (!memberId) {
        throw new Error("获取用户 ID 失败");
    }

    const users = getUsers();

    const newUser = {
        userId: memberId,
        userName: memberName,
        token: cookie
    };

    const index = users.findIndex(item => String(item.userId) === String(memberId));

    if (index >= 0) {
        users[index] = newUser;
    } else {
        users.push(newUser);
    }

    $.setjson(users, STORE_KEY);

    $.log(`[INFO] ${memberName || memberId} Token 更新成功`);
    $.msg(SCRIPT_NAME, `🎉 ${memberName || memberId}`, "Token 更新成功");
}


// ==============================
// 每日签到
// ==============================

async function signin(user, isRandom) {
    const url = `${BASE_URL}/api/attendance?random=${isRandom ? "true" : "false"}`;

    const headers = buildHeaders(user.token);

    const resp = await httpPost({
        url,
        headers,
        body: ""
    });

    $.log(`[SIGNIN] ${JSON.stringify(resp)}`);

    if (!resp) {
        throw new Error("签到请求无响应");
    }

    if (resp.message) {
        return resp.message;
    }

    return "签到完成";
}


// ==============================
// 查询账号信息
// ==============================

async function getUserInfo(user) {
    if (!user.userId) {
        return null;
    }

    const url = `${BASE_URL}/api/account/getInfo/${user.userId}?readme=1`;

    const headers = buildHeaders(user.token);

    const resp = await httpGet({
        url,
        headers
    });

    $.log(`[USERINFO] ${JSON.stringify(resp)}`);

    if (!resp) {
        return null;
    }

    return resp.detail || null;
}


// ==============================
// SignMode 参数读取
// ==============================

function getSignMode() {
    const args = getScriptArgs();

    let signMode = args.signMode || args.SignMode || "";

    signMode = String(signMode).trim().toLowerCase();

    if (["random", "true", "1", "yes", "on"].includes(signMode)) {
        return "random";
    }

    if (["fixed", "false", "0", "no", "off"].includes(signMode)) {
        return "fixed";
    }

    return "fixed";
}


function getScriptArgs() {
    const args = {};

    try {
        if (typeof $argument !== "undefined" && $argument) {
            String($argument).split("&").forEach(item => {
                const [key, ...valueParts] = item.split("=");
                if (!key) return;

                const value = valueParts.join("=");

                args[decodeURIComponent(key)] = decodeURIComponent(value || "");
            });
        }
    } catch (e) {
        $.log(`[Argument ERROR] ${e}`);
    }

    return args;
}


// ==============================
// 本地存储
// ==============================

function getUsers() {
    const users = $.getjson(STORE_KEY, []);

    if (Array.isArray(users)) {
        return users;
    }

    return [];
}


// ==============================
// 请求头
// ==============================

function buildHeaders(cookie) {
    return {
        "Host": "www.nodeseek.com",
        "Connection": "keep-alive",
        "Accept": "*/*",
        "Origin": "https://www.nodeseek.com",
        "Referer": "https://www.nodeseek.com/board",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Content-Length": "0",
        "Cookie": cookie
    };
}


// ==============================
// HTTP GET
// ==============================

function httpGet(options) {
    return new Promise((resolve, reject) => {
        $httpClient.get(options, (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }

            try {
                resolve(JSON.parse(body || "{}"));
            } catch (e) {
                resolve(body);
            }
        });
    });
}


// ==============================
// HTTP POST
// ==============================

function httpPost(options) {
    return new Promise((resolve, reject) => {
        $httpClient.post(options, (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }

            try {
                resolve(JSON.parse(body || "{}"));
            } catch (e) {
                resolve(body);
            }
        });
    });
}


// ==============================
// 工具函数
// ==============================

function lowerCaseHeaders(headers) {
    const result = {};

    Object.keys(headers || {}).forEach(key => {
        result[key.toLowerCase()] = headers[key];
    });

    return result;
}


function DoubleLog(msg) {
    if (!msg) return;

    $.log(msg);
    notifyMsg.push(msg);
}


// ==============================
// Surge Env
// ==============================

function Env(name) {
    return {
        name,

        log(...args) {
            console.log(args.join("\n"));
        },

        msg(title, subtitle = "", body = "") {
            $notification.post(title, subtitle, body);
        },

        getdata(key) {
            return $persistentStore.read(key);
        },

        setdata(value, key) {
            return $persistentStore.write(value, key);
        },

        getjson(key, defaultValue = {}) {
            const data = this.getdata(key);

            if (!data) {
                return defaultValue;
            }

            try {
                return JSON.parse(data);
            } catch (e) {
                return defaultValue;
            }
        },

        setjson(value, key) {
            try {
                return this.setdata(JSON.stringify(value), key);
            } catch (e) {
                return false;
            }
        },

        done(value = {}) {
            $done(value);
        }
    };
}
