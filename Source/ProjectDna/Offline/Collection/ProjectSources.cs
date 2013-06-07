using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ProjectDna.Offline.Collection.RepoSource;

namespace ProjectDna.Offline.Collection
{
    public class ProjectSources
    {
        public static IRepositorySource Github
        {
            get { return new Github(); }
        }
    }
}
