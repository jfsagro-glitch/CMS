"""
Генерация XML файла отчета по форме 0409310 ЦБ РФ
на основе данных залогового портфеля
"""
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import xml.etree.ElementTree as ET
from xml.dom import minidom

PORTFOLIO_DATA_FILE = Path("public/portfolioData.json")
OUTPUT_DIR = Path("public/reports")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Namespace для формы 0409310
NS = "urn:cbr-ru:rep0409310:v4.0.4.5"
NS_MAP = {None: NS}


def format_decimal(value: Any, decimals: int = 2) -> str:
    """Форматирование десятичного числа"""
    if value is None:
        return "0.00"
    try:
        num = float(value)
        return f"{num:.{decimals}f}"
    except (ValueError, TypeError):
        return "0.00"


def format_date(value: Any) -> str:
    """Форматирование даты в формат CCYY-MM-DD"""
    if not value:
        return datetime.now().strftime("%Y-%m-%d")
    try:
        if isinstance(value, str):
            # Пробуем разные форматы
            for fmt in ["%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y"]:
                try:
                    dt = datetime.strptime(value, fmt)
                    return dt.strftime("%Y-%m-%d")
                except ValueError:
                    continue
        return datetime.now().strftime("%Y-%m-%d")
    except Exception:
        return datetime.now().strftime("%Y-%m-%d")


def escape_xml(text: str) -> str:
    """Экранирование XML символов"""
    if not text:
        return ""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def create_root_element(
    guid: str,
    report_date: str,
    credit_org_code: str,
    credit_org_name: str,
) -> ET.Element:
    """Создание корневого элемента отчета"""
    root = ET.Element(f"{{{NS}}}Ф0409310", nsmap=NS_MAP)
    root.set("Идентификатор", guid)
    root.set("ВерсияФормата", "4.0.4.5")
    root.set("ДатаВерсииФормата", "2025-04-24")
    root.set("Версия", "4.0.4.5")
    root.set("Дата", report_date)
    root.set("Номер", "1")
    root.set("ДатаВерсии", "2025-04-24")
    root.set("ДатаВерсииФормата", "2025-04-24T00:00:00")

    # Кредитная организация
    credit_org = ET.SubElement(root, f"{{{NS}}}КредитнаяОрганизация")
    credit_org.set("Наименование", escape_xml(credit_org_name))
    credit_org.set("Код", credit_org_code)

    # Раздел 310
    section310 = ET.SubElement(root, f"{{{NS}}}Раздел310")
    section310.set("НП", "1")

    return root, section310


def create_section1(section310: ET.Element, portfolio_items: List[Dict[str, Any]]) -> None:
    """Раздел 1: Общие сведения"""
    for item in portfolio_items[:100]:  # Ограничение до 100 записей
        ref = str(item.get("reference") or item.get("contractNumber") or "")
        if not ref:
            continue

        section1 = ET.SubElement(section310, f"{{{NS}}}Раздел1")
        section1.set("Раздел1_1", ref)

        # Подраздел 1.1-1.4
        subsection1 = ET.SubElement(section1, f"{{{NS}}}Подраздел1")

        # 1.1 - Регистрация залога
        reg1 = ET.SubElement(subsection1, f"{{{NS}}}Раздел1_1")
        reg1.set("Раздел1.1_2", ref)

        reg2 = ET.SubElement(subsection1, f"{{{NS}}}Раздел1.1")
        reg_date = format_date(item.get("registrationDate") or item.get("collateralContractDate"))
        reg2.set("Раздел1.1_3", reg_date)
        reg2.set("Раздел1.1_4", escape_xml(str(item.get("collateralType") or "-")))

        # 1.2 - Дополнительная регистрация
        if item.get("collateralReference"):
            reg3 = ET.SubElement(subsection1, f"{{{NS}}}Раздел1.2")
            reg3.set("Раздел1.2_2", str(item.get("collateralReference")))

        # 1.3 - Изменение залога
        if item.get("lastMonitoringDate"):
            reg4 = ET.SubElement(subsection1, f"{{{NS}}}Раздел1.3")
            reg4.set("Раздел1.3_2", format_date(item.get("lastMonitoringDate")))

        # 1.4 - Снятие с учета
        if item.get("closeDate"):
            reg5 = ET.SubElement(section1, f"{{{NS}}}Раздел1.4")
            reg5.set("Раздел1.4_2", format_date(item.get("closeDate")))


