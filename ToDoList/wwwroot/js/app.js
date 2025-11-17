// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

// wwwroot/js/app.js
// Knockout + Handlebars front-end for Tasks SPA
// Assumes Index.cshtml contains templates with IDs:
//   #template-task-item, #template-empty, #template-edit-modal
// And page has: <div id="tasks-root"></div> and root container with id="tasks-app"

(function () {
    // ---------- Helpers ----------
    function el(selector) {
        return document.querySelector(selector);
    }

    function formatDateIso(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d)) return null;
        // yyyy-mm-dd for display in templates (simple)
        return d.toLocaleString();
    }

    function stripTimeForInput(dateStr) {
        if (!dateStr) retud rn '';
        const d = new Date(dateStr);
        if (isNaN(d)) return '';
        // format as yyyy-mm-dd for <input type="date">
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Map server object (PascalCase or camelCase) to template-friendly object
    function mapServerTask(t) {
        if (!t) return null;
        const id = t.id ?? t.Id;
        const title = t.title ?? t.Title ?? '';
        const description = t.description ?? t.Description ?? null;
        const createdAtRaw = t.createdAt ?? t.CreatedAt ?? null;
        const dueDateRaw = t.dueDate ?? t.DueDate ?? null;
        const priority = t.priority ?? t.Priority ?? 'Medium';
        const isCompleted = (t.isCompleted ?? t.IsCompleted) === true;
        const orderIndex = t.orderIndex ?? t.OrderIndex ?? null;

        return {
            // used by templates
            id,
            title,
            description,
            createdAt: createdAtRaw ? formatDateIso(createdAtRaw) : '',
            createdAtRaw,
            dueDate: dueDateRaw ? formatDateIso(dueDateRaw) : '',
            dueDateRaw,
            priority,
            isCompleted,
            orderIndex,
            // preserve original for PUT payloads if needed
            _raw: t
        };
    }

    // ---------- Compile templates ----------
    const taskTemplateSrc = document.getElementById('template-task-item')?.innerHTML || '';
    const emptyTemplateSrc = document.getElementById('template-empty')?.innerHTML || '';
    const editModalTemplateSrc = document.getElementById('template-edit-modal')?.innerHTML || '';

    const taskTemplate = Handlebars.compile(taskTemplateSrc);
    const emptyTemplate = Handlebars.compile(emptyTemplateSrc);
    const editModalTemplate = Handlebars.compile(editModalTemplateSrc);

    // ---------- ViewModel ----------
    function AppViewModel() {
        const self = this;

        // Observables for create form
        self.newTitle = ko.observable('');
        self.newDescription = ko.observable('');
        self.newDueDate = ko.observable('');
        self.newPriority = ko.observable('Medium');
        self.newOrderIndex = ko.observable(null);

        // Data
        self.tasks = ko.observableArray([]); // will store mapped tasks (mapServerTask)
        self.saving = ko.observable(false);

        // Edit modal holder (raw mapped task object)
        self.editingTask = ko.observable(null);

        // Controls
        self.filterStatus = ko.observable('all'); // all|active|completed
        self.searchText = ko.observable('');
        self.sortBy = ko.observable('createdAt'); // createdAt|dueDate|priority|orderIndex

        // Computed counts
        self.totalCount = ko.computed(() => self.tasks().length);
        self.activeCount = ko.computed(() => self.tasks().filter(t => !t.isCompleted).length);
        self.completedCount = ko.computed(() => self.tasks().filter(t => t.isCompleted).length);

        // Computed visible tasks (filtered + sorted)
        self.visibleTasks = ko.computed(() => {
            const search = (self.searchText() || '').toLowerCase().trim();
            const status = self.filterStatus();
            let list = self.tasks().slice(); // copy

            if (search) {
                list = list.filter(t => {
                    return (t.title || '').toLowerCase().includes(search) ||
                        (t.description || '').toLowerCase().includes(search);
                });
            }

            if (status === 'active') list = list.filter(t => !t.isCompleted);
            else if (status === 'completed') list = list.filter(t => t.isCompleted);

            const sortKey = self.sortBy();
            list.sort((a, b) => {
                switch (sortKey) {
                    case 'dueDate':
                        return (new Date(a.dueDateRaw || 0)) - (new Date(b.dueDateRaw || 0));
                    case 'priority':
                        // simple mapping: High > Medium > Low
                        const prioValue = p => (p === 'High' ? 3 : p === 'Medium' ? 2 : 1);
                        return prioValue(b.priority) - prioValue(a.priority);
                    case 'orderIndex':
                        return (a.orderIndex || 0) - (b.orderIndex || 0);
                    default: // createdAt: newest first
                        return (new Date(b.createdAtRaw || 0)) - (new Date(a.createdAtRaw || 0));
                }
            });

            return list;
        });

        // ---------- AJAX helpers ----------
        self.fetchJson = async function (url, opts) {
            const defaultOpts = {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin'
            };
            const allOpts = Object.assign({}, defaultOpts, opts || {});
            const res = await fetch(url, allOpts);
            if (!res.ok) {
                // try to get JSON error
                let errText = `${res.status} ${res.statusText}`;
                try {
                    const j = await res.json();
                    // ModelState errors from server may be nested
                    if (j && j.errors) {
                        errText = JSON.stringify(j.errors);
                    } else if (j && j.message) {
                        errText = j.message;
                    } else {
                        errText = JSON.stringify(j);
                    }
                } catch (ex) {
                    // fall back to text
                    try { errText = await res.text(); } catch { /* ignore */ }
                }
                const error = new Error(errText);
                error.status = res.status;
                throw error;
            }
            // No content
            if (res.status === 204) return null;
            // Try parse JSON
            const data = await res.json();
            return data;
        };

        // ---------- Core actions ----------
        self.loadTasks = async function () {
            try {
                const data = await self.fetchJson('/Tasks/List');
                // Map server tasks
                const mapped = (data || []).map(mapServerTask);
                self.tasks(mapped);
                // initial render
                renderTasks();
            } catch (err) {
                console.error('Failed to load tasks', err);
                alert('Failed to load tasks: ' + (err.message || err));
            }
        };

        self.addTask = async function () {
            const title = (self.newTitle() || '').trim();
            if (!title) {
                alert('Please enter a title');
                return;
            }

            const payload = {
                title: title,
                description: (self.newDescription() || '').trim() || null,
                dueDate: (self.newDueDate() || '') || null,
                priority: self.newPriority() || 'Medium',
                orderIndex: self.newOrderIndex() || null
            };

            self.saving(true);
            try {
                const created = await self.fetchJson('/Tasks/Create', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                const mapped = mapServerTask(created);
                // push to top
                self.tasks.unshift(mapped);
                // reset form
                self.newTitle('');
                self.newDescription('');
                self.newDueDate('');
                self.newPriority('Medium');
                self.newOrderIndex(null);
                renderTasks();
            } catch (err) {
                console.error('Create failed', err);
                alert('Create failed: ' + (err.message || err));
            } finally {
                self.saving(false);
            }
        };

        self.openEdit = function (id) {
            const t = self.tasks().find(x => String(x.id) === String(id));
            if (!t) return alert('Task not found');
            // create a shallow clone for editing (so we don't mutate list until saved)
            const clone = Object.assign({}, t);
            // expose dueDate for date input yyyy-mm-dd
            clone._editDueDate = stripTimeForInput(clone.dueDateRaw);
            self.editingTask(clone);
            showEditModal(self);
        };

        self.saveEdit = async function () {
            const et = self.editingTask();
            if (!et) return;
            const title = (et.title || '').trim();
            if (!title) {
                alert('Title required');
                return;
            }

            const payload = {
                title: title,
                description: (et.description || '').trim() || null,
                dueDate: et._editDueDate || null,
                isCompleted: !!et.isCompleted,
                priority: et.priority || 'Medium',
                orderIndex: et.orderIndex || null
            };

            try {
                const updated = await self.fetchJson(`/Tasks/Edit/${et.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                const mapped = mapServerTask(updated);
                // replace in tasks array
                const idx = self.tasks().findIndex(x => String(x.id) === String(mapped.id));
                if (idx >= 0) {
                    self.tasks.splice(idx, 1, mapped);
                }
                hideEditModal();
                renderTasks();
            } catch (err) {
                console.error('Save edit failed', err);
                alert('Save failed: ' + (err.message || err));
            }
        };

        self.cancelEdit = function () {
            self.editingTask(null);
            hideEditModal();
        };

        self.toggleTask = async function (id) {
            try {
                const updated = await self.fetchJson(`/Tasks/Toggle/${id}`, {
                    method: 'POST'
                });
                const mapped = mapServerTask(updated);
                const idx = self.tasks().findIndex(x => String(x.id) === String(mapped.id));
                if (idx >= 0) {
                    self.tasks.splice(idx, 1, mapped);
                }
                renderTasks();
            } catch (err) {
                console.error('Toggle failed', err);
                alert('Toggle failed: ' + (err.message || err));
            }
        };

        self.deleteTask = async function (id) {
            if (!confirm('Delete this task?')) return;
            try {
                await self.fetchJson(`/Tasks/Delete/${id}`, { method: 'DELETE' });
                const idx = self.tasks().findIndex(x => String(x.id) === String(id));
                if (idx >= 0) self.tasks.splice(idx, 1);
                renderTasks();
            } catch (err) {
                console.error('Delete failed', err);
                alert('Delete failed: ' + (err.message || err));
            }
        };

        self.clearForm = function () {
            self.newTitle('');
            self.newDescription('');
            self.newDueDate('');
            self.newPriority('Medium');
            self.newOrderIndex(null);
        };
    }

    // ---------- Rendering (uses Handlebars templates) ----------
    const tasksRoot = el('#tasks-root');

    function renderTasks() {
        if (!tasksRoot) return;
        // The viewmodel's visibleTasks is a KO computed. Grab its current value.
        const vm = ko.dataFor(document.getElementById('tasks-app'));
        const visible = vm ? vm.visibleTasks() : [];

        if (!visible || visible.length === 0) {
            tasksRoot.innerHTML = emptyTemplate();
            return;
        }

        // Build HTML for each item
        let html = '';
        for (const t of visible) {
            // Provide context to template
            html += taskTemplate(t);
        }
        tasksRoot.innerHTML = html;
    }

    // ---------- Event delegation for task actions ----------
    function onTaskRootClick(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        const vm = ko.dataFor(document.getElementById('tasks-app'));
        if (!vm) return;

        switch (action) {
            case 'toggle':
                vm.toggleTask(id);
                break;
            case 'edit':
                vm.openEdit(id);
                break;
            case 'delete':
                vm.deleteTask(id);
                break;
            default:
                // unknown action
                break;
        }
    }

    // ---------- Edit modal helpers ----------
    let currentModalElement = null;

    function showEditModal(viewModel) {
        // Render modal HTML
        const modalHtml = editModalTemplate();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml;
        const modalEl = wrapper.firstElementChild;
        if (!modalEl) return console.warn('No modal template found');

        document.body.appendChild(modalEl);
        currentModalElement = modalEl;

        // Apply knockout bindings to modal with the same viewModel
        ko.applyBindings(viewModel, modalEl);

        // Wire close when clicking outside modal content (optional)
        modalEl.addEventListener('click', function (ev) {
            if (ev.target === modalEl) {
                // click on backdrop
                viewModel.cancelEdit();
            }
        });

        // focus first input if present
        const firstInput = modalEl.querySelector('input, textarea');
        if (firstInput) firstInput.focus();
    }

    function hideEditModal() {
        if (!currentModalElement) return;
        try {
            ko.cleanNode(currentModalElement);
        } catch (ex) { /* ignore */ }
        currentModalElement.remove();
        currentModalElement = null;
        // clear editingTask observable on root VM
        const rootVm = ko.dataFor(document.getElementById('tasks-app'));
        if (rootVm) rootVm.editingTask(null);
    }

    // ---------- Init ----------
    function init() {
        const rootEl = document.getElementById('tasks-app');
        if (!rootEl) {
            console.error('Cannot find #tasks-app root');
            return;
        }

        const vm = new AppViewModel();
        ko.applyBindings(vm, rootEl);

        // initial load
        vm.loadTasks();

        // render whenever visibleTasks changes
        vm.visibleTasks.subscribe(renderTasks);
        vm.tasks.subscribe(renderTasks); // also re-render on direct tasks changes

        // event delegation on tasks root
        if (tasksRoot) tasksRoot.addEventListener('click', onTaskRootClick);

        // Expose vm for console debugging
        window.__tasksVM = vm;
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();
