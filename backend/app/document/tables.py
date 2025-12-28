from decimal import Decimal

from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt

from .utils import number_to_words_ru

# Ширина колонок таблицы услуг
SERVICE_TABLE_COL_WIDTHS = [Cm(1), Cm(8), Cm(8)]


def find_services_table(doc):
    """Находит таблицу с маркером {{services}}"""
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if "{{services}}" in cell.text:
                    return table, row
    return None, None


def fill_services_table(doc, services: list) -> Decimal:
    """Заполняет таблицу услуг, возвращает итоговую сумму"""
    table, marker_row = find_services_table(doc)
    if not table:
        return Decimal("0")

    table._tbl.remove(marker_row._tr)

    total = Decimal("0")
    for i, service in enumerate(services, 1):
        row = table.add_row()
        # Применяем ширину колонок к новой строке
        for idx, width in enumerate(SERVICE_TABLE_COL_WIDTHS):
            row.cells[idx].width = width
        row.cells[0].text = f"{i}."
        row.cells[0].vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT
        row.cells[1].text = service.name
        row.cells[1].vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        price_text = f"Стоимость: {service.price:,.0f} руб. ({number_to_words_ru(service.price)}).\nПорядок оплаты:\n{service.payment_terms}"
        row.cells[2].text = price_text
        row.cells[2].vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        row.cells[2].paragraphs[0].paragraph_format.space_before = Pt(6)
        row.cells[2].paragraphs[0].paragraph_format.space_after = Pt(6)

        total += service.price

    return total
