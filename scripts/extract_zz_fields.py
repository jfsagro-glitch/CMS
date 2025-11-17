"""
Извлечение всех уникальных полей из файлов ZZ
"""

import json
from pathlib import Path
from collections import defaultdict

ZZ_STRUCTURE_FILE = Path("zz_complete_structure.json")
OUTPUT_FILE = Path("zz_all_fields.json")

def extract_all_fields():
    """Извлечение всех полей из структуры"""
    with ZZ_STRUCTURE_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    all_sheets = defaultdict(set)
    all_fields = set()
    sheet_fields = defaultdict(set)
    
    for file_name, file_data in data.items():
        if "sheets" not in file_data:
            continue
        
        for sheet_name, sheet_data in file_data["sheets"].items():
            all_sheets[sheet_name].add(file_name)
            
            if "key_value_pairs" in sheet_data:
                for key, value in sheet_data["key_value_pairs"].items():
                    all_fields.add(key)
                    sheet_fields[sheet_name].add(key)
    
    result = {
        "all_sheets": {sheet: list(files) for sheet, files in all_sheets.items()},
        "all_fields": sorted(list(all_fields)),
        "fields_by_sheet": {sheet: sorted(list(fields)) for sheet, fields in sheet_fields.items()},
        "total_fields": len(all_fields),
        "total_sheets": len(all_sheets)
    }
    
    with OUTPUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Извлечено {result['total_fields']} уникальных полей из {result['total_sheets']} вкладок")
    print(f"\nВкладки:")
    for sheet in sorted(all_sheets.keys()):
        print(f"  - {sheet}: {len(sheet_fields[sheet])} полей")
    
    print(f"\nВсе поля сохранены в {OUTPUT_FILE}")

if __name__ == "__main__":
    extract_all_fields()

