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
            collateral_value = deal.get("collateralValue") or deal.get("marketValue")
            market_value = deal.get("currentMarketValue") or deal.get("marketValue")
        else:
            reference = f"REF-{random.randint(1000, 9999)}"
            contract_number = f"ДОГ-{random.randint(10000, 99999)}"
            pledger = f"ООО 'Компания {random.randint(1, 100)}'"
            pledger_inn = f"{random.randint(1000000000, 9999999999)}"
            borrower = f"ИП Иванов Иван Иванович"
            collateral_type = random.choice(COLLATERAL_TYPES)
            collateral_location = random.choice(["г. Москва", "г. Санкт-Петербург", "г. Новосибирск", "г. Екатеринбург"])
            collateral_value = random.randint(1000000, 50000000)
            market_value = int(collateral_value * random.uniform(0.8, 1.2))
        
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
        
        conclusion: Dict[str, Any] = {
            "id": f"conclusion-{i}",
            "conclusionNumber": generate_conclusion_number(i),
            "conclusionDate": conclusion_date,
            "reference": reference if reference else None,
            "contractNumber": contract_number,
            "pledger": pledger,
            "pledgerInn": pledger_inn,
            "borrower": borrower,
            "collateralType": collateral_type,
            "collateralLocation": collateral_location,
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
            "collateralValue": collateral_value,
            "marketValue": market_value,
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

