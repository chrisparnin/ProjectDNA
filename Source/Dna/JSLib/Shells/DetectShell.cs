using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib.Shells
{
    class DetectApiShell
    {
        public static string InstallAllVersions(string package, string url)
        {
            string cmd = string.Format(" /C node {0}/ApiVersions.js {1} {2}", Config.NodeFilesPath, package, url);
            var results = Shell.RunProcess(cmd, "cmd", false, "");
           
            return results;
        }

    }
}
