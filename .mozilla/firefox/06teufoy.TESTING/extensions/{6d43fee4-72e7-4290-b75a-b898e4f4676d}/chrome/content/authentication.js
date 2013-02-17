function authenticate()
{
	// promptPassword
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	                        .getService(Components.interfaces.nsIPromptService);
	
	const BlockSitePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("BlockSite.");

	if(BlockSitePrefBranch.getCharPref("password") == "")
	{
		return true;
	}
	
	input = {value:""};
	check = {value:false};
	okorcancel = prompts.promptPassword(window, 'BlockSite Authentication', 'Enter your password to unlock.', input, null, check);

	if( okorcancel && hex_md5(input.value) == BlockSitePrefBranch.getCharPref("password") || BlockSitePrefBranch.getCharPref("password") == "") 
	{
		return true; 
	}
	else
	{ 
		alert("Access denied");
		return false;
	}
}

function blockSiteAuthentication()
{
	const BlockSitePrefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("BlockSite.");
	
	if(BlockSitePrefBranch.getBoolPref("authenticate"))
	{
		if(!authenticate())
		{
			window.close();
		}
	}
}

window.addEventListener("load", blockSiteAuthentication, false);