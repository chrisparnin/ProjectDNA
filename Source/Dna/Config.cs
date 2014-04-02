using Dna.JSLib;
using Dna.JSLib.Shells;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna
{
    class Config
    {
        public static string GitPath = Shell.FindExecutablePath("git") ?? @"C:\Program Files (x86)\Git\bin\git.exe";
        public static string GruntPath = Shell.FindExecutablePath("grunt");
        public static string NpmPath = Shell.FindExecutablePath("npm");

        public static string NodeFilesPath = @"C:/DEV/ProjectDNA/Source/node";
    }
}
