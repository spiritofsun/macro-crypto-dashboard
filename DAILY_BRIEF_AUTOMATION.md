# Daily Macro Brief Automation

## What this sets up
- `scripts/daily_macro_brief.py`: builds a daily macro + crypto markdown brief.
- `scripts/install_daily_brief_launchd.sh`: registers a macOS `launchd` job to run daily at `09:27` (Asia/Seoul).

## Output files
- `/Users/jongmin/Documents/New project/reports/daily_auto_briefing_YYYY-MM-DD.md`
- `/Users/jongmin/Documents/New project/reports/daily_auto_briefing_latest.md`

## Manual run
```bash
python3 /Users/jongmin/Documents/New project/scripts/daily_macro_brief.py \
  --output-dir /Users/jongmin/Documents/New project/reports \
  --timezone Asia/Seoul
```

## Install auto-run (macOS)
```bash
bash /Users/jongmin/Documents/New project/scripts/install_daily_brief_launchd.sh
```

## Check status
```bash
launchctl list | rg projectmark.daily.macrobrief
tail -n 80 /Users/jongmin/Documents/New project/runtime/daily_brief_stdout.log
tail -n 80 /Users/jongmin/Documents/New project/runtime/daily_brief_stderr.log
```
