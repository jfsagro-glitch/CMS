import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd


PORTFOLIO_FILE = Path("public/portfolioData.json")
STRUCTURE_FILE = Path("ZALOG_DOS") / "структура для хранения документов Залоговое Досье.xlsx"
OUTPUT_FILE = Path("public/collateralDossier.json")

FOLDER_COLUMNS = [
    "Наименование папок",
    "Наименование папок.1",
    "Наименование папок.2",
    "Наименование папок.3",
    "Наименование папок.4",
]

DOC_TYPES = [
    "Заключение залоговой службы",
    "Отчет об оценке",
    "ЕГРН/нотариат/ГИБДД",
    "Мониторинг предмета залога",
    "Переоценка обеспечения",
    "Фотофиксация",
    "Страховой полис",
    "Договор залога",
]

STATUSES = [
    ("Загружен", "#52c41a"),
    ("На согласовании", "#fa8c16"),
    ("Требует обновления", "#fa541c"),
    ("Черновик", "#8c8c8c"),
]

RESPONSIBLES = [
    "Куратор ЗП-01",
    "Куратор ЗП-05",
    "Куратор ЮГ",
    "Куратор Сибирь",
    "Эксперт HQ",
    "Аналитик DUE",
]


def load_portfolio_records() -> List[Dict[str, Any]]:
    if not PORTFOLIO_FILE.exists():
        raise FileNotFoundError(f"Portfolio data file not found: {PORTFOLIO_FILE}")
    return json.loads(PORTFOLIO_FILE.read_text(encoding="utf-8"))


def load_folder_structure() -> List[Dict[str, Any]]:
    df = pd.read_excel(STRUCTURE_FILE)
    folders: List[Dict[str, Any]] = []
    for idx, row in df.iterrows():
        path = [
            str(row[col]).strip()
            for col in FOLDER_COLUMNS
            if pd.notna(row.get(col)) and str(row[col]).strip() not in {"", "nan"}
        ]
        if not path:
            continue
        description_value = row.get("Описание и характеристики размещаемых документов")
        description = str(description_value).strip() if pd.notna(description_value) else ""
        folders.append(
            {
                "id": f"folder-{idx + 1}",
                "path": path,
                "description": description,
            }
        )
    if not folders:
        raise ValueError("Folder structure is empty; please check the Excel file.")
    return folders


def random_date(start: datetime, end: datetime) -> str:
    delta = end - start
    return (start + timedelta(days=random.randint(0, delta.days))).strftime("%Y-%m-%d")


def generate_documents(portfolio: List[Dict[str, Any]], folders: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    documents: List[Dict[str, Any]] = []
    start_date = datetime(2021, 1, 1)
    end_date = datetime(2024, 12, 31)

    for index, record in enumerate(portfolio):
        reference = str(record.get("reference") or f"CARD-{index:04d}")
        borrower = record.get("borrower")
        pledger = record.get("pledger")
        inn = record.get("inn")
        folder_offset = index % len(folders)
        docs_per_deal = random.randint(3, 6)

        for doc_index in range(docs_per_deal):
            folder = folders[(folder_offset + doc_index) % len(folders)]
            doc_type = DOC_TYPES[(index + doc_index) % len(DOC_TYPES)]
            status, color = STATUSES[(index + doc_index) % len(STATUSES)]

            documents.append(
                {
                    "id": f"{reference}-DOC-{doc_index + 1}",
                    "reference": reference,
                    "borrower": borrower,
                    "pledger": pledger,
                    "inn": inn,
                    "docType": doc_type,
                    "folderId": folder["id"],
                    "folderPath": folder["path"],
                    "description": folder["description"],
                    "status": status,
                    "statusColor": color,
                    "fileName": f"{reference}_{doc_type.replace(' ', '_')}_{doc_index + 1}.pdf",
                    "lastUpdated": random_date(start_date, end_date),
                    "responsible": random.choice(RESPONSIBLES),
                    "size": f"{random.randint(2, 12)}.{random.randint(0,9)} МБ",
                }
            )
    return documents


def main() -> None:
    random.seed(84)
    portfolio_records = load_portfolio_records()
    folders = load_folder_structure()
    documents = generate_documents(portfolio_records, folders)

    payload = {
        "folders": folders,
        "documents": documents,
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(documents)} documents across {len(folders)} folders to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()

