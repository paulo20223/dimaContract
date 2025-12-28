from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel


# Auth
class LoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Bank
class BankBase(BaseModel):
    name: str
    bik: str
    correspondent_account: str


class BankCreate(BankBase):
    pass


class BankUpdate(BankBase):
    pass


class BankResponse(BankBase):
    id: int

    class Config:
        from_attributes = True


# Service
class ServiceBase(BaseModel):
    name: str
    price: Decimal
    payment_terms: str


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(ServiceBase):
    pass


class ServiceResponse(ServiceBase):
    id: int

    class Config:
        from_attributes = True


# Client
ClientType = Literal["ip", "ooo", "ao", "pao", "nko", "fl"]


class ClientBase(BaseModel):
    client_type: ClientType = "ip"
    name: Optional[str] = None  # Автогенерируется на бэкенде
    short_name: Optional[str] = None
    company_name: Optional[str] = None  # Название организации для юрлиц (без типа и кавычек)
    ogrn: Optional[str] = None
    inn: Optional[str] = None
    kpp: Optional[str] = None
    address: str
    email: Optional[str] = None
    phone: Optional[str] = None
    settlement_account: Optional[str] = None
    bank_id: Optional[int] = None
    last_name: str
    first_name: str
    patronymic: Optional[str] = None
    position: Optional[str] = None
    acting_basis: Optional[str] = None
    passport_series: Optional[str] = None
    passport_number: Optional[str] = None
    passport_issued_by: Optional[str] = None
    passport_issued_date: Optional[date] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ClientBase):
    pass


class ClientResponse(ClientBase):
    id: int
    bank: Optional[BankResponse] = None

    class Config:
        from_attributes = True


class ContractBase(BaseModel):
    number: str
    client_id: int
    contract_date: date | None = None
    service_ids: list[int]


class ContractCreate(ContractBase):
    pass


class ContractUpdate(ContractBase):
    pass


class ContractResponse(BaseModel):
    id: int
    number: str
    client_id: int
    date: date
    created_at: datetime
    client: Optional[ClientResponse] = None
    services: list[ServiceResponse] = []

    class Config:
        from_attributes = True


class ContractListResponse(BaseModel):
    items: list[ContractResponse]
    total: int
    page: int
    pages: int


class ClientListResponse(BaseModel):
    items: list[ClientResponse]
    total: int
    page: int
    pages: int


class ServiceListResponse(BaseModel):
    items: list[ServiceResponse]
    total: int
    page: int
    pages: int


class BankListResponse(BaseModel):
    items: list[BankResponse]
    total: int
    page: int
    pages: int


# CBR Import
class CBRImportResult(BaseModel):
    success: bool
    total_processed: int
    created: int
    updated: int
    errors: int
    error_messages: list[str] = []
    import_date: datetime
