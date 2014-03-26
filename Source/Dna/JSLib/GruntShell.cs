using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib
{
    class GruntShell
    {
        public static void Build( string wd )
        {
            //var output = Shell.RunProcess(" build", Config.GruntPath, true, wd);
            //return output;
            Shell.RunProcess(" /C grunt build ", "cmd", false, wd);
        }
    }
}
