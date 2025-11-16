import json
import math
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

INS_SOURCE = Path("INS") / "Страховой портфель.xlsx"
PORTFOLIO_JSON = Path("public/portfolioData.json")
OUTPUT_FILE = Path("public/insuranceData.json")


def normalize_date(value: Any) -> Optional[str]:
    if pd.isna(value):
        return None
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.strftime("%Y-%m-%d")
    return str(value)


def normalize_number(value: Any) -> Optional[float]:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    try:
        if isinstance(value, str):
            v = value.replace(" ", "").replace(",", ".")
            return float(v)
        return float(value)
    except Exception:
        return None


def load_portfolio() -> List[Dict[str, Any]]:
    with PORTFOLIO_JSON.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_ins_source() -> Optional[pd.DataFrame]:
    if INS_SOURCE.exists():
        try:
            return pd.read_excel(INS_SOURCE)
        except Exception:
            return None
    return None


def random_date(start: datetime, end: datetime) -> str:
    delta = end - start
    return (start + timedelta(days=random.randint(0, delta.days))).strftime("%Y-%m-%d")


def build_from_ins(df: pd.DataFrame, portfolio: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Try to map common columns if present; otherwise fallback to generated
    columns = [str(c).strip().lower() for c in df.columns.tolist()]
    records: List[Dict[str, Any]] = []
    portfolio_by_contract = {str(p.get("contractNumber")): p for p in portfolio if p.get("contractNumber")}
    portfolio_refs = {str(p.get("reference")): p for p in portfolio if p.get("reference")}

    for row in df.to_dict("records"):
        lower = {str(k).strip().lower(): v for k, v in row.items()}
        contract = lower.get("№ договора".lower()) or lower.get("номер договора") or lower.get("contractnumber")
        reference = lower.get("reference") or lower.get("референс") or lower.get("сделка")
        p = None
        if contract:
            p = portfolio_by_contract.get(str(contract))
        if p is None and reference:
            p = portfolio_refs.get(str(reference))

        insured = (p or {}).get("borrower") or (p or {}).get("pledger")
        contract_number = (p or {}).get("contractNumber")
        deal_reference = (p or {}).get("reference")

        policy_number = lower.get("номер полиса") or lower.get("policy") or f"POL-{random.randint(100000,999999)}"
        insurance_type = lower.get("вид страхования") or lower.get("type") or random.choice(
            ["КАСКО", "ОСАГО", "Имущество", "Ответственность"]
        )
        insured_amount = normalize_number(lower.get("страховая сумма") or lower.get("insured amount")) or random.randrange(
            5_000_000, 150_000_000, 500_000
        )
        premium = normalize_number(lower.get("премия") or lower.get("страховая премия") or lower.get("premium")) or random.randrange(
            50_000, 2_000_000, 10_000
        )
        start_date = normalize_date(lower.get("начало") or lower.get("start") or random_date(datetime(2023,1,1), datetime(2024,12,31)))
        end_date = normalize_date(lower.get("окончание") or lower.get("end") or random_date(datetime(2024,1,1), datetime(2026,12,31)))
        insurer = lower.get("страховщик") or lower.get("insurer") or random.choice(
            ["Ингосстрах", "Ренессанс", "РЕСО", "СОГАЗ", "ВСК"]
        )
        status = lower.get("статус") or lower.get("status") or random.choice(["Активен", "Истек", "Требует продления"])

        records.append(
            {
                "policyNumber": str(policy_number),
                "insuranceType": str(insurance_type),
                "insuredAmount": insured_amount,
                "premium": premium,
                "startDate": start_date,
                "endDate": end_date,
                "insurer": str(insurer),
                "status": str(status),
                "insured": insured,
                "contractNumber": contract_number,
                "reference": deal_reference,
            }
        )
    return records


def build_demo_from_portfolio(portfolio: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    for idx, p in enumerate(portfolio, start=1):
        # one policy per deal demo
        start = datetime(2023, 1, 1)
        end = datetime(2026, 12, 31)
        start_date = random_date(start, datetime(2025, 12, 31))
        end_date = random_date(datetime(2025, 1, 1), end)
        records.append(
            {
                "policyNumber": f"POL-{100000+idx}",
                "insuranceType": random.choice(["КАСКО", "ОСАГО", "Имущество", "Ответственность"]),
                "insuredAmount": random.randrange(5_000_000, 150_000_000, 500_000),
                "premium": random.randrange(50_000, 2_000_000, 10_000),
                "startDate": start_date,
                "endDate": end_date,
                "insurer": random.choice(["Ингосстрах", "Ренессанс", "РЕСО", "СОГАЗ", "ВСК"]),
                "status": random.choice(["Активен", "Истек", "Требует продления"]),
                "insured": p.get("borrower") or p.get("pledger"),
                "contractNumber": p.get("contractNumber"),
                "reference": p.get("reference"),
            }
        )
    return records


def main():
    portfolio = load_portfolio()
    df = load_ins_source()
    if df is not None and len(df) > 0:
        data = build_from_ins(df, portfolio)
    else:
        data = build_demo_from_portfolio(portfolio)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Insurance dataset written: {OUTPUT_FILE} ({len(data)} records)")


if __name__ == "__main__":
    main()


