"""
Генератор QR-кодов для оплаты по ГОСТ Р 56042-2014.
"""
from io import BytesIO
from decimal import Decimal

import qrcode
from qrcode.constants import ERROR_CORRECT_M

from .constants import EXECUTOR_DATA


def build_payment_qr_data(
    invoice_number: str,
    invoice_date: str,
    amount: Decimal,
) -> str:
    """
    Формирует строку данных для QR-кода оплаты по ГОСТ Р 56042-2014.

    Args:
        invoice_number: Номер счета
        invoice_date: Дата счета (формат DD.MM.YYYY)
        amount: Сумма к оплате в рублях

    Returns:
        Строка данных для QR-кода в формате ST00011
    """
    # Конвертируем сумму в копейки (целое число)
    amount_kopecks = int(amount * 100)

    # Формируем назначение платежа
    purpose = f"Оплата по счету №{invoice_number} от {invoice_date}"

    # Собираем данные в формате ГОСТ
    fields = [
        "ST00011",  # Версия 0001 + кодировка Windows-1251
        f"Name=ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ЗИНЗИРОВ ДМИТРИЙ БОРИСОВИЧ",
        f"PersonalAcc={EXECUTOR_DATA['settlement_account']}",
        f"BankName={EXECUTOR_DATA['bank_name']}",
        f"BIC={EXECUTOR_DATA['bank_bik']}",
        f"CorrespAcc={EXECUTOR_DATA['bank_corr']}",
        f"PayeeINN={EXECUTOR_DATA['inn']}",
        "KPP=0",  # 0 для ИП
        f"Purpose={purpose}",
        f"Sum={amount_kopecks}",
    ]

    return "|".join(fields)


def generate_payment_qr_image(
    invoice_number: str,
    invoice_date: str,
    amount: Decimal,
    box_size: int = 4,
    border: int = 2,
) -> BytesIO:
    """
    Генерирует QR-код для оплаты в формате PNG.

    Args:
        invoice_number: Номер счета
        invoice_date: Дата счета
        amount: Сумма к оплате
        box_size: Размер одного модуля QR-кода в пикселях
        border: Ширина рамки в модулях

    Returns:
        BytesIO с PNG изображением QR-кода
    """
    # Формируем данные
    qr_data = build_payment_qr_data(invoice_number, invoice_date, amount)

    # Кодируем в Windows-1251 для минимального размера QR
    encoded_data = qr_data.encode("windows-1251")

    # Создаем QR-код
    qr = qrcode.QRCode(
        version=None,  # Автоматический выбор версии
        error_correction=ERROR_CORRECT_M,  # 15% коррекция ошибок
        box_size=box_size,
        border=border,
    )
    qr.add_data(encoded_data)
    qr.make(fit=True)

    # Генерируем изображение
    img = qr.make_image(fill_color="black", back_color="white")

    # Сохраняем в BytesIO
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return buffer
