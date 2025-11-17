"""
Детальный анализ структуры вкладок из файлов ZZ
"""

import pandas as pd
from pathlib import Path
import json

ZZ_DIR = Path("ZZ")

def analyze_tab_structure(file_path, sheet_name):
    """Анализ структуры вкладки"""
    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
        
        # Ищем заголовки (обычно в первых строках)
        headers = []
        data_rows = []
        
        for idx, row in df.iterrows():
            row_values = [str(v).strip() if pd.notna(v) else "" for v in row.values]
            non_empty = [v for v in row_values if v and v not in ["nan", "", "None"]]
            
            # Если в строке много непустых значений, это может быть заголовок
            if len(non_empty) > 2:
                # Проверяем, не является ли это заголовком
                if any(keyword in str(non_empty[0]).lower() for keyword in ['№', 'наименование', 'название', 'адрес', 'площадь', 'стоимость', 'дата']):
                    headers.append({
                        "row": idx,
                        "values": non_empty[:15]  # Первые 15 значений
                    })
                elif idx > 0:  # После заголовков идут данные
                    data_rows.append({
                        "row": idx,
                        "values": non_empty[:15]
                    })
        
        return {
            "rows_count": len(df),
            "columns_count": len(df.columns),
            "headers": headers[:5],  # Первые 5 заголовков
            "sample_data_rows": data_rows[:10],  # Первые 10 строк данных
        }
    except Exception as e:
        return {"error": str(e)}

def main():
    """Основная функция"""
    results = {}
    
    # Анализируем один файл детально
    test_file = ZZ_DIR / "ЗЗ Недвижимость жилая.xlsx"
    
    if not test_file.exists():
        print(f"Файл {test_file} не найден")
        return
    
    print(f"Детальный анализ файла: {test_file.name}")
    
    try:
        xls = pd.ExcelFile(test_file)
        file_result = {
            "file": test_file.name,
            "sheets": {}
        }
        
        for sheet_name in xls.sheet_names:
            print(f"\n  Анализ вкладки: {sheet_name}")
            sheet_data = analyze_tab_structure(test_file, sheet_name)
            file_result["sheets"][sheet_name] = sheet_data
            
            if "headers" in sheet_data and sheet_data["headers"]:
                print(f"    Найдено заголовков: {len(sheet_data['headers'])}")
                for header in sheet_data["headers"][:2]:
                    print(f"      Строка {header['row']}: {header['values'][:5]}")
        
        results[test_file.name] = file_result
        
        # Сохраняем результаты
        output = Path("zz_tabs_structure.json")
        with output.open("w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"\n✅ Структура вкладок сохранена в {output}")
        
    except Exception as e:
        print(f"Ошибка: {e}")

if __name__ == "__main__":
    main()

