using Dna.JSLib;
using Dna.JSLib.Shells;
using System;
using System.Collections.Generic;
using System.IO;
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


        public static string[] SampleIdentifyArguments
        {
             get 
             {
                 return new string[]
                 {
                    "identify",
                    @"Resources\JsLib",
                    File.ReadAllText(@"C:\DEV\ProjectDNA\Source\Dna\bin\Debug\Resources\JsLib\backbone\1.1.2\backbone.js")
                 }; 
             }
        }

        public static string[] SampleSequenceArguments
        {
            get
            {
                return new string[]
                {
                    "sequence",
                    @"Resources\JsLib",
                };
            }
        }
        public static string[] SampleDemoArguments
        {
            get
            {
                return new string[]
                {
                    "demo",
                    @"Resources\JsLib\jquery",
                    @"..\..\..\node\crawler\json"
                };
            }
        }

    }
}
