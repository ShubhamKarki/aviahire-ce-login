(function ($) {
  $(document).ready(function () {
    $body = $(document.body);
    $window = $(window);
    window.responseGot = 0;
    _.templateSettings.variable = "rc";
    loadDefaultData();
  });
})(jQuery);

function loadDefaultData() {
  loadUser();
  getList();
}

function loadUser() {
  chrome.storage.local.get(["user", "baseURL"], function (data) {
    var user = data.user;
    if (user == null) {
      showLogin();
    } else {
      showResultScreen();
      showLogout();
      baseURL = data.baseURL;
    }
  });
}

function showResultScreen() {
  var tab = JSON.parse(window.name);
  var tabId = tab.tabId;
  $("div").scrollTop(0);

  chrome.extension.sendRequest({
    title: "parseContactProfile",
    tabId: tabId,
    tabUrl: tab.tabUrl,
    liCSRF: tab.liCSRF,
  });
}

function showParsedProfile(profileData) {
  var profileCard = _.template($("#parsedProfileSection").html())({
    profile: profileData,
  });
  $("#show-profile").append(profileCard);
}

function showLogin() {
  var login = _.template($("#AhAppLogin").html());
  $("#show-login").append(login);
}

function showLogout() {
  var logout = _.template($("#AhAppLogout").html());
  $("#show-logout").append(logout);
}

chrome.extension.onMessage.addListener(function (
  message,
  sender,
  sendResponse
) {
  switch (message.title) {
    case "displayParsedProfile":
      showParsedProfile(message.content); //TODO
      break;
    case "refreshPage":
      // $('#show-profile').text('');
      // showResultScreen();
      break;
    default:
      break;
  }
});

$(document).on("click", "#AH-tenant-btn", function (event) {
  event.preventDefault();
  authTenant();
});

$(document).on("click", "#AH-signin-btn", function (event) {
  event.preventDefault();
  authLogin();
});

$(document).on("click", "#AH-logout-btn", function (event) {
  authLogout();
});

$(document).on("click", "#save-contact", function (event) {
  event.preventDefault();
  var contacts = [];
  $('input[class="contacts"]:checked').each(function () {
    contacts.push(JSON.parse(this.value));
  });
  contacts.length
    ? saveContacts(contacts, $("#selected-limit").val())
    : alert("No contacts To Save!");
});

// function showListSelectBox(lists) {
//   var limit_template = _.template($('#listDropdown').html());
//   $('#selected-limit').remove();
//   if (!($('#selected-limit').length)) {
//     $('#listSelectBox').append(limit_template({ lists: lists, selectedList: lists[0] }));
//   }
// }

$(document).on("change", "#select-all", function (event) {
  if ($(this).is(":checked")) {
    $("input:checkbox.contacts").each(function () {
      $(this).prop("checked", true);
    });
  } else {
    $("input:checkbox.contacts").each(function () {
      $(this).prop("checked", false);
    });
  }
});

function setUser() {
  chrome.storage.local.set({ user: { name: "amit", role: "admin" } });
}
function setBaseURL() {
  chrome.storage.local.set({ baseURL: baseURL });
}

function removeUser() {
  chrome.storage.local.remove(["user"], function () {
    var error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
    }
  });
}
