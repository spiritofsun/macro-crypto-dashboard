# Task Sheet

- date: 2026-02-11
- agent_id: bug-hunter-1
- role: bug_hunter
- shift: 10:00-19:00
- focus: n/a

## Mission
전략 코드 및 실행 로직의 결함 조기 발견

## Inputs
- 전략 코드 변경분
- 실행/예외 로그

## Outputs
- 재현 절차
- 심각도별 버그 티켓

## Cadence
PR/배포 후보마다 검증

## KPI Targets
- 재현 가능한 버그 보고율 95% 이상
- 배포 후 치명 버그 0건

## Execution Checklist
- Validate latest inputs before start
- Execute role mission for this cycle
- Publish outputs to shared artifact path
- Flag blockers in alerts/runtime_alerts.log
- Send cycle status update
