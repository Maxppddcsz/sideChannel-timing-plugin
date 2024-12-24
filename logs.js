document.addEventListener("DOMContentLoaded", () => {
    const logTable = document.getElementById("logTable");
    const exportButton = document.getElementById("exportLogs");

    function renderLogs() {
        chrome.storage.local.get("requestLogs", (data) => {
            const logs = data.requestLogs || [];
            logTable.innerHTML = "";

            if (logs.length === 0) {
                logTable.innerHTML = `<tr><td colspan="6">No logs available.</td></tr>`;
                return;
            }

            logs.forEach((log, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
            <td>${log.url}</td>
            <td>${new Date(log.startTime).toLocaleString()}</td>
            <td>${log.endTime ? new Date(log.endTime).toLocaleString() : "N/A"}</td>
            <td>${log.duration !== null ? log.duration : "N/A"}</td>
            <td>${log.message !== null ? log.message : "N/A"}</td>
            <td><button class="delete-log" data-index="${index}">Delete</button></td>
          `;
                logTable.appendChild(row);
            });

            document.querySelectorAll(".delete-log").forEach((button) => {
                button.addEventListener("click", (event) => {
                    const index = parseInt(event.target.getAttribute("data-index"));
                    deleteLog(index);
                });
            });
        });
    }

    function deleteLog(index) {
        chrome.storage.local.get("requestLogs", (data) => {
            const logs = data.requestLogs || [];
            logs.splice(index, 1);
            chrome.storage.local.set({ requestLogs: logs }, renderLogs);
        });
    }

    exportButton.addEventListener("click", () => {
        chrome.storage.local.get("requestLogs", (data) => {
            const logs = data.requestLogs || [];
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "request_logs.json";
            a.click();
            URL.revokeObjectURL(url);
        });
    });

    renderLogs();
});
