// Example code for content.js
chrome.runtime.sendMessage({url: window.location.href}, function(response) {
  // Handle response from background.js if needed
});
