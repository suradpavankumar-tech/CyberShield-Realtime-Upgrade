from app.intelligence.domain_intelligence import (
    analyze_domain,
)


def main():

    urls = [

        "https://github.com",

        "https://google.com",

        "https://www.microsoft.com",

        "https://secure-bank-login.example.xyz/verify/account",

        "https://paypal-account-verification.example.xyz/login",

    ]

    for url in urls:

        result = analyze_domain(
            url
        )

        print("\n" + "=" * 80)

        print(
            f"URL: {url}"
        )

        print(
            f"Registered domain: "
            f"{result.domain}"
        )

        print(
            f"Known trusted: "
            f"{result.known_trusted}"
        )

        print(
            f"Brand match: "
            f"{result.brand_match}"
        )

        print(
            f"Trusted source: "
            f"{result.trusted_source}"
        )

        print(
            "Notes:"
        )

        for note in result.notes:

            print(
                f"- {note}"
            )


if __name__ == "__main__":

    main()