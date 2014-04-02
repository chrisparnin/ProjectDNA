using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib.Shells
{
    public class GitShell
    {
        public static string Clone(string url, string dest)
        {
            var output = Shell.RunProcess(string.Format(" clone {0} {1}", url, dest), Config.GitPath, false, null);
            return output;
        }
    }
}
