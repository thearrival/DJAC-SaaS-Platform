import smtplib
import ssl
import socket

sender = 'cn.ismail@yalla-hack.net'
password = 'Asd@0503938532'

# Test quick port scan with very short timeout
targets = [
    ('179.61.189.49', 25),
    ('179.61.189.49', 465),
    ('179.61.189.49', 587),
    ('179.61.189.49', 2525),
]

for host, port in targets:
    try:
        s = socket.create_connection((host, port), timeout=3)
        data = s.recv(1024).decode('utf-8', errors='replace').strip()
        print(f'{host}:{port} -> OPEN: {data[:80]}')
        s.close()
    except Exception as e:
        print(f'{host}:{port} -> {type(e).__name__}: {str(e)[:60]}')