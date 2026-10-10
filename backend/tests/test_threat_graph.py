from app.intelligence.threat_graph import generate_threat_graph_for_target


def test_threat_graph_generation_contract():
    url = "https://secure-sbi-login.fraudulent-portal.xyz/verify-kyc"
    graph = generate_threat_graph_for_target(url)

    assert "nodes" in graph
    assert "edges" in graph
    assert graph["node_count"] == len(graph["nodes"])
    assert graph["edge_count"] == len(graph["edges"])
    assert graph["node_count"] >= 4

    node_types = {n["type"] for n in graph["nodes"]}
    assert "URL" in node_types
    assert "DOMAIN" in node_types
    assert "IP_ADDRESS" in node_types
    assert "SSL_CERTIFICATE" in node_types
    # Since "sbi" is in url, should identify brand
    assert "TARGET_BRAND" in node_types


def test_threat_graph_clean_domain():
    url = "https://example.com"
    graph = generate_threat_graph_for_target(url)
    assert graph["node_count"] >= 3
    url_node = next(n for n in graph["nodes"] if n["type"] == "URL")
    assert url_node["id"].startswith("url:")
