using Dna.JSLib.Models;
using Dna.JSLib.Shells;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib
{
    class Bower
    {
        public static List<Api> ExtractJsLibsFromBowerComponents(string path)
        {
            var apis = new Dictionary<string, Api>();

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

        private static void ExtractJSLibFromGitRepo(string url, string baseDest, string name, string[] expectedOutput)
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
            string path = Path.Combine(baseDest, name);
            if (!Directory.Exists(path))
            {
                GitShell.Clone(url, path);
            }
            return path;
        }

       
    }
}
