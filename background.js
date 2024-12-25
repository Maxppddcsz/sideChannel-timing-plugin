let requestTimes = {};
let requestLogs = [];
let listenUrlPattern = "https://kimi.moonshot.cn/api/chat/ctl731c06opf5s5cki00/completion/stream"; // 默认 URL 为 ChatGPT

// 动态监听请求
chrome.storage.onChanged.addListener((changes, area) => {
  console.log(changes.listenUrl);
  if (area === "local" && changes.listenUrl) {
    console.log(`updateRequestListener`);
    listenUrlPattern = changes.listenUrl.newValue || listenUrlPattern;
    console.log(listenUrlPattern);
    updateRequestListener();
  }
});

function updateRequestListener() {
  chrome.webRequest.onBeforeRequest.removeListener(requestListener);
  chrome.webRequest.onHeadersReceived.removeListener(responseListener);
  chrome.webRequest.onErrorOccurred.removeListener(errorListener);
  console.log(`addListener`);
  // 使用正则表达式匹配 URL 更新监听器
  chrome.webRequest.onBeforeRequest.addListener(
    requestListener,
    { urls: [listenUrlPattern] },
    ["requestBody"]
  );

  chrome.webRequest.onHeadersReceived.addListener(
    responseListener,
    { urls: [listenUrlPattern] }
  );

  chrome.webRequest.onErrorOccurred.addListener(
    errorListener,
    { urls: [listenUrlPattern] }
  );
}

// 监听请求的开始时间
function requestListener(details) {
  console.log(`requestListener`);
  const url = details.url;
  console.log(url);
  let requestBody = "";

  if (details.requestBody && details.requestBody.raw && details.requestBody.raw.length > 0) {
    const decoder = new TextDecoder("utf-8");
    requestBody = decoder.decode(details.requestBody.raw[0].bytes);
  }

  let messageContent = null;
  console.log(url);
  // 根据URL判断是ChatGPT还是Kimi，提取不同的消息格式
  try {
    const parsedBody = JSON.parse(requestBody);

    if (url.includes("conversation")) {
      messageContent = parsedBody?.messages?.[0]?.content?.parts?.join(" ") || null; // ChatGPT 格式
    } else if (url.includes("stream")) {
      messageContent = parsedBody?.messages?.[0]?.content || null; // Kimi 格式
    }
  } catch (e) {
    console.error("Failed to parse request body:", e);
  }

  requestTimes[details.requestId] = { startTime: Date.now(), url, message: messageContent };
  console.log(`Request started: ${url}, Message: ${messageContent}`);
}

// 监听响应的时间
function responseListener(details) {
  const { requestId, url } = details;
  if (requestTimes[requestId]) {
    const endTime = Date.now();
    const startTime = requestTimes[requestId].startTime;
    const message = requestTimes[requestId].message;

    const duration = endTime - startTime;
    console.log(`Response received for ${url}. duration: ${duration} ms, Message: ${message}`);

    chrome.storage.local.get({ requestLogs: [] }, (data) => {
      const requestLogs = data.requestLogs;
      requestLogs.push({ url, startTime, endTime, duration, message });
      chrome.storage.local.set({ requestLogs });
    });

    delete requestTimes[requestId];
  }
}

// 错误处理
function errorListener(details) {
  const { requestId, url } = details;
  if (requestTimes[requestId]) {
    console.error(`Request error for ${url}`);
    delete requestTimes[requestId];
  }
}

// 初始设置
updateRequestListener();
