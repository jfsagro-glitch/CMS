"""
Генерация демо-данных для раздела "Залоговые заключения"
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

OUTPUT_FILE = Path("public/collateralConclusionsData.json")

# Типы заключений
CONCLUSION_TYPES = ["Первичное", "Повторное", "Дополнительное", "Переоценка"]

# Статусы
STATUSES = ["Черновик", "На согласовании", "Согласовано", "Отклонено", "Аннулировано"]

# Уровни риска
RISK_LEVELS = ["Низкий", "Средний", "Высокий", "Критический"]

# Типы залога
COLLATERAL_TYPES = [
    "Недвижимость",
    "Транспортные средства",
    "Оборудование",
    "Товары в обороте",
    "Ценные бумаги",
    "Права требования",
]

# Кредитные продукты
CREDIT_PRODUCTS = [
    "Кредит",
    "Кредитная линия",
    "Овердрафт",
    "Гарантия",
    "Аккредитив",
]

# Категории обеспечения
CATEGORIES = ["Основной", "Формальный"]

# Ликвидность
LIQUIDITY_OPTIONS = [
    "высокая (срок реализации до 90 дней)",
    "удовлетворительная (срок реализации до 365 дней)",
    "низкая (срок реализации свыше 365 дней)",
    "малоудовлетворительная",
]

# Состояние имущества
CONDITIONS = ["хорошее", "удовлетворительное", "неудовлетворительное"]

# Категории земель
LAND_CATEGORIES = [
    "земли населенных пунктов",
    "земли сельскохозяйственного назначения",
    "земли промышленности",
    "земли особо охраняемых территорий",
]

# Разрешенные виды использования
PERMITTED_USES = [
    "размещение объектов капитального строительства",
    "размещение объектов торговли",
    "размещение объектов общественного питания",
    "размещение объектов бытового обслуживания",
]

# Примеры текстов заключений
CONCLUSION_TEXTS = [
    "Проведена оценка залогового имущества. Рыночная стоимость соответствует заявленной. Рекомендуется принять в качестве обеспечения.",
    "Залоговое имущество оценено. Выявлены незначительные риски. Требуется дополнительный мониторинг.",
    "Оценка залогового имущества завершена. Рыночная стоимость подтверждена. Рекомендуется согласование.",
    "Проведена переоценка залогового имущества. Стоимость актуализирована. Рекомендуется обновление условий.",
    "Оценка залогового имущества выявила риски. Требуется дополнительная экспертиза.",
]

RECOMMENDATIONS = [
    "Рекомендуется принять в качестве обеспечения с регулярным мониторингом.",
    "Требуется дополнительная документация для полной оценки рисков.",
    "Рекомендуется пересмотр условий залога в связи с изменением рыночной стоимости.",
    "Залоговое имущество соответствует требованиям. Рекомендуется согласование.",
    "Требуется проведение дополнительной экспертизы для оценки рисков.",
]

AUTHORS = [
    "Иванов И.И.",
    "Петрова А.В.",
    "Сидоров С.С.",
    "Козлова М.А.",
    "Новиков Д.П.",
    "Смирнова Е.В.",
]

APPROVERS = [
    "Руководитель отдела",
    "Главный оценщик",
    "Начальник управления",
    "Заместитель директора",
]


def random_date(start_date: datetime, end_date: datetime) -> str:
    """Генерация случайной даты"""
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    random_date_obj = start_date + timedelta(days=random_days)
    return random_date_obj.strftime("%Y-%m-%d")


def generate_conclusion_number(index: int) -> str:
    """Генерация номера заключения"""
    year = datetime.now().year
    return f"ЗК-{year}-{str(index).zfill(6)}"


def load_portfolio_data() -> List[Dict[str, Any]]:
    """Загрузка данных портфеля для связи"""
    portfolio_file = Path("public/portfolioData.json")
    if portfolio_file.exists():
        try:
            with portfolio_file.open("r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Ошибка загрузки портфеля: {e}")
    return []


def generate_conclusions(count: int = 50) -> List[Dict[str, Any]]:
    """Генерация списка заключений"""
    portfolio = load_portfolio_data()
    conclusions: List[Dict[str, Any]] = []
    
    start_date = datetime.now() - timedelta(days=365)
    end_date = datetime.now()
    
    for i in range(1, count + 1):
        # Выбираем случайную сделку из портфеля или создаем демо-данные
        if portfolio and random.random() > 0.3:  # 70% связаны с реальными сделками
            deal = random.choice(portfolio)
            reference = str(deal.get("reference") or deal.get("contractNumber") or "")
            contract_number = deal.get("contractNumber")
            pledger = deal.get("pledger")
            pledger_inn = deal.get("inn")
            borrower = deal.get("borrower")
            collateral_type = deal.get("collateralType")
            collateral_location = deal.get("collateralLocation")
            collateral_value_raw = deal.get("collateralValue") or deal.get("marketValue")
            market_value_raw = deal.get("currentMarketValue") or deal.get("marketValue")
            # Преобразуем в числа
            try:
                collateral_value = float(collateral_value_raw) if collateral_value_raw else None
                market_value = float(market_value_raw) if market_value_raw else None
            except (ValueError, TypeError):
                collateral_value = None
                market_value = None
        else:
            reference = f"REF-{random.randint(1000, 9999)}"
            contract_number = f"ДОГ-{random.randint(10000, 99999)}"
            pledger = f"ООО 'Компания {random.randint(1, 100)}'"
            pledger_inn = f"{random.randint(1000000000, 9999999999)}"
            borrower = f"ИП Иванов Иван Иванович"
            collateral_type = random.choice(COLLATERAL_TYPES)
            collateral_location = random.choice(["г. Москва", "г. Санкт-Петербург", "г. Новосибирск", "г. Екатеринбург"])
            collateral_value = float(random.randint(1000000, 50000000))
            market_value = float(int(collateral_value * random.uniform(0.8, 1.2)))
        
        conclusion_date = random_date(start_date, end_date)
        author_date = random_date(
            datetime.strptime(conclusion_date, "%Y-%m-%d") - timedelta(days=7),
            datetime.strptime(conclusion_date, "%Y-%m-%d")
        )
        
        status = random.choice(STATUSES)
        approver = None
        approval_date = None
        if status in ["Согласовано", "Отклонено"]:
            approver = random.choice(APPROVERS)
            approval_date = random_date(
                datetime.strptime(conclusion_date, "%Y-%m-%d"),
                datetime.strptime(conclusion_date, "%Y-%m-%d") + timedelta(days=5)
            )
        
        # Определяем тип имущества для дополнительных полей
        is_real_estate = "недвижимость" in str(collateral_type).lower() if collateral_type else False
        
        # Генерируем дополнительные поля
        credit_product = random.choice(CREDIT_PRODUCTS) if random.random() > 0.3 else None
        credit_amount = collateral_value if credit_product else None
        credit_term = random.randint(12, 60) if credit_product else None
        
        # Площадь и количество объектов
        total_area_sqm = random.randint(50, 500) if is_real_estate else None
        total_area_hectares = round(random.uniform(0.1, 5.0), 2) if is_real_estate and random.random() > 0.7 else None
        objects_count = random.randint(1, 10) if random.random() > 0.5 else None
        ownership_share = random.choice([25, 50, 75, 100]) if random.random() > 0.6 else None
        
        # Земельный участок (для недвижимости)
        land_cadastral = None
        land_category = None
        land_permitted_use = None
        land_area_sqm = None
        if is_real_estate and random.random() > 0.4:
            land_cadastral = f"77:08:{random.randint(1000000, 9999999)}:{random.randint(1, 9999)}"
            land_category = random.choice(LAND_CATEGORIES)
            land_permitted_use = random.choice(PERMITTED_USES)
            land_area_sqm = int(total_area_sqm * random.uniform(1.5, 3.0)) if total_area_sqm else None
        
        # Состояние и описание
        collateral_condition = random.choice(CONDITIONS) if random.random() > 0.3 else None
        has_replanning = random.choice([True, False]) if random.random() > 0.5 else None
        replanning_description = (
            "Выявлены несущественные перепланировки" if has_replanning and random.random() > 0.5
            else "Перепланировки не выявлены" if not has_replanning
            else None
        )
        land_functional_provision = random.choice([
            "функционально обеспечивает",
            "не обеспечивает"
        ]) if is_real_estate and random.random() > 0.6 else None
        
        collateral_description = (
            f"Предлагаемое в залог имущество расположено в {collateral_location}, "
            f"состояние имущества {collateral_condition if collateral_condition else 'хорошее'}, "
            f"перепланировки {'выявлены' if has_replanning else 'не выявлены'}."
        ) if random.random() > 0.2 else None
        
        # Обременения
        has_encumbrances = random.choice([True, False]) if random.random() > 0.6 else None
        encumbrances_description = (
            "Имеются зарегистрированные обременения. Требуется снятие обременений."
        ) if has_encumbrances else None
        encumbrances_details = (
            "Обременения не выявлены, имеются ограничения прав на часть земельного участка."
        ) if has_encumbrances and random.random() > 0.5 else None
        
        # Права на объект
        ownership_basis = random.choice([
            "Право собственности",
            "Право аренды",
            "Право пользования земельным участком"
        ]) if random.random() > 0.4 else None
        ownership_documents = (
            f"Договор купли-продажи от {random_date(datetime.strptime(conclusion_date, "%Y-%m-%d") - timedelta(days=365), datetime.strptime(conclusion_date, "%Y-%m-%d"))}"
        ) if ownership_basis and random.random() > 0.5 else None
        registration_record = (
            f"Запись № {random.randint(100000, 999999)}-{random.randint(1, 99)}/{random.randint(2000, 2024)}-{random.randint(1, 10)} от {random_date(datetime.strptime(conclusion_date, "%Y-%m-%d") - timedelta(days=180), datetime.strptime(conclusion_date, "%Y-%m-%d"))}"
        ) if random.random() > 0.5 else None
        registration_document = (
            f"Выписка из Единого государственного реестра недвижимости об объекте недвижимости № {random.randint(99, 999)}/{random.randint(2020, 2024)}/{random.randint(100000000, 999999999)}"
        ) if random.random() > 0.6 else None
        
        # Проверка на банкротство
        bankruptcy_check_date = random_date(
            datetime.strptime(conclusion_date, "%Y-%m-%d") - timedelta(days=30),
            datetime.strptime(conclusion_date, "%Y-%m-%d")
        ) if random.random() > 0.5 else None
        bankruptcy_check_result = (
            "Признаков банкротства не выявлено"
        ) if bankruptcy_check_date and random.random() > 0.3 else None
        
        # Проверка
        inspection_date = random_date(
            datetime.strptime(conclusion_date, "%Y-%m-%d") - timedelta(days=14),
            datetime.strptime(conclusion_date, "%Y-%m-%d") - timedelta(days=1)
        ) if random.random() > 0.3 else None
        inspector_name = random.choice(AUTHORS) if inspection_date else None
        
        # Особое мнение
        special_opinion = (
            f"Возможно рассмотреть в качестве залога при условии {'внесения в ЕГРН сведений о кадастровых номерах' if land_cadastral else 'подтверждения права собственности'}. "
            f"Уровень ликвидности объекта: {random.choice(LIQUIDITY_OPTIONS)}. "
            f"{'Требуется снятие обременений.' if has_encumbrances else ''}"
        ) if random.random() > 0.3 else None
        
        # Отлагательные условия
        suspensive_conditions = []
        if random.random() > 0.5:
            for j in range(1, random.randint(2, 5)):
                suspensive_conditions.append({
                    "id": f"cond-{i}-{j}",
                    "number": j,
                    "description": f"Условие {j}",
                    "suspensiveCondition": random.choice([
                        "согласования ДЗ/ДИ",
                        "предоставления КП",
                        "подтверждения права собственности",
                    ]) if random.random() > 0.5 else None,
                    "additionalCondition": f"Дополнительное условие {j}" if random.random() > 0.5 else None,
                })
        
        # Детальное описание (для некоторых типов)
        detailed_descriptions = []
        if objects_count and objects_count > 1 and random.random() > 0.6:
            for j in range(1, min(objects_count + 1, 6)):
                obj_area = random.randint(20, 200) if is_real_estate else None
                obj_cadastral = f"{random.randint(77, 99)}:{random.randint(1, 99)}:{random.randint(1000000, 9999999)}:{random.randint(1, 9999)}" if is_real_estate and random.random() > 0.5 else None
                obj_market_value = int((float(market_value) if market_value else 0) / objects_count) if market_value and objects_count else None
                obj_collateral_value = int((float(collateral_value) if collateral_value else 0) / objects_count) if collateral_value and objects_count else None
                
                detailed_descriptions.append({
                    "id": f"desc-{i}-{j}",
                    "objectNumber": j,
                    "objectName": f"{collateral_type} - объект {j}",
                    "objectType": collateral_type,
                    "cadastralNumber": obj_cadastral,
                    "address": f"{collateral_location}, объект {j}",
                    "areaSqm": obj_area,
                    "areaHectares": round((obj_area or 0) / 100, 2) if obj_area and random.random() > 0.7 else None,
                    "floor": f"{random.randint(1, 10)} этаж" if is_real_estate and random.random() > 0.5 else None,
                    "floorsCount": random.randint(1, 10) if is_real_estate and random.random() > 0.5 else None,
                    "undergroundFloors": random.randint(0, 2) if is_real_estate and random.random() > 0.7 else None,
                    "purpose": collateral_type,
                    "condition": collateral_condition or "хорошее",
                    "material": random.choice(["Кирпич", "Бетон", "Металл"]) if is_real_estate and random.random() > 0.5 else None,
                    "yearBuilt": random.randint(1990, 2020) if random.random() > 0.5 else None,
                    "yearCommissioned": random.randint(1990, 2020) if random.random() > 0.5 else None,
                    "marketValue": obj_market_value,
                    "collateralValue": obj_collateral_value,
                    "ownershipShare": ownership_share,
                    "ownershipBasis": ownership_basis,
                    "registrationRecord": registration_record if random.random() > 0.5 else None,
                    "encumbrances": "Не выявлены" if not has_encumbrances else "Имеются обременения",
                    "replanning": replanning_description,
                    "description": f"Детальное описание объекта {j}: {collateral_description or 'Описание отсутствует'}",
                })
        
        # Фото (демо)
        photos = []
        if random.random() > 0.5:
            photo_count = random.randint(2, 5)
            for j in range(1, photo_count + 1):
                photos.append({
                    "id": f"photo-{i}-{j}",
                    "url": f"https://via.placeholder.com/400x300?text=Photo+{j}",
                    "description": f"Фото {j} - {'фасадное' if j <= 2 else 'внутреннее'}",
                    "isMain": j <= 2,
                })
        
        # Рецензия (для некоторых)
        review = None
        if random.random() > 0.7:
            review = {
                "id": f"review-{i}",
                "reviewer": random.choice(AUTHORS),
                "reviewDate": random_date(
                    datetime.strptime(conclusion_date, "%Y-%m-%d"),
                    datetime.strptime(conclusion_date, "%Y-%m-%d") + timedelta(days=10)
                ),
                "reviewText": "Рецензия проведена. Заключение соответствует требованиям.",
                "conclusion": "Одобрено",
            }
        
        # Расчеты (для некоторых типов)
        calculations = []
        if random.random() > 0.6:
            calc_types = ["Расчет ком.пом.", "Расчет АЗС", "Расчет движимое (ЗП)"]
            for calc_type in random.sample(calc_types, random.randint(1, 2)):
                calculations.append({
                    "id": f"calc-{i}-{calc_type}",
                    "type": calc_type,
                    "data": {
                        "Исходные данные": "Демо данные",
                        "Результат": market_value or collateral_value,
                        "Метод": "Сравнительный",
                    },
                })
        
        # Формируем additionalData с характеристиками для нежилой недвижимости
        additional_data: Dict[str, Any] = {}
        if is_real_estate and collateral_type and "нежилая" in str(collateral_type).lower():
            # Сохраняем характеристики в additionalData для нежилой недвижимости
            additional_data = {
                "totalAreaSqm": total_area_sqm,
                "collateralLocation": collateral_location,
                "landCategory": land_category,
                "landPermittedUse": land_permitted_use,
                "landCadastralNumber": land_cadastral,
                "hasEncumbrances": has_encumbrances,
                "ownershipShare": f"{ownership_share}/100" if ownership_share else None,
                "marketValue": market_value,
                "collateralValue": collateral_value,
                "fairValue": int((float(market_value) if market_value else 0) * random.uniform(0.9, 1.0)) if market_value else None,
                "category": random.choice(CATEGORIES) if random.random() > 0.3 else None,
                "collateralCondition": collateral_condition,
                "wallMaterial": random.choice(["Деревянные", "Кирпич", "Кирпичный/Сталинский", "Монолит/Монолит-кирпич", "Панельный/блочный"]) if random.random() > 0.5 else None,
                "ceilingMaterial": random.choice(["Деревянные балки", "Металлические балки", "ж/б"]) if random.random() > 0.5 else None,
                "finishLevel": random.choice(["Евроремонт", "Простая", "Среднее", "Улучшенная"]) if random.random() > 0.5 else None,
                "finishCondition": random.choice(["Хорошее", "Удовлетворительное", "Требуется косметический ремонт"]) if random.random() > 0.5 else None,
                "replanning": random.choice(["Несущественные", "Перепланировки отсутствуют", "Существенные"]) if random.random() > 0.5 else None,
                "ownershipRight": random.choice(["Право собственности", "Право аренды", "Иное"]) if random.random() > 0.5 else None,
            }
            # Удаляем None значения
            additional_data = {k: v for k, v in additional_data.items() if v is not None}
        
        conclusion: Dict[str, Any] = {
            "id": f"conclusion-{i}",
            "conclusionNumber": generate_conclusion_number(i),
            "conclusionDate": conclusion_date,
            "reference": reference if reference else None,
            "contractNumber": contract_number,
            "pledger": pledger,
            "pledgerInn": pledger_inn,
            "borrower": borrower,
            "borrowerInn": f"{random.randint(1000000000, 9999999999)}" if random.random() > 0.5 else None,
            "creditProduct": credit_product,
            "creditAmount": credit_amount,
            "creditTermMonths": credit_term,
            "collateralType": collateral_type,
            "collateralName": f"{collateral_type} - объект {i}" if random.random() > 0.5 else None,
            "collateralPurpose": f"Использование в качестве {collateral_type.lower()}" if random.random() > 0.5 else None,
            "totalAreaSqm": total_area_sqm,
            "totalAreaHectares": total_area_hectares,
            "collateralLocation": collateral_location,
            "objectsCount": objects_count,
            "ownershipShare": ownership_share,
            "landCategory": land_category,
            "landPermittedUse": land_permitted_use,
            "landCadastralNumber": land_cadastral,
            "landAreaSqm": land_area_sqm,
            "marketValue": market_value,
            "collateralValue": collateral_value,
            "fairValue": int((float(market_value) if market_value else 0) * random.uniform(0.9, 1.0)) if market_value else None,
            "category": random.choice(CATEGORIES) if random.random() > 0.3 else None,
            "liquidity": random.choice(LIQUIDITY_OPTIONS) if random.random() > 0.3 else None,
            "liquidityFairValue": random.choice(LIQUIDITY_OPTIONS) if random.random() > 0.5 else None,
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
            "creditContractNumber": f"КРД-{random.randint(10000, 99999)}" if credit_product and random.random() > 0.5 else None,
            "cadastralValue": int((market_value or 0) * random.uniform(0.7, 0.9)) if market_value and random.random() > 0.5 else None,
            "marketValuePerSqm": int((market_value or 0) / (total_area_sqm or 1)) if market_value and total_area_sqm and random.random() > 0.5 else None,
            "marketValuePerHectare": int((market_value or 0) / (total_area_hectares or 0.01)) if market_value and total_area_hectares and random.random() > 0.5 else None,
            "liquidityMovable": random.choice(LIQUIDITY_OPTIONS) if collateral_type and "транспорт" in str(collateral_type).lower() and random.random() > 0.5 else None,
            "suspensiveConditions": suspensive_conditions if suspensive_conditions else None,
            "detailedDescriptions": detailed_descriptions if detailed_descriptions else None,
            "photos": photos if photos else None,
            "review": review,
            "calculations": calculations if calculations else None,
            "additionalData": additional_data if additional_data else None,
            "conclusionType": random.choice(CONCLUSION_TYPES),
            "status": status,
            "statusColor": (
                "green" if status == "Согласовано"
                else "blue" if status == "На согласовании"
                else "red" if status in ["Отклонено", "Аннулировано"]
                else None
            ),
            "author": random.choice(AUTHORS),
            "authorDate": author_date,
            "approver": approver,
            "approvalDate": approval_date,
            "conclusionText": random.choice(CONCLUSION_TEXTS),
            "recommendations": random.choice(RECOMMENDATIONS) if random.random() > 0.3 else None,
            "riskLevel": random.choice(RISK_LEVELS) if random.random() > 0.2 else None,
            "notes": f"Примечание к заключению {i}" if random.random() > 0.5 else None,
        }
        
        conclusions.append(conclusion)
    
    return conclusions


def main():
    """Основная функция"""
    print("Генерация демо-данных для залоговых заключений...")
    
    conclusions = generate_conclusions(50)
    
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(conclusions, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Данные залоговых заключений записаны: {OUTPUT_FILE} ({len(conclusions)} заключений)")


if __name__ == "__main__":
    main()

