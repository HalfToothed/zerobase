namespace DemoApp.Services
{
    public class MyService : IMyService
    {
        public Guid Id { get; set; } = Guid.NewGuid();
    }
}
