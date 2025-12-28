import io
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime

import httpx
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Bank
from app.schemas import CBRImportResult

CBR_NEWBIK_URL = "https://www.cbr.ru/s/newbik"
ED807_NS = {"cbr": "urn:cbr-ru:ed:v2.0"}


class CBRImportService:
    def __init__(self, timeout: float = 120.0):
        self.timeout = timeout

    async def ensure_unique_constraint(self, db: AsyncSession) -> None:
        """Create unique constraint on bik if it doesn't exist."""
        await db.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS ix_banks_bik_unique ON banks (bik)
        """))
        await db.commit()

    async def fetch_newbik_archive(self) -> bytes:
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            response = await client.get(CBR_NEWBIK_URL)
            response.raise_for_status()
            return response.content

    def parse_ed807_from_zip(self, zip_content: bytes) -> list[dict]:
        records = []

        with zipfile.ZipFile(io.BytesIO(zip_content)) as zf:
            xml_files = [n for n in zf.namelist() if n.endswith('.xml')]
            if not xml_files:
                raise ValueError("No XML file found in archive")

            xml_content = zf.read(xml_files[0])

        root = ET.fromstring(xml_content)

        for entry in root.findall('.//cbr:BICDirectoryEntry', ED807_NS):
            bik = entry.get('BIC')
            if not bik or len(bik) != 9:
                continue

            participant = entry.find('cbr:ParticipantInfo', ED807_NS)
            if participant is None:
                continue

            name = participant.get('NameP', '')
            if not name:
                continue

            correspondent_account = None
            for account in entry.findall('cbr:Accounts', ED807_NS):
                if account.get('RegulationAccountType') == 'CRSA':
                    correspondent_account = account.get('Account')
                    break

            records.append({
                'bik': bik,
                'name': name,
                'correspondent_account': correspondent_account or ''
            })

        return records

    async def import_banks(self, db: AsyncSession) -> CBRImportResult:
        errors = []
        created = 0
        updated = 0

        try:
            await self.ensure_unique_constraint(db)
            archive = await self.fetch_newbik_archive()
            records = self.parse_ed807_from_zip(archive)

            if not records:
                return CBRImportResult(
                    success=False,
                    total_processed=0,
                    created=0,
                    updated=0,
                    errors=1,
                    error_messages=["No records found in CBR data"],
                    import_date=datetime.utcnow()
                )

            existing_biks = set()
            result = await db.execute(select(Bank.bik))
            for row in result.scalars():
                existing_biks.add(row)

            for record in records:
                try:
                    stmt = pg_insert(Bank).values(
                        name=record['name'],
                        bik=record['bik'],
                        correspondent_account=record['correspondent_account']
                    ).on_conflict_do_update(
                        index_elements=['bik'],
                        set_={
                            'name': record['name'],
                            'correspondent_account': record['correspondent_account']
                        }
                    )

                    await db.execute(stmt)

                    if record['bik'] in existing_biks:
                        updated += 1
                    else:
                        created += 1
                        existing_biks.add(record['bik'])

                except Exception as e:
                    errors.append(f"Error processing BIK {record['bik']}: {str(e)}")

            await db.commit()

            return CBRImportResult(
                success=True,
                total_processed=len(records),
                created=created,
                updated=updated,
                errors=len(errors),
                error_messages=errors[:10],
                import_date=datetime.utcnow()
            )

        except httpx.HTTPError as e:
            return CBRImportResult(
                success=False,
                total_processed=0,
                created=0,
                updated=0,
                errors=1,
                error_messages=[f"HTTP error fetching CBR data: {str(e)}"],
                import_date=datetime.utcnow()
            )
        except Exception as e:
            await db.rollback()
            return CBRImportResult(
                success=False,
                total_processed=0,
                created=0,
                updated=0,
                errors=1,
                error_messages=[f"Import failed: {str(e)}"],
                import_date=datetime.utcnow()
            )
