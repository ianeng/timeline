 Router.map(function() {
  this.route('home', {
    path: '/',
    waitOn: function () { 
      Session.set("currentPage", "home");
      return Meteor.subscribe("caseList"); 
    }
  });
  this.route('timelineTemp', {
    path: '/timeline/:_id',
    waitOn: function () { return Meteor.subscribe('timelineData', this.params._id); },
    data: function() { 
      Session.set("currentPage", "timeline");
      Session.set("caseID", this.params._id);
      Session.set("controlKitShow", false);
      return Cases.findOne({_id: this.params._id}); 
    },
    notFoundTemplate: 'loading' 
    
  });
});

Router.configure({
  load: function () {
    $('html').hide().fadeIn('2000');
  }
  // loadingTemplate: 'loading'
});