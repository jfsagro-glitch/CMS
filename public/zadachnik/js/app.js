/**
 * ЗАДАЧНИК - Главное приложение с ролевой моделью и workflow
 */

class ZadachnikApp {
    constructor() {
        console.log('ZadachnikApp constructor called');
        
        // Инициализация менеджеров
        this.storage = new StorageManager();
        this.auth = new AuthManager();
        this.workflow = new WorkflowManager(this.auth);
        this.analytics = new AnalyticsManager(this.auth);
        
        console.log('Managers initialized');
        
        // Состояние приложения
        this.tasks = [];
        this.users = {};
        this.filteredTasks = [];
        this.sortColumn = 'id';
        this.sortDirection = 'asc';
        this.currentTask = null;
        this.pendingAction = null;
        this.allEmployees = [];
        
        this.init();
    }
    
    init() {
        // Загрузка темы
        this.loadTheme();
        
        // Инициализация демо-данных
        this.storage.initDemoData();
        
        // Загрузка данных
        this.loadData();
        
        // Настройка UI
        this.setupUI();
        
        // Применение фильтров и рендеринг
        this.applyFilters();
        
        // Проверка автопилота
        this.checkAutopilot();
    }
    
    loadData() {
        this.tasks = this.storage.getTasks();
        let usersData = this.storage.getUsers();
        
        // ВАЖНО: Проверяем, есть ли сотрудники в сохраненных данных
        // Если нет или их мало - принудительно перезагружаем демо-данные
        if (!usersData || !usersData.employee || usersData.employee.length < 100) {
            console.warn('Users data is outdated or incomplete, reloading demo data...');
            if (window.DemoData) {
                this.users = DemoData.users;
                this.storage.saveUsers(this.users);
                console.log('Demo users reloaded:', this.users);
            }
        } else {
            this.users = usersData;
        }
        
        console.log('Loaded data:');
        console.log('Tasks:', this.tasks.length);
        console.log('Users structure:', this.users);
        console.log('Users.employee:', this.users.employee ? this.users.employee.length : 'undefined');
        
        // Если все еще нет сотрудников - критическая ошибка
        if (!this.users.employee || this.users.employee.length === 0) {
            console.error('CRITICAL: No employees loaded!');
            alert('Ошибка: Не загружены сотрудники. Перезагрузите страницу с очисткой кеша (Ctrl+Shift+R)');
        }
    }
    
    setupUI() {
        this.updateUserInfo();
        this.populateFilters();
        this.updateUIForRole();
    }
    
    updateUserInfo() {
        const user = this.auth.getCurrentUser();
        document.getElementById('current-user-name').textContent = user.name;
        document.getElementById('role-select').value = user.role;
        
        // Показываем select региона для ролей, которым он нужен
        if (user.region && (user.role === 'manager' || user.role === 'business')) {
            document.getElementById('region-select').value = user.region;
            document.getElementById('region-select').style.display = 'inline-block';
        } else {
            document.getElementById('region-select').style.display = 'none';
        }
        
        // Показываем select сотрудника для роли "Сотрудник"
        const employeeSelect = document.getElementById('employee-select');
        if (user.role === 'employee') {
            employeeSelect.style.display = 'inline-block';
            this.populateEmployeeSelect();
            // Устанавливаем текущего сотрудника, если он выбран
            if (user.employeeEmail) {
                employeeSelect.value = user.employeeEmail;
            }
        } else {
            employeeSelect.style.display = 'none';
        }
    }
    
    updateUIForRole() {
        const role = this.auth.getCurrentRole();
        
        document.getElementById('btn-create-task').style.display = 
            this.auth.hasPermission('createTask') ? 'inline-block' : 'none';
        document.getElementById('btn-analytics').style.display = 
            (this.auth.hasPermission('viewAnalytics') || this.auth.hasPermission('viewAllAnalytics')) ? 'inline-block' : 'none';
        document.getElementById('filter-region-group').style.display = 
            role === 'superuser' ? 'block' : 'none';
        
        // Кнопка автопилота только для руководителя
        const btnAutopilot = document.getElementById('btn-autopilot');
        if (role === 'manager') {
            btnAutopilot.style.display = 'inline-block';
            this.updateAutopilotButton();
        } else {
            btnAutopilot.style.display = 'none';
        }
    }
    
    populateFilters() {
        const filterRegion = document.getElementById('filter-region');
        filterRegion.innerHTML = '<option value="">Все</option>';
        this.auth.getAllRegions().forEach(region => {
            filterRegion.innerHTML += `<option value="${region}">${region}</option>`;
        });
    }
    
    switchRole() {
        const role = document.getElementById('role-select').value;
        const region = document.getElementById('region-select').value;
        this.auth.switchRole(role, region);
        this.updateUserInfo();
        this.updateUIForRole();
        this.applyFilters();
    }
    
    switchRegion() {
        const region = document.getElementById('region-select').value;
        const user = this.auth.getCurrentUser();
        user.region = region;
        this.auth.saveCurrentUser();
        this.applyFilters();
    }
    
