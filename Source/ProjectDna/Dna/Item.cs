using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectDna.Dna
{
    public class Item : IComparable<Item>
    {
        #region Public Properties

        public string Name { get; set; }
        public double Support { get; set; }

        #endregion

        #region IComparable

        public int CompareTo(Item other)
        {
            return Name.CompareTo(other.Name);
        }

        #endregion
    }
}
