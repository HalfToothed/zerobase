using DemoApp.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace DemoApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MainController : ControllerBase
    {
        private readonly IMyService myService1;
        private readonly IMyService myService2;
        private readonly List<string> products = new List<string>()
        {
            "laptop", "Phone", "Tablet"
        };

        public MainController(IMyService _myService1, IMyService _myService2) 
        {
            myService1 = _myService1;
            myService2 = _myService2;
        }

        [HttpGet("/GetProducts")]
        public IActionResult GetProducts()
        {
            return Ok(products);
        }

        [HttpGet("/GetGuid")]
        public IActionResult GetGuid()
        {
            var id1 = myService1.Id;
            var id2 = myService2.Id;
            return Ok($"Id1: {id1} " +
                $" Id2: {id2}");
        }
    }
}
