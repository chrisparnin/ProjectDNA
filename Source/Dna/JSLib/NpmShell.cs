using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib
{
    public class NpmShell
    {
        public static void InstallLocalDeps(string wd)
        {
            string cmd = string.Format(" /C npm install --prefix {1}", Config.NpmPath, wd); 
            Shell.RunProcess(cmd, "cmd", false, wd);
        }

    }
}
