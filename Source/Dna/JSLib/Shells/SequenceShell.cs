using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib.Shells
{
    class SequenceShell
    {
        public static string SequenceApis(string apisRootDirectory)
        {
            string cmd = string.Format(" /C node {0}/dna.js sequence {1}", Config.NodeFilesPath, apisRootDirectory);
            var results = Shell.RunProcess(cmd, "cmd", false, "");

            return results;
        }
    }
}
