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
            switch (cmd)
            {
                case "build":
                    // args[1] @"C:\dev\ProjectDNA\Source\ProjectDna\Data\JSLibs-Simple.csv", 
                    // @"C:\dev\ProjectDNA\Resources\Bower" (will install to Bower\bower_components)
                    Build(args[1], args[2]);
                    break;
                case "extract":
                    // args[1] @"C:\DEV\ProjectDNA\Source\Dna\bin\Debug\bower_components\"
                    // args[2] @"C:\dev\ProjectDNA\Resources\JsLib" (copies bower components (main outputs) to dest)
                    Extract(args[1], args[2]);
                    break;
                case "sequence":
                    Sequence(args[1]); // apisRootDirectory
                    break;
                case "detect":
                    Detect(args[1]);
                    break;
                case "demo":
                    Demo(args[1], args[2]);
                    break;
                default:
                    break;
            }

            Console.ReadKey();
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

        private static void Sequence(string apisRootDirectory)
        {
            SequenceShell.SequenceApis(apisRootDirectory);
        }

        private static void Detect(string traceFileOrDirectory)
        {
            if (Directory.Exists(traceFileOrDirectory))
            {
                foreach (var trace in Directory.EnumerateFiles(traceFileOrDirectory, "*.json"))
                {
                    // Shell.
                }
            }
        }

        private static void Build(string csvPath, string destPath)
        {
            BuildApiLibrary(csvPath, destPath);
        }

        private static void Extract(string bowerPath, string destPath)
        {
            var apis = ExtractJsLibsFromBowerComponents(bowerPath);
            
            apis.ForEach(api => api.CopyTo(destPath));
        }

        private static List<Api> ExtractJsLibsFromBowerComponents(string path)
        {
            var apis = new Dictionary<string,Api>();

            foreach (var dir in Directory.EnumerateDirectories(path))
            {
                try
                {
                    ExtractLibVersionComponents(apis, dir);
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                }
            }

            return apis.Values.ToList();
        }

        private static void ExtractLibVersionComponents(Dictionary<string, Api> apis, string dir)
        {
            var bower = Path.Combine(dir, ".bower.json");
            var pkg = Path.Combine(dir, "package.json");

            JObject obj = null;

            if (File.Exists(bower))
            {
                obj = JObject.Parse(File.ReadAllText(bower));
            }
            else if (File.Exists(pkg))
            {
                obj = JObject.Parse(File.ReadAllText(pkg));
            }

            if (obj != null)
            {
                var name = obj.GetValue("name").Value<string>();

                var versionTok = obj.GetValue("version");
                // versions sometimes not in bower but in package
                var version = "";
                if (versionTok == null)
                {
                    if ((File.Exists(bower) && File.Exists(pkg)))
                    {
                        var tempObj = JObject.Parse(File.ReadAllText(pkg));
                        version = tempObj.GetValue("version").Value<string>();
                    }
                }
                else
                {
                    version = versionTok.Value<string>();
                }




                name = name.Replace("-" + version, "");

                JToken mainTok = null;
                var main = "";
                if (obj.TryGetValue("main", out mainTok))
                {
                    main = mainTok.Type == JTokenType.String ? mainTok.Value<string>() :
                        mainTok.First().Value<string>();
                }
                // If there is no "main" field provided, try looking in package.json.
                else if ((File.Exists(bower) && File.Exists(pkg)))
                {
                    //obj = (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(File.ReadAllText(pkg));
                    obj = JObject.Parse(File.ReadAllText(pkg));
                    if (obj.TryGetValue("main", out mainTok))
                    {
                        main = mainTok.Type == JTokenType.String ? mainTok.Value<string>() :
                            mainTok.First().Value<string>();
                    }
                }

                // Sometimes people use name of api, but without .js...
                // e.g. main: "lib/abaaso" refers to "lib/abaabso.js"
                if (!Directory.Exists(Path.Combine(dir, main)) &&
                    File.Exists(Path.Combine(dir, main + ".js"))
                   )
                {
                    main = main + ".js";
                }

                // Crazy case -- if main is a gruntfile, build it.
                if (main == "Gruntfile.js")
                {
                    NpmShell.InstallLocalDeps(dir);
                    GruntShell.Build(dir);
                    main = "dist";
                }

                // remove relative prefix ./
                if (main.StartsWith("./"))
                {
                    main = main.Remove(0, 2);
                }

                Console.WriteLine("{0} {1} {2}", name, version, main);

                if (!string.IsNullOrEmpty(main) &&
                    (Directory.Exists(Path.Combine(dir, main))
                      || File.Exists(Path.Combine(dir, main))
                    )
                  )
                {
                    if (!apis.ContainsKey(name))
                    {
                        apis[name] = new Api();
                        apis[name].Name = name;
                    }

                    if (Directory.Exists(Path.Combine(dir, main)))
                    {
                        ApiVersion apiVersion = new ApiVersion();
                        apiVersion.CanonicalPath = Path.Combine(dir, main).Replace("\\", "/");
                        apiVersion.Version = version;
                        apiVersion.Files = Directory.GetFiles(Path.Combine(dir, main), "*.js")
                            .Select(f => f.Replace("\\", "/")).ToList();


                        apis[name].AddVersion(apiVersion);
                    }
                    else
                    {
                        ApiVersion apiVersion = new ApiVersion();
                        apiVersion.CanonicalPath = new FileInfo(Path.Combine(dir, main)).DirectoryName.Replace("\\", "/");
                        apiVersion.Version = version;

                        //var fileName = Path.Combine(dir, main).Replace("\\", "/");
                        //apiVersion.Files.Add( fileName );
                        apiVersion.Files = Directory.GetFiles(new FileInfo(Path.Combine(dir, main)).DirectoryName, "*.js")
                            .Select(f => f.Replace("\\", "/")).ToList();

                        apis[name].AddVersion(apiVersion);

                    }
                }
            }
        }




        private static void ExtractJSLibFiles(string url, string baseDest, string name, string[] expectedOutput)
        {
            var path = Clone(url, baseDest, name);

            if (File.Exists(Path.Combine(path, "package.json")) &&
                expectedOutput.Any(output => !File.Exists(Path.Combine(path, output))))
            {
                // make sure local npm dependencies are retrieved
                NpmShell.InstallLocalDeps(path);
                // run grunt build
                GruntShell.Build(path);
            }

            // .js *
            var generated = expectedOutput.Select(output => Path.Combine(path, output))
                .Where(p => File.Exists(p))
                .ToList();

            //Console.WriteLine( ex
        }

        private static string Clone(string url, string baseDest, string name)
        {
            string path = Path.Combine( baseDest, name );
            if (!Directory.Exists(path))
            {
                GitShell.Clone(url, path);
            }
            return path;
        }

        public static void BuildApiLibrary(string csv, string dir)
        {
            // Fetch repositories.
            // Parse and setup facts.
            var rows = System.IO.File
                .ReadAllText(csv)
                .Split(new string[]{"\r\n"}, StringSplitOptions.RemoveEmptyEntries)
                .Skip(1) // skip headers
                .Select(line => CSVReader.ParseCsvRow(line))
                .ToList();

            //var f = new JSLib.Fetch();
            //if (!Directory.Exists(dir))
            //{
            //    Directory.CreateDirectory(dir);
            //}

            foreach (var row in rows)
            {
                //f.DownloadZip(row[3], Path.Combine( dir, row[0] + ".zip" ) );

                // Option 1: Try to get all versions via Bower
                Console.WriteLine(string.Format( "Option 1: Retrieving apis via bower - {0} - {1}", row[0], row[3]));
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
