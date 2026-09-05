import smtplib
import ssl

sender = 'cn.ismail@yalla-hack.net'
password = 'Asd@0503938532'

# Quick test with short timeout
try:
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL('smtp.hostinger.com', 465, timeout=5, context=context) as server:
        server.ehlo_or_helo_if_needed()
        print('Connected to smtp.hostinger.com:465')
        try:
            server.login(sender, password)
            print('LOGIN SUCCESS')
        except Exception as e:
            print(f'LOGIN FAILED: {e}')
except Exception as e:
    print(f'FAILED: {type(e).__name__}: {e}')