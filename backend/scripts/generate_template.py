#!/usr/bin/env python3
"""
Скрипт генерации Word-шаблона договора программным способом.
Создает template_prepared.docx без необходимости исходного template.docx
"""
import sys
from pathlib import Path

# Добавляем backend в путь
SCRIPT_DIR = Path(__file__).parent
BACKEND_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.document.template_builder import generate_template_file
from app.document.constants import TEMPLATE_PATH


def main():
    """Главная функция генерации шаблона"""
    print("=" * 60)
    print("Генерация Word-шаблона договора")
    print("=" * 60)

    output_path = TEMPLATE_PATH

    # Проверяем директорию
    output_dir = output_path.parent
    if not output_dir.exists():
        print(f"Создание директории: {output_dir}")
        output_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nВыходной файл: {output_path}")

    try:
        result_path = generate_template_file(str(output_path))
        print(f"\n✓ Шаблон успешно создан: {result_path}")
        print(f"  Размер: {output_path.stat().st_size:,} байт")
    except Exception as e:
        print(f"\n✗ Ошибка генерации: {e}")
        import traceback
        traceback.print_exc()
        return 1

    print("\n" + "=" * 60)
    print("Плейсхолдеры в шаблоне:")
    print("=" * 60)
    placeholders = [
        ("{{contract_number}}", "Номер договора"),
        ("{{contract_date}}", "Дата договора (ДД.ММ.ГГГГ)"),
        ("{{day}}", "День месяца (число)"),
        ("{{date_text}}", "Месяц и год прописью (октября 2025)"),
        ("{{client_header}}", "Полная преамбула клиента"),
        ("{{requisites}}", "Реквизиты клиента"),
        ("{{executor_requisites}}", "Реквизиты исполнителя"),
        ("{{signatory}}", "Подпись (Фамилия И.О.)"),
        ("{{services}}", "Маркер для таблицы услуг"),
        ("{{total_price}}", "Итоговая сумма прописью"),
    ]
    for placeholder, description in placeholders:
        print(f"  {placeholder:30} - {description}")

    print("\n" + "=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
