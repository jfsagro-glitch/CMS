/**
 * Демо-данные для ЗАДАЧНИК - Расширенная ролевая система
 */

const DemoData = {
    // Регионы
    regions: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург'],
    
    // Пользователи по ролям
    users: {
        business: [
            { id: 'bus1', email: 'ivanov@company.com', name: 'Иван Иванов', role: 'business', region: 'Москва' },
            { id: 'bus2', email: 'petrov@company.com', name: 'Петр Петров', role: 'business', region: 'Санкт-Петербург' },
            { id: 'bus3', email: 'sidorov@company.com', name: 'Сидор Сидоров', role: 'business', region: 'Новосибирск' },
            { id: 'bus4', email: 'kozlov@company.com', name: 'Козлов Андрей', role: 'business', region: 'Екатеринбург' },
            { id: 'bus5', email: 'novikov@company.com', name: 'Новиков Сергей', role: 'business', region: 'Москва' }
        ],
        manager: [
            { id: 'mgr1', email: 'manager.msk@company.com', name: 'Анна Руководитель', role: 'manager', region: 'Москва' },
            { id: 'mgr2', email: 'manager.spb@company.com', name: 'Елена Менеджер', role: 'manager', region: 'Санкт-Петербург' },
            { id: 'mgr3', email: 'manager.nsk@company.com', name: 'Дмитрий Директор', role: 'manager', region: 'Новосибирск' },
            { id: 'mgr4', email: 'manager.ekb@company.com', name: 'Ольга Управляющая', role: 'manager', region: 'Екатеринбург' }
        ],
        employee: generateEmployees(),
        superuser: [
            { id: 'super1', email: 'admin@company.com', name: 'Администратор Системы', role: 'superuser', region: null }
        ]
    },
    
    // Задачи (20+)
    tasks: [
        {
            id: 'T-001',
            region: 'Москва',
            type: 'Оценка',
            title: 'Оценка инвестиционного проекта строительства ТРЦ',
            description: 'Необходимо провести оценку эффективности инвестиционного проекта строительства торгово-развлекательного центра в Москве',
            priority: 'high',
            dueDate: getDateString(5),
            documents: [
                { id: 'doc1', name: 'Проект_ТРЦ.pdf', size: 2500000, type: 'application/pdf', uploadedBy: 'ivanov@company.com', uploadedByName: 'Иван Иванов', uploadedAt: getDateTimeString(-2), url: '#' }
            ],
            comments: [
                { id: 'c1', text: 'Срочная задача, приоритет высокий', author: 'Иван Иванов', authorEmail: 'ivanov@company.com', authorRole: 'business', createdAt: getDateTimeString(-2) }
            ],
            status: 'in-progress',
            businessUser: 'ivanov@company.com',
            businessUserName: 'Иван Иванов',
            assignedTo: ['emp1.msk@company.com'],
            currentAssignee: 'emp1.msk@company.com',
            createdAt: getDateTimeString(-3),
            updatedAt: getDateTimeString(-1),
            history: [
                { date: getDateTimeString(-3), user: 'Иван Иванов', userRole: 'business', action: 'Создана', comment: 'Задача создана', status: 'created' },
                { date: getDateTimeString(-2), user: 'Анна Руководитель', userRole: 'manager', action: 'Распределена', comment: 'Назначена на: Алексей Работников', status: 'assigned', assignedTo: ['emp1.msk@company.com'] },
                { date: getDateTimeString(-1), user: 'Алексей Работников', userRole: 'employee', action: 'Принята в работу', comment: 'Задача принята в работу', status: 'in-progress' }
            ]
        },
        {
            id: 'T-002',
            region: 'Санкт-Петербург',
            type: 'Экспертиза',
            title: 'Экспертиза проекта реконструкции исторического здания',
            description: 'Провести техническую экспертизу проекта реконструкции здания XIX века в центре Санкт-Петербурга',
            priority: 'critical',
            dueDate: getDateString(2),
            documents: [],
            comments: [],
            status: 'approval',
            businessUser: 'petrov@company.com',
            businessUserName: 'Петр Петров',
            assignedTo: ['emp1.spb@company.com', 'emp2.spb@company.com'],
            currentAssignee: 'emp1.spb@company.com',
            createdAt: getDateTimeString(-7),
            updatedAt: getDateTimeString(0),
            history: [
                { date: getDateTimeString(-7), user: 'Петр Петров', userRole: 'business', action: 'Создана', comment: 'Задача создана', status: 'created' },
                { date: getDateTimeString(-6), user: 'Елена Менеджер', userRole: 'manager', action: 'Распределена', comment: 'Назначена на: Владимир Петербургский, Светлана Невская', status: 'assigned', assignedTo: ['emp1.spb@company.com', 'emp2.spb@company.com'] },
                { date: getDateTimeString(-5), user: 'Владимир Петербургский', userRole: 'employee', action: 'Принята в работу', comment: 'Начинаю экспертизу', status: 'in-progress' },
                { date: getDateTimeString(0), user: 'Владимир Петербургский', userRole: 'employee', action: 'Отправлена на утверждение', comment: 'Экспертиза завершена', status: 'approval' }
            ]
        },
        {
            id: 'T-003',
            region: 'Москва',
            type: 'ПРКК',
            title: 'Подготовка документов для ПРКК по объекту на Тверской',
            description: 'Подготовить полный пакет документов для представления в Правительственную комиссию',
            priority: 'medium',
            dueDate: getDateString(10),
            documents: [],
            comments: [],
            status: 'created',
            businessUser: 'novikov@company.com',
            businessUserName: 'Новиков Сергей',
            assignedTo: [],
            currentAssignee: null,
            createdAt: getDateTimeString(-1),
            updatedAt: getDateTimeString(-1),
            history: [
                { date: getDateTimeString(-1), user: 'Новиков Сергей', userRole: 'business', action: 'Создана', comment: 'Задача создана', status: 'created' }
            ]
        },
        {
            id: 'T-004',
            region: 'Новосибирск',
            type: 'Рецензия',
            title: 'Рецензирование проектной документации жилого комплекса',
            description: 'Провести рецензирование проектной документации на строительство жилого комплекса',
            priority: 'high',
            dueDate: getDateString(7),
            documents: [
                { id: 'doc2', name: 'Проект_ЖК.pdf', size: 5000000, type: 'application/pdf', uploadedBy: 'sidorov@company.com', uploadedByName: 'Сидор Сидоров', uploadedAt: getDateTimeString(-4), url: '#' }
            ],
            comments: [],
            status: 'paused',
            businessUser: 'sidorov@company.com',
            businessUserName: 'Сидор Сидоров',
            assignedTo: ['emp1.nsk@company.com'],
            currentAssignee: 'emp1.nsk@company.com',
            createdAt: getDateTimeString(-5),
            updatedAt: getDateTimeString(-1),
            history: [
                { date: getDateTimeString(-5), user: 'Сидор Сидоров', userRole: 'business', action: 'Создана', comment: 'Задача создана', status: 'created' },
                { date: getDateTimeString(-4), user: 'Дмитрий Директор', userRole: 'manager', action: 'Распределена', comment: 'Назначена на: Павел Сибиряк', status: 'assigned', assignedTo: ['emp1.nsk@company.com'] },
                { date: getDateTimeString(-3), user: 'Павел Сибиряк', userRole: 'employee', action: 'Принята в работу', comment: 'Начинаю рецензирование', status: 'in-progress' },
                { date: getDateTimeString(-1), user: 'Павел Сибиряк', userRole: 'employee', action: 'Поставлена на паузу', comment: 'Ожидание дополнительных материалов', status: 'paused' }
            ]
        },
        {
            id: 'T-005',
            region: 'Екатеринбург',
            type: 'Оценка',
            title: 'Оценка рыночной стоимости производственного комплекса',
            description: 'Определить рыночную стоимость производственного комплекса для целей залога',
            priority: 'high',
            dueDate: getDateString(4),
            documents: [],
            comments: [],
            status: 'rework',
            businessUser: 'kozlov@company.com',
            businessUserName: 'Козлов Андрей',
            assignedTo: ['emp1.ekb@company.com'],
            currentAssignee: 'emp1.ekb@company.com',
            createdAt: getDateTimeString(-6),
            updatedAt: getDateTimeString(-1),
            history: [
                { date: getDateTimeString(-6), user: 'Козлов Андрей', userRole: 'business', action: 'Создана', comment: 'Задача создана', status: 'created' },
                { date: getDateTimeString(-5), user: 'Ольга Управляющая', userRole: 'manager', action: 'Распределена', comment: 'Назначена на: Максим Уральский', status: 'assigned', assignedTo: ['emp1.ekb@company.com'] },
                { date: getDateTimeString(-4), user: 'Максим Уральский', userRole: 'employee', action: 'Принята в работу', comment: 'Приступаю к оценке', status: 'in-progress' },
                { date: getDateTimeString(-1), user: 'Максим Уральский', userRole: 'employee', action: 'Отправлена на доработку', comment: 'Требуются уточнения по площади объекта', status: 'rework' }
            ]
        },
        {
            id: 'T-006',
            region: 'Москва',
            type: 'Отчетность',
            title: 'Подготовка квартального отчета по оценочной деятельности',
            description: 'Сформировать квартальный отчет по всем выполненным оценкам',
            priority: 'medium',
            dueDate: getDateString(15),
            documents: [],
            comments: [],
            status: 'assigned',
            businessUser: 'ivanov@company.com',
            businessUserName: 'Иван Иванов',
            assignedTo: ['emp2.msk@company.com'],
            currentAssignee: 'emp2.msk@company.com',
            createdAt: getDateTimeString(-2),
            updatedAt: getDateTimeString(-1),
            history: [
                { date: getDateTimeString(-2), user: 'Иван Иванов', userRole: 'business', action: 'Создана', comment: 'Задача создана', status: 'created' },
                { date: getDateTimeString(-1), user: 'Анна Руководитель', userRole: 'manager', action: 'Распределена', comment: 'Назначена на: Мария Исполнитель', status: 'assigned', assignedTo: ['emp2.msk@company.com'] }
            ]
        },
        {
            id: 'T-007',
            region: 'Санкт-Петербург',
            type: 'Подготовка СЗ',
            title: 'Подготовка справки о залоговой стоимости недвижимости',
            description: 'Подготовить справку о залоговой стоимости квартиры для банка',
            priority: 'high',
            dueDate: getDateString(3),
            documents: [],
            comments: [],
            status: 'in-progress',
            businessUser: 'petrov@company.com',
            businessUserName: 'Петр Петров',
            assignedTo: ['emp3.spb@company.com'],
            currentAssignee: 'emp3.spb@company.com',
            createdAt: getDateTimeString(-3),
            updatedAt: getDateTimeString(-1),
            history: [
                { date: getDateTimeString(-3), user: 'Петр Петров', userRole: 'business', action: 'Создана', comment: 'Задача создана', status: 'created' },
                { date: getDateTimeString(-2), user: 'Елена Менеджер', userRole: 'manager', action: 'Распределена', comment: 'Назначена на: Игорь Северный', status: 'assigned', assignedTo: ['emp3.spb@company.com'] },
                { date: getDateTimeString(-1), user: 'Игорь Северный', userRole: 'employee', action: 'Принята в работу', comment: 'Начинаю подготовку справки', status: 'in-progress' }
            ]
        },
        {
            id: 'T-008',
            region: 'Новосибирск',
            type: 'Экспертиза',
            title: 'Экспертиза проекта торгового центра',
            description: 'Провести строительно-техническую экспертизу проекта торгового центра',
            priority: 'critical',
            dueDate: getDateString(1),
            documents: [],
            comments: [],
            status: 'approved',
            businessUser: 'sidorov@company.com',
            businessUserName: 'Сидор Сидоров',
            assignedTo: ['emp2.nsk@company.com'],
            currentAssignee: 'emp2.nsk@company.com',
            createdAt: getDateTimeString(-10),
            updatedAt: getDateTimeString(-1),
            history: [
                { date: getDateTimeString(-10), user: 'Сидор Сидоров', userRole: 'business', action: 'Создана', comment: 'Задача создана', status: 'created' },
                { date: getDateTimeString(-9), user: 'Дмитрий Директор', userRole: 'manager', action: 'Распределена', comment: 'Назначена на: Наталья Новосибирская', status: 'assigned', assignedTo: ['emp2.nsk@company.com'] },
                { date: getDateTimeString(-8), user: 'Наталья Новосибирская', userRole: 'employee', action: 'Принята в работу', comment: 'Начинаю экспертизу', status: 'in-progress' },
                { date: getDateTimeString(-2), user: 'Наталья Новосибирская', userRole: 'employee', action: 'Отправлена на утверждение', comment: 'Экспертиза завершена', status: 'approval' },
                { date: getDateTimeString(-1), user: 'Дмитрий Директор', userRole: 'manager', action: 'Согласовано', comment: 'Экспертиза принята', status: 'approved' }
            ]
        },
        {
            id: 'T-009',
            region: 'Екатеринбург',
            type: 'Оценка',
            title: 'Оценка земельного участка под застройку',
            description: 'Оценить рыночную стоимость земельного участка площадью 5 га',
            priority: 'medium',
            dueDate: getDateString(12),
            documents: [],
            comments: [],
            status: 'in-progress',
            businessUser: 'kozlov@company.com',
            businessUserName: 'Козлов Андрей',
            assignedTo: ['emp2.ekb@company.com'],
            currentAssignee: 'emp2.ekb@company.com',
            createdAt: getDateTimeString(-4),
            updatedAt: getDateTimeString(-2),
            history: [
                { date: getDateTimeString(-4), user: 'Козлов Андрей', userRole: 'business', action: 'Создана', comment: 'Задача создана', status: 'created' },
                { date: getDateTimeString(-3), user: 'Ольга Управляющая', userRole: 'manager', action: 'Распределена', comment: 'Назначена на: Юлия Екатеринбургская', status: 'assigned', assignedTo: ['emp2.ekb@company.com'] },
                { date: getDateTimeString(-2), user: 'Юлия Екатеринбургская', userRole: 'employee', action: 'Принята в работу', comment: 'Приступаю к оценке', status: 'in-progress' }
            ]
        },
        {
            id: 'T-010',
            region: 'Москва',
            type: 'Прочее',
            title: 'Консультация по вопросам оценки',
            description: 'Провести консультацию клиента по вопросам оценки бизнеса',
            priority: 'low',
            dueDate: getDateString(20),
            documents: [],
            comments: [],
            status: 'created',
            businessUser: 'novikov@company.com',
            businessUserName: 'Новиков Сергей',
            assignedTo: [],
            currentAssignee: null,
            createdAt: getDateTimeString(0),
            updatedAt: getDateTimeString(0),
            history: [
                { date: getDateTimeString(0), user: 'Новиков Сергей', userRole: 'business', action: 'Создана', comment: 'Задача создана', status: 'created' }
            ]
        },
        // Добавим еще 15 задач для полноты
        ...generateAdditionalTasks(11, 25)
    ]
};

