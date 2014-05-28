Meteor.methods({
  checkTag: function (tagName, caseID) {
    EventEntries.update( { caseID: caseID, eventTags: tagName }, { $set: { checked: true } }, { multi: true } ) 
    return true;
  }, 
  uncheckTag: function (tagName, caseID) {
  	EventEntries.update( { caseID: caseID, eventTags: tagName }, { $set: { checked: false } }, { multi: true } ) 
  	return true;
  }, 
  checkAll: function (caseID) {
  	EventEntries.update( { caseID: caseID }, { $set: { checked: true } }, { multi: true } ) 
  	return true;
  },
  uncheckAll: function (caseID) {
  	EventEntries.update( { caseID: caseID }, { $set: { checked: false } }, { multi: true } ) 
  	return true;
  },
	getEmailFromID: function () {
  	// var userEmail = Meteor.users.find({ _id: userID });
  	return "Test";
	}
});