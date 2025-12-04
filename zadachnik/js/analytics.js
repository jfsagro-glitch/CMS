/**
 * Аналитика и KPI для ЗАДАЧНИК
 */

class AnalyticsManager {
    constructor(authManager) {
        this.auth = authManager;
    }
    
    // Общая статистика по задачам
    getTasksStatistics(tasks) {
        const stats = {
            total: tasks.length,
            byStatus: {},
            byPriority: {},
            byRegion: {},
            byType: {},
            overdue: 0,
            completed: 0,
            inProgress: 0
        };
        
        const today = new Date();
        
        tasks.forEach(task => {
            // По статусам
            stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
            
            // По приоритетам
            stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
            
            // По регионам
            stats.byRegion[task.region] = (stats.byRegion[task.region] || 0) + 1;
            
            // По типам
            stats.byType[task.type] = (stats.byType[task.type] || 0) + 1;
            
            // Просроченные
            const dueDate = new Date(task.dueDate);
            if (dueDate < today && task.status !== 'approved') {
                stats.overdue++;
            }
            
            // Завершенные
            if (task.status === 'approved') {
                stats.completed++;
            }
            
            // В работе
            if (task.status === 'in-progress') {
                stats.inProgress++;
            }
        });
        
        return stats;
    }
    
    // Статистика по сотрудникам (для руководителя)
    getEmployeeStatistics(tasks, employees) {
        const employeeStats = {};
        
        employees.forEach(emp => {
            employeeStats[emp.email] = {
                name: emp.name,
                email: emp.email,
                totalTasks: 0,
                completed: 0,
                inProgress: 0,
                paused: 0,
                overdue: 0,
                workload: 0,
                avgCompletionTime: 0,
                completionTimes: []
            };
        });
        
        const today = new Date();
        
        tasks.forEach(task => {
            if (task.assignedTo && task.assignedTo.length > 0) {
                task.assignedTo.forEach(empEmail => {
                    if (employeeStats[empEmail]) {
                        const stat = employeeStats[empEmail];
                        stat.totalTasks++;
                        
                        if (task.status === 'approved') {
                            stat.completed++;
                            
                            // Рассчитываем время выполнения
                            const created = new Date(task.createdAt);
                            const completed = new Date(task.updatedAt);
                            const days = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
                            stat.completionTimes.push(days);
                        }
                        
                        if (task.status === 'in-progress') {
                            stat.inProgress++;
                        }
                        
                        if (task.status === 'paused') {
                            stat.paused++;
                        }
                        
                        const dueDate = new Date(task.dueDate);
                        if (dueDate < today && task.status !== 'approved') {
                            stat.overdue++;
                        }
                    }
                });
            }
        });
        
        // Рассчитываем средние значения
        Object.keys(employeeStats).forEach(email => {
            const stat = employeeStats[email];
            
            // Загрузка (процент активных задач от общего числа)
            const activeTasks = stat.inProgress + stat.paused;
            stat.workload = stat.totalTasks > 0 
                ? Math.round((activeTasks / stat.totalTasks) * 100) 
                : 0;
            
            // Среднее время выполнения
            if (stat.completionTimes.length > 0) {
                const sum = stat.completionTimes.reduce((a, b) => a + b, 0);
                stat.avgCompletionTime = Math.round(sum / stat.completionTimes.length);
            }
        });
        
        return employeeStats;
    }
    
    // KPI для руководителя
    calculateKPI(tasks, region = null) {
        let filteredTasks = tasks;
        
        // Фильтруем по региону, если указан
        if (region) {
            filteredTasks = tasks.filter(t => t.region === region);
        }
        
        if (filteredTasks.length === 0) {
            return {
                completionRate: 0,
                onTimeRate: 0,
                qualityScore: 0,
                avgCompletionTime: 0,
                productivity: 0
            };
        }
        
        const today = new Date();
        let completed = 0;
        let completedOnTime = 0;
        let reworkCount = 0;
        let completionTimes = [];
        
        filteredTasks.forEach(task => {
            if (task.status === 'approved') {
                completed++;
                
                // Проверяем, выполнено ли в срок
                const completedDate = new Date(task.updatedAt);
                const dueDate = new Date(task.dueDate);
                if (completedDate <= dueDate) {
                    completedOnTime++;
                }
                
                // Время выполнения
                const created = new Date(task.createdAt);
                const days = Math.ceil((completedDate - created) / (1000 * 60 * 60 * 24));
                completionTimes.push(days);
            }
            
            // Подсчет доработок
            const reworkHistory = task.history.filter(h => h.action === 'Отправлена на доработку');
            reworkCount += reworkHistory.length;
        });
        
        // Процент выполнения
        const completionRate = Math.round((completed / filteredTasks.length) * 100);
        
        // Процент выполнения в срок
        const onTimeRate = completed > 0 
            ? Math.round((completedOnTime / completed) * 100) 
            : 0;
        
        // Качество (обратно пропорционально количеству доработок)
        const qualityScore = completed > 0 
            ? Math.max(0, 100 - Math.round((reworkCount / completed) * 20)) 
            : 100;
        
        // Среднее время выполнения
        const avgCompletionTime = completionTimes.length > 0
            ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
            : 0;
        
        // Производительность (комплексный показатель)
        const productivity = Math.round((completionRate + onTimeRate + qualityScore) / 3);
        
        return {
            completionRate,
            onTimeRate,
            qualityScore,
            avgCompletionTime,
            productivity
        };
    }
    
