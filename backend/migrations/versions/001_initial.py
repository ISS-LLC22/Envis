"""Initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-05-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE domaineumum AS ENUM ('meteorology','hydrology','air_quality','wildfire','public_health','infrastructure','agriculture','multi_domain')")
    op.execute("CREATE TYPE hitmssenum AS ENUM ('hit','miss','partial','pending')")

    op.create_table(
        'is_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('domain', sa.Enum('meteorology','hydrology','air_quality','wildfire','public_health','infrastructure','agriculture','multi_domain', name='domainenum'), nullable=False),
        sa.Column('timestamp_issued', sa.DateTime(), nullable=False),
        sa.Column('prediction', sa.Text(), nullable=False),
        sa.Column('data_sources', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('uncertainty_band', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('missing_data_flags', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('era_stratum', sa.String(length=64), nullable=True),
        sa.Column('stakeholder_outputs', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('observed_outcome', sa.Text(), nullable=True),
        sa.Column('hit_miss', sa.Enum('hit','miss','partial','pending', name='hitmissenum'), nullable=True),
        sa.Column('brier_score', sa.Float(), nullable=True),
        sa.Column('gap_flags_post', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('learning_delta', sa.Float(), nullable=True),
        sa.Column('cross_domain_chain', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_is_log_domain', 'is_log', ['domain'])
    op.create_index('ix_is_log_timestamp_issued', 'is_log', ['timestamp_issued'])
    op.create_index('ix_is_log_id', 'is_log', ['id'])

    op.create_table(
        'nws_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('alert_id', sa.String(length=256), nullable=False),
        sa.Column('event', sa.String(length=128), nullable=False),
        sa.Column('headline', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('instruction', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=32), nullable=True),
        sa.Column('urgency', sa.String(length=32), nullable=True),
        sa.Column('certainty', sa.String(length=32), nullable=True),
        sa.Column('area_desc', sa.Text(), nullable=True),
        sa.Column('effective', sa.DateTime(), nullable=True),
        sa.Column('expires', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=True),
        sa.Column('raw_json', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('ingested_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('alert_id'),
    )
    op.create_index('ix_nws_alerts_alert_id', 'nws_alerts', ['alert_id'])
    op.create_index('ix_nws_alerts_id', 'nws_alerts', ['id'])


def downgrade() -> None:
    op.drop_table('nws_alerts')
    op.drop_table('is_log')
    op.execute("DROP TYPE IF EXISTS hitmissenum")
    op.execute("DROP TYPE IF EXISTS domainenum")
