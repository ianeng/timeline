EventEntries = new Meteor.Collection('EventEntries');
Cases = new Meteor.Collection('Cases'); 

Meteor.publish("timelineData", function (caseID) {
  check(caseID, String);
  return [
    EventEntries.find({ caseID: caseID }),
    Cases.find({ _id: caseID })
  ]
});

Meteor.publish("caseList", function () {
  var userEmail = Meteor.users.findOne({ _id: this.userId }).emails[0].address
  return Cases.find({ $or: [ { invited: userEmail }, { owner: userEmail } ] });
});
