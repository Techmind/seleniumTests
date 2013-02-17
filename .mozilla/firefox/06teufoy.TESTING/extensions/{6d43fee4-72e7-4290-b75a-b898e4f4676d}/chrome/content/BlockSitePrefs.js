const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
var linebreak = {
	string: function() {
		var mac= /mac/i.test(navigator.platform);
		var win= /win/i.test(navigator.platform);
		var unix= /lin|unix|x11/i.test(navigator.platform);
		if (win)
			return "\r\n";
		else if (mac)
			return "\r";
		else
			return "\n";
	},
	length: function() {
		var win= /win/i.test(navigator.platform);		
		return (win) ? 2 : 1;
	}
};
var BlockSitePrefs = {
	checkQuickAddCheckBox: function() {
		document.getElementById("blockSiteCheckboxQuickAdd").setAttribute('checked', true);
	},
	exportBookMark: function(bookmarkString) {		
		// dump(bookmark);
		var htService = Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);
		var query = htService.getNewQuery();
		var options = htService.getNewQueryOptions();
		options.queryType = options.QUERY_TYPE_BOOKMARKS;
		var result = htService.executeQuery(query, options);
		var rootNode = result.root;
		rootNode.containerOpen = true;
		var out = new Array();
		var annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
		var bookmark = null;
		for (var i = 0; i < rootNode.childCount; i++) {
			var node = rootNode.getChild(i);
			if(node.title == "Blacklist@BlockSite") {
			  try {
			  	var annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
			  	annotationService.setItemAnnotation(node.itemId, "bookmarkProperties/description", bookmarkString, 0, 4);

			  	bookmark = node;
			    break;
			  } catch(e) {
			    // no annotations
			    dump(e + "Unexpected EOL\n");
			  }
			}
			else {
			}
		}
		if(bookmark == null) {
			var bookmarkURI = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI("chrome://blocksite/content/BlockSitePrefs.xul", null, null);
            var bookmarks = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
			var bookmarkId = bookmarks.insertBookmark(
			bookmarks.toolbarFolder, // The id of the folder the bookmark will be placed in.
			bookmarkURI,             // The URI of the bookmark - an nsIURI object.
			bookmarks.DEFAULT_INDEX, // The position of the bookmark in its parent folder.
			"Blacklist@BlockSite");    // The title of the bookmark.
			var annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
			annotationService.setItemAnnotation(bookmarkId, "bookmarkProperties/description", bookmarkString, 0, 4);
		}
	},
	syncPrefsExport: function() {
		var locationList = document.getElementById("BlockedWebsitesList");
		var locationCount = locationList.getRowCount();
		var locationArray = new Array();
		var bookMarkString = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		var row = 0;
		for(let i=0; i < locationCount; i++)
		{
			//BAD LISTCELL BUG http://forums.mozillazine.org/viewtopic.php?f=19&t=315912
			locationList.ensureIndexIsVisible(i);
			if(locationList.getItemAtIndex(i).label != undefined && locationList.getItemAtIndex(i).label.length > 0) {
				locationArray.push(locationList.getItemAtIndex(i).label);
				if(locationArray.join("|||").length > 4194304) {
					bookMarkString = locationArray.join(linebreak.string());
					//set book mark
					this.exportBookMark("[BlockSite]" + linebreak.string() + bookMarkString);
					locationArray = new Array();
					row++;
					break;
				}
			}
		}
		//Last row
		if(locationArray.length != 0) {
			bookMarkString = locationArray.join(linebreak.string());
			//set book mark
			this.exportBookMark("[BlockSite]" + linebreak.string() + bookMarkString);
			row++;
		}
	},
	storePrefs: function() {
		const BlockSitePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("BlockSite.");		
		// Store BlockSite.enabled
		BlockSitePrefBranch.setBoolPref("enabled", document.getElementById("blockSiteCheckbox").checked);
		// Store BlockSite.showWarning
		BlockSitePrefBranch.setBoolPref("showWarning", document.getElementById("blockSiteCheckboxWarning").checked);
		// Store BlockSite.removeLinks
		BlockSitePrefBranch.setBoolPref("removeLinks", document.getElementById("blockSiteCheckboxRemoveLinks").checked);
		// Store BlockSite.authenticate
		BlockSitePrefBranch.setBoolPref("authenticate", document.getElementById("blockSiteCheckboxAuthentication").checked);
		// Store BlockSite.password
		if(document.getElementById("blockSitePassword").value != "")
			BlockSitePrefBranch.setCharPref("password", hex_md5(document.getElementById("blockSitePassword").value));
		
		// Store BlockSite.listtype
		BlockSitePrefBranch.setCharPref("listtype", document.getElementById("listtypeRadiogroup").selectedItem.id);

		// Store BlockSite.locations
		var locationList = document.getElementById("BlockedWebsitesList");
		if(document.getElementById("blockSiteCheckboxQuickAdd").checked) {
			this.quickAddLocation();
		}
		var locationCount = locationList.getRowCount();
		var locationArray = new Array();
		var locationNsIString = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		var row = 0;
		for(let i=0; i < locationCount; i++)
		{
			//BAD LISTCELL BUG http://forums.mozillazine.org/viewtopic.php?f=19&t=315912
			locationList.ensureIndexIsVisible(i);
			if(locationList.getItemAtIndex(i).label != undefined && locationList.getItemAtIndex(i).label.length > 0) {
				locationArray.push(locationList.getItemAtIndex(i).label);
				if(locationArray.join("|||").length > 4194304) {
					locationNsIString.data = locationArray.join("|||");
					BlockSitePrefBranch.setComplexValue("locations." + row, Components.interfaces.nsISupportsString, locationNsIString);
					let regExpString = "";
					for(let j = 0; j < locationArray.length; j++) {
						regExpString = regExpString.length == 0? (convert2RegExp(locationArray[j])).source: regExpString + "|" + (convert2RegExp(locationArray[j])).source;
					}
					locationNsIString.data = regExpString;
					BlockSitePrefBranch.setComplexValue("regexp." + row, Components.interfaces.nsISupportsString, locationNsIString);
					locationArray = new Array();
					row++;
				}
			}
		}
		//Last row
		if(locationArray.length != 0) {
			locationNsIString.data = locationArray.join("|||");
			BlockSitePrefBranch.setComplexValue("locations." + row, Components.interfaces.nsISupportsString, locationNsIString);
			let regExpString = "";
			for(let j = 0; j < locationArray.length; j++) {
				regExpString = regExpString.length == 0? (convert2RegExp(locationArray[j])).source: regExpString + "|" + (convert2RegExp(locationArray[j])).source;
			}
			locationNsIString.data = regExpString;
			BlockSitePrefBranch.setComplexValue("regexp." + row, Components.interfaces.nsISupportsString, locationNsIString);
			row++;
		}
		locationNsIString.data = "";
		BlockSitePrefBranch.setComplexValue("locations." + row, Components.interfaces.nsISupportsString, locationNsIString);
		BlockSitePrefBranch.setComplexValue("regexp." + row, Components.interfaces.nsISupportsString, locationNsIString);
	},	
	loadClipBoard: function() {
		//Clipboard
		var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);  
		if (!clip) return;  
		  
		var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);  
		if (!trans) return;  
		trans.addDataFlavor("text/unicode");
		clip.getData(trans, clip.kGlobalClipboard);  
  
		var str       = new Object();  
		var strLength = new Object();  
  
		trans.getTransferData("text/unicode", str, strLength); 

		if (str) {  
	      str = str.value.QueryInterface(Components.interfaces.nsISupportsString);  
	      var pastetext = str.data.substring(0, strLength.value / 2);
	      document.getElementById("blockSiteQuickAddLocation").value = pastetext;
	      document.getElementById("blockSiteQuickAddLocation").focus();
	    }	
	},
	readPrefs: function() {
		const BlockSitePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("BlockSite.");
		try {
			this.loadClipBoard();
		} catch(e) {
			dump(e + "\n");
		}
		// Read BlockSite.enabled
		if (BlockSitePrefBranch.prefHasUserValue("enabled")) {
			document.getElementById("blockSiteCheckbox").checked = BlockSitePrefBranch.getBoolPref("enabled");
		} else {
			BlockSitePrefBranch.setBoolPref("enabled", true);
			document.getElementById("blockSiteCheckbox").checked = true;
		}
		// Read BlockSite.showWarning
		if (BlockSitePrefBranch.prefHasUserValue("showWarning")) {
			document.getElementById("blockSiteCheckboxWarning").checked = BlockSitePrefBranch.getBoolPref("showWarning");
		} else {
			BlockSitePrefBranch.setBoolPref("showWarning", true);
			document.getElementById("blockSiteCheckboxWarning").checked = true;
		}
		// Read BlockSite.removeLinks
		if (BlockSitePrefBranch.prefHasUserValue("removeLinks")) {
			document.getElementById("blockSiteCheckboxRemoveLinks").checked = BlockSitePrefBranch.getBoolPref("removeLinks");
		} else {
			BlockSitePrefBranch.setBoolPref("removeLinks", true);
			document.getElementById("blockSiteCheckboxRemoveLinks").checked = true;
		}
		// Read BlockSite.authenticate
		if (BlockSitePrefBranch.prefHasUserValue("authenticate")) {
			document.getElementById("blockSiteCheckboxAuthentication").checked = BlockSitePrefBranch.getBoolPref("authenticate");
		} else {
			BlockSitePrefBranch.setBoolPref("authenticate", false);
			document.getElementById("blockSiteCheckboxAuthentication").checked = false;
		}
		// Read BlockSite.listtype
		if (!BlockSitePrefBranch.prefHasUserValue("listtype")) {
			BlockSitePrefBranch.setCharPref("listtype", "blacklistRadio");
		}
		document.getElementById("listtypeRadiogroup").selectedItem = document.getElementById(BlockSitePrefBranch.getCharPref("listtype"));
		this.changeListType();
		// Read BlockSite.locations
		var blockedWebsitesString = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
		if (BlockSitePrefBranch.prefHasUserValue("locations.0")) {
			var row = 0;
			var longString = "";
			while (BlockSitePrefBranch.prefHasUserValue("locations." + row)) {
				var aString = BlockSitePrefBranch.getComplexValue("locations." + row, Components.interfaces.nsISupportsString).data;
				if (aString.length == 0) break;
				longString = longString.length == 0 ? aString : longString + "|||" + aString;
				row = row + 1;
			}
			var blockedWebsitesArray = longString.split("|||");
		} else {
			var blockedWebsitesArray = new Array();
		}
		var locationList = document.getElementById("BlockedWebsitesList");
		for (var i = 0; i < blockedWebsitesArray.length; i++) {
			if (blockedWebsitesArray[i] != "") {
				locationList.appendItem(blockedWebsitesArray[i]);
			}
		}
	},
	changeListType: function() {
		document.getElementById("listtypeCaption").label = document.getElementById("listtypeRadiogroup").selectedItem.label;
	},
	editLocation: function() {
		var locationList = window.opener.document.getElementById('BlockedWebsitesList');
		var selectedLocation = locationList.getSelectedItem(0);

		var locationTextbox = document.getElementById('blockSiteLocation');
		locationTextbox.value = selectedLocation.label;
	},
	updateLocation: function() {
		var locationList = window.opener.document.getElementById('BlockedWebsitesList');
		var selectedLocation = locationList.getSelectedItem(0);

		var locationTextbox = document.getElementById('blockSiteLocation');
		selectedLocation.label = locationTextbox.value;
	},
	addLocation: function() {
		var locationList = window.opener.document.getElementById("BlockedWebsitesList");

		var newLocation = document.getElementById("blockSiteNewLocation").value
		if (newLocation) locationList.appendItem(newLocation);
	},
	quickAddLocation: function() {
		var locationList = window.document.getElementById("BlockedWebsitesList");
		var newLocation = document.getElementById("blockSiteQuickAddLocation").value;
		if (newLocation && newLocation != "") locationList.appendItem(newLocation);
		document.getElementById("blockSiteCheckboxQuickAdd").setAttribute('checked', false);
		document.getElementById("blockSiteQuickAddLocation").setAttribute('value', "");
		document.getElementById("blockSiteQuickAddLocation").reset();
	},
	removeLocation: function() {
		var locationList = document.getElementById("BlockedWebsitesList");
		locationList.removeItemAt(locationList.selectedIndex);
	},
	removeAllLocations: function() {
		var locationList = document.getElementById("BlockedWebsitesList");
		while (locationList.getRowCount()) {
			locationList.removeItemAt(0);
		}
	},
	importList: function() {
		var filePickerImport = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
		var streamImport = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
		var streamIO = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
		var overwriteCurrentList = false;
		var input;
		var inputArray;
		var validFile = false;

		filePickerImport.init(window, "Select a File", filePickerImport.modeOpen);
		filePickerImport.appendFilters(filePickerImport.filterText);

		if (filePickerImport.show() != filePickerImport.returnCancel) {
			streamImport.init(filePickerImport.file, 0x01, 0444, null);
			streamIO.init(streamImport);
			input = streamIO.read(streamImport.available());
			streamIO.close();
			streamImport.close();

			// now: unix + mac + dos environment-compatible
			linebreakImport = input.match(/(?:\[Block[Ss]ite\])(((\n+)|(\r+))+)/m)[1]; // first: whole match -- second: backref-1 -- etc..
			inputArray = input.split(linebreakImport);

			var headerRe = /\[Block[Ss]ite\]/; // tests if the first line is BlockSite's header
			if (headerRe.test(inputArray[0])) {
				inputArray.shift();
				var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
				var msg = "Do you want to Replace your current locations?\n..or Append to them?",
					title = "BlockSite Import",
					appendLabel = "Append",
					replaceLabel = "Replace",
					cancelLabel = "Cancel Import";
				var flags = promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_2 + promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_1 + promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_0 + (promptService.BUTTON_POS_0_DEFAULT ? promptService.BUTTON_POS_0_DEFAULT : 0);
				var buttonPressed = promptService.confirmEx(window, title, msg, flags, cancelLabel, replaceLabel, appendLabel, null, {});
				if (buttonPressed == 0) return; // second confirm -- user cancelled.
				var shouldAppend = (buttonPressed == 2);

				if (!shouldAppend) {
					BlockSitePrefs.removeAllLocations();
				}

				for (var i = 0; i < inputArray.length; i++) {
					var locationList = document.getElementById("BlockedWebsitesList");

					if (inputArray[i]) locationList.appendItem(inputArray[i]);
				}
			}
		}
	},
	exportList: function() {
		var filepickerExport = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
		var exportStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

		filepickerExport.init(window, "Select a File", filepickerExport.modeSave);
		filepickerExport.defaultExtension = ".txt";
		filepickerExport.appendFilters(filepickerExport.filterText);

		if (filepickerExport.show() != filepickerExport.returnCancel) {
			if (filepickerExport.file.exists()) filepickerExport.file.remove(true);
			filepickerExport.file.create(filepickerExport.file.NORMAL_FILE_TYPE, 0666);

			exportStream.init(filepickerExport.file, 0x02, 0x200, null);
			exportStream.write("[BlockSite]" + linebreak.string(), 11 + linebreak.length());

			var locationList = document.getElementById("BlockedWebsitesList");
			var locationCount = locationList.getRowCount();

			for (var i = 0; i < locationCount; i++) {
				var location = locationList.getItemAtIndex(i).label;
				exportStream.write(location, location.length);
				exportStream.write(linebreak.string(), linebreak.length());
			}

			exportStream.close();
		}
	}
}
