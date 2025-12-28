from decimal import Decimal
from num2words import num2words


def number_to_words_ru(n: Decimal) -> str:
    """Конвертирует число в русские слова (для рублей)"""
    return num2words(int(n), lang='ru') + " рублей"