    populateEmployeeSelect() {
        const employeeSelect = document.getElementById('employee-select');
        if (!employeeSelect) return;
        
        // Получаем всех сотрудников
        let employeesList = [];
        if (Array.isArray(this.users)) {
            employeesList = this.users.filter(u => u.role === 'employee');
        } else if (this.users.employee && Array.isArray(this.users.employee)) {
            employeesList = this.users.employee;
        }
        
        // Группируем по регионам
        const regions = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург'];
        
        let html = '<option value="">Выберите сотрудника...</option>';
        
        regions.forEach(region => {
            const regionEmployees = employeesList.filter(e => e.region === region);
            if (regionEmployees.length > 0) {
                html += `<optgroup label="${region}">`;
                regionEmployees.forEach(emp => {
                    html += `<option value="${emp.email}">${emp.name}</option>`;
                });
                html += '</optgroup>';
            }
        });
        
        employeeSelect.innerHTML = html;
    }
    
    switchEmployee() {
        const employeeEmail = document.getElementById('employee-select').value;
        if (!employeeEmail) return;
        
        // Находим выбранного сотрудника
        let employee = null;
        if (Array.isArray(this.users)) {
            employee = this.users.find(u => u.email === employeeEmail);
        } else if (this.users.employee) {
            employee = this.users.employee.find(e => e.email === employeeEmail);
        }
        
        if (!employee) {
            alert('Сотрудник не найден');
            return;
        }
        
        // Обновляем текущего пользователя
        const user = this.auth.getCurrentUser();
        user.name = employee.name;
        user.email = employee.email;
        user.employeeEmail = employee.email;
        user.region = employee.region;
        this.auth.saveCurrentUser();
        
        // Обновляем UI
        document.getElementById('current-user-name').textContent = employee.name;
        
        // Перезагружаем задачи (теперь будут показаны только задачи этого сотрудника)
        this.applyFilters();
        
        console.log('Switched to employee:', employee.name, employee.email);
    }
    
    applyFilters() {
        const searchText = document.getElementById('search-input').value.toLowerCase();
        const filterRegion = document.getElementById('filter-region').value;
        const filterType = document.getElementById('filter-type').value;
        const filterStatus = document.getElementById('filter-status').value;
        const filterPriority = document.getElementById('filter-priority').value;
        
        this.filteredTasks = this.tasks.filter(task => {
            if (!this.auth.canViewTask(task)) return false;
            
            const matchesSearch = !searchText || 
                task.id.toLowerCase().includes(searchText) ||
                task.title.toLowerCase().includes(searchText) ||
                (task.currentAssignee && task.currentAssignee.toLowerCase().includes(searchText));
            
            const matchesRegion = !filterRegion || task.region === filterRegion;
            const matchesType = !filterType || task.type === filterType;
            const matchesStatus = !filterStatus || task.status === filterStatus;
            const matchesPriority = !filterPriority || task.priority === filterPriority;
            
            return matchesSearch && matchesRegion && matchesType && matchesStatus && matchesPriority;
        });
        
        this.sortTasks();
        this.renderTable();
        this.updateStats();
    }
    
    sortBy(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.applyFilters();
    }
    
    sortTasks() {
        this.filteredTasks.sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    resetFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('filter-region').value = '';
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-priority').value = '';
        this.applyFilters();
    }
    
    updateStats() {
        document.getElementById('visible-count').textContent = this.filteredTasks.length;
        document.getElementById('total-count').textContent = this.tasks.length;
        
        // Для роли сотрудник показываем количество его задач
        const user = this.auth.getCurrentUser();
        const tasksCountEl = document.getElementById('user-tasks-count');
        
        if (user.role === 'employee' && user.employeeEmail) {
            const employeeTasks = this.tasks.filter(t => 
                t.assignedTo && t.assignedTo.includes(user.employeeEmail)
            );
            const activeTasks = employeeTasks.filter(t => t.status !== 'approved').length;
            const completedTasks = employeeTasks.filter(t => t.status === 'approved').length;
            
            tasksCountEl.textContent = `📋 Задач: ${activeTasks} активных / ${completedTasks} завершено`;
            tasksCountEl.style.display = 'inline-block';
        } else {
            tasksCountEl.style.display = 'none';
        }
    }
    
    renderTable() {
        const tbody = document.getElementById('tasks-tbody');
        tbody.innerHTML = '';
        this.filteredTasks.forEach(task => tbody.appendChild(this.createTableRow(task)));
    }
    
    createTableRow(task) {
        const tr = document.createElement('tr');
        const statusInfo = this.workflow.getStatusInfo(task.status);
        
        tr.innerHTML = `
            <td onclick="app.openTaskCard('${task.id}')" style="cursor:pointer">${task.id}</td>
            <td>${task.region}</td>
            <td>${task.type}</td>
            <td onclick="app.openTaskCard('${task.id}')" style="cursor:pointer" title="${task.title}">${task.title}</td>
            <td><span class="priority-badge priority-${task.priority}">${this.getPriorityText(task.priority)}</span></td>
            <td><span class="${this.getDeadlineClass(task.dueDate)}">${this.formatDate(task.dueDate)}</span></td>
            <td><span class="status-badge status-${task.status}">${statusInfo.label}</span></td>
            <td>${this.getAssigneeName(task.currentAssignee) || '-'}</td>
            <td>${this.renderActions(task)}</td>
        `;
        return tr;
    }
    
