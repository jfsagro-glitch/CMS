"""
Генерация 200 объектов разных типов для реестра
с характеристиками из справочника и связью с портфелем
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any

# Типы объектов из справочника
OBJECT_TYPES = [
    # Жилая недвижимость
    {'level0': 'Жилая недвижимость', 'level1': 'Квартира', 'level2': 'Помещение', 'key': 'apartment', 'cbCode': 2010},
    {'level0': 'Жилая недвижимость', 'level1': 'Комната', 'level2': 'Помещение', 'key': 'room', 'cbCode': 2030},
    {'level0': 'Жилая недвижимость', 'level1': 'Жилой дом', 'level2': 'Здание', 'key': 'house', 'cbCode': 2020},
    {'level0': 'Жилая недвижимость', 'level1': 'Таунхаус', 'level2': 'Здание', 'key': 'townhouse', 'cbCode': 2040},
    {'level0': 'Жилая недвижимость', 'level1': 'Земельный участок', 'level2': 'Земельный участок', 'key': 'land_residential', 'cbCode': 2060},
    
    # Коммерческая недвижимость
    {'level0': 'Коммерческая недвижимость', 'level1': 'Офисные помещения', 'level2': 'Помещение', 'key': 'office', 'cbCode': 1010},
    {'level0': 'Коммерческая недвижимость', 'level1': 'Торговые помещения', 'level2': 'Помещение', 'key': 'retail', 'cbCode': 1020},
    {'level0': 'Коммерческая недвижимость', 'level1': 'Склады', 'level2': 'Здание', 'key': 'warehouse', 'cbCode': 1031},
    {'level0': 'Коммерческая недвижимость', 'level1': 'Гостиницы', 'level2': 'Здание', 'key': 'hotel', 'cbCode': 1040},
    {'level0': 'Коммерческая недвижимость', 'level1': 'Кафе/рестораны', 'level2': 'Помещение', 'key': 'catering', 'cbCode': 1050},
    {'level0': 'Коммерческая недвижимость', 'level1': 'АЗС', 'level2': 'Здание', 'key': 'gas_station', 'cbCode': 1060},
    {'level0': 'Коммерческая недвижимость', 'level1': 'Автосалоны', 'level2': 'Здание', 'key': 'car_dealership', 'cbCode': 1070},
    
    # Промышленная недвижимость
    {'level0': 'Промышленная недвижимость', 'level1': 'Производственные здания', 'level2': 'Здание', 'key': 'industrial_building', 'cbCode': 3010},
    {'level0': 'Промышленная недвижимость', 'level1': 'Цеха', 'level2': 'Здание', 'key': 'workshop', 'cbCode': 3020},
    
    # Движимое имущество
    {'level0': 'Движимое имущество', 'level1': 'Легковые автомобили', 'level2': 'Автомобиль', 'key': 'car_passenger', 'cbCode': 4010},
    {'level0': 'Движимое имущество', 'level1': 'Грузовые автомобили', 'level2': 'Автомобиль', 'key': 'car_truck', 'cbCode': 4020},
    {'level0': 'Движимое имущество', 'level1': 'Оборудование', 'level2': 'Оборудование', 'key': 'equipment', 'cbCode': 4030},
    {'level0': 'Движимое имущество', 'level1': 'Техника', 'level2': 'Техника', 'key': 'machinery', 'cbCode': 4040},
]

# Регионы и города
REGIONS = ['Московская область', 'г. Москва', 'Ленинградская область', 'г. Санкт-Петербург', 'Краснодарский край', 'Новосибирская область']
CITIES = ['Москва', 'Санкт-Петербург', 'Краснодар', 'Новосибирск', 'Екатеринбург', 'Нижний Новгород', 'Казань']
STREETS = ['ул. Ленина', 'ул. Пушкина', 'пр. Мира', 'ул. Советская', 'ул. Центральная', 'ул. Садовая', 'ул. Новая']

# Имена и организации
FIRST_NAMES = ['Иван', 'Петр', 'Сергей', 'Александр', 'Дмитрий', 'Андрей', 'Михаил', 'Владимир']
LAST_NAMES = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев']
MIDDLE_NAMES = ['Иванович', 'Петрович', 'Сергеевич', 'Александрович', 'Дмитриевич']
ORGANIZATIONS = ['ООО "Рога и Копыта"', 'ООО "Бизнес Групп"', 'ООО "СтройИнфра"', 'ООО "ТехТранс"', 'ООО "СнабРесурс"', 'ООО "Престиж Капитал"', 'ООО "Регион Опт"', 'ООО "Вектор"']

# Статусы
STATUSES = ['approved', 'editing', 'approved', 'approved']  # Больше approved для реалистичности

def generate_id():
    return f"obj-{random.randint(100000, 999999)}"

def generate_inn(legal: bool = False):
    if legal:
        return f"{random.randint(1000000000, 9999999999)}"
    return f"{random.randint(100000000000, 999999999999)}"

def random_date(start_year=2023, end_year=2024):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return (start + timedelta(days=random_days)).isoformat()

def generate_address(obj_type: Dict[str, Any]) -> Dict[str, Any]:
    region = random.choice(REGIONS)
    city = random.choice(CITIES)
    street = random.choice(STREETS)
    house = str(random.randint(1, 100))
    building = random.choice([None, str(random.randint(1, 5))])
    apartment = None
    
    if obj_type['key'] in ['apartment', 'room', 'office', 'retail']:
        apartment = str(random.randint(1, 200))
    
    full_address_parts = [region, city, street, f"д. {house}"]
    if building:
        full_address_parts.append(f"к. {building}")
    if apartment:
        full_address_parts.append(f"кв. {apartment}")
    
    cadastral = f"{random.randint(10, 99)}:{random.randint(1, 99):02d}:{random.randint(1000000, 9999999)}:{random.randint(1000, 9999)}"
    
    return {
        'id': generate_id(),
        'region': region,
        'city': city,
        'street': street,
        'house': house,
        'building': building,
        'apartment': apartment,
        'postalCode': str(random.randint(100000, 999999)),
        'fullAddress': ', '.join(full_address_parts),
        'cadastralNumber': cadastral,
    }

def generate_partners(obj_type: Dict[str, Any]) -> List[Dict[str, Any]]:
    is_legal = random.choice([True, False])
    partners = []
    
    if is_legal:
        partners.append({
            'id': generate_id(),
            'type': 'legal',
            'role': random.choice(['owner', 'pledgor']),
            'organizationName': random.choice(ORGANIZATIONS),
            'inn': generate_inn(True),
            'share': 100,
            'showInRegistry': True,
            'createdAt': random_date(),
            'updatedAt': random_date(),
        })
    else:
        share = 100
        if random.random() < 0.3:  # 30% случаев - долевая собственность
            share = 50
            partners.append({
                'id': generate_id(),
                'type': 'individual',
                'role': 'owner',
                'lastName': random.choice(LAST_NAMES),
                'firstName': random.choice(FIRST_NAMES),
                'middleName': random.choice(MIDDLE_NAMES),
                'inn': generate_inn(False),
                'share': share,
                'showInRegistry': True,
                'createdAt': random_date(),
                'updatedAt': random_date(),
            })
            partners.append({
                'id': generate_id(),
                'type': 'individual',
                'role': 'owner',
                'lastName': random.choice(LAST_NAMES),
                'firstName': random.choice(FIRST_NAMES),
                'middleName': random.choice(MIDDLE_NAMES),
                'inn': generate_inn(False),
                'share': 100 - share,
                'showInRegistry': True,
                'createdAt': random_date(),
                'updatedAt': random_date(),
            })
        else:
            partners.append({
                'id': generate_id(),
                'type': 'individual',
                'role': 'owner',
                'lastName': random.choice(LAST_NAMES),
                'firstName': random.choice(FIRST_NAMES),
                'middleName': random.choice(MIDDLE_NAMES),
                'inn': generate_inn(False),
                'share': share,
                'showInRegistry': True,
                'createdAt': random_date(),
                'updatedAt': random_date(),
            })
    
    return partners

def generate_characteristics(obj_type: Dict[str, Any]) -> Dict[str, Any]:
    key = obj_type['key']
    chars: Dict[str, Any] = {}
    
    # Общие характеристики
    chars['marketValue'] = random.randint(1000000, 50000000)
    chars['collateralValue'] = int(chars['marketValue'] * random.uniform(0.5, 0.8))
    chars['fairValue'] = int(chars['marketValue'] * random.uniform(0.7, 0.9))
    chars['category'] = random.choice(['Формальное', 'Достаточное', 'Недостаточное'])
    chars['liquidity'] = random.choice([
        'высокая (срок реализации до 90 дней)',
        'удовлетворительная (срок реализации до 365 дней)',
        'низкая (срок реализации свыше 365 дней)',
        'малоудовлетворительная'
    ])
    chars['collateralCondition'] = random.choice(['хорошее', 'удовлетворительное', 'неудовлетворительное'])
    
    # Специфичные характеристики по типу
    if key == 'apartment':
        chars['totalAreaSqm'] = round(random.uniform(30, 150), 1)
        chars['livingArea'] = round(chars['totalAreaSqm'] * random.uniform(0.6, 0.8), 1)
        chars['kitchenArea'] = round(chars['totalAreaSqm'] * random.uniform(0.1, 0.15), 1)
        chars['floor'] = random.randint(1, 25)
        chars['totalFloors'] = random.randint(5, 25)
        chars['roomsCount'] = random.randint(1, 5)
        chars['separateBathrooms'] = random.randint(1, 2)
        chars['balcony'] = random.choice([True, False])
        chars['ceilingHeight'] = round(random.uniform(2.5, 3.2), 1)
        chars['buildYear'] = random.randint(1950, 2023)
        chars['wallMaterial'] = random.choice(['Кирпич', 'Панель', 'Монолит', 'Блочный', 'Дерево'])
        chars['hasReplanning'] = random.choice([True, False])
        
    elif key == 'house':
        chars['totalAreaSqm'] = round(random.uniform(100, 400), 1)
        chars['landAreaHectares'] = round(random.uniform(0.05, 0.5), 2)
        chars['floors'] = random.randint(1, 3)
        chars['roomsCount'] = random.randint(3, 10)
        chars['buildYear'] = random.randint(1950, 2023)
        chars['wallMaterial'] = random.choice(['Кирпич', 'Газобетон', 'Дерево', 'Каркасный', 'Монолит'])
        chars['utilities'] = random.choice(['Все', 'Частично', 'Отсутствуют'])
        chars['heating'] = random.choice(['Центральное', 'Газовое', 'Электрическое', 'Печное'])
        chars['landCadastralNumber'] = f"{random.randint(10, 99)}:{random.randint(1, 99):02d}:{random.randint(1000000, 9999999)}:{random.randint(1000, 9999)}"
        chars['landCategory'] = random.choice(['Земли населенных пунктов', 'Земли сельхозназначения'])
        
    elif key == 'office':
        chars['totalAreaSqm'] = round(random.uniform(50, 500), 1)
        chars['floor'] = random.randint(1, 30)
        chars['totalFloors'] = random.randint(5, 30)
        chars['buildingClass'] = random.choice(['A+', 'A', 'B+', 'B', 'C'])
        chars['planning'] = random.choice(['Открытая', 'Кабинетная', 'Смешанная', 'Свободная'])
        chars['finishing'] = random.choice(['Без отделки', 'Черновая', 'Предчистовая', 'Чистовая'])
        chars['ceilingHeight'] = round(random.uniform(2.7, 4.0), 1)
        chars['parking'] = random.choice([True, False])
        chars['parkingSpaces'] = random.randint(0, 10) if chars['parking'] else 0
        chars['buildYear'] = random.randint(1980, 2023)
        
    elif key == 'retail':
        chars['totalAreaSqm'] = round(random.uniform(30, 300), 1)
        chars['tradingArea'] = round(chars['totalAreaSqm'] * random.uniform(0.7, 0.9), 1)
        chars['floor'] = random.randint(1, 5)
        chars['entrance'] = random.choice(['Отдельный', 'Общий'])
        chars['showcaseLength'] = round(random.uniform(3, 20), 1)
        chars['ceilingHeight'] = round(random.uniform(2.7, 4.5), 1)
        chars['ventilation'] = random.choice(['Естественная', 'Приточная', 'Приточно-вытяжная'])
        chars['parking'] = random.choice([True, False])
        
    elif key == 'warehouse':
        chars['totalAreaSqm'] = round(random.uniform(500, 10000), 1)
        chars['storageArea'] = round(chars['totalAreaSqm'] * random.uniform(0.8, 0.95), 1)
        chars['ceilingHeight'] = round(random.uniform(6, 15), 1)
        chars['floors'] = random.randint(1, 3)
        chars['warehouseClass'] = random.choice(['A', 'A+', 'B', 'B+', 'C', 'D'])
        chars['gates'] = random.choice(['Докового типа', 'На нулевой отметке', 'Смешанные'])
        chars['gatesCount'] = random.randint(2, 20)
        chars['flooring'] = random.choice(['Бетон', 'Асфальт', 'Полимер', 'Плитка'])
        chars['loadCapacity'] = round(random.uniform(3, 10), 1)
        chars['heating'] = random.choice([True, False])
        chars['ramp'] = random.choice([True, False])
        
    elif key == 'gas_station':
        chars['landAreaSqm'] = round(random.uniform(1000, 5000), 1)
        chars['buildingArea'] = round(random.uniform(50, 200), 1)
        chars['dispensersCount'] = random.randint(2, 12)
        chars['tanksVolume'] = round(random.uniform(20, 100), 1)
        chars['fuelTypes'] = random.randint(2, 5)
        chars['carWash'] = random.choice([True, False])
        chars['shop'] = random.choice([True, False])
        chars['cafe'] = random.choice([True, False])
        chars['landCadastralNumber'] = f"{random.randint(10, 99)}:{random.randint(1, 99):02d}:{random.randint(1000000, 9999999)}:{random.randint(1000, 9999)}"
        chars['landCategory'] = random.choice(['Земли населенных пунктов', 'Земли промназначения'])
        
    elif key in ['car_passenger', 'car_truck']:
        brands = ['Toyota', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Lada', 'Hyundai', 'Kia']
        models = ['Camry', 'X5', 'E-Class', 'A6', 'Passat', 'Granta', 'Solaris', 'Rio']
        chars['brand'] = random.choice(brands)
        chars['model'] = random.choice(models)
        chars['year'] = random.randint(2015, 2023)
        chars['vin'] = ''.join([random.choice('0123456789ABCDEFGHJKLMNPRSTUVWXYZ') for _ in range(17)])
        chars['engineVolume'] = round(random.uniform(1.5, 4.0), 1)
        chars['enginePower'] = random.randint(100, 400)
        chars['fuelType'] = random.choice(['Бензин', 'Дизель', 'Гибрид', 'Электрический'])
        chars['transmission'] = random.choice(['Автоматическая', 'Механическая', 'Робот', 'Вариатор'])
        chars['mileage'] = random.randint(0, 200000)
        chars['color'] = random.choice(['Белый', 'Черный', 'Серебристый', 'Серый', 'Синий', 'Красный'])
        chars['condition'] = random.choice(['Отличное', 'Хорошее', 'Удовлетворительное'])
        
    elif key in ['equipment', 'machinery']:
        chars['manufacturer'] = random.choice(['Caterpillar', 'Komatsu', 'Volvo', 'Liebherr', 'Hitachi'])
        chars['model'] = f"Model-{random.randint(100, 999)}"
        chars['year'] = random.randint(2010, 2023)
        chars['serialNumber'] = f"SN{random.randint(100000, 999999)}"
        chars['condition'] = random.choice(['Отличное', 'Хорошее', 'Удовлетворительное'])
        chars['operatingHours'] = random.randint(0, 10000)
        
    # Для всех типов недвижимости
    if key not in ['car_passenger', 'car_truck', 'equipment', 'machinery']:
        chars['ownershipShare'] = random.choice([100, 50, 33, 25])
        chars['hasEncumbrances'] = random.choice([True, False])
        if chars['hasEncumbrances']:
            chars['encumbrancesDescription'] = 'Ипотека, аренда'
        chars['buildYear'] = chars.get('buildYear', random.randint(1950, 2023))
        chars['cadastralValue'] = int(chars['marketValue'] * random.uniform(0.3, 0.7))
        if 'totalAreaSqm' in chars:
            chars['marketValuePerSqm'] = int(chars['marketValue'] / chars['totalAreaSqm'])
    
    return chars

def generate_object_name(obj_type: Dict[str, Any], index: int) -> str:
    key = obj_type['key']
    level1 = obj_type['level1']
    
    if key == 'apartment':
        rooms = random.randint(1, 5)
        return f"{rooms}-комнатная квартира, {random.choice(STREETS)}, д. {random.randint(1, 100)}"
    elif key == 'house':
        return f"Жилой дом с участком, {random.choice(STREETS)}, д. {random.randint(1, 100)}"
    elif key == 'office':
        return f"Офисное помещение, {random.choice(STREETS)}, д. {random.randint(1, 100)}, пом. {random.randint(100, 500)}"
    elif key == 'retail':
        return f"Торговое помещение, {random.choice(STREETS)}, д. {random.randint(1, 100)}"
    elif key == 'warehouse':
        return f"Складской комплекс, {random.choice(STREETS)}, д. {random.randint(1, 100)}"
    elif key == 'gas_station':
        return f"АЗС, {random.choice(STREETS)}, д. {random.randint(1, 100)}"
    elif key in ['car_passenger', 'car_truck']:
        brands = ['Toyota', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Lada']
        models = ['Camry', 'X5', 'E-Class', 'A6', 'Passat', 'Granta']
        return f"{random.choice(brands)} {random.choice(models)} {random.randint(2015, 2023)}"
    elif key in ['equipment', 'machinery']:
        return f"{level1}, {random.choice(['Caterpillar', 'Komatsu', 'Volvo'])} Model-{random.randint(100, 999)}"
    else:
        return f"{level1}, {random.choice(STREETS)}, д. {random.randint(1, 100)}"

def load_portfolio_references() -> List[str]:
    """Загружает REFERENCE из портфеля для связи объектов с договорами"""
    try:
        portfolio_file = Path("public/portfolioData.json")
        if portfolio_file.exists():
            with open(portfolio_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                references = [str(item.get('reference', '')) for item in data if item.get('reference')]
                return references
    except Exception as e:
        print(f"Ошибка загрузки портфеля: {e}")
    return []

def generate_objects(count: int = 200) -> List[Dict[str, Any]]:
    portfolio_refs = load_portfolio_references()
    objects = []
    
    for i in range(count):
        obj_type = random.choice(OBJECT_TYPES)
        obj_id = generate_id()
        created_date = random_date()
        
        # Связь с портфелем (70% объектов связаны с договором)
        reference = None
        contract_number = None
        if portfolio_refs and random.random() < 0.7:
            reference = random.choice(portfolio_refs)
            contract_number = f"ДЗ-{random.randint(2020, 2024)}-{random.randint(1000, 9999)}"
        
        obj = {
            'id': obj_id,
            'number': f"КО-2024-{i+1:04d}",
            'name': generate_object_name(obj_type, i),
            'mainCategory': 'real_estate' if obj_type['key'] not in ['car_passenger', 'car_truck', 'equipment', 'machinery'] else 'movable',
            'classification': {
                'level0': obj_type['level0'],
                'level1': obj_type['level1'],
                'level2': obj_type['level2'],
            },
            'cbCode': obj_type['cbCode'],
            'status': random.choice(STATUSES),
            'partners': generate_partners(obj_type),
            'address': generate_address(obj_type) if obj_type['key'] not in ['car_passenger', 'car_truck', 'equipment', 'machinery'] else None,
            'characteristics': generate_characteristics(obj_type),
            'documents': [],
            'createdAt': created_date,
            'updatedAt': created_date,
        }
        
        # Добавляем связь с портфелем
        if reference:
            obj['reference'] = reference
        if contract_number:
            obj['contractNumber'] = contract_number
        
        objects.append(obj)
    
    return objects

def main():
    print("Генерация 200 объектов для реестра...")
    objects = generate_objects(200)
    
    output_file = Path("public/registryObjects.json")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(objects, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Сгенерировано {len(objects)} объектов")
    print(f"📁 Сохранено в {output_file}")
    
    # Статистика
    by_type = {}
    with_ref = sum(1 for obj in objects if obj.get('reference'))
    for obj in objects:
        key = obj['classification']['level1']
        by_type[key] = by_type.get(key, 0) + 1
    
    print("\n📊 Статистика:")
    print(f"  - Связано с портфелем: {with_ref} ({with_ref*100//len(objects)}%)")
    print(f"  - По типам:")
    for obj_type, count in sorted(by_type.items(), key=lambda x: -x[1]):
        print(f"    • {obj_type}: {count}")

if __name__ == "__main__":
    main()

