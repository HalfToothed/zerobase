using static System.Net.Mime.MediaTypeNames;
using static System.Runtime.InteropServices.JavaScript.JSType;
namespace DemoApp.Middleware
{
    public class RequestLoggingMiddleware
    {
        //RequestDelegate is just a delegate type that represents the next middleware in the pipeline
        //it’s a function taking HttpContext and returning Task.
        //ASP.NET Core uses it so middleware components can call the next one without hardcoding dependencies.
        private readonly RequestDelegate _next;

        public RequestLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }
        public async Task InvokeAsync(HttpContext context) 
        {
            var startTime = DateTime.UtcNow;
            Console.WriteLine($"Incoming Request {context.Request.Method} {context.Request.Path}");
            await _next(context);
            var elapsedTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
            Console.WriteLine($"Request completed in {elapsedTime} ms");
        }
    }
}
