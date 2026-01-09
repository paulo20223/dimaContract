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


def generate_invoice_pdf(contract) -> bytes:
    """Generate PDF by converting Excel invoice via LibreOffice."""
    from .invoice_generator import generate_invoice

    xlsx_bytes = generate_invoice(contract)

    with tempfile.TemporaryDirectory() as tmpdir:
        xlsx_path = Path(tmpdir) / "invoice.xlsx"

        xlsx_path.write_bytes(xlsx_bytes)

        result = subprocess.run([
            "libreoffice", "--headless", "--convert-to", "pdf",
            "--outdir", tmpdir, str(xlsx_path)
        ], capture_output=True, text=True)

        if result.returncode != 0:
            raise RuntimeError(
                f"LibreOffice conversion failed: {result.stderr or result.stdout}"
            )

        # Find the generated PDF (LibreOffice may name it differently)
        pdf_files = list(Path(tmpdir).glob("*.pdf"))
        if not pdf_files:
            raise FileNotFoundError(
                f"PDF not generated. LibreOffice output: {result.stdout} {result.stderr}"
            )

        return pdf_files[0].read_bytes()
