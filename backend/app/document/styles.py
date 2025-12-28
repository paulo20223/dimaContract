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

    # Установка шрифта для кириллицы
    style._element.rPr.rFonts.set(qn('w:eastAsia'), FONT_NAME)


def apply_run_font(run, font_name=FONT_NAME, font_size=FONT_SIZE_BODY):
    """Применяет стиль шрифта к run с поддержкой кириллицы."""
    run.font.name = font_name
    run.font.size = font_size
    run._element.rPr.rFonts.set(qn('w:eastAsia'), font_name)


def apply_title_style(run):
    """Стиль заголовка документа (жирный, размер заголовка)."""
    run.bold = True
    apply_run_font(run, FONT_NAME_HEADING, FONT_SIZE_TITLE)


def apply_heading_style(run):
    """Стиль заголовка раздела (жирный, размер подзаголовка)."""
    run.bold = True
    apply_run_font(run, FONT_NAME_HEADING, FONT_SIZE_HEADING)


def apply_body_style(paragraph, first_line_indent: bool = True):
    """Стиль для основного текста"""
    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    paragraph.paragraph_format.space_after = PARAGRAPH_SPACING_AFTER
    paragraph.paragraph_format.line_spacing = LINE_SPACING

    if first_line_indent:
        paragraph.paragraph_format.first_line_indent = FIRST_LINE_INDENT

    for run in paragraph.runs:
        apply_run_font(run)
