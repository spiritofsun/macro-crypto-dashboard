# Mode A (무료 안정형) Worker

이 Worker는 `/api/live` 단일 엔드포인트로 핵심 가격을 60초 캐시하여 제공합니다.

## 목적
- 브라우저가 외부 API를 직접 두드리지 않도록 차단
- 무료 한도 내에서 분단위 업데이트 유지
- BTC/ETH/SOL 가격은 Binance 24h ticker를 우선 사용하고, 실패 시 CoinGecko로 폴백

## 배포
1. Cloudflare Workers에 `workers/mode-a-gateway.js` 업로드
2. 배포 URL 확인 (예: `https://project-mark-gateway.workers.dev`)
3. 대시보드에서 아래 전역 변수 설정 가능

```html
<script>
  window.PROJECT_MARK_API_BASE = "https://project-mark-gateway.workers.dev";
</script>
```

## 폴링 주기 (Mode A)
- 홈: 60초
- 크립토: 90초
- 주식/매크로: 10분
- 기타: 5분

## 참고
- Worker 미설정 시 프론트는 직접 API 폴백으로 동작합니다.
- 백그라운드 탭에서는 폴링이 중지됩니다.
- 도미넌스(BTC.D/ETH.D)는 TradingView 직접 API 대신 CoinGecko global 지표를 사용합니다.
