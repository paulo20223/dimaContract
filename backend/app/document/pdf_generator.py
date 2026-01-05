import subprocess
import tempfile
from pathlib import Path


def generate_pdf_document(contract) -> bytes:
    """Generate PDF by converting Word document via LibreOffice."""
    from .generator import generate_contract_document

    docx_bytes = generate_contract_document(contract)

    with tempfile.TemporaryDirectory() as tmpdir:
        docx_path = Path(tmpdir) / "contract.docx"
        pdf_path = Path(tmpdir) / "contract.pdf"

        docx_path.write_bytes(docx_bytes)

        subprocess.run([
            "libreoffice", "--headless", "--convert-to", "pdf",
            "--outdir", tmpdir, str(docx_path)
        ], check=True, capture_output=True)

        return pdf_path.read_bytes()
