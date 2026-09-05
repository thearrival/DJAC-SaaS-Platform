import smtplib
import ssl

sender_auth = 'hello@yalla-hack.com'
password = '?e6gH?J7@t'

# Test sending with hello@yalla-hack.com but FROM cn.ismail@yalla-hack.net
test_to = 'support@yalla-hack.net'
test_subject = 'Test Email'
test_body = 'This is a test email.'

try:
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL('smtp.hostinger.com', 465, timeout=10, context=context) as server:
        server.ehlo_or_helo_if_needed()
        server.login(sender_auth, password)
        print(f'Logged in as {sender_auth}')
        
        # Try sending with FROM as cn.ismail@yalla-hack.net
        message = f'Subject: {test_subject}\nFrom: cn.ismail@yalla-hack.net\nTo: {test_to}\n\n{test_body}'
        server.sendmail('cn.ismail@yalla-hack.net', [test_to], message)
        print('SUCCESS: Sent with FROM cn.ismail@yalla-hack.net')
except Exception as e:
    print(f'FAILED with cn.ismail@yalla-hack.net FROM: {type(e).__name__}: {e}')

# Try with hello@yalla-hack.com as FROM
try:
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL('smtp.hostinger.com', 465, timeout=10, context=context) as server:
        server.ehlo_or_helo_if_needed()
        server.login(sender_auth, password)
        message = f'Subject: {test_subject}\nFrom: {sender_auth}\nTo: {test_to}\n\n{test_body}'
        server.sendmail(sender_auth, [test_to], message)
        print(f'SUCCESS: Sent with FROM {sender_auth}')
except Exception as e:
    print(f'FAILED with hello@yalla-hack.com FROM: {type(e).__name__}: {e}')