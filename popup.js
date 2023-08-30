document.getElementById('left-button').addEventListener('click', function(event) {
    event.preventDefault();

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const currentUrl = currentTab.url;
        const currentTitle = currentTab.title;

        chrome.storage.local.get(['urls'], function(result) {
            const storedUrls = result.urls ? result.urls.map(entry => entry.url) : [];

            if (storedUrls.includes(currentUrl)) {
                alert('This URL is already added to the database!');
            } else {
                const newEntry = {
                    title: currentTitle,
                    url: currentUrl,
                    timestamp: new Date().toISOString()
                };
                chrome.storage.local.set({ urls: [...result.urls, newEntry] });
            }
        });
    });
});




// Center button: Remove stored url
document.getElementById('center-button').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        const currentUrl = currentTab.url;
        console.log('currentUrl:', currentUrl);

        chrome.storage.local.get(['urls'], function(result) {
            var query_db = result.urls || [];

            const updatedUrls = query_db.filter(entry => entry.url !== currentUrl);
            
            chrome.storage.local.set({ urls: updatedUrls }, function() {
                console.log('Updated urls:', updatedUrls);
            });
        });
    });
});



// Right button: Open admin.html page
document.getElementById('right-button').addEventListener('click', function() {
	chrome.tabs.create({ url: 'admin.html' });
});