def create_section2(section310: ET.Element, portfolio_items: List[Dict[str, Any]]) -> None:
    """Раздел 2: Финансовые показатели"""
    for item in portfolio_items[:100]:
        ref = str(item.get("reference") or item.get("contractNumber") or "")
        if not ref:
            continue

        section2 = ET.SubElement(section310, f"{{{NS}}}Раздел2")
        section2.set("Раздел2_1", ref)
        section2.set("Раздел2_2", str(item.get("contractNumber") or ""))

        # Основной долг
        debt = item.get("debtRub") or 0
        debt_date = format_date(item.get("contractDate"))
        section2.set("Раздел2_3", format_decimal(debt))
        section2.set("Раздел2_4", debt_date)

        # Проценты
        interest = item.get("overdueInterest") or 0
        section2.set("Раздел2_5", format_decimal(interest))
        section2.set("Раздел2_6", debt_date)

        # Просроченный основной долг
        overdue_principal = item.get("overduePrincipal") or 0
        section2.set("Раздел2_7", format_decimal(overdue_principal))
        section2.set("Раздел2_8", debt_date)

        # Просроченные проценты
        overdue_interest = item.get("overdueInterest") or 0
        section2.set("Раздел2_9", format_decimal(overdue_interest))
        section2.set("Раздел2_10", debt_date)

        # Лимит
        limit = item.get("limitRub") or 0
        section2.set("Раздел2_11", format_decimal(limit))
        section2.set("Раздел2_12", debt_date)

        # Резерв
        section2.set("Раздел2_13", "0.00")
        section2.set("Раздел2_14", debt_date)


def create_section3(section310: ET.Element, portfolio_items: List[Dict[str, Any]]) -> None:
    """Раздел 3: Оценка обеспечения"""
    for item in portfolio_items[:100]:
        ref = str(item.get("reference") or item.get("contractNumber") or "")
        if not ref:
            continue

        section3 = ET.SubElement(section310, f"{{{NS}}}Раздел3")
        section3.set("Раздел3_1", ref)
        section3.set("Раздел3_2", escape_xml(str(item.get("collateralLocation") or "")))
        section3.set("Раздел3_3", escape_xml(str(item.get("collateralType") or "")))
        section3.set("Раздел3_4", escape_xml(str(item.get("collateralCategory") or "")))
        section3.set("Раздел3_5", "310310")  # Код ОКАТО по умолчанию
        section3.set("Раздел3_6", escape_xml(str(item.get("collateralInfo") or "")))
        section3.set("Раздел3_7", escape_xml(str(item.get("collateralPurpose") or "")))
        section3.set("Раздел3_8", escape_xml(str(item.get("qualityCategory") or "")))
        section3.set("Раздел3_9", escape_xml(str(item.get("liquidity") or "")))

        # Залоговая стоимость
        collateral_value = item.get("collateralValue") or 0
        section3.set("Раздел3_10", escape_xml(str(collateral_value)))

        # Рыночная стоимость
        market_value = item.get("marketValue") or item.get("currentMarketValue") or 0
        section3.set("Раздел3_11", format_decimal(market_value))


def create_section4(section310: ET.Element, portfolio_items: List[Dict[str, Any]]) -> None:
    """Раздел 4: Детализация по типам обеспечения"""
    for item in portfolio_items[:100]:
        ref = str(item.get("reference") or item.get("contractNumber") or "")
        if not ref:
            continue

        collateral_type = str(item.get("collateralType") or "").lower()

        section4 = ET.SubElement(section310, f"{{{NS}}}Раздел4")
        section4.set("Раздел4_1", ref)

        # Определяем категорию обеспечения (4.1 - недвижимость, 4.3 - транспорт и т.д.)
        if any(k in collateral_type for k in ["недвиж", "зем", "здание", "помещение"]):
            # 4.1 - Недвижимость
            subsection = ET.SubElement(section4, f"{{{NS}}}Раздел4.1")
            subsection.set("Раздел4.1_2", escape_xml(str(item.get("collateralLocation") or "")))
            subsection.set("Раздел4.1_3", format_date(item.get("registrationDate")))
            subsection.set("Раздел4.1_4", format_date(item.get("initialValuationDate")))
            subsection.set("Раздел4.1_5", str(item.get("collateralReference") or ""))
            subsection.set("Раздел4.1_6", format_date(item.get("currentValuationDate")))

        elif any(k in collateral_type for k in ["транспорт", "авто", "машина"]):
            # 4.3 - Транспортные средства
            subsection = ET.SubElement(section4, f"{{{NS}}}Раздел4.3")
            subsection.set("Раздел4.3_2", format_date(item.get("registrationDate")))
            subsection.set("Раздел4.3_3", escape_xml(str(item.get("collateralInfo") or "")))
            subsection.set("Раздел4.3_4", escape_xml(str(item.get("collateralLocation") or "")))
            subsection.set("Раздел4.3_5", "2024")  # Год выпуска
            subsection.set("Раздел4.3_6", escape_xml(str(item.get("collateralInfo") or "")))
            subsection.set("Раздел4.3_7", escape_xml(str(item.get("collateralInfo") or "")))
            subsection.set("Раздел4.3_8", escape_xml(str(item.get("collateralInfo") or "")))


