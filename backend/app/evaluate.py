"""Reproducible offline task/control evaluation; does not benchmark LLM factuality."""
import json
import time
from pathlib import Path
from app.services.investigation_engine import demo_brief, validate_brief


def main():
    root = Path(__file__).resolve().parents[2]
    results = []
    for line in (root / "evaluation/cases.jsonl").read_text().splitlines():
        item = json.loads(line)
        snapshot = {"hard_decision": item["decision"], "evidence_score": item["score"], "evidence": [{"id": "case-input", "text": "Synthetic facts"}, {"id": "policy-active", "text": item.get("policy", "Deterministic policy snapshot")} ]}
        started = time.perf_counter()
        brief = validate_brief(demo_brief(snapshot), snapshot)
        results.append({"name": item["name"], "passed": brief.proposed_action == item["expected"], "expected": item["expected"], "actual": brief.proposed_action, "citation_validation": "passed", "latency_ms": round((time.perf_counter()-started)*1000, 3), "tokens": 0})
    report = {"provider": "offline-demo", "scope": "Deterministic task routing and citation integrity, not semantic factuality or live model quality", "passed": sum(r["passed"] for r in results), "total": len(results), "results": results}
    output = root / ".local/evaluation.json"
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(report, indent=2))
    print(f"{report['passed']}/{report['total']} offline evaluation scenarios passed. Report: {output}")
    if report["passed"] != report["total"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
