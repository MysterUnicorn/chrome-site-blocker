# chrome-site-blocker
Chrome extension to block sites. Please note, it is an untested Proof of Concept.

## How to use?
1) add to your browser
2) visit the Option Page 
3) add / remove entries

If you add the entry `facebook.com/shorts`, then any site containing the substring will be navigated to `google.com`.
Do not add `google.com` to the loop, otherwise you end up in a loop.

## How it works?
Options page creates entries to `chrome.declarativeNetRequest`'s dynamic rules. 

`chrome.declarativeNetRequest`'s rules are not always abided by unorthodox page navigation mechanisms
SPA's often use such mechanisms for navigation. 
The extension wraps most of these mechanisms (`location.hash`, `history.back`, `history.pushState`, `history.replaceState` and youtube's own navigation mechanism), and filters the requests against the list in `chrome.declarativeNetRequest`.

In order to get the list in the page's context, we have to perform following message passing:
```
page -> content script -> background worker -> content script -> page.
```

This is needed because:

1. these changes can only be detected on the page
2. only the background worker and popup / settings page have access to the `chrome.declarativeNetRequest` API.
3. the content scrip is a nice relay betwan the two. 

The communication channels used between the js contexts:

- page & content script -> `document.dispatchEvent` API,
- content script & background worker -> `chrome.runtime.sendMessage` API.
