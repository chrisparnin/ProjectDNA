using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib.Shells
{
    class Shell
    {
        public static string RunProcess(string command, string exe, bool useShell, string wd)
        {
            // Start the child process.
            Process p = new Process();
            // Redirect the output stream of the child process.
            if (!string.IsNullOrEmpty(wd))
            {
                if (!Directory.Exists(wd))
                {
                    Directory.CreateDirectory(wd);
                }
                p.StartInfo.WorkingDirectory = wd;
            }
            p.StartInfo.UseShellExecute = useShell;
            p.StartInfo.RedirectStandardOutput = !useShell;
            p.StartInfo.FileName = exe;
            p.StartInfo.Arguments = command;

            //var path = p.StartInfo.EnvironmentVariables["PATH"];
            //p.StartInfo.EnvironmentVariables["PATH"] = System.Environment.GetEnvironmentVariable("PATH");
            p.Start();                
            if (!useShell)
            {
                // Read the output stream first and then wait.
                string output = p.StandardOutput.ReadToEnd();
                p.WaitForExit();
                return output;
            }
            p.WaitForExit();
            return null;
        }

        public static string FindExecutablePath(string exe)
        {
            var enviromentPath = System.Environment.GetEnvironmentVariable("PATH");

            //Console.WriteLine(enviromentPath);
            var paths = enviromentPath.Split(';');
            var exePath = paths.Select(x => Path.Combine(x, exe))
                               .Where(x => File.Exists(x))
                               .FirstOrDefault();

            return exePath;
        }
    }
}
