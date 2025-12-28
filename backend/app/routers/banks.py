from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Bank, Client
from app.schemas import BankCreate, BankUpdate, BankResponse, BankListResponse, CBRImportResult
from app.services.cbr_import import CBRImportService

router = APIRouter(prefix="/api/banks", tags=["banks"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=BankListResponse)
async def get_banks(
    page: int = 1,
    per_page: int = 10,
    search: str = "",
    db: AsyncSession = Depends(get_db)
):
    # Subquery to count clients per bank
    client_count = (
        select(Client.bank_id, func.count(Client.id).label("usage_count"))
        .group_by(Client.bank_id)
        .subquery()
    )

    query = (
        select(Bank)
        .outerjoin(client_count, Bank.id == client_count.c.bank_id)
    )

    if search:
        search_filter = or_(
            Bank.name.ilike(f"%{search}%"),
            Bank.bik.ilike(f"%{search}%")
        )
        query = query.where(search_filter)

    count_query = select(func.count()).select_from(Bank)
    if search:
        count_query = count_query.where(search_filter)

    total = (await db.execute(count_query)).scalar() or 0
    pages = (total + per_page - 1) // per_page

    # Sort by usage (most used first), then by name
    query = (
        query
        .order_by(desc(func.coalesce(client_count.c.usage_count, 0)), Bank.name)
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await db.execute(query)
    items = result.scalars().all()

    return BankListResponse(items=items, total=total, page=page, pages=pages)


@router.get("/{bank_id}", response_model=BankResponse)
async def get_bank(bank_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bank).where(Bank.id == bank_id))
    bank = result.scalar_one_or_none()
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank not found")
    return bank


@router.post("", response_model=BankResponse, status_code=status.HTTP_201_CREATED)
async def create_bank(data: BankCreate, db: AsyncSession = Depends(get_db)):
    bank = Bank(**data.model_dump())
    db.add(bank)
    await db.commit()
    await db.refresh(bank)
    return bank


@router.put("/{bank_id}", response_model=BankResponse)
async def update_bank(bank_id: int, data: BankUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bank).where(Bank.id == bank_id))
    bank = result.scalar_one_or_none()
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank not found")
    for key, value in data.model_dump().items():
        setattr(bank, key, value)
    await db.commit()
    await db.refresh(bank)
    return bank


@router.delete("/{bank_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank(bank_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bank).where(Bank.id == bank_id))
    bank = result.scalar_one_or_none()
    if not bank:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bank not found")
    await db.delete(bank)
    await db.commit()


@router.post("/import-cbr", response_model=CBRImportResult)
async def import_from_cbr(db: AsyncSession = Depends(get_db)):
    """Import bank directory from Central Bank of Russia."""
    service = CBRImportService()
    result = await service.import_banks(db)

    if not result.success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=result.error_messages[0] if result.error_messages else "Import failed"
        )

    return result
