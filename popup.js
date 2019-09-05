var clickButton = document.getElementById("clickButton");
var Start = document.getElementById("Start");
var intervalRun = false;

clickButton.onclick = function(e){
	
	if(intervalRun){
		chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
			var activeTab = tabs[0];
			chrome.tabs.sendMessage(activeTab.id, {"message": "true"});
		});
		intervalRun = false;
		Start.innerHTML = "Start Again";
		Start.style.left = "23px"
		
	}else{
		Start.innerHTML = "Stealing..";
		
		
		chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
			var activeTab = tabs[0];
			
			chrome.tabs.sendMessage(activeTab.id, {"message": "false","allTabs":tabs});
		});
		intervalRun = true;
		
	}
};

