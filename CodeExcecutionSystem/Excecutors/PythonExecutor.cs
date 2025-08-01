using CodeExcecutionSystem.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeExcecutionSystem.Excecutors
{
    public class PythonExecutor : ICodeExecutor
    {
        public bool CanExecute(string code)
        {
            return true; 
        }

        public string Execute(CodeSubmission submission)
        {
            return "";
        }

    }
}

