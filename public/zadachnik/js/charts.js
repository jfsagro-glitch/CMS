/**
 * Простые графики для аналитики ЗАДАЧНИК
 * Использует Canvas API для отрисовки
 */

class SimpleCharts {
    constructor() {
        this.colors = {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#4caf50',
            warning: '#ff9800',
            error: '#f44336',
            info: '#2196f3',
            purple: '#f093fb',
            teal: '#20b2aa'
        };
    }
    
    // Круговая диаграмма
    drawPieChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        
        const total = data.reduce((sum, item) => sum + item.value, 0);
        
        if (total === 0) {
            this.drawEmptyChart(ctx, centerX, centerY, radius, 'Нет данных');
            return;
        }
        
        let currentAngle = 0;
        const colors = options.colors || Object.values(this.colors);
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем секторы
        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            const color = colors[index % colors.length];
            
            // Рисуем сектор
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            // Рисуем легенду
            if (options.showLegend !== false) {
                this.drawLegend(ctx, item, color, index, canvas.width);
            }
            
            currentAngle += sliceAngle;
        });
        
        // Рисуем центр
        if (options.showCenter !== false) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Текст в центре
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(total.toString(), centerX, centerY + 5);
        }
    }
    
    // Столбчатая диаграмма
    drawBarChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        
        const maxValue = Math.max(...data.map(item => item.value));
        const barWidth = chartWidth / data.length - 10;
        const colors = options.colors || Object.values(this.colors);
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем столбцы
        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = padding + index * (barWidth + 10);
            const y = padding + chartHeight - barHeight;
            const color = colors[index % colors.length];
            
            // Рисуем столбец
            ctx.fillStyle = color;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Рисуем значение на столбце
            ctx.fillStyle = '#333333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
            
            // Рисуем подпись
            ctx.fillStyle = '#666666';
            ctx.font = '10px Arial';
            ctx.fillText(item.label.substring(0, 8), x + barWidth / 2, canvas.height - 10);
        });
        
        // Рисуем оси
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        
        // Вертикальная ось
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.stroke();
        
        // Горизонтальная ось
        ctx.beginPath();
        ctx.moveTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.stroke();
    }
    
    // Линейный график
    drawLineChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        
        const maxValue = Math.max(...data.map(item => item.value));
        const minValue = Math.min(...data.map(item => item.value));
        const valueRange = maxValue - minValue;
        
        const color = options.color || this.colors.primary;
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем сетку
        if (options.showGrid !== false) {
            this.drawGrid(ctx, canvas, padding, chartWidth, chartHeight, data.length, 5);
        }
        
        // Рисуем линию
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((item, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((item.value - minValue) / valueRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Рисуем точки
        ctx.fillStyle = color;
        data.forEach((item, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((item.value - minValue) / valueRange) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Рисуем оси
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        
        // Вертикальная ось
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + chartHeight);
        ctx.stroke();
        
        // Горизонтальная ось
        ctx.beginPath();
        ctx.moveTo(padding, padding + chartHeight);
        ctx.lineTo(padding + chartWidth, padding + chartHeight);
        ctx.stroke();
    }
    
    // Вспомогательные методы
    drawEmptyChart(ctx, centerX, centerY, radius, message) {
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#666666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, centerX, centerY);
    }
    
    drawLegend(ctx, item, color, index, canvasWidth) {
        const legendX = canvasWidth - 150;
        const legendY = 30 + index * 20;
        
        // Цветной квадрат
        ctx.fillStyle = color;
        ctx.fillRect(legendX, legendY - 8, 12, 12);
        
        // Текст легенды
        ctx.fillStyle = '#333333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${item.label}: ${item.value}`, legendX + 18, legendY);
    }
    
    drawGrid(ctx, canvas, padding, chartWidth, chartHeight, xSteps, ySteps) {
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        
        // Вертикальные линии
        for (let i = 0; i <= xSteps; i++) {
            const x = padding + (i / xSteps) * chartWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, padding + chartHeight);
            ctx.stroke();
        }
        
        // Горизонтальные линии
        for (let i = 0; i <= ySteps; i++) {
            const y = padding + (i / ySteps) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + chartWidth, y);
            ctx.stroke();
        }
    }
    
    // Создание данных для графиков
    createTaskStatusData(tasks) {
        const statusCounts = {
            'new': 0,
            'in-progress': 0,
            'review': 0,
            'done': 0
        };
        
        tasks.forEach(task => {
            if (statusCounts.hasOwnProperty(task.status)) {
                statusCounts[task.status]++;
            }
        });
        
        return [
            { label: 'Новые', value: statusCounts.new },
            { label: 'В работе', value: statusCounts['in-progress'] },
            { label: 'На проверке', value: statusCounts.review },
            { label: 'Выполнено', value: statusCounts.done }
        ];
    }
    
    createUserWorkloadData(users, tasks) {
        return users.map(user => {
            const userTasks = tasks.filter(task => task.assignee === user.name);
            return {
                label: user.name.split(' ')[0],
                value: userTasks.length
            };
        });
    }
    
    createPriorityData(tasks) {
        const priorityCounts = {
            'low': 0,
            'medium': 0,
            'high': 0,
            'critical': 0
        };
        
        tasks.forEach(task => {
            if (priorityCounts.hasOwnProperty(task.priority)) {
                priorityCounts[task.priority]++;
            }
        });
        
        return [
            { label: 'Низкий', value: priorityCounts.low },
            { label: 'Средний', value: priorityCounts.medium },
            { label: 'Высокий', value: priorityCounts.high },
            { label: 'Критический', value: priorityCounts.critical }
        ];
    }
    
    createCompletionOverTime(tasks) {
        // Группируем задачи по дням создания
        const dailyCompletion = {};
        
        tasks.forEach(task => {
            if (task.status === 'done' && task.createdAt) {
                const date = new Date(task.createdAt).toDateString();
                dailyCompletion[date] = (dailyCompletion[date] || 0) + 1;
            }
        });
        
        // Создаем массив для последних 7 дней
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            result.push({
                label: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
                value: dailyCompletion[dateString] || 0
            });
        }
        
        return result;
    }
}

// Создаем глобальный экземпляр
window.charts = new SimpleCharts();
