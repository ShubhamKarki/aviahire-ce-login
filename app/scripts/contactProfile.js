function saveContacts(data, listId) {
  var params = { contacts: data, list_id: listId };
  chrome.extension.sendRequest({ title: 'saveContacts', payload: params }, function (response) {
    $('#results-screen').hide();
    $('#show-success').show();
    $('#leads-count').text(response.contacts.length);
    $('#leads-email').text(response.contacts.length);
    var selectNode = $('#selected-limit');
    var selectedListName = selectNode.children("option:selected").text().trim();
    $('#list-name').text(selectedListName);
  });
}

function getList() {
  chrome.extension.sendRequest({ title: 'fetchLists' }, function (response) {
    // showListSelectBox(response);
  });
}