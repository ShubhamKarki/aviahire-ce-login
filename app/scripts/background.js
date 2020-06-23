chrome.runtime.onInstalled.addListener(function () {
  // var hostSuffix = baseURL.match(/https:\/\/(.*)\/api\/v0/)[1];
  var hostSuffix = 'localhost:3000' ;
  console.log(hostSuffix);
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: "linkedin.com" },
          }),
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostSuffix: hostSuffix },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});

chrome.pageAction.onClicked.addListener(function (tab) {
  chrome.cookies.get(
    { url: "https://www.linkedin.com/", name: "JSESSIONID" },
    function (cookie) {
      chrome.tabs.sendMessage(tab.id, {
        title: "displayExtension",
        tab: tab,
        liCSRF: (cookie || {}).value,
      });
    }
  );
});

chrome.extension.onRequest.addListener(function (message, sender) {
  switch (message.title) {
    case "parseContactProfile":
      chrome.tabs.sendMessage(message.tabId, {
        title: "parseContactHTML",
        tabUrl: message.tabUrl,
        api_key: message.api_key,
        tabId: message.tabId,
        liCSRF: message.liCSRF,
      });
      break;
    case "sendParsedProfileToBackground":
      chrome.tabs.sendMessage(message.tabId, {
        title: "displayParsedProfile",
        content: message.profile,
        is_profile_valid: message.is_profile_valid,
      });
      break;
    default:
      break;
  }
});

// For API calls
chrome.extension.onRequest.addListener(function (
  message,
  sender,
  sendResponse
) {
  switch (message.title) {
    case "saveContacts":
      sendResponse(message.payload);
      break;
    case "fetchLists":
      sendResponse([
        { name: "Basic Li", id: 1 },
        { name: "Sales nav", id: 2 },
      ]);
      break;
    case "visitAndReturnHtmlApi":
      var profileLink = message.profileLink;
      $.ajax({
        type: "GET",
        url: profileLink,
      })
        .done(function (response) {
          sendResponse({ html: response, profileLink: profileLink });
        })
        .error(function ($xhr) {
          if ($xhr.status == 999) {
            sendResponse({
              html: "invalid",
              isBlocked: true,
              profileLink: profileLink,
            });
          } else {
            if ($xhr.status == 404) {
              sendResponse({
                html: "invalid",
                isBlocked: false,
                isInvalidUrl: true,
                profileLink: profileLink,
              });
            } else {
              sendResponse({ html: "invalid", profileLink: profileLink });
            }
          }
        });
      break;

    case "getSocialProfileUrl":
      $.ajax({
        type: "POST",
        url: "https://polar-brook-70148.herokuapp.com/search",
        data: JSON.stringify({
          name: message.profile.basic_info[0].name,
          profile_url: message.profile.linkedin_url,
          location: message.profile.basic_info[0].location,
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
      }).done(function (response) {
        sendResponse(response);
      });

      break;
    case "tenantAuth":
      url = `https://test.aviahire.com/api/tenant/exist/${message.tenant}`;
      $.ajax({
        type: "GET",
        url: url,
      })
        .done(function (response) {
          sendResponse(response);
        })
        .error(function ($xhr) {
          {
            sendResponse({ tenant: "invalid" });
          }
        });
      break;
    case "loginAuth":
      $.ajax({
        type: "POST",
        url: `https://124f44b260ea.ngrok.io/api/ce/login`,
        data: JSON.stringify({
          "email": message.email,
          "password": message.password,
        }),
        contentType: "application/json; charset=utf-8",
        
      })
        .done(function (response) {
          sendResponse(response);
        })
        .error(function ($xhr) {
          {
            sendResponse({ auth: "invalid" });
          }
        });

      break;
    case "logoutAuth":
      $.ajax({
        type: "POST",
        url: `${baseURL}admin/logout`,
      })
        .done(function (response) {
          sendResponse(response);
        })
        .error(function ($xhr) {
          {
            sendResponse({ auth: "invalid" });
          }
        });
      break;
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, currentTab) {
  if (
    currentTab.status == "complete" &&
    changeInfo.status == "complete" &&
    currentTab.url != undefined
  ) {
    if (tabId === currentTab.id) {
      setTimeout(function () {
        chrome.tabs.sendMessage(tabId, { title: "refreshPage" });
      }, 3000);
    }
  }
});
