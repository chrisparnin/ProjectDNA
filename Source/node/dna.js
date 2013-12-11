
var fs = require('fs');
var path = require('path');
var parse = require('./parse.js')
var trace = require('./readTrace.js')
var _ = require('underscore');

main();


function sequenceAPI(apiPath)
{
	try
	{
		var data = fs.readFileSync(apiPath, 'utf8');
		var markers = parse.extractMarkers( data );

		// export
		var exported = parse.extractExports("./" + apiPath);

		return markers.concat( exported );
	}
	catch (err) 
	{	
		console.log(err);
		return [];
	}
}

function distinctMarkers(apis)
{

	for( var apiName in apis )
	{
		var api = apis[apiName];
		for( var v in api.versions )
		{
			api.distinctMarkers[v] = api.markers[v].filter(function(marker)
			{
				return isUnique(marker, apis, apiName ) && !_.contains(blacklist,marker);
			});

			console.log( apiName + ":" + api.markers[v].length + ":" + api.distinctMarkers[v].length );
		}
	}

}

function isUnique(other, apis, sourceApi)
{
	for( var apiName in apis )
	{
		if( apiName == sourceApi )
			continue;

		var api = apis[apiName];
		for( var v in api.versions )
		{
			for( var m = 0; m < api.markers[v].length; m++ )
			{
				var marker = api.markers[v][m];

				if( marker == other)
					return false;
			}
		}
	}

	return true;
}


function loadApis( base )
{
	var files = fs.readdirSync( base );
	var versionRegex = /((\d+|[.])*)[.]/

	var apis = {};

	for( var i =0; i < files.length; i++ )
	{
		var file = files[i];
		var fullPath = path.join(base, file );
		var apiPart = file.split('-')[0];
		var version = versionRegex.exec( file )[1];

		if( !apis.hasOwnProperty( apiPart ) )
		{
			apis[apiPart] = {};
			apis[apiPart].versions = {};
			apis[apiPart].minified = {};
			apis[apiPart].maps = {};
			apis[apiPart].markers = {};
			apis[apiPart].distinctMarkers	= {};
		}

		if( endsWith(file, ".min.js") )
		{
			apis[apiPart].minified[version] = fullPath;
		}
		else if( endsWith(file, ".js") )
		{
			apis[apiPart].versions[version] = fullPath;
		}
		else if( endsWith(file, ".map") )
		{
			apis[apiPart].maps[version] = fullPath;
		}
	}

	return apis;
}

// DOM functions, etc
var blacklist = ["appendChild","cloneNode","compareDocumentPosition","getAttribute","getAttributeNode","getElementsByTagName",
"getFeature","getUserData","hasAttribute","hasAttributes","hasChildNodes","insertBefore","isDefaultNamespace",
"isEqualNode","isSameNode","isSupported","normalize","removeAttribute","removeAttributeNode","removeChild",
"replaceChild","setAttribute","setAttributeNode","setIdAttribute","setIdAttributeNode","setUserData"];


function main()
{

	var apis = loadApis('./apis');

	console.log( JSON.stringify( apis, null, 3) );

	// Sequence APIs
	for( var apiName in apis )
	{

		var api = apis[apiName];
		for( var v in api.versions )
		{
			var markers = sequenceAPI( api.versions[v] );
			console.log( apiName + ":" + v);
			console.log( markers.join() );
			api.markers[v] = markers;
		}

	}

	// Trim out overlapping makers.
	distinctMarkers(apis);


	// GAME APIS
	// http://techslides.com/html5-game-engines-and-frameworks/


	// Load Traces

	//var data = fs.readFileSync('tests/tumblr.json', 'utf8'); 
	//var data = fs.readFileSync('tests/checkbox.io.json', 'utf8'); 
	//var data = fs.readFileSync('tests/chrome.angrybirds.com.json', 'utf8'); 
	//var data = fs.readFileSync('tests/three-car-trace.json', 'utf8'); 
	var data = fs.readFileSync('tests/getpebble.com-trace.json', 'utf8');

	// fix small issue with trace tool.
	data = data.replace(/[}][,]undefined\n/g,"},{}");

	var calls = trace.extractTraceCalls( data );

	for( var call in calls )
	{
		traceUrl = calls[call].split(':::')[1];
		call = calls[call].split(':::')[0];
		// Bloom filter here gate here...

		for( var apiName in apis )
		{
			var api = apis[apiName];
			for( var v in api.versions )
			{
				for( var m = 0; m < api.distinctMarkers[v].length; m++ )
				{
					var marker = api.distinctMarkers[v][m];

					if( marker == call )
					{
						console.log( apiName + ":" + call + ":" + traceUrl + " found!");
					}
				}
			}
		}

	}


}


function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}