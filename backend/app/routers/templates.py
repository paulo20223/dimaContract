from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Template, Contract
from app.schemas import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse,
)

router = APIRouter(prefix="/api/templates", tags=["templates"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=TemplateListResponse)
async def get_templates(
    page: int = 1,
    per_page: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Получить список шаблонов с пагинацией"""
    query = select(Template)

    count_query = select(func.count()).select_from(Template)
    total = (await db.execute(count_query)).scalar() or 0
    pages = (total + per_page - 1) // per_page if per_page > 0 else 1

    query = query.order_by(Template.is_default.desc(), Template.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    items = result.scalars().all()

    return TemplateListResponse(items=items, total=total, page=page, pages=pages)


@router.get("/default", response_model=TemplateResponse)
async def get_default_template(db: AsyncSession = Depends(get_db)):
    """Получить шаблон по умолчанию"""
    result = await db.execute(select(Template).where(Template.is_default == True))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Default template not found")
    return template


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(template_id: int, db: AsyncSession = Depends(get_db)):
    """Получить шаблон по ID"""
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(data: TemplateCreate, db: AsyncSession = Depends(get_db)):
    """Создать новый шаблон"""
    # Если шаблон устанавливается по умолчанию, сбрасываем is_default у других
    if data.is_default:
        await db.execute(
            Template.__table__.update().values(is_default=False)
        )

    sections_data = [section.model_dump() for section in data.sections]
    template = Template(
        name=data.name,
        description=data.description,
        sections=sections_data,
        is_default=data.is_default,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(template_id: int, data: TemplateUpdate, db: AsyncSession = Depends(get_db)):
    """Обновить шаблон"""
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    # Если шаблон устанавливается по умолчанию, сбрасываем is_default у других
    if data.is_default:
        await db.execute(
            Template.__table__.update().where(Template.id != template_id).values(is_default=False)
        )

    if data.name is not None:
        template.name = data.name
    if data.description is not None:
        template.description = data.description
    if data.sections is not None:
        template.sections = [section.model_dump() for section in data.sections]
    if data.is_default is not None:
        template.is_default = data.is_default

    template.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(template_id: int, db: AsyncSession = Depends(get_db)):
    """Удалить шаблон (если он не используется в контрактах)"""
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    # Проверяем, не используется ли шаблон в контрактах
    contracts_count = (await db.execute(
        select(func.count()).select_from(Contract).where(Contract.template_id == template_id)
    )).scalar() or 0

    if contracts_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template is used in {contracts_count} contract(s) and cannot be deleted"
        )

    if template.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the default template"
        )

    await db.delete(template)
    await db.commit()


@router.post("/{template_id}/duplicate", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_template(template_id: int, db: AsyncSession = Depends(get_db)):
    """Дублировать шаблон"""
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    new_template = Template(
        name=f"{template.name} (копия)",
        description=template.description,
        sections=template.sections,
        is_default=False,
    )
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    return new_template


@router.put("/{template_id}/set-default", response_model=TemplateResponse)
async def set_default_template(template_id: int, db: AsyncSession = Depends(get_db)):
    """Установить шаблон как шаблон по умолчанию"""
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    # Сбрасываем is_default у всех шаблонов
    await db.execute(
        Template.__table__.update().values(is_default=False)
    )

    # Устанавливаем выбранный шаблон как default
    template.is_default = True
    template.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(template)
    return template
