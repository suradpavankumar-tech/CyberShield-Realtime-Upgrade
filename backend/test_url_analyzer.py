from pprint import pprint

from app.intelligence.url_analyzer import analyze_url


test_urls = [
    "https://www.google.com",
    "https://secure-bank-login.example.xyz/verify/account",
    "http://192.168.1.100/login",
    "https://bit.ly/3Example",
]


for url in test_urls:

    print("\n" + "=" * 80)

    print(f"URL: {url}")

    result = analyze_url(url)

    print(
        f"Risk: {result.rule_score}/100"
    )

    print(
        f"Level: {result.risk_level}"
    )

    print(
        f"Hostname: {result.hostname}"
    )

    print("\nFeatures:")

    pprint(
        result.features
    )

    print("\nIndicators:")

    for indicator in result.indicators:

        print(
            f"- [{indicator.severity}] "
            f"{indicator.name}: "
            f"{indicator.description} "
            f"(+{indicator.score})"
        )