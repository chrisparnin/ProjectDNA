using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib.Models
{
    public class ApiUsage
    {
        public string Api { get; set; }
        public string Version { get; set; }
        public List<string> Scripts { get; set; }

        public string SummaryReport()
        {
            return string.Format("\t{0} {1} used in\n\t\t{2}", Api, Version, string.Join(",", Scripts));
        }
    }
}
