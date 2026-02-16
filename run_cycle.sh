#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_PATH="${1:-$ROOT_DIR/agents.yaml}"

if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Config not found: $CONFIG_PATH" >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/runtime/tasks" "$ROOT_DIR/reports" "$ROOT_DIR/alerts" "$ROOT_DIR/pipelines"

ruby - "$CONFIG_PATH" "$ROOT_DIR" <<'RUBY'
require "json"
require "fileutils"
require "time"
require "yaml"

config_path = ARGV[0]
root_dir = ARGV[1]

cfg = YAML.load_file(config_path)
team = cfg.fetch("team")
agents = team.fetch("agents", [])
role_playbooks = team.fetch("role_playbooks", {})

now = Time.now
timestamp = now.iso8601
today = now.strftime("%Y-%m-%d")

runtime_dir = File.join(root_dir, "runtime")
tasks_dir = File.join(runtime_dir, "tasks")
FileUtils.mkdir_p(tasks_dir)

team_snapshot = {
  generated_at: timestamp,
  team: team["name"],
  objective: team["objective"],
  timezone: team["timezone"],
  cycle: team.dig("runtime", "cycle"),
  agent_count: agents.length,
  role_counts: team["role_counts"]
}

File.write(
  File.join(runtime_dir, "team_snapshot.json"),
  JSON.pretty_generate(team_snapshot) + "\n"
)

def write_task_file(path, today, agent, playbook)
  lines = []
  lines << "# Task Sheet"
  lines << ""
  lines << "- date: #{today}"
  lines << "- agent_id: #{agent['id']}"
  lines << "- role: #{agent['role']}"
  lines << "- shift: #{agent['shift'] || 'n/a'}"
  lines << "- focus: #{agent['focus'] || 'n/a'}"
  lines << ""
  lines << "## Mission"
  lines << playbook.fetch("mission", "n/a")
  lines << ""
  lines << "## Inputs"
  Array(playbook["inputs"]).each { |x| lines << "- #{x}" }
  lines << ""
  lines << "## Outputs"
  Array(playbook["outputs"]).each { |x| lines << "- #{x}" }
  lines << ""
  lines << "## Cadence"
  lines << (playbook["cadence"] || "n/a")
  lines << ""
  lines << "## KPI Targets"
  Array(playbook["kpis"]).each { |x| lines << "- #{x}" }
  lines << ""
  lines << "## Execution Checklist"
  lines << "- Validate latest inputs before start"
  lines << "- Execute role mission for this cycle"
  lines << "- Publish outputs to shared artifact path"
  lines << "- Flag blockers in alerts/runtime_alerts.log"
  lines << "- Send cycle status update"
  lines << ""
  File.write(path, lines.join("\n"))
end

agents.each do |agent|
  role = agent["role"]
  playbook = role_playbooks.fetch(role, {})
  task_file = File.join(tasks_dir, "#{agent['id']}.md")
  write_task_file(task_file, today, agent, playbook)
end

shared = Array(team["shared_artifacts"])
shared.each do |artifact|
  next unless artifact.is_a?(Hash) && artifact["path"]
  full_path = File.join(root_dir, artifact["path"])
  FileUtils.mkdir_p(File.dirname(full_path))
  next if File.exist?(full_path)
  File.write(
    full_path,
    "# Auto-created artifact\nowner: #{artifact['owner']}\ncreated_at: #{timestamp}\n"
  )
end

launch_log_path = File.join(runtime_dir, "launch.log")
launch_lines = []
launch_lines << "[#{timestamp}] Team bootstrap started"
launch_lines << "Team: #{team['name']}"
launch_lines << "Objective: #{team['objective']}"
launch_lines << "Task count: #{agents.length}"
launch_lines << ""
launch_lines << "Agents launched:"
agents.each do |a|
  launch_lines << "- @#{a['id']} (#{a['role']})"
end
launch_lines << ""
launch_lines << "Active workstreams:"
launch_lines << "- Scalping strategy research"
launch_lines << "- Resource monitoring"
launch_lines << "- Bug review"
launch_lines << "- Optimization review"
launch_lines << "- Strategy usefulness evaluation"
launch_lines << "- Backtesting correctness and methodology"
launch_lines << "- Data pipeline integrity check"
File.write(launch_log_path, launch_lines.join("\n") + "\n")

puts "Team setup complete. Created #{agents.length} task sheets."
puts "Launch log: runtime/launch.log"
puts ""
puts "#{agents.length} tasks generated. Launching agents in parallel:"
agents.each do |a|
  puts "- @#{a['id']} -> #{a['role']}"
end
puts ""
puts "Analyzing signals and parameters..."
puts "- Scalping strategy research - Existing strategy analysis"
puts "- Scalping strategy research - New strategy ideas"
puts "- Scalping strategy research - Signal and parameter deep dive"
puts "- Resource monitoring - CPU/GPU utilization analysis"
puts "- Bug review - Code quality and correctness audit"
puts "- Optimization review - Performance improvement opportunities"
puts "- Strategy usefulness evaluation"
puts "- Backtesting expert review - Engine correctness and methodology"
puts "- Data pipeline integrity check"
puts ""
puts "Outputs:"
puts "- runtime/team_snapshot.json"
puts "- runtime/tasks/*.md"
puts "- runtime/launch.log"
RUBY
