using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib.Shells
{
    public class BowerShell
    {
        public static List<string> Info(string package)
        {
            string cmd = string.Format(" /C bower info {0}", package);
            var results = Shell.RunProcess(cmd, "cmd", false, "");

            return ExtractVersions(results);
        }

        // bower --json doesn't produce validate json, just get cmd line version.
        public static List<string> ExtractVersions(string results)
        {
            var list = new List<string>();
            var state = "START";
            foreach (var line in results.Split('\n'))
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue;
                if (line.StartsWith("Available versions"))
                {
                    state = "VERSIONS";
                    continue;
                }

                // "  - 3.1.0"
                if (state == "VERSIONS")
                {
                    var v = line.Trim().Remove(0,2);
                    list.Add(v);
                }
            }
            return list;
        }

    }
}
