#!/usr/bin/env python3
"""
Скрипт тестирования генерации счета на оплату.
Генерирует тестовый счет или счет для существующего договора.
"""
import sys
import asyncio
from pathlib import Path
from decimal import Decimal
from datetime import date

# Добавляем backend в путь
SCRIPT_DIR = Path(__file__).parent
BACKEND_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select
from app.database import async_session
from app.models import Contract, Client, Service, Bank


async def get_test_contract():
    """Получает первый договор из БД или создает тестовые данные"""
    async with async_session() as session:
        # Пробуем найти существующий договор с услугами
        result = await session.execute(
            select(Contract).limit(1)
        )
        contract = result.scalar_one_or_none()

        if contract:
            # Загружаем связанные данные
            await session.refresh(contract, ["client", "services"])
            if contract.client:
                await session.refresh(contract.client, ["bank"])
            print(f"Найден договор: №{contract.number} от {contract.date}")
            print(f"Клиент: {contract.client.name if contract.client else 'N/A'}")
            print(f"Услуг: {len(contract.services)}")
            return contract

        print("Договоры не найдены в БД, создаем тестовые данные...")
        return None


def create_mock_contract():
    """Создает мок-объект договора для тестирования"""

    class MockBank:
        name = 'АО "АЛЬФА-БАНК"'
        bik = "044525593"
        correspondent_account = "30101810200000000593"

    class MockClient:
        client_type = "ip"
        name = "ИП Иванов Иван Иванович"
        short_name = "Иванов И.И."
        company_name = None
        first_name = "Иван"
        last_name = "Иванов"
        patronymic = "Иванович"
        inn = "773015499624"
        ogrn = "319774600622534"
        kpp = None
        address = "г. Москва, ул. Тестовая, д. 1"
        email = "test@example.com"
        phone = "+7 999 123-45-67"
        settlement_account = "40802810502720012292"
        bank = MockBank()

    class MockService:
        def __init__(self, id, name, price):
            self.id = id
            self.name = name
            self.price = Decimal(str(price))
            self.payment_terms = "100% предоплата"

    class MockContract:
        number = "TEST-001"
        date = date.today()
        client = MockClient()
        services = [
            MockService(1, "Подготовка досудебной претензии к ООО «РВБ» (Вайлдберриз)", 20000),
            MockService(2, "Юридическая консультация по вопросам налогообложения", 5000),
        ]

    return MockContract()


def main():
    """Главная функция генерации тестового счета"""
    from app.document.invoice_generator import generate_invoice
    from app.document.constants import INVOICE_TEMPLATE_PATH

    print("=" * 60)
    print("Генерация тестового счета на оплату")
    print("=" * 60)

    # Проверяем наличие шаблона
    if not INVOICE_TEMPLATE_PATH.exists():
        print(f"✗ Ошибка: шаблон не найден: {INVOICE_TEMPLATE_PATH}")
        return 1

    print(f"Шаблон: {INVOICE_TEMPLATE_PATH}")

    # Пробуем получить реальный договор из БД
    contract = None
    try:
        contract = asyncio.run(get_test_contract())
    except Exception as e:
        print(f"Не удалось подключиться к БД: {e}")

    # Если нет реального договора, используем мок
    if contract is None:
        print("\nИспользуем тестовые данные...")
        contract = create_mock_contract()
        print(f"Договор: №{contract.number} от {contract.date}")
        print(f"Клиент: {contract.client.name}")
        print(f"Тип: {contract.client.client_type}")
        print(f"Услуг: {len(contract.services)}")

    # Генерируем счет
    print("\nГенерация счета...")
    try:
        invoice_bytes = generate_invoice(contract)
        print(f"✓ Счет сгенерирован: {len(invoice_bytes):,} байт")
    except Exception as e:
        print(f"✗ Ошибка генерации: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # Сохраняем в файл
    output_path = BACKEND_DIR / "test_invoice.xlsx"
    with open(output_path, "wb") as f:
        f.write(invoice_bytes)
    print(f"✓ Сохранено: {output_path}")

    print("\n" + "=" * 60)
    print("Счет успешно сгенерирован!")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
