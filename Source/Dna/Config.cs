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

        public static string BowerRepositoryPath = EnsuresDirectoryExists(@"Resources\Bower");

        // This program is a driver for the node source files located here:
        public static string NodeFilesPath = 
                // Search back from bin/Debug            
                FileExistsOrNull("../../../node") ??
                // same directory
                FileExistsOrNull("node") ?? 
                // Manual path
                @"C:/DEV/ProjectDNA/Source/node";

        public static string FileExistsOrNull(string path)
        {
            return System.IO.File.Exists(path) ? path : null;
        }

        public static string EnsuresDirectoryExists(string path)
        {
            if (!System.IO.Directory.Exists(path))
            {
                System.IO.Directory.CreateDirectory(path);
            }
            return path;
        }
    }
}
