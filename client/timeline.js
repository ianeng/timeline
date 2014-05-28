EventEntries = new Meteor.Collection('EventEntries');
Cases = new Meteor.Collection('Cases'); 



  Session.set("beginTimeline", new Date(1998, 04, 01));
  Session.set("endTimeline", new Date(2013, 06, 01));
  Session.set("controlKitShow", false);
  Session.set("yAxisOffset", 578);
  Session.set("entryDivWidth", 300);
  Session.set("divWidth", 300);

  Template.home.Cases = function () {
    return Cases.find({}, { sort: { _id: 1 }});
  }
  Template.home.events({
    'click #showCreateCaseModal': function () {
      if ($('#showCreateCaseModal').attr("data-function") == "addTimeline") {
        var timelineTitle = $('#newTimelineInput').val();
        check(timelineTitle, String);
        if (timelineTitle.length > 0) {
          Cases.insert({
            caseNameShort: timelineTitle,
            owner: Meteor.user().emails[0].address,
            invited: [],
            backColor: "#ffffff",
            dateColor: "#616161",
            lineColor: "#bababa",
            subtitleColor: "#7a9bc2",
            titleColor: "#0066ff",
            yAxisOffset: 400
          });
        }
        $('#showCreateCaseModal').animate({
          width: "99%"
        }, 300).html("<span class=\"glyphicon glyphicon-plus\"></span> New timeline").attr("data-function", "");
        $('#newTimelineInput').animate({
          opacity: 0,
          width: 0,
          padding: 0
        }, 100).val("");

      } else {
        $('#showCreateCaseModal').animate({
          width: 50
        }, 300).html("<span class=\"glyphicon glyphicon-plus\"></span>").attr("data-function", "addTimeline");
        $('#newTimelineInput').animate({
          opacity: 1,
          width: "82%",
          padding: 15
        }).focus();

      }
    }, 
    'click #removeCaseButton': function () {
      Session.set("removeCaseTitle", this.caseNameShort);
      Session.set("removeCaseID", this._id);

      $("#removeCaseModal").modal("show");
      },     
  });

  Template.timelineTemp.rendered = function () {
    newWindowSize();
  }

  Template.timeline.boxHeight = function () {
  	return Session.get("yAxisOffset") - 15;
  }

  Template.timeline.EventEntries = function () {
    return EventEntries.find({ checked: true, caseID: Session.get("caseID"), eventDate: {$gte: Session.get("beginTimeline"), $lt: Session.get("endTimeline")}}, { sort: { eventDate: 1 }});
  }

  Template.timeline.rendered = function () {
      $("#timelineBox").hover(function(){
        $("#editButton").stop().fadeIn("slow");
      },
      function(){
          $("#editButton").stop().fadeOut();
      });
  }

  Template.timeline.events({
      'click #editButton': function () {
          if (Session.get("controlKitShow")) {
              $( "#controlKit" ).fadeOut("slow");
              Session.set("controlKitShow", false);
              newWindowSize();
          } else {
            $( "#controlKit" ).fadeIn("slow");
            Session.set("controlKitShow", true);
            newWindowSize();
          }
      }
  });


  Template.timelineEvent.leftOffset = function () {
  	return dateToXPos(this.eventDate) + 30;
  }
  Template.timelineEvent.topOffset = function () {

 	var originalDate = this.eventDate;
  	var rsDate = dateOfRightSide(originalDate); 
  	var lsDate = dateOfLeftBuffer(originalDate);

	var entriesInDateRange = EventEntries.find({ checked: true, eventDate: {$gte: lsDate, $lt: rsDate }}, { sort: { eventDate: 1 }}).fetch(); 
	if (entriesInDateRange.length > 1 ) {
		var entriesAbove = EventEntries.find({ checked: true, eventDate: {$gte: lsDate, $lt: originalDate }}, { sort: { eventDate: 1 }}).fetch();
		var entriesBelow = EventEntries.find({ checked: true, eventDate: {$gte: originalDate, $lt: rsDate }}, { sort: { eventDate: 1 }}).fetch();
		var posPercent = (entriesAbove.length + 1) / (entriesAbove.length + entriesBelow.length + 1)
		var topOffset = posPercent * Session.get("yAxisOffset");
	} else {
		var topOffset = 0.5 * Session.get("yAxisOffset");
	}

    return topOffset;
  }

  Template.timelineEvent.divWidth = function () {
  	return Session.get("divWidth");
  }

  Template.timelineEvent.events({
    'click .timelineText': function () {
        Session.set("editEventTitle", this.eventTitle);
        Session.set("editSubTitle", this.subTitle);
        Session.set("editEventDate", this.eventDate);
        Session.set("editEventTags", this.eventTags);
        Session.set("editEventID", this._id);

        $("#editModal").modal("show");
    },
  });

  Template.timeline.axisLabels = function () {
    var startX = Session.get("beginTimeline");
    var endX = Session.get("endTimeline");

    var startDate = new Date();
    startDate.setFullYear(startX.getFullYear()+1, 0, 1);

    var divWidth = (dateDif(Session.get("beginTimeline"), startDate) * Session.get("scaleFactor"));

    var data = [{
            axisWidth: divWidth,
            axisYear: startX.getFullYear()
        }];

    var endDate = new Date();
    endDate.setFullYear(endX.getFullYear()-1, 11, 31);
      
    while (startDate < endDate) {
      var nextYear = new Date();
      nextYear.setFullYear(startDate.getFullYear()+1, 0, 1);
      var divWidth = (dateDif(nextYear, startDate) * Session.get("scaleFactor"));
      data.push({
        axisWidth: divWidth,
        axisYear: startDate.getFullYear()
      });
      startDate.setFullYear(startDate.getFullYear()+1, 0, 1);
    }

    var divWidth = (dateDif(startDate, Session.get("endTimeline")) * Session.get("scaleFactor")) - 10;
    if (divWidth > 0) {
        data.push({
        axisWidth: divWidth,
        axisYear: startDate.getFullYear()
      });
    }
    // data.push({
    //     axisWidth: divWidth,
    //     axisYear: startDate.getFullYear()
    //   });


    return data;

  }

 Template.newEventForm.rendered = function () {

  $('#datePicker').datepicker({
      startView: 2
    });
 }

  Template.newEventForm.events({
    'click .btn-default': function () {

      var eventTitle = document.getElementById('eventTitle');
      var subTitle = document.getElementById('subTitle');
      var datePicker = document.getElementById('datePicker');
      var tagsList = document.getElementById('tagsList');
      var tagArray = tagsList.value.split(", "); 

      var dateCleaned = new Date(datePicker.value);

      if (eventTitle.value != '') {
        EventEntries.insert({
          eventTitle: eventTitle.value,
          subTitle: subTitle.value,
          eventDate: dateCleaned,
          eventTags: tagArray,
          timeStamp: Date.now(), 
          checked: false,
          caseID: Session.get("caseID"), 
        });

        eventTitle.value = '';
        subTitle.value = '';
        datePicker.value = '';
        tagsList.value = '';

      }
    }
  });

  Template.EventList.Events = function () {
    return EventEntries.find({ caseID: Session.get("caseID") }, { sort: { eventDate: 1, timeStamp: 1 }})
  
  }
  Template.EventList.checked = function () {
    if (this.checked) {
      return "checked";
    } else {
      return "";
    }
  }

  Template.EventList.events({
      'click #editEntryButton': function () {
          Session.set("editEventTitle", this.eventTitle);
          Session.set("editSubTitle", this.subTitle);
          Session.set("editEventDate", this.eventDate);
          Session.set("editEventTags", this.eventTags);
          Session.set("editEventID", this._id);

          $("#editModal").modal("show");
      },
      'click #removeEntryButton': function () {
        Session.set("removeEventTitle", this.eventTitle);
        Session.set("removeEventID", this._id);

        $("#removeModal").modal("show");
      }, 
      'change .eventCheckbox': function(event) {
          if (event.target.checked) {
            EventEntries.update({_id: this._id}, { $set: { checked: true } });
          } else {
            EventEntries.update({_id: this._id}, { $set: { checked: false } });
          }
      }
    });

  Template.tagList.tags = function () {
  	var myArray = EventEntries.find({ caseID: Session.get("caseID") }).fetch();
  	var pluckedArray = _.pluck(myArray, 'eventTags');
  	var flattenedArray = _.flatten(pluckedArray);
  	return _.unique(flattenedArray);
  }
  Template.tagList.events({
    'click #addTagButton': function(event) {
    	if (this) {
        	Meteor.call("checkTag", this.toString(), Session.get("caseID"));
        }
    }, 
    'click #removeTagButton': function(event) {
    	if (this) {
        	Meteor.call("uncheckTag", this.toString(), Session.get("caseID"));
        }
    },
    'click #addAllButton': function(event) {
        Meteor.call("checkAll", Session.get("caseID"));
    }, 
    'click #removeAllButton': function(event) {
        Meteor.call("uncheckAll", Session.get("caseID"));
    },
    'click .tagName': function (event) {
    	console.log(this.toString());
    	Session.set("tagModalTag", this.toString());
    	$("#tagModal").modal("show");
    }
  });

  Template.settingsPane.yAxisOffset = function () {
    return Session.get("yAxisOffset");
  }
  Template.settingsPane.divWidth = function () {
    return Session.get("divWidth");
  }
  Template.settingsPane.entryDivWidth = function () {
    return Session.get("entryDivWidth");
  }

  Template.settingsPane.rendered = function () {
    $('#offsetSlider').slider({
      min: 400,
      max: 1000
    }).on('slide', function (slideEvt) {
      var slideVal = slideEvt.value;
      Cases.update({ _id: Session.get("caseID") }, { $set: { yAxisOffset: slideVal } });
    });
    $('#widthSlider').slider({
      min: 100,
      max: 500 
    }).on('slide', function (slideEvt) {
      var slideVal = slideEvt.value;
      Cases.update({ _id: Session.get("caseID") }, { $set: { entryDivWidth: slideVal } });
    });
    $('#divWidthSlider').slider({
      min: 100,
      max: 500
    }).on('slide', function (slideEvt) {
      var slideVal = slideEvt.value;
      Cases.update({ _id: Session.get("caseID") }, { $set: { divWidth: slideVal } });
    });
    $('#bgColor').colorpicker().on('changeColor', function(ev){
      Cases.update({ _id: Session.get("caseID") }, { $set: { backColor: ev.color.toHex() } });
      // $('body').css('background-color', ev.color.toHex() );
    });
    $('#lineColor').colorpicker().on('changeColor', function(ev){
      Cases.update({ _id: Session.get("caseID") }, { $set: { lineColor: ev.color.toHex() } });
    });
    $('#dateColor').colorpicker().on('changeColor', function(ev){
      Cases.update({ _id: Session.get("caseID") }, { $set: { dateColor: ev.color.toHex() } });
    });
    $('#titleColor').colorpicker().on('changeColor', function(ev){
      Cases.update({ _id: Session.get("caseID") }, { $set: { titleColor: ev.color.toHex() } });
    });
    $('#subtitleColor').colorpicker().on('changeColor', function(ev){
      Cases.update({ _id: Session.get("caseID") }, { $set: { subtitleColor: ev.color.toHex() } });
    });
  }

  Template.settingsPane.events({
    'click #slideOpenSettings': function () {
      if ($('#settingsButtonText').text() == "Show more") {
        $('#stylePicker').show("slow");
        $('#settingsButtonText').text("Show less");
      } else if ($('#settingsButtonText').text() == "Show less") {
        $('#stylePicker').hide("slow");
        $('#settingsButtonText').text("Show more");
      }
      // $('#stylePicker').toggle(function() {
      //     console.log("Open sesame")
      //     // $('#settingsButtonText').text("Show less");
      //   }, function() {
      //     console.log("closed")
      //     // $('#settingsButtonText').text("Show more");
      //   });
      // $('#slideOpenSettingsText').text("Show less");
    }, 
    'click #resetSettings': function () {
      Cases.update({ 
        _id: Session.get("caseID") 
      },{ 
        $set: {
          backColor: "#ffffff",
          dateColor: "#616161",
          lineColor: "#bababa",
          subtitleColor: "#7a9bc2",
          titleColor: "#0066ff",
          yAxisOffset: 400
        }
      });
    }
  });

  Template.usersPane.users = function () {
    return Cases.find({ _id: Session.get("caseID") })
  }
  Template.usersPane.events({
    'click #addUserButton': function () {
      if ($('#addUserButton').attr("data-function") == "addUser") {
        var inviteEmail = $('#inviteUserInput').val();
        check(inviteEmail, String);
        if (inviteEmail.length > 0) {
          Cases.update({ 
            _id: Session.get("caseID") 
          }, {
            $push: {
              invited: inviteEmail
            }
          });
        }
        $('#addUserButton').animate({
          width: "99%"
        }, 300).html("<span class=\"glyphicon glyphicon-plus\"></span> Invite user").attr("data-function", "");
        $('#inviteUserInput').animate({
          opacity: 0,
          width: "0%",
          padding: 0
        }, 100).val("");

      } else {
        $('#addUserButton').animate({
          width: "15%"
        }, 300).html("<span class=\"glyphicon glyphicon-plus\"></span>").attr("data-function", "addUser");
        $('#inviteUserInput').animate({
          opacity: 1,
          width: "80%",
          padding: 15
        }).focus();

      }
    }
  });


  Template.editModal.editEventTitle = function () {
    return Session.get("editEventTitle");
  }
  Template.editModal.editSubTitle = function () {
    return Session.get("editSubTitle");
  }
  Template.editModal.editEventDate = function () {
    return Session.get("editEventDate");
  }
  Template.editModal.editEventTags = function () {
  	var rawList = Session.get("editEventTags");
  	var tagString = "";
  	if (rawList) {
  		tagString = rawList.join(', ');
  	}
    return tagString;
  }
  Template.editModal.editEventID = function () {
    return Session.get("editEventID");
  }

  Template.editModal.rendered = function() {
    $('#editDatePicker').datepicker({startView: 2});
  }

  Template.editModal.events({
    'click #saveChanges': function () {

      
      var eventTitle = document.getElementById('editEventTitle');
      var subTitle = document.getElementById('editSubTitle');
      var datePicker = document.getElementById('editDatePicker');
      var tagsList = document.getElementById('editTagsList');
      var eventID = document.getElementById('editEventID');
      var tagsListVal = tagsList.value;
      var tagArray = $.map(tagsListVal.split(","), $.trim);
      var dateCleaned = new Date(datePicker.value);

      if (eventTitle.value != '') {
    
        EventEntries.update({_id: eventID.value}, 
          { $set: {
            eventTitle: eventTitle.value,
            subTitle: subTitle.value,
            eventDate: dateCleaned,
            eventTags: tagArray,
            timeStamp: Date.now()
          }
        });
        
        $("#editModal").modal("hide");
      }

    }
  });


  Template.removeModal.removeEventTitle = function () {
    return Session.get("removeEventTitle");
  }

    Template.removeModal.events({
    'click #confirmRemove': function () {
      EventEntries.remove(Session.get("removeEventID"));  
      $("#removeModal").modal("hide");
    }
  });

  Template.removeCaseModal.removeCaseTitle = function () {
    return Session.get("removeCaseTitle");
  }

    Template.removeCaseModal.events({
    'click #confirmRemove': function () {
      Cases.remove(Session.get("removeCaseID"));  
      $("#removeCaseModal").modal("hide");
    }
  });

	Template.tagModal.tagName = function () {
		return Session.get("tagModalTag");
	}

	Template.tagModal.Events = function () {
    	return EventEntries.find({ caseID: Session.get("caseID"), eventTags: Session.get("tagModalTag") }, { sort: { eventDate: 1, timeStamp: 1 }})
  	}

  	Template.tagModal.otherEvents = function () {
    	return EventEntries.find({ caseID: Session.get("caseID"), eventTags: { $not: Session.get("tagModalTag") } }, { sort: { eventDate: 1, timeStamp: 1 }})
  	}

  	Template.tagModal.events({
  		'click #removeFromTagButton': function (e) {
  			EventEntries.update( { _id: this._id }, { $pull: { eventTags: Session.get("tagModalTag") } });
  		},
  		'change #addEntryVal': function (e) {
  			
  			var selectedID = $( "select option:selected" ).val();
  			console.log(selectedID)

  			if (selectedID && selectedID != "default") {
  				EventEntries.update( { _id: selectedID }, { $push: { eventTags: Session.get("tagModalTag") } })
  			}

  			$( '#addEntryVal' ).val("default");

  		}
  	})


  var DateFormats = {
         short: "MMM. D, YYYY",
         long: "MM/DD/YYYY"
  };

  UI.registerHelper("formatDate", function(datetime, format) {
    if (moment) {
      f = DateFormats[format];
      return moment(datetime).format(f);
    }
    else {
      return datetime;
    }
  });

  UI.registerHelper("getLineLength", function(topOffset) {

      	return Session.get("yAxisOffset") - topOffset + 16;
  });

  UI.registerHelper("getUserEmail", function (userID) {
    return Meteor.call('getEmailFromID');
  });

  UI.registerHelper("getLineColor", function () {
    return Session.get("lineColor");
  });
  UI.registerHelper("getDateColor", function () {
    return Session.get("dateColor");
  });
  UI.registerHelper("getTitleColor", function () {
    return Session.get("titleColor");
  });
  UI.registerHelper("getSubtitleColor", function () {
    return Session.get("subtitleColor");
  });


  function dateDif(date1, date2) {    
    return Math.abs(date1.getTime() - date2.getTime());
  }

  function newWindowSize() {
    Session.set("timelineBoxWidth", $( "#timelineBox" ).width());
    var scaleFactor = $( "#timelineBox" ).width() / dateDif(Session.get("beginTimeline"), Session.get("endTimeline"));
    Session.set("scaleFactor", scaleFactor);
  }

  function dateToXPos(xdate) {
    return dateDif(Session.get("beginTimeline"), xdate) * Session.get("scaleFactor");
  }

  function xPosToDate (xPos) {
  	var rawDate = xPos / Session.get("scaleFactor");
  	var beginTimeline = Session.get("beginTimeline")
  	var dateSum = beginTimeline.getTime() + rawDate; 
  	var xPosDate = new Date();
  	xPosDate.setTime(dateSum)
  	return xPosDate;
  }

  function dateOfRightSide (date) {
  	var originXPos = dateToXPos(date);
  	var rightSideXPos = originXPos + Session.get("entryDivWidth");
  	var rawDate = rightSideXPos / Session.get("scaleFactor");
  	var beginTimeline = Session.get("beginTimeline")
  	var dateSum = beginTimeline.getTime() + rawDate; 
  	var xPosDate = new Date();
  	xPosDate.setTime(dateSum)
  	return xPosDate;
  }

  function dateOfLeftBuffer (date) {
  	var originXPos = dateToXPos(date);
  	var leftSideXPos = originXPos - Session.get("entryDivWidth");
  	var rawDate = leftSideXPos / Session.get("scaleFactor");
  	var beginTimeline = Session.get("beginTimeline")
  	var dateSum = beginTimeline.getTime() + rawDate; 
  	var xPosDate = new Date();
  	xPosDate.setTime(dateSum)
  	return xPosDate;
  }

  function dateOfRightSideDivWidth (date) {
    var originXPos = dateToXPos(date);
    var rightSideXPos = originXPos + Session.get("divWidth");
    var rawDate = rightSideXPos / Session.get("scaleFactor");
    var beginTimeline = Session.get("beginTimeline")
    var dateSum = beginTimeline.getTime() + rawDate; 
    var xPosDate = new Date();
    xPosDate.setTime(dateSum)
    return xPosDate;
  }

  Deps.autorun(function () {

		var earliestEntry = EventEntries.find({ caseID: Session.get("caseID"), checked: true }, { sort: { eventDate: 1 }, limit: 1 }).fetch(); 
		if (earliestEntry.length > 0 ) {
			var beginTimeline = earliestEntry[0].eventDate;
			beginTimeline.setFullYear(beginTimeline.getFullYear()-1);
			Session.set("beginTimeline", beginTimeline);
			newWindowSize();
		}

		var lastEntry = EventEntries.find({ caseID: Session.get("caseID"), checked: true }, { sort: { eventDate: -1 }, limit: 1 }).fetch(); 
		if (lastEntry.length > 0 ) {
			var endTimeline = lastEntry[0].eventDate;
      var dateAtBuffer = dateOfRightSideDivWidth(endTimeline);

			endTimeline.setFullYear(endTimeline.getFullYear()+1);

      if (dateAtBuffer > endTimeline) {
        var adjustedDate = dateAtBuffer;
      } else {
        var adjustedDate = endTimeline;
      }

			Session.set("endTimeline", adjustedDate);
			newWindowSize();
		}

		var appSettingsQuery = Cases.find({ _id: Session.get("caseID") }, { sort: { _id: -1 }, limit: 1 }).fetch(); 
		if (appSettingsQuery.length > 0) {
			// Session.set("appSettingsID", appSettingsQuery[0]._id);
      if (appSettingsQuery[0].yAxisOffset) { Session.set("yAxisOffset", appSettingsQuery[0].yAxisOffset) };
			if (appSettingsQuery[0].divWidth) { Session.set("divWidth", appSettingsQuery[0].divWidth) };
			if (appSettingsQuery[0].entryDivWidth) { Session.set("entryDivWidth", appSettingsQuery[0].entryDivWidth) };
      if (appSettingsQuery[0].backColor) { Session.set("backColor", appSettingsQuery[0].backColor) };
      if (appSettingsQuery[0].lineColor) { Session.set("lineColor", appSettingsQuery[0].lineColor) };
      if (appSettingsQuery[0].dateColor) { Session.set("dateColor", appSettingsQuery[0].dateColor) };
      if (appSettingsQuery[0].titleColor) { Session.set("titleColor", appSettingsQuery[0].titleColor) };
      if (appSettingsQuery[0].subtitleColor) { Session.set("subtitleColor", appSettingsQuery[0].subtitleColor) };
	  }

    var backColor = Session.get("backColor");

    if (Session.get("currentPage") == "timeline") {
      $('body').css('background-color', backColor );
    } else {
      $('body').css('background-color', "#ffffff" );
    }
  });

 Meteor.startup(function () {

  newWindowSize();

  $( window ).resize(function() {
    newWindowSize();
    });

  $("#timelineBox").hover(function(){
    $("#editButton").stop().fadeIn("slow");
  },
  function(){
    $("#editButton").stop().fadeOut();
  });

  $( "#editButton").click(function() {
    if ($(this).attr("class") != "timelineText") {
      if (Session.get("controlKitShow")) {
          $( "#controlKit" ).fadeOut("slow");
          Session.set("controlKitShow", false);
          newWindowSize();
      } else {
        $( "#controlKit" ).fadeIn("slow");
        Session.set("controlKitShow", true);
        newWindowSize();
      }
    }
  });
});




