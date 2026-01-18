"""
Report generation endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.db.models import Execution, Result
from app.services.report_generator import ReportGenerator

router = APIRouter()


@router.get("/execution/{execution_id}/json")
async def generate_json_report(execution_id: int, db: Session = Depends(get_db)):
    """Generate JSON report for an execution"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    results = db.query(Result).filter(Result.execution_id == execution_id).all()
    
    report = ReportGenerator.generate_json(execution, results)
    return JSONResponse(content=report)


@router.get("/execution/{execution_id}/html")
async def generate_html_report(execution_id: int, db: Session = Depends(get_db)):
    """Generate HTML report for an execution"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    results = db.query(Result).filter(Result.execution_id == execution_id).all()
    
    html_content = ReportGenerator.generate_html(execution, results)
    
    from fastapi.responses import Response
    return Response(content=html_content, media_type="text/html")


@router.get("/execution/{execution_id}/pdf")
async def generate_pdf_report(execution_id: int, db: Session = Depends(get_db)):
    """Generate PDF report for an execution"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    results = db.query(Result).filter(Result.execution_id == execution_id).all()
    
    pdf_path = ReportGenerator.generate_pdf(execution, results)
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"promptshield_report_{execution_id}.pdf"
    )