    renderActions(task) {
        const actions = this.auth.getAvailableActions(task);
        return actions.slice(0, 3).map(action => 
            `<button class="btn btn-sm btn-secondary" onclick="app.handleAction('${task.id}', '${action.id}')" title="${action.label}">${action.icon}</button>`
        ).join(' ');
    }
    
    getPriorityText(priority) {
        return { low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический' }[priority] || priority;
    }
    
    getDeadlineClass(deadline) {
        const diffDays = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'deadline-danger';
        if (diffDays <= 3) return 'deadline-warning';
        return 'deadline-ok';
    }
    
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
    
    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    
    getAssigneeName(email) {
        if (!email) return null;
        for (const role in this.users) {
            const user = this.users[role].find(u => u.email === email);
            if (user) return user.name;
        }
        return email;
    }
    
    createNewTask() {
        this.currentTask = null;
        document.getElementById('modal-title').textContent = 'Новая задача';
        document.getElementById('task-form').reset();
        const user = this.auth.getCurrentUser();
        if (user.region) document.getElementById('task-region').value = user.region;
        
        document.getElementById('documents-list').innerHTML = '<p style="color:#999;font-size:12px;">Нет документов</p>';
        document.getElementById('comments-list').innerHTML = '<p style="color:#999;font-size:12px;">Нет комментариев</p>';
        document.getElementById('history-list').innerHTML = '<p style="color:#999;font-size:12px;">История пуста</p>';
        document.getElementById('assignees-group').style.display = 'none';
        document.getElementById('workflow-actions').innerHTML = '';
        document.getElementById('task-modal').classList.add('active');
    }
    
    openTaskCard(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        this.currentTask = task;
        document.getElementById('modal-title').textContent = `Задача ${task.id}`;
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-region').value = task.region;
        document.getElementById('task-type').value = task.type;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-deadline').value = task.dueDate;
        
        const canEdit = this.auth.canEditTask(task);
        ['task-title', 'task-description', 'task-priority', 'task-deadline'].forEach(id => {
            document.getElementById(id).disabled = !canEdit;
        });
        document.getElementById('btn-save-task').style.display = canEdit ? 'inline-block' : 'none';
        
        this.renderAssignees(task);
        this.renderDocuments(task);
        this.renderComments(task);
        this.renderHistory(task);
        this.renderWorkflowActions(task);
        document.getElementById('task-modal').classList.add('active');
    }
    
    renderAssignees(task) {
        const assigneesGroup = document.getElementById('assignees-group');
        const assigneesList = document.getElementById('assignees-list');
        
        if (this.auth.hasPermission('assignTasks')) {
            assigneesGroup.style.display = 'block';
            
            // Получаем список сотрудников
            let employeesList = [];
            if (Array.isArray(this.users)) {
                employeesList = this.users.filter(u => u.role === 'employee');
            } else if (this.users.employee && Array.isArray(this.users.employee)) {
                employeesList = this.users.employee;
            }
            
            const employees = employeesList.filter(e => e.region === task.region);
            assigneesList.innerHTML = employees.map(emp => `
                <div class="assignee-item">
                    <input type="checkbox" id="emp-${emp.id}" value="${emp.email}" ${task.assignedTo && task.assignedTo.includes(emp.email) ? 'checked' : ''}>
                    <label for="emp-${emp.id}">${emp.name}</label>
                </div>
            `).join('');
        } else {
            assigneesGroup.style.display = 'none';
        }
    }
    
    renderDocuments(task) {
        const docsList = document.getElementById('documents-list');
        if (task.documents && task.documents.length > 0) {
            docsList.innerHTML = task.documents.map(doc => `
                <div class="document-item">
                    <div class="document-info">
                        <div class="document-name">📎 ${doc.name}</div>
                        <div class="document-meta">Загрузил: ${doc.uploadedByName} • ${this.formatDateTime(doc.uploadedAt)}</div>
                    </div>
                </div>
            `).join('');
        } else {
            docsList.innerHTML = '<p style="color:#999;font-size:12px;">Нет документов</p>';
        }
    }
    
    renderComments(task) {
        const commentsList = document.getElementById('comments-list');
        if (task.comments && task.comments.length > 0) {
            commentsList.innerHTML = task.comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-date">${this.formatDateTime(comment.createdAt)}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </div>
            `).join('');
        } else {
            commentsList.innerHTML = '<p style="color:#999;font-size:12px;">Нет комментариев</p>';
        }
    }
    
    renderHistory(task) {
        const historyList = document.getElementById('history-list');
        if (task.history && task.history.length > 0) {
            historyList.innerHTML = task.history.map(item => `
                <div class="history-item action-${item.status}">
                    <div class="history-header">
                        <span class="history-user">${item.user}</span>
                        <span class="history-date">${this.formatDateTime(item.date)}</span>
                    </div>
                    <div class="history-action">${item.action}</div>
                    ${item.comment ? `<div class="history-comment">${item.comment}</div>` : ''}
                </div>
            `).join('');
        } else {
            historyList.innerHTML = '<p style="color:#999;font-size:12px;">История пуста</p>';
        }
    }
    
    renderWorkflowActions(task) {
        const workflowActions = document.getElementById('workflow-actions');
        const actions = this.auth.getAvailableActions(task);
        
        if (actions.length > 0) {
            workflowActions.innerHTML = actions.map(action => {
                const btnClass = `workflow-btn workflow-btn-${action.id}`;
                return `<button class="${btnClass}" onclick="app.handleAction('${task.id}', '${action.id}')">${action.label}</button>`;
            }).join('');
        } else {
            workflowActions.innerHTML = '';
        }
    }
    
    handleAction(taskId, actionId) {
        console.log('handleAction called:', taskId, actionId);
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }
        
        console.log('Task found:', task);
        
        // Для распределения открываем специальное модальное окно
        if (actionId === 'assign') {
            console.log('Opening assign modal');
            this.showAssignModal(task);
            return;
        }
        
        const needsComment = ['pause', 'rework', 'return'].includes(actionId);
        
        if (needsComment) {
            this.pendingAction = { taskId, actionId };
            document.getElementById('action-modal-title').textContent = this.getActionTitle(actionId);
            document.getElementById('action-comment').value = '';
            document.getElementById('action-modal').classList.add('active');
        } else {
            this.executeAction(taskId, actionId, '');
        }
    }
    
    getActionTitle(actionId) {
        const titles = {
            pause: 'Постановка на паузу',
            rework: 'Отправка на доработку',
            return: 'Возврат задачи',
            approve: 'Согласование задачи',
            assign: 'Распределение задачи'
        };
        return titles[actionId] || 'Действие';
    }
    
    confirmAction() {
        if (!this.pendingAction) return;
        const comment = document.getElementById('action-comment').value;
        if (!comment.trim()) {
            alert('Требуется комментарий');
            return;
        }
        this.executeAction(this.pendingAction.taskId, this.pendingAction.actionId, comment);
        this.closeActionModal();
    }
    
    executeAction(taskId, actionId, comment) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        try {
            let updatedTask;
            switch(actionId) {
                case 'accept':
                    updatedTask = this.workflow.acceptTask(task, comment);
                    break;
                case 'pause':
                    updatedTask = this.workflow.pauseTask(task, comment);
                    break;
                case 'resume':
                    updatedTask = this.workflow.resumeTask(task, comment);
                    break;
                case 'rework':
                    updatedTask = this.workflow.sendToRework(task, comment);
                    break;
                case 'returnToWork':
                    updatedTask = this.workflow.returnToWork(task, comment);
                    break;
                case 'approval':
                    updatedTask = this.workflow.sendToApproval(task, comment);
                    break;
                case 'approve':
                    updatedTask = this.workflow.approveTask(task, comment);
                    break;
                case 'return':
                    updatedTask = this.workflow.returnToEmployee(task, comment);
                    break;
                case 'assign':
                    const selectedEmployees = Array.from(document.querySelectorAll('#assignees-list input:checked')).map(cb => cb.value);
                    if (selectedEmployees.length === 0) {
                        alert('Выберите исполнителей');
                        return;
                    }
                    updatedTask = this.workflow.assignTask(task, selectedEmployees, comment);
                    break;
                default:
                    return;
            }
            
            const index = this.tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                this.tasks[index] = updatedTask;
                this.storage.saveTasks(this.tasks);
                this.applyFilters();
                if (this.currentTask && this.currentTask.id === taskId) {
                    this.openTaskCard(taskId);
                }
            }
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    }
    
    saveTask(event) {
        event.preventDefault();
        
        const taskData = {
            id: document.getElementById('task-id').value,
            region: document.getElementById('task-region').value,
            type: document.getElementById('task-type').value,
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-deadline').value
        };
        
        if (this.currentTask) {
            // Обновление существующей задачи
            Object.assign(this.currentTask, taskData);
            this.currentTask.updatedAt = new Date().toISOString();
            const index = this.tasks.findIndex(t => t.id === this.currentTask.id);
            if (index !== -1) {
                this.tasks[index] = this.currentTask;
            }
        } else {
            // Создание новой задачи
            const newTask = this.workflow.createTask(taskData);
            this.tasks.push(newTask);
        }
        
        this.storage.saveTasks(this.tasks);
        this.closeTaskModal();
        this.applyFilters();
    }
    
    addComment() {
        const commentText = document.getElementById('new-comment').value.trim();
        if (!commentText || !this.currentTask) return;
        
        this.workflow.addComment(this.currentTask, commentText);
        const index = this.tasks.findIndex(t => t.id === this.currentTask.id);
        if (index !== -1) {
            this.tasks[index] = this.currentTask;
            this.storage.saveTasks(this.tasks);
        }
        
        document.getElementById('new-comment').value = '';
        this.renderComments(this.currentTask);
        this.renderHistory(this.currentTask);
    }
    
    attachDocument() {
        document.getElementById('file-input').click();
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file || !this.currentTask) return;
        
        const document = {
            name: file.name,
            size: file.size,
            type: file.type,
            url: '#'
        };
        
        this.workflow.attachDocument(this.currentTask, document);
        const index = this.tasks.findIndex(t => t.id === this.currentTask.id);
        if (index !== -1) {
            this.tasks[index] = this.currentTask;
            this.storage.saveTasks(this.tasks);
        }
        
        this.renderDocuments(this.currentTask);
        this.renderHistory(this.currentTask);
    }
    
    showAnalytics() {
        const user = this.auth.getCurrentUser();
        
        if (user.role === 'superuser') {
            // Суперпользователь видит аналитику по регионам
            this.showRegionAnalytics();
        } else {
            // Руководитель видит аналитику по сотрудникам своего региона
            this.showEmployeeAnalytics(user.region);
        }
    }
    
    showRegionAnalytics() {
        const regionStats = this.analytics.getRegionStatistics(this.tasks);
        
        const content = document.getElementById('analytics-content');
        content.innerHTML = `
            <div class="analytics-section">
                <h3>📊 Аналитика по регионам</h3>
                <p style="color:#666;font-size:13px;margin-bottom:15px;">Кликните на регион для детальной статистики по сотрудникам</p>
                <div class="region-stats-grid">
                    ${Object.keys(regionStats).map(region => {
                        const stat = regionStats[region];
                        return `
                            <div class="region-card" onclick="app.showEmployeeAnalytics('${region}')">
                                <div class="region-header">
                                    <h4>${region}</h4>
                                    <span class="region-completion">${stat.completionRate}%</span>
                                </div>
                                <div class="region-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Всего задач:</span>
                                        <span class="stat-value">${stat.total}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Завершено:</span>
                                        <span class="stat-value">${stat.completed}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">В работе:</span>
                                        <span class="stat-value">${stat.inProgress}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Просрочено:</span>
                                        <span class="stat-value stat-danger">${stat.overdue}</span>
                                    </div>
                                </div>
                                <div class="region-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${stat.completionRate}%"></div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('analytics-modal').classList.add('active');
    }
    
    showEmployeeAnalytics(region) {
        // Получаем список сотрудников
        let employeesList = [];
        if (Array.isArray(this.users)) {
            employeesList = this.users.filter(u => u.role === 'employee');
        } else if (this.users.employee && Array.isArray(this.users.employee)) {
            employeesList = this.users.employee;
        }
        
        const employees = employeesList.filter(e => e.region === region);
        const analyticsData = this.analytics.exportAnalytics(this.tasks, employees, region);
        
        const content = document.getElementById('analytics-content');
        content.innerHTML = `
            <div class="analytics-section">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h3>📊 Аналитика: ${region}</h3>
                    ${this.auth.getCurrentRole() === 'superuser' ? 
                        '<button class="btn btn-sm btn-secondary" onclick="app.showRegionAnalytics()">← Назад к регионам</button>' : 
                        ''}
                </div>
                
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-label">Процент выполнения</div>
                        <div class="kpi-value">${analyticsData.kpi.completionRate}%</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Выполнено в срок</div>
                        <div class="kpi-value">${analyticsData.kpi.onTimeRate}%</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Качество</div>
                        <div class="kpi-value">${analyticsData.kpi.qualityScore}%</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Производительность</div>
                        <div class="kpi-value">${analyticsData.kpi.productivity}%</div>
                    </div>
                </div>
            </div>
            
            <div class="analytics-section">
                <h3>Статистика по сотрудникам (${employees.length} чел.)</h3>
                <div class="employee-stats-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Сотрудник</th>
                                <th>Всего</th>
                                <th>Завершено</th>
                                <th>В работе</th>
                                <th>Просрочено</th>
                                <th>Загрузка</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.values(analyticsData.employees).map(emp => `
                                <tr>
                                    <td>${emp.name}</td>
                                    <td>${emp.totalTasks}</td>
                                    <td>${emp.completed}</td>
                                    <td>${emp.inProgress}</td>
                                    <td>${emp.overdue}</td>
                                    <td>
                                        <div class="workload-indicator">
                                            <div class="workload-fill ${emp.workload > 70 ? 'high' : emp.workload > 40 ? 'medium' : ''}" style="width: ${emp.workload}%"></div>
                                        </div>
                                        ${emp.workload}%
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        document.getElementById('analytics-modal').classList.add('active');
    }
    
    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
    }
    
    closeAnalyticsModal() {
        document.getElementById('analytics-modal').classList.remove('active');
    }
    
    showSettings() {
        // Загружаем текущую тему
        const savedTheme = localStorage.getItem('zadachnik_theme') || 'light';
        document.getElementById('theme-select').value = savedTheme;
        
        document.getElementById('settings-modal').classList.add('active');
    }
    
    closeSettingsModal() {
        document.getElementById('settings-modal').classList.remove('active');
    }
    
    changeTheme() {
        const theme = document.getElementById('theme-select').value;
        
        // Удаляем все классы тем
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-balanced');
        
        // Добавляем выбранную тему
        if (theme !== 'light') {
            document.body.classList.add(`theme-${theme}`);
        }
        
        // Сохраняем в localStorage
        localStorage.setItem('zadachnik_theme', theme);
        
        console.log('Theme changed to:', theme);
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('zadachnik_theme') || 'light';
        if (savedTheme !== 'light') {
            document.body.classList.add(`theme-${savedTheme}`);
        }
    }
    
    closeActionModal() {
        document.getElementById('action-modal').classList.remove('active');
        this.pendingAction = null;
    }
    
    // Модальное окно распределения задачи
    showAssignModal(task) {
        console.log('showAssignModal called with task:', task);
        this.currentTask = task;
        
        // Заполняем информацию о задаче
        const taskInfo = document.getElementById('assign-task-info');
        if (!taskInfo) {
            console.error('assign-task-info element not found!');
            return;
        }
        
        taskInfo.innerHTML = `
            <h4>${task.id}: ${task.title}</h4>
            <p><strong>Регион:</strong> ${task.region}</p>
            <p><strong>Тип:</strong> ${task.type}</p>
            <p><strong>Описание:</strong> ${task.description || 'Нет описания'}</p>
        `;
        
        // Заполняем приоритет и срок текущими значениями
        document.getElementById('assign-priority').value = task.priority;
        document.getElementById('assign-deadline').value = task.dueDate;
        
        // Очищаем поиск и комментарий
        document.getElementById('employee-search').value = '';
        document.getElementById('assign-comment').value = '';
        
        // Загружаем сотрудников региона
        console.log('Loading employees for region:', task.region);
        this.loadEmployeesForAssign(task.region);
        
        const modal = document.getElementById('assign-modal');
        if (!modal) {
            console.error('assign-modal element not found!');
            return;
        }
        
        console.log('Opening assign modal');
        modal.classList.add('active');
    }
    
    loadEmployeesForAssign(region) {
        console.log('loadEmployeesForAssign - region:', region);
        console.log('All users:', this.users);
        
        // Проверяем структуру users
        let employeesList = [];
        if (Array.isArray(this.users)) {
            // Если users - массив, фильтруем по роли
            employeesList = this.users.filter(u => u.role === 'employee');
        } else if (this.users.employee && Array.isArray(this.users.employee)) {
            // Если users - объект с ключом employee
            employeesList = this.users.employee;
        } else {
            console.error('users.employee is undefined or not an array!');
            this.allEmployees = [];
            this.renderEmployeesSelect();
            this.renderEmployeesGrid();
            return;
        }
        
        const employees = employeesList.filter(e => e.region === region);
        console.log('Filtered employees for region:', employees.length);
        
        // Рассчитываем загрузку каждого сотрудника
        const workloadByUser = {};
        this.tasks.forEach(task => {
            if (task.status !== 'approved' && task.assignedTo) {
                task.assignedTo.forEach(empEmail => {
                    if (!workloadByUser[empEmail]) {
                        workloadByUser[empEmail] = 0;
                    }
                    // Условно: каждая активная задача = 20% загрузки
                    workloadByUser[empEmail] += 20;
                });
            }
        });
        
        this.allEmployees = employees.map(emp => ({
            ...emp,
            workload: Math.min(100, workloadByUser[emp.email] || 0),
            available: (workloadByUser[emp.email] || 0) < 80
        }));
        
        // Сортируем: сначала доступные, потом по имени
        this.allEmployees.sort((a, b) => {
            if (a.available !== b.available) {
                return a.available ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
        
        console.log('All employees with workload:', this.allEmployees.length);
        this.renderEmployeesSelect();
        this.renderEmployeesGrid();
    }
    
    renderEmployeesSelect() {
        const select = document.getElementById('assign-employee-select');
        if (!select) {
            console.error('assign-employee-select not found!');
            return;
        }
        
        console.log('renderEmployeesSelect - allEmployees:', this.allEmployees.length);
        
        const searchText = document.getElementById('employee-search').value.toLowerCase();
        
        const filteredEmployees = this.allEmployees.filter(emp => 
            emp.name.toLowerCase().includes(searchText) || 
            emp.email.toLowerCase().includes(searchText)
        );
        
        console.log('Filtered employees for select:', filteredEmployees.length);
        
        if (filteredEmployees.length === 0) {
            select.innerHTML = '<option value="">Нет доступных сотрудников</option>';
            return;
        }
        
        select.innerHTML = filteredEmployees.map(emp => {
            const statusIcon = emp.available ? '🟢' : '🔴';
            const workloadText = `${emp.workload}%`;
            return `<option value="${emp.email}">${statusIcon} ${emp.name} - Загрузка: ${workloadText}</option>`;
        }).join('');
        
        console.log('Select populated with', filteredEmployees.length, 'employees');
    }
    
    filterEmployeesInSelect() {
        this.renderEmployeesSelect();
        this.renderEmployeesGrid();
    }
    
    renderEmployeesGrid() {
        const grid = document.getElementById('employees-grid');
        const searchText = document.getElementById('employee-search').value.toLowerCase();
        
        const filteredEmployees = this.allEmployees.filter(emp => 
            emp.name.toLowerCase().includes(searchText) || 
            emp.email.toLowerCase().includes(searchText)
        );
        
        if (filteredEmployees.length === 0) {
            grid.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Сотрудники не найдены</p>';
            return;
        }
        
        grid.innerHTML = filteredEmployees.map(emp => {
            const workloadClass = emp.workload >= 80 ? 'high' : emp.workload >= 50 ? 'medium' : '';
            const statusClass = emp.available ? 'available' : 'busy';
            const statusText = emp.available ? 'Доступен' : 'Загружен';
            
            return `
                <div class="employee-card" onclick="app.selectEmployee('${emp.email}')">
                    <div class="employee-name">${emp.name}</div>
                    <div class="employee-email">${emp.email}</div>
                    <div class="employee-workload">
                        <div class="employee-workload-bar">
                            <div class="employee-workload-fill ${workloadClass}" style="width: ${emp.workload}%"></div>
                        </div>
                        <span class="employee-workload-text">${emp.workload}%</span>
                    </div>
                    <span class="employee-status ${statusClass}">${statusText}</span>
                </div>
            `;
        }).join('');
    }
    
    filterEmployees() {
        this.renderEmployeesGrid();
    }
    
    // Подтверждение распределения через кнопку
    confirmAssignment() {
        if (!this.currentTask) return;
        
        const employeeSelect = document.getElementById('assign-employee-select');
        const selectedEmail = employeeSelect.value;
        
        if (!selectedEmail) {
            alert('Выберите сотрудника из списка');
            return;
        }
        
        const employee = this.allEmployees.find(e => e.email === selectedEmail);
        if (!employee) {
            alert('Сотрудник не найден');
            return;
        }
        
        // Получаем обновленные значения
        const newPriority = document.getElementById('assign-priority').value;
        const newDeadline = document.getElementById('assign-deadline').value;
        const comment = document.getElementById('assign-comment').value.trim();
        
        if (confirm(`Распределить задачу "${this.currentTask.title}" на ${employee.name}?`)) {
            try {
                // Обновляем приоритет, если изменился
                if (newPriority !== this.currentTask.priority) {
                    this.workflow.changePriority(this.currentTask, newPriority, `Приоритет изменен при распределении`);
                }
                
                // Обновляем срок, если изменился
                if (newDeadline !== this.currentTask.dueDate) {
                    this.workflow.changeDeadline(this.currentTask, newDeadline, `Срок изменен при распределении`);
                }
                
                // Распределяем задачу
                const updatedTask = this.workflow.assignTask(
                    this.currentTask, 
                    [selectedEmail], 
                    comment || `Задача распределена на ${employee.name}`
                );
                
                const index = this.tasks.findIndex(t => t.id === this.currentTask.id);
                if (index !== -1) {
                    this.tasks[index] = updatedTask;
                    this.storage.saveTasks(this.tasks);
                    this.applyFilters();
                    this.closeAssignModal();
                    
                    alert(`✅ Задача успешно распределена на ${employee.name}`);
                }
            } catch (error) {
                alert('Ошибка: ' + error.message);
            }
        }
    }
    
    // Быстрое распределение по клику на карточку
    selectEmployee(employeeEmail) {
        if (!this.currentTask) return;
        
        const employee = this.allEmployees.find(e => e.email === employeeEmail);
        if (!employee) return;
        
        // Устанавливаем выбранного сотрудника в select
        document.getElementById('assign-employee-select').value = employeeEmail;
    }
    
    closeAssignModal() {
        document.getElementById('assign-modal').classList.remove('active');
        this.currentTask = null;
        this.allEmployees = [];
    }
    
    reloadDemoData() {
        if (confirm('Перезагрузить демо-данные? Все текущие данные будут заменены.')) {
            console.log('Reloading demo data...');
            
            // Очищаем localStorage
            localStorage.removeItem('zadachnik_tasks');
            localStorage.removeItem('zadachnik_users');
            
            // Загружаем свежие демо-данные
            if (window.DemoData) {
                this.tasks = DemoData.tasks;
                this.users = DemoData.users;
                this.storage.saveTasks(this.tasks);
                this.storage.saveUsers(this.users);
                
                console.log('Demo data reloaded:');
                console.log('Tasks:', this.tasks.length);
                console.log('Users.employee:', this.users.employee ? this.users.employee.length : 'undefined');
                
                // Перезагружаем UI
                this.setupUI();
                this.applyFilters();
                
                alert('✅ Демо-данные успешно перезагружены! Теперь доступно 120 сотрудников.');
            } else {
                alert('❌ Ошибка: DemoData не найден');
            }
        }
    }
    
    // Автопилот для руководителя
    toggleAutopilot() {
        const isActive = localStorage.getItem('zadachnik_autopilot') === 'true';
        const newState = !isActive;
        
        localStorage.setItem('zadachnik_autopilot', newState);
        this.updateAutopilotButton();
        
        if (newState) {
            // Включаем автопилот
            this.runAutopilot();
            alert('✅ Автопилот включен! Новые задачи будут автоматически распределяться на наименее загруженных сотрудников.');
        } else {
            // Выключаем автопилот
            alert('⏸️ Автопилот выключен. Задачи нужно распределять вручную.');
        }
    }
    
    updateAutopilotButton() {
        const isActive = localStorage.getItem('zadachnik_autopilot') === 'true';
        const btn = document.getElementById('btn-autopilot');
        const icon = document.getElementById('autopilot-icon');
        const text = document.getElementById('autopilot-text');
        
        if (isActive) {
            btn.classList.add('active');
            icon.textContent = '🟢';
            text.textContent = 'Автопилот ВКЛ';
        } else {
            btn.classList.remove('active');
            icon.textContent = '🤖';
            text.textContent = 'Автопилот';
        }
    }
    
    runAutopilot() {
        const user = this.auth.getCurrentUser();
        if (user.role !== 'manager') return;
        
        // Находим все задачи со статусом "created" в регионе руководителя
        const tasksToAssign = this.tasks.filter(task => 
            task.status === 'created' && 
            task.region === user.region
        );
        
        if (tasksToAssign.length === 0) {
            console.log('Autopilot: No tasks to assign');
            return;
        }
        
        console.log(`Autopilot: Found ${tasksToAssign.length} tasks to assign`);
        
        // Получаем сотрудников региона
        let employeesList = [];
        if (Array.isArray(this.users)) {
            employeesList = this.users.filter(u => u.role === 'employee');
        } else if (this.users.employee) {
            employeesList = this.users.employee;
        }
        
        const employees = employeesList.filter(e => e.region === user.region);
        
        // Рассчитываем загрузку каждого сотрудника
        const workloadByUser = {};
        employees.forEach(emp => {
            workloadByUser[emp.email] = 0;
        });
        
        this.tasks.forEach(task => {
            if (task.status !== 'approved' && task.assignedTo) {
                task.assignedTo.forEach(empEmail => {
                    if (workloadByUser[empEmail] !== undefined) {
                        workloadByUser[empEmail]++;
                    }
                });
            }
        });
        
        // Распределяем задачи
        let assignedCount = 0;
        tasksToAssign.forEach(task => {
            // Находим наименее загруженного сотрудника
            let minWorkload = Infinity;
            let selectedEmployee = null;
            
            employees.forEach(emp => {
                const workload = workloadByUser[emp.email];
                if (workload < minWorkload) {
                    minWorkload = workload;
                    selectedEmployee = emp;
                }
            });
            
            if (selectedEmployee) {
                try {
                    const updatedTask = this.workflow.assignTask(
                        task,
                        [selectedEmployee.email],
                        `Автоматически распределено автопилотом на наименее загруженного сотрудника`
                    );
                    
                    const index = this.tasks.findIndex(t => t.id === task.id);
                    if (index !== -1) {
                        this.tasks[index] = updatedTask;
                        workloadByUser[selectedEmployee.email]++;
                        assignedCount++;
                    }
                } catch (error) {
                    console.error('Autopilot error:', error);
                }
            }
        });
        
        if (assignedCount > 0) {
            this.storage.saveTasks(this.tasks);
            this.applyFilters();
            console.log(`Autopilot: Assigned ${assignedCount} tasks`);
        }
    }
    
    // Проверка автопилота при загрузке данных
    checkAutopilot() {
        const isActive = localStorage.getItem('zadachnik_autopilot') === 'true';
        const user = this.auth.getCurrentUser();
        
        if (isActive && user.role === 'manager') {
            // Запускаем автопилот при загрузке
            setTimeout(() => {
                this.runAutopilot();
            }, 1000);
        }
    }
    
    exportToCSV() {
        const headers = ['ID', 'Регион', 'Тип', 'Название', 'Приоритет', 'Срок', 'Статус', 'Исполнитель'];
        const rows = this.filteredTasks.map(task => [
            task.id, task.region, task.type, task.title, task.priority, 
            task.dueDate, task.status, this.getAssigneeName(task.currentAssignee) || '-'
        ]);
        
        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `zadachnik_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

// Инициализация приложения
let app;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    try {
        app = new ZadachnikApp();
        window.app = app; // Делаем глобально доступным
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

// Закрытие модальных окон по клику вне их (но не на содержимое)
window.onclick = function(event) {
    // Проверяем, что клик именно на фон модального окна, а не на его содержимое
    if (event.target.classList.contains('modal') && event.target === event.currentTarget) {
        event.target.classList.remove('active');
    }
};

// Предотвращаем закрытие при клике на содержимое модального окна
document.addEventListener('DOMContentLoaded', () => {
    const modalContents = document.querySelectorAll('.modal-content');
    modalContents.forEach(content => {
        content.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    });
});