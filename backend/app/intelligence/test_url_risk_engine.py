from app.intelligence.url_risk_engine import (
    analyze_url_hybrid,
)


def main():

    urls = [

        "https://www.google.com",

        "https://github.com",

        "https://www.microsoft.com",

        "https://secure-bank-login.example.xyz/verify/account",

        "http://192.168.1.100/login",

        "https://bit.ly/3Example",

    ]

    for url in urls:

        print("\n" + "=" * 90)

        print(
            f"URL: {url}"
        )

        result = analyze_url_hybrid(
            url
        )

        print(
            f"\nML probability: "
            f"{result.ml_probability * 100:.2f}%"
        )

        print(
            f"Rule score: "
            f"{result.rule_score}/100"
        )

        print(
            f"Trusted domain: "
            f"{result.domain_trust}"
        )

        print(
            f"Brand match: "
            f"{result.brand_match}"
        )

        print(
            f"Final CyberShield score: "
            f"{result.final_score}/100"
        )

        print(
            f"Risk level: "
            f"{result.risk_level}"
        )

        print("\nIndicators:")

        for indicator in result.indicators:

            if isinstance(
                indicator,
                dict,
            ):

                print(
                    f"- [{indicator['severity']}] "
                    f"{indicator['name']}"
                )

            else:

                print(
                    f"- {indicator}"
                )


if __name__ == "__main__":

    main()