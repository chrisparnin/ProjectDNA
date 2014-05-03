

## Steps

### 0. Environmental Dependencies

The following programs should be installed and **on the path**:

- npm (installed via [node](http://nodejs.org/)).
- [bower](http://bower.io/)

    `npm install -g bower`

- [grunt](http://gruntjs.com/installing-grunt)

	`npm install -g grunt`

- [git](http://git-scm.com/)

### 1. Configure and Build ProjectDna

- Open `ProjectDna\Source\ProjectDna.sln`
- Inspect `Dna\Config.cs`, to understand default settings.
- Build solution, producing `ProjectDna\Source\Dna\bin\Debug\Dna.exe`

### 2. Configure and Build node source

- `cd ProjectDna\Source\node`
- `npm install`

### 3. Build Bower Repository

This step will use bower to get a nice collection of javascript apis and their respective versions.  The .csv file contains a list of javascript apis.

- Run cmd shell in **Administrator mode** (Bower sometimes needs it).
- `cd ProjectDna\Source\Dna\bin\Debug`
- `Dna.exe build ..\..\..\ProjectDna\Data\JSLibs-Simple.csv`

**This step may take over an hour depending on your internet connection.**

### 4. Extract javascript files

This step will attempt to extract the main components of a javascript library and copy them to a destination directory.  For some projects, grunt will be run if the distributed components are not included by default.

- `Dna.exe extract "Resources\JsLib"`


**You may want to delete `ProjectDNA\Source\Dna\bin\Debug\Resources\Bower` after this step in order to conserve space.**

### 5. Sequence Apis

This step will perform an one time sequence of all the libraries provided and cache the results in `args[1]\sequence.json`.

- `Dna.exe sequence "Resources\JsLib"`


### 6. Detect apis on specific resource file or content string

"identify" will take in a file or content piped in from the input stream and output the most likely set of apis:

- `Dna.exe identify Resources\JsLib < Resources\JsLib\backbone\0.3.0\backbone.js`

Producing
 
    backbone 0.3.0 Distance 1 
    backbone 0.3.1 Distance 0.999954876326061
    backbone 0.2.0 Distance 0.992078408334354
    backbone 0.3.2 Distance 0.999642311180953
    backbone 0.3.3 Distance 0.998930818018881
    backbone 0.1.2 Distance 0.990826099412685

You must have already sequenced the `Resources\JsLib` by running step 5 first.

### 7. Detect apis

TBW

### 8. Demo

The following is a demo that will scan a directory of trace files and check for instances of jquery references from a website.

    Dna.exe demo Resources\JsLib\jquery\ ..\..\..\node\crawler\json\

The relevant code snippet is here:

        private static void Demo(string apiPath, string traceFileDir)
        {
            foreach (var traceFile in Directory.GetFiles(traceFileDir))
            {
                Console.WriteLine(traceFile);
                var results = DnaShell.DetectApi(apiPath, traceFile);
                var candidates = Rank.Top(results, apiPath, 1, new Criteria()
                {
                    MinMarkerScore = 0.90,
                    MinDistance = .99,
                    MinCallScore = .90
                });

                // because only looking at 1 top candidate, can flatten entire list.
                var apiVersionList = Rank.Usage(candidates.SelectMany(c => c.Value).ToList());
                foreach (var apiVersion in apiVersionList)
                {
                    Console.WriteLine(apiVersion.SummaryReport());
                }
            }
        }
