function authTenant() {
  var tenant = document.getElementById("exampleTenant").value;
  chrome.extension.sendRequest(
    { title: "tenantAuth", tenant: tenant },
    function (response) {
      if (response.tenant != "invalid") {
        baseURL = `https://${tenant}.aviahire.com/`;
        setBaseURL();
        $("#exampleInputEmail1").removeAttr("disabled");
        $("#exampleInputPassword1").removeAttr("disabled");
        $("#AH-signin-btn").removeAttr("disabled");
        $("#exampleTenant").attr("disabled", "disabled");
        $("#AH-tenant-btn").attr("disabled", "disabled");
      }
    }
  );
}

function authLogin() {
  var email = document.getElementById("exampleInputEmail1").value;
  var password = document.getElementById("exampleInputPassword1").value;
  chrome.extension.sendRequest(
    { title: "loginAuth", email: email, password: password },
    function (response) {
      if ($("#show-profile").is(":visible")) {
        showResultScreen();
      } else {
        $("#show-profile").show();
      }
      $("#show-login").hide();
      if ($("#show-logout").is(":visible")) {
        showLogout();
      } else {
        $("#show-logout").show();
      }
      setUser();
      $("#exampleInputEmail1").attr("disabled", "disabled");
      $("#exampleInputPassword1").attr("disabled", "disabled");
      $("#AH-signin-btn").attr("disabled", "disabled");
      $("#exampleTenant").removeAttr("disabled");
      $("#AH-tenant-btn").removeAttr("disabled");
    }
  );
}

function authLogout() {
  chrome.extension.sendRequest({ title: "logoutAuth" }, function (response) {
    removeUser();
    if ($("#show-login").is(":visible")) {
      showLogin();
    } else {
      $("#show-login").show();
    }
    $("#show-profile").hide();
    $("#show-logout").hide();
  });
}
