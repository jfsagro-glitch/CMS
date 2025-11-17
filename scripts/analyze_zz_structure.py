"""
Анализ структуры файлов залоговых заключений
"""

import pandas as pd
from pathlib import Path
import json

ZZ_DIR = Path("ZZ")

def analyze_excel_file(file_path: Path):
    """Анализ структуры Excel файла"""
    try:
        xls = pd.ExcelFile(file_path)
        result = {
            "file": file_path.name,
            "sheets": []
        }
        
        for sheet_name in xls.sheet_names:
            try:
                df = pd.read_excel(xls, sheet_name=sheet_name, nrows=5)
                sheet_info = {
                    "name": sheet_name,
                    "columns": list(df.columns),
                    "sample_data": df.head(2).to_dict(orient="records") if len(df) > 0 else []
                }
                result["sheets"].append(sheet_info)
            except Exception as e:
                print(f"Ошибка чтения листа {sheet_name}: {e}")
        
        return result
    except Exception as e:
        print(f"Ошибка чтения файла {file_path}: {e}")
        return None

def main():
    """Основная функция"""
    if not ZZ_DIR.exists():
        print(f"Папка {ZZ_DIR} не найдена")
        return
    
    results = []
    
    # Анализируем все Excel файлы
    for excel_file in ZZ_DIR.glob("*.xlsx"):
        if excel_file.name.startswith("~$"):
            continue
        print(f"Анализ файла: {excel_file.name}")
        result = analyze_excel_file(excel_file)
        if result:
            results.append(result)
    
    # Сохраняем результаты
    output_file = Path("zz_structure_analysis.json")
    with output_file.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Результаты сохранены в {output_file}")
    
    # Выводим краткую информацию
    for result in results:
        print(f"\n=== {result['file']} ===")
        for sheet in result["sheets"]:
            print(f"  Лист: {sheet['name']}")
            print(f"    Колонок: {len(sheet['columns'])}")
            print(f"    Колонки: {', '.join(sheet['columns'][:10])}...")

if __name__ == "__main__":
    main()

