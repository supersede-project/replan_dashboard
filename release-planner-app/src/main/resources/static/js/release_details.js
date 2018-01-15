var app = angular.module('w5app');
app.controllerProvider.register('release-details', ['$scope', '$location', '$http', '$compile', '$rootScope',
                                   function ($scope, $location, $http,  $compile, $rootScope) {
	
	/*
	 * REST methods
	 */
	var baseURL = "release-planner-app/replan/projects/tenant";

	$scope.getReleaseFeatures = function (releaseId) {

		var url = baseURL + '/releases/' + releaseId + '/features';
		return $http({
			method: 'GET',
			url: url
		});
	}; 

	$scope.getReleasePlan = function (releaseId) {

		var url = baseURL + '/releases/' + releaseId + '/plan';
		return $http({
			method: 'GET',
			url: url
		});
	};

	$scope.getRelease = function (releaseId) {
		return $http({
			method: 'GET',
			url: baseURL + '/releases/' + releaseId
		});
	};

	//remove feature to release
	$scope.removeFeatureFromRelease = function (releaseId, featureIds){

		var url =  baseURL + '/releases/'+ releaseId + '/features';
		for(var i=0 ; i< featureIds.length; i++){
			if(i == 0){
				url = url + "?featureId=" + featureIds[i];
			}
			else{
				url = url + "," + featureIds[i];
			}
		}  

		return $http({
			method: 'DELETE',
			url: url
		});	 

	};

	$scope.removeReleasePlan = function (releaseId){

		var url = baseURL + '/releases/' + releaseId + '/plan';
		return $http({
			method: 'DELETE',
			url: url
		});	 

	};
	
	$scope.forceReleasePlan = function (releaseId, force) {

		var strForce = force.toString();

		var url = baseURL + '/releases/' + releaseId + '/plan?force_new='+strForce;
		return $http({
			method: 'GET',
			url: url
		});
	};


	/*
	 * All methods
	 */
	$scope.showReleasePlan = false;
	$scope.messageReleasePlan = "Loading ...";
	$scope.plan = {};
	$scope.planJqxgrid = {};
	$scope.release = {};
	$scope.featuresTORemove = [];

	//contains array of feature object.
	$scope.releaseFeatures = [];


	//initialize jqxSwitchButtons 
	//https://www.jqwidgets.com/jquery-widgets-documentation/documentation/jqxbutton/jquery-button-getting-started.htm?search=button
	$scope.showTimeline_chart = true;
	//the default jqxSwitchButton_timeline_chart MUST BE true
	$scope.showTimeline_chart_no_resources_available = false;
	
	$('#jqxSwitchButton_timeline_chart').jqxSwitchButton({ height:"20px", onLabel:'HIDE', offLabel:'SHOW', checked:true }); 
	$('#jqxSwitchButton_timeline_chart').on('change', function (event) { 
		$scope.showTimeline_chart = event.args.checked;
		$rootScope.showTimeline_chart = event.args.checked; 
		$scope.$apply();
	});
	
	
	$scope.showResource_usage = true;
	$('#jqxSwitchButton_resources_usage').jqxSwitchButton({ height:"20px", onLabel:'HIDE', offLabel:'SHOW', checked:true }); 
	$('#jqxSwitchButton_resources_usage').on('change', function (event) { 
		$scope.showResource_usage = event.args.checked;
		$rootScope.showResource_usage = event.args.checked; 
		$scope.$apply();
	});
	
	
	$scope.showMynetwork = true;
	//the default jqxSwitchButton_timeline_chart MUST BE true
	$('#jqxSwitchButton_feature_dependencies').jqxSwitchButton({ height:"20px", onLabel:'HIDE', offLabel:'SHOW', checked:true }); 
	$('#jqxSwitchButton_feature_dependencies').on('change', function (event) { 
		$scope.showMynetwork = event.args.checked;
		$rootScope.showMynetwork = event.args.checked; 
		$scope.$apply();
	});
	$scope.showMynetwork_no_dependencies_available = false;

	
	$scope.showViewTable = true;
	
	$('#jqxSwitchButton_viewTable').jqxSwitchButton({ height:"20px", onLabel:'HIDE', offLabel:'SHOW', checked:true }); 
	$('#jqxSwitchButton_viewTable').on('change', function (event) { 
		$scope.showViewTable = event.args.checked;
		$rootScope.showViewTable = event.args.checked; 
		$scope.$apply();
	});
	
	
	
	function isEven(n) {
		return n % 2 == 0;
	}
	
	function isUndefinedOrNull(obj){
        return !angular.isDefined(obj) || obj===null;
    }
	
	//var deadLineRelease = new Date($scope.release.deadline);
	$scope.getStringSUPERSEDEDate = function (supersedeDateAsString){
		if(!isUndefinedOrNull(supersedeDateAsString)){
			var res = supersedeDateAsString.split("T");
			var dateAsString = res[0];
			return dateAsString;
		}
		return "";
		
	}
	//name -> y
	//1472688000000 -> x
	$scope.startPoint = function (releaseId) {

		$scope.getReleaseFeatures(releaseId)
		.then(
				function(response) {

					//for security reasons
					$scope.showTimeline_chart = true;
					$scope.showMynetwork = true;
					
					
					$scope.releaseFeatures = response.data;

					$scope.getRelease(releaseId)
					.then(
							function(response) {
								$scope.release = response.data;

								$scope.getReleasePlan(releaseId)
								.then(
										function(response) {

											var responseData = response.data;
											$scope.plan = responseData;
											
											
											for(var i = 0; i<$scope.plan.jobs.length; ++i){ 
												var job = $scope.plan.jobs[i];
												//add my_requiredSkills in feature
												var requiredSkills = '';
												for(var z = 0; z<$scope.releaseFeatures.length; ++z){
													
													var feature = $scope.releaseFeatures[z];
													if($scope.plan.jobs[i].feature.id == feature.id){
														
														for(var c = 0; c< feature.required_skills.length; ++c){
															if(c==0){
																requiredSkills =  feature.required_skills[c].name + "-" + feature.required_skills[c].id +"(Id)";							
															}
															else{
																requiredSkills = requiredSkills +"," + requiredSkills + feature.required_skills[c].name + "-" + feature.required_skills[c].id +"(Id)";
															}

														}
													}
												}
												job.feature.my_requiredSkills = requiredSkills;
											}
											
											//add % of resource usage
											for(var i = 0; i< $scope.plan.resource_usage.length; i++){
												var resource = $scope.plan.resource_usage[i];
												var total_available_hours = Number(resource.total_available_hours);
												var total_used_hours = Number(resource.total_used_hours);
												var total_used_percent = (total_used_hours/total_available_hours)*100;
												resource.total_used_percent = total_used_percent;
												
												//add skillsAsString
												var skillsAsString = "";
												for(var j = 0; j< resource.skills.length; j++){
													var skill = resource.skills[j];
													if(j==0){
														skillsAsString =  skill.name + "-" + skill.id +"(Id)"; 
													}
													else{
														skillsAsString = skillsAsString + "," + skill.name + "-" + skill.id +"(Id)"; 
													}
												}
												resource.skillsAsString = skillsAsString;
											}
									
											$scope.showReleasePlan = true;

											$scope.planJqxgrid = JSON.parse(JSON.stringify(responseData)); 
											addPropertiesTOPlanJqxgrid();
											$scope.initFeaturesJqxgrid();

											//google charts
											google.charts.setOnLoadCallback(drawTimelineChart);

											//visjs chart
											drawFeatureDependencies();
											
											//show hide jqxSwitchButton
											if(!isUndefinedOrNull($rootScope.showTimeline_chart)){
												if(!$rootScope.showTimeline_chart){
													$('#jqxSwitchButton_timeline_chart').jqxSwitchButton('uncheck');
												}												
											}
											
											if(!isUndefinedOrNull($rootScope.showResource_usage)){
												if(!$rootScope.showResource_usage){
													$('#jqxSwitchButton_resources_usage').jqxSwitchButton('uncheck');
												}												
											}

											if(!isUndefinedOrNull($rootScope.showMynetwork)){
												if(!$rootScope.showMynetwork){
													$('#jqxSwitchButton_feature_dependencies').jqxSwitchButton('uncheck');
												}												
											}

											if(!isUndefinedOrNull($rootScope.showViewTable)){
												if(!$rootScope.showViewTable){
													$('#jqxSwitchButton_viewTable').jqxSwitchButton('uncheck');
												}												
											}

										},

										function(response) {
											$scope.showReleasePlan = false;
											$scope.messageReleasePlan = "Error: "+response.status + " " + response.statusText;
										}
								);
							},

							function(response) {
								$scope.showReleasePlan = false;
								$scope.messageReleasePlan = "Error: "+response.status + " " + response.statusText;
							}
					);
				},
				function(response) {
					$scope.showReleasePlan = false;
					$scope.messageReleasePlan = "Error: "+response.status + " " + response.statusText;
				}
		);
	}


	//2017-05-17T11:00:00.000Z
	function getDate(supersedeDateAsString){
		var res = supersedeDateAsString.split("T");
		var dateAsString = res[0];
		var dateAsStrings = dateAsString.split("-");
		var year = dateAsStrings[0];
		var mounth = dateAsStrings[1];
		var day = dateAsStrings[2];

		var timeStampAsString = res[1];
		var timeStampAsStrings = res[1].split(".");
		var timeAsString = timeStampAsStrings[0];
		var timeAsStrings = timeAsString.split(":");
		var hours = timeAsStrings[0];
		var minutes = timeAsStrings[1];
		//year, month, day, hour, minute, second, and millisecond,
		//mounth
		var mounth2 = mounth-1;
		var startDate = new Date(parseInt(year),parseInt(mounth2),parseInt(day),parseInt(hours),parseInt(minutes));
		return startDate;
	}

	function addPropertiesTOPlanJqxgrid() {

		for(var i = 0; i<$scope.planJqxgrid.jobs.length; ++i){ 
			var job = $scope.planJqxgrid.jobs[i];
			//add my_requiredSkills
			var requiredSkills = '';
			for(var z = 0; z<$scope.releaseFeatures.length; ++z){
				
				var feature = $scope.releaseFeatures[z];
				if($scope.planJqxgrid.jobs[i].feature.id == feature.id){
					
					for(var c = 0; c< feature.required_skills.length; ++c){
						if(c==0){
							requiredSkills = requiredSkills + feature.required_skills[c].id;							
						}
						else{
							requiredSkills = requiredSkills +"," + requiredSkills + feature.required_skills[c].id;
						}

					}
				}
			}
			job.my_requiredSkills = requiredSkills;

			//add my_dependencies to plan
			var dependencies = '';
			for(var j = 0; j<$scope.planJqxgrid.jobs[i].depends_on.length; ++j){
				
				if(j==0){
					dependencies = dependencies + $scope.planJqxgrid.jobs[i].depends_on[j].feature_id;
				}
				else{
					dependencies = dependencies +','+ $scope.planJqxgrid.jobs[i].depends_on[j].feature_id;
				}
				
			}
			
			job.my_dependencies = dependencies;

			//add my_starts
			var res = $scope.planJqxgrid.jobs[i].starts.split("T");
			var time = res[1].split(":");
			job.my_starts=res[0] + " " + time[0] +":" + time[1];

			//add my_ends
			res = $scope.planJqxgrid.jobs[i].ends.split("T");
			time = res[1].split(":");
			job.my_ends=res[0] + " " + time[0] +":" + time[1];

			//add scheduled
			job.my_scheduled = true;

		}
		//add features not scheduled as job 
		for(var i = 0; i<$scope.releaseFeatures.length; ++i){
			//if false -> add
			if(!is_in_scheduled_jobs($scope.releaseFeatures[i].id)){
				
				var job = {};
				job.id = null;
				job.starts = null;
				job.ends = null;
				job.feature = $scope.releaseFeatures[i];
				job.resource = null;
				
				//add my_dependencies to plan
				var dependencies = '';
				var depends_on = [];
				for(var j = 0; j<$scope.releaseFeatures[i].depends_on.length; ++j){
					var objDependency = {};
					if(j==0){
						dependencies = dependencies +$scope.releaseFeatures[i].depends_on[j].id;
					}
					else{
						dependencies = dependencies +','+ $scope.releaseFeatures[i].depends_on[j].id;
					}
					objDependency.id = null;
					objDependency.starts = null;
					objDependency.ends = null;
					objDependency.feature_id = $scope.releaseFeatures[i].depends_on[j].id;
					objDependency.resource_id = null;
					depends_on.push(objDependency);
				}
				
				
				job.depends_on = depends_on;
				job.my_dependencies = dependencies;
				job.my_starts = '';
				job.my_ends = '';
				job.my_scheduled = false;
				
				$scope.planJqxgrid.jobs.push(job);
			}
		}

	}

	function is_in_scheduled_jobs(id) {
		for(var i = 0; i<$scope.planJqxgrid.jobs.length; ++i){ 
			if($scope.planJqxgrid.jobs[i].feature.id == id){
				return true;
			}
		}
		return false;
	}

	$scope.initFeaturesJqxgrid = function(){

		$scope.blncreateFeaturesJqxgrid = false;

		// prepare the data
		var source =
		{
				datatype: "json",
				datafields: [
				             { name: 'id', map : 'feature>id', type: 'number' },
				             { name: 'name', map : 'feature>name', type: 'string'},
				             { name: 'effort', map : 'feature>effort', type: 'number'},
				             { name: 'priority', map : 'feature>priority', type: 'number'},
				             { name: 'my_starts', type: 'string'},
				             { name: 'my_ends', type: 'string' },
				             { name: 'my_dependencies', type: 'string' },
				             { name: 'my_requiredSkills', type: 'string' },
				             ],
				             id: 'id',
				             localdata: $scope.planJqxgrid.jobs
		};


		var dataAdapter = new $.jqx.dataAdapter(source);

		//tooltip header
		var tooltipHeaderRenderer = function (element) {
			$(element).parent().jqxTooltip({ position: 'mouse', content: $(element).text() });
		}
		//css style cell 
		var cellclass = function (row, columnfield, value) {
			if ($scope.planJqxgrid.jobs[row].my_scheduled) {
				return 'scheduledFeature';
			}
		}

		// create tooltip.
		$("#featuresJqxgrid").jqxTooltip();

		$scope.featuresJqxgridSettings =
		{
				width: '100%',
				autoheight: true,
				source: dataAdapter,
				enabletooltips: true,

				//trigger cell hover.(only for the body table)
				cellhover: function (element, pageX, pageY)
				{
					// update tooltip.
					$("#featuresJqxgrid").jqxTooltip({ content: element.innerHTML });
					// open tooltip.
					$("#featuresJqxgrid").jqxTooltip('open', pageX + 15, pageY + 15);
				},
				enablehover: true,
				columns: [
				          //width: 40 
				          { text: 'Id', datafield: 'id', rendered: tooltipHeaderRenderer, cellclassname: cellclass, width: 40},
				          { text: 'Name', datafield: 'name', rendered: tooltipHeaderRenderer, cellclassname: cellclass},
				          { text: 'Effort', datafield: 'effort', rendered: tooltipHeaderRenderer, cellclassname: cellclass, width: 40},
				          { text: 'Priority', datafield: 'priority', rendered: tooltipHeaderRenderer, cellclassname: cellclass, width: 40 },
				          { text: 'Start', datafield: 'my_starts', rendered: tooltipHeaderRenderer, cellclassname: cellclass},
				          { text: 'End', datafield: 'my_ends', rendered: tooltipHeaderRenderer, cellclassname: cellclass},
				          { text: 'Dependencies', datafield: 'my_dependencies' , rendered: tooltipHeaderRenderer, cellclassname: cellclass, width: 60},
				          { text: 'Required skills', datafield: 'my_requiredSkills' , rendered: tooltipHeaderRenderer, cellclassname: cellclass, width: 60},
				          { text: '', columntype: 'button', cellclassname: cellclass, width: 60,
				        	  cellsrenderer: function () {
				        		  return "Remove";
				        	  },
				        	  buttonclick: function (row) {

				        		  //if($scope.planJqxgrid.jobs[row].my_scheduled){
				        		  //update grid
				        		  $('#featuresJqxgrid').jqxGrid('deleterow', $scope.planJqxgrid.jobs[row].id);
				        		  //add feature id to remove
				        		  $scope.featuresTORemove.push($scope.planJqxgrid.jobs[row].feature.id);

				        		  //remove from scope
				        		  $scope.planJqxgrid.jobs.splice(row, 1);
				        		  $scope.plan.jobs.splice(row, 1);

				        		  //redraw the chart

				        		  //google charts
				        		  drawTimelineChart();

				        		  //visjs chart
				        		  drawFeatureDependencies();

				        		  //refresh the table
				        		  $("#featuresJqxgrid").jqxGrid("updatebounddata", "cells");
				        		  //}

				        	  }
				          },
				          { text: '', datafield: 'Edit', columntype: 'button', cellclassname: cellclass, width: 60, 
				        	  cellsrenderer: function () {
				        		  return "Edit";
				        	  },
				        	  buttonclick: function (row) {

				        		  if(row != -1){
				        			  var featureId = $scope.planJqxgrid.jobs[row].feature.id

				        			  $rootScope.$apply(function() {
				        				  $location.path("/release-planner-app/replan_release").search({featureId: featureId, releaseId: $scope.release.id });
				        				  console.log($location.path());
				        			  });
				        		  }
				        	  }
				          },

				          ]
		};

		$scope.blncreateFeaturesJqxgrid = true;

	};

	function isFeature(textContent){

		for(var i=0; i< $scope.plan.jobs.length; i++){
			if(""+$scope.plan.jobs[i].feature.id ==  textContent){
				return true;
			}
		}
		return false;
	}

	function is_in_featuresTORemove(id) {
		for(var i = 0; i<$scope.featuresTORemove.length; ++i){ 
			if($scope.featuresTORemove[i]== id){
				return true;
			}
		}
		return false;
	}

	$scope.accept = function() {

		if($scope.featuresTORemove.length > 0){

			$scope.removeFeatureFromRelease($scope.release.id, $scope.featuresTORemove)
			.then(
					function(response) {

						$scope.featuresTORemove = [];
						$location.path("/release-planner-app/main");

					},
					function(response) {
						alert("Error: "+response.status + " " + response.statusText);
					}
			);   
		}
		else{
			$location.path("/release-planner-app/main");   
		}
	};

	$scope.forceTOReplan = function(bln) {

		if(bln){
			$scope.forceReleasePlan($scope.release.id, bln)
			.then(
					function(response) {
						$scope.startPoint($location.search().releaseId);
					},
					function(response) {
						alert("Error: "+response.status + " " + response.statusText);
					}
			); 
		}
		else{

			$scope.removeReleasePlan($scope.release.id)
			.then(
					function(response) {
						$scope.startPoint($scope.release.id);
					},
					function(response) {
						alert("Error: "+response.status + " " + response.statusText);
					}
			);

		}

	};

	/**
	 * Help methods
	 */
	function getDates(startDate, stopDate) {
		var dateArray = new Array();
		var currentDate = startDate;
		while (currentDate <= stopDate) {
			var date = new Date (currentDate);
			date.setHours(0,0,0,0);
			dateArray.push( date );
			currentDate = currentDate.addDays(1);
		}
		return dateArray;
	}

	Date.prototype.addDays = function(days) {
		var dat = new Date(this.valueOf())
		dat.setDate(dat.getDate() + days);
		return dat;
	}

	//http://stackoverflow.com/questions/11246758/how-to-get-unique-values-in-an-array
	//HOW TO 
	//var duplicates = [1,3,4,2,1,2,3,8];
	//var uniques = duplicates.unique(); // result = [1,3,4,2,8]
	Array.prototype.contains = function(v) {
		for(var i = 0; i < this.length; i++) {
			if(this[i] === v) return true;
		}
		return false;
	};

	Array.prototype.unique = function() {
		var arr = [];
		for(var i = 0; i < this.length; i++) {
			if(!arr.contains(this[i])) {
				arr.push(this[i]);
			}
		}
		return arr; 
	}


	/**
	 * Google and visjs chart functions
	 */

	var arrayColors = ["#F0F8FF","#FAEBD7","#00FFFF","#7FFFD4","#F0FFFF","#F5F5DC","#FFE4C4","#000000","#FFEBCD","#0000FF","#8A2BE2","#A52A2A","#DEB887","#5F9EA0","#7FFF00","#D2691E","#FF7F50","#6495ED","#FFF8DC","#DC143C","#00008B","#008B8B","#B8860B","#A9A9A9","#006400","#BDB76B","#8B008B","#556B2F","#FF8C00","#9932CC","#8B0000","#E9967A","#8FBC8F","#483D8B","#2F4F4F","#00CED1","#9400D3","#FF1493","#00BFFF","#696969","#1E90FF","#B22222","#FFFAF0","#228B22","#FF00FF","#DCDCDC","#F8F8FF","#FFD700","#DAA520","#808080","#008000","#ADFF2F","#F0FFF0","#FF69B4","#CD5C5C","#4B0082","#FFFFF0","#F0E68C","#E6E6FA","#FFF0F5","#7CFC00","#FFFACD","#ADD8E6","#F08080","#E0FFFF","#FAFAD2","#D3D3D3","#90EE90","#FFB6C1","#FFA07A","#20B2AA","#87CEFA","#778899","#B0C4DE","#FFFFE0","#00FF00","#32CD32","#800000","#FAF0E6","#66CDAA","#0000CD","#BA55D3","#9370DB","#3CB371","#7B68EE","#00FA9A","#48D1CC","#C71585","#191970","#F5FFFA","#FFE4E1","#FFE4B5","#FFDEAD","#000080","#FDF5E6","#808000","#6B8E23","#FFA500","#FF4500","#DA70D6","#EEE8AA","#98FB98","#AFEEEE","#DB7093","#FFEFD5","#FFDAB9","#CD853F","#FFC0CB","#DDA0DD","#B0E0E6","#800080","#663399","#FF0000","#BC8F8F","#4169E1","#8B4513","#FA8072","#F4A460","#2E8B57","#FFF5EE","#A0522D","#C0C0C0","#87CEEB","#6A5ACD","#708090","#FFFAFA","#00FF7F","#4682B4","#D2B48C","#008080","#D8BFD8","#FF6347","#40E0D0","#EE82EE","#F5DEB3","#FFFFFF","#F5F5F5","#FFFF00","#9ACD32"];

	function getHTMLToolTip(job) {

		
		var start = "";
		var end= "";
		
		var duration ="";
		if(!isUndefinedOrNull(job.starts) || !isUndefinedOrNull(job.ends)){
			//start
			start= getDateASString(job.starts);
			//end
			end= getDateASString(job.ends);
			//duration
			var startDate = getDate(job.starts);
			var endDate = getDate(job.ends);
			var hours = Math.abs(startDate - endDate) / 3600000;
			var hourLabel = "hour"; 
			if(hours>10){
				hourLabel = "hours";
			}
			duration = ""+ hours + " " + hourLabel;
		}
				
		var depends_on = "";
		for(var z=0; z<job.depends_on.length; z++){
			if(z==0){
				depends_on = findIdFeatureFromJobId(job.depends_on[z].id);	
			}else{
				depends_on = depends_on + ", " + findIdFeatureFromJobId(job.depends_on[z].id);
			}

		}
		//tooltip
		var result = "<div>" +
		"<table class='tooltip_table'>" +
		"<tr>" +
		"<th>" +
		"<b>" + job.feature.name + "<b>" +
		"</th>" +
		"</tr>" +
		"<tr>" +
		"<td>" +
		"<b>Id:</b> "+ job.feature.id + "<br>" +
		"<b>Start:</b> "+ start + "<br>" +
		"<b>End:</b> "+ end + "<br>" +
		"<b>Duration:</b> " + duration + "<br>" +
		"<b>Effort:</b> " + job.feature.effort + "<br>" +
		"<b>Priority:</b> "+ job.feature.priority + "<br>" +
		"<b>Depends on:</b> "+ depends_on + "<br>" +
		"<b>Required skills:</b> "+ job.feature.my_requiredSkills + "<br>" +
		"</td>" +
		"</tr>" +
		"</table>" +
		"</div>";

		return result;
	}

	function drawTimelineChart() {

		//1.create dataTable
		var dataTable = new google.visualization.DataTable();

		dataTable.addColumn({ type: 'string', id: 'Developer' });
		dataTable.addColumn({ type: 'string', id: 'TaskName' });
		dataTable.addColumn({'type': 'string', 'role': 'tooltip', 'p': {'html': true}});
		dataTable.addColumn({ type: 'date', id: 'Start' });
		dataTable.addColumn({ type: 'date', id: 'End' });

		var numberOfRows =  dataTable.getNumberOfRows();
		if(numberOfRows > 0){
			dataTable.removeRows(0, numberOfRows);
		}

		//2.add rows in dataTable
		var arrays = [];
		var jobs = $scope.plan.jobs;
		//for(var i = jobs.length-1; i>=0; i--){
		for(var i = 0; i< jobs.length; i++){

			var job = jobs[i];
			var array = [];


			array[0] = job.resource.name;
			array[1] = ""+job.feature.id;

			//tooltip
			array[2] = getHTMLToolTip(job);


			array[3] = getDate(job.starts);
			array[4] = getDate(job.ends);

			arrays.push(array);

		}
		dataTable.addRows(arrays);

		//3 initialize
		var container = document.getElementById('timeline_chart');
		var timelineChart = new google.visualization.Timeline(container);

		var trackHeight = 50;
		var numberOfResources = $scope.plan.resource_usage.length;
		var arrayNumberOfResources = [];
		var index=0;
		for(var i=0; i< $scope.plan.jobs.length; i++){
			arrayNumberOfResources[index] =$scope.plan.jobs[i].resource.id;
			index ++;
		}
		var arrayNumberOfResourceUnique = array_unique(arrayNumberOfResources);


		var height = arrayNumberOfResourceUnique.length * trackHeight + trackHeight ;
		var options = {
				height: height,
				timeline: {
					colorByRowLabel: true
				}
		,
		tooltip: { isHtml: true },
		colors: arrayColors
		};

		
		if(arrays.length>0){
			
			$scope.showTimeline_chart = true;
			
			//3.1 draw
			timelineChart.draw(dataTable, options);
		}else{
		
			$scope.showTimeline_chart_no_resources_available = true;
			
			
		}
	}

	function drawFeatureDependencies(){
		
		var indexColorResource = 0;
		var lastIdResource = -1;

		var indexNode = 0;
		var indexEdge = 0;

		var nodeDataSet = [];
		var edgeDataSet = [];
		//var jobs = $scope.plan.jobs;
		//only to test
		var jobs = $scope.planJqxgrid.jobs;

		var arrayFeaturesIds =[];
		var index = 0;
		for(var i = 0; i< jobs.length; i++){
			var job =  jobs[i];
			if(job.depends_on.length>0){
				arrayFeaturesIds[index] = job.feature.id;
				index++;
				for(var j = 0; j< job.depends_on.length; j++){
					var feature =  job.depends_on[j];
					arrayFeaturesIds[index] = feature.feature_id;
					index++;
				}
			}
		}	

		var arrayUniqueFeaturesIds = array_unique(arrayFeaturesIds);

		//for(var i = jobs.length-1; i>=0; i--){
		for(var i = 0; i< jobs.length; i++){	
			//add node into the array
			var job =  jobs[i];
			if(isContains(arrayUniqueFeaturesIds,job.feature.id)){
				var node = {};
				node.id  = job.feature.id;
				node.label = job.feature.id;
				node.title = getHTMLToolTip(job);

				if(!isUndefinedOrNull(job.resource) && !isUndefinedOrNull(job.resource.id) ){
					if(lastIdResource == -1){
						lastIdResource = job.resource.id;
					}

					if(lastIdResource != job.resource.id){
						indexColorResource ++;
						lastIdResource = job.resource.id;
					}

					node.color = arrayColors[indexColorResource];
				}else{
					node.color = 'gray';
				}
				
				nodeDataSet[indexNode] = node;

				for(var j =0; j< job.depends_on.length; j++){
					//add edge into the array
					var edge = {};
					edge.from = job.depends_on[j].feature_id;
					edge.to = job.feature.id;
					edge.color = 'gray';
					if(isUndefinedOrNull(job.resource) || isUndefinedOrNull(job.resource.id) ){
						edge.dashes= true;
					}
					edgeDataSet[indexEdge] = edge;
					indexEdge ++;
				}

				indexNode ++;
			}
		}

		//1. add arrays
		var nodes = new vis.DataSet(nodeDataSet);
		var edges = new vis.DataSet(edgeDataSet);

		//2. create network feature dependencies
		var container = document.getElementById('mynetwork');

		//3. provide the data in the vis format
		var data = {
				nodes: nodes
				,
				edges: edges
		};

		//4. provide options
		var options = {
				physics: false,
				autoResize: true,
				edges: {
					arrows: {
						from: {
							enabled: true
						}
					}
				},
//				if use the property layout in supersede the chart has problem
				//				layout: {
//				improvedLayout: true
//				,		
//				hierarchical: {
//				enabled: true,
//				levelSeparation: 50
//				}
//				},

				interaction: {
					dragView:false,	
					zoomView: false
				}

		};

		
		if(nodeDataSet.length>0){
			$scope.showMynetwork = true;
			//5.initialize your network!
			var network = new vis.Network(container, data, options);
			
		}else{
			$scope.showMynetwork_no_dependencies_available = true;
			
		}
		
	}
	

	function findIdFeatureFromJobId(jobId) {
		var jobs = $scope.plan.jobs;

		//for(var i = jobs.length-1; i>=0; i--){
		for(var i = 0; i< jobs.length; i++){
			var job = jobs[i];
			if(job.id == jobId){
				return job.feature.id
			}
		}
		return -1;
	}

	function getDateASString(dateAsString) {
		var res = dateAsString.split("T");
		var time = res[1].split(":");
		var my_date= res[0] + " " + time[0] +":" + time[1];
		return my_date;
	}

	function array_unique(arr) {
		var result = [];
		for (var i = 0; i < arr.length; i++) {
			if (result.indexOf(arr[i]) == -1) {
				result.push(arr[i]);
			}
		}
		return result;
	}

	function  isContains(arr, id){
		for (var i = 0; i < arr.length; i++) {
			if (arr[i] == id) {
				return true;
			}
		}
		return false;
	}
	
	
	/**
	 * start point function
	 */
	google.charts.load('current', {'packages':['timeline', 'gantt']});
	$scope.startPoint($location.search().releaseId);

}]);