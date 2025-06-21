// redirect_interceptor.js
console.log('🚀 redirect_interceptor.JS EXECUTING');

class ChromeExtensionAPI {
  constructor() {
    this.pendingRequests = new Map();
    this.requestIdCounter = 0;
    
    // Listen for responses from content script
    document.addEventListener('chrome-extension-response', (event) => {
      this.handleResponse(event.detail);
    });
  }
  
  generateRequestId() {
    return `req_${++this.requestIdCounter}_${Date.now()}`;
  }
  
  async sendRequest(action, payload = null) {
    const requestId = this.generateRequestId();
    
    return new Promise((resolve, reject) => {
      // Store the promise callbacks
      this.pendingRequests.set(requestId, { resolve, reject });
      
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout for action: ${action}`));
      }, 10000); // 10 second timeout
      
      // Update the stored callbacks to clear timeout
      const callbacks = this.pendingRequests.get(requestId);
      callbacks.timeout = timeout;
      
      // Send request to content script
      document.dispatchEvent(new CustomEvent('chrome-extension-request', {
        detail: { action, payload, requestId }
      }));
    });
  }
  
  handleResponse(response) {
    const { requestId, success, data, error } = response;
    
    if (!this.pendingRequests.has(requestId)) {
      console.warn('Received response for unknown request:', requestId);
      return;
    }
    
    const { resolve, reject, timeout } = this.pendingRequests.get(requestId);
    clearTimeout(timeout);
    this.pendingRequests.delete(requestId);
    
    if (success) {
      resolve(data);
    } else {
      reject(new Error(error));
    }
  }
  
  // Chrome declarativeNetRequest API methods
  async getDynamicRules() {
    return this.sendRequest('getDynamicRules');
  }
  
  async updateDynamicRules(options) {
    return this.sendRequest('updateDynamicRules', options);
  }
}

window.chromeExtensionAPI = new ChromeExtensionAPI();


function checkForRedirect(rules, currentUrl) {
  console.log('🔍 Checking redirect for URL:', currentUrl);
  console.log('📋 Available rules:', rules.length);

  for (const rule of rules) {
    if (rule.action && rule.action.type === 'redirect') {
      const condition = rule.condition;
      console.log(condition.urlFilter)
      // Check URL filter match
      if (condition.urlFilter) {
        const urlPattern = new RegExp(
          condition.urlFilter.replace(/\*/g, '.*').replace("||", ".*")
        );
        console.log(condition.urlFilter) 
        if (urlPattern.test(currentUrl)) {
          console.log('✅ Match found for rule:', rule.id);
          return {
            shouldRedirect: true,
            redirectUrl: rule.action.redirect.url || rule.action.redirect.regexSubstitution,
            rule: rule
          };
        }
      }

      // Check regex filter match
      if (condition.regexFilter) {
        const regex = new RegExp(condition.regexFilter);
        if (regex.test(currentUrl)) {
          console.log('✅ Regex match found for rule:', rule.id);
          
          let redirectUrl = rule.action.redirect.url;
          if (rule.action.redirect.regexSubstitution) {
            redirectUrl = currentUrl.replace(regex, rule.action.redirect.regexSubstitution);
          }
          
          return {
            shouldRedirect: true,
            redirectUrl: redirectUrl,
            rule: rule
          };
        }
      }
    }
  }

  console.log('❌ No redirect rule matches');
  return { shouldRedirect: false };
}


handleNavigation = async function(event) {
  console.log('🔄 Navigation event detected:', event.type);
  
  try {
    const rules = await window.chromeExtensionAPI.getDynamicRules();
    const currentUrl = window.location.href;
    console.log('📍 Current URL:', currentUrl);
    
    const redirectCheck = checkForRedirect(rules, currentUrl);
    
    if (redirectCheck.shouldRedirect) {
      console.log('🚀 Redirecting to:', redirectCheck.redirectUrl);
      window.location.href = redirectCheck.redirectUrl;
    }
  } catch (error) {
    console.error('❌ Error checking for redirects:', error);
  }

}

window.addEventListener('popstate', handleNavigation);
window.addEventListener('hashchange', handleNavigation);


(function() {
  if (window.historyWrapped) {
    console.log('History already wrapped, skipping');
    return;
  }
  window.historyWrapped = true;

  console.log('🎯 Setting up history redirect_interceptor with redirect logic'); 

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  // Async redirect_interceptor for pushState
  async function wrappedPushState(...args) {
    console.log('🔥 pushState intercepted:', args);
    
    try {
      // First call the original method
      const result = originalPushState.apply(this, args);
      
      // Get the new URL after pushState
      const newUrl = window.location.href;
      console.log('📍 New URL after pushState:', newUrl);
      
      // Get dynamic rules and check for redirect
      const rules = await window.chromeExtensionAPI.getDynamicRules()
      const redirectCheck = checkForRedirect(rules, newUrl);
      
      if (redirectCheck.shouldRedirect) {
        console.log('🚀 Redirecting to:', redirectCheck.redirectUrl);
        window.location.href = redirectCheck.redirectUrl;
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error in pushState wrapper:', error);
      // Fallback - just call original method
      return originalPushState.apply(this, args);
    }
  }

  // Async wrapper for replaceState
  async function wrappedReplaceState(...args) {
    console.log('🔥 replaceState intercepted:', args);
    
    try {
      // First call the original method
      const result = originalReplaceState.apply(this, args);
      
      // Get the new URL after replaceState
      const newUrl = window.location.href;
      console.log('📍 New URL after replaceState:', newUrl);
      
      // Get dynamic rules and check for redirect
      const rules = await window.chromeExtensionAPI.getDynamicRules()
      console.log(rules)
      const redirectCheck = checkForRedirect(rules, newUrl);
      
      if (redirectCheck.shouldRedirect) {
        console.log('🚀 Redirecting to:', redirectCheck.redirectUrl);
        window.location.href = redirectCheck.redirectUrl;
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error in replaceState wrapper:', error);
      // Fallback - just call original method
      return originalReplaceState.apply(this, args);
    }
  }

  // Replace the history methods
  history.pushState = wrappedPushState;
  history.replaceState = wrappedReplaceState;

  console.log('✅ History methods wrapped with redirect logic');

})();


// Listen to YouTube's custom navigation events
window.addEventListener('yt-navigate-start', function(event) {

  console.log('🔄 YouTube navigation started:', event.detail);
  handleNavigation(event);
});