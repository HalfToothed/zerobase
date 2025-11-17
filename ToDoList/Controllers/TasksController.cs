using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using ToDoList.Data;
using ToDoList.Models;

namespace ToDoList.Controllers
{
    [Route("[controller]")]
    public class TasksController : Controller
    {
        private readonly AppDbContext _db;
        public TasksController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("")]
        [HttpGet("Index")]
        public IActionResult Index()
        {
            return View();
        }

        // GET /Tasks/List?status=all|active|completed&search=&sort=createdAt|dueDate|priority|orderIndex
        [HttpGet("List")]
        public async Task<IActionResult> List([FromQuery] string status = "all", [FromQuery] string search = null, [FromQuery] string sort = "createdAt")
        {
            var query = _db.Tasks.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(t => t.Title.Contains(search) || (t.Description != null && t.Description.Contains(search)));
            }

            if (status == "active")
                query = query.Where(t => !t.IsCompleted);
            else if (status == "completed")
                query = query.Where(t => t.IsCompleted);


            query.OrderByDescending(t => t.CreatedAt);
            

            var tasks = await query.ToListAsync();
            return Ok(tasks);
        }

        // GET /Tasks/Get/{id}
        [HttpGet("Get/{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var task = await _db.Tasks.FindAsync(id);
            if (task == null) return NotFound();
            return Ok(task);
        }

        // POST /Tasks/Create
        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] CreateTaskDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var entity = new TaskItem
            {
                Title = dto.Title.Trim(),
                Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim(),
                CreatedAt = DateTime.UtcNow,
                IsCompleted = false
            };

            _db.Tasks.Add(entity);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = entity.Id }, entity);
        }

        // PUT /Tasks/Edit/{id}
        [HttpPut("Edit/{id:int}")]
        public async Task<IActionResult> Edit(int id, [FromBody] UpdateTaskDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var entity = await _db.Tasks.FindAsync(id);
            if (entity == null) return NotFound();

            entity.Title = dto.Title.Trim();
            entity.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
            entity.IsCompleted = dto.IsCompleted;

            _db.Tasks.Update(entity);
            await _db.SaveChangesAsync();

            return Ok(entity);
        }

        // POST /Tasks/Toggle/{id}
        [HttpPost("Toggle/{id:int}")]
        public async Task<IActionResult> Toggle(int id)
        {
            var entity = await _db.Tasks.FindAsync(id);
            if (entity == null) return NotFound();

            entity.IsCompleted = !entity.IsCompleted;
            _db.Tasks.Update(entity);
            await _db.SaveChangesAsync();

            return Ok(entity);
        }

        // DELETE /Tasks/Delete/{id}
        [HttpDelete("Delete/{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _db.Tasks.FindAsync(id);
            if (entity == null) return NotFound();

            _db.Tasks.Remove(entity);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // DTOs used by the controller
        public class CreateTaskDto
        {
            [Required]
            [MaxLength(200)]
            public string Title { get; set; }

            [MaxLength(2000)]
            public string Description { get; set; }

            public DateTime? DueDate { get; set; }

            [MaxLength(10)]
            public string Priority { get; set; } = "Medium";

            public int? OrderIndex { get; set; }
        }

        public class UpdateTaskDto
        {
            [Required]
            [MaxLength(200)]
            public string Title { get; set; }

            [MaxLength(2000)]
            public string Description { get; set; }

            public DateTime? DueDate { get; set; }

            public bool IsCompleted { get; set; }

            [MaxLength(10)]
            public string Priority { get; set; } = "Medium";

            public int? OrderIndex { get; set; }
        }
    }
}
