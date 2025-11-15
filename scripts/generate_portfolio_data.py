import argparse
import json
import math
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd


SOURCE_FILE = Path("ZALOG") / "залоговый портфель.xlsx"
OUTPUT_FILE = Path("public/portfolioData.json")

COLUMN_ALIASES = {
    "Сегмент": "segment",
    "Группа": "group",
    "REFERENCE": "reference",
    "Залогодатель": "pledger",
    "ИНН": "inn",
    "Заемщик": "borrower",
    "№ договора": "contractNumber",
    "Дата договора": "contractDate",
    "Тип": "type",
    "Дата открытия": "openDate",
    "Дата закрытия": "closeDate",
    "Задолженность, руб.": "debtRub",
    "Лимит, руб.": "limitRub",
    "Проср. ОД, руб.": "overduePrincipal",
    "Проср. %, руб.": "overdueInterest",
    "REFERENCE залога": "collateralReference",
    "Номер договора залога (ипотеки)": "collateralContractNumber",
    "Дата договора залога (ипотеки)": "collateralContractDate",
    "категория обеспечения": "collateralCategory",
    "Залоговая стоимость, руб.": "collateralValue",
    "Рыночная стоимость, руб.": "marketValue",
    "Дата первоначального определения стоимости": "initialValuationDate",
    "Актуальная рыночная стоимость, руб.": "currentMarketValue",
    "Дата определения текущей стоимости": "currentValuationDate",
    "Справедливая стоимость, руб.": "fairValue",
    "Тип обеспечения": "collateralType",
    "Назначение обеспечения": "collateralPurpose",
    "Информация о залоге": "collateralInfo",
    "Местоположение предмета залога": "collateralLocation",
    "Ликвидность": "liquidity",
    "Категория качества обеспечения": "qualityCategory",
    "Дата регистрации обеспечения": "registrationDate",
    "Очередность залога": "priority",
    "Вид мониторинга": "monitoringType",
    "Дата последнего мониторинга": "lastMonitoringDate",
    "Планируемая дата мониторинга": "nextMonitoringDate",
    "Ответственный сотрудник": "owner",
    "Счет 9131": "account9131",
}

FALLBACKS = {
    "collateralType": [
        "Коммерческая недвижимость",
        "Складская недвижимость",
        "Земельный участок",
        "Сельскохозяйственная техника",
        "Строительная техника",
        "Легковой транспорт",
        "Грузовой транспорт",
        "Инженерное оборудование",
        "Офисное оборудование",
        "Товарные запасы",
    ],
    "collateralLocation": ["Москва", "Санкт-Петербург", "Краснодар", "Новосибирск", "Нижний Новгород"],
    "liquidity": ["Высокая", "Средняя", "Низкая"],
    "qualityCategory": ["Категория I", "Категория II", "Категория III"],
    "monitoringType": ["Инспекция", "Фотоотчет", "Телеметрия"],
}

NAME_POOL = [
    "Агроинвест",
    "СтройИнфра",
    "ТехТранс",
    "СнабРесурс",
    "Престиж Капитал",
    "Регион Опт",
    "Вектор",
    "Городской Центр",
    "Ритм",
    "Альянс",
]


def normalize_value(value: Any) -> Optional[Any]:
    if pd.isna(value):
        return None
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, float):
        if math.isnan(value):
            return None
        if value.is_integer():
            return int(value)
    return value


def load_source_records() -> List[Dict[str, Any]]:
    df = pd.read_excel(SOURCE_FILE)
    records: List[Dict[str, Any]] = []
    for row in df.to_dict("records"):
        item: Dict[str, Any] = {}
        for original, alias in COLUMN_ALIASES.items():
            item[alias] = normalize_value(row.get(original))
        records.append(item)
    return records


def ensure_choices(records: List[Dict[str, Any]], key: str) -> List[Any]:
    values = [row[key] for row in records if row.get(key)]
    if not values:
        return FALLBACKS.get(key, [])
    return values


def random_date(start: datetime, end: datetime) -> str:
    delta = end - start
    return (start + timedelta(days=random.randint(0, delta.days))).strftime("%Y-%m-%d")


def random_money(low: int, high: int) -> int:
    return random.randrange(low, high, 500_000)


def ensure_pool(values: List[Any], fallback_key: str) -> List[Any]:
    pool = values or FALLBACKS.get(fallback_key, [])
    if not pool:
        raise ValueError(f"No values found for {fallback_key} even after applying fallbacks")
    return list(dict.fromkeys(pool))  # сохраняем порядок и удаляем дубликаты


