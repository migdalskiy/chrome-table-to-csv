// The "Content Script." This runs inside the web page you are visiting. It scrapes the table data and sends it to sample.js.

(function(){
    document.addEventListener('contextmenu', function(ev){
        var target = ev.target;
        var table = target.closest('table');

        if(table){
            var headers = table.querySelectorAll('th');
            var rows = table.querySelectorAll('tr');

            var res = {
                labels: [],
                values: []
            };

            headers.forEach(function(header){
                res.labels.push(header.innerText);
            });

            rows.forEach(function(row){
                var rowData = [];
                var cells = row.querySelectorAll('td');
                
                if(cells.length > 0) {
                    cells.forEach(function(cell){
                        rowData.push(cell.innerText.replace(/,/g, ''));
                    });
                    res.values.push(rowData);
                }
            });

            // ERROR HANDLING ADDED HERE
            try {
                chrome.runtime.sendMessage(res, function(response){
                    // Check for last error to suppress console noise
                    if (chrome.runtime.lastError) {
                        // Suppress error silently or log if needed
                        // console.log("Connection lost (reloading): " + chrome.runtime.lastError.message);
                    }
                });
            } catch (e) {
                // This catches the 'Extension context invalidated' error
                console.log("Extension updated. Please refresh the page.");
            }
        }
    });
})();