import { Task } from "../models/task.model";

export class TaskService{

    private tasks: Task[] = [
         { id: 1, title: 'Learn Angular basics', completed: true },
    { id: 2, title: 'Build a task manager', completed: false },
    { id: 3, title: 'Prepare for interviews tomorrow', completed: false }
    ]

    getTasks(): Task[] {
        return this.tasks
    }

    addTask(task: Task): void{
        this.tasks.push(task)
    }

   toggleTask(id: number): void {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
    }
  }
}
