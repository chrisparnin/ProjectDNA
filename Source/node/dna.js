
var fs = require('fs');
var path = require('path');
var parse = require('./parse.js')
var trace = require('./readTrace.js')
var _ = require('underscore');

var crypto = require('crypto');

var args = process.argv.slice(2);

if( args[0] == "sequence" )
{
	// args[1] = "JsLib"
	// collection of javascript libraries produced by ApiVersions.js (build/extract cmds in C# driver)
	// api/versions/content
	var apis = loadJsLib(path);
	sequence(apis);
	console.log( JSON.stringify(apis, null, 3 ));

	//var dist = charPairFrequency("france is pants, it is nice, this time of year");
	//console.log( dist );
}
else if( args[0] == "detect" )
{
	var apis = require('./foo.json');
	detect(apis, args[1], {bigramThreshold: .995});
}
else if( args[0] == "detect-api" )
{
	var candidates = [];

	var api = null;
	var sequenceJsonPath = path.join(args[1],"sequence.json");
	// Check for cached version of sequenced api, unless force option is given.
	if( fs.existsSync(sequenceJsonPath) && !_.any(args, function (arg) {return arg == "--f";})
)
	{
		api = require( sequenceJsonPath );
	}
	else
	{
		//console.log( "loading");
		var apis = loadSingleJsLib( args[1] ); // path to api versions 

		//console.log( "sequencing");
		sequence( apis );

		api = _.values(apis)[0];

		// cache
		fs.writeFileSync( sequenceJsonPath, JSON.stringify(api) );
	}

	var data = fs.readFileSync(args[2], 'utf8'); 
	var traceObj = JSON.parse( data );

	for( var script in traceObj.scripts )
	{
		var props = scriptProperties(traceObj.scripts[script]);
		//console.log( "matching", props.scriptUrl);

		var apiCandidates = matchAllApi (api, props);
		for( var i = 0; i < apiCandidates.length; i++ )
		{
			candidates.push( apiCandidates[i] );
		}
	}

	console.log( JSON.stringify(candidates, null, 3) );

	//console.log("candidate pruning", candidates.length);
}
else if( args[0] == "test" )
{
	var apis = require('./foo.json');

	var data = fs.readFileSync(args[1], 'utf8'); 
	var traceObj = JSON.parse( data );

	// trace
	var v172 = "http://z.cdn.turner.com/cnn/.e/js/libs/jquery-1.7.2.min.js";
	var body = traceObj.scripts[v172].body.trim();
	var hash = crypto.createHash('md5');
	hash.setEncoding('hex');
	hash.write(body);
	hash.end();
	var md5 = hash.read();

	// api
	var jq172 = apis.jquery.versions["1.7.2"].contents[1];

	var d = compare( jq172.bigram, charPairFrequency(body) );

	//console.log( d, md5, jq172.hash);

	//console.log(  apis.jquery.versions["1.7.2"].distinctMarkers );

	var calls = trace.extractBodyCalls( body );
	var calls2 = trace.extractBodyCalls( fs.readFileSync(jq172.fullPath, 'utf8')  );

	var markers = _.filter( _.keys(calls2), function (m) 
	{
		return Object.hasOwnProperty.call(calls,m);
	});

	//console.log( "cnnScript", _.keys(calls).length, "jq172", jq172.markers.length, "filtered", markers.length, "again", _.keys(calls2).length );

	//console.log( fs.readFileSync(jq172.fullPath, 'utf8') );

	//console.log( jq172.bigram, charPairFrequency(body));
	//console.log(body);

	//console.log( _.keys( calls2) );

	var uslib = "http://z.cdn.turner.com/cnn/tmpl_asset/static/www_section/2551/js/uslib-min.js";
	var body = traceObj.scripts[uslib].body.trim();
	console.log( body );
}
else
{
	main();
}

function printCandidates (candidates) 
{
	for( var i =0; i < candidates.length; i++ )
	{
		var candidate = candidates[i];
	
		if( candidate.d >= .995 || candidate.hash || candidate.markerScore > .99 || candidate.callScore > .99 )
		{
			console.log( candidate.scriptUrl + ":" + candidate.apiName + ":" + candidate.version + ":" + candidate.fullPath);
			console.log( candidate.d, candidate.hash, candidate.markerScore, candidate.callScore);
			//console.log( candidate.markers );
			//console.log( candidate.contentMarkers );
		}
	}
}

function detect (apis, path, options) 
{
	var data = fs.readFileSync(path, 'utf8'); 
	// fix small issue with trace tool.
	//data = data.replace(/[}][,]undefined\n/g,"},{}");

	threshold = 0.0;
	if( options )
	{
		threshold = options.bigramThreshold;
	}

	var traceObj = JSON.parse( data );

	matchAll(traceObj, apis, threshold);

	//matchCalls(traceObj, apis);
}

