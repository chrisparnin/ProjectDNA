
var async = require('async');
var sys = require('sys');
var fs = require('fs');
var exec = require('child_process').exec;


if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

var args = process.argv.splice(2);

console.log( args );

if( args[0].endsWith(".csv") )
{
    var array = fs.readFileSync(args[0]).toString().split('\n');
    async.eachLimit(array, 5,
        function(item, callback)
        {
            try
            {
                var url = item.split(',')[1];
                if( url )
                {
                    url = url.trim();
                    console.log(url);
                    if( url.indexOf("http") != 0 )
                    {
                        url = "https://" + url;
                    }

                    exec("phantomjs.exe --ssl-protocol=any crawl.js " + url,
                        function puts(error, stdout, stderr) { sys.puts(stdout) }
                    );
                }

                callback(null);
            }

            catch(e)
            {
                callback(e);
            }                
        },
        function(err)
        {
            // if any of the saves produced an error, err would equal that error
            console.log( err );
        })
    ;
}


