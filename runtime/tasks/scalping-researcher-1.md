# Task Sheet

- date: 2026-02-11
- agent_id: scalping-researcher-1
- role: scalping_researcher
- shift: 09:00-18:00
- focus: 모멘텀 브레이크아웃

## Mission
신규 스캘핑 아이디어 발굴 및 후보 전략 생성

## Inputs
- 틱/1분봉 가격 데이터
- 거래량/호가 스냅샷
- 전일 성과 리포트

## Outputs
- 전략 가설 문서
- 후보 파라미터 세트
- 위험 가정(손절/익절 규칙)

## Cadence
매 30분 아이디어 업데이트, 하루 3회 후보 제출

## KPI Targets
- 제출 후보 중 백테스트 통과율 30% 이상
- 중복 전략 비율 20% 이하

## Execution Checklist
- Validate latest inputs before start
- Execute role mission for this cycle
- Publish outputs to shared artifact path
- Flag blockers in alerts/runtime_alerts.log
- Send cycle status update
