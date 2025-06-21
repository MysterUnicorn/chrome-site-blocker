// content.js
console.log('Content script loading...');

// Listen for messages from main world (via custom DOM events)
document.addEventListener('chrome-extension-request', (event) => {
  const { action, payload, requestId } = event.detail;
  
  console.log('Content script received request:', { action, payload, requestId });
  
  // Forward the request to background script using callback pattern
  chrome.runtime.sendMessage({
    action,
    payload,
    requestId
  }, (response) => {
    // Check for runtime errors
    if (chrome.runtime.lastError) {
      console.error('Content script runtime error:', chrome.runtime.lastError);
      
      document.dispatchEvent(new CustomEvent('chrome-extension-response', {
        detail: {
          success: false,
          error: chrome.runtime.lastError.message,
          requestId
        }
      }));
      return;
    }
    
    console.log('Content script received response:', response);
    
    // Send response back to main world
    document.dispatchEvent(new CustomEvent('chrome-extension-response', {
      detail: response
    }));
  });
});

// Inject the redirect_interceptor script
const script = document.createElement('script');
const url = chrome.runtime.getURL('redirect_interceptor.js');

console.log('Injecting redirect_interceptor from:', url);

script.src = url;

script.onload = () => {
  console.log('✅ redirect_interceptor.js loaded successfully');
  script.remove();
};

script.onerror = (error) => {
  console.error('❌ Failed to load redirect_interceptor.js:', error);
};

(document.head || document.documentElement).appendChild(script);


console.log('Extension content script loaded and ready');