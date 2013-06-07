using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectDna.Offline.Collection
{
    public interface IRepositorySource
    {
        bool DownloadZip(string url, string outputPath);
    }
}
