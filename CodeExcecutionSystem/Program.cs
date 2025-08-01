// See https://aka.ms/new-console-template for more information
using CodeExcecutionSystem.Core;
using CodeExcecutionSystem.Excecutors;
using CodeExcecutionSystem.Models;
using System.Diagnostics.CodeAnalysis;

Console.WriteLine("Hello, World!");

var submission = new CodeSubmission("python", "print(hello)");

List<ICodeExecutor> executor = new List<ICodeExecutor>
{
    new PythonExecutor(),
    new CppExecutor(),
};

var engine = new ExecutionEngine(executor);

engine.Run(submission);