using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectDna.Dna
{
    class Sorter
    {
        public string Sort(string token)
        {
            char[] tokenArray = token.ToCharArray();
            Array.Sort(tokenArray);
            return new string(tokenArray);
        }
    }
}
