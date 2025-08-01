using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeExcecutionSystem.Models
{
    public class CodeSubmission
    {
        public string Language { get; }
        public string SourceCode { get; }

        public CodeSubmission(string language, string code)
        {
            Language = language;
            SourceCode = code;
        }
    }

}
