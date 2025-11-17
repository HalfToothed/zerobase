using Microsoft.EntityFrameworkCore;
using ToDoList.Models;

namespace ToDoList.Data
{
    public class AppDbContext: DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options): base(options)
        {
        }
        public DbSet<TaskItem> Tasks { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<TaskItem>(b =>
            {
                b.HasKey(t => t.Id);

                b.Property(t => t.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                b.Property(t => t.Description)
                    .HasMaxLength(2000);


                b.Property(t => t.IsCompleted)
                .HasDefaultValue(false);

                b.Property(t => t.CreatedAt);
            });
        }


    }
}
