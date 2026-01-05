"""
Централизованные стили для Word-документов.
"""
from docx import Document
from docx.shared import Pt, Cm, Twips, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# Константы шрифтов
FONT_NAME = "Times New Roman"
FONT_NAME_HEADING = "Times New Roman"  # Для заголовков
FONT_SIZE_TITLE = Pt(11)  # Заголовок договора
FONT_SIZE_HEADING = Pt(11)  # Заголовки разделов
FONT_SIZE_HEADING_SMALL = Pt(11)  # Подзаголовки
FONT_SIZE_BODY = Pt(11)  # Основной текст
FONT_SIZE_SMALL = Pt(10)

# Отступы страницы (как в оригинале)
MARGIN_TOP = Cm(2)
MARGIN_BOTTOM = Cm(1.5)  # Было 2 см
MARGIN_LEFT = Cm(3)
MARGIN_RIGHT = Cm(1.5)

# Межстрочный интервал
LINE_SPACING = 1.15
PARAGRAPH_SPACING_AFTER = Pt(0)

# Отступ первой строки (как в оригинале - 0.30 дюйма)
FIRST_LINE_INDENT = Inches(0.30)


def apply_document_defaults(doc: Document):
    """Применяет стандартные настройки к документу"""
    # Настройка секций (отступы страницы)
    for section in doc.sections:
        section.top_margin = MARGIN_TOP
        section.bottom_margin = MARGIN_BOTTOM
        section.left_margin = MARGIN_LEFT
        section.right_margin = MARGIN_RIGHT

    # Настройка стиля Normal
    style = doc.styles['Normal']
    font = style.font
    font.name = FONT_NAME
    font.size = FONT_SIZE_BODY

    # Установка шрифта для всех типов текста (совместимость Word/LibreOffice)
    rFonts = style._element.rPr.get_or_add_rFonts()
    rFonts.set(qn('w:ascii'), FONT_NAME)
    rFonts.set(qn('w:hAnsi'), FONT_NAME)
    rFonts.set(qn('w:cs'), FONT_NAME)
    rFonts.set(qn('w:eastAsia'), FONT_NAME)


def apply_run_font(run, font_name=FONT_NAME, font_size=FONT_SIZE_BODY):
    """Применяет стиль шрифта к run с полной поддержкой Word/LibreOffice."""
    run.font.name = font_name
    run.font.size = font_size

    # Устанавливаем шрифт для всех типов текста (критично для LibreOffice)
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn('w:ascii'), font_name)      # ASCII characters
    rFonts.set(qn('w:hAnsi'), font_name)      # High ANSI (extended Latin)
    rFonts.set(qn('w:cs'), font_name)         # Complex Script (Cyrillic)
    rFonts.set(qn('w:eastAsia'), font_name)   # East Asian


def apply_title_style(run):
    """Стиль заголовка документа (жирный, размер заголовка)."""
    run.bold = True
    apply_run_font(run, FONT_NAME_HEADING, FONT_SIZE_TITLE)


def apply_heading_style(run):
    """Стиль заголовка раздела (жирный, размер подзаголовка)."""
    run.bold = True
    apply_run_font(run, FONT_NAME_HEADING, FONT_SIZE_HEADING)


def apply_body_style(paragraph, first_line_indent: bool = True, alignment=None):
    """Стиль для основного текста"""
    if alignment is None:
        alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    paragraph.alignment = alignment
    paragraph.paragraph_format.space_after = PARAGRAPH_SPACING_AFTER
    paragraph.paragraph_format.line_spacing = LINE_SPACING

    if first_line_indent:
        paragraph.paragraph_format.first_line_indent = FIRST_LINE_INDENT

    for run in paragraph.runs:
        apply_run_font(run)


def apply_table_borders(table):
    """Применяет явные границы к таблице (совместимость LibreOffice).

    LibreOffice может не распознавать стиль 'Table Grid', поэтому
    устанавливаем границы явно через XML.
    """
    tbl = table._tbl
    tblPr = tbl.tblPr
    if tblPr is None:
        tblPr = OxmlElement('w:tblPr')
        tbl.insert(0, tblPr)

    # Удаляем существующие границы если есть
    for existing in tblPr.findall(qn('w:tblBorders')):
        tblPr.remove(existing)

    tblBorders = OxmlElement('w:tblBorders')
    for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
        border = OxmlElement(f'w:{border_name}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), '4')  # 0.5pt
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), '000000')
        tblBorders.append(border)

    tblPr.append(tblBorders)


def set_table_width_fixed(table, col_widths_twips: list):
    """Устанавливает фиксированную ширину таблицы для совместимости с LibreOffice.

    Args:
        table: Объект таблицы python-docx
        col_widths_twips: Список ширин колонок в twips
    """
    tbl = table._tbl
    tblPr = tbl.tblPr
    if tblPr is None:
        tblPr = OxmlElement('w:tblPr')
        tbl.insert(0, tblPr)

    total_width = sum(col_widths_twips)

    # Удаляем существующую ширину если есть
    for existing in tblPr.findall(qn('w:tblW')):
        tblPr.remove(existing)

    # Устанавливаем ширину таблицы
    tblW = OxmlElement('w:tblW')
    tblW.set(qn('w:w'), str(int(total_width)))
    tblW.set(qn('w:type'), 'dxa')  # dxa = twentieths of a point (twips)
    tblPr.append(tblW)

    # Удаляем существующий layout если есть
    for existing in tblPr.findall(qn('w:tblLayout')):
        tblPr.remove(existing)

    # Устанавливаем фиксированный layout
    tblLayout = OxmlElement('w:tblLayout')
    tblLayout.set(qn('w:type'), 'fixed')
    tblPr.append(tblLayout)

    # КРИТИЧНО ДЛЯ LIBREOFFICE: Создаём w:tblGrid с w:gridCol
    for existing in tbl.findall(qn('w:tblGrid')):
        tbl.remove(existing)

    tblGrid = OxmlElement('w:tblGrid')
    for width in col_widths_twips:
        gridCol = OxmlElement('w:gridCol')
        gridCol.set(qn('w:w'), str(int(width)))
        tblGrid.append(gridCol)

    # Вставляем tblGrid после tblPr
    tblPr_index = list(tbl).index(tblPr)
    tbl.insert(tblPr_index + 1, tblGrid)


def set_cell_width(cell, width_twips):
    """Устанавливает ширину ячейки явно для совместимости с LibreOffice.

    Args:
        cell: Объект ячейки python-docx
        width_twips: Ширина ячейки в twips (используйте .twips свойство)
    """
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()

    # Удаляем существующую ширину если есть
    for existing in tcPr.findall(qn('w:tcW')):
        tcPr.remove(existing)

    tcW = OxmlElement('w:tcW')
    tcW.set(qn('w:w'), str(int(width_twips)))
    tcW.set(qn('w:type'), 'dxa')
    tcPr.append(tcW)


def set_cell_margins(cell, top=None, bottom=None, left=None, right=None):
    """Устанавливает отступы внутри ячейки.

    Args:
        cell: Объект ячейки python-docx
        top, bottom, left, right: Отступы в twips (0 = без отступа)
    """
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()

    tcMar = tcPr.find(qn('w:tcMar'))
    if tcMar is None:
        tcMar = OxmlElement('w:tcMar')
        tcPr.append(tcMar)

    for side, value in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        if value is not None:
            elem = tcMar.find(qn(f'w:{side}'))
            if elem is None:
                elem = OxmlElement(f'w:{side}')
                tcMar.append(elem)
            elem.set(qn('w:w'), str(int(value)))
            elem.set(qn('w:type'), 'dxa')
