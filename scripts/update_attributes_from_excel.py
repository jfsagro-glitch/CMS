#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для обновления справочника атрибутов залогового имущества из Excel файла
"""

import pandas as pd
import re
import sys
from pathlib import Path

def map_value_type(value_type):
    """Преобразует тип значения из Excel в тип для метаданных"""
    if pd.isna(value_type) or value_type == '':
        return 'text'
    value_type = str(value_type).upper()
    if value_type == 'STRING':
        return 'text'
    elif value_type == 'NUMBER':
        return 'number'
    elif value_type == 'DATE':
        return 'date'
    elif value_type == 'BOOLEAN':
        return 'boolean'
    elif value_type == 'DIRECTORY':
        return 'select'
    else:
        return 'text'

def generate_attributes_code(excel_path):
    """Генерирует код для справочника атрибутов из Excel файла"""
    df = pd.read_excel(excel_path)
    df = df.fillna('')
    
    items = []
    sort_order = 1
    
    # Группируем по типам имущества
    property_types = df['Тип имущества'].unique()
    
    for prop_type in property_types:
        if prop_type == '':
            continue
        
        type_df = df[df['Тип имущества'] == prop_type]
        
        for _, row in type_df.iterrows():
            attr_code = str(row['attr_code']).strip()
            attr_name = str(row['attr_name']).strip()
            value_type = map_value_type(row['value_type_name'])
            natural_key = bool(row.get('natural_key', False))
            report_section = str(row.get('раздел отчета форма 310', '')).strip()
            
            if attr_code == '' or attr_name == '':
                continue
            
            # Формируем описание
            desc_parts = [f"Тип: {value_type}"]
            if report_section:
                desc_parts.append(f"Раздел 310: {report_section}")
            if natural_key:
                desc_parts.append("Естественный ключ")
            
            # Формируем метаданные
            metadata = {
                'type': value_type,
                'propertyType': prop_type,
                'naturalKey': natural_key,
            }
            
            if report_section:
                metadata['reportSection'] = report_section
            
            # Определяем группу на основе типа имущества
            if 'недвижимость' in prop_type.lower() or 'земельный' in prop_type.lower():
                metadata['group'] = 'Недвижимость'
            elif 'транспорт' in prop_type.lower() or 'тс' in prop_type.lower() or 'автомобиль' in prop_type.lower():
                metadata['group'] = 'Транспорт'
            elif 'оборудование' in prop_type.lower():
                metadata['group'] = 'Оборудование'
            elif 'суд' in prop_type.lower() or 'плавучие' in prop_type.lower():
                metadata['group'] = 'Водный транспорт'
            elif 'железнодорожный' in prop_type.lower():
                metadata['group'] = 'Железнодорожный транспорт'
            elif 'космические' in prop_type.lower():
                metadata['group'] = 'Космические объекты'
            elif 'товары' in prop_type.lower():
                metadata['group'] = 'Товары в обороте'
            else:
                metadata['group'] = 'Общие'
            
            item = {
                'id': f"attr-{sort_order}",
                'code': attr_code,
                'name': attr_name,
                'description': ', '.join(desc_parts),
                'isActive': True,
                'sortOrder': sort_order,
                'metadata': metadata
            }
            
            items.append(item)
            sort_order += 1
    
    return items

def update_reference_data_service(ts_file_path, excel_path):
    """Обновляет ReferenceDataService.ts с новыми атрибутами"""
    items = generate_attributes_code(excel_path)
    
    # Читаем текущий файл
    with open(ts_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Находим начало и конец справочника атрибутов
    start_pattern = r'(id: \'dict-collateral-attributes\',[\s\S]*?items: \[)'
    end_pattern = r'(\],[\s\S]*?createdAt: now,)'
    
    # Генерируем код для items
    items_code = '          // Атрибуты из Excel файла\n'
    for item in items:
        # Экранируем кавычки в строках
        name_escaped = item['name'].replace("'", "\\'")
        desc_escaped = item['description'].replace("'", "\\'")
        code_escaped = item['code'].replace("'", "\\'")
        
        # Формируем metadata как TypeScript объект
        metadata = item['metadata']
        metadata_parts = []
        metadata_parts.append(f"type: '{metadata['type']}'")
        prop_type_escaped = metadata['propertyType'].replace("'", "\\'")
        metadata_parts.append(f"propertyType: '{prop_type_escaped}'")
        metadata_parts.append(f"naturalKey: {str(metadata['naturalKey']).lower()}")
        if 'reportSection' in metadata:
            metadata_parts.append(f"reportSection: '{metadata['reportSection']}'")
        if 'group' in metadata:
            group_escaped = metadata['group'].replace("'", "\\'")
            metadata_parts.append(f"group: '{group_escaped}'")
        
        metadata_str = '{ ' + ', '.join(metadata_parts) + ' }'
        
        items_code += f"          {{ id: '{item['id']}', code: '{code_escaped}', name: '{name_escaped}', description: '{desc_escaped}', isActive: {str(item['isActive']).lower()}, sortOrder: {item['sortOrder']}, metadata: {metadata_str} }},\n"
    
    # Заменяем items в справочнике
    pattern = r'(id: \'dict-collateral-attributes\',[\s\S]*?items: \[)([\s\S]*?)(\],[\s\S]*?createdAt: now,)'
    
    def replace_items(match):
        return match.group(1) + '\n' + items_code.rstrip() + '\n        ' + match.group(3)
    
    new_content = re.sub(pattern, replace_items, content)
    
    # Записываем обновленный файл
    with open(ts_file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Обновлено {len(items)} атрибутов в {ts_file_path}")

if __name__ == '__main__':
    import json
    
    excel_path = Path('ATRIBUTI/atr1.xlsx')
    ts_file_path = Path('src/services/ReferenceDataService.ts')
    
    if not excel_path.exists():
        print(f"Файл {excel_path} не найден")
        sys.exit(1)
    
    if not ts_file_path.exists():
        print(f"Файл {ts_file_path} не найден")
        sys.exit(1)
    
    update_reference_data_service(ts_file_path, excel_path)

