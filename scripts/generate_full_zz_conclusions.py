"""
Полная генерация демо-данных для залоговых заключений со всеми вкладками из ZZ
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

OUTPUT_FILE = Path("public/collateralConclusionsData.json")

# Справочники
CONCLUSION_TYPES = ["Первичное", "Повторное", "Дополнительное", "Переоценка"]
STATUSES = ["Черновик", "На согласовании", "Согласовано", "Отклонено", "Аннулировано"]
RISK_LEVELS = ["Низкий", "Средний", "Высокий", "Критический"]

COLLATERAL_TYPES = [
    "Недвижимость жилая", "Недвижимость нежилая", "Транспортные средства",
    "Оборудование", "Спецтехника", "Товары в обороте", "Ценные бумаги"
]

CREDIT_PRODUCTS = ["Кредит", "Кредитная линия", "Овердрафт", "Гарантия", "Аккредитив"]
CATEGORIES = ["Формальное", "Достаточное", "Недостаточное"]

LIQUIDITY_OPTIONS = [
    "высокая (срок реализации до 90 дней)",
    "удовлетворительная (срок реализации до 365 дней)",
    "низкая (срок реализации свыше 365 дней)",
    "малоудовлетворительная",
]

CONDITIONS = ["хорошее", "удовлетворительное", "неудовлетворительное"]
LAND_CATEGORIES = [
    "земли населенных пунктов",
    "земли сельскохозяйственного назначения",
    "земли промышленности",
    "земли особо охраняемых территорий",
]

PERMITTED_USES = [
    "размещение объектов капитального строительства",
    "размещение объектов торговли",
    "размещение объектов общественного питания",
    "размещение объектов бытового обслуживания",
    "ИЖС",
    "для производства",
]

SUSPENSIVE_CONDITIONS_LIST = [
    "согласования ДЗ/ДИ",
    "предоставления КП",
    "подтверждения права собственности",
    "внесения в ЕГРН сведений о кадастровых номерах",
    "снятия обременений",
    "подтверждения отсутствия признаков банкротства",
    "предоставления выписки из протокола/решения уполномоченного органа",
    "предоставления перечня объектов по форме Банка",
    "письменного уведомления Арендодателя",
]

AUTHORS = ["Иванов И.И.", "Петрова А.В.", "Сидоров С.С.", "Козлова М.А.", "Новиков Д.П.", "Смирнова Е.В."]

def random_date(start: datetime, end: datetime) -> str:
    """Генерация случайной даты"""
    delta = end - start
    random_days = random.randint(0, delta.days)
    return (start + timedelta(days=random_days)).strftime("%Y-%m-%d")

def generate_suspensive_conditions(count: int = None) -> list:
    """Генерация отлагательных условий"""
    if count is None:
        count = random.randint(2, 6)
    
    conditions = []
    selected = random.sample(SUSPENSIVE_CONDITIONS_LIST, min(count, len(SUSPENSIVE_CONDITIONS_LIST)))
    
    for i, cond in enumerate(selected, 1):
        conditions.append({
            "id": f"cond-{i}",
            "number": i,
            "description": cond,
            "suspensiveCondition": "+" if random.random() > 0.3 else "-",
            "additionalCondition": random.choice(SUSPENSIVE_CONDITIONS_LIST) if random.random() > 0.5 else None,
        })
    
    return conditions

def generate_detailed_descriptions(collateral_type: str, objects_count: int, market_value: float, collateral_value: float) -> list:
    """Генерация детального описания объектов"""
    descriptions = []
    is_real_estate = "недвижимость" in collateral_type.lower()
    
    for j in range(1, objects_count + 1):
        obj_area = random.randint(20, 500) if is_real_estate else None
        obj_cadastral = f"{random.randint(77, 99)}:{random.randint(1, 99)}:{random.randint(1000000, 9999999)}:{random.randint(1, 9999)}" if is_real_estate and random.random() > 0.3 else None
        
        descriptions.append({
            "id": f"desc-{j}",
            "objectNumber": j,
            "objectName": f"{collateral_type} - объект {j}",
            "objectType": collateral_type,
            "cadastralNumber": obj_cadastral,
            "address": f"г. Москва, ул. Примерная, д. {random.randint(1, 200)}",
            "areaSqm": obj_area,
            "areaHectares": round((obj_area or 0) / 100, 2) if obj_area and random.random() > 0.5 else None,
            "floor": f"{random.randint(1, 10)} этаж" if is_real_estate and random.random() > 0.5 else None,
            "floorsCount": random.randint(1, 10) if is_real_estate and random.random() > 0.5 else None,
            "undergroundFloors": random.randint(0, 2) if is_real_estate and random.random() > 0.7 else None,
            "purpose": collateral_type,
            "condition": random.choice(CONDITIONS),
            "material": random.choice(["Кирпич", "Бетон", "Металл", "Дерево"]) if is_real_estate and random.random() > 0.5 else None,
            "yearBuilt": random.randint(1990, 2020) if random.random() > 0.5 else None,
            "yearCommissioned": random.randint(1990, 2020) if random.random() > 0.5 else None,
            "marketValue": int((market_value or 0) / objects_count) if market_value and objects_count else None,
            "collateralValue": int((collateral_value or 0) / objects_count) if collateral_value and objects_count else None,
            "ownershipShare": random.randint(50, 100),
            "ownershipBasis": random.choice(["Право собственности", "Право аренды", "Право пользования"]),
            "registrationRecord": f"Запись № {random.randint(100000, 999999)}-{random.randint(1, 99)}/{random.randint(2020, 2024)}-{random.randint(1, 10)}" if random.random() > 0.5 else None,
            "encumbrances": "Не выявлены" if random.random() > 0.6 else "Имеются обременения",
            "replanning": "Перепланировки не выявлены" if random.random() > 0.6 else "Выявлены несущественные перепланировки",
            "description": f"Детальное описание объекта {j}: состояние {random.choice(CONDITIONS)}, год постройки {random.randint(1990, 2020) if is_real_estate else 'N/A'}",
        })
    
    return descriptions

def generate_calculations(collateral_type: str, market_value: float) -> list:
    """Генерация расчетов в зависимости от типа залога"""
    calculations = []
    
    if "недвижимость" in collateral_type.lower() and "коммерческая" in collateral_type.lower():
        # Расчет коммерческого помещения
        calculations.append({
            "id": "calc-commercial",
            "type": "Расчет ком.пом.",
            "data": {
                "analogs": [
                    {
                        "number": 1,
                        "address": "г. Москва, ул. Примерная, д. 1",
                        "description": "Аналог 1",
                        "price": int(market_value * random.uniform(0.8, 1.2)),
                        "area": random.randint(50, 200),
                    },
                    {
                        "number": 2,
                        "address": "г. Москва, ул. Примерная, д. 2",
                        "description": "Аналог 2",
                        "price": int(market_value * random.uniform(0.8, 1.2)),
                        "area": random.randint(50, 200),
                    },
                ],
                "totalArea": random.randint(100, 300),
                "adjustedValue": int(market_value * random.uniform(0.9, 1.1)),
                "marketValue": market_value,
            }
        })
    elif "азс" in collateral_type.lower():
        # Расчет АЗС
        calculations.append({
            "id": "calc-azs",
            "type": "Расчет АЗС",
            "data": {
                "salesVolume": random.randint(1000000, 5000000),  # литры за 36 месяцев
                "purchasePrice": random.randint(30000, 50000),  # руб./тонна
                "expenses": random.randint(5000000, 15000000),  # расходы на содержание
                "grossIncome": random.randint(20000000, 50000000),
                "averageDailyThroughput": random.randint(5000, 15000),  # литры
                "dailyTraffic": random.randint(100, 500),
            }
        })
    elif "судно" in collateral_type.lower():
        # Расчет судна
        calculations.append({
            "id": "calc-vessel",
            "type": "Расчет судно",
            "data": {
                "deadweight": random.randint(1000, 10000),  # тонн
                "vesselAge": random.randint(5, 30),  # лет
                "portOfRegistry": random.choice(["Россия", "Либерия", "Панама"]),
                "navigationArea": random.choice(["Море", "Внутренние воды", "Смешанное плавание"]),
                "vesselType": random.choice(["Танкер", "Генгруз", "Пассажирское судно"]),
            }
        })
    
    return calculations

def generate_conclusions(count: int = 50) -> list:
    """Генерация заключений"""
    conclusions = []
    
    # Загружаем данные портфеля для связи
    portfolio_file = Path("public/portfolioData.json")
    portfolio_data = []
    if portfolio_file.exists():
        with portfolio_file.open("r", encoding="utf-8") as f:
            portfolio_data = json.load(f)
    
    for i in range(1, count + 1):
        # Связь с портфелем
        deal = random.choice(portfolio_data) if portfolio_data else None
        
        conclusion_date = random_date(
            datetime(2024, 1, 1),
            datetime(2025, 1, 7)
        )
        
        # Основные данные
        conclusion_type = random.choice(CONCLUSION_TYPES)
        status = random.choice(STATUSES)
        collateral_type = random.choice(COLLATERAL_TYPES)
        is_real_estate = "недвижимость" in collateral_type.lower()
        
        # Данные из портфеля или случайные
        reference = deal.get("reference") if deal else f"DEMO-{i:04d}"
        contract_number = deal.get("contractNumber") if deal else f"DEM-2023-{1000+i}"
        pledger = deal.get("pledger") if deal else f"ООО «Демо {i:03d}»"
        pledger_inn = deal.get("inn") if deal else f"{random.randint(1000000000, 9999999999)}"
        borrower = deal.get("borrower") if deal else f"ООО «Заемщик {i:03d}»"
        
        # Кредитный продукт
        credit_product = random.choice(CREDIT_PRODUCTS)
        credit_amount = random.randint(10000000, 500000000)
        credit_term = random.randint(12, 120)
        
        # Имущество
        total_area_sqm = random.randint(50, 500) if is_real_estate else None
        total_area_hectares = round((total_area_sqm or 0) / 100, 2) if total_area_sqm and random.random() > 0.5 else None
        objects_count = random.randint(1, 5)
        ownership_share = random.randint(50, 100)
        collateral_location = deal.get("collateralLocation") if deal else f"г. Москва, ул. Примерная, д. {i}"
        
        # Земельный участок
        land_cadastral = f"{random.randint(77, 99)}:{random.randint(1, 99)}:{random.randint(1000000, 9999999)}:{random.randint(1, 9999)}" if is_real_estate and random.random() > 0.4 else None
        land_category = random.choice(LAND_CATEGORIES) if is_real_estate and random.random() > 0.4 else None
        land_permitted_use = random.choice(PERMITTED_USES) if is_real_estate and random.random() > 0.4 else None
        land_area_sqm = int(total_area_sqm * random.uniform(1.5, 3.0)) if total_area_sqm and is_real_estate and random.random() > 0.5 else None
        land_area_hectares = round((land_area_sqm or 0) / 10000, 2) if land_area_sqm and random.random() > 0.5 else None
        
        # Оценка
        market_value = random.randint(5000000, 300000000)
        collateral_value = int(market_value * random.uniform(0.6, 0.9))
        fair_value = int(market_value * random.uniform(0.85, 1.0))
        cadastral_value = int(market_value * random.uniform(0.7, 0.9)) if random.random() > 0.5 else None
        market_value_per_sqm = int(market_value / (total_area_sqm or 1)) if total_area_sqm and random.random() > 0.5 else None
        market_value_per_hectare = int(market_value / (total_area_hectares or 0.01)) if total_area_hectares and random.random() > 0.5 else None
        
        # Характеристики
        category = random.choice(CATEGORIES) if random.random() > 0.3 else None
        liquidity = random.choice(LIQUIDITY_OPTIONS) if random.random() > 0.3 else None
        liquidity_fair_value = random.choice(LIQUIDITY_OPTIONS) if random.random() > 0.5 else None
        liquidity_movable = random.choice(LIQUIDITY_OPTIONS) if "транспорт" in collateral_type.lower() and random.random() > 0.5 else None
        
        # Состояние
        collateral_condition = random.choice(CONDITIONS) if random.random() > 0.3 else None
        has_replanning = random.choice([True, False]) if random.random() > 0.5 else None
        replanning_description = (
            "Выявлены несущественные перепланировки" if has_replanning and random.random() > 0.5
            else "Перепланировки не выявлены" if not has_replanning
            else None
        )
        land_functional_provision = random.choice(["функционально обеспечивает", "не обеспечивает"]) if is_real_estate and random.random() > 0.6 else None
        
        collateral_description = (
            f"Предлагаемое в залог имущество расположено в {collateral_location}, "
            f"состояние имущества {collateral_condition or 'хорошее'}, "
            f"перепланировки {'выявлены' if has_replanning else 'не выявлены'}."
        ) if random.random() > 0.2 else None
        
        # Обременения
        has_encumbrances = random.choice([True, False]) if random.random() > 0.6 else None
        encumbrances_description = "Имеются зарегистрированные обременения. Требуется снятие обременений." if has_encumbrances else None
        encumbrances_details = "Обременения не выявлены, имеются ограничения прав на часть земельного участка." if has_encumbrances and random.random() > 0.5 else None
        
        # Права на объект
        ownership_basis = random.choice(["Право собственности", "Право аренды", "Право пользования земельным участком"]) if random.random() > 0.4 else None
        ownership_documents = f"Договор купли-продажи от {random_date(datetime.strptime(conclusion_date, '%Y-%m-%d') - timedelta(days=365), datetime.strptime(conclusion_date, '%Y-%m-%d'))}" if ownership_basis and random.random() > 0.5 else None
        registration_record = f"Запись № {random.randint(100000, 999999)}-{random.randint(1, 99)}/{random.randint(2020, 2024)}-{random.randint(1, 10)} от {random_date(datetime.strptime(conclusion_date, '%Y-%m-%d') - timedelta(days=180), datetime.strptime(conclusion_date, '%Y-%m-%d'))}" if random.random() > 0.5 else None
        registration_document = f"Выписка из Единого государственного реестра недвижимости об объекте недвижимости № {random.randint(99, 999)}/{random.randint(2020, 2024)}/{random.randint(100000000, 999999999)}" if random.random() > 0.6 else None
        
        # Проверка
        inspection_date = random_date(
            datetime.strptime(conclusion_date, "%Y-%m-%d") - timedelta(days=14),
            datetime.strptime(conclusion_date, "%Y-%m-%d") - timedelta(days=1)
        ) if random.random() > 0.3 else None
        inspector_name = random.choice(AUTHORS) if inspection_date else None
        
        # Проверка на банкротство
        bankruptcy_check_date = random_date(
            datetime.strptime(conclusion_date, "%Y-%m-%d") - timedelta(days=30),
            datetime.strptime(conclusion_date, "%Y-%m-%d")
        ) if random.random() > 0.5 else None
        bankruptcy_check_result = "Признаков банкротства не выявлено" if bankruptcy_check_date and random.random() > 0.3 else None
        
        # Особое мнение
        special_opinion = (
            f"Возможно рассмотреть в качестве залога при условии {'внесения в ЕГРН сведений о кадастровых номерах' if land_cadastral else 'подтверждения права собственности'}. "
            f"Уровень ликвидности объекта: {liquidity or random.choice(LIQUIDITY_OPTIONS)}. "
            f"{'Требуется снятие обременений.' if has_encumbrances else ''}"
        ) if random.random() > 0.3 else None
        
        # Отлагательные условия
        suspensive_conditions = generate_suspensive_conditions() if random.random() > 0.5 else []
        
        # Детальное описание
        detailed_descriptions = generate_detailed_descriptions(collateral_type, objects_count, market_value, collateral_value) if objects_count > 1 and random.random() > 0.6 else []
        
        # Фото
        photos = []
        if random.random() > 0.5:
            photo_count = random.randint(2, 5)
            for j in range(1, photo_count + 1):
                photos.append({
                    "id": f"photo-{j}",
                    "url": f"https://via.placeholder.com/400x300?text=Photo+{j}",
                    "description": f"Фото {j} - {'фасадное' if j <= 2 else 'внутреннее'}",
                    "isMain": j <= 2,
                    "photoNumber": j,
                })
        
        # Рецензия
        review = None
        if random.random() > 0.7:
            review = {
                "id": "review-1",
                "reviewer": random.choice(AUTHORS),
                "reviewerPosition": random.choice(["Главный оценщик", "Руководитель отдела", "Эксперт"]),
                "reviewDate": random_date(
                    datetime.strptime(conclusion_date, "%Y-%m-%d"),
                    datetime.strptime(conclusion_date, "%Y-%m-%d") + timedelta(days=10)
                ),
                "reviewText": "Рецензия проведена. Заключение соответствует требованиям.",
                "conclusion": "Одобрено",
                "compliance": "Соответствует требованиям Федерального закона от 29.07.98 г. №135-ФЗ",
                "reportCompliance": "Отчет об оценке соответствует требованиям Федерального закона от 29.07.98 г. №135-ФЗ «Об оценочной деятельности в Российской Федерации»" if random.random() > 0.5 else None,
            }
        
        # Расчеты
        calculations = generate_calculations(collateral_type, market_value) if random.random() > 0.6 else []
        
        conclusion = {
            "id": f"conclusion-{i}",
            "conclusionNumber": f"ЗК-{datetime.strptime(conclusion_date, '%Y-%m-%d').year}-{i:06d}",
            "conclusionDate": conclusion_date,
            "reference": reference,
            "contractNumber": contract_number,
            "pledger": pledger,
            "pledgerInn": pledger_inn,
            "borrower": borrower,
            "borrowerInn": f"{random.randint(1000000000, 9999999999)}",
            "creditProduct": credit_product,
            "creditAmount": credit_amount,
            "creditTermMonths": credit_term,
            "creditContractNumber": f"КРД-{random.randint(10000, 99999)}" if random.random() > 0.5 else None,
            "collateralType": collateral_type,
            "collateralName": f"{collateral_type} - объект 1",
            "collateralPurpose": f"Использование в качестве {collateral_type.lower()}",
            "totalAreaSqm": total_area_sqm,
            "totalAreaHectares": total_area_hectares,
            "collateralLocation": collateral_location,
            "objectsCount": objects_count,
            "ownershipShare": ownership_share,
            "landCategory": land_category,
            "landPermittedUse": land_permitted_use,
            "landCadastralNumber": land_cadastral,
            "landAreaSqm": land_area_sqm,
            "landAreaHectares": land_area_hectares,
            "marketValue": market_value,
            "collateralValue": collateral_value,
            "fairValue": fair_value,
            "cadastralValue": cadastral_value,
            "marketValuePerSqm": market_value_per_sqm,
            "marketValuePerHectare": market_value_per_hectare,
            "category": category,
            "liquidity": liquidity,
            "liquidityFairValue": liquidity_fair_value,
            "liquidityMovable": liquidity_movable,
            "collateralDescription": collateral_description,
            "collateralCondition": collateral_condition,
            "hasReplanning": has_replanning,
            "replanningDescription": replanning_description,
            "landFunctionalProvision": land_functional_provision,
            "hasEncumbrances": has_encumbrances,
            "encumbrancesDescription": encumbrances_description,
            "encumbrancesDetails": encumbrances_details,
            "ownershipBasis": ownership_basis,
            "ownershipDocuments": ownership_documents,
            "registrationRecord": registration_record,
            "registrationDocument": registration_document,
            "inspectionDate": inspection_date,
            "inspectorName": inspector_name,
            "bankruptcyCheckDate": bankruptcy_check_date,
            "bankruptcyCheckResult": bankruptcy_check_result,
            "specialOpinion": special_opinion,
            "suspensiveConditions": suspensive_conditions if suspensive_conditions else None,
            "detailedDescriptions": detailed_descriptions if detailed_descriptions else None,
            "photos": photos if photos else None,
            "review": review,
            "calculations": calculations if calculations else None,
            "conclusionType": conclusion_type,
            "status": status,
            "statusColor": (
                "green" if status == "Согласовано"
                else "blue" if status == "На согласовании"
                else "red" if status in ["Отклонено", "Аннулировано"]
                else None
            ),
            "author": random.choice(AUTHORS),
            "authorDate": conclusion_date,
            "approver": random.choice(AUTHORS) if status == "Согласовано" and random.random() > 0.3 else None,
            "approvalDate": random_date(
                datetime.strptime(conclusion_date, "%Y-%m-%d"),
                datetime.strptime(conclusion_date, "%Y-%m-%d") + timedelta(days=30)
            ) if status == "Согласовано" and random.random() > 0.5 else None,
            "conclusionText": f"Проведена оценка залогового имущества. Рыночная стоимость: {format(market_value, ',')} руб. Рекомендуется принять в качестве обеспечения.",
            "recommendations": "Рекомендуется принять в качестве обеспечения с регулярным мониторингом." if random.random() > 0.5 else None,
            "riskLevel": random.choice(RISK_LEVELS) if random.random() > 0.5 else None,
            "notes": f"Примечания к заключению {i}" if random.random() > 0.7 else None,
        }
        
        conclusions.append(conclusion)
    
    return conclusions

def main():
    """Основная функция"""
    print("Генерация полных демо-данных для залоговых заключений...")
    conclusions = generate_conclusions(50)
    
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(conclusions, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Данные залоговых заключений записаны: {OUTPUT_FILE} ({len(conclusions)} заключений)")

if __name__ == "__main__":
    main()

