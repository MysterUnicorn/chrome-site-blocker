# chrome-site-blocker
Chrome extension to block sites. Please note, it is an untested Proof of Concept.

## How to use?
1) Add to your browser.
2) Visit the Option Page. 
3) Add pages to the block pages table. -- These pages are going to be redirected to google.com.
4) Add elements to the block elements table. A page regex and a *CSS selector* are expected. 
    For example `*youtube.com/watch*` and `div#related`. 
    This will block youtube video recommendations.

If you add the entry `facebook.com/shorts` to the site blocker table, then any site containing the substring will be navigated to `google.com`.
Do not add `google.com` to the site blocker table, otherwise you end up in a loop.

## How are sites blocked works?
Options page creates entries to `chrome.declarativeNetRequest`'s dynamic rules. 

`chrome.declarativeNetRequest`'s rules are not always abided by unorthodox page navigation mechanisms
SPA's often use such mechanisms for navigation. 
The extension wraps most of these mechanisms (`location.hash`, `history.back`, `history.pushState`, `history.replaceState` and youtube's own navigation mechanism), and filters the requests against the list in `chrome.declarativeNetRequest`.

In order to get the list in the page's context, we have to perform following message passing:
```
page -> content script -> background worker -> content script -> page.
```

This is needed because:

1. These changes can only be detected on the page.
2. Only the background worker and popup / settings page have access to the `chrome.declarativeNetRequest` API.
3. The content scrip is a nice relay between the two. 

The communication channels used between the js contexts:

- page & content script -> `document.dispatchEvent` API,
- content script & background worker -> `chrome.runtime.sendMessage` API.


## How are elements blocked?

The same message passing mechanism is used as for site blocking. 

The chrome.storage.local API used to store the elements we want to conceal. 

A MutationObserver is checking particular elements' presence on the page.

Currently, elements are concealed by `style.display = "none"`.