function trackElementPresence(selector, onAppear, onDisappear) {
  let isPresent = !!document.querySelector(selector);

  const observer = new MutationObserver(() => {
    element = document.querySelector(selector);
    const currentlyPresent = !!element && element.style.display !== "none";

    if (currentlyPresent && !isPresent) {
      isPresent = true;
      onAppear(document.querySelector(selector));
    } else if (!currentlyPresent && isPresent) {
      isPresent = false;
      onDisappear();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial state callback
  if (isPresent) {
    onAppear(document.querySelector(selector));
  }

  // Return a stop function in case you want to disconnect later
  return () => observer.disconnect();
}

function siteMatchesRule(rule) {
    return new RegExp(rule.site.replace(/\*/g, '.*')).test(window.location.hostname);
}



function waitForProxyAndRun(callback) {
  if (window.chromeExtensionProxy) {
    callback();
  } else {
    setTimeout(() => waitForProxyAndRun(callback), 50);
  }
}

function waitForBodyAndRun(callback) {
  if (document.body) {
    callback();
  } else {
    setTimeout(() => waitForBodyAndRun(callback), 50);
  }
}

waitForProxyAndRun(() => {
    window.chromeExtensionProxy.getFromStorage("concealedElements").then((rules) => {
        console.log("🔍 Concealed Elements Rules Loaded:", rules);
        filteredRules = Object.values(rules["concealedElements"] || {}).filter(rule => rule.site && rule.selector && siteMatchesRule(rule));
        console.log("🔍 Filtered Concealed Elements Rules:", filteredRules);

        filteredRules.forEach(rule => {
            if (rule.selector) {
                waitForBodyAndRun(() => {
                    trackElementPresence(
                        rule.selector, 
                        (element) => {
                            console.log(`🔍 Concealing element: ${rule.selector} on ${rule.site}`);
                            console.log("🔍 Element found:", element);
                            element.style.display = "none";
                        },
                        () => {
                            console.log(`🔍 Element out of viewport: ${rule.selector} on ${rule.site}`);
                        }
                    );
                })
            }
        });

    })
});