function scriptProperties(script)
{
	var body = script.body;
	var scriptUrl = script.scriptUrl;

	var calls = trace.extractBodyCalls( body );

	var markers = sequenceBodyWithoutExports( body );

	var hash = crypto.createHash('md5');
	hash.setEncoding('hex');
	hash.write(body);
	hash.end();
	md5 = hash.read();

	return {body: body, scriptUrl: scriptUrl, calls: calls, markers: markers, md5: md5};
}

function matchAll (traceObj, apis, threshold) 
{
	var candidates = [];

	for( var script in traceObj.scripts )
	{
		var props = scriptProperties(traceObj.scripts[script]);

		for( var apiName in apis )
		{
			var api = apis[apiName];

			var apiCandidates = matchAllApi (api, props);
			for( var i = 0; i < apiCandidates.length; i++ )
			{
				candidates.push( apiCandidates[i] );
			}
		}
	}

	for( var i =0; i < candidates.length; i++ )
	{
		var candidate = candidates[i];
		if( candidate.d >= threshold || candidate.hash || candidate.markerScore > .90 )
		{
			console.log( candidate.scriptUrl + ":" + candidate.apiName + ":" + candidate.version + ":" + candidate.fullPath);
			console.log( candidate.d, candidate.hash, candidate.markerScore);
		}
	}
}

function matchAllApi (api, props) 
{
	var candidates = [];

	var body = props.body;
	var md5 = props.md5;
	var scriptUrl = props.scriptUrl;


	for( var v in api.versions )
	{
		//console.log( api.name, v );
		var version = api.versions[v];
		for( var i = 0; i < version.contents.length; i++  )
		{
			var content = version.contents[i];

			// bigram score
			var d = compare( content.bigram, charPairFrequency(body) );

			// call score

			var markers = _.filter( content.markers, function (m) 
			{
				return _.contains(props.markers,m);
			});

			var calls   = _.filter( content.calls, function (c) 
			{
				return Object.hasOwnProperty.call(props.calls,c);
			});

			candidates.push(
			{
				markers: markers,
				contentMarkers : content.markers,
				markerScore : markers.length / content.markers.length,
				callScore: calls.length / content.calls.length,
				d : d,
				hash : md5 == content.hash,
				fullPath: content.fullPath,
				apiName: api.name,
				version: v,
				scriptUrl: scriptUrl
			});

		}
	}

	return candidates;

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
	var magA = 0.0;
	var magB = 0.0;
	for( var i =0; i < allKeys.length; i++ )
	{
		var key = allKeys[i];
		if( v1.hasOwnProperty(key) && v2.hasOwnProperty(key) )
		{
			sum += v1[key] * v2[key];
			magA += v1[key] * v1[key];
			magB += v2[key] * v2[key];
		}
	}

	var magnitude = Math.sqrt(magA) * Math.sqrt(magB);

	//console.log( sum, magnitude);
	return sum / magnitude;
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


function sequence(apis)
{
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
				var text = fs.readFileSync(content.fullPath, "utf8");

				// markers
				var markers = sequenceAPI( content.fullPath );
				content.markers = _.unique(markers);

				// calls
				content.calls = _.unique(trace.extractBodyCalls( text ));

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

	return apis;
}

function sequenceAPI(apiPath)
{
	var data = fs.readFileSync(apiPath, 'utf8');
	return sequenceBody( data, apiPath);
}

function sequenceBodyWithoutExports(data)
{
	try
	{
		var markers = parse.extractMarkers( data );
		return markers;
	}
	catch (err) 
	{	
		//console.log(err);
		return [];
	}
}

function sequenceBody(data, apiPath)
{
	try
	{
		var markers = parse.extractMarkers( data );

		// export
		var exported = parse.extractExports("./" + apiPath);

		return markers.concat( exported );
	}
	catch (err) 
	{	
		//console.log(err);
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


function loadSingleJsLib( dir )
{
	var apis = {};
	var apiName = path.basename(dir);

	apis[apiName] = {};
	apis[apiName].name = apiName;
	apis[apiName].versions = {};

	loadJsLibVersions(apis,dir, apiName);

	return apis;
}

function loadJsLib( base )
{
	var dirs = fs.readdirSync( base );

	var apis = {};

	for( var i =0; i < dirs.length; i++ )
	{
		var apiName = dirs[i];
		var dir = path.join(base, apiName );

		if( !apis.hasOwnProperty( apiName ) )
		{
			apis[apiName] = {};
			apis.name = apiName;
			apis[apiName].versions = {};
		}

		loadJsLibVersions(apis,dir, apiName);
	}

	return apis;
}

function loadJsLibVersions (apis,dir, apiName) 
{
	// versions of an api
	var versions = fs.readdirSync( dir );
	for( var j = 0; j < versions.length; j++ )
	{
		var versionDir = versions[j];
		var versionName = path.basename(versionDir).replace(apiName+"-");
		var versionPath = path.join(dir, versionDir);

		if( !apis[apiName].versions.hasOwnProperty( versionName ) )
		{
			apis[apiName].versions[versionName] = {};
			apis[apiName].versions[versionName].contents = [];
		}

		// contents in a version
		if( fs.lstatSync(versionPath).isDirectory())
		{
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