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

// 保存用户输入的URL
document.getElementById("saveUrl").addEventListener("click", () => {
    const url = document.getElementById("urlInput").value.trim();
    if (!url) {
        alert("Please enter a URL to listen.");
        return;
    }

    chrome.storage.local.set({ listenUrl: url }, () => {
        alert(`Listening to: ${url}`);
        console.log(`Listening to: ${url}`);
    });
});

// 自动向 ChatGPT 后端发送请求
document.getElementById("sendRequest").addEventListener("click", async () => {
    // 从存储中获取模板请求
    chrome.storage.local.get("templateRequest", async (data) => {
        const templateRequest = data.templateRequest;

        if (!templateRequest) {
            alert("No template request recorded.");
            return;
        }

        // 获取用户输入的新消息
        const newMessage = document.getElementById("newMessage").value.trim();
        if (!newMessage) {
            alert("Please enter a new message.");
            return;
        }

        // 修改模板请求中的消息内容
        const modifiedPayload = { ...templateRequest.payload };
        modifiedPayload.messages[0].content.parts = [newMessage];

        try {
            const startTime = Date.now();
            const response = await fetch(templateRequest.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(modifiedPayload)
            });
            const endTime = Date.now();

            if (response.ok) {
                const responseData = await response.json();
                const latency = endTime - startTime;

                console.log("Response received:", responseData);

                // 存储日志
                chrome.storage.local.get({ requestLogs: [] }, (logData) => {
                    const requestLogs = logData.requestLogs;
                    requestLogs.push({
                        url: templateRequest.url,
                        startTime,
                        responseTime: endTime,
                        latency,
                        message: newMessage,
                        response: responseData
                    });
                    chrome.storage.local.set({ requestLogs });
                });

                alert(`Request successful! Latency: ${latency} ms`);
            } else {
                const errorText = await response.text();
                console.error("Request failed with status:", response.status, errorText);
                alert(`Request failed with status: ${response.status}\n${errorText}`);
            }
        } catch (error) {
            console.error("Error sending request:", error);
            alert("An error occurred while sending the request.");
        }
    });
});
