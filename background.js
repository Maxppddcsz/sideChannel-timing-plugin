let requestTimes = {};
let requestLogs = [];

// 捕获请求的起始时间并提取 message
let templateRequest = null;

// 监听浏览器发送的请求并记录
// chrome.webRequest.onBeforeRequest.addListener(
//   (details) => {
//     if (details.url.includes("https://chatgpt.com/backend-api/conversation")) {
//       let requestBody = "";

//       if (details.requestBody && details.requestBody.raw && details.requestBody.raw.length > 0) {
//         const decoder = new TextDecoder("utf-8");
//         requestBody = decoder.decode(details.requestBody.raw[0].bytes);
//       }

//       try {
//         const parsedBody = JSON.parse(requestBody);

//         // 将最近的请求保存为模板
//         templateRequest = {
//           url: details.url,
//           payload: parsedBody
//         };
//         chrome.storage.local.set({ templateRequest });
//         console.log("Template request recorded:", templateRequest);
//       } catch (error) {
//         console.error("Failed to parse request body:", error);
//       }
//     }
//   },
//   { urls: ["https://chatgpt.com/backend-api/conversation"] },
//   ["requestBody"]
// );

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const url = details.url;
    if (url.includes("https://chatgpt.com/backend-api/conversation")) {
      let requestBody = "";

      // 如果请求有 Body 数据，尝试解析它
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
  },
  { urls: ["https://chatgpt.com/backend-api/conversation"] },
  ["requestBody"]
);

// 捕获响应头接收时间
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const { requestId, url } = details;
    if (requestTimes[requestId]) {
      const endTime = Date.now();
      const startTime = requestTimes[requestId].startTime;
      const message = requestTimes[requestId].message;

      // 计算延迟
      const duration = endTime - startTime;
      console.log(`Response received for ${url}. duration: ${duration} ms, Message: ${message}`);

      // 存储到日志中
      chrome.storage.local.get({ requestLogs: [] }, (data) => {
        const requestLogs = data.requestLogs;
        requestLogs.push({ url, startTime, endTime, duration, message });
        chrome.storage.local.set({ requestLogs });
      });

      // 清理记录
      delete requestTimes[requestId];
    }
  },
  { urls: ["https://chatgpt.com/backend-api/conversation"] }
);



chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    const { requestId, url } = details;
    if (requestTimes[requestId]) {
      console.error(`Request error for ${url}`);
      delete requestTimes[requestId];
    }
  },
  { urls: ["https://chatgpt.com/backend-api/conversation"] }
);
