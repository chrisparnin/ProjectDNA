

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

### 6. Sequence Apis

This step will perform an one time sequence of all the libraries provided and cache the results in XXX.



### 7. Detect apis

### 8. Detect specific api on specific resource file


identify
is


### X. Demo

The following is a demo that will scan a directory of trace files and check for instances of jquery query present on scripts references from the website.

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
