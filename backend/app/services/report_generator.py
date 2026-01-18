"""
Report Generator - Creates JSON, HTML, and PDF reports
"""

import json
from datetime import datetime
from typing import List
from app.db.models import Execution, Result
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from jinja2 import Template


class ReportGenerator:
    """Generates reports in multiple formats"""
    
    @staticmethod
    def generate_json(execution: Execution, results: List[Result]) -> dict:
        """Generate JSON report"""
        return {
            "execution_id": execution.id,
            "pipeline_id": execution.pipeline_id,
            "status": execution.status,
            "started_at": execution.started_at.isoformat() if execution.started_at else None,
            "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
            "total_results": len(results),
            "results": [
                {
                    "id": r.id,
                    "library": r.library,
                    "test_category": r.test_category,
                    "severity": r.severity,
                    "risk_type": r.risk_type,
                    "evidence_prompt": r.evidence_prompt,
                    "evidence_response": r.evidence_response,
                    "confidence_score": r.confidence_score,
                    "metadata": r.extra_metadata,
                    "created_at": r.created_at.isoformat() if r.created_at else None
                }
                for r in results
            ]
        }
    
    @staticmethod
    def generate_html(execution: Execution, results: List[Result]) -> str:
        """Generate HTML report"""
        template_str = """
<!DOCTYPE html>
<html>
<head>
    <title>PromptShield Report - Execution {{ execution.id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #003087;
            color: white;
            padding: 20px;
            border-radius: 5px;
        }
        .summary {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .result {
            background-color: white;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #003087;
            border-radius: 5px;
        }
        .severity-critical { border-left-color: #d32f2f; }
        .severity-high { border-left-color: #f57c00; }
        .severity-medium { border-left-color: #fbc02d; }
        .severity-low { border-left-color: #388e3c; }
        .severity-info { border-left-color: #1976d2; }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-critical { background-color: #d32f2f; color: white; }
        .badge-high { background-color: #f57c00; color: white; }
        .badge-medium { background-color: #fbc02d; color: black; }
        .badge-low { background-color: #388e3c; color: white; }
        .badge-info { background-color: #1976d2; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PromptShield Validation Report</h1>
        <p>Execution ID: {{ execution.id }} | Status: {{ execution.status }}</p>
        <p>Started: {{ execution.started_at }} | Completed: {{ execution.completed_at or 'N/A' }}</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Results: {{ results|length }}</p>
        <p>Pipeline ID: {{ execution.pipeline_id }}</p>
    </div>
    
    <h2>Results</h2>
    {% for result in results %}
    <div class="result severity-{{ result.severity }}">
        <span class="badge badge-{{ result.severity }}">{{ result.severity.upper() }}</span>
        <strong>{{ result.library }}</strong> - {{ result.test_category }}
        <p><strong>Risk Type:</strong> {{ result.risk_type }}</p>
        {% if result.evidence_prompt %}
        <p><strong>Prompt:</strong> {{ result.evidence_prompt }}</p>
        {% endif %}
        {% if result.evidence_response %}
        <p><strong>Response:</strong> {{ result.evidence_response }}</p>
        {% endif %}
        {% if result.confidence_score %}
        <p><strong>Confidence:</strong> {{ "%.2f"|format(result.confidence_score) }}</p>
        {% endif %}
    </div>
    {% endfor %}
</body>
</html>
        """
        
        template = Template(template_str)
        return template.render(execution=execution, results=results)
    
    @staticmethod
    def generate_pdf(execution: Execution, results: List[Result]) -> str:
        """Generate PDF report"""
        from app.core.config import settings
        import os
        
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        pdf_path = os.path.join(settings.REPORTS_DIR, f"report_{execution.id}.pdf")
        
        doc = SimpleDocTemplate(pdf_path, pagesize=letter)
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title = Paragraph("PromptShield Validation Report", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Execution info
        info_data = [
            ["Execution ID", str(execution.id)],
            ["Pipeline ID", str(execution.pipeline_id)],
            ["Status", execution.status],
            ["Started", execution.started_at.strftime("%Y-%m-%d %H:%M:%S") if execution.started_at else "N/A"],
            ["Completed", execution.completed_at.strftime("%Y-%m-%d %H:%M:%S") if execution.completed_at else "N/A"],
            ["Total Results", str(len(results))]
        ]
        
        info_table = Table(info_data, colWidths=[200, 300])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(info_table)
        story.append(Spacer(1, 20))
        
        # Results
        story.append(Paragraph("Results", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        for result in results:
            result_text = f"""
            <b>Library:</b> {result.library}<br/>
            <b>Category:</b> {result.test_category}<br/>
            <b>Severity:</b> {result.severity}<br/>
            <b>Risk Type:</b> {result.risk_type}<br/>
            """
            if result.evidence_prompt:
                result_text += f"<b>Prompt:</b> {result.evidence_prompt}<br/>"
            if result.evidence_response:
                result_text += f"<b>Response:</b> {result.evidence_response}<br/>"
            
            story.append(Paragraph(result_text, styles['Normal']))
            story.append(Spacer(1, 12))
        
        doc.build(story)
        return pdf_path

