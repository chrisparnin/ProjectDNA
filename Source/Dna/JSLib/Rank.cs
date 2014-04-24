using Dna.JSLib.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Dna.JSLib
{
    public class Rank
    {
        public static Dictionary<string, List<Candidate>> 
            Top(List<Candidate> candidates, string apiPath, int x, Criteria criteria)
        {
            var set = new Dictionary<string, List<Candidate>>();
            foreach (var group in candidates.GroupBy(c => c.ScriptUrl))
            {
                var scriptUrl = group.Key;

                var ordered = group.Where( c => c.ApiFullPath.ToLower().StartsWith( apiPath.ToLower() ) );

                ordered = ordered
                    .Where( c => criteria.Meets(c) );

                ordered = ordered
                    .OrderByDescending(c => c.Md5Match)
                    .ThenByDescending(c => c.CallScore)
                    .ThenByDescending(c => c.MarkerScore)
                    .ThenByDescending(c => c.Distance);

                set[scriptUrl] = ordered.ToList().Take(x).ToList();
            }
            return set;
        }

        public static List<ApiUsage> Usage(List<Candidate> set)
        {
            var usage = new Dictionary<string, ApiUsage>();
            foreach (var item in set)
            {
                if( !usage.ContainsKey( item.ApiFullPath ) )
                {
                    usage[item.ApiFullPath] = new ApiUsage();
                    usage[item.ApiFullPath].Api = item.Api;
                    usage[item.ApiFullPath].Scripts = new List<string>();
                    usage[item.ApiFullPath].Version = item.Version;
                }
                usage[item.ApiFullPath].Scripts.Add(item.ScriptUrl);
            }
            return usage.Values.ToList();
        }

    }
}
