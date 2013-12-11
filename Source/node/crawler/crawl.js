

var system = require('system');
var fs = require('fs');
var async = require('async');
var absolute = require('./absolute');
var md5 = require('MD5');


if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

(function(host) {
 
    function Crawler(maxUrls) {
        var self = this;
        this.visitedURLs = {};
        this.alivePages = 0;
        this.maxUrls = maxUrls;
        this.done = false;
        this.pageCount = function()
        {
            var count = 0;
            for( var url in self.visitedURLs )
            {
                count++;
            }
            return count;
        }


        this.pendingPages = function()
        {
            var count = 0;

            for( var url in this.visitedURLs )
            {
                if( this.visitedURLs[url] == 'opening' || this.visitedURLs[url] == 'opened')
                {
                    count++;
                }
            }
            return count;
        }

        this.crawl = function (url, depth, onSuccess, onFailure, onDone, onScriptFile) 
        {
            var self = this;

            if( self.pageCount() > self.maxUrls )
            {
                return;
            }

            if ( 0 == depth ) 
            {
                return;
            };

            var page = Crawler.webpage.create();
            page.settings.userAgent = 'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5355d Safari/8536.25';
            //page.settings.resourceTimeout = 10000; 

            self.alivePages = self.alivePages + 1;

            page.onConsoleMessage = function(msg) {
                //system.stderr.writeLine('console: ' + msg);
            };

            page.onResourceReceived = function(r) {
                //console.log('Status code: ' + r.status);
                if( r.stage == "end" && r.url.endsWith(".js") && r.contentType && r.contentType.indexOf("javascript") != -1 )
                {
                    //console.log("contenttype: " + r.contentType)
                    onScriptFile( {pageUrl: url, scriptUrl: r.url, body: r.body} );
                }

            };

            console.log("Opening url: " + url);

            self.visitedURLs[url] = 'opening';

            page.open(url, function (status) {

                console.log("Opened url: " + url);
                self.visitedURLs[url] = 'opened';

                self.alivePages = self.alivePages - 1;

                if ('fail' === status) { 
                    
                    self.visitedURLs[url] = 'fail';

                    onFailure({
                        url: url, 
                        status: status,
                        inlineScripts: [],
                        crawler: self                        
                    });


                    //if( self.alivePages == 0 )
                    //{
                    //    onDone(self);    
                    //}

                } 
                else {

                    window.setTimeout(function () 
                    {
                        //var documentHTML = page.evaluate(function () {
                        //    return document.body && document.body.innerHTML ? document.body.innerHTML : "";
                        //});

                        var linksAndScripts = self.getAllURLsAndInlineScripts(page);
                        //console.log( JSON.stringify(linksAndScripts,null,3) );

                        var inlineScripts = linksAndScripts.inlineScripts.map(function (script) {
                            return {body: script.body, pageUrl: url};
                        });


                        //var urls = self.getAllURLs(page)
                        var urls = linksAndScripts.links
                            .map(function (link) {
                                return {url:absolute.absoluteUri(link.baseUrl, link.href),domain:link.domain};
                            })
                            .filter(function(link) {
                                var parts = absolute.parseUri(link.url);
                                return Crawler.isSameDomain(parts.host, link.domain);
                            })
                            // Filter out urls already visited!
                            .filter(function(link){
                                return !self.visitedURLs[url.href];
                            })
                            .map(function (link) {
                                return link.url;
                            });


                        page.close();
                        page = null;

                        console.log("Processed and visited url: " + url);
                        self.visitedURLs[url] = true;

                        self.crawlURLs(urls, depth - 1, onSuccess, onFailure, onDone, onScriptFile);

                        onSuccess({
                            url: url,
                            status: status,
                            inlineScripts: inlineScripts,
                            crawler: self
                            //,content: documentHTML
                        });

                        console.log("Exploring next urls: " + urls.length );


                    }, 5000);
                };
            });
        };

    };
 
    Crawler.webpage = require('webpage');


    Crawler.prototype.getAllURLsAndInlineScripts = function(page) {
        return page.evaluate(function () {
            var baseUrl = window.location.origin;
            var domain = window.location.host;

            var links = Array.prototype.slice.call(document.querySelectorAll("a"), 0)
                    .map(function (link) {
                        return {href: link.getAttribute("href"), domain: domain, baseUrl: baseUrl };
                    })
                    .filter(function (link)
                    {
                        return link.href && link.href.indexOf(".zip", link.length - ".zip".length) == -1;
                    });

            links = links || [];

            var scripts = [];
            var domScripts = document.querySelectorAll("script");
            if( domScripts && domScripts.length > 0)
            {
                scripts = Array.prototype.slice.call(domScripts, 0)
                    // Only keep scripts that are inline.
                    .filter(function (script)
                    {
                        try
                        {
                            var src =  script.getAttribute("src");
                            return (src == "" || src == null );
                        }
                        catch(e) {}
                    })
                    // Shape script object.
                    .map(function (script) {
                        return {body: script.innerHTML};
                    });
                scripts = scripts || [];
            }

            return {links: links,inlineScripts: scripts};
        });
    };
 
    Crawler.prototype.getAllURLs = function(page) {
        return page.evaluate(function () {
            var baseUrl = window.location.origin;
            var domain = window.location.host;
            return Array.prototype.slice.call(document.querySelectorAll("a"), 0)
                    .map(function (link) {
                        return {href: link.getAttribute("href"), domain: domain, baseUrl: baseUrl };
                    })
                    .filter(function (link)
                    {
                        return link.href && link.href.indexOf(".zip", link.length - ".zip".length) == -1;
                    });
        });
    };
 
    Crawler.prototype.crawlURLs = function(urls, depth, onSuccess, onFailure, onDone, onScript) {
        var self = this;
        urls.forEach(function (url) {
            self.crawl(url, depth, onSuccess, onFailure, onDone, onScript);
        });
    };
 
    Crawler.isSameDomain = function(urlDomain, rootDomain) {
        return urlDomain.endsWith(rootDomain);
    };

    host.Crawler = Crawler;
})(phantom);



 function onDone(me, onComplete, scripts)
{
    if( me.pendingPages() > 0 && me.waitAttempts < 10)
    {
        // You have a few more seconds...
        setTimeout( function()
        {
            me.waitAttempts++;
            onDone( me, onComplete, scripts);
        },
        5000);   
    }
    else
    {
        console.log( "Completed crawl " + me.waitAttempts + ":" + me.pendingPages() );
        onComplete(me, scripts);
    }
} 


