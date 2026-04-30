def micro_candidates_from_rows(rows, top_n=6):
    agg = {}
    for r in rows:
        micro = (r.get("secao_micro") or "").strip()
        if not micro:
            continue
        agg.setdefault(micro, {"secao_micro": micro, "hits": 0, "score_sum": 0.0})
        agg[micro]["hits"] += 1
        agg[micro]["score_sum"] += float(r.get("score") or 0.0)

    out = []
    for micro, v in agg.items():
        out.append({
            "secao_micro": micro,
            "hits": v["hits"],
            "avg_score": v["score_sum"] / max(1, v["hits"]),
        })

    out.sort(key=lambda x: (x["avg_score"], x["hits"]), reverse=True)
    return out[:top_n]
