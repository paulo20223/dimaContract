from datetime import date
from io import BytesIO
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models import Contract, Client, Service
from app.schemas import ContractCreate, ContractUpdate, ContractResponse, ContractListResponse
from app.document import generate_contract_document, generate_contract_pdf
from app.document.invoice_generator import generate_invoice
from app.document.pdf_generator import generate_invoice_pdf

router = APIRouter(prefix="/api/contracts", tags=["contracts"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=ContractListResponse)
async def get_contracts(
    page: int = 1,
    per_page: int = 10,
    search: str = "",
    db: AsyncSession = Depends(get_db)
):
    query = select(Contract).options(
        selectinload(Contract.client).selectinload(Client.bank),
        selectinload(Contract.services)
    )

    if search:
        query = query.join(Client).where(
            or_(
                Contract.number.ilike(f"%{search}%"),
                Client.name.ilike(f"%{search}%")
            )
        )

    count_query = select(func.count()).select_from(Contract)
    if search:
        count_query = count_query.join(Client).where(
            or_(
                Contract.number.ilike(f"%{search}%"),
                Client.name.ilike(f"%{search}%")
            )
        )

    total = (await db.execute(count_query)).scalar() or 0
    pages = (total + per_page - 1) // per_page

    query = query.order_by(Contract.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    items = result.scalars().all()

    return ContractListResponse(items=items, total=total, page=page, pages=pages)


@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(data: ContractCreate, db: AsyncSession = Depends(get_db)):
    client_result = await db.execute(select(Client).where(Client.id == data.client_id))
    if not client_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    services_result = await db.execute(select(Service).where(Service.id.in_(data.service_ids)))
    services = services_result.scalars().all()
    if len(services) != len(data.service_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Some services not found")

    contract = Contract(
        number=data.number,
        client_id=data.client_id,
        date=data.contract_date or date.today()
    )
    contract.services = list(services)
    db.add(contract)
    await db.commit()
    await db.refresh(contract)

    result = await db.execute(
        select(Contract).options(
            selectinload(Contract.client).selectinload(Client.bank),
            selectinload(Contract.services)
        ).where(Contract.id == contract.id)
    )
    return result.scalar_one()


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Contract).options(
            selectinload(Contract.client).selectinload(Client.bank),
            selectinload(Contract.services)
        ).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")
    return contract


@router.put("/{contract_id}", response_model=ContractResponse)
async def update_contract(contract_id: int, data: ContractUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Contract).options(
            selectinload(Contract.services)
        ).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    client_result = await db.execute(select(Client).where(Client.id == data.client_id))
    if not client_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    services_result = await db.execute(select(Service).where(Service.id.in_(data.service_ids)))
    services = services_result.scalars().all()
    if len(services) != len(data.service_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Some services not found")

    contract.number = data.number
    contract.client_id = data.client_id
    contract.date = data.contract_date or contract.date
    contract.services = list(services)

    await db.commit()
    await db.refresh(contract)

    result = await db.execute(
        select(Contract).options(
            selectinload(Contract.client).selectinload(Client.bank),
            selectinload(Contract.services)
        ).where(Contract.id == contract_id)
    )
    return result.scalar_one()


@router.get("/{contract_id}/download")
async def download_contract(contract_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Contract).options(
            selectinload(Contract.client).selectinload(Client.bank),
            selectinload(Contract.services)
        ).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    doc_bytes = generate_contract_document(contract)

    filename = f"contract_{contract.number}.docx"
    encoded_filename = quote(filename, safe='')

    return StreamingResponse(
        BytesIO(doc_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=\"contract.docx\"; filename*=UTF-8''{encoded_filename}"
        }
    )


@router.get("/{contract_id}/download-pdf")
async def download_contract_pdf(contract_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Contract).options(
            selectinload(Contract.client).selectinload(Client.bank),
            selectinload(Contract.services)
        ).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    pdf_bytes = await generate_contract_pdf(contract)

    filename = f"contract_{contract.number}.pdf"
    encoded_filename = quote(filename, safe='')

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"contract.pdf\"; filename*=UTF-8''{encoded_filename}"
        }
    )


@router.get("/{contract_id}/invoice")
async def download_invoice(contract_id: int, db: AsyncSession = Depends(get_db)):
    """Скачать счёт на оплату в формате Excel"""
    result = await db.execute(
        select(Contract).options(
            selectinload(Contract.client),
            selectinload(Contract.services)
        ).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    invoice_bytes = generate_invoice(contract)

    filename = f"invoice_{contract.number}.xlsx"
    encoded_filename = quote(filename, safe='')

    return StreamingResponse(
        BytesIO(invoice_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=\"invoice.xlsx\"; filename*=UTF-8''{encoded_filename}"
        }
    )


@router.get("/{contract_id}/invoice-pdf")
async def download_invoice_pdf(contract_id: int, db: AsyncSession = Depends(get_db)):
    """Скачать счёт на оплату в формате PDF"""
    result = await db.execute(
        select(Contract).options(
            selectinload(Contract.client),
            selectinload(Contract.services)
        ).where(Contract.id == contract_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found")

    pdf_bytes = generate_invoice_pdf(contract)

    filename = f"invoice_{contract.number}.pdf"
    encoded_filename = quote(filename, safe='')

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"invoice.pdf\"; filename*=UTF-8''{encoded_filename}"
        }
    )
