// redirect_interceptor.js
console.log('🚀 redirect_interceptor.JS EXECUTING');




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
    const rules = await window.chromeExtensionProxy.getDynamicRules();
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
      const rules = await window.chromeExtensionProxy.getDynamicRules()
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
      const rules = await window.chromeExtensionProxy.getDynamicRules()
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