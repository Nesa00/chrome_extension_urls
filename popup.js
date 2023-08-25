chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var currentTab = tabs[0];
    var url = currentTab.url;

    // Left button: Alert the URL of the current page
    document.getElementById('left-button').addEventListener('click', function() {
        alert('URL of current page: ' + url);

        // Save the URL to local storage
        chrome.storage.local.get({ urls: [] }, function(result) {
            var urls = result.urls;
            urls.push(url);
            chrome.storage.local.set({ urls: urls }, function() {
                console.log('URL saved:', url);
            });
        });
    });

    // Right button: Alert the content of local storage
	document.getElementById('right-button').addEventListener('click', function() {
		chrome.storage.local.get({ urls: [] }, function(result) {
			var urls = result.urls;
			alert('Stored URLs:\n' + urls.join('\n'));
		});
	});
});

