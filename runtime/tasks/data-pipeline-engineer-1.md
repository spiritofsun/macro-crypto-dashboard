# Task Sheet

- date: 2026-02-11
- agent_id: data-pipeline-engineer-1
- role: data_pipeline_engineer
- shift: 08:00-17:00
- focus: n/a

## Mission
시장 데이터 수집/정제/공급 파이프라인 운영

## Inputs
- 원천 거래소 데이터
- 데이터 품질 규칙

## Outputs
- 정제 데이터셋
- 품질 리포트(결측/지연/이상치)

## Cadence
실시간 수집, 10분 단위 품질 점검

## KPI Targets
- 파이프라인 가용성 99.9% 이상
- 결측률 1% 이하

## Execution Checklist
- Validate latest inputs before start
- Execute role mission for this cycle
- Publish outputs to shared artifact path
- Flag blockers in alerts/runtime_alerts.log
- Send cycle status update
