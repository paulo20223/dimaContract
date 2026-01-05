from decimal import Decimal

from app.models import Contract, CLIENT_TYPES
from .constants import MONTHS_RU, EXECUTOR_DATA
from .utils import number_to_words_ru


# Полные названия организационно-правовых форм
ORG_FORMS = {
    "ip": "Индивидуальный предприниматель",
    "ooo": "Общество с ограниченной ответственностью",
    "ao": "Акционерное общество",
    "pao": "Публичное акционерное общество",
    "nko": "Некоммерческая организация",
    "fl": "",
}


def replace_in_paragraph(paragraph, replacements: dict):
    """Заменяет метки в параграфе, объединяя разбитые runs при необходимости.

    Если плейсхолдер типа {{client_header}} разбит на несколько runs
    (например, '{{client' в одном run и '_header}}' в другом),
    функция объединяет runs перед заменой.
    """
    for key, value in replacements.items():
        full_text = paragraph.text
        if key not in full_text:
            continue

        # Проверяем, есть ли ключ целиком в одном run
        found_in_single_run = any(key in run.text for run in paragraph.runs)

        if not found_in_single_run and len(paragraph.runs) > 0:
            # Ключ разбит на несколько runs - объединяем их
            first_run = paragraph.runs[0]
            first_run.text = full_text
            # Удаляем остальные runs
            for run in list(paragraph.runs[1:]):
                run._element.getparent().remove(run._element)

        # Теперь заменяем в runs
        for run in paragraph.runs:
            if key in run.text:
                run.text = run.text.replace(key, str(value or ""))


def get_full_name(client) -> str:
    """Возвращает полное ФИО"""
    parts = [client.last_name, client.first_name]
    if client.patronymic:
        parts.append(client.patronymic)
    return " ".join(parts)


def get_short_name(client) -> str:
    """Возвращает сокращённое ФИО (Фамилия И.О.)"""
    parts = [client.last_name]
    if client.first_name:
        parts.append(f"{client.first_name[0]}.")
    if client.patronymic:
        parts.append(f"{client.patronymic[0]}.")
    return " ".join(parts)


def build_client_header(client) -> str:
    """Формирует текст преамбулы для клиента в зависимости от типа"""
    ct = client.client_type or "ip"
    full_name = get_full_name(client)

    if ct == "ip":
        return (
            f"Индивидуальный предприниматель {full_name}, "
            f"действующий от своего имени, на основании государственной регистрации "
            f"физического лица в качестве индивидуального предпринимателя "
            f"ОГРНИП {client.ogrn or ''}"
        )
    elif ct in ("ooo", "ao", "pao", "nko"):
        org_form = ORG_FORMS.get(ct, "")
        # Используем company_name, fallback на name для старых данных
        company = client.company_name or client.name
        position = client.position or "Генерального директора"
        basis = client.acting_basis or "Устава"
        return (
            f"{org_form} «{company}», в лице {position} {full_name}, "
            f"действующего на основании {basis}"
        )
    elif ct == "fl":
        passport_info = ""
        if client.passport_series and client.passport_number:
            passport_info = f", паспорт серия {client.passport_series} № {client.passport_number}"
            if client.passport_issued_by:
                passport_info += f", выдан {client.passport_issued_by}"
            if client.passport_issued_date:
                passport_info += f" {client.passport_issued_date.strftime('%d.%m.%Y')}"
        return f"{full_name}{passport_info}"
    else:
        return full_name


def build_requisites_main(client) -> str:
    """Формирует основные реквизиты клиента (без банковских)"""
    ct = client.client_type or "ip"
    lines = []

    if ct == "ip":
        lines.append(f"ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ {get_full_name(client).upper()}")
        if client.address:
            lines.append(f"Адрес регистрации: {client.address}")
        if client.inn:
            lines.append(f"ИНН: {client.inn}")
        if client.ogrn:
            lines.append(f"ОГРНИП: {client.ogrn}")
    elif ct in ("ooo", "ao", "pao", "nko"):
        org_form = CLIENT_TYPES.get(ct, "")
        company = client.company_name or client.name
        lines.append(f"{org_form} «{company}»")
        if client.address:
            lines.append(f"Юридический адрес: {client.address}")
        if client.ogrn:
            lines.append(f"ОГРН: {client.ogrn}")
        if client.kpp:
            lines.append(f"КПП: {client.kpp}")
        if client.inn:
            lines.append(f"ИНН: {client.inn}")
    elif ct == "fl":
        lines.append(get_full_name(client))
        if client.address:
            lines.append(f"Адрес регистрации: {client.address}")
        if client.inn:
            lines.append(f"ИНН: {client.inn}")

    if client.email:
        lines.append(f"E-mail: {client.email}")
    if client.phone:
        lines.append(f"Тел.: {client.phone}")

    return "\n".join(lines)


