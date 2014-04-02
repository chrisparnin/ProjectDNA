using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib
{
    public class Api
    {
        public Api() { Versions = new List<ApiVersion>(); VersionNames = new HashSet<string>(); }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Tags { get; set; }
        public List<ApiVersion> Versions { get; set; }

        private HashSet<String> VersionNames { get; set; }

        public void AddVersion(ApiVersion v)
        {
            if (!VersionNames.Contains(v.Version))
            {
                VersionNames.Add(v.Version);
                Versions.Add(v);
            }
        }

        // Copy versions to destination path
        // dest/api/version/files
        public void CopyTo(string dest)
        {
            var root = Path.Combine(dest, Name);
            if (!Directory.Exists(root))
            {
                Directory.CreateDirectory(root);
            }

            foreach (var version in this.Versions)
            {
                foreach( var file in version.Files )
                {
                    var versionDir = Path.Combine( root, version.Version );
                    if( !Directory.Exists( versionDir ) )
                    {
                        Directory.CreateDirectory( versionDir );
                    }
                    var relFile = file.Replace( version.CanonicalPath, "" );
                    relFile = relFile.StartsWith("/") ? relFile.Remove(0,1) : relFile;
                    var newFile = Path.Combine( versionDir, relFile);
                    try
                    {
                        File.Copy(file, newFile, true);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine(ex.Message);
                    }
                }
            }
        }
    }

    public class ApiVersion
    {
        public ApiVersion() { Files = new List<string>();  }
        public string Version { get; set; }
        public string CanonicalPath { get; set; }
        public List<string> Files { get; set; }
    }
}
