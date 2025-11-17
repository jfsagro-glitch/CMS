"""
Детальный анализ структуры залоговых заключений
"""

import pandas as pd
from pathlib import Path
import json

ZZ_DIR = Path("ZZ")

def read_main_sheet(file_path: Path):
    """Чтение основного листа 'Залоговое заключение'"""
    try:
        xls = pd.ExcelFile(file_path)
        if "Залоговое заключение" not in xls.sheet_names:
            return None
        
        # Читаем весь лист
        df = pd.read_excel(xls, sheet_name="Залоговое заключение", header=None)
        
        # Ищем структурированные данные (пары ключ-значение)
        data = {}
        for idx, row in df.iterrows():
            row_values = [str(v).strip() if pd.notna(v) else "" for v in row.values]
            # Ищем строки с парами ключ-значение
            for i in range(len(row_values) - 1):
                key = row_values[i]
                value = row_values[i + 1] if i + 1 < len(row_values) else ""
                if key and key not in ["nan", ""] and len(key) > 2:
                    if key not in data or not data[key]:
                        data[key] = value
        
        return {
            "file": file_path.name,
            "fields": {k: v for k, v in data.items() if v and v != "nan"},
            "raw_rows": df.head(50).to_dict(orient="records")
        }
    except Exception as e:
        print(f"Ошибка чтения {file_path}: {e}")
        return None

def read_description_sheet(file_path: Path):
    """Чтение листа 'Описание'"""
    try:
        xls = pd.ExcelFile(file_path)
        if "Описание" not in xls.sheet_names:
            return None
        
        df = pd.read_excel(xls, sheet_name="Описание", header=None)
        
        # Ищем заголовки
        headers = []
        for idx, row in df.iterrows():
            row_values = [str(v).strip() if pd.notna(v) else "" for v in row.values]
            if any(v and len(v) > 3 for v in row_values):
                headers = [v for v in row_values if v and v != "nan"]
                break
        
        return {
            "headers": headers[:20],  # Первые 20 заголовков
            "sample_rows": df.head(5).to_dict(orient="records")
        }
    except Exception as e:
        return None

def main():
    """Основная функция"""
    results = []
    
    for excel_file in ZZ_DIR.glob("*.xlsx"):
        if excel_file.name.startswith("~$"):
            continue
        
        print(f"Анализ: {excel_file.name}")
        main_data = read_main_sheet(excel_file)
        desc_data = read_description_sheet(excel_file)
        
        if main_data:
            if desc_data:
                main_data["description_headers"] = desc_data["headers"]
            results.append(main_data)
    
    # Сохраняем
    output = Path("zz_detailed_structure.json")
    with output.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"\n✅ Детальная структура сохранена в {output}")
    
    # Выводим все уникальные поля
    all_fields = set()
    for result in results:
        if result and "fields" in result:
            all_fields.update(result["fields"].keys())
    
    print(f"\nУникальные поля ({len(all_fields)}):")
    for field in sorted(all_fields)[:50]:
        print(f"  - {field}")

if __name__ == "__main__":
    main()

