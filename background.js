// Background script - handles Chrome API calls
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  // Handle async operations properly
  (async () => {
    try {
      switch (message.action) {
        case 'getDynamicRules':
          const rules = await chrome.declarativeNetRequest.getDynamicRules();
          sendResponse({ 
            success: true, 
            data: rules,
            requestId: message.requestId 
          });
          break;
          
        case 'updateDynamicRules':
          await chrome.declarativeNetRequest.updateDynamicRules(message.payload);
          sendResponse({ 
            success: true, 
            data: null,
            requestId: message.requestId 
          });
          break;
          
        case 'storageGet':
          console.log('Storage get keys:', message.payload);
          chrome.storage.local.get(message.payload, (result) => {
            console.log('Storage get result:', result);
            if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError.message, requestId: message.requestId });
            } else {
              sendResponse({ success: true, data: result, requestId: message.requestId });
            }
          });
          break;

          
        default:
          sendResponse({ 
            success: false, 
            error: `Unknown action: ${message.action}`,
            requestId: message.requestId 
          });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ 
        success: false, 
        error: error.message,
        requestId: message.requestId 
      });
    }
  })();
  
  return true; // Keep message channel open for async response
});