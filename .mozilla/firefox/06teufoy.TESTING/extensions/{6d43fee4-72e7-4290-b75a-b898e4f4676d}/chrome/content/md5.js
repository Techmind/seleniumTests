function hex_md5(str)
{
	//Calculate the hex rep of MD5 or s
	/*
	PLEASE NOTE
	nsICryptoHash can be used to compute a cryptographic hash function of some data. You can, for example, calculate the MD5 hash of a file to determine if it contains the data you think it does. The hash algorithms supported are MD2, MD5, SHA-1, SHA-256, SHA-384, and SHA-512. This interface is only available in Firefox 1.5 or newer. 
	
	This code was copied from http://developer.mozilla.org/en/docs/nsICryptoHash
	*/
	var converter =	Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

	// we use UTF-8 here, you can choose other encodings.
	converter.charset = "UTF-8";
	// result is an out parameter,
	// result.value will contain the array length
	var result = {};
	// data is an array of bytes
	var data = converter.convertToByteArray(str, result);
	var ch = Components.classes["@mozilla.org/security/hash;1"]
	                   .createInstance(Components.interfaces.nsICryptoHash);
	ch.init(ch.MD5);
	ch.update(data, data.length);
	var hash = ch.finish(false);

	// return the two-digit hexadecimal code for a byte
	function toHexString(charCode)
	{
	  return ("0" + charCode.toString(16)).slice(-2);
	}

	// convert the binary hash data to a hex string.
	return [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
}
