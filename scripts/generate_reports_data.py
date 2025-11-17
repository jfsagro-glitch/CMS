"""
Генерация данных отчетов (Форма 310) из XML файлов
"""
import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
import xml.etree.ElementTree as ET

XML_SOURCE_DIR = Path("XML_310_2025-04-24")
OUTPUT_FILE = Path("public/reportsData.json")


def parse_xml_file(xml_path: Path) -> Optional[Dict[str, Any]]:
    """Парсинг XML файла формы 310"""
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        
        # Извлекаем namespace
        ns = {'ns': 'urn:cbr-ru:rep0409310:v4.0.4.5'}
        
        # Основные атрибуты
        guid = root.get('Идентификатор') or root.get('{urn:cbr-ru:rep0409310:v4.0.4.5}Идентификатор') or str(uuid.uuid4())
        report_date = root.get('Дата') or root.get('{urn:cbr-ru:rep0409310:v4.0.4.5}Дата') or datetime.now().strftime('%Y-%m-%d')
        
        # Информация о кредитной организации
        credit_org_elem = root.find('.//ns:КредитнаяОрганизация', ns) or root.find('.//КредитнаяОрганизация')
        credit_org = {
            'name': credit_org_elem.get('Наименование', 'Не указано') if credit_org_elem is not None else 'Не указано',
            'code': credit_org_elem.get('Код', '') if credit_org_elem is not None else '',
        }
        
        # Парсинг разделов
        section1_items = []
        section2_items = []
        section3_items = []
        section4_items = []
        section5_items = []
        section6_items = []
        
        # Раздел 1
        section1_elems = root.findall('.//ns:Раздел1', ns) or root.findall('.//Раздел1')
        for elem in section1_elems:
            ref = elem.get('REFERENCE') or elem.get('{urn:cbr-ru:rep0409310:v4.0.4.5}REFERENCE') or ''
            if ref:
                section1_items.append({
                    'id': str(uuid.uuid4()),
                    'reference': ref,
                })
        
        # Раздел 2
        section2_elems = root.findall('.//ns:Раздел2', ns) or root.findall('.//Раздел2')
        for elem in section2_elems:
            ref = elem.get('REFERENCE') or ''
            if ref:
                section2_items.append({
                    'id': str(uuid.uuid4()),
                    'reference': ref,
                })
        
        # Раздел 3
        section3_elems = root.findall('.//ns:Раздел3', ns) or root.findall('.//Раздел3')
        for elem in section3_elems:
            ref = elem.get('REFERENCE') or ''
            if ref:
                section3_items.append({
                    'id': str(uuid.uuid4()),
                    'reference': ref,
                })
        
        report = {
            'id': str(uuid.uuid4()),
            'guid': guid,
            'reportDate': report_date,
            'reportNumber': f"Ф310-{report_date.replace('-', '')}-{random.randint(1000, 9999)}",
            'reportType': 'form310',
            'status': random.choice(['draft', 'submitted', 'approved']),
            'createdAt': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
            'updatedAt': datetime.now().isoformat(),
            'creditOrg': credit_org,
        }
        
        if section1_items:
            report['section1'] = {'items': section1_items}
        if section2_items:
            report['section2'] = {'items': section2_items}
        if section3_items:
            report['section3'] = {'items': section3_items}
        if section4_items:
            report['section4'] = {'items': section4_items}
        if section5_items:
            report['section5'] = {'items': section5_items}
        if section6_items:
            report['section6'] = {'items': section6_items}
        
        return report
    except Exception as e:
        print(f"Ошибка при парсинге {xml_path}: {e}")
        return None


def generate_demo_reports(count: int = 10) -> List[Dict[str, Any]]:
    """Генерация демо-отчетов"""
    reports = []
    base_date = datetime(2024, 1, 1)
    
    for i in range(count):
        report_date = (base_date + timedelta(days=random.randint(0, 365))).strftime('%Y-%m-%d')
        report = {
            'id': str(uuid.uuid4()),
            'guid': str(uuid.uuid4()),
            'reportDate': report_date,
            'reportNumber': f"Ф310-{report_date.replace('-', '')}-{1000 + i}",
            'reportType': 'form310',
            'status': random.choice(['draft', 'submitted', 'approved', 'rejected']),
            'createdAt': (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
            'updatedAt': datetime.now().isoformat(),
            'creditOrg': {
                'name': random.choice([
                    'ПАО "Сбербанк"',
                    'ПАО "ВТБ"',
                    'АО "Альфа-Банк"',
                    'ПАО "Газпромбанк"',
                    'ПАО "Россельхозбанк"',
                ]),
                'code': f"{random.randint(100000, 999999)}",
                'inn': f"{random.randint(1000000000, 9999999999)}",
            },
            'section1': {
                'items': [
                    {
                        'id': str(uuid.uuid4()),
                        'reference': f"REF-{random.randint(10000, 99999)}",
                        'collateralType': random.choice(['Недвижимость', 'Транспорт', 'Оборудование']),
                    }
                    for _ in range(random.randint(1, 5))
                ]
            },
            'section2': {
                'items': [
                    {
                        'id': str(uuid.uuid4()),
                        'reference': f"REF-{random.randint(10000, 99999)}",
                        'principalAmount': random.randrange(1000000, 100000000, 100000),
                    }
                    for _ in range(random.randint(1, 5))
                ]
            },
            'section3': {
                'items': [
                    {
                        'id': str(uuid.uuid4()),
                        'reference': f"REF-{random.randint(10000, 99999)}",
                        'collateralValue': random.randrange(5000000, 500000000, 500000),
                    }
                    for _ in range(random.randint(1, 5))
                ]
            },
        }
        reports.append(report)
    
    return reports


def main():
    """Основная функция"""
    reports: List[Dict[str, Any]] = []
    
    # Парсинг XML файлов
    if XML_SOURCE_DIR.exists():
        xml_files = list(XML_SOURCE_DIR.glob("*.xml"))
        for xml_file in xml_files:
            if xml_file.name.startswith('Ф310_'):
                parsed = parse_xml_file(xml_file)
                if parsed:
                    reports.append(parsed)
    
    # Если не удалось распарсить XML, генерируем демо-данные
    if not reports:
        print("XML файлы не найдены или не удалось распарсить. Генерируем демо-данные...")
        reports = generate_demo_reports(15)
    else:
        # Добавляем дополнительные демо-отчеты
        demo_reports = generate_demo_reports(5)
        reports.extend(demo_reports)
    
    payload = {
        'reports': reports,
        'metadata': {
            'totalReports': len(reports),
            'lastUpdated': datetime.now().isoformat(),
            'sourceFiles': [f.name for f in XML_SOURCE_DIR.glob("*.xml")] if XML_SOURCE_DIR.exists() else [],
        },
    }
    
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open('w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Reports dataset written: {OUTPUT_FILE} ({len(reports)} reports)")


if __name__ == '__main__':
    main()