// Вспомогательные функции
function getDateString(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

function getDateTimeString(daysFromNow) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString();
}

// Генерация сотрудников (по 30 на каждый регион)
function generateEmployees() {
    const employees = [];
    const regions = [
        { code: 'msk', name: 'Москва' },
        { code: 'spb', name: 'Санкт-Петербург' },
        { code: 'nsk', name: 'Новосибирск' },
        { code: 'ekb', name: 'Екатеринбург' }
    ];
    
    const firstNames = [
        'Александр', 'Алексей', 'Андрей', 'Антон', 'Артем', 'Борис', 'Вадим', 'Валерий',
        'Виктор', 'Владимир', 'Дмитрий', 'Евгений', 'Игорь', 'Иван', 'Кирилл', 'Максим',
        'Михаил', 'Николай', 'Олег', 'Павел', 'Петр', 'Роман', 'Сергей', 'Станислав',
        'Анна', 'Валентина', 'Виктория', 'Галина', 'Дарья', 'Екатерина', 'Елена', 'Ирина',
        'Ксения', 'Людмила', 'Марина', 'Мария', 'Наталья', 'Ольга', 'Светлана', 'Татьяна',
        'Юлия', 'Яна', 'Анастасия', 'Вера', 'Надежда', 'Любовь', 'Полина', 'София'
    ];
    
    const lastNames = [
        'Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Соколов',
        'Михайлов', 'Новиков', 'Федоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семенов',
        'Егоров', 'Павлов', 'Козлов', 'Степанов', 'Николаев', 'Орлов', 'Андреев', 'Макаров',
        'Никитин', 'Захаров', 'Зайцев', 'Соловьев', 'Борисов', 'Яковлев', 'Григорьев', 'Романов',
        'Воробьев', 'Сергеев', 'Терентьев', 'Фролов', 'Данилов', 'Богданов', 'Тимофеев', 'Крылов'
    ];
    
    let empCounter = 1;
    
    regions.forEach(region => {
        for (let i = 1; i <= 30; i++) {
            const firstName = firstNames[(empCounter + i) % firstNames.length];
            const lastName = lastNames[(empCounter + i * 2) % lastNames.length];
            const fullName = `${firstName} ${lastName}`;
            
            employees.push({
                id: `emp${empCounter}`,
                email: `emp${i}.${region.code}@company.com`,
                name: fullName,
                role: 'employee',
                region: region.name
            });
            
            empCounter++;
        }
    });
    
    return employees;
}

