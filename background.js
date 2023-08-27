function updateBadgeForUrl(tabUrl, tabId) {
    chrome.storage.local.get(['urls'], function(result) {
        const storedUrls = result.urls.map(entry => entry.url);
        
        if (storedUrls.includes(tabUrl)) {
            // URL is in the database
            chrome.action.setBadgeText({text: 'URL', tabId: tabId});
            chrome.action.setBadgeBackgroundColor({color: '#28B463', tabId: tabId}); // Green color
        } else {
            // URL is not in the database
            chrome.action.setBadgeText({text: 'URL', tabId: tabId});
            chrome.action.setBadgeBackgroundColor({color: '#FF0000', tabId: tabId}); // Red color
        }
    });
}
chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        if (key === 'urls' && namespace === 'local') {
            // If there's a change in the stored URLs, update the badge for the current tab.
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                const currentTab = tabs[0];
                updateBadgeForUrl(currentTab.url, currentTab.id);
            });
        }
    }
});
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        updateBadgeForUrl(tab.url, tabId);
    }
});

// Function to check URL storage after timeout
function checkURLAfterTimeout(url, timeoutMinutes) {
    setTimeout(function() {
        chrome.storage.local.get(['urls'], function(data) {
            const storedURLs = data.urls || [];
            const urlExists = storedURLs.some(entry => entry.url === url);
            if (urlExists) {
                chrome.notifications.create('urlNotification', {
                    type: 'basic',
                    iconUrl: 'icon.png', // Your extension icon or any other relevant icon
                    title: 'URL Timeout',
                    message: 'This URL has been stored longer than the set timeout!'
                });
            }
        });
    }, timeoutMinutes * 60 * 1000);
}

// When a URL is saved, start the timer
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.urls && changes.urls.newValue) {
        const newURL = changes.urls.newValue[changes.urls.newValue.length - 1].url;
        
        chrome.storage.local.get(['userTimeout'], function(data) {
            if (data.userTimeout && data.userTimeout > 0) {
                checkURLAfterTimeout(newURL, data.userTimeout);
            }
        });
    }
});

function removeUrl(url) {
    chrome.storage.local.get('urls', function(data) {
        var urls = data.urls || [];
        var index = urls.findIndex(entry => entry.url === url);
        if (index !== -1) {
            urls.splice(index, 1);
            chrome.storage.local.set({urls: urls});
        }
    });
}