def build_requisites_bank(client, bank) -> str:
    """Формирует банковские реквизиты клиента"""
    lines = []
    if client.settlement_account:
        lines.append(f"Р/С: {client.settlement_account}")
    if bank:
        lines.extend([
            f"БАНК: {bank.name}",
            f"БИК: {bank.bik}",
            f"К/С: {bank.correspondent_account}",
        ])
    return "\n".join(lines)


def build_requisites(client, bank) -> str:
    """Формирует полную строку реквизитов (для обратной совместимости)"""
    main = build_requisites_main(client)
    bank_info = build_requisites_bank(client, bank)

    if bank_info:
        return f"{main}\n\nБанковские реквизиты:\n{bank_info}"
    return main


def build_executor_requisites_main() -> str:
    """Формирует основные реквизиты Исполнителя (без банковских)"""
    return f"""ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ {EXECUTOR_DATA['name'].upper()}
Юридический адрес: {EXECUTOR_DATA['address']}
ИНН: {EXECUTOR_DATA['inn']}
ОГРНИП: {EXECUTOR_DATA['ogrn']}
E-mail: {EXECUTOR_DATA['email']}
Тел.: {EXECUTOR_DATA['phone']}"""


def build_executor_requisites_bank() -> str:
    """Формирует банковские реквизиты Исполнителя"""
    return f"""Р/С: {EXECUTOR_DATA['settlement_account']}
БАНК: {EXECUTOR_DATA['bank_name']}
БИК: {EXECUTOR_DATA['bank_bik']}
К/С: {EXECUTOR_DATA['bank_corr']}"""


def build_executor_requisites() -> str:
    """Формирует полные реквизиты Исполнителя (для обратной совместимости)"""
    main = build_executor_requisites_main()
    bank = build_executor_requisites_bank()
    return f"{main}\n\nБанковские реквизиты:\n{bank}"


def build_replacements(contract: Contract, total: Decimal = Decimal("0")) -> dict:
    """Создаёт словарь замен метка -> значение"""
    client = contract.client
    bank = client.bank
    d = contract.date

    return {
        "{{day}}": str(d.day),
        "{{date_text}}": f"{MONTHS_RU[d.month]} {d.year}",
        "{{client_type}}": client.client_type,
        "{{client_name}}": client.name,
        "{{client_company_name}}": client.company_name or "",
        "{{client_short_name}}": client.short_name,
        "{{client_full_name}}": get_full_name(client),
        "{{client_first_name}}": client.first_name,
        "{{client_last_name}}": client.last_name,
        "{{client_patronymic}}": client.patronymic,
        "{{client_ogrn}}": client.ogrn,
        "{{client_ogrnip}}": client.ogrn,  # для обратной совместимости
        "{{client_kpp}}": client.kpp,
        "{{client_address}}": client.address,
        "{{client_inn}}": client.inn,
        "{{client_email}}": client.email,
        "{{client_phone}}": client.phone,
        "{{client_account}}": client.settlement_account,
        "{{client_position}}": client.position,
        "{{client_acting_basis}}": client.acting_basis,
        "{{client_header}}": build_client_header(client),
        # Паспортные данные для физлиц
        "{{client_passport_series}}": client.passport_series or "",
        "{{client_passport_number}}": client.passport_number or "",
        "{{client_passport_issued_by}}": client.passport_issued_by or "",
        "{{client_passport_issued_date}}": (
            client.passport_issued_date.strftime("%d.%m.%Y")
            if client.passport_issued_date else ""
        ),
        # Банковские данные
        "{{bank_name}}": bank.name if bank else "",
        "{{bank_bik}}": bank.bik if bank else "",
        "{{bank_corr}}": bank.correspondent_account if bank else "",
        # Подписант и контракт
        "{{signatory}}": get_short_name(client),
        "{{contract_number}}": contract.number,
        "{{contract_date}}": d.strftime("%d.%m.%Y"),
        # Реквизиты (полные - для обратной совместимости)
        "{{requisites}}": build_requisites(client, bank),
        "{{executor_requisites}}": build_executor_requisites(),
        # Реквизиты (разбитые на части)
        "{{requisites_main}}": build_requisites_main(client),
        "{{requisites_bank}}": build_requisites_bank(client, bank),
        "{{executor_main}}": build_executor_requisites_main(),
        "{{executor_bank}}": build_executor_requisites_bank(),
        "{{total_price}}": f"{total:,.0f} руб. ({number_to_words_ru(total)})",
    }
