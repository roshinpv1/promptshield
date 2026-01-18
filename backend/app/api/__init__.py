"""API routes"""

from fastapi import APIRouter
from app.api.endpoints import llm_configs, pipelines, executions, results, reports

api_router = APIRouter()

api_router.include_router(llm_configs.router, prefix="/llm-configs", tags=["LLM Configs"])
api_router.include_router(pipelines.router, prefix="/pipelines", tags=["Pipelines"])
api_router.include_router(executions.router, prefix="/executions", tags=["Executions"])
api_router.include_router(results.router, prefix="/results", tags=["Results"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])

