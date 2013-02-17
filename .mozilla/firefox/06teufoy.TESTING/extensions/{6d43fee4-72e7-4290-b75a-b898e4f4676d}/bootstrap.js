const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

var BlockSite = {
  showBlockWarningBar: function(location)
  {
    let wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);  
    let oneWin = wm.getMostRecentWindow("navigator:browser");
    let oneBox = oneWin.gBrowser.getNotificationBox();              
    let notification = oneBox.getNotificationWithValue("website-blocked");
    
    if(!notification) {
      const priority = oneBox.PRIORITY_INFO_MEDIUM;
      oneBox.appendNotification('', "website-blocked", "chrome://browser/skin/Info.png", priority, null);
      notification = oneBox.getNotificationWithValue("website-blocked");
      oneBox.dir = 'reverse';
    }
    const ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);  
    let oneURI = ioService.newURI(location, null, null);
    let oneDoc = notification.ownerDocument;
    let text = oneDoc.getAnonymousElementByAttribute(notification, 'anonid', 'messageText');
    text.style.direction = 'rtl';
    text.flex = 100;
    for(let index = 1; index < text.childNodes.length; index++) {
      if(text.childNodes[index].nodeType == 1 && text.childNodes[index].firstChild.nodeValue == oneURI.host)
        return; //Already displaying in the bar
    }
    let fragment = oneDoc.createDocumentFragment();
    let italic = oneDoc.createElementNS("http://www.w3.org/1999/xhtml", "del");
    italic.appendChild(oneDoc.createTextNode(oneURI.host));
    fragment.appendChild(italic);
    fragment.appendChild(oneDoc.createTextNode("\t"));
    text.appendChild(fragment);
    
    oneWin.setTimeout(function(){  
      for(let counter = 0; counter < 2 && text.childNodes.length > 0; counter++) {
        text.removeChild(text.firstChild);
      }
      if(text.childNodes.length == 1) {
        oneBox.removeAllNotifications(false);
        oneBox.dir = 'reverse';
      }
    }, 6000);
  },
  
  
  isBlackList: function(prefBranch)
  {
    if (!prefBranch.prefHasUserValue("listtype"))
      return true;
    return prefBranch.getCharPref("listtype") == "blacklistRadio";
  },
  
  checkLocation: function(location)
  {
    const BlockSitePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("BlockSite.");
    if(BlockSitePrefBranch.prefHasUserValue("locations.0"))
    {
      var blockedLocationsString = "";
      let ticker = 0;
      while(BlockSitePrefBranch.prefHasUserValue("regexp." + ticker)) {
        var aString = BlockSitePrefBranch.getComplexValue("regexp." + ticker, Components.interfaces.nsISupportsString).data;
        if(aString.length == 0) break;
        blockedLocationsString = blockedLocationsString.length == 0? aString: blockedLocationsString + "|" + aString;

        ticker = ticker + 1;
      }
      if(blockedLocationsString != "")
      {
        if((new RegExp(blockedLocationsString)).test(location))
          return this.isBlackList(BlockSitePrefBranch);
      }
    }
    
    return !this.isBlackList(BlockSitePrefBranch);
  },
  
  processAnchors: function(event)
  {
    var anchorElements = event.target.getElementsByTagName("a");
    for(var i=0; i < anchorElements.length; i++)
    {
      if(BlockSite.checkLocation(anchorElements[i].href))
      {
        var tempFragment = event.target.createDocumentFragment();
        var childNodes = anchorElements[i].childNodes;
        var parentNode = anchorElements[i].parentNode;
        
        for(var j=0; j < childNodes.length; j++)
        {
          tempFragment.appendChild(childNodes[j].cloneNode(true));
        }
        
        parentNode.replaceChild(tempFragment, anchorElements[i]);
        i--; //List is live, so replacing the node means that anchorElements[i] is refering to the next node already
      }
    }
  },
  
  BlockSiteMain: function(event)
  {
    const BlockSitePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("BlockSite.");
    
    if(BlockSitePrefBranch.prefHasUserValue("enabled") && BlockSitePrefBranch.getBoolPref("enabled"))
    {     

      // earlier versions did not have a remove links preference, so only disable the functionality if the user has
      // specifically unchecked the "remove links" checkbox in the preferences
      if(BlockSitePrefBranch.prefHasUserValue("removeLinks") && (BlockSitePrefBranch.getBoolPref("removeLinks") == false))
      {
        return;
      }

      if(event.type === "DOMContentLoaded" || event.type == "change")
      {     
        // Anchors
        BlockSite.processAnchors(event);
      }
    }
  }
};

