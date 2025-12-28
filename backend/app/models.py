from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import ForeignKey, String, Text, Numeric, Date, DateTime, Table, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Типы клиентов
CLIENT_TYPES = {
    "ip": "ИП",
    "ooo": "ООО",
    "ao": "АО",
    "pao": "ПАО",
    "nko": "НКО",
    "fl": "Физлицо",
}

contract_services = Table(
    "contract_services",
    Base.metadata,
    Column("contract_id", Integer, ForeignKey("contracts.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", Integer, ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
)


class Bank(Base):
    __tablename__ = "banks"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    bik: Mapped[str] = mapped_column(String(9), unique=True, index=True)
    correspondent_account: Mapped[str] = mapped_column(String(20))

    clients: Mapped[list["Client"]] = relationship(back_populates="bank")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    payment_terms: Mapped[str] = mapped_column(Text)

    contracts: Mapped[list["Contract"]] = relationship(
        secondary=contract_services, back_populates="services"
    )


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_type: Mapped[str] = mapped_column(String(10), default="ip")  # ip, ooo, ao, pao, nko, fl
    name: Mapped[str] = mapped_column(String(255))  # Полное наименование (автогенерируется)
    short_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Краткое наименование (для юрлиц)
    company_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Название организации (без типа и кавычек)
    ogrn: Mapped[Optional[str]] = mapped_column(String(15), nullable=True)  # ОГРН (13) или ОГРНИП (15)
    inn: Mapped[Optional[str]] = mapped_column(String(12), nullable=True)
    kpp: Mapped[Optional[str]] = mapped_column(String(9), nullable=True)  # Только для юрлиц
    address: Mapped[str] = mapped_column(Text)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    settlement_account: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bank_id: Mapped[Optional[int]] = mapped_column(ForeignKey("banks.id"), nullable=True)

    # ФИО представителя / физлица
    last_name: Mapped[str] = mapped_column(String(100))
    first_name: Mapped[str] = mapped_column(String(100))
    patronymic: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Для юрлиц - данные представителя
    position: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Должность (Генеральный директор)
    acting_basis: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # На основании (Устава)

    # Для физлиц - паспортные данные
    passport_series: Mapped[Optional[str]] = mapped_column(String(4), nullable=True)
    passport_number: Mapped[Optional[str]] = mapped_column(String(6), nullable=True)
    passport_issued_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    passport_issued_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    bank: Mapped[Optional["Bank"]] = relationship(back_populates="clients")
    contracts: Mapped[list["Contract"]] = relationship(back_populates="client")


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str] = mapped_column(String(50), unique=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    date: Mapped[date] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client: Mapped["Client"] = relationship(back_populates="contracts")
    services: Mapped[list["Service"]] = relationship(
        secondary=contract_services, back_populates="contracts"
    )
