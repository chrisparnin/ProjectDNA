bower = require('bower');
util = require('util');
async = require('async');

if( process.argv.length == 4)
{
	//installAllVersions( 'jquery', 'https://github.com/jquery/jquery' );
	//installAllVersions( 'fake', 'https://github.com/fake/fake' );
	installAllVersions( process.argv[2], process.argv[3]);
}
else
{
	console.log("Usage: name url");
}


function installAllVersions(pkgName, url)
{
	bower.commands
	.info(pkgName, '')
	.on('end', function (results) 
	{
		if( results && results.versions )
		{
			async.eachSeries( results.versions, function (version, callback) 
			{

				var pkg = util.format('%s-%s=%s.git#%s', pkgName, version, url,version);
				bower.commands.install([pkg], {save: true})
				.on('end',function (data)
				{
					//console.log(data);
					console.log("Installing: " + pkg);
					callback();
				})
				.on('error', function (error) {
					console.log("Error: " +  error);
					callback();
				});
			});
		}

	})
	.on('error', function (error)
	{
		console.log(error);
	});
}