// Observer for HTTP requests to block the sites we don't want
var BlockSiteObserver = 
{
  observe: function(aSubject, aTopic, aData)
  {
    if (aTopic != 'http-on-modify-request')
      return;

    aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
    
    const BlockSitePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("BlockSite.");
    
    if(BlockSitePrefBranch.prefHasUserValue("enabled") && BlockSitePrefBranch.getBoolPref("enabled"))
    {
      if (BlockSite.checkLocation(aSubject.URI.spec))
      {
        if (BlockSitePrefBranch.prefHasUserValue("showWarning") && BlockSitePrefBranch.getBoolPref("showWarning"))
          BlockSite.showBlockWarningBar(aSubject.URI.spec);
        aSubject.loadFlags = Components.interfaces.nsICachingChannel.LOAD_ONLY_FROM_CACHE;
        aSubject.cancel(Components.results.NS_ERROR_FAILURE);
      }
    }
  },

  QueryInterface: function(iid)
  {
    if (!iid.equals(Components.interfaces.nsISupports) &&
    !iid.equals(Components.interfaces.nsIObserver))
    throw Components.results.NS_ERROR_NO_INTERFACE;

    return this;
  }
};

var WindowListener = {
  setupBrowserUI: function(window) {
    // Take any steps to add UI or anything to the browser window
    // document.getElementById() etc. will work here   
    const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
    var document = window.document;
  	// Event listener
  	window.document.getElementById("appcontent").addEventListener("DOMContentLoaded", BlockSite.BlockSiteMain, false);	
  	
  	// Add our observer
  	var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
  	observerService.addObserver(BlockSiteObserver, "http-on-modify-request", false);

  	// Remove observer when current window closes
  	window.addEventListener("unload", function() {
  	  observerService.removeObserver(BlockSiteObserver, "http-on-modify-request");
  	}, false);
  },

  tearDownBrowserUI: function(window) {
    var document = window.document;

    // Take any steps to remove UI or anything from the browser window
    // document.getElementById() etc. will work here
  	var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
  	observerService.removeObserver(BlockSiteObserver, "http-on-modify-request");
  },

  // nsIWindowMediatorListener functions
  onOpenWindow: function(xulWindow) {

    // A new window has opened
    var domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal);

    // Wait for it to finish loading
    domWindow.addEventListener("load", function listener() {
      domWindow.removeEventListener("load", listener, false);

      // If this is a browser window then setup its UI
      if (domWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser")
        WindowListener.setupBrowserUI(domWindow);
    }, false);
  },

  onCloseWindow: function(xulWindow) {
  },

  onWindowTitleChange: function(xulWindow, newTitle) {
  }
};

function startup(data, reason) {
  var wm = Cc["@mozilla.org/appshell/window-mediator;1"].
           getService(Ci.nsIWindowMediator);
  // Get the list of browser windows already open
  var windows = wm.getEnumerator("navigator:browser");

  while (windows.hasMoreElements()) {

	 var domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);

    WindowListener.setupBrowserUI(domWindow);

  }

  // Wait for any new browser windows to open
  wm.addListener(WindowListener);
}

function shutdown(data, reason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (reason == APP_SHUTDOWN)
    return;

  var wm = Cc["@mozilla.org/appshell/window-mediator;1"].
           getService(Ci.nsIWindowWatcher);

  // Get the list of browser windows already open
  var windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    var domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);

    WindowListener.tearDownBrowserUI(domWindow);
  }

  // Stop listening for any new browser windows to open
  wm.removeListener(WindowListener);
}

function install(data, reason) {
  // We shouldn't start up here; startup() will always be called when
  // an extension should load, and install() sometimes gets called when
  // an extension has been installed but is disabled.
}

function uninstall(data, reason) {
  // We shouldn't shutdown here; shutdown() will always be called when
  // an extension should shutdown, and uninstall() sometimes gets
  // called when startup() has never been called before it.
}