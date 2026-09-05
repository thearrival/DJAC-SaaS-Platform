import smtplib
import ssl

smtp_host = 'smtp.hostinger.com'
smtp_port = 465
sender = 'cn.ismail@yalla-hack.net'
password = 'Asd@0503938532'

try:
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10, context=context) as server:
        server.ehlo_or_helo_if_needed()
        server.login(sender, password)
        print('SUCCESS: Connected and logged in to smtp.hostinger.com:465')
except Exception as e:
    print(f'FAILED smtp.hostinger.com:465: {type(e).__name__}: {e}')

try:
    with smtplib.SMTP(smtp_host, 587, timeout=10) as server:
        server.ehlo_or_helo_if_needed()
        server.starttls(context=ssl.create_default_context())
        server.ehlo_or_helo_if_needed()
        server.login(sender, password)
        print('SUCCESS: Connected and logged in to smtp.hostinger.com:587 with STARTTLS')
except Exception as e:
    print(f'FAILED smtp.hostinger.com:587: {type(e).__name__}: {e}')