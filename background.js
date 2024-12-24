let requestTimes = {};
let requestLogs = [];
let listenUrl = "https://chatgpt.com/backend-api/conversation"; // Default URL

// 动态监听请求
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.listenUrl) {
    listenUrl = changes.listenUrl.newValue || listenUrl;
    updateRequestListener();
  }
});

function updateRequestListener() {
  chrome.webRequest.onBeforeRequest.removeListener(requestListener);
  chrome.webRequest.onHeadersReceived.removeListener(responseListener);
  chrome.webRequest.onErrorOccurred.removeListener(errorListener);

  // 使用新的 URL 更新监听器
  chrome.webRequest.onBeforeRequest.addListener(
    requestListener,
    { urls: [listenUrl] },
    ["requestBody"]
  );

  chrome.webRequest.onHeadersReceived.addListener(
    responseListener,
    { urls: [listenUrl] }
  );

  chrome.webRequest.onErrorOccurred.addListener(
    errorListener,
    { urls: [listenUrl] }
  );
}

// 监听请求的开始时间
function requestListener(details) {
  const url = details.url;
  let requestBody = "";

  if (details.requestBody && details.requestBody.raw && details.requestBody.raw.length > 0) {
    const decoder = new TextDecoder("utf-8");
    requestBody = decoder.decode(details.requestBody.raw[0].bytes);
  }

  let messageContent = null;
  try {
    const parsedBody = JSON.parse(requestBody);
    messageContent = parsedBody?.messages?.[0]?.content?.parts?.join(" ") || null;
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
