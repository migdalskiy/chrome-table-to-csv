// Role: The actual logic for the background. It listens for the right-click menu (Context Menu) and handles the "Save Data" commands.

let exportData = null;

function createCSVContent(rows) {
    let csvContent = "";
    rows.forEach(function(row) {
        let rowStr = row.map(val => {
            let innerValue = val === null ? '' : String(val);
            let result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0) {
                result = '"' + result + '"';
            }
            return result;
        }).join(",");
        csvContent += rowStr + "\n";
    });
    return csvContent;
}

function createTSVContent(rows) {
     let tsvContent = "";
    rows.forEach(function(row) {
        let rowStr = row.map(val => {
            let innerValue = val === null ? '' : String(val);
            return innerValue.replace(/\t/g, " ").replace(/\n/g, " ");
        }).join("\t");
        tsvContent += rowStr + "\n";
    });
    return tsvContent;
}

function onClickHandler(info, tab) {
    if (!exportData) {
        console.log('No table data found to export.');
        return;
    }

    let rows = [exportData.labels].concat(exportData.values);
    let fileContent = "";
    let extension = "";
    let mimeType = "";

    if (info.menuItemId === 'export_cvs') {
        fileContent = createCSVContent(rows);
        extension = "csv";
        mimeType = "text/csv";
    } else if (info.menuItemId === 'export_tsv') {
        fileContent = createTSVContent(rows);
        extension = "txt";
        mimeType = "text/plain";
    }

    const dataUrl = `data:${mimeType};charset=utf-8,` + encodeURIComponent(fileContent);

    chrome.downloads.download({
        url: dataUrl,
        filename: `data_${Date.now()}.${extension}`,
        saveAs: true
    });
}

// 1. Setup Listeners
chrome.contextMenus.onClicked.addListener(onClickHandler);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    exportData = request;
    sendResponse({received: true});
});

// 2. Force Menu Creation
// We use 'onInstalled' to clean up and re-create to avoid ID conflicts.
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.removeAll(function() {
        chrome.contextMenus.create({
            "title": "Save Table to CSV",
            "id": "export_cvs",
            "contexts": ["all"]
        });
        chrome.contextMenus.create({
            "title": "Save Table to TXT",
            "id": "export_tsv",
            "contexts": ["all"]
        });
    });
});