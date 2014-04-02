var fs = require('fs');
var esprima = require('esprima');

var parse = require('./parse.js')

var options = {tokens:true, tolerant: true, loc: true, range: true };


exports.extractPhantomJsCalls = function (traceObj) 
{
	var allCalls = {};


	for( var script in traceObj.scripts )
	{
		var body = traceObj.scripts[script].body;
		var result = esprima.parse(body, options);
		var calls = parse.extractCalls( result );

		for( var c=0; c < calls.length; c++ )
		{
			var call = calls[c];
			allCalls[call] = call + ":::" + traceObj.scripts[script].scriptUrl;
		}

	}

	return allCalls;

} 

exports.extractTraceCalls = function (data) 
{

	var traceObj = JSON.parse( data );

	var allCalls = {};

	for( var i =0; i < traceObj.length; i++ )
	{
		var traceEvent = traceObj[i][0];
		if( traceEvent.url.indexOf("extensions::") != 0 && traceEvent.url.indexOf("chrome-extension:") != 0 && traceObj[i].length > 1)
		{

			var traceSource = traceObj[i][1];
			if( traceSource.scriptSource )
			{
				console.log( traceEvent.url );

				var result = esprima.parse(traceSource.scriptSource, options);

				console.log( traceSource.scriptSource );
				var calls = parse.extractCalls( result );

				for( var c=0; c < calls.length; c++ )
				{
					var call = calls[c];
					allCalls[call] = call + ":::" + traceEvent.url;
				}
			}

		}
	}

	return allCalls;
}