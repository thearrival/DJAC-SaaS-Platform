import smtplib
import ssl
import socket

sender = 'cn.ismail@yalla-hack.net'
password = 'Asd@0503938532'

# Try direct IP and various ports
targets = [
    ('179.61.189.49', 25, False),
    ('179.61.189.49', 465, True),
    ('179.61.189.49', 587, False),
    ('yalla-hack.net', 25, False),
    ('yalla-hack.net', 465, True),
    ('yalla-hack.net', 587, False),
    ('smtp.hostinger.com', 465, True),
]

for host, port, use_ssl in targets:
    try:
        if use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, timeout=8, context=context) as server:
                server.ehlo_or_helo_if_needed()
                print(f'{host}:{port} (SSL) -> Connected. Banner: {server.helo()[1][:60]}')
                try:
                    server.login(sender, password)
                    print(f'  -> LOGIN SUCCESS')
                except smtplib.SMTPAuthenticationError as e:
                    print(f'  -> LOGIN FAILED: {e.smtp_code} {e.smtp_error.decode()[:80]}')
                except Exception as e:
                    print(f'  -> LOGIN ERROR: {type(e).__name__}: {str(e)[:80]}')
        else:
            with smtplib.SMTP(host, port, timeout=8) as server:
                server.ehlo_or_helo_if_needed()
                print(f'{host}:{port} -> Connected. Banner: {server.helo()[1][:60]}')
                try:
                    server.starttls(context=ssl.create_default_context())
                    server.ehlo_or_helo_if_needed()
                    try:
                        server.login(sender, password)
                        print(f'  -> LOGIN SUCCESS (STARTTLS)')
                    except smtplib.SMTPAuthenticationError as e:
                        print(f'  -> LOGIN FAILED: {e.smtp_code} {e.smtp_error.decode()[:80]}')
                except Exception as e2:
                    print(f'  -> STARTTLS/LOGIN ERROR: {type(e2).__name__}: {str(e2)[:80]}')
    except Exception as e:
        print(f'{host}:{port} -> {type(e).__name__}: {str(e)[:100]}')