def create_section5(section310: ET.Element, portfolio_items: List[Dict[str, Any]]) -> None:
    """Раздел 5: Информация о залогодателях"""
    for item in portfolio_items[:100]:
        ref = str(item.get("reference") or item.get("contractNumber") or "")
        if not ref:
            continue

        pledger = item.get("pledger") or item.get("borrower") or ""
        if not pledger:
            continue

        section5 = ET.SubElement(section310, f"{{{NS}}}Раздел5")
        section5.set("Раздел5_1", ref)

        # 5.1 - Залогодатель - физическое лицо
        subsection = ET.SubElement(section5, f"{{{NS}}}Раздел5.1")
        subsection.set("Раздел5.1_2", escape_xml(str(item.get("collateralLocation") or "")))
        subsection.set("Раздел5.1_3", escape_xml(pledger))
        subsection.set("Раздел5.1_4", escape_xml(pledger))
        subsection.set("Раздел5.1_5", "")
        subsection.set("Раздел5.1_6", "")
        subsection.set("Раздел5.1_7", "")
        subsection.set("Раздел5.1_8", str(item.get("inn") or ""))
        subsection.set("Раздел5.1_9", "")


def create_section6(section310: ET.Element, portfolio_items: List[Dict[str, Any]]) -> None:
    """Раздел 6: Дополнительная информация"""
    # Раздел 6.1 - Изменения в разделе 1
    # Раздел 6.2 - Изменения в разделе 2
    # Раздел 6.3 - Изменения в разделе 3
    # Раздел 6.4 - Изменения в разделе 4
    # Раздел 6.5 - Изменения в разделе 5
    pass


def generate_xml_report(
    portfolio_data: List[Dict[str, Any]],
    credit_org_code: str = "000000000",
    credit_org_name: str = "Кредитная организация",
    report_date: Optional[str] = None,
) -> str:
    """Генерация XML отчета"""
    if not report_date:
        report_date = datetime.now().strftime("%Y-%m-%d")

    guid = str(uuid.uuid4())

    root, section310 = create_root_element(guid, report_date, credit_org_code, credit_org_name)

    # Создаем разделы
    create_section1(section310, portfolio_data)
    create_section2(section310, portfolio_data)
    create_section3(section310, portfolio_data)
    create_section4(section310, portfolio_data)
    create_section5(section310, portfolio_data)
    create_section6(section310, portfolio_data)

    # Форматируем XML
    rough_string = ET.tostring(root, encoding="utf-8")
    reparsed = minidom.parseString(rough_string)
    pretty_xml = reparsed.toprettyxml(indent="  ", encoding="windows-1251")

    return pretty_xml.decode("windows-1251")


def main():
    """Основная функция"""
    # Загружаем данные портфеля
    if not PORTFOLIO_DATA_FILE.exists():
        print(f"❌ Файл {PORTFOLIO_DATA_FILE} не найден")
        return

    with PORTFOLIO_DATA_FILE.open("r", encoding="utf-8") as f:
        portfolio_data = json.load(f)

    print(f"📊 Загружено {len(portfolio_data)} записей из портфеля")

    # Генерируем XML
    xml_content = generate_xml_report(
        portfolio_data,
        credit_org_code="000000000",
        credit_org_name="ПАО 'Тестовый Банк'",
        report_date=datetime.now().strftime("%Y-%m-%d"),
    )

    # Сохраняем файл
    output_file = OUTPUT_DIR / f"Ф310_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.xml"
    with output_file.open("w", encoding="windows-1251") as f:
        f.write(xml_content)

    print(f"✅ XML отчет сохранен: {output_file}")
    print(f"📄 Размер файла: {output_file.stat().st_size} байт")


if __name__ == "__main__":
    main()

