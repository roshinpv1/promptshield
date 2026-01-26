"""add drift detection tables

Revision ID: 001_add_drift_detection
Revises: 
Create Date: 2024-12-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '001_add_drift_detection'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create baselines table
    op.create_table(
        'baselines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('execution_id', sa.Integer(), nullable=False),
        sa.Column('pipeline_id', sa.Integer(), nullable=False),
        sa.Column('llm_config_id', sa.Integer(), nullable=False),
        sa.Column('baseline_tag', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['execution_id'], ['executions.id'], ),
        sa.ForeignKeyConstraint(['pipeline_id'], ['pipelines.id'], ),
        sa.ForeignKeyConstraint(['llm_config_id'], ['llm_configs.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_baseline_execution', 'baselines', ['execution_id'], unique=False)
    op.create_index('idx_baseline_tag', 'baselines', ['baseline_tag'], unique=False)
    op.create_index(op.f('ix_baselines_id'), 'baselines', ['id'], unique=False)

    # Create embeddings table
    op.create_table(
        'embeddings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('result_id', sa.Integer(), nullable=False),
        sa.Column('execution_id', sa.Integer(), nullable=False),
        sa.Column('embedding_vector', sa.JSON(), nullable=False),
        sa.Column('model_name', sa.String(), nullable=False, server_default='all-MiniLM-L6-v2'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['execution_id'], ['executions.id'], ),
        sa.ForeignKeyConstraint(['result_id'], ['results.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_embedding_result', 'embeddings', ['result_id'], unique=False)
    op.create_index('idx_embedding_execution', 'embeddings', ['execution_id'], unique=False)
    op.create_index(op.f('ix_embeddings_id'), 'embeddings', ['id'], unique=False)

    # Create drift_results table
    op.create_table(
        'drift_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('execution_id', sa.Integer(), nullable=False),
        sa.Column('baseline_execution_id', sa.Integer(), nullable=False),
        sa.Column('drift_type', sa.String(), nullable=False),
        sa.Column('metric', sa.String(), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('threshold', sa.Float(), nullable=False),
        sa.Column('severity', sa.String(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['baseline_execution_id'], ['executions.id'], ),
        sa.ForeignKeyConstraint(['execution_id'], ['executions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_drift_execution', 'drift_results', ['execution_id'], unique=False)
    op.create_index('idx_drift_baseline', 'drift_results', ['baseline_execution_id'], unique=False)
    op.create_index('idx_drift_type', 'drift_results', ['drift_type'], unique=False)
    op.create_index(op.f('ix_drift_results_id'), 'drift_results', ['id'], unique=False)

    # Create agent_traces table
    op.create_table(
        'agent_traces',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('execution_id', sa.Integer(), nullable=False),
        sa.Column('result_id', sa.Integer(), nullable=True),
        sa.Column('step', sa.Integer(), nullable=False),
        sa.Column('action_type', sa.String(), nullable=False),
        sa.Column('tool_name', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('trace_metadata', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['execution_id'], ['executions.id'], ),
        sa.ForeignKeyConstraint(['result_id'], ['results.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_trace_execution', 'agent_traces', ['execution_id'], unique=False)
    op.create_index('idx_trace_step', 'agent_traces', ['step'], unique=False)
    op.create_index(op.f('ix_agent_traces_id'), 'agent_traces', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_agent_traces_id'), table_name='agent_traces')
    op.drop_index('idx_trace_step', table_name='agent_traces')
    op.drop_index('idx_trace_execution', table_name='agent_traces')
    op.drop_table('agent_traces')
    
    op.drop_index(op.f('ix_drift_results_id'), table_name='drift_results')
    op.drop_index('idx_drift_type', table_name='drift_results')
    op.drop_index('idx_drift_baseline', table_name='drift_results')
    op.drop_index('idx_drift_execution', table_name='drift_results')
    op.drop_table('drift_results')
    
    op.drop_index(op.f('ix_embeddings_id'), table_name='embeddings')
    op.drop_index('idx_embedding_execution', table_name='embeddings')
    op.drop_index('idx_embedding_result', table_name='embeddings')
    op.drop_table('embeddings')
    
    op.drop_index(op.f('ix_baselines_id'), table_name='baselines')
    op.drop_index('idx_baseline_tag', table_name='baselines')
    op.drop_index('idx_baseline_execution', table_name='baselines')
    op.drop_table('baselines')
