using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib.Models
{
    public class Criteria
    {
        public double MinDistance { get; set; }
        public double MinMarkerScore { get; set; }
        public double MinCallScore { get; set; }

        public bool Meets(Candidate c)
        {
            return c.MarkerScore >= MinCallScore && c.CallScore > MinMarkerScore && c.Distance > MinDistance;
        }
    }
}
