using CodeExcecutionSystem.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeExcecutionSystem.Excecutors
{
    public class CppExecutor : ICodeExecutor
    {
        public bool CanExecute(string language)
        {
            return false; 
        }

        public string Execute(CodeSubmission submission) 
        {
            return "";
        }
    }
}
