using CodeExcecutionSystem.Excecutors;
using CodeExcecutionSystem.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CodeExcecutionSystem.Core
{
    public class ExecutionEngine
    {
        private List<ICodeExecutor> executors;
        public ExecutionEngine(List<ICodeExecutor> _exectutors) 
        {
            executors = _exectutors;
        }

        public void Run(CodeSubmission submission)
        {
            var executor = executors.FirstOrDefault(x => x.CanExecute(submission.Language));

            if (executor != null) 
            {
                executor.Execute(submission);
            }
        }

    }
}