def rotating_pick(pool: List[Any], index: int) -> Any:
    return pool[index % len(pool)]


def build_demo_rows(records: List[Dict[str, Any]], count: int = 100) -> List[Dict[str, Any]]:
    segments = ensure_choices(records, "segment") or ["СРБ"]
    groups = ensure_choices(records, "group") or ["СВХ"]
    collateral_types = ensure_pool(ensure_choices(records, "collateralType"), "collateralType")
    locations = ensure_pool(ensure_choices(records, "collateralLocation"), "collateralLocation")
    liquidity_values = ensure_pool(ensure_choices(records, "liquidity"), "liquidity")
    quality_values = ensure_pool(ensure_choices(records, "qualityCategory"), "qualityCategory")
    monitoring_types = ensure_pool(ensure_choices(records, "monitoringType"), "monitoringType")

    start_date = datetime(2020, 1, 1)
    end_date = datetime(2024, 12, 31)

    demo_rows: List[Dict[str, Any]] = []
    for idx in range(1, count + 1):
        collateral_type = rotating_pick(collateral_types, idx - 1)
        location = rotating_pick(locations, idx - 1)
        demo_rows.append(
            {
                "segment": random.choice(segments),
                "group": random.choice(groups),
                "reference": f"DEMO-{idx:04d}",
                "pledger": f"{random.choice(NAME_POOL)} {idx:02d}",
                "inn": f"77{random.randint(10**8, 10**9 - 1)}",
                "borrower": f"ООО «Демо {idx:03d}»",
                "contractNumber": f"DEM-{2020 + idx % 5}-{1000 + idx}",
                "contractDate": random_date(start_date, end_date),
                "type": random.choice(["Кредит", "Овердрафт", "Гарантия"]),
                "openDate": random_date(start_date, end_date),
                "closeDate": random_date(start_date, end_date),
                "debtRub": random_money(5_000_000, 150_000_000),
                "limitRub": random_money(20_000_000, 250_000_000),
                "overduePrincipal": random_money(0, 5_000_000),
                "overdueInterest": random_money(0, 2_500_000),
                "collateralReference": f"COLL-{idx:04d}",
                "collateralContractNumber": f"ZL-{2020 + idx % 5}-{idx:05d}",
                "collateralContractDate": random_date(start_date, end_date),
                "collateralCategory": random.choice(["МСБ", "Крупный бизнес", "Сегмент ВЭД"]),
                "collateralValue": random_money(15_000_000, 180_000_000),
                "marketValue": random_money(15_000_000, 200_000_000),
                "initialValuationDate": random_date(start_date, end_date),
                "currentMarketValue": random_money(15_000_000, 200_000_000),
                "currentValuationDate": random_date(start_date, end_date),
                "fairValue": random_money(10_000_000, 150_000_000),
                "collateralType": collateral_type,
                "collateralPurpose": random.choice(
                    ["Обеспечение оборотного капитала", "Развитие сети", "Инвестиции в проекты"]
                ),
                "collateralInfo": f"Демо описание предмета залога #{idx}",
                "collateralLocation": location,
                "liquidity": rotating_pick(liquidity_values, idx - 1),
                "qualityCategory": rotating_pick(quality_values, idx - 1),
                "registrationDate": random_date(start_date, end_date),
                "priority": random.choice(["1", "2", "3"]),
                "monitoringType": rotating_pick(monitoring_types, idx - 1),
                "lastMonitoringDate": random_date(start_date, end_date),
                "nextMonitoringDate": random_date(start_date, end_date),
                "owner": f"Куратор Демо {idx:03d}",
                "account9131": f"9131{random.randint(10**12, 10**13 - 1)}",
            }
        )
    return demo_rows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate collateral portfolio dataset with demo entries.")
    parser.add_argument(
        "--demo-count",
        type=int,
        default=100,
        help="Количество синтетических демо-сделок, добавляемых к реальным данным (по умолчанию 100).",
    )
    parser.add_argument(
        "--random-seed",
        type=int,
        default=42,
        help="Базовое значение seed для генерации демо-данных (по умолчанию 42).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.demo_count <= 0:
        raise ValueError("demo-count должен быть больше нуля")

    random.seed(args.random_seed)
    real_records = load_source_records()
    demo_records = build_demo_rows(real_records, args.demo_count)
    all_records = real_records + demo_records

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(all_records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(all_records)} rows to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()

