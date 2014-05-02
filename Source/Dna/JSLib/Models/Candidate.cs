using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib.Models
{
    public class Candidate
    {
        public List<string> Markers {get;set;}
        public List<string> ContentMarkers {get;set;}
        public double MarkerScore {get;set;}
        public double CallScore { get; set; }
        public double Distance { get; set; }
        public bool Md5Match {get;set;}
        public string ApiFullPath {get;set;}
        public string Api { get; set; }
        public string Version {get;set;}
        public string ScriptUrl {get;set;}


        public static Candidate FromJSON(string json)
        {
            var obj = JObject.Parse(json);
            return FromJSONObject(obj);
        }

        public static Candidate FromJSONObject(JObject obj)
        {
            var c = new Candidate();
            c.Markers = obj.GetValue("markers").ToObject<string[]>().ToList();
            c.ContentMarkers = obj.GetValue("contentMarkers").ToObject<string[]>().ToList();
            c.MarkerScore = string.IsNullOrEmpty(obj.GetValue("markerScore").ToString()) ? 0.0 : obj.GetValue("markerScore").ToObject<double>();
            c.CallScore = string.IsNullOrEmpty(obj.GetValue("callScore").ToString()) ? 0.0 : obj.GetValue("callScore").ToObject<double>();
            c.Distance = string.IsNullOrEmpty( obj.GetValue("d").ToString()) ? 0.0 : obj.GetValue("d").ToObject<double>();
            c.Md5Match = obj.GetValue("hash").ToObject<bool>();
            c.ApiFullPath = obj.GetValue("fullPath").ToObject<string>();
            c.Api = obj.GetValue("apiName").ToObject<string>();
            c.Version = obj.GetValue("version").ToObject<string>();
            c.ScriptUrl = obj.GetValue("scriptUrl").ToObject<string>();

            return c;
        }
    }
}