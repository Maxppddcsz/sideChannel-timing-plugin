document.getElementById("viewLogs").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("logs.html") });
});

// 显示上一次请求的延迟
chrome.storage.local.get("requestLogs", (data) => {
    const logs = data.requestLogs || [];
    const latestLatencyDiv = document.getElementById("latestLatency");

    if (logs.length > 0) {
        const latestLog = logs[logs.length - 1];
        const latency = latestLog.duration !== null ? `${latestLog.duration} ms` : "N/A";
        latestLatencyDiv.textContent = `Last Latency: ${latency}`;
    } else {
        latestLatencyDiv.textContent = "No logs available.";
    }
});

// 从存储中获取上次选择的站点并更新下拉框
chrome.storage.local.get("selectedSite", (data) => {
    const siteSelector = document.getElementById("siteSelector");
    const selectedSite = data.selectedSite || "chatgpt"; // 默认选择 ChatGPT
    siteSelector.value = selectedSite;
});

// 保存用户选择的URL
document.getElementById("saveUrl").addEventListener("click", () => {
    const site = document.getElementById("siteSelector").value;

    // 根据选择的站点更新URL https://kimi.moonshot.cn/api/chat/ctl731c06opf5s5cki00/completion/stream 
    let listenUrlPattern = "";
    if (site === "chatgpt") {
        listenUrlPattern = "https://chatgpt.com/backend-api/conversation";
    } else if (site === "kimi") {
        listenUrlPattern = "https://kimi.moonshot.cn/api/chat/*/completion/stream";
    }

    // 存储所选站点的 URL 模式
    chrome.storage.local.set({ listenUrl: listenUrlPattern, selectedSite: site }, () => {
        alert(`Listening to: ${site}`);
        console.log(`Listening to: ${site}`);
    });
});