    // Статистика по регионам (для суперпользователя)
    getRegionStatistics(tasks) {
        const regionStats = {};
        
        tasks.forEach(task => {
            if (!regionStats[task.region]) {
                regionStats[task.region] = {
                    total: 0,
                    completed: 0,
                    inProgress: 0,
                    overdue: 0
                };
            }
            
            const stat = regionStats[task.region];
            stat.total++;
            
            if (task.status === 'approved') {
                stat.completed++;
            }
            
            if (task.status === 'in-progress') {
                stat.inProgress++;
            }
            
            const today = new Date();
            const dueDate = new Date(task.dueDate);
            if (dueDate < today && task.status !== 'approved') {
                stat.overdue++;
            }
        });
        
        // Добавляем процент выполнения
        Object.keys(regionStats).forEach(region => {
            const stat = regionStats[region];
            stat.completionRate = stat.total > 0 
                ? Math.round((stat.completed / stat.total) * 100) 
                : 0;
        });
        
        return regionStats;
    }
    
    // Загрузка сотрудников (для руководителя)
    getWorkloadByEmployee(tasks, employees) {
        const workload = {};
        
        employees.forEach(emp => {
            workload[emp.email] = {
                name: emp.name,
                activeTasks: 0,
                workloadPercent: 0,
                available: true
            };
        });
        
        tasks.forEach(task => {
            if (task.status !== 'approved' && task.assignedTo) {
                task.assignedTo.forEach(empEmail => {
                    if (workload[empEmail]) {
                        workload[empEmail].activeTasks++;
                    }
                });
            }
        });
        
        // Рассчитываем процент загрузки (условно: 5 задач = 100%)
        Object.keys(workload).forEach(email => {
            const load = workload[email];
            load.workloadPercent = Math.min(100, Math.round((load.activeTasks / 5) * 100));
            load.available = load.workloadPercent < 80;
        });
        
        return workload;
    }
    
    // Тренд выполнения задач (по дням)
    getCompletionTrend(tasks, days = 30) {
        const trend = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const completedOnDay = tasks.filter(task => {
                if (task.status !== 'approved') return false;
                const completedDate = new Date(task.updatedAt).toISOString().split('T')[0];
                return completedDate === dateStr;
            }).length;
            
            trend.push({
                date: dateStr,
                completed: completedOnDay
            });
        }
        
        return trend;
    }
    
    // Топ исполнителей
    getTopPerformers(tasks, employees, limit = 5) {
        const employeeStats = this.getEmployeeStatistics(tasks, employees);
        
        const performers = Object.values(employeeStats).map(stat => ({
            name: stat.name,
            email: stat.email,
            completed: stat.completed,
            completionRate: stat.totalTasks > 0 
                ? Math.round((stat.completed / stat.totalTasks) * 100) 
                : 0,
            avgCompletionTime: stat.avgCompletionTime
        }));
        
        // Сортируем по количеству выполненных задач
        performers.sort((a, b) => b.completed - a.completed);
        
        return performers.slice(0, limit);
    }
    
    // Проблемные задачи (просроченные, долго в работе)
    getProblematicTasks(tasks) {
        const today = new Date();
        const problematic = [];
        
        tasks.forEach(task => {
            if (task.status === 'approved') return;
            
            const dueDate = new Date(task.dueDate);
            const createdDate = new Date(task.createdAt);
            const daysInWork = Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24));
            
            let reason = [];
            
            // Просрочена
            if (dueDate < today) {
                const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
                reason.push(`Просрочена на ${daysOverdue} дн.`);
            }
            
            // Долго в работе
            if (daysInWork > 30) {
                reason.push(`В работе ${daysInWork} дн.`);
            }
            
            // На паузе
            if (task.status === 'paused') {
                reason.push('На паузе');
            }
            
            // Много доработок
            const reworkCount = task.history.filter(h => h.action === 'Отправлена на доработку').length;
            if (reworkCount > 2) {
                reason.push(`${reworkCount} доработки`);
            }
            
            if (reason.length > 0) {
                problematic.push({
                    task: task,
                    reasons: reason
                });
            }
        });
        
        return problematic;
    }
    
    // Экспорт данных для аналитики
    exportAnalytics(tasks, employees, region = null) {
        const stats = this.getTasksStatistics(tasks);
        const kpi = this.calculateKPI(tasks, region);
        const employeeStats = this.getEmployeeStatistics(tasks, employees);
        const regionStats = this.getRegionStatistics(tasks);
        const topPerformers = this.getTopPerformers(tasks, employees);
        const problematic = this.getProblematicTasks(tasks);
        
        return {
            generatedAt: new Date().toISOString(),
            region: region || 'Все регионы',
            summary: stats,
            kpi: kpi,
            employees: employeeStats,
            regions: regionStats,
            topPerformers: topPerformers,
            problematicTasks: problematic
        };
    }
}

// Экспорт
window.AnalyticsManager = AnalyticsManager;
