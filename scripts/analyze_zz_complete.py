"""
Полный анализ структуры файлов залоговых заключений из папки ZZ
"""

import pandas as pd
from pathlib import Path
import json

ZZ_DIR = Path("ZZ")

def extract_key_value_pairs(df):
    """Извлечение пар ключ-значение из DataFrame"""
    pairs = {}
    for idx, row in df.iterrows():
        row_values = [str(v).strip() if pd.notna(v) else "" for v in row.values]
        # Ищем пары ключ-значение в строках
        for i in range(len(row_values) - 1):
            key = row_values[i].strip()
            value = row_values[i + 1].strip() if i + 1 < len(row_values) else ""
            # Пропускаем пустые значения и служебные
            if key and key not in ["nan", "", "None"] and len(key) > 2:
                # Если значение не пустое и не служебное
                if value and value not in ["nan", "", "None"]:
                    if key not in pairs or not pairs[key]:
                        pairs[key] = value
    return pairs

def analyze_sheet_structure(file_path, sheet_name):
    """Анализ структуры листа"""
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        
        # Извлекаем пары ключ-значение
        pairs = extract_key_value_pairs(df)
        
        # Находим заголовки (строки с названиями полей)
        headers = []
        for idx, row in df.iterrows():
            row_values = [str(v).strip() if pd.notna(v) else "" for v in row.values]
            # Ищем строки, которые могут быть заголовками
            non_empty = [v for v in row_values if v and v not in ["nan", "", "None"]]
            if len(non_empty) > 3:  # Если в строке больше 3 непустых значений
                headers.append({
                    "row": idx,
                    "values": non_empty[:10]  # Первые 10 значений
                })
        
        return {
            "rows_count": len(df),
            "columns_count": len(df.columns),
            "key_value_pairs": pairs,
            "sample_headers": headers[:5],  # Первые 5 заголовков
            "sample_data": df.head(20).to_dict(orient="records")
        }
    except Exception as e:
        return {"error": str(e)}

def main():
    """Основная функция"""
    results = {}
    
    for excel_file in ZZ_DIR.glob("*.xlsx"):
        if excel_file.name.startswith("~$"):
            continue
        
        print(f"\n{'='*80}")
        print(f"Анализ файла: {excel_file.name}")
        print(f"{'='*80}")
        
        try:
            xls = pd.ExcelFile(excel_file)
            file_result = {
                "file": excel_file.name,
                "sheets": {}
            }
            
            for sheet_name in xls.sheet_names:
                print(f"\n  Лист: {sheet_name}")
                sheet_data = analyze_sheet_structure(excel_file, sheet_name)
                file_result["sheets"][sheet_name] = sheet_data
                
                if "key_value_pairs" in sheet_data:
                    pairs = sheet_data["key_value_pairs"]
                    print(f"    Найдено полей: {len(pairs)}")
                    if pairs:
                        print(f"    Примеры полей:")
                        for i, (key, value) in enumerate(list(pairs.items())[:5]):
                            print(f"      - {key}: {value[:50] if len(str(value)) > 50 else value}")
            
            results[excel_file.name] = file_result
            
        except Exception as e:
            print(f"Ошибка обработки файла {excel_file.name}: {e}")
            results[excel_file.name] = {"error": str(e)}
    
    # Сохраняем результаты
    output = Path("zz_complete_structure.json")
    with output.open("w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"\n{'='*80}")
    print(f"✅ Полная структура сохранена в {output}")
    print(f"{'='*80}")
    
    # Собираем все уникальные поля
    all_fields = set()
    for file_data in results.values():
        if "sheets" in file_data:
            for sheet_data in file_data["sheets"].values():
                if "key_value_pairs" in sheet_data:
                    all_fields.update(sheet_data["key_value_pairs"].keys())
    
    print(f"\nВсего уникальных полей: {len(all_fields)}")
    print("\nСписок всех полей:")
    for field in sorted(all_fields):
        print(f"  - {field}")

if __name__ == "__main__":
    main()

