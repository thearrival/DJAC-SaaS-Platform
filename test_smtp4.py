import smtplib
import ssl

# Try with the .env credentials first to verify SMTP server works
test_cases = [
    ('cn.ismail@yalla-hack.net', 'Asd@0503938532'),
    ('hello@yalla-hack.com', '?e6gH?J7@t'),
]

for user, pwd in test_cases:
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.hostinger.com', 465, timeout=8, context=context) as server:
            server.ehlo_or_helo_if_needed()
            try:
                server.login(user, pwd)
                print(f'SUCCESS: {user} logged in')
            except Exception as e:
                print(f'FAIL {user}: {e}')
    except Exception as e:
        print(f'CONN FAIL {user}: {type(e).__name__}: {e}')

# Also try with explicit AUTH mechanisms
user, pwd = 'cn.ismail@yalla-hack.net', 'Asd@0503938532'
try:
    with smtplib.SMTP('smtp.hostinger.com', 587, timeout=8) as server:
        server.ehlo_or_helo_if_needed()
        server.starttls(context=ssl.create_default_context())
        server.ehlo_or_helo_if_needed()
        try:
            server.login(user, pwd)
            print(f'SUCCESS (587 STARTTLS): {user}')
        except Exception as e:
            print(f'FAIL (587): {user}: {e}')
except Exception as e:
    print(f'CONN FAIL (587): {type(e).__name__}: {e}')