using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using ProjectDna.Data;
using ProjectDna.Dna.AprioriAlgorithm;
using ProjectDna.Offline.Collection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectDna
{
    class Program
    {
        static void Main(string[] args)
        {
            bool download = true;
            bool analyze = false;

            Analyze();
        }

        public static void Analyze()
        {
            var dna = new Apriori();
            var output = dna.ProcessTransaction(.1, .1,
                new string[] { "a", "b", "c", "d", "e", "f" }.ToList(),
                new string[] { "abc", "abcd", "def", "abe", "ab", "abc", "abd" }
            );

            var jsonString = JsonConvert.SerializeObject(
               output, Formatting.Indented,
               new JsonConverter[] { new StringEnumConverter() });

            Console.WriteLine( jsonString );
            Console.ReadKey();
        }

        public static void Download()
        {
            // 1) Get Known list of Java projects
            IRepositorySource source = ProjectSources.Github;
            var projects = System.IO.File.ReadAllText(DataSources.JavaScriptProjectsListingsPath)
                .Split('\n')
                .Select(p => p.Replace("\"", "").Trim())
                .ToList();

            // 2) Throlled/Restartable Download.
            var list = new List<string>();
            for (int i = 0; i < 10000; i++)
            {
                list.Add(projects.GetRandomElement());
            }
            BuildRepository.DownloadProjects(source, "projects", list);
        }
    }
}
