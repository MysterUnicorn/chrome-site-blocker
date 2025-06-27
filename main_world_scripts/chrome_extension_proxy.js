class ChromeExtensionProxy {
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
    return await this.sendRequest('getDynamicRules');
  }
  async updateDynamicRules(options) {
    return await this.sendRequest('updateDynamicRules', options);
  }
  async getFromStorage(keys) {
    return await this.sendRequest('storageGet', keys );
  }
}

window.chromeExtensionProxy = new ChromeExtensionProxy();