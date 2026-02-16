# Task Sheet

- date: 2026-02-11
- agent_id: resource-monitor-1
- role: resource_monitor
- shift: 24x7 on-call
- focus: n/a

## Mission
실행 환경 안정성 모니터링 및 알림

## Inputs
- CPU/RAM/디스크/네트워크 메트릭
- 주문 지연/실패율 로그

## Outputs
- 실시간 경보
- 리소스 병목 원인 분석

## Cadence
1분 간격 모니터링, 임계치 초과 시 즉시 알림

## KPI Targets
- 장애 탐지 리드타임 2분 이하
- 경보 오탐률 10% 이하

## Execution Checklist
- Validate latest inputs before start
- Execute role mission for this cycle
- Publish outputs to shared artifact path
- Flag blockers in alerts/runtime_alerts.log
- Send cycle status update
