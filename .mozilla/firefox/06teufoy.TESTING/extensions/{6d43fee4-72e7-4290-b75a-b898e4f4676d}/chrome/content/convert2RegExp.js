// This script converts patterns to regexps.
// Thanks Wladimir Palant ;-)

function convert2RegExp(pattern)
{
	var res = "";
	
	if (/^\/.*\/$/.test(pattern))  // pattern is a regexp already
		res = pattern.substr(1, pattern.length - 2);
	else
	{
		res = pattern.replace(/\*+/g, "*");	// (1)
	        res = res.replace(/(\W)/g, "\\$1"); 	// (2)
	        res = res.replace(/\\\*/g, ".*");    	// (3)
	        res = res.replace(/^\\\|/, "^");	// (4)
	        res = res.replace(/\\\|$/, "$");	// (5)
	        res = res.replace(/^(\.\*)/,"");	// (6)
	        res = res.replace(/(\.\*)$/,"");	// (7)
	}
	
	try
	{
		return new RegExp('^' + res, "i");
	}
	catch(error)
	{
		return false;
	}
}
