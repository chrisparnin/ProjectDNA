using ProjectDna.Data;
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
            if (download)
            {
                // 1) Get Known list of Java projects
                IRepositorySource source = ProjectSources.Github;
                var projects = System.IO.File.ReadAllText(DataSources.JavaScriptProjectsListingsPath)
                    .Split('\n')
                    .Select(p => p.Replace("\"", "").Trim())
                    .ToList();

                // 2) Throlled/Restartable Download.
                var list = new List<string>();
                for (int i = 0; i < 1000; i++)
                {
                    list.Add(projects.GetRandomElement());
                }
                BuildRepository.DownloadProjects(source, "projects", list);
            }
        }
    }
}
