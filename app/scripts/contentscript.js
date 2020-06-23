
function isBasicLiProfilePage() {
  return document.location.href.includes('linkedin.com/in/');
}

function isSnavProfilePage() {
  return document.location.href.includes('linkedin.com/sales/people/');
}

function sanitizeLIUrl(url) {
  var split_token = 'linkedin.com';
  var li_slug = url.split(split_token)[1];
  if (li_slug) {
    url = 'https://www.' + split_token + li_slug;
    return url;
  } else {
    return url;
  }
};

function formatUrl(url, delimiter) {
  if (url.includes('linkedin.com')) {
    url = url.split(delimiter)[0];
  } else {
    url = 'https://www.linkedin.com' + url.split(delimiter)[0];
  }
  return url;
};



function parseBasicLiProfilePage(message) {
  chrome.extension.sendRequest({
    title: 'visitAndReturnHtmlApi', api_key: message.api_key, profileLink: location.href
  }, function (response) {
    $('.pv-skills-section__additional-skills').click();
    var profile = {};
    profile = parseContactCodeTag(response.html);
    getSocialProfileUrl(message, profile);

  });
}

function getSocialProfileUrl ( message , profile) {
  chrome.extension.sendRequest({
    title: 'getSocialProfileUrl',api_key: message.api_key, profile: profile
  }, function (response) {
    profile = {...profile,response}
    validateAndDisplayProfile(profile, message);
  });
}



function parseSnavProfilePage(message) {
  var profile = {};
  $('html, body').animate({ scrollTop: $(document).height() }, 1000);
  setTimeout(() => {
    profile.name = $('.profile-topcard-person-entity__name').text().trim();
    profile.headline = $('.profile-topcard-person-entity__content .vertical-align-top .mt2').text().trim();
    profile.location = $('.profile-topcard__location-data').text().trim();
    profile.profile_url = document.location.href;
    profile.headline_ui = profile.headline ? ellipsis(profile.headline) : '-';
    profile.current_post_title = $('.profile-topcard__current-positions .profile-topcard__summary-position-title').text().trim();
    profile.current_company = $('.profile-topcard__current-positions .li-i18n-linkto').text().trim();
    profile.current_post_duration = $('.profile-topcard__current-positions .profile-topcard__time-period-bullet').text().trim();
    profile.count = 1;
    validateAndDisplayProfile(profile, message);
  }, 1500);
}

function validateAndDisplayProfile(profile, message,) {
  chrome.extension.sendRequest({
    title: 'sendParsedProfileToBackground', profile: profile,
    is_profile_valid: true, tabId: message.tabId, isSearchCard: true
  });
}

chrome.extension.onMessage.addListener(function (message, sender, sendResponse) {
  switch (message.title) {
    case 'displayExtension':
      if ($('#aviahire-ce-frame').length) {
        $('#aviahire-ce-frame').toggle();
      } else {
        var iframe = document.createElement('iframe');
        iframe.id = 'aviahire-ce-frame';
        iframe.src = chrome.runtime.getURL('app.html');
        iframe.style.cssText = 'position:fixed;top:0;bottom:0;right:0;display:block;width:480px;height:100%;z-index:99999;-moz-box-shadow: rgba(0, 0, 0, 0.298039) 7px -6px 10px 10px; -webkit-box-shadow: rgba(0, 0, 0, 0.298039) 7px -6px 10px 10px;box-shadow: rgba(0, 0, 0, 0.298039) 7px -6px 10px 10px;';
        iframe.name = JSON.stringify({ tabId: message.tab.id, tabUrl: message.tab.url, liCSRF: message.liCSRF });
        document.body.appendChild(iframe);
      }
      break;
    case 'parseContactHTML':
      if (isBasicLiProfilePage()) {
        parseBasicLiProfilePage(message);
      } else if (isSnavProfilePage()) {
        parseSnavProfilePage(message);
      } else {
        alert('Invalid Html Page!')
      };
      break;
    default:
      break;
  }
});

function ellipsis(headline) {
  if (headline.length > 30) {
    return `${headline.slice(0, 24)}...`;
  } else {
    return headline;
  }
}

function parseContactCodeTag(rootNodeHtml) {
  rootNode = $(new DOMParser().parseFromString(rootNodeHtml, "text/html"));
  var params = { basic_info: [{}] };
  var profileJson = (rootNode.find("code:contains('geoLocation\"')")[0] || {}).innerHTML
  profileJson = profileJson && JSON.parse(profileJson);
  let fieldObject = null;
  if (profileJson) {
    fieldObject = profileJson.included.find(x => x.$type === "com.linkedin.voyager.dash.identity.profile.Profile" && x.objectUrn);
  }

  if (fieldObject) {
    let first_name = $.trim(decodeAmp(`${fieldObject.firstName || ''}`));
    let last_name = $.trim(decodeAmp(`${fieldObject.lastName || ''}`));
    params.basic_info[0].name = `${first_name} ${last_name}`;
    params.basic_info[0].headline = decodeAmp(fieldObject.headline);
    params.basic_info[0].location = decodeAmp(fieldObject.locationName);
    params.basic_info[0].country_code = fieldObject.location ? fieldObject.location.countryCode : '';
    let industryInfo = '';
    if (fieldObject.industryUrn) {
      industryInfo = profileJson.included.filter(function (x) { return x.entityUrn === fieldObject.industryUrn });
      params.basic_info[0].industry = industryInfo.length ? decodeAmp(industryInfo[0].name) : '';
    }
    params.basic_info[0].li_guid = (fieldObject.entityUrn.match(/urn:li:fsd_profile:(.*)/) || [])[1];
    params.summary = [decodeAmp(fieldObject.summary)];

    let li_member_id = null;
    if (fieldObject.objectUrn.match(/urn:li:member:(.*)/)[1]) {
      li_member_id = fieldObject.objectUrn.match(/urn:li:member:(.*)/)[1];
      params.basic_info[0].li_member_id = li_member_id;
    }
  }

  if (fieldObject && fieldObject.publicIdentifier) {
    var publicIdentifier = fieldObject.publicIdentifier;
    params.linkedin_url = `https:/\/www.linkedin.com/in/${publicIdentifier}`;
    let tabUrlUserId = (document.location.href.match(/https:\/\/www.linkedin.com\/in\/(.*)\//) || [])[1];
    if (tabUrlUserId && fieldObject.publicIdentifier !== decodeURIComponent(tabUrlUserId)) {
      // callback({ isRefreshRequired: true }); return;
    }
  } else {
    if (is_individual_profile) {
      // callback({ isRefreshRequired: true }); return;
    } else {
      // callback({ isInvalidUrl: true }); return;
    }
  }

  // profile image.
  if (fieldObject.profilePicture) {
    var vector = fieldObject.profilePicture.displayImageReference.vectorImage;
    var imageUrl = vector.rootUrl + vector.artifacts[0].fileIdentifyingUrlPathSegment;
    params.basic_info[0].image_url = decodeAmp(imageUrl);
  }

  // skills
  if ($('li.pv-skill-entity .pv-skill-entity__skill-name').length) { 
    let skills = [];
    $('li.pv-skill-entity .pv-skill-entity__skill-name').each(function () { 
      skills.push($(this).text());
    });
    params.skills = [skills];
  } else {
    let skills = profileJson.included.filter(function (x) { return x.$type == 'com.linkedin.voyager.dash.identity.profile.Skill' });
    params.skills = [skills.map(function (skill) { return decodeAmp(skill.name); })];
  }
  return params;
}

function decodeAmp(data) {
  return (data || "").replace(/&amp;/g, '&');
};