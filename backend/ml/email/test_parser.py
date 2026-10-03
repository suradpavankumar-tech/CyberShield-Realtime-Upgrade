from pprint import pprint

from ml.email.parser import parse_email


RAW_EMAIL = """\
From: security@example.com
To: user@example.com
Subject: Urgent account verification

URGENT! Your bank account will be permanently
blocked today. Verify your KYC immediately.

https://secure-bank-login.example.xyz/verify/account
"""


def main():

    result = parse_email(
        RAW_EMAIL
    )

    print("=" * 80)
    print("CYBERSHIELD — EMAIL PARSER")
    print("=" * 80)

    pprint(
        result
    )


if __name__ == "__main__":
    main()