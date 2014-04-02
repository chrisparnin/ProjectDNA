## Dna ##

`Dna` analyzes the javascript libraries and functions calls that are used while browsing a website.  If you provide a set of libraries to train on and a trace collected while browsing a site, then it can detect a set of javascript libraries related to that site.

### Trace

A *trace* is a recorded history of a sequence of events produced when browsing a web site.  Dna focuses on events related to the javascript libraries loaded and functions called while browsing the site. Dna can process traces related to two different tracers.

#### a) PhantomJs Tracer

[http://phantomjs.org/](PhantomJs) is a headless browser based on WebKit that allows browsers to be automatically scripted.  Dna uses a modified version of phantomjs, which supports recording which javascript libraries get loaded when browsing a web site.

#### b) Chrome Extension Tracer

Sometimes automatically crawling a web site can be difficult (high interactivity/security/accounts).  Dna can also read traces collected while manually browsing a site with the following Chrome extension: 
[JS-Trace](https://github.com/shauvik/js-trace).

### Known Libraries

There are several sources for aggregating known javascript libraries.
[JSTER](http://jster.net/) has over 1400 javascript libraries that are categorized in its collection.  An public API to consume the collection is planned to be released soon. [jsDelivr API](https://github.com/jsdelivr/api) can load content loaded on various content delivery networks (CDNs). 

Possible other resources: 

- [w3techs.com](http://w3techs.com/)
- [bower.io/search/](http://bower.io/search/)
- [npmjs.org/](https://www.npmjs.org/) 
- [component.io/](http://component.io/)


### Using Dna

The following is based on the command line driver (CSharp)

**detect:** Detect presence of javascript library in 

    $ dna detect siteTrace.json 

Detect presence of javascript on directory containing trace files (ending with .json).

    $ dna detect top100Traces/


**report:** Output javascript library function usage report from site trace or directory of traces.

Generate report based on one site.

    $ dna report siteTrace.json 

Generate report based on directory containing trace files (ending with .json).

    $ dna report top100Traces/


### Work-in Progress

- Better version detection support.
- Better integration with JSter API (when available).
- Include related frameworks in report (associative rule mining).
- Explore other detection techniques (e.g. support vector machines)