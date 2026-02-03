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

// NEW FUNCTION: Handles splitting newlines into columns
function createMultiColCSVContent(labels, values) {
    // 1. Calculate the max depth (number of lines) for each column index
    // Start with depth of 1 for every column
    let colDepths = new Array(labels.length).fill(1);
    
    // Parse all values to find max splits needed
    let parsedRows = values.map(row => {
        return row.map((cell, colIndex) => {
            // Split by newline (handles \n and \r\n)
            let parts = String(cell).split(/\r?\n/);
            // Update max depth for this specific column if this cell has more lines
            if (parts.length > colDepths[colIndex]) {
                colDepths[colIndex] = parts.length;
            }
            return parts;
        });
    });

    // 2. Build the new Header row
    let newHeaders = [];
    labels.forEach((label, i) => {
        newHeaders.push(label); // The original header
        // Add Header_1, Header_2 based on max depth found
        for (let d = 1; d < colDepths[i]; d++) {
            newHeaders.push(label + "_" + d);
        }
    });

    // 3. Flatten the data rows
    let newRows = parsedRows.map(row => {
        let flatRow = [];
        row.forEach((cellParts, colIndex) => {
            let maxDepth = colDepths[colIndex];
            // Add existing parts
            for (let k = 0; k < maxDepth; k++) {
                // If part exists use it, otherwise use empty string
                flatRow.push(cellParts[k] || ""); 
            }
        });
        return flatRow;
    });

    // 4. Combine headers and rows, then use existing CSV stringifier
    let allRows = [newHeaders].concat(newRows);
    return createCSVContent(allRows);
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
    } else if (info.menuItemId === 'export_csv_multicol') {
        // We pass labels and values separately to process the structure
        fileContent = createMultiColCSVContent(exportData.labels, exportData.values);
        extension = "csv";
        mimeType = "text/csv";
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
        // NEW MENU ITEM
        chrome.contextMenus.create({
            "title": "Export to CSV (multicol)",
            "id": "export_csv_multicol",
            "contexts": ["all"]
        });
    });
});