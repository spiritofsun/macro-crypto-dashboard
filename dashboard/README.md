# Macro & Crypto Dashboard

## 로컬 실행
```bash
cd /Users/jongmin/Documents/New\ project/dashboard
python3 -m http.server 8080
```
브라우저에서 `http://localhost:8080` 접속.

## 무료 웹사이트 배포 (GitHub Pages)
1. 이 저장소를 GitHub 원격으로 push
2. GitHub 저장소 > `Settings` > `Pages` > Source를 `GitHub Actions`로 설정
3. `Actions` 탭에서 아래 워크플로가 자동 실행됨
   - `.github/workflows/deploy-dashboard-pages.yml`
   - `.github/workflows/update-dashboard-data.yml`

배포 후 URL 예시:
- `https://<github-username>.github.io/<repo-name>/`

## 자동 업데이트 정책
- 뉴스: 4시간마다 자동 갱신 (`dashboard/data/news.json`)
- ETF 유입: 매일 12:00 KST 자동 갱신 (`dashboard/data/etf.json`)
- 크립토 시총/실시간 가격: 브라우저에서 60초마다 실시간 API 조회

## 수동 데이터 편집
- `/Users/jongmin/Documents/New project/dashboard/data/snapshot.json`
  - S&P500, NASDAQ, KOSPI, KOSDAQ
  - Gold, Silver, Copper
