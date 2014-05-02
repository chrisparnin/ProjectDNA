using Dna.JSLib.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib.Shells
{
    class DnaShell
    {
        public static string Detect(string jsLib, string traceFile)
        {
            string cmd = string.Format(" /C node {0}/dna.js detect {1} {2}", Config.NodeFilesPath, jsLib, traceFile);
            var results = Shell.RunProcess(cmd, "cmd", false, "");
           
            return results;
        }

        public static List<Candidate> DetectApi(string apiPath, string traceFile)
        {
            string cmd = string.Format(" /C node {0}/dna.js detect-api {1} {2}", Config.NodeFilesPath, apiPath, traceFile);
            var results = Shell.RunProcess(cmd, "cmd", false, "");

            //Console.WriteLine("detect-api:" + results);
            var list = JArray.Parse(results);

            return list.Select(item => Candidate.FromJSONObject( (JObject)item)).ToList();
        }


        internal static List<Candidate> Identify(string apiPath, string stdin)
        {
            string cmd = string.Format(" /C node {0}/dna.js identify {1}", Config.NodeFilesPath, apiPath);
            var results = Shell.RunProcessWithStdin(cmd, "cmd", false, "", stdin);

            var list = JArray.Parse(results);

            return list.Select(item => Candidate.FromJSONObject((JObject)item)).ToList();

        }
        // TODO Use version string regex to help rank against possible versions.
    }
}
