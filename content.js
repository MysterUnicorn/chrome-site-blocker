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

scriptsToInject = [
  'main_world_scripts/chrome_extension_proxy.js',
  'main_world_scripts/element_concealer.js',
  'main_world_scripts/redirect_interceptor.js'
];

scriptsToInject.forEach(scriptName => {

  const script = document.createElement('script');
  const url = chrome.runtime.getURL(scriptName);

  console.log('Injecting script from:', url);

  script.src = url;

  script.onload = () => {
    console.log(`✅ ${scriptName} loaded successfully`);
    script.remove();
  };

  script.onerror = (error) => {
    console.error(`❌ Failed to load ${scriptName}: `, error);
  };

  (document.head || document.documentElement).appendChild(script);  

});

console.log('Extension content scripts loaded and ready');