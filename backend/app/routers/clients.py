from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models import Client, Contract
from app.schemas import ClientCreate, ClientUpdate, ClientResponse, ClientListResponse, ContractResponse

router = APIRouter(prefix="/api/clients", tags=["clients"], dependencies=[Depends(get_current_user)])


# Сокращённые названия организационно-правовых форм
ORG_FORMS_SHORT = {
    "ooo": "ООО",
    "ao": "АО",
    "pao": "ПАО",
    "nko": "НКО",
}


def generate_client_name(data: ClientCreate | ClientUpdate) -> str:
    """Генерирует полное наименование клиента на основе типа и данных"""
    fio = " ".join(filter(None, [data.last_name, data.first_name, data.patronymic]))

    if data.client_type == "ip":
        return f"ИП {fio}"
    elif data.client_type == "fl":
        return fio
    elif data.client_type in ORG_FORMS_SHORT:
        org_form = ORG_FORMS_SHORT[data.client_type]
        company = data.company_name or ""
        return f"{org_form} «{company}»"

    return data.name or fio


def generate_client_short_name(data: ClientCreate | ClientUpdate) -> str | None:
    """Генерирует краткое наименование для юрлиц"""
    if data.client_type in ORG_FORMS_SHORT:
        org_form = ORG_FORMS_SHORT[data.client_type]
        company = data.company_name or ""
        return f"{org_form} «{company}»"
    return None


@router.get("", response_model=ClientListResponse)
async def get_clients(
    page: int = 1,
    per_page: int = 10,
    search: str = "",
    db: AsyncSession = Depends(get_db)
):
    query = select(Client).options(selectinload(Client.bank))

    if search:
        search_filter = or_(
            Client.name.ilike(f"%{search}%"),
            Client.inn.ilike(f"%{search}%"),
            Client.last_name.ilike(f"%{search}%"),
            Client.first_name.ilike(f"%{search}%"),
            Client.phone.ilike(f"%{search}%"),
            Client.email.ilike(f"%{search}%")
        )
        query = query.where(search_filter)

    count_query = select(func.count()).select_from(Client)
    if search:
        count_query = count_query.where(search_filter)

    total = (await db.execute(count_query)).scalar() or 0
    pages = (total + per_page - 1) // per_page

    query = query.order_by(Client.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    items = result.scalars().all()

    return ClientListResponse(items=items, total=total, page=page, pages=pages)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Client).options(selectinload(Client.bank)).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


@router.get("/{client_id}/contracts", response_model=list[ContractResponse])
async def get_client_contracts(client_id: int, db: AsyncSession = Depends(get_db)):
    """Получить список договоров клиента"""
    result = await db.execute(select(Client).where(Client.id == client_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    result = await db.execute(
        select(Contract)
        .options(
            selectinload(Contract.services),
            selectinload(Contract.client).selectinload(Client.bank)
        )
        .where(Contract.client_id == client_id)
        .order_by(Contract.date.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(data: ClientCreate, db: AsyncSession = Depends(get_db)):
    client_data = data.model_dump()
    client_data["name"] = generate_client_name(data)
    client_data["short_name"] = generate_client_short_name(data)
    client = Client(**client_data)
    db.add(client)
    await db.commit()
    await db.refresh(client)
    result = await db.execute(
        select(Client).options(selectinload(Client.bank)).where(Client.id == client.id)
    )
    return result.scalar_one()


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(client_id: int, data: ClientUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    client_data = data.model_dump()
    client_data["name"] = generate_client_name(data)
    client_data["short_name"] = generate_client_short_name(data)
    for key, value in client_data.items():
        setattr(client, key, value)
    await db.commit()
    result = await db.execute(
        select(Client).options(selectinload(Client.bank)).where(Client.id == client_id)
    )
    return result.scalar_one()


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    await db.delete(client)
    await db.commit()
