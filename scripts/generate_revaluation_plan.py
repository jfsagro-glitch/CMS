import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


PORTFOLIO_FILE = Path("public/portfolioData.json")
OUTPUT_FILE = Path("public/revaluationPlan.json")

BASE_RULES: List[Tuple[str, str, int]] = [
  ("недвиж", "Недвижимость", 12),
  ("транспорт", "Транспорт", 6),
  ("оборуд", "Оборудование", 6),
  ("ценн", "Ценные бумаги", 12),
  ("дол", "Доли", 12),
  ("имуществен", "Имущественные права", 6),
  ("товар", "Товары и сырье", 3),
  ("сырь", "Товары и сырье", 3),
]

REVALUATION_METHODS = {
  "Недвижимость": [
    "Независимая оценка",
    "Кадастровая стоимость",
    "Рыночная оценка",
    "Сравнительный подход",
  ],
  "Транспорт": [
    "Независимая оценка",
    "Рыночная стоимость",
    "Справочная стоимость",
    "Оценка по аналогам",
  ],
  "Оборудование": [
    "Независимая оценка",
    "Остаточная стоимость",
    "Рыночная стоимость",
    "Оценка по аналогам",
  ],
  "Товары и сырье": [
    "Рыночная стоимость",
    "Справочная стоимость",
    "Оценка по аналогам",
  ],
  "Ценные бумаги": [
    "Рыночная котировка",
    "Оценка по аналогам",
  ],
  "Доли": [
    "Независимая оценка",
    "Оценка по аналогам",
  ],
  "Имущественные права": [
    "Независимая оценка",
    "Оценка по аналогам",
  ],
  "Прочее": [
    "Независимая оценка",
    "Рыночная стоимость",
  ],
}

TIMEFRAMES = [
  ("overdue", -10_000, -1),
  ("week", 0, 7),
  ("month", 0, 30),
  ("quarter", 0, 90),
]


def load_portfolio() -> List[Dict[str, Any]]:
  if not PORTFOLIO_FILE.exists():
    raise FileNotFoundError(f"Portfolio data not found: {PORTFOLIO_FILE}")
  return json.loads(PORTFOLIO_FILE.read_text(encoding="utf-8"))


def parse_date(value: Any) -> Optional[datetime]:
  if not value or not isinstance(value, (str, int, float)):
    return None
  if isinstance(value, (int, float)):
    try:
      return datetime.fromtimestamp(value)
    except Exception:
      return None
  normalized = value.strip()
  for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y"):
    try:
      return datetime.strptime(normalized, fmt)
    except ValueError:
      continue
  return None


def add_months(date_value: datetime, months: int) -> datetime:
  month = date_value.month - 1 + months
  year = date_value.year + month // 12
  month = month % 12 + 1
  day = min(date_value.day, [31, 29 if year % 4 == 0 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
  return datetime(year, month, day)


def detect_base_type(record: Dict[str, Any]) -> Tuple[str, int]:
  raw = " ".join(
    str(value).lower()
    for value in [
      record.get("collateralType"),
      record.get("type"),
      record.get("collateralCategory"),
      record.get("collateralInfo"),
    ]
    if value
  )
  for key, result, months in BASE_RULES:
    if key in raw:
      return result, months
  return "Прочее", 6


def choose_revaluation_method(base_type: str, index: int) -> str:
  options = REVALUATION_METHODS.get(base_type) or REVALUATION_METHODS["Прочее"]
  return options[index % len(options)]


def determine_timeframe(planned_date: datetime, today: datetime) -> str:
  delta = (planned_date - today).days
  if delta < 0:
    return "overdue"
  if delta <= 7:
    return "week"
  if delta <= 30:
    return "month"
  if delta <= 90:
    return "quarter"
  return "later"


def parse_number(value: Any) -> Optional[float]:
  if value is None:
    return None
  if isinstance(value, (int, float)):
    return float(value)
  if isinstance(value, str):
    normalized = value.replace(" ", "").replace(",", ".")
    if normalized.replace(".", "", 1).isdigit():
      try:
        return float(normalized)
      except ValueError:
        return None
  return None


def generate_plan(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
  today = datetime.today()
  random.seed(130)
  plan_rows: List[Dict[str, Any]] = []
  fallback_last_start = datetime(2023, 1, 1)
  fallback_last_end = datetime(2024, 9, 1)

  for index, record in enumerate(records):
    base_type, base_frequency = detect_base_type(record)
    frequency_months = base_frequency

    last_date = parse_date(record.get("lastRevaluationDate"))
    if not last_date:
      days_offset = random.randint(0, (fallback_last_end - fallback_last_start).days)
      last_date = fallback_last_start + timedelta(days=days_offset)

    next_date = parse_date(record.get("nextRevaluationDate"))
    if not next_date:
      next_date = add_months(last_date, frequency_months)

    method = choose_revaluation_method(base_type, index)
    timeframe = determine_timeframe(next_date, today)

    collateral_value = parse_number(record.get("collateralValue"))
    market_value = None
    if collateral_value:
      # Market value is typically 80-120% of collateral value
      market_value = collateral_value * random.uniform(0.8, 1.2)

    plan_rows.append(
      {
        "reference": record.get("reference"),
        "borrower": record.get("borrower"),
        "pledger": record.get("pledger"),
        "segment": record.get("segment"),
        "group": record.get("group"),
        "collateralType": record.get("collateralType") or base_type,
        "baseType": base_type,
        "frequencyMonths": frequency_months,
        "lastRevaluationDate": last_date.strftime("%Y-%m-%d"),
        "plannedDate": next_date.strftime("%Y-%m-%d"),
        "timeframe": timeframe,
        "owner": record.get("owner") or "ЗП - не назначен",
        "priority": record.get("priority"),
        "collateralValue": collateral_value,
        "marketValue": market_value,
        "revaluationMethod": method,
      }
    )

  return plan_rows


def main() -> None:
  records = load_portfolio()
  plan = generate_plan(records)
  OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
  OUTPUT_FILE.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
  print(f"Saved revaluation plan for {len(plan)} обеспечений to {OUTPUT_FILE}")


if __name__ == "__main__":
  main()