function generateAdditionalTasks(startId, endId) {
    const tasks = [];
    const regions = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург'];
    const types = ['Оценка', 'Экспертиза', 'Рецензия', 'ПРКК', 'Прочее', 'Отчетность', 'Подготовка СЗ'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['created', 'assigned', 'in-progress', 'paused', 'rework', 'approval', 'approved'];
    
    for (let i = startId; i <= endId; i++) {
        const region = regions[i % regions.length];
        const type = types[i % types.length];
        const priority = priorities[i % priorities.length];
        const status = statuses[i % statuses.length];
        const daysOffset = (i % 30) - 10;
        
        tasks.push({
            id: `T-${String(i).padStart(3, '0')}`,
            region: region,
            type: type,
            title: `Задача ${i}: ${type} для региона ${region}`,
            description: `Описание задачи ${i}. Требуется выполнить ${type.toLowerCase()} в регионе ${region}.`,
            priority: priority,
            dueDate: getDateString(daysOffset + 10),
            documents: [],
            comments: [],
            status: status,
            businessUser: 'demo.business@company.com',
            businessUserName: 'Демо Бизнес',
            assignedTo: status !== 'created' ? [getEmployeeForRegion(region)] : [],
            currentAssignee: status !== 'created' ? getEmployeeForRegion(region) : null,
            createdAt: getDateTimeString(-Math.abs(daysOffset) - 5),
            updatedAt: getDateTimeString(-Math.abs(daysOffset)),
            history: [
                {
                    date: getDateTimeString(-Math.abs(daysOffset) - 5),
                    user: 'Демо Бизнес',
                    userRole: 'business',
                    action: 'Создана',
                    comment: 'Задача создана',
                    status: 'created'
                }
            ]
        });
    }
    
    return tasks;
}

function getEmployeeForRegion(region) {
    // Возвращаем первого сотрудника региона по паттерну email
    const regionCodes = {
        'Москва': 'msk',
        'Санкт-Петербург': 'spb',
        'Новосибирск': 'nsk',
        'Екатеринбург': 'ekb'
    };
    const code = regionCodes[region] || 'msk';
    return `emp1.${code}@company.com`;
}

// Экспорт
window.DemoData = DemoData;