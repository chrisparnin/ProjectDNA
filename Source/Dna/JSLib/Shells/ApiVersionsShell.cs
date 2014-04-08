using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib.Shells
{
    public class ApiVersionsShell
    {
        public static string InstallAllVersions(string package, string url, string workingDirectory)
        {
            if( url.StartsWith("git://" ) )
            {
                url = url.Replace("git://", "https://" );
                if( url.EndsWith( ".git") )
                {
                    url = url.Replace(".git","");
                }
            }

            string cmd = string.Format(" /C node {0}/ApiVersions.js {1} {2}", Config.NodeFilesPath, package, url);
            var results = Shell.RunProcess(cmd, "cmd", false, workingDirectory);

            //string cmd = string.Format("{0}/ApiVersions.js {1} {2}", Config.NodeFilesPath, package, url);
            //var results = Shell.RunProcess(cmd, "node", false, "");

            return results;
        }
    }
}