function CrawlUrl(url, depth, maxUrls, onComplete)
{
    var scripts = {}

    new phantom.Crawler(maxUrls).crawl(url, depth, 
        function onSuccess(page) {
            console.log("Loaded page. URL = " + page.url + " status = " + page.status);

            // Add inlines.
            for( var i = 0; i < page.inlineScripts.length; i++ )
            {
                var inline = page.inlineScripts[i];
                var hash = md5( inline.body );
                inline.scriptUrl = "/inline_" + hash;

                if( !scripts.hasOwnProperty( inline.scriptUrl ) )
                {
                    scripts[inline.scriptUrl] = inline;
                }
            }

            var me = page.crawler;
            //console.log( me.alivePages + ":" + me.pendingPages() + ":" + me.pageCount() + ":" + JSON.stringify(me.visitedURLs) );
            if( me.alivePages == 0 || me.pendingPages() == 0 || me.pageCount() > me.maxUrls )
            {
                me.waitAttempts = 0;
                onDone(me, onComplete, scripts);
            }
        },
        function onFailure(page) {
            console.log("Could not load page. URL = " +  page.url + " status = " + page.status);

            var me = page.crawler;
            if( me.alivePages == 0 || me.pendingPages() == 0 || me.pageCount() > me.maxUrls )
            {
                me.waitAttempts = 0;
                onDone(me, onComplete, scripts);
            }
        },
        // When crawl signals it is complete.
        function onDoneCrawl(me)
        {
            me.waitAttempts = 0;
            onDone(me, onComplete, scripts);
        },       
        function onScriptFile(r)
        {
            if( !scripts.hasOwnProperty( r.scriptUrl ) )
            {
                scripts[r.scriptUrl] = r;
            }
            // console.log('received: "' + r.url + '" with ' + ((r.body === '') ? 'no body' : ('"' + r.body + '" as body')));

        }
    );
    
}

phantom.onError = function(msg, trace) {
    var msgStack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function + ')' : ''));
        });
    }
    console.error(msgStack.join('\n'));
    //phantom.exit(1);
};

var args = system.args;
if( args.length > 1 )
{
    var url = args[1];

    CrawlUrl(url, 2, 10, function(crawler,scripts)
    {
        var path = 'json/' + url.replace("https://","").replace("http://","").replace("/","") + ".json";

        if( !fs.exists('json') )
        {
            fs.makeDirectory('json');
        }

        var obj = {};
        obj["url"] = url;
        obj["scripts"] = scripts;
        obj["visitedURLs"] = crawler.visitedURLs;

        fs.write(path, JSON.stringify(obj, null, 3), 'w');

        phantom.exit();
    });
}

