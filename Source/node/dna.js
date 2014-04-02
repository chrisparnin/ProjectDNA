
var fs = require('fs');
var path = require('path');
var parse = require('./parse.js')
var trace = require('./readTrace.js')
var _ = require('underscore');

var crypto = require('crypto');

var args = process.argv.slice(2);

if( args[0] == "sequence" )
{
	sequence(args[1]);

	//var dist = charPairFrequency("france is pants, it is nice, this time of year");
	//console.log( dist );
}
else if( args[0] == "detect" )
{
	detect(args[1]);	
}
else
{
	main();
}

function detect (path) 
{
	var apis = require('./foo.json');

	var data = fs.readFileSync(path, 'utf8'); 
	// fix small issue with trace tool.
	//data = data.replace(/[}][,]undefined\n/g,"},{}");

	var traceObj = JSON.parse( data );

	matchBigram(traceObj, apis);

	//matchCalls(traceObj, apis);
}

function matchBigram (traceObj, apis) 
{
	for( var script in traceObj.scripts )
	{
		var body = traceObj.scripts[script].body;
		var scriptUrl = traceObj.scripts[script].scriptUrl;

		for( var apiName in apis )
		{
			var api = apis[apiName];
			for( var v in api.versions )
			{
				var version = api.versions[v];
				for( var i = 0; i < version.contents.length; i++  )
				{
					var content = version.contents[i];

					var d = compare( content.bigram, charPairFrequency(body) );

					var hash = crypto.createHash('md5');
					hash.setEncoding('hex');
					hash.write(body);
					hash.end();
					md5 = hash.read();

					console.log( scriptUrl + ":" + apiName + ":" + v + ":" + content.fullPath);
					console.log( d + ":" + (md5 == content.hash));					
				}
			}
		}
	}
}

function matchCalls(traceObj, apis)
{
	var calls = trace.extractPhantomJsCalls( traceObj );

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
				var version = api.versions[v];
				for( var i = 0; i < version.contents.length; i++  )
				{
					var content = version.contents[i];

					for( var m = 0; m < content.distinctMarkers.length; m++ )
					{
						var marker = content.distinctMarkers[m];

						if( marker == call )
						{
							console.log( apiName + ":" + call + ":" + traceUrl + " found!");
						}
					}

				}
			}
		}

	}


}

function compare(v1, v2)
{
	var allKeys = _.union(_.keys(v1),_.keys(v2));
	var sum = 0.0;
	for( var i =0; i < allKeys.length; i++ )
	{
		var key = allKeys[i];
		if( v1.hasOwnProperty(key) && v2.hasOwnProperty(key) )
		{
			sum += v1[key] * v2[key];
		}
	}

	return sum / (_.keys(v1).length * _.keys(v2).length);
}

function charPairFrequency (wholeStr) 
{
	var idents = tokenizeStr(wholeStr);
	var AllPairs = [];
	for( var i =0; i < idents.length; i++ )
	{
		var id = idents[i];
		var pairs = letterPairs(id);
		for( var p=0; p < pairs.length; p++ )
		{
			AllPairs.push( pairs[p] );
		}
	}

	return letterPairsFrequency(AllPairs);
}

function tokenizeStr (str)
{
	return str.split(/(\W|\d)+/);
}

function letterPairsFrequency(pairs) 
{
	dist = {};
	for( var i =0; i < pairs.length; i++ )
	{
		var p = pairs[i];
		if( !dist.hasOwnProperty( p ))
		{
			dist[p] = 0;
		}
		dist[p]++;
	}
	return dist;
}

function letterPairs (str) 
{
	var numPairs = str.length - 1;
    var pairs = [];

    for (var i = 0; i < numPairs; i++)
    {
    	pairs.push( str.substring(i, i+2) );
    }

    return pairs;
}


function sequence(path)
{
	var apis = loadJsLib(path);
	//console.log( JSON.stringify(apis, null, 3 ));

	//var apis = loadApis('./apis');

	// Sequence APIs
	for( var apiName in apis )
	{
		var api = apis[apiName];
		for( var v in api.versions )
		{
			var version = api.versions[v];
			for( var i = 0; i < version.contents.length; i++  )
			{
				var content = version.contents[i];

				// markers
				var markers = sequenceAPI( content.fullPath );
				//console.log( apiName + ":" + v);
				//console.log( markers.join() );
				content.markers = markers;

				var text = fs.readFileSync(content.fullPath, "utf8");
				// hash
				var hash = crypto.createHash('md5');
				hash.setEncoding('hex');
				hash.write(text);
				hash.end();
				content.hash = hash.read();

				// bigram
				content.bigram = charPairFrequency(text);
			}
		}

	}

	// Trim out overlapping makers.
	distinctMarkers(apis);

	console.log( JSON.stringify(apis, null, 3 ));
}

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
			var version = api.versions[v];
			for( var i = 0; i < version.contents.length; i++  )
			{
				var content = version.contents[i];

				content.distinctMarkers = content.markers.filter(function(marker)
				{
					return isUnique(marker, apis, apiName ) && !_.contains(blacklist,marker);
				});

				//console.log( apiName + ":" + content.markers.length + ":" + content.distinctMarkers.length );
			}
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
			var version = api.versions[v];
			for( var i = 0; i < version.contents.length; i++  )
			{
				var content = version.contents[i];
				for( var m = 0; m < content.markers.length; m++ )
				{
					var marker = content.markers[m];

					if( marker == other)
						return false;
				}
			}
		}
	}

	return true;
}


function loadJsLib( base )
{
	var dirs = fs.readdirSync( base );
	var versionRegex = /((\d+|[.])*)[.]/

	var apis = {};

	for( var i =0; i < dirs.length; i++ )
	{
		var apiName = dirs[i];
		var dir = path.join(base, apiName );

		if( !apis.hasOwnProperty( apiName ) )
		{
			apis[apiName] = {};
			apis[apiName].versions = {};
		}

		// versions of an api
		var versions = fs.readdirSync( dir );
		for( var j = 0; j < versions.length; j++ )
		{

			var versionDir = versions[j];
			var versionName = path.basename(versionDir).replace(apiName+"-");
			var versionPath = path.join(dir, versionDir);

			//console.log( apiName + ":" + versionName );

			if( !apis[apiName].versions.hasOwnProperty( versionName ) )
			{
				apis[apiName].versions[versionName] = {};
				apis[apiName].versions[versionName].contents = [];
			}

			// contents in a version
			var contents = fs.readdirSync( versionPath );
			for( var k = 0; k < contents.length; k++ )
			{
				var content = contents[k];
				var jsPath = path.join( versionPath, content);
				apis[apiName].versions[versionName].contents.push(
				{
					fullPath: jsPath,
					markers : {},
					distinctMarkers : {},
					hash : {},
					bigram : {}
				});
			}
		}

	}

	return apis;
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