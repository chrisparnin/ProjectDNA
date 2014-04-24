using Dna.JSLib;
using Dna.JSLib.Models;
using Dna.JSLib.Shells;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Dna
{
    class Program
    {
        static void Main(string[] args)
        {
            //string outputs = "build";
            //ExtractJSLibFiles("https://github.com/angular/angular.js", @"C:\dev\sandbox\", "angular.js", outputs.Split(','));
            //ApiVersionsShell.InstallAllVersions("knockoutjs", "https://github.com/knockout/knockout");

            //Build(@"C:\dev\ProjectDNA\Source\ProjectDna\Data\JSLibs-Simple.csv", @"C:\dev\ProjectDNA\Resources\JsLib");
            //Sequence(@"C:\DEV\ProjectDNA\Source\Dna\bin\Debug\JsLib");


            //if (args.Length < 1)
            //    return;
            if (args.Length == 0)
            {
                args = new string[]
                {
                    "demo",
                    @"C:\DEV\ProjectDNA\Source\Dna\bin\Debug\JsLib\jquery",
                    @"C:\DEV\ProjectDNA\Source\node\crawler\json"
                };
            }


            string cmd = args[0];
            string bowerDir = Config.BowerRepositoryPath;

            switch (cmd)
            {
                case "build":
                    // args[1] @"C:\dev\ProjectDNA\Source\ProjectDna\Data\JSLibs-Simple.csv", 
                    // @"C:\dev\ProjectDNA\Resources\Bower" (will install to Bower\bower_components)
                    if (args.Length == 3)
                    {
                        bowerDir = args[2];
                    }
                    Build(args[1], bowerDir);
                    break;
                case "extract":
                    // args[1] @"C:\dev\ProjectDNA\Resources\JsLib" (copies bower components (main outputs) to dest)
                    // args[2] @"C:\DEV\ProjectDNA\Source\Dna\bin\Debug\Resources\Bower"
                    if (args.Length == 3)
                    {
                        bowerDir = args[2];
                    }
                    bowerDir = System.IO.Path.Combine(bowerDir, "bower_components");
                    Extract(bowerDir, args[1]);
                    break;
                case "sequence":
                    Sequence(args[1]); // apisRootDirectory
                    break;
                case "detect":
                    // args[1] path to JsLib created by "extract"
                    // args[2] path to tracefile.
                    Detect(MakeRelativePathAbsolute(args[1]), MakeRelativePathAbsolute(args[2]));
                    break;
                case "demo":
                    Demo(MakeRelativePathAbsolute(args[1]), MakeRelativePathAbsolute(args[2]));
                    break;
                default:
                    break;
            }

            //Console.ReadKey();
        }

        private static string MakeRelativePathAbsolute(string relPath)
        {
            return new DirectoryInfo(relPath).FullName;
        }


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
        // TODO Metric -- inclusive, exclusion (calls/markers)
        // TODO Json output.
        private static void Sequence(string apisRootDirectory)
        {
            SequenceShell.SequenceApis(apisRootDirectory);
        }

        private static void Detect(string jsLib, string traceFileOrDirectory)
        {
            if (Directory.Exists(traceFileOrDirectory))
            {
                foreach (var trace in Directory.EnumerateFiles(traceFileOrDirectory, "*.json"))
                {
                    DnaShell.Detect(jsLib, trace);
                }
            }
        }

        private static void Build(string csvPath, string destPath)
        {
            BuildApiLibrary(csvPath, destPath);
        }

        private static void Extract(string bowerPath, string destPath)
        {
            var apis = Bower.ExtractJsLibsFromBowerComponents(bowerPath);
            
            apis.ForEach(api => api.CopyTo(destPath));
        }

        public static void BuildApiLibrary(string csv, string dir)
        {
            // Fetch repositories.
            // Parse and setup facts.
            var rows = System.IO.File
                .ReadAllText(csv)
                .Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries)
                .Skip(1) // skip headers
                .Select(line => CSVReader.ParseCsvRow(line))
                .ToList();


            foreach (var row in rows)
            {
                // Option 1: Try to get all versions via Bower
                Console.WriteLine(string.Format("Option 1: Retrieving apis via bower - {0} - {1}", row[0], row[3]));
                var output = ApiVersionsShell.InstallAllVersions(row[0], row[3], dir);

                Console.WriteLine(output);

                //Thread.Sleep(200);
                // Option 2: Retrieve github repo, build locally via grunt.
                // There is code in place for doing this, but focusing on how far option 1 goes.
            }

            Console.WriteLine(rows.Count());
        }

    }
}
