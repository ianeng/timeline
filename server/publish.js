EventEntries = new Meteor.Collection('EventEntries');
Cases = new Meteor.Collection('Cases'); 

Meteor.publish("timelineData", function (caseID) {
  	check(caseID, String);
	var userEmail = Meteor.users.findOne({ _id: this.userId }).emails[0].address;

  	if (Cases.find({ _id: caseID, $or: [ { invited: userEmail }, { owner: userEmail } ]}).count() > 0) {
 		return [
   	 		EventEntries.find({ caseID: caseID }),
    		Cases.find({ _id: caseID })
  		]
  	} else {
  		return 
  	}

});

Meteor.publish("caseList", function () {
  var userEmail = Meteor.users.findOne({ _id: this.userId }).emails[0].address;
  return Cases.find({ $or: [ { invited: userEmail }, { owner: userEmail } ] });
});
