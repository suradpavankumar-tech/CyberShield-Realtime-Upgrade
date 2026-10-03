from ml.email.parser import parse_email

email = """From: security@example.com
To: user@example.com
Subject: Urgent account verification

URGENT! Your bank account will be permanently blocked today.
Please verify your KYC immediately.

[https://secure-bank-login.example.xyz/verify/account](https://secure-bank-login.example.xyz/verify/account)
"""

result = parse_email(email)

print("EXTRACTED URLS:")
print(result["urls"])