using Dna.JSLib;
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
            string outputs = "build";
            ExtractJSLibFiles("https://github.com/angular/angular.js", @"C:\dev\sandbox\", "angular.js", outputs.Split(','));

            //BuildApiLibrary(@"C:\dev\ProjectDNA\Source\ProjectDna\Data\JSLibs.csv", @"C:\dev\ProjectDNA\Resources\JsLib");
        }

        private static void ExtractJSLibFiles(string url, string baseDest, string name, string[] expectedOutput)
        {
            var path = Clone(url, baseDest, name);

            if (File.Exists(Path.Combine(path, "package.json")) && 
                expectedOutput.Any( output => !File.Exists(Path.Combine(path,output) ) ))
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
            if (!File.Exists(path))
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

            var f = new JSLib.Fetch();
            if (!Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            foreach (var row in rows)
            {
                f.DownloadZip(row[3], Path.Combine( dir, row[0] + ".zip" ) );
                Thread.Sleep(200);
            }

            Console.WriteLine(rows.Count());
        }

    }
}